import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { VerificationReport } from '../models/VerificationReport';
import { SkillEvidence } from '../models/SkillEvidence';
import { AssessmentSession } from '../models/AssessmentSession';
import { VerificationService } from '../services/verification.service';
import { Resume } from '../models/Resume';
import { User } from '../models/User';

function formatSessionBreakdown(latestSession: any) {
  if (!latestSession) return null;

  const rawSkills = latestSession.skillScores || {};
  const skillScores = Array.isArray(rawSkills)
    ? rawSkills
    : Object.entries(rawSkills).map(([skill, stats]: [string, any]) => ({
        skill,
        total: stats?.total || 0,
        correct: stats?.correct || 0,
        percentage: stats?.percentage || 0,
      }));

  const rawDiff = latestSession.difficultyPerformance || {};
  const difficultyBreakdown = Array.isArray(rawDiff)
    ? rawDiff
    : Object.entries(rawDiff)
        .filter(([_, stats]: [string, any]) => (stats?.total || 0) > 0)
        .map(([difficulty, stats]: [string, any]) => ({
          difficulty,
          total: stats?.total || 0,
          correct: stats?.correct || 0,
          percentage: stats?.percentage || 0,
        }));

  const unansweredCount = latestSession.skippedAnswers ?? 0;
  const attemptedCount = Math.max(0, (latestSession.totalQuestions || 0) - unansweredCount);

  return {
    id: latestSession._id,
    assessmentType: latestSession.assessmentType || 'RESUME_BASED',
    assessmentTitle:
      (latestSession.assessmentId as any)?.title || 'AI Verification Assessment',
    score: latestSession.score,
    percentage: latestSession.percentage,
    totalQuestions: latestSession.totalQuestions,
    attemptedCount,
    correctAnswers: latestSession.correctAnswers,
    incorrectAnswers: latestSession.incorrectAnswers,
    unansweredCount,
    skippedAnswers: unansweredCount,
    skillScores,
    difficultyBreakdown,
    difficultyPerformance: latestSession.difficultyPerformance,
    submittedAt: latestSession.submittedAt,
  };
}

export class VerificationController {
  /**
   * Candidate views their own verification score & evidence report (resume-wise)
   */
  public static async getMyVerificationReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const requestedResumeId = req.query.resumeId as string | undefined;

      // Fetch all analyzed resumes for candidate
      const userResumes = await Resume.find({ userId: candidateId, status: { $in: ['ANALYZED', 'COMPLETED'] } }).sort({ createdAt: -1 });

      let activeResumeId = requestedResumeId;
      if (!activeResumeId && userResumes.length > 0) {
        activeResumeId = userResumes[0]._id.toString();
      }

      const reportQuery: any = { candidateId };
      if (activeResumeId) {
        reportQuery.resumeId = activeResumeId;
      }

      let [existingReport, skills, latestSession]: [any, any, any] = await Promise.all([
        VerificationReport.findOne(reportQuery),
        SkillEvidence.find({
          candidateId,
          ...(activeResumeId ? { resumeId: activeResumeId } : {}),
        }).sort({ confidence: -1 }),
        AssessmentSession.findOne({
          candidateId,
          ...(activeResumeId ? { resumeId: activeResumeId } : {}),
          status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
        })
          .populate('assessmentId', 'title assessmentType totalQuestions durationMinutes')
          .sort({ submittedAt: -1 }),
      ]);

      if (!existingReport && activeResumeId) {
        existingReport = await VerificationService.calculateVerificationScore(candidateId, activeResumeId);
      }

      // Compile resume-wise summaries for all candidate resumes
      const resumeWiseReports = await Promise.all(
        userResumes.map(async (r) => {
          const rId = r._id.toString();
          let rReport: any = await VerificationReport.findOne({ candidateId, resumeId: rId });
          if (!rReport) {
            rReport = await VerificationService.calculateVerificationScore(candidateId, rId);
          }
          const session = await AssessmentSession.findOne({
            candidateId,
            resumeId: rId,
            status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
          }).sort({ submittedAt: -1 });

          return {
            resumeId: rId,
            fileName: r.originalFileName,
            status: r.status,
            createdAt: r.createdAt,
            skillsCount: (r.analysis?.skills?.programmingLanguages?.length || 0) +
                         (r.analysis?.skills?.frameworks?.length || 0) +
                         (r.analysis?.skills?.databases?.length || 0) +
                         (r.analysis?.skills?.tools?.length || 0),
            assessmentStatus: session ? 'COMPLETED' : 'NOT_TAKEN',
            assessmentScore: session ? session.percentage : null,
            sessionId: session?._id || null,
            evidenceScore: rReport?.evidenceScore ?? 60,
            consistencyScore: session ? (rReport?.consistencyScore ?? 70) : null,
            trustScore: session ? (rReport?.trustScore ?? null) : null,
            overallScore: rReport?.overallScore ?? 60,
          };
        })
      );

