import { AssessmentSession, IAssessmentSessionDocument } from '../models/AssessmentSession';
import { Assessment } from '../models/Assessment';
import { AssessmentQuestion } from '../models/AssessmentQuestion';
import { AssessmentRoom } from '../models/AssessmentRoom';
import { ProctoringEvent } from '../models/ProctoringEvent';
import { VerificationService } from './verification.service';
import { QuestionDifficulty } from '../types';

export class AssessmentSessionService {
  /**
   * Start or resume an assessment session with server-enforced deadline
   */
  public static async startSession(
    candidateId: string,
    assessmentId: string,
    roomId?: string,
    resumeId?: string
  ): Promise<{
    session: IAssessmentSessionDocument;
    currentQuestion: any;
    questionsList: any[];
    remainingSeconds: number;
  }> {
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) throw new Error('Assessment definition not found.');

    let session = await AssessmentSession.findOne({
      candidateId,
      assessmentId,
      status: { $in: ['NOT_STARTED', 'IN_PROGRESS'] },
    });

    const now = new Date();
    const allQuestions = await AssessmentQuestion.find({ assessmentId });
    if (allQuestions.length === 0) {
      throw new Error('No questions available in this assessment yet. Please wait for generation.');
    }

    const questionMap = new Map<string, any>();
    for (const q of allQuestions) {
      questionMap.set(q._id.toString(), q);
    }

    if (!session) {
      // Shuffle question IDs
      const shuffledIds = allQuestions
        .map((q) => q._id.toString())
        .sort(() => Math.random() - 0.5);

      const durationMs = (assessment.durationMinutes || 30) * 60 * 1000;
      const expiresAt = new Date(now.getTime() + durationMs);
      const resolvedType = assessment.assessmentType || (roomId ? 'RECRUITER_ROOM' : 'RESUME_BASED');
      const resolvedResumeId = resumeId || assessment.resumeId;

      session = await AssessmentSession.create({
        candidateId,
        assessmentId,
        assessmentType: resolvedType,
        resumeId: resolvedResumeId,
        roomId,
        startedAt: now,
        durationMs,
        expiresAt,
        status: 'IN_PROGRESS',
        questions: shuffledIds,
        totalQuestions: shuffledIds.length,
        currentQuestionIndex: 0,
        currentDifficulty: assessment.defaultDifficulty || 'MEDIUM',
        answers: [],
      });

      // Update AssessmentRoom candidate entry if present
      if (roomId) {
        await AssessmentRoom.updateOne(
          { _id: roomId, 'candidates.candidateId': candidateId },
          {
            $set: {
              'candidates.$.status': 'IN_PROGRESS',
              'candidates.$.sessionId': session._id,
              'candidates.$.joinedAt': now,
            },
          }
        );
      }
    } else {
      // Existing session: Check if already expired
      if (session.expiresAt && now > session.expiresAt) {
        session.status = 'AUTO_SUBMITTED';
        session.submittedAt = now;
        await session.save();
        await this.calculateSessionScore(session);
        await VerificationService.updateWithAssessment(session);
        throw new Error('Assessment session duration has expired and was auto-submitted.');
      }
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((session.expiresAt!.getTime() - now.getTime()) / 1000)
    );

    // Build sanitized questionsList (NEVER expose correctAnswer or explanation)
    const questionsList = session.questions
      .map((qId, idx) => {
        const qDoc = questionMap.get(qId.toString());
        if (!qDoc) return null;
        return {
          id: qDoc._id,
          questionId: qDoc._id,
          questionNumber: idx + 1,
          totalQuestions: session!.totalQuestions,
          skill: qDoc.skill,
          topic: qDoc.topic || qDoc.skill,
          difficulty: qDoc.difficulty,
          question: qDoc.question,
          options: qDoc.options,
        };
      })
      .filter(Boolean);

    const safeQuestion =
      questionsList[session.currentQuestionIndex] || questionsList[0] || null;

