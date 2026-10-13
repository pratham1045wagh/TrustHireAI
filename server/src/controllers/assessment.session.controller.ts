import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AssessmentSessionService } from '../services/assessment.session.service';
import { AssessmentSession } from '../models/AssessmentSession';
import { AssessmentQuestion } from '../models/AssessmentQuestion';
import { AuditService } from '../services/audit.service';

export class AssessmentSessionController {
  /**
   * Start or resume an assessment session
   */
  public static async startSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const { assessmentId, roomId, resumeId } = req.body;

      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (!assessmentId) {
        res.status(400).json({ success: false, message: 'Assessment ID is required.' });
        return;
      }

      const result = await AssessmentSessionService.startSession(
        candidateId,
        assessmentId,
        roomId,
        resumeId
      );

      await AuditService.log({
        userId: candidateId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'ASSESSMENT_STARTED',
        resource: 'AssessmentSession',
        resourceId: result.session._id.toString(),
        metadata: {
          assessmentId,
          roomId,
          resumeId: result.session.resumeId,
          assessmentType: result.session.assessmentType,
        },
      });

      res.status(200).json({
        success: true,
        session: {
          id: result.session._id,
          assessmentId: result.session.assessmentId,
          assessmentType: result.session.assessmentType,
          resumeId: result.session.resumeId,
          roomId: result.session.roomId,
          status: result.session.status,
          totalQuestions: result.session.totalQuestions,
          currentQuestionIndex: result.session.currentQuestionIndex,
          currentDifficulty: result.session.currentDifficulty,
          startedAt: result.session.startedAt,
          durationMs: result.session.durationMs,
          expiresAt: result.session.expiresAt,
          remainingSeconds: result.remainingSeconds,
          existingAnswers: (result.session.answers || []).map((a) => ({
            questionId: a.questionId,
            selectedOption: a.selectedOption,
          })),
        },
        currentQuestion: result.currentQuestion,
        questionsList: result.questionsList,
        questions: result.questionsList,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to start assessment session.' });
    }
  }

  /**
   * Answer a question with dynamic difficulty adaptation
   */
  public static async answerQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const { id: sessionId } = req.params;
      const { questionId, selectedOption, timeSpentSeconds, autoAdvance } = req.body;

      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (typeof selectedOption !== 'number' || !questionId) {
        res.status(400).json({ success: false, message: 'Question ID and selectedOption are required.' });
        return;
      }

      const result = await AssessmentSessionService.answerQuestion(
        sessionId,
        candidateId,
        questionId,
        selectedOption,
        Number(timeSpentSeconds) || 0,
        autoAdvance !== false
      );

      res.status(200).json({
        success: true,
        isComplete: result.isComplete,
        nextQuestion: result.nextQuestion,
        remainingSeconds: result.remainingSeconds,
        currentDifficulty: result.currentDifficulty,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to process answer.' });
    }
  }

  /**
   * Submit assessment session (supports optional batch answers array)
   */
  public static async submitSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const { id: sessionId } = req.params;
      const { answers } = req.body || {};

      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const session = await AssessmentSessionService.submitSession(
        sessionId,
        candidateId,
        false,
        Array.isArray(answers) ? answers : undefined
      );

