import { Schema, model, Document } from 'mongoose';

export type AssessmentInvitationStatus = 'INVITED' | 'STARTED' | 'COMPLETED' | 'EXPIRED';

export interface IAssessmentInvitationDocument extends Document {
  candidateId: string;
  applicationId: string;
  jobId: string;
  assessmentRoomId: string;
  invitedBy: string;
  status: AssessmentInvitationStatus;
  invitedAt: Date;
  expiresAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentInvitationSchema = new Schema<IAssessmentInvitationDocument>(
  {
    candidateId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Application',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Job',
      required: true,
      index: true,
    },
    assessmentRoomId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AssessmentRoom',
      required: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['INVITED', 'STARTED', 'COMPLETED', 'EXPIRED'],
      default: 'INVITED',
      index: true,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active invitations for the same candidate and room
AssessmentInvitationSchema.index({ candidateId: 1, assessmentRoomId: 1 }, { unique: true });

export const AssessmentInvitation = model<IAssessmentInvitationDocument>(
  'AssessmentInvitation',
  AssessmentInvitationSchema
);