    return {
      session,
      currentQuestion: safeQuestion,
      questionsList,
      remainingSeconds,
    };
  }

  /**
   * Submit an answer to a question and adapt dynamic difficulty
   */
  public static async answerQuestion(
    sessionId: string,
    candidateId: string,
    questionId: string,
    selectedOption: number,
    timeSpentSeconds: number = 0,
    autoAdvance: boolean = true
  ): Promise<{
    isComplete: boolean;
    nextQuestion: any;
    remainingSeconds: number;
    currentDifficulty: QuestionDifficulty;
  }> {
    const session = await AssessmentSession.findOne({ _id: sessionId, candidateId });
    if (!session) throw new Error('Assessment session not found.');

    if (session.status !== 'IN_PROGRESS') {
      throw new Error(`Assessment is not in progress (Status: ${session.status}).`);
    }

    const now = new Date();
    // Validate server timer
    if (session.expiresAt && now > session.expiresAt) {
      await this.submitSession(sessionId, candidateId, true);
      throw new Error('Assessment deadline expired. Answers submitted automatically.');
    }

    const questionDoc = await AssessmentQuestion.findById(questionId);
    if (!questionDoc) throw new Error('Question not found.');

    const isCorrect =
      typeof questionDoc.correctAnswer === 'number' &&
      questionDoc.correctAnswer >= 0 &&
      questionDoc.correctAnswer === selectedOption;

    // Check if already answered
    const existingIndex = session.answers.findIndex((a) => a.questionId.toString() === questionId);
    const answerEntry = {
      questionId,
      selectedOption,
      isCorrect,
      timeSpentSeconds,
      difficulty: questionDoc.difficulty,
      skill: questionDoc.skill,
      answeredAt: now,
    };

    if (existingIndex >= 0) {
      session.answers[existingIndex] = answerEntry;
    } else {
      session.answers.push(answerEntry);
    }

    // Dynamic Difficulty Update
    let newDifficulty = session.currentDifficulty;
    if (isCorrect) {
      if (session.currentDifficulty === 'EASY') newDifficulty = 'MEDIUM';
      else if (session.currentDifficulty === 'MEDIUM') newDifficulty = 'HARD';
    } else {
      if (session.currentDifficulty === 'HARD') newDifficulty = 'MEDIUM';
      else if (session.currentDifficulty === 'MEDIUM') newDifficulty = 'EASY';
    }
    session.currentDifficulty = newDifficulty;

    // Advance question index if sequential
    if (autoAdvance) {
      session.currentQuestionIndex += 1;
    }
    const isComplete = autoAdvance && session.currentQuestionIndex >= session.questions.length;

    await session.save();

    if (isComplete) {
      await this.submitSession(sessionId, candidateId, false);
      return {
        isComplete: true,
        nextQuestion: null,
        remainingSeconds: 0,
        currentDifficulty: newDifficulty,
      };
    }

    // Fetch next safe question
    const nextIdx = Math.min(session.currentQuestionIndex, session.questions.length - 1);
    const nextQId = session.questions[nextIdx];
    const nextDoc = await AssessmentQuestion.findById(nextQId);

    const safeNext = nextDoc
      ? {
          id: nextDoc._id,
          questionId: nextDoc._id,
          questionNumber: nextIdx + 1,
          totalQuestions: session.totalQuestions,
          skill: nextDoc.skill,
          topic: nextDoc.topic || nextDoc.skill,
          difficulty: nextDoc.difficulty,
          question: nextDoc.question,
          options: nextDoc.options,
        }
      : null;

    const remainingSeconds = Math.max(
      0,
      Math.floor((session.expiresAt!.getTime() - now.getTime()) / 1000)
    );

    return {
      isComplete: false,
      nextQuestion: safeNext,
      remainingSeconds,
      currentDifficulty: newDifficulty,
    };
  }

  /**
   * Submit assessment session and finalize scoring and reports
   */
  public static async submitSession(
    sessionId: string,
    candidateId: string,
    isAutoSubmit: boolean = false,
    submittedAnswers?: Array<{ questionId: string; selectedOption: number; timeSpentSeconds?: number }>
  ): Promise<IAssessmentSessionDocument> {
    const session = await AssessmentSession.findOne({ _id: sessionId, candidateId });
    if (!session) throw new Error('Session not found.');

    if (session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED') {
      return session;
    }

    const now = new Date();
    const expired = session.expiresAt && now > session.expiresAt;
    session.status = isAutoSubmit || expired ? 'AUTO_SUBMITTED' : 'SUBMITTED';
    session.submittedAt = now;

    if (session.startedAt) {
      session.timeTakenSeconds = Math.round((now.getTime() - session.startedAt.getTime()) / 1000);
    }

    // If batch answers were submitted from the Previous/Next assessment interface, grade them server-side
    if (Array.isArray(submittedAnswers) && submittedAnswers.length > 0) {
      const questionDocs = await AssessmentQuestion.find({
        _id: { $in: session.questions },
      });
      const qMap = new Map<string, any>();
      for (const q of questionDocs) {
        qMap.set(q._id.toString(), q);
      }

      for (const item of submittedAnswers) {
        if (!item || !item.questionId || typeof item.selectedOption !== 'number' || item.selectedOption < 0) {
          continue;
        }
        const qDoc = qMap.get(String(item.questionId));
        if (!qDoc) continue;

        const isCorrect =
          typeof qDoc.correctAnswer === 'number' &&
          qDoc.correctAnswer >= 0 &&
          qDoc.correctAnswer === item.selectedOption;

        const answerEntry = {
          questionId: qDoc._id.toString(),
          selectedOption: item.selectedOption,
          isCorrect,
          timeSpentSeconds: Number(item.timeSpentSeconds) || 0,
          difficulty: qDoc.difficulty,
          skill: qDoc.skill,
          answeredAt: now,
        };

        const existingIdx = session.answers.findIndex(
          (a) => a.questionId.toString() === qDoc._id.toString()
        );
        if (existingIdx >= 0) {
          session.answers[existingIdx] = answerEntry;
        } else {
          session.answers.push(answerEntry);
        }
      }
    }

    // Compute scores
    await this.calculateSessionScore(session);

    // Synchronize AssessmentRoom status
    if (session.roomId) {
      await AssessmentRoom.updateOne(
        { _id: session.roomId, 'candidates.candidateId': candidateId },
        {
          $set: {
            'candidates.$.status': 'COMPLETED',
            'candidates.$.score': session.percentage,
            'candidates.$.completedAt': now,
          },
        }
      );
    }

    // Propagate verified scores to candidate SkillEvidence and VerificationReport
    await VerificationService.updateWithAssessment(session);

    return session;
  }

  /**
   * Calculate detailed scores, skill-level breakdown, and proctoring summary
   */
  private static async calculateSessionScore(session: IAssessmentSessionDocument): Promise<void> {
    const totalQuestions = session.questions.length;
    let correctCount = 0;
    let incorrectCount = 0;

    const skillScores: Record<string, { total: number; correct: number; percentage: number }> = {};
    const diffScores: Record<QuestionDifficulty, { total: number; correct: number; percentage: number }> = {
      EASY: { total: 0, correct: 0, percentage: 0 },
      MEDIUM: { total: 0, correct: 0, percentage: 0 },
      HARD: { total: 0, correct: 0, percentage: 0 },
    };

    for (const ans of session.answers) {
      if (ans.isCorrect) correctCount++;
      else incorrectCount++;

      // Skill aggregation
      if (!skillScores[ans.skill]) {
        skillScores[ans.skill] = { total: 0, correct: 0, percentage: 0 };
      }
      skillScores[ans.skill].total++;
      if (ans.isCorrect) skillScores[ans.skill].correct++;

      // Difficulty aggregation
      if (diffScores[ans.difficulty]) {
        diffScores[ans.difficulty].total++;
        if (ans.isCorrect) diffScores[ans.difficulty].correct++;
      }
    }

    // Calculate percentages
    for (const k of Object.keys(skillScores)) {
      const item = skillScores[k];
      item.percentage = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    }
    for (const k of ['EASY', 'MEDIUM', 'HARD'] as QuestionDifficulty[]) {
      const item = diffScores[k];
      item.percentage = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    }

    const skippedCount = Math.max(0, totalQuestions - session.answers.length);
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    session.totalQuestions = totalQuestions;
    session.correctAnswers = correctCount;
    session.incorrectAnswers = incorrectCount;
    session.skippedAnswers = skippedCount;
    session.score = correctCount;
    session.percentage = percentage;
    session.skillScores = skillScores;
    session.difficultyPerformance = diffScores;

    // Collate Proctoring Events Summary
    const events = await ProctoringEvent.find({ sessionId: session._id });
    const tabSwitches = events.filter((e) => e.eventType === 'TAB_SWITCH' || e.eventType === 'WINDOW_BLUR').length;
    const fullscreenExits = events.filter((e) => e.eventType === 'FULLSCREEN_EXIT').length;
    const cameraInterruptions = events.filter((e) => e.eventType === 'CAMERA_INTERRUPTED').length;
    const copyPaste = events.filter((e) => ['COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CUT_ATTEMPT'].includes(e.eventType)).length;
    const rightClicks = events.filter((e) => e.eventType === 'RIGHT_CLICK').length;

    let integrityIndicator: 'High' | 'Moderate' | 'Review Recommended' = 'High';
    if (tabSwitches >= 4 || fullscreenExits >= 2 || copyPaste >= 2) {
      integrityIndicator = 'Review Recommended';
    } else if (tabSwitches >= 2 || fullscreenExits >= 1) {
      integrityIndicator = 'Moderate';
    }

    session.proctoringSummary = {
      totalEvents: events.length,
      tabSwitches,
      fullscreenExits,
      cameraInterruptions,
      copyPasteAttempts: copyPaste,
      rightClicks,
      integrityIndicator,
    };

    await session.save();
  }
}
