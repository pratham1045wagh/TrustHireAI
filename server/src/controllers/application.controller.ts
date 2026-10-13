import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { Resume } from '../models/Resume';
import { User } from '../models/User';
import { GeminiMatchService } from '../services/gemini.match.service';
import { SkillEvidence } from '../models/SkillEvidence';
import { VerificationReport } from '../models/VerificationReport';
import { AssessmentSession } from '../models/AssessmentSession';

export class ApplicationController {
  /**
   * Candidate applies to a job selecting an analyzed resume
   */
  public static async applyToJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const { jobId, resumeId } = req.body;

      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (req.user?.role !== 'CANDIDATE') {
        res.status(403).json({ success: false, message: 'Only candidates can apply to jobs.' });
        return;
      }

      if (!jobId || !resumeId) {
        res.status(400).json({ success: false, message: 'Job ID and Resume selection are required.' });
        return;
      }

      const job = await Job.findById(jobId);
      if (!job) {
        res.status(404).json({ success: false, message: 'Job not found.' });
        return;
      }

      if (job.status === 'CLOSED') {
        res.status(400).json({ success: false, message: 'This job is no longer accepting applications.' });
        return;
      }

      const resume = await Resume.findById(resumeId);
      if (!resume || resume.userId.toString() !== candidateId) {
        res.status(400).json({ success: false, message: 'Please select a valid analyzed resume.' });
        return;
      }

      // Duplicate application check
      const existingApp = await Application.findOne({ candidateId, jobId });
      if (existingApp) {
        res.status(409).json({ success: false, message: 'You have already applied to this job position.' });
        return;
      }

      const application = await Application.create({
        candidateId,
        recruiterId: job.recruiterId,
        jobId,
        resumeId,
        status: 'APPLIED',
        matchStatus: 'PENDING',
      });