      await AuditService.log({
        userId: candidateId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'ASSESSMENT_SUBMITTED',
        resource: 'AssessmentSession',
        resourceId: sessionId,
        metadata: {
          score: session.percentage,
          total: session.totalQuestions,
          assessmentType: session.assessmentType,
          resumeId: session.resumeId,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Assessment submitted successfully.',
        session: {
          id: session._id,
          assessmentType: session.assessmentType,
          resumeId: session.resumeId,
          status: session.status,
          score: session.score,
          percentage: session.percentage,
          totalQuestions: session.totalQuestions,
          correctAnswers: session.correctAnswers,
          incorrectAnswers: session.incorrectAnswers,
          skippedAnswers: session.skippedAnswers,
          timeTakenSeconds: session.timeTakenSeconds,
          skillScores: session.skillScores,
          difficultyPerformance: session.difficultyPerformance,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to submit assessment.' });
    }
  }

  /**
   * Get session status and live remaining server-enforced seconds
   */
  public static async getSessionStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await AssessmentSession.findById(id).populate(
        'assessmentId',
        'title durationMinutes skills assessmentType resumeId'
      );

      if (!session) {
        res.status(404).json({ success: false, message: 'Assessment session not found.' });
        return;
      }

      const now = new Date();
      let remainingSeconds = 0;
      if (session.expiresAt && session.status === 'IN_PROGRESS') {
        remainingSeconds = Math.max(0, Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000));
        if (remainingSeconds === 0 && session.status === 'IN_PROGRESS') {
          await AssessmentSessionService.submitSession(
            session._id.toString(),
            session.candidateId.toString(),
            true
          );
          session.status = 'AUTO_SUBMITTED';
        }
      }

      // Fetch sanitized question list for session
      const questionDocs = await AssessmentQuestion.find({
        _id: { $in: session.questions },
      }).select('_id skill topic difficulty question options');

      const qMap = new Map<string, any>();
      for (const q of questionDocs) {
        qMap.set(q._id.toString(), q);
      }

      const questionsList = session.questions
        .map((qId, idx) => {
          const qDoc = qMap.get(qId.toString());
          if (!qDoc) return null;
          return {
            id: qDoc._id,
            questionId: qDoc._id,
            questionNumber: idx + 1,
            totalQuestions: session.totalQuestions,
            skill: qDoc.skill,
            topic: qDoc.topic || qDoc.skill,
            difficulty: qDoc.difficulty,
            question: qDoc.question,
            options: qDoc.options,
          };
        })
        .filter(Boolean);

      const currentQuestion =
        questionsList[session.currentQuestionIndex] || questionsList[0] || null;

      res.status(200).json({
        success: true,
        session: {
          id: session._id,
          assessmentType: session.assessmentType,
          resumeId: session.resumeId,
          roomId: session.roomId,
          status: session.status,
          currentQuestionIndex: session.currentQuestionIndex,
          totalQuestions: session.totalQuestions,
          currentDifficulty: session.currentDifficulty,
          remainingSeconds,
          startedAt: session.startedAt,
          durationMs: session.durationMs,
          expiresAt: session.expiresAt,
          assessment: session.assessmentId,
          existingAnswers: (session.answers || []).map((a) => ({
            questionId: a.questionId,
            selectedOption: a.selectedOption,
          })),
        },
        currentQuestion,
        questionsList,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed assessment report
   */
  public static async getSessionReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await AssessmentSession.findById(id)
        .populate('assessmentId', 'title skills totalQuestions durationMinutes assessmentType resumeId')
        .populate('candidateId', 'name email');

      if (!session) {
        res.status(404).json({ success: false, message: 'Session report not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        report: {
          sessionId: session._id,
          assessmentType: session.assessmentType,
          resumeId: session.resumeId,
          candidate: session.candidateId,
          assessment: session.assessmentId,
          status: session.status,
          score: session.score,
          percentage: session.percentage,
          totalQuestions: session.totalQuestions,
          correctAnswers: session.correctAnswers,
          incorrectAnswers: session.incorrectAnswers,
          skippedAnswers: session.skippedAnswers,
          timeTakenSeconds: session.timeTakenSeconds,
          skillScores: session.skillScores,
          difficultyPerformance: session.difficultyPerformance,
          proctoringSummary: session.proctoringSummary,
          startedAt: session.startedAt,
          submittedAt: session.submittedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List candidate's assessment sessions
   */
  public static async getMySessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const sessions = await AssessmentSession.find({ candidateId })
        .populate('assessmentId', 'title skills durationMinutes assessmentType resumeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        sessions: sessions.map((s) => ({
          id: s._id,
          assessmentId: (s.assessmentId as any)?._id || s.assessmentId,
          assessmentTitle: (s.assessmentId as any)?.title || 'Assessment',
          assessmentType: s.assessmentType || (s.assessmentId as any)?.assessmentType || 'RESUME_BASED',
          resumeId: s.resumeId || (s.assessmentId as any)?.resumeId,
          roomId: s.roomId,
          status: s.status,
          percentage: s.percentage,
          score: s.score,
          totalQuestions: s.totalQuestions,
          correctAnswers: s.correctAnswers,
          incorrectAnswers: s.incorrectAnswers,
          skippedAnswers: s.skippedAnswers,
          skillScores: s.skillScores,
          difficultyPerformance: s.difficultyPerformance,
          timeTakenSeconds: s.timeTakenSeconds,
          submittedAt: s.submittedAt,
          createdAt: s.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}
