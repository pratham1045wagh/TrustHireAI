import { Schema, model, Document } from 'mongoose';
import { IAssessmentSnapshot } from '../types';

export interface IAssessmentSnapshotDocument extends Omit<IAssessmentSnapshot, '_id'>, Document {}

const AssessmentSnapshotSchema = new Schema<IAssessmentSnapshotDocument>(
  {
    sessionId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AssessmentSession',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    imageFileName: {
      type: String,
      required: true,
    },
    eventContext: {
      type: String,
      default: 'Periodic webcam integrity snapshot',
    },
  },
  {
    timestamps: true,
  }
);

AssessmentSnapshotSchema.index({ sessionId: 1, timestamp: 1 });

export const AssessmentSnapshot = model<IAssessmentSnapshotDocument>(
  'AssessmentSnapshot',
  AssessmentSnapshotSchema
);
