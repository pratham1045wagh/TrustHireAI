import { Schema, model, Document } from 'mongoose';
import { ISkillEvidence, SkillProficiencyLevel, SkillVerificationStatus } from '../types';

export interface ISkillEvidenceDocument extends Document {
  candidateId: string;
  resumeId: string;
  skill: string;
  claimedLevel: SkillProficiencyLevel;
  confidence: number;
  status: SkillVerificationStatus;
  evidence: ISkillEvidence[];
  assessmentScore?: number;
  verificationLevel?: 'Strong' | 'Moderate' | 'Needs Review' | 'Unverified';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SkillEvidenceItemSchema = new Schema(
  {
    sourceType: {
      type: String,
      enum: ['PROJECT', 'EXPERIENCE', 'CERTIFICATION', 'SUMMARY', 'EDUCATION'],
      required: true,
    },
    sourceTitle: { type: String, required: true },
    snippet: { type: String, required: true },
    relevanceScore: { type: Number, default: 80 },
  },
  { _id: false }
);

const SkillEvidenceSchema = new Schema<ISkillEvidenceDocument>(
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
      required: true,
      index: true,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    claimedLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate',
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 75,
    },
    status: {
      type: String,
      enum: [
        'CLAIMED',
        'EVIDENCE_FOUND',
        'PARTIALLY_SUPPORTED',
        'NEEDS_ASSESSMENT',
        'VERIFIED',
        'NEEDS_REVIEW',
      ],
      default: 'CLAIMED',
    },
    evidence: {
      type: [SkillEvidenceItemSchema],
      default: [],
    },
    assessmentScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    verificationLevel: {
      type: String,
      enum: ['Strong', 'Moderate', 'Needs Review', 'Unverified'],
      default: 'Unverified',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

SkillEvidenceSchema.index({ candidateId: 1, resumeId: 1, skill: 1 }, { unique: true });

export const SkillEvidence = model<ISkillEvidenceDocument>('SkillEvidence', SkillEvidenceSchema);