      const hasSessionForActive = !!latestSession;
      if (existingReport && !hasSessionForActive) {
        existingReport.trustScore = null;
        existingReport.assessmentScore = null;
        existingReport.consistencyScore = null;
      }

      res.status(200).json({
        success: true,
        activeResumeId,
        report: existingReport || {
          overallScore: 60,
          trustScore: null,
          evidenceScore: 60,
          assessmentScore: null,
          consistencyScore: null,
          positiveFactors: ['Resume profile submitted for evaluation'],
          limitations: ['Assessment has not yet been taken for this resume'],
          summary: 'TrustScore will be calculated once the candidate completes the proctored assessment for this resume.',
        },
        skills,
        latestSession: formatSessionBreakdown(latestSession),
        resumeWiseReports,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter / Admin views a candidate's verification report & skill evidence mapping
   */
  public static async getCandidateVerificationReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { candidateId } = req.params;
      const requestedResumeId = req.query.resumeId as string | undefined;

      const candidate = await User.findById(candidateId).select('name email role companyName');
      if (!candidate) {
        res.status(404).json({ success: false, message: 'Candidate not found.' });
        return;
      }

      const reportQuery: any = { candidateId };
      if (requestedResumeId) {
        reportQuery.resumeId = requestedResumeId;
      }

      let [existingReport, skills, latestSession]: [any, any, any] = await Promise.all([
        VerificationReport.findOne(reportQuery),
        SkillEvidence.find({
          candidateId,
          ...(requestedResumeId ? { resumeId: requestedResumeId } : {}),
        }).sort({ confidence: -1 }),
        AssessmentSession.findOne({
          candidateId,
          ...(requestedResumeId ? { resumeId: requestedResumeId } : {}),
          status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
        })
          .populate('assessmentId', 'title assessmentType totalQuestions durationMinutes')
          .sort({ submittedAt: -1 }),
      ]);

      if (!existingReport) {
        const resume = requestedResumeId
          ? await Resume.findById(requestedResumeId)
          : await Resume.findOne({ userId: candidateId, status: 'ANALYZED' }).sort({ createdAt: -1 });

        if (resume && resume.analysis) {
          existingReport = await VerificationService.calculateVerificationScore(candidateId, resume._id.toString());
        }
      }

      const hasSession = !!latestSession;
      if (existingReport && !hasSession) {
        existingReport.trustScore = null;
        existingReport.assessmentScore = null;
        existingReport.consistencyScore = null;
      }

      res.status(200).json({
        success: true,
        candidate,
        report: existingReport || {
          overallScore: 60,
          trustScore: null,
          evidenceScore: 60,
          assessmentScore: null,
          consistencyScore: null,
          positiveFactors: [],
          limitations: ['Candidate has not completed proctored assessment for this resume.'],
          summary: 'TrustScore will be calculated once the candidate completes the proctored assessment for this resume.',
        },
        skills,
        latestSession: formatSessionBreakdown(latestSession),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Candidate or Recruiter views skill evidence list (optionally filtered by resumeId)
   * Automatically auto-generates skill evidence for analyzed resumes so candidate is never prompted to re-upload.
   */
  public static async getSkillEvidenceList(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetCandidateId = req.params.candidateId || req.user?.id;
      if (!targetCandidateId) {
        res.status(400).json({ success: false, message: 'Candidate ID is required.' });
        return;
      }

      let resumeId = req.query.resumeId as string | undefined;
      if (!resumeId) {
        const latestResume = await Resume.findOne({ userId: targetCandidateId, status: 'ANALYZED' }).sort({ createdAt: -1 });
        if (latestResume) {
          resumeId = latestResume._id.toString();
        }
      }

      const query: any = { candidateId: targetCandidateId };
      if (resumeId) {
        query.resumeId = resumeId;
      }

      let skills = await SkillEvidence.find(query).sort({
        confidence: -1,
      });

      // Auto-generate if empty and resume is already analyzed
      if (skills.length === 0 && resumeId) {
        const resumeDoc = await Resume.findById(resumeId);
        if (resumeDoc && resumeDoc.analysis) {
          await VerificationService.generateSkillEvidenceMap(targetCandidateId, resumeId, resumeDoc.analysis);
          skills = await SkillEvidence.find(query).sort({
            confidence: -1,
          });
        }
      }

      res.status(200).json({
        success: true,
        selectedResumeId: resumeId,
        skills,
      });
    } catch (error) {
      next(error);
    }
  }
}
