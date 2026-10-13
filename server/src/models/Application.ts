import { Schema, model, Document } from 'mongoose';

export type ApplicationStatus = 'APPLIED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';
export type MatchStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface IMatchBreakdown {
  overallMatch: number;
  skillAlignment: number;
  experienceAlignment: number;
  educationAlignment: number;
  projectRelevance: number;
  technologyAlignment: number;
}

export interface IApplication {
  _id?: string;
  candidateId: string;
  recruiterId: string;
  jobId: string;
  resumeId: string;
  status: ApplicationStatus;
  matchStatus: MatchStatus;
  matchScore?: number;
  matchBreakdown?: IMatchBreakdown;
  matchingSkills?: string[];
  missingRequiredSkills?: string[];
  matchingProjects?: string[];
  matchExplanation?: string;
  isStarred?: boolean;
  isShortlisted?: boolean;
  invitationStatus?: 'NOT_INVITED' | 'INVITED' | 'STARTED' | 'COMPLETED' | 'EXPIRED';
  assessmentInvitationId?: string;
  recruiterNotes?: string;
  appliedAt?: Date;
  updatedAt?: Date;
}

export interface IApplicationDocument extends Omit<IApplication, '_id'>, Document {}

const MatchBreakdownSchema = new Schema(
  {
    overallMatch: { type: Number, default: 0 },
    skillAlignment: { type: Number, default: 0 },
    experienceAlignment: { type: Number, default: 0 },
    educationAlignment: { type: Number, default: 0 },
    projectRelevance: { type: Number, default: 0 },
    technologyAlignment: { type: Number, default: 0 },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    candidateId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Job',
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Resume',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'SELECTED'],
      default: 'APPLIED',
      index: true,
    },
    matchStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    matchScore: {
      type: Number,
      default: 0,
    },
    matchBreakdown: {
      type: MatchBreakdownSchema,
    },
    matchingSkills: {
      type: [String],
      default: [],
    },
    missingRequiredSkills: {
      type: [String],
      default: [],
    },
    matchingProjects: {
      type: [String],
      default: [],
    },
    matchExplanation: {
      type: String,
      default: '',
    },
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
    },
    isShortlisted: {
      type: Boolean,
      default: false,
      index: true,
    },
    invitationStatus: {
      type: String,
      enum: ['NOT_INVITED', 'INVITED', 'STARTED', 'COMPLETED', 'EXPIRED'],
      default: 'NOT_INVITED',
      index: true,
    },
    assessmentInvitationId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AssessmentInvitation',
      required: false,
      default: null,
    },
    recruiterNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' },
  }
);

// Prevent duplicate applications by same candidate to same job
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const Application = model<IApplicationDocument>('Application', ApplicationSchema);
