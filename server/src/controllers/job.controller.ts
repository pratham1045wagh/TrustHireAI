import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../types';
import { Job, IJob } from '../models/Job';
import { Application } from '../models/Application';
import { Assessment } from '../models/Assessment';
import { AssessmentRoom } from '../models/AssessmentRoom';
import { AssessmentGenerationService } from '../services/assessment.generation.service';
import { DocumentService } from '../services/document.service';
import { GeminiJobService } from '../services/gemini.job.service';
import { RAGService } from '../services/rag.service';
import { AuditService } from '../services/audit.service';

export class JobController {
  /**
   * Create a new Job Description (Manual fields OR PDF/DOCX upload + Gemini parsing + Vector RAG indexing)
   */
  public static async createJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      if (!recruiterId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const file = req.file;
      let jobData: Partial<IJob> = { ...req.body };

      // Parse JSON string fields if sent via FormData
      if (typeof jobData.requiredSkills === 'string') {
        try {
          jobData.requiredSkills = JSON.parse(jobData.requiredSkills as unknown as string);
        } catch (e) {
          jobData.requiredSkills = (jobData.requiredSkills as unknown as string).split(',').map((s) => s.trim());
        }
      }
      if (typeof jobData.preferredSkills === 'string') {
        try {
          jobData.preferredSkills = JSON.parse(jobData.preferredSkills as unknown as string);
        } catch (e) {
          jobData.preferredSkills = (jobData.preferredSkills as unknown as string).split(',').map((s) => s.trim());
        }
      }
      if (typeof jobData.responsibilities === 'string') {
        try {
          jobData.responsibilities = JSON.parse(jobData.responsibilities as unknown as string);
        } catch (e) {
          jobData.responsibilities = (jobData.responsibilities as unknown as string).split('\n').map((s) => s.trim());
        }
      }

      // If document file provided, extract text and structure via Gemini
      if (file) {
        try {
          const jdText = await DocumentService.extractText(file.path, file.originalname);
          const structuredJd = await GeminiJobService.structureJobDescription(jdText);

          jobData.title = jobData.title || structuredJd.jobTitle || 'Untitled Job Position';
          jobData.companyName = jobData.companyName || structuredJd.companyName || 'Tech Company';
          jobData.location = jobData.location || structuredJd.location || 'Remote / Unspecified';
          jobData.employmentType = jobData.employmentType || structuredJd.employmentType || 'Full Time';
          jobData.experienceLevel = jobData.experienceLevel || structuredJd.experienceLevel || '0-2 years';
          jobData.salaryRange = jobData.salaryRange || structuredJd.salaryRange || undefined;
          jobData.description = jobData.description || structuredJd.description || jdText.slice(0, 500);
          jobData.requiredSkills =
            jobData.requiredSkills && jobData.requiredSkills.length > 0
              ? jobData.requiredSkills
              : structuredJd.requiredSkills.length > 0
              ? structuredJd.requiredSkills
              : ['General Software Engineering'];
          jobData.preferredSkills =
            jobData.preferredSkills && jobData.preferredSkills.length > 0
              ? jobData.preferredSkills
              : structuredJd.preferredSkills;
          jobData.responsibilities =
            jobData.responsibilities && jobData.responsibilities.length > 0
              ? jobData.responsibilities
              : structuredJd.responsibilities;
          jobData.sourceFileName = file.originalname;
          jobData.sourceFilePath = file.path;
        } catch (err: any) {
          console.warn('[JD Document Parse Notice]', err.message);
        }
      }

      // Validation check
      if (!jobData.title) {
        res.status(400).json({ success: false, message: 'Job Title is required.' });
        return;
      }
      if (!jobData.companyName) {
        res.status(400).json({ success: false, message: 'Company Name is required.' });
        return;
      }
      if (!jobData.description) {
        res.status(400).json({ success: false, message: 'Job Description is required.' });
        return;
      }
      if (!jobData.requiredSkills || jobData.requiredSkills.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please add at least one required skill before publishing this job.',
        });
        return;
      }

      const job = await Job.create({
        recruiterId,
        title: jobData.title,
        companyName: jobData.companyName,
        location: jobData.location || 'Remote',
        employmentType: jobData.employmentType || 'Full Time',
        experienceLevel: jobData.experienceLevel || '0-2 years',
        salaryRange:
          typeof (jobData.salaryRange as any) === 'object' && jobData.salaryRange
            ? `$${(jobData.salaryRange as any).min || ''} - $${(jobData.salaryRange as any).max || ''} ${(jobData.salaryRange as any).currency || ''}`.trim()
            : String(jobData.salaryRange || 'Competitive'),
        description: jobData.description,
        requiredSkills: jobData.requiredSkills,
        preferredSkills: jobData.preferredSkills || [],
        educationRequirements: jobData.educationRequirements || [],
        experienceRequirements: jobData.experienceRequirements || [],
        responsibilities: jobData.responsibilities || [],
        sourceFileName: jobData.sourceFileName,
        sourceFilePath: jobData.sourceFilePath,
        status: jobData.status || 'PUBLISHED',
      });

      // Optional: Create Assessment Room for this Job
      if (req.body.createAssessmentRoom === true || req.body.createAssessmentRoom === 'true') {
        try {
          let roomConfig = req.body.assessmentRoomConfig;
          if (typeof roomConfig === 'string') {
            try {
              roomConfig = JSON.parse(roomConfig);
            } catch (e) {}
          }
          roomConfig = roomConfig || {};
          const roomTitle = roomConfig.title || req.body.assessmentRoomTitle || `${job.title} Assessment`;
          const rawTopics = roomConfig.topics || req.body.assessmentTopics || job.requiredSkills;
          const parsedTopics: string[] = Array.isArray(rawTopics)
            ? rawTopics
            : String(rawTopics).split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
          const roomQCount = Number(roomConfig.totalQuestions || req.body.assessmentQuestionsCount || 20);
          const roomDifficulty = (roomConfig.difficulty || req.body.assessmentDifficulty || 'MIXED').toUpperCase();
          const roomDuration = Number(roomConfig.durationMinutes || req.body.assessmentDurationMinutes || 45);

          const assessment = await Assessment.create({
            recruiterId,
            assessmentType: 'RECRUITER_ROOM',
            title: roomTitle,
            description: roomConfig.description || `Assessment for ${job.title}`,
            skills: parsedTopics.length > 0 ? parsedTopics : job.requiredSkills,
            totalQuestions: roomQCount,
            generatedCount: 0,
            durationMinutes: roomDuration,
            defaultDifficulty: roomDifficulty === 'MIXED' ? 'MEDIUM' : roomDifficulty,
            dynamicDifficulty: roomDifficulty === 'MIXED',
            generationMode: 'AI',
            questionSource: 'GENERATED',
            generationStatus: 'GENERATING',
            isPublic: true,
          });

          AssessmentGenerationService.generateQuestions(
            assessment._id.toString(),
            parsedTopics.length > 0 ? parsedTopics : job.requiredSkills,
            roomQCount,
            undefined,
            job.description,
            undefined,
            roomDifficulty
          ).catch((genErr) => console.warn('[Job Assessment Generation Background Warning]', genErr));

          const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
          const roomCode = `RAI-${randomSuffix}`;
          const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

          const room = await AssessmentRoom.create({
            roomCode,
            assessmentId: assessment._id,
            recruiterId,
            jobId: job._id,
            title: roomTitle,
            description: roomConfig.description || `Assessment for ${job.title}`,
            skills: parsedTopics.length > 0 ? parsedTopics : job.requiredSkills,
            difficulty: roomDifficulty,
            generationMode: 'AI',
            questionSource: 'GENERATED',
            assessmentType: 'RECRUITER_ROOM',
            durationMinutes: roomDuration,
            totalQuestions: roomQCount,
            status: 'ACTIVE',
            candidates: [],
            expiresAt,
          });

          job.assessmentRoomId = room._id as any;
          await job.save();
        } catch (roomErr: any) {
          console.warn('[Create Assessment Room on Job Notice]', roomErr.message || roomErr);
        }
      }

      // Index Job in Vector Database for RAG and semantic matching
      try {
        await RAGService.indexJob(job as any);
      } catch (ragErr) {
        console.warn('[Job Vector Index Warning]', ragErr);
      }

      // Audit Log
      await AuditService.log({
        userId: recruiterId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'JD_CREATED',
        resource: 'Job',
        resourceId: job._id.toString(),
        metadata: { title: job.title, company: job.companyName },
      });

      res.status(201).json({
        success: true,
        message: 'Job created and indexed successfully.',
        job: {
          id: job._id.toString(),
          ...job.toObject(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: List all jobs created by recruiter
   */
  public static async getRecruiterJobs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      const jobs = await Job.find({ recruiterId }).sort({ createdAt: -1 });

      const jobIds = jobs.map((j) => j._id);
      const applications = await Application.find({ jobId: { $in: jobIds } });

      const result = jobs.map((job) => {
        const jobApps = applications.filter((a) => a.jobId.toString() === job._id.toString());
        return {
          ...job.toObject(),
          id: job._id,
          applicantsCount: jobApps.length,
        };
      });

      res.status(200).json({ success: true, jobs: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Candidate: List published jobs with filtering
   */
  public static async getCandidateJobs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, location, employmentType, experienceLevel } = req.query;

      const query: any = { status: 'PUBLISHED' };

      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [
          { title: regex },
          { companyName: regex },
          { description: regex },
          { requiredSkills: regex },
        ];
      }

      if (location) {
        query.location = new RegExp(String(location), 'i');
      }

      if (employmentType) {
        query.employmentType = employmentType;
      }

      if (experienceLevel) {
        query.experienceLevel = experienceLevel;
      }

      const jobs = await Job.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        jobs: jobs.map((j) => ({
          ...j.toObject(),
          id: j._id,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single job details by ID
   */
  public static async getJobById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = await Job.findById(id);

      if (!job) {
        res.status(404).json({ success: false, message: 'Job description not found.' });
        return;
      }

      const applicantsCount = await Application.countDocuments({ jobId: id });

      res.status(200).json({
        success: true,
        job: {
          ...job.toObject(),
          id: job._id,
          applicantsCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve semantically matched candidates for a specific Job Description
   */
  public static async getSemanticCandidates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const candidates = await RAGService.searchCandidatesForJob(id, 15);

      res.status(200).json({
        success: true,
        jobId: id,
        candidates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Semantic candidate search by recruiter query string
   */
  public static async semanticSearch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.body;
      if (!query || String(query).trim().length === 0) {
        res.status(400).json({ success: false, message: 'Search query is required.' });
        return;
      }

      const candidates = await RAGService.semanticSearchCandidates(String(query).trim(), 15);

      res.status(200).json({
        success: true,
        query,
        candidates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Job Status or Details (Recruiter only)
   */
  public static async updateJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const recruiterId = req.user?.id;

      const job = await Job.findById(id);
      if (!job) {
        res.status(404).json({ success: false, message: 'Job not found.' });
        return;
      }

      if (job.recruiterId.toString() !== recruiterId && req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Unauthorized to modify this job.' });
        return;
      }

      Object.assign(job, req.body);
      await job.save();

      // Re-index in vector store
      try {
        await RAGService.indexJob(job as any);
      } catch (e) {}

      res.status(200).json({ success: true, message: 'Job updated successfully.', job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Job (Recruiter only)
   */
  public static async deleteJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const recruiterId = req.user?.id;

      const job = await Job.findById(id);
      if (!job) {
        res.status(404).json({ success: false, message: 'Job not found.' });
        return;
      }

      if (job.recruiterId.toString() !== recruiterId && req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Unauthorized to delete this job.' });
        return;
      }

      await Job.findByIdAndDelete(id);
      await Application.deleteMany({ jobId: id });

      res.status(200).json({ success: true, message: 'Job deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
