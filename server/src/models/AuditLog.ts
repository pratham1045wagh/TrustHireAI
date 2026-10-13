import { Schema, model, Document } from 'mongoose';
import { IAuditLog, AuditAction } from '../types';

export interface IAuditLogDocument extends Omit<IAuditLog, '_id'>, Document {}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      index: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['CANDIDATE', 'RECRUITER', 'ADMIN'],
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = model<IAuditLogDocument>('AuditLog', AuditLogSchema);
