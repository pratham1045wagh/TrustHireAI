import { Schema, model, Document } from 'mongoose';
import { QuestionDifficulty } from '../types';

export interface IAssessmentQuestionDocument extends Document {
  assessmentId: string;
  skill: string;
  topic?: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3 index
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentQuestionSchema = new Schema<IAssessmentQuestionDocument>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.length === 4,
        'Assessment question must have exactly 4 options',
      ],
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

AssessmentQuestionSchema.index({ assessmentId: 1, difficulty: 1 });

export const AssessmentQuestion = model<IAssessmentQuestionDocument>(
  'AssessmentQuestion',
  AssessmentQuestionSchema
);
