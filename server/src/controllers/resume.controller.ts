import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../types';
import { Resume } from '../models/Resume';
import { DocumentService } from '../services/document.service';
import { GeminiService } from '../services/gemini.service';
import { RAGService } from '../services/rag.service';
import { VerificationService } from '../services/verification.service';
import { SkillEvidence } from '../models/SkillEvidence';
import { VerificationReport } from '../models/VerificationReport';
import { AssessmentSession } from '../models/AssessmentSession';
import { AuditService } from '../services/audit.service';

export class ResumeController {
  public static async uploadResume(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_FILE',
        message: 'No resume file provided. Please select a PDF or Word document (.pdf, .docx, .doc).',
      });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHENTICATED',
        message: 'Authentication session expired. Please sign in again.',
      });
      return;
    }

    console.log(`[ResumeUpload] received fileName=${file.originalname} size=${file.size} bytes`);
    console.log(`[ResumeUpload] authenticated userId=${userId}`);

    let resumeDoc = await Resume.create({
      userId,
      originalFileName: file.originalname,
      fileSize: file.size,
      filePath: file.path,
      status: 'PARSING',
    });

    try {
      // Step 1: Extract Text from PDF / DOCX
      let extractedText: string;
      try {
        console.log(`[ResumeUpload] parsing document with DocumentService...`);
        extractedText = await DocumentService.extractText(file.path, file.originalname);
        console.log(`[ResumeUpload] text extracted length=${extractedText.length} characters`);
      } catch (docError: any) {
        console.error(`[ResumeUpload] Text extraction failed:`, docError.message || docError);
        resumeDoc.status = 'FAILED';
        resumeDoc.errorMessage = docError.message || 'Failed to extract text from document';
        await resumeDoc.save();

        res.status(422).json({
          success: false,
          errorCode: 'RESUME_PARSE_FAILED',
          message: docError.message || "We couldn't extract readable text from this document. Please ensure it is a text-based PDF or Word document.",
        });
        return;
      }

      resumeDoc.extractedText = extractedText;
      resumeDoc.status = 'ANALYZING';
      await resumeDoc.save();

      // Step 2: Gemini AI Structured Extraction
      let analysisResult;
      try {
        console.log(`[ResumeUpload] Gemini analysis started...`);
        analysisResult = await GeminiService.analyzeResume(extractedText);
        console.log(`[ResumeUpload] Gemini analysis completed (name=${analysisResult.personalInfo?.fullName || 'Extracted'})`);
      } catch (aiError: any) {
        console.error(`[ResumeUpload] AI analysis failed:`, aiError.message || aiError);
        resumeDoc.status = 'FAILED';
        resumeDoc.errorMessage = aiError.message || 'AI processing error';
        await resumeDoc.save();

        res.status(502).json({
          success: false,
          errorCode: 'AI_SERVICE_UNAVAILABLE',
          resumeId: resumeDoc._id,
          message: 'AI analysis is temporarily busy. Please click "Retry Analysis" to re-process your document.',
        });
        return;
      }

      // Step 3: Save analysis results
      resumeDoc.status = 'ANALYZED';
      resumeDoc.analysis = analysisResult;
      await resumeDoc.save();
      console.log(`[ResumeUpload] database saved resumeId=${resumeDoc._id}`);

      // Step 4: Index into Vector Database (RAG Pipeline)
      try {
        console.log(`[ResumeUpload] generating vector embeddings and evidence mapping...`);
        await RAGService.indexResume(resumeDoc._id.toString(), userId, analysisResult);
        await VerificationService.generateSkillEvidenceMap(userId, resumeDoc._id.toString(), analysisResult);
        console.log(`[ResumeUpload] vector indexed and evidence mapped successfully`);
      } catch (ragErr: any) {
        console.warn('[ResumeUpload] Non-fatal RAG/evidence mapping warning:', ragErr?.message || ragErr);
      }

      // Step 5: Audit Log
      await AuditService.log({
        userId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'RESUME_UPLOAD',
        resource: 'Resume',
        resourceId: resumeDoc._id.toString(),
        metadata: { fileName: file.originalname, size: file.size },
      });

      console.log(`[ResumeUpload] completed successfully for resumeId=${resumeDoc._id}`);

      res.status(201).json({
        success: true,
        message: 'Resume parsed, analyzed, and indexed successfully.',
        resume: {
          id: resumeDoc._id,
          originalFileName: resumeDoc.originalFileName,
          fileSize: resumeDoc.fileSize,
          status: resumeDoc.status,
          analysis: resumeDoc.analysis,
          createdAt: resumeDoc.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry failed or pending analysis on an already uploaded resume
   */
  public static async retryAnalysis(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const resumeDoc = await Resume.findById(id);
      if (!resumeDoc) {
        res.status(404).json({ success: false, errorCode: 'RESUME_NOT_FOUND', message: 'Resume document not found.' });
        return;
      }

      if (userRole === 'CANDIDATE' && resumeDoc.userId.toString() !== userId) {
        res.status(403).json({ success: false, errorCode: 'UNAUTHORIZED', message: 'You do not have permission to retry this resume.' });
        return;
      }

      console.log(`[ResumeRetry] Retrying analysis for resumeId=${id}`);
      resumeDoc.status = 'PARSING';
      await resumeDoc.save();

      let text = resumeDoc.extractedText;
      if (!text || text.length < 15) {
        if (!resumeDoc.filePath || !fs.existsSync(resumeDoc.filePath)) {
          res.status(404).json({
            success: false,
            errorCode: 'FILE_NOT_FOUND',
            message: 'Original file no longer exists on server storage. Please upload again.',
          });
          return;
        }
        text = await DocumentService.extractText(resumeDoc.filePath, resumeDoc.originalFileName);
        resumeDoc.extractedText = text;
      }

      resumeDoc.status = 'ANALYZING';
      await resumeDoc.save();

      const analysisResult = await GeminiService.analyzeResume(text);
      resumeDoc.status = 'ANALYZED';
      resumeDoc.analysis = analysisResult;
      resumeDoc.errorMessage = undefined;
      await resumeDoc.save();

      try {
        await RAGService.indexResume(resumeDoc._id.toString(), resumeDoc.userId.toString(), analysisResult);
        await VerificationService.generateSkillEvidenceMap(resumeDoc.userId.toString(), resumeDoc._id.toString(), analysisResult);
      } catch (ragErr: any) {
        console.warn('[ResumeRetry] Non-fatal RAG warning:', ragErr?.message || ragErr);
      }

      await AuditService.log({
        userId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'RESUME_RETRY',
        resource: 'Resume',
        resourceId: resumeDoc._id.toString(),
        metadata: { fileName: resumeDoc.originalFileName },
      });

      res.status(200).json({
        success: true,
        message: 'Resume re-analyzed successfully.',
        resume: {
          id: resumeDoc._id,
          originalFileName: resumeDoc.originalFileName,
          fileSize: resumeDoc.fileSize,
          status: resumeDoc.status,
          analysis: resumeDoc.analysis,
          createdAt: resumeDoc.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getResumes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const query = userRole === 'RECRUITER' || userRole === 'ADMIN' ? {} : { userId };

      const resumes = await Resume.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        resumes: resumes.map((doc) => {
          const skillsList = [
            ...(doc.analysis?.skills?.programmingLanguages || []),
            ...(doc.analysis?.skills?.frameworks || []),
            ...(doc.analysis?.skills?.libraries || []),
            ...(doc.analysis?.skills?.databases || []),
            ...(doc.analysis?.skills?.tools || []),
            ...(doc.analysis?.skills?.cloud || []),
          ];

          return {
            id: doc._id,
            userId: doc.userId,
            originalFileName: doc.originalFileName,
            fileSize: doc.fileSize,
            status: doc.status,
            analysis: doc.analysis,
            skillsCount: skillsList.length,
            resumeEvidenceScore: doc.resumeEvidenceScore ?? 60,
            assessmentPerformanceScore: doc.assessmentPerformanceScore ?? null,
            consistencyAlignmentScore: doc.consistencyAlignmentScore ?? null,
            trustScore: doc.trustScore ?? null,
            assessmentStatus: doc.assessmentStatus || 'NOT_TAKEN',
            latestAssessmentSessionId: doc.latestAssessmentSessionId || null,
            createdAt: doc.createdAt,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getResumeById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!id || id.length !== 24) {
        res.status(404).json({ success: false, message: 'Resume analysis not found.' });
        return;
      }

      const resumeDoc = await Resume.findById(id);

      if (!resumeDoc) {
        res.status(404).json({ success: false, message: 'Resume analysis not found.' });
        return;
      }

      // Ownership check for candidates
      if (userRole === 'CANDIDATE' && resumeDoc.userId.toString() !== userId) {
        res.status(403).json({ success: false, message: 'You do not have permission to view this resume.' });
        return;
      }

      res.status(200).json({
        success: true,
        resume: {
          id: resumeDoc._id,
          userId: resumeDoc.userId,
          originalFileName: resumeDoc.originalFileName,
          fileSize: resumeDoc.fileSize,
          status: resumeDoc.status,
          extractedText: resumeDoc.extractedText,
          analysis: resumeDoc.analysis,
          resumeEvidenceScore: resumeDoc.resumeEvidenceScore ?? 60,
          assessmentPerformanceScore: resumeDoc.assessmentPerformanceScore ?? null,
          consistencyAlignmentScore: resumeDoc.consistencyAlignmentScore ?? null,
          trustScore: resumeDoc.trustScore ?? null,
          assessmentStatus: resumeDoc.assessmentStatus || 'NOT_TAKEN',
          latestAssessmentSessionId: resumeDoc.latestAssessmentSessionId || null,
          errorMessage: resumeDoc.errorMessage,
          createdAt: resumeDoc.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get skill evidence mapping for a specific resume
   */
  public static async getResumeEvidence(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const resume = await Resume.findById(id);
      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume not found.' });
        return;
      }

      const candidateId = resume.userId.toString();
      if (req.user?.role === 'CANDIDATE' && candidateId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }

      const evidence = await SkillEvidence.find({ candidateId, resumeId: id }).sort({ confidence: -1 });

      res.status(200).json({
        success: true,
        candidateId,
        resumeId: id,
        evidence,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get resume-isolated TrustScore (Requirement 33)
   */
  public static async getResumeTrustScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const resume = await Resume.findById(id);
      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume not found.' });
        return;
      }

      const candidateId = resume.userId.toString();
      if (req.user?.role === 'CANDIDATE' && candidateId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }

      let report: any = await VerificationReport.findOne({ candidateId, resumeId: id });
      if (!report) {
        report = await VerificationService.calculateVerificationScore(candidateId, id);
      }

      const session = await AssessmentSession.findOne({
        candidateId,
        resumeId: id,
        status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      }).sort({ submittedAt: -1 });

      const hasAssessment = !!session;
      const trustScore = hasAssessment
        ? (resume.trustScore ?? report?.trustScore ?? (session ? Math.round((resume.resumeEvidenceScore || 60) * 0.3 + session.percentage * 0.5 + 80 * 0.2) : null))
        : null;

      res.status(200).json({
        success: true,
        resumeId: id,
        fileName: resume.originalFileName,
        resumeEvidence: resume.resumeEvidenceScore ?? report?.evidenceScore ?? 60,
        assessmentPerformance: session ? session.percentage : null,
        consistencyAlignment: hasAssessment ? (resume.consistencyAlignmentScore ?? report?.consistencyScore ?? 70) : null,
        trustScore,
        assessmentStatus: hasAssessment ? 'COMPLETED' : 'NOT_TAKEN',
        sessionId: session?._id || null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Secure download of the original uploaded file
   */
  public static async downloadResumeFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const resume = await Resume.findById(id);
      if (!resume || !resume.filePath || !fs.existsSync(resume.filePath)) {
        res.status(404).json({ success: false, message: 'Resume file not found on storage.' });
        return;
      }

      const candidateId = resume.userId.toString();
      if (req.user?.role === 'CANDIDATE' && candidateId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }

      res.download(resume.filePath, resume.originalFileName);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteResume(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const resumeDoc = await Resume.findById(id);

      if (!resumeDoc) {
        res.status(404).json({ success: false, message: 'Resume not found.' });
        return;
      }

      if (userRole === 'CANDIDATE' && resumeDoc.userId.toString() !== userId) {
        res.status(403).json({ success: false, message: 'You do not have permission to delete this resume.' });
        return;
      }

      if (resumeDoc.filePath && fs.existsSync(resumeDoc.filePath)) {
        try {
          fs.unlinkSync(resumeDoc.filePath);
        } catch (e) {}
      }

      await Resume.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Resume deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
