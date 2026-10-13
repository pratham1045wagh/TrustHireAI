import { Schema, model, Document } from 'mongoose';
import { QuestionDifficulty, AssessmentStatus, AssessmentType } from '../types';

export interface IAssessmentDocument extends Document {
  assessmentType: AssessmentType;
  resumeId?: string;
  candidateId?: string;
  recruiterId?: string;
  jobId?: string;
  title: string;
  description?: string;
  skills: string[];
  totalQuestions: number;
  generatedCount: number;
  durationMinutes: number;
  defaultDifficulty: QuestionDifficulty;
  dynamicDifficulty: boolean;
  generationMode: 'AI' | 'PDF';
  questionSource: 'GENERATED' | 'UPLOADED_PDF' | 'FALLBACK';
  naturalLanguagePrompt?: string;
  isPublic: boolean;
  generationStatus: AssessmentStatus;
  generationError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessmentDocument>(
  {
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
    candidateId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      index: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Job',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      required: [true, 'At least one skill is required'],
      default: [],
    },
    totalQuestions: {
      type: Number,
      default: 20,
      min: 1,
      max: 100,
    },
    generatedCount: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: 5,
      max: 180,
    },
    defaultDifficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    dynamicDifficulty: {
      type: Boolean,
      default: true,
    },
    generationMode: {
      type: String,
      enum: ['AI', 'PDF'],
      default: 'AI',
    },
    questionSource: {
      type: String,
      enum: ['GENERATED', 'UPLOADED_PDF', 'FALLBACK'],
      default: 'GENERATED',
    },
    naturalLanguagePrompt: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    generationStatus: {
      type: String,
      enum: ['QUEUED', 'GENERATING', 'READY', 'FALLBACK_READY', 'FAILED', 'EXPIRED'],
      default: 'READY',
      index: true,
    },
    generationError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Assessment = model<IAssessmentDocument>('Assessment', AssessmentSchema);
