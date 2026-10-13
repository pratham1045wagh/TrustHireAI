import { Schema, model, Document } from 'mongoose';

export interface IRoomCandidate {
  candidateId: string;
  name: string;
  email: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score?: number;
  sessionId?: string;
  joinedAt?: Date;
  completedAt?: Date;
}

export interface IAssessmentRoomDocument extends Document {
  roomCode: string;
  assessmentId: string;
  recruiterId: string;
  jobId?: string;
  title: string;
  description?: string;
  skills: string[];
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  generationMode?: 'AI' | 'PDF';
  naturalLanguagePrompt?: string;
  questionSource?: 'GENERATED' | 'UPLOADED_PDF';
  assessmentType?: 'RECRUITER_ROOM';
  durationMinutes: number;
  totalQuestions: number;
  status: 'ACTIVE' | 'CLOSED';
  candidates: IRoomCandidate[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoomCandidateSchema = new Schema(
  {
    candidateId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
    },
    score: { type: Number },
    sessionId: { type: Schema.Types.ObjectId as any, ref: 'AssessmentSession' },
    joinedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: false }
);

const AssessmentRoomSchema = new Schema<IAssessmentRoomDocument>(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    assessmentId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Assessment',
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
      required: false,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD', 'MIXED'],
      default: 'MIXED',
    },
    generationMode: {
      type: String,
      enum: ['AI', 'PDF'],
      default: 'AI',
    },
    naturalLanguagePrompt: {
      type: String,
      default: '',
    },
    questionSource: {
      type: String,
      enum: ['GENERATED', 'UPLOADED_PDF'],
      default: 'GENERATED',
    },
    assessmentType: {
      type: String,
      enum: ['RECRUITER_ROOM'],
      default: 'RECRUITER_ROOM',
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
    totalQuestions: {
      type: Number,
      default: 25,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    candidates: {
      type: [RoomCandidateSchema],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AssessmentRoom = model<IAssessmentRoomDocument>('AssessmentRoom', AssessmentRoomSchema);
