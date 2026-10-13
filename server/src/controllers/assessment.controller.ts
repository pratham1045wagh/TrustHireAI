import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Assessment } from '../models/Assessment';
import { AssessmentQuestion } from '../models/AssessmentQuestion';
import { AssessmentSession } from '../models/AssessmentSession';
import { Resume } from '../models/Resume';
import { VerificationReport } from '../models/VerificationReport';
import { AssessmentGenerationService } from '../services/assessment.generation.service';
import { RAGService } from '../services/rag.service';
import { AuditService } from '../services/audit.service';

export const DEFAULT_RESUME_ASSESSMENT_QUESTION_COUNT = Number(
  process.env.RESUME_ASSESSMENT_QUESTION_COUNT || 20
);

export class AssessmentController {
  /**
   * List assessments (Public templates + Recruiter's created assessments + Candidate's resume assessments)
   */
  public static async getAssessments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.id;

      let query: any = {
        $or: [{ isPublic: true }, { candidateId: userId }],
      };
      if (userRole === 'RECRUITER' || userRole === 'ADMIN') {
        query = {
          $or: [{ isPublic: true }, { recruiterId: userId }],
        };
      }

      const assessments = await Assessment.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        assessments: assessments.map((a) => ({
          id: a._id,
          assessmentType: a.assessmentType || 'RECRUITER_ROOM',
          resumeId: a.resumeId,
          candidateId: a.candidateId,
          title: a.title,
          description: a.description,
          skills: a.skills,
          totalQuestions: a.totalQuestions,
          generatedCount: a.generatedCount ?? a.totalQuestions,
          durationMinutes: a.durationMinutes,
          defaultDifficulty: a.defaultDifficulty,
          dynamicDifficulty: a.dynamicDifficulty,
          generationMode: a.generationMode || 'AI',
          questionSource: a.questionSource || 'GENERATED',
          generationStatus: a.generationStatus,
          generationError: a.generationError,
          createdAt: a.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Candidate: Create or retrieve a 20-question Resume-Based AI Assessment from an analyzed resume
   */
  public static async createResumeAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const { resumeId } = req.params;
      const { regenerate } = req.body || {};

      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const resume = await Resume.findById(resumeId);
      if (!resume || resume.userId.toString() !== candidateId) {
        res.status(404).json({
          success: false,
          message: 'Parsed resume not found or unauthorized.',
        });
        return;
      }

      if (resume.status !== 'ANALYZED' || !resume.analysis) {
        res.status(400).json({
          success: false,
          message: 'Resume must be successfully parsed and analyzed before generating an assessment.',
        });
        return;
      }

      const questionCount =
        Number(req.body?.questionCount || req.body?.totalQuestions) > 0
          ? Number(req.body?.questionCount || req.body?.totalQuestions)
          : DEFAULT_RESUME_ASSESSMENT_QUESTION_COUNT;

      // Check if an active RESUME_BASED assessment already exists for this resume
      let assessment = await Assessment.findOne({
        candidateId,
        resumeId,
        assessmentType: 'RESUME_BASED',
      }).sort({ createdAt: -1 });

      if (assessment && !regenerate) {
        const existingQCount = await AssessmentQuestion.countDocuments({
          assessmentId: assessment._id,
        });
        if (
          existingQCount >= questionCount &&
          (assessment.generationStatus === 'READY' || assessment.generationStatus === 'FALLBACK_READY')
        ) {
          res.status(200).json({
            success: true,
            message:
              assessment.generationStatus === 'FALLBACK_READY'
                ? 'AI question generation is temporarily unavailable. A technical question set has been prepared using the available skill profile.'
                : 'Resume-based assessment is ready.',
            assessment: {
              id: assessment._id,
              assessmentType: 'RESUME_BASED',
              resumeId: resume._id,
              resumeName: resume.originalFileName,
              title: assessment.title,
              description: assessment.description,
              skills: assessment.skills,
              totalQuestions: assessment.totalQuestions,
              generatedCount: existingQCount,
              durationMinutes: assessment.durationMinutes,
              generationStatus: assessment.generationStatus,
              questionSource: assessment.questionSource,
              generationError: assessment.generationError,
            },
          });
          return;
        }
      }

      // Extract comprehensive skills from resume analysis
      const analysis = resume.analysis;
      const rawSkills = [
        ...(analysis.skills?.programmingLanguages || []),
        ...(analysis.skills?.frameworks || []),
        ...(analysis.skills?.libraries || []),
        ...(analysis.skills?.databases || []),
        ...(analysis.skills?.cloud || []),
        ...(analysis.skills?.tools || []),
        ...(analysis.skills?.other || []),
        ...((analysis.projects || []).flatMap((p) => p.technologies || [])),
      ]
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean);

      const uniqueSkills = Array.from(new Set(rawSkills)).slice(0, 12);
      const effectiveSkills =
        uniqueSkills.length > 0
          ? uniqueSkills
          : ['JavaScript', 'Python', 'SQL', 'REST APIs', 'Software Engineering'];

      // Build rich candidate context from parsed resume + RAG vector chunks
      const projectSummaries = (analysis.projects || [])
        .slice(0, 4)
        .map(
          (p) =>
            `Project "${p.name || 'Project'}" (${(p.technologies || []).join(', ')}): ${
              p.description || ''
            }`
        )
        .join('\n');

      const experienceSummaries = (analysis.experience || [])
        .slice(0, 3)
        .map(
          (e) =>
            `Role "${e.role || 'Developer'}" at "${e.company || 'Company'}": ${(
              e.description || []
            )
              .slice(0, 2)
              .join(' ')}`
        )
        .join('\n');

      const educationSummary = (analysis.education || [])
        .slice(0, 2)
        .map((ed) => `${ed.degree || ''} in ${ed.field || ''} at ${ed.institution || ''}`)
        .join('; ');

      let ragSnippets = '';
      try {
        const ragDocs = await RAGService.searchResumeEvidence(
          candidateId,
          effectiveSkills.slice(0, 4).join(' '),
          3
        );
        if (ragDocs.length > 0) {
          ragSnippets = ragDocs.map((d) => `[${d.section}] ${d.text.slice(0, 250)}`).join('\n');
        }
      } catch {
        // Ignore RAG lookup errors
      }

      const candidateContext = [
        `Candidate Name: ${analysis.personalInfo?.fullName || 'Candidate'}`,
        `Summary: ${analysis.summary || 'Software Engineer'}`,
        `Technical Skills: ${effectiveSkills.join(', ')}`,
        projectSummaries ? `Projects:\n${projectSummaries}` : '',
        experienceSummaries ? `Work Experience:\n${experienceSummaries}` : '',
        educationSummary ? `Education: ${educationSummary}` : '',
        ragSnippets ? `Relevant Resume Evidence:\n${ragSnippets}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (!assessment) {
        assessment = await Assessment.create({
          candidateId,
          resumeId: resume._id.toString(),
          assessmentType: 'RESUME_BASED',
          title: `AI Resume Verification Assessment — ${resume.originalFileName}`,
          description: `Personalized ${questionCount}-question technical verification assessment generated from ${resume.originalFileName}.`,
          skills: effectiveSkills,
          totalQuestions: questionCount,
          generatedCount: 0,
          durationMinutes: 30,
          defaultDifficulty: 'MEDIUM',
          dynamicDifficulty: true,
          generationMode: 'AI',
          questionSource: 'GENERATED',
          generationStatus: 'GENERATING',
          isPublic: false,
        });
      } else {
        assessment.skills = effectiveSkills;
        assessment.totalQuestions = questionCount;
        assessment.generatedCount = 0;
        assessment.generationStatus = 'GENERATING';
        assessment.generationError = undefined;
        await assessment.save();
      }

      // Generate the 20 personalized questions (with 18s timeout + automatic skill-matched fallback)
      const genResult = await AssessmentGenerationService.generateQuestions(
        assessment._id.toString(),
        effectiveSkills,
        questionCount,
        candidateContext
      );
      const count = genResult.count;

      const updatedAssessment = await Assessment.findById(assessment._id);

      await AuditService.log({
        userId: candidateId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'ASSESSMENT_CREATED',
        resource: 'Assessment',
        resourceId: assessment._id.toString(),
        metadata: {
          assessmentType: 'RESUME_BASED',
          resumeId,
          questionCount: count,
          status: updatedAssessment?.generationStatus,
        },
      });

      const isFallback = updatedAssessment?.generationStatus === 'FALLBACK_READY';

      res.status(200).json({
        success: true,
        message: isFallback
          ? 'AI question generation is temporarily unavailable. A technical question set has been prepared using the available skill profile.'
          : `Successfully generated ${count} personalized questions from your resume.`,
        assessment: {
          id: updatedAssessment?._id || assessment._id,
          assessmentType: 'RESUME_BASED',
          resumeId: resume._id,
          resumeName: resume.originalFileName,
          title: updatedAssessment?.title || assessment.title,
          description: updatedAssessment?.description || assessment.description,
          skills: updatedAssessment?.skills || effectiveSkills,
          totalQuestions: updatedAssessment?.totalQuestions || questionCount,
          generatedCount: updatedAssessment?.generatedCount || count,
          durationMinutes: updatedAssessment?.durationMinutes || 30,
          generationStatus: updatedAssessment?.generationStatus || 'READY',
          questionSource: updatedAssessment?.questionSource || 'GENERATED',
          generationError: updatedAssessment?.generationError,
        },
      });
    } catch (error: any) {
      console.error('[AssessmentController.createResumeAssessment Error]', error);
      res.status(500).json({
        success: false,
        message: 'We could not generate the assessment at this time. Please retry.',
        generationStatus: 'FAILED',
      });
    }
  }

  /**
   * Candidate: Get status of Resume-Based AI Assessments across uploaded resumes
   */
  public static async getMyResumeAssessments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const [resumes, assessments, sessions, verificationReports] = await Promise.all([
        Resume.find({ userId: candidateId }).sort({ createdAt: -1 }),
        Assessment.find({ candidateId, assessmentType: 'RESUME_BASED' }).sort({ createdAt: -1 }),
        AssessmentSession.find({ candidateId }).sort({ submittedAt: -1, createdAt: -1 }),
        VerificationReport.find({ candidateId }),
      ]);

      const items = resumes.map((r) => {
        const rid = r._id.toString();
        const assessment = assessments.find((a) => a.resumeId?.toString() === rid);
        const completedSession = sessions.find(
          (s) =>
            (s.status === 'SUBMITTED' || s.status === 'AUTO_SUBMITTED') &&
            (s.resumeId?.toString() === rid ||
              (r.latestAssessmentSessionId && s._id.toString() === r.latestAssessmentSessionId.toString()) ||
              (assessment && s.assessmentId.toString() === assessment._id.toString()))
        );
        const activeSession = sessions.find(
          (s) =>
            s.status === 'IN_PROGRESS' &&
            (s.resumeId?.toString() === rid ||
              (assessment && s.assessmentId.toString() === assessment._id.toString()))
        );

        // Resume-specific VerificationReport matching this resumeId
        const rReport = verificationReports.find((vr) => vr.resumeId?.toString() === rid);

        // Resume-specific assessment completion state
        const isCompleted = r.assessmentStatus === 'COMPLETED' || !!completedSession;
        const resolvedAssessmentStatus = isCompleted
          ? 'COMPLETED'
          : activeSession
          ? 'IN_PROGRESS'
          : (r.assessmentStatus || 'NOT_TAKEN');

        // Strictly resume-specific trustScore: only present if assessment is completed for this specific resume
        const resumeTrustScore = isCompleted
          ? (r.trustScore ?? rReport?.trustScore ?? null)
          : null;

        const assessmentScore = isCompleted
          ? (r.assessmentPerformanceScore ?? (completedSession ? completedSession.percentage : (rReport?.assessmentScore ?? null)))
          : null;

        const extractedSkills = r.analysis
          ? Array.from(
              new Set([
                ...(r.analysis.skills?.programmingLanguages || []),
                ...(r.analysis.skills?.frameworks || []),
                ...(r.analysis.skills?.databases || []),
                ...(r.analysis.skills?.cloud || []),
                ...(r.analysis.skills?.tools || []),
              ])
            ).slice(0, 10)
          : [];

        return {
          resumeId: r._id,
          resumeName: r.originalFileName,
          resumeStatus: r.status,
          extractedSkills,
          createdAt: r.createdAt,
          assessmentStatus: resolvedAssessmentStatus,
          assessmentScore,
          assessmentPerformanceScore: assessmentScore,
          trustScore: resumeTrustScore,
          resumeEvidenceScore: r.resumeEvidenceScore ?? rReport?.evidenceScore ?? null,
          consistencyAlignmentScore: isCompleted ? (r.consistencyAlignmentScore ?? rReport?.consistencyScore ?? null) : null,
          assessment: assessment
            ? {
                id: assessment._id,
                title: assessment.title,
                totalQuestions: assessment.totalQuestions,
                generatedCount: assessment.generatedCount ?? assessment.totalQuestions,
                durationMinutes: assessment.durationMinutes,
                generationStatus: assessment.generationStatus,
                questionSource: assessment.questionSource,
                generationError: assessment.generationError,
                skills: assessment.skills,
              }
            : null,
          completedSession: completedSession
            ? {
                id: completedSession._id,
                score: completedSession.score,
                percentage: completedSession.percentage,
                totalQuestions: completedSession.totalQuestions,
                correctAnswers: completedSession.correctAnswers,
                incorrectAnswers: completedSession.incorrectAnswers,
                skippedAnswers: completedSession.skippedAnswers,
                submittedAt: completedSession.submittedAt,
              }
            : null,
          activeSession: activeSession
            ? {
                id: activeSession._id,
                totalQuestions: activeSession.totalQuestions,
                currentQuestionIndex: activeSession.currentQuestionIndex,
                expiresAt: activeSession.expiresAt,
              }
            : null,
          verificationScore: resumeTrustScore,
          verificationBreakdown: rReport
            ? {
                overallScore: resumeTrustScore,
                evidenceScore: rReport.evidenceScore,
                assessmentScore: isCompleted ? rReport.assessmentScore : null,
                consistencyScore: isCompleted ? rReport.consistencyScore : null,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        resumeAssessments: items,
        verificationReport: verificationReports[0] || null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new assessment template (Recruiter only)
   */
  public static async createAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      const {
        title,
        description,
        skills,
        totalQuestions,
        durationMinutes,
        defaultDifficulty,
        dynamicDifficulty,
        jobId,
        naturalLanguagePrompt,
      } = req.body;

      if (!title || !skills || !Array.isArray(skills) || skills.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Title and at least one skill are required to configure an assessment.',
        });
        return;
      }

      const qCount = Number(totalQuestions) || 20;

      const assessment = await Assessment.create({
        recruiterId,
        jobId,
        assessmentType: 'RECRUITER_ROOM',
        title,
        description: description || '',
        skills: skills.map((s: string) => s.trim()),
        totalQuestions: qCount,
        generatedCount: 0,
        durationMinutes: Number(durationMinutes) || 45,
        defaultDifficulty: defaultDifficulty === 'MIXED' ? 'MEDIUM' : defaultDifficulty || 'MEDIUM',
        dynamicDifficulty: dynamicDifficulty !== false,
        generationMode: 'AI',
        questionSource: 'GENERATED',
        naturalLanguagePrompt: naturalLanguagePrompt || undefined,
        generationStatus: 'GENERATING',
        isPublic: true,
      });

      // Start question generation asynchronously
      AssessmentGenerationService.generateQuestions(
        assessment._id.toString(),
        assessment.skills,
        assessment.totalQuestions,
        undefined,
        description,
        naturalLanguagePrompt,
        defaultDifficulty || 'MIXED'
      ).catch((err) => console.error('[Async Question Generation Error]', err));

      await AuditService.log({
        userId: recruiterId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'ASSESSMENT_CREATED',
        resource: 'Assessment',
        resourceId: assessment._id.toString(),
        metadata: { title: assessment.title, skills: assessment.skills, totalQuestions: qCount },
      });

      res.status(201).json({
        success: true,
        message: 'Assessment configured. Question generation initiated.',
        assessment: {
          id: assessment._id,
          assessmentType: assessment.assessmentType,
          title: assessment.title,
          generationStatus: assessment.generationStatus,
          totalQuestions: assessment.totalQuestions,
          skills: assessment.skills,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single assessment configuration
   */
  public static async getAssessmentById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const assessment = await Assessment.findById(id);

      if (!assessment) {
        res.status(404).json({ success: false, message: 'Assessment not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        assessment: {
          id: assessment._id,
          assessmentType: assessment.assessmentType || 'RECRUITER_ROOM',
          resumeId: assessment.resumeId,
          candidateId: assessment.candidateId,
          title: assessment.title,
          description: assessment.description,
          skills: assessment.skills,
          totalQuestions: assessment.totalQuestions,
          generatedCount: assessment.generatedCount ?? assessment.totalQuestions,
          durationMinutes: assessment.durationMinutes,
          defaultDifficulty: assessment.defaultDifficulty,
          dynamicDifficulty: assessment.dynamicDifficulty,
          generationMode: assessment.generationMode || 'AI',
          questionSource: assessment.questionSource || 'GENERATED',
          generationStatus: assessment.generationStatus,
          generationError: assessment.generationError,
          createdAt: assessment.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger question generation / retry (Recruiter or Candidate who owns a RESUME_BASED assessment)
   */
  public static async generateQuestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const assessment = await Assessment.findById(id);

      if (!assessment) {
        res.status(404).json({ success: false, message: 'Assessment not found.' });
        return;
      }

      if (
        userRole === 'CANDIDATE' &&
        assessment.candidateId?.toString() !== userId
      ) {
        res.status(403).json({ success: false, message: 'Unauthorized to regenerate this assessment.' });
        return;
      }

      assessment.generationStatus = 'GENERATING';
      assessment.generatedCount = 0;
      await assessment.save();

      // Start generation
      const genResult = await AssessmentGenerationService.generateQuestions(
        assessment._id.toString(),
        assessment.skills,
        assessment.totalQuestions,
        undefined,
        assessment.description,
        assessment.naturalLanguagePrompt,
        assessment.defaultDifficulty
      );
      const count = genResult.count;

      const updated = await Assessment.findById(id);

      res.status(200).json({
        success: true,
        message:
          updated?.generationStatus === 'FALLBACK_READY'
            ? 'AI question generation is temporarily unavailable. A technical question set has been prepared using the available skill profile.'
            : `Successfully generated ${count} questions.`,
        generationStatus: updated?.generationStatus || 'READY',
        totalQuestions: count,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Question generation failed. Retry available.',
        generationStatus: 'FAILED',
      });
    }
  }

  /**
   * Get questions for an assessment
   * Candidates do NOT receive correct answers or explanations!
   */
  public static async getQuestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;

      const questions = await AssessmentQuestion.find({ assessmentId: id });

      if (userRole === 'CANDIDATE') {
        // Strip correct answer and explanation for candidates
        const safe = questions.map((q, idx) => ({
          id: q._id,
          questionId: q._id,
          index: idx + 1,
          skill: q.skill,
          topic: q.topic || q.skill,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options,
        }));
        res.status(200).json({ success: true, questions: safe });
      } else {
        // Full view for recruiter/admin
        res.status(200).json({ success: true, questions });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Assessment
   */
  public static async deleteAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await Assessment.findByIdAndDelete(id);
      await AssessmentQuestion.deleteMany({ assessmentId: id });

      res.status(200).json({ success: true, message: 'Assessment deleted.' });
    } catch (error) {
      next(error);
    }
  }
}
