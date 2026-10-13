import { Schema, model, Document } from 'mongoose';
import { IVectorDocument } from '../types';

export interface IVectorDocumentDoc extends Omit<IVectorDocument, '_id'>, Document {}

const VectorDocumentSchema = new Schema<IVectorDocumentDoc>(
  {
    documentId: {
      type: Schema.Types.ObjectId as any,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Resume',
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Job',
      index: true,
    },
    chunkId: {
      type: String,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['resume', 'job', 'skill'],
      required: true,
      index: true,
    },
    section: {
      type: String,
      enum: [
        'personalInfo',
        'summary',
        'education',
        'experience',
        'projects',
        'skills',
        'certifications',
        'responsibilities',
        'requirements',
        'other',
      ],
      required: true,
      index: true,
    },
    skill: {
      type: String,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    contentHash: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast top-K and section filtering
VectorDocumentSchema.index({ documentType: 1, userId: 1 });
VectorDocumentSchema.index({ documentType: 1, jobId: 1 });
VectorDocumentSchema.index({ resumeId: 1, section: 1 });

export const VectorDocument = model<IVectorDocumentDoc>('VectorDocument', VectorDocumentSchema);
