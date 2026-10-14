import { Schema, model, Document } from 'mongoose';
import {
  AssessmentSessionStatus,
  QuestionDifficulty,
  IAssessmentAnswer,
  AssessmentType,
} from '../types';

export interface IAssessmentSessionDocument extends Document {
  candidateId: string;
  assessmentId: string;
  assessmentType: AssessmentType;
  resumeId?: string;
  roomId?: string;
  startedAt?: Date;
  durationMs?: number;
  expiresAt?: Date;
  submittedAt?: Date;
  status: AssessmentSessionStatus;
  currentQuestionIndex: number;
  currentDifficulty: QuestionDifficulty;
  questions: string[];
  answers: IAssessmentAnswer[];
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  skillScores: Record<string, { total: number; correct: number; percentage: number }>;
  difficultyPerformance: Record<QuestionDifficulty, { total: number; correct: number; percentage: number }>;
  proctoringSummary: {
    totalEvents: number;
    tabSwitches: number;
    fullscreenExits: number;
    cameraInterruptions: number;
    copyPasteAttempts: number;
    rightClicks: number;
    multipleFaces?: number;
    faceNotDetected?: number;
    humanSpeech?: number;
    microphoneInterruptions?: number;
    integrityIndicator: 'High' | 'Moderate' | 'Review Recommended';
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AssessmentQuestion',
      required: true,
    },
    selectedOption: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      required: true,
    },
    skill: {
      type: String,
      required: true,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AssessmentSessionSchema = new Schema<IAssessmentSessionDocument>(
  {
    candidateId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    assessmentType: {
      type: String,
      enum: ['RESUME_BASED', 'RECRUITER_ROOM'],
      default: 'RECRUITER_ROOM',
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Resume',
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AssessmentRoom',
      index: true,
    },
    startedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        'NOT_STARTED',
        'IN_PROGRESS',
        'SUBMITTED',
        'AUTO_SUBMITTED',
        'EXPIRED',
        'CANCELLED',
      ],
      default: 'NOT_STARTED',
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    currentDifficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    questions: [
      {
        type: Schema.Types.ObjectId as any,
        ref: 'AssessmentQuestion',
      },
    ],
    answers: {
      type: [AnswerSchema],
      default: [],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    incorrectAnswers: {
      type: Number,
      default: 0,
    },
    skippedAnswers: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    skillScores: {
      type: Schema.Types.Mixed,
      default: {},
    },
    difficultyPerformance: {
      type: Schema.Types.Mixed,
      default: {
        EASY: { total: 0, correct: 0, percentage: 0 },
        MEDIUM: { total: 0, correct: 0, percentage: 0 },
        HARD: { total: 0, correct: 0, percentage: 0 },
      },
    },
    proctoringSummary: {
      type: Schema.Types.Mixed,
      default: {
        totalEvents: 0,
        tabSwitches: 0,
        fullscreenExits: 0,
        cameraInterruptions: 0,
        copyPasteAttempts: 0,
        rightClicks: 0,
        multipleFaces: 0,
        faceNotDetected: 0,
        humanSpeech: 0,
        microphoneInterruptions: 0,
        integrityIndicator: 'High',
      },
    },
  },
  {
    timestamps: true,
  }
);

export const AssessmentSession = model<IAssessmentSessionDocument>(
  'AssessmentSession',
  AssessmentSessionSchema
);
