import { Schema, model, Document } from 'mongoose';
import { IVerificationScore } from '../types';

export interface IVerificationReportDocument extends Omit<IVerificationScore, 'overallScore'>, Document {
  candidateId: string;
  resumeId: string;
  overallScore: number;
  trustScore?: number;
  evidenceScore: number;
  assessmentScore: number;
  consistencyScore: number;
  positiveFactors: string[];
  limitations: string[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationReportSchema = new Schema<IVerificationReportDocument>(
  {
    candidateId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Resume',
      required: false,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    evidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assessmentScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    consistencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    positiveFactors: {
      type: [String],
      default: [],
    },
    limitations: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

VerificationReportSchema.index({ candidateId: 1, resumeId: 1 }, { unique: true });

export const VerificationReport = model<IVerificationReportDocument>('VerificationReport', VerificationReportSchema);