      // Launch Gemini AI Match Analysis asynchronously in background without blocking response
      ApplicationController.runMatchAnalysis(application._id.toString(), resume, job);

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully.',
        application: {
          id: application._id,
          status: application.status,
          matchStatus: application.matchStatus,
          appliedAt: application.appliedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper to execute Gemini match analysis in background
   */
  private static async runMatchAnalysis(applicationId: string, resumeDoc: any, jobDoc: any): Promise<void> {
    try {
      if (!resumeDoc.analysis) return;

      const matchResult = await GeminiMatchService.analyzeMatch(resumeDoc.analysis, jobDoc);

      await Application.findByIdAndUpdate(applicationId, {
        matchStatus: 'COMPLETED',
        matchScore: matchResult.overallMatch,
        matchBreakdown: {
          overallMatch: matchResult.overallMatch,
          skillAlignment: matchResult.skillAlignment,
          experienceAlignment: matchResult.experienceAlignment,
          educationAlignment: matchResult.educationAlignment,
          projectRelevance: matchResult.projectRelevance,
          technologyAlignment: matchResult.technologyAlignment,
        },
        matchingSkills: matchResult.matchingSkills,
        missingRequiredSkills: matchResult.missingRequiredSkills,
        matchingProjects: matchResult.matchingProjects,
        matchExplanation: matchResult.explanation,
      });
    } catch (err: any) {
      console.error('[Async Match Analysis Warning]', err.message || err);
      await Application.findByIdAndUpdate(applicationId, {
        matchStatus: 'FAILED',
        matchExplanation: 'AI match analysis is currently unavailable.',
      });
    }
  }

  /**
   * Candidate: Get all my applications
   */
  public static async getCandidateApplications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const applications = await Application.find({ candidateId })
        .populate('jobId', 'title companyName location employmentType experienceLevel status')
        .populate('resumeId', 'originalFileName createdAt')
        .sort({ appliedAt: -1 });

      res.status(200).json({
        success: true,
        applications: applications.map((app) => ({
          id: app._id,
          job: app.jobId,
          resume: app.resumeId,
          status: app.status,
          matchStatus: app.matchStatus,
          matchScore: app.matchScore,
          matchBreakdown: app.matchBreakdown,
          appliedAt: app.appliedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Candidate: Get single application details by ID
   */
  public static async getCandidateApplicationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const candidateId = req.user?.id;

      const application = await Application.findById(id)
        .populate('jobId')
        .populate('resumeId');

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }

      if (application.candidateId.toString() !== candidateId) {
        res.status(403).json({ success: false, message: 'Unauthorized to view this application.' });
        return;
      }

      res.status(200).json({ success: true, application });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Get applicants for a job or all jobs posted by recruiter
   */
  public static async getRecruiterApplicants(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      const { jobId, starred } = req.query;

      const query: any = { recruiterId };
      if (jobId) query.jobId = jobId;
      if (starred === 'true') query.isStarred = true;

      const applications = await Application.find(query)
        .populate('candidateId', 'name email')
        .populate('jobId', 'title companyName location')
        .populate('resumeId', 'originalFileName fileSize status analysis resumeEvidenceScore assessmentPerformanceScore consistencyAlignmentScore trustScore assessmentStatus latestAssessmentSessionId')
        .sort({ appliedAt: -1 });

      res.status(200).json({
        success: true,
        applicants: applications.map((app) => {
          const resObj = app.resumeId as any;
          const resumeEvidence = resObj?.resumeEvidenceScore ?? null;
          const assessmentPerformance = resObj?.assessmentPerformanceScore ?? null;
          const consistencyAlignment = resObj?.consistencyAlignmentScore ?? null;
          const assessmentStatus = resObj?.assessmentStatus || (resObj?.assessmentPerformanceScore != null ? 'COMPLETED' : 'NOT_TAKEN');
          const trustScore = resObj?.trustScore ?? (
            assessmentStatus === 'COMPLETED' && assessmentPerformance != null
              ? Math.round((resumeEvidence || 0) * 0.3 + (assessmentPerformance || 0) * 0.5 + (consistencyAlignment || 0) * 0.2)
              : null
          );

          return {
            id: app._id,
            candidate: app.candidateId,
            job: app.jobId,
            resume: app.resumeId,
            status: app.status,
            matchStatus: app.matchStatus,
            matchScore: app.matchScore,
            trustScore,
            verificationScore: trustScore, // backward compatibility
            evidenceScore: resumeEvidence,
            resumeEvidence,
            assessmentScore: assessmentPerformance,
            assessmentPerformance,
            consistencyScore: consistencyAlignment,
            consistencyAlignment,
            assessmentStatus,
            latestSessionId: resObj?.latestAssessmentSessionId || null,
            isStarred: !!app.isStarred,
            isShortlisted: !!app.isShortlisted || app.status === 'SHORTLISTED',
            invitationStatus: app.invitationStatus || 'NOT_INVITED',
            recruiterNotes: app.recruiterNotes,
            appliedAt: app.appliedAt,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Get starred candidates
   */
  public static async getStarredCandidates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      const applications = await Application.find({ recruiterId, isStarred: true })
        .populate('candidateId', 'name email')
        .populate('jobId', 'title companyName location')
        .populate('resumeId', 'originalFileName fileSize status analysis resumeEvidenceScore assessmentPerformanceScore consistencyAlignmentScore trustScore assessmentStatus latestAssessmentSessionId')
        .sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        starred: applications.map((app) => {
          const resObj = app.resumeId as any;
          const resumeEvidence = resObj?.resumeEvidenceScore ?? null;
          const assessmentPerformance = resObj?.assessmentPerformanceScore ?? null;
          const consistencyAlignment = resObj?.consistencyAlignmentScore ?? null;
          const assessmentStatus = resObj?.assessmentStatus || (resObj?.assessmentPerformanceScore != null ? 'COMPLETED' : 'NOT_TAKEN');
          const trustScore = resObj?.trustScore ?? (
            assessmentStatus === 'COMPLETED' && assessmentPerformance != null
              ? Math.round((resumeEvidence || 0) * 0.3 + (assessmentPerformance || 0) * 0.5 + (consistencyAlignment || 0) * 0.2)
              : null
          );

          return {
            id: app._id,
            candidate: app.candidateId,
            job: app.jobId,
            resume: app.resumeId,
            status: app.status,
            matchStatus: app.matchStatus,
            matchScore: app.matchScore,
            trustScore,
            verificationScore: trustScore,
            evidenceScore: resumeEvidence,
            resumeEvidence,
            assessmentScore: assessmentPerformance,
            assessmentPerformance,
            consistencyScore: consistencyAlignment,
            consistencyAlignment,
            assessmentStatus,
            latestSessionId: resObj?.latestAssessmentSessionId || null,
            isStarred: app.isStarred,
            isShortlisted: !!app.isShortlisted || app.status === 'SHORTLISTED',
            invitationStatus: app.invitationStatus || 'NOT_INVITED',
            appliedAt: app.appliedAt,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: View full candidate profile (Enforcing Privacy Rule: Recruiter can only view if candidate applied to recruiter's job!)
   * Uses application.resumeId to load the exact submitted resume and categorizes technical skills.
   */
  public static async getCandidateProfileForRecruiter(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      const { candidateId } = req.params;
      const applicationId = req.query.applicationId as string | undefined;

      // Privacy verification check
      let application: any = null;
      if (applicationId) {
        application = await Application.findOne({ _id: applicationId, recruiterId }).populate('jobId').populate('resumeId');
      }
      if (!application) {
        application = await Application.findOne({ recruiterId, candidateId })
          .populate('jobId')
          .populate('resumeId')
          .sort({ appliedAt: -1 });
      }

      if (!application) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to view this candidate. Candidate profile access requires an active application to your posted jobs.',
        });
        return;
      }

      const candidateUser = await User.findById(candidateId).select('-passwordHash');
      const allCandidateAppsToRecruiter = await Application.find({ recruiterId, candidateId })
        .populate('jobId', 'title companyName location')
        .populate('resumeId', 'originalFileName fileSize status analysis resumeEvidenceScore assessmentPerformanceScore consistencyAlignmentScore trustScore assessmentStatus');

      const selectedResume = await Resume.findById(application.resumeId);
      const analysis: any = selectedResume?.analysis || {};
      const skillsObj = analysis.skills || {};

      const categorizedSkills = {
        programmingLanguages: skillsObj.programmingLanguages || [],
        frameworks: skillsObj.frameworks || [],
        databases: skillsObj.databases || [],
        cloud: skillsObj.cloud || [],
        tools: skillsObj.tools || [],
        libraries: skillsObj.libraries || [],
        other: skillsObj.other || [],
      };

      const resumeIdFilter = selectedResume?._id;
      let skillEvidence = await SkillEvidence.find({ candidateId, resumeId: resumeIdFilter }).sort({ confidence: -1 });
      if (skillEvidence.length === 0) {
        skillEvidence = await SkillEvidence.find({ candidateId }).sort({ confidence: -1 });
      }

      let verificationReport = await VerificationReport.findOne({ candidateId, resumeId: resumeIdFilter });
      if (!verificationReport) {
        verificationReport = await VerificationReport.findOne({ candidateId });
      }

      const assessmentSessions = await AssessmentSession.find({
        candidateId,
        $or: [
          ...(resumeIdFilter ? [{ resumeId: resumeIdFilter }] : []),
          { applicationId: application._id },
        ],
      })
        .populate('assessmentId', 'title skills durationMinutes')
        .sort({ submittedAt: -1, createdAt: -1 });

      const resumeEvidence = selectedResume?.resumeEvidenceScore ?? verificationReport?.evidenceScore ?? null;
      const assessmentPerformance = selectedResume?.assessmentPerformanceScore ?? verificationReport?.assessmentScore ?? null;
      const consistencyAlignment = selectedResume?.consistencyAlignmentScore ?? verificationReport?.consistencyScore ?? null;
      const trustScore = selectedResume?.trustScore ?? (
        selectedResume?.assessmentStatus === 'COMPLETED' && assessmentPerformance != null
          ? Math.round((resumeEvidence || 0) * 0.3 + (assessmentPerformance || 0) * 0.5 + (consistencyAlignment || 0) * 0.2)
          : (verificationReport?.trustScore ?? null)
      );

      res.status(200).json({
        success: true,
        candidate: candidateUser,
        currentApplication: application,
        selectedResume,
        categorizedSkills,
        trustScore,
        resumeEvidence,
        assessmentPerformance,
        consistencyAlignment,
        assessmentStatus: selectedResume?.assessmentStatus || (assessmentPerformance != null ? 'COMPLETED' : 'NOT_TAKEN'),
        applications: allCandidateAppsToRecruiter,
        skillEvidence,
        verificationReport,
        assessmentSessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Toggle shortlist status for candidate application
   */
  public static async toggleShortlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const recruiterId = req.user?.id;

      const application = await Application.findById(id);
      if (!application || (req.user?.role !== 'ADMIN' && application.recruiterId.toString() !== recruiterId)) {
        res.status(403).json({ success: false, message: 'Unauthorized to shortlist this application.' });
        return;
      }

      application.isShortlisted = !application.isShortlisted;
      if (application.isShortlisted && application.status === 'APPLIED') {
        application.status = 'SHORTLISTED';
      } else if (!application.isShortlisted && application.status === 'SHORTLISTED') {
        application.status = 'REVIEWING';
      }
      await application.save();

      res.status(200).json({
        success: true,
        message: application.isShortlisted ? 'Candidate shortlisted.' : 'Candidate removed from shortlist.',
        isShortlisted: application.isShortlisted,
        status: application.status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Update Application Status
   */
  public static async updateApplicationStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const recruiterId = req.user?.id;

      if (!['APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'SELECTED'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid application status.' });
        return;
      }

      const application = await Application.findById(id);
      if (!application || application.recruiterId.toString() !== recruiterId) {
        res.status(403).json({ success: false, message: 'Unauthorized to update this application.' });
        return;
      }

      application.status = status;
      await application.save();

      res.status(200).json({ success: true, message: 'Application status updated.', application });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Toggle manual star
   */
  public static async toggleStar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const recruiterId = req.user?.id;

      const application = await Application.findById(id);
      if (!application || application.recruiterId.toString() !== recruiterId) {
        res.status(403).json({ success: false, message: 'Unauthorized to star this application.' });
        return;
      }

      application.isStarred = !application.isStarred;
      await application.save();

      res.status(200).json({
        success: true,
        message: application.isStarred ? 'Candidate starred.' : 'Candidate unstarred.',
        isStarred: application.isStarred,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Update private recruiter notes
   */
  public static async updateNotes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const recruiterId = req.user?.id;

      const application = await Application.findById(id);
      if (!application || application.recruiterId.toString() !== recruiterId) {
        res.status(403).json({ success: false, message: 'Unauthorized to edit notes for this application.' });
        return;
      }

      application.recruiterNotes = notes || '';
      await application.save();

      res.status(200).json({ success: true, message: 'Recruiter notes saved.', notes: application.recruiterNotes });
    } catch (error) {
      next(error);
    }
  }
}
