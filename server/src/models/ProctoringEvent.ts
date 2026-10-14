import { Schema, model, Document } from 'mongoose';
import { IProctoringEvent, ProctoringEventType, EventSeverity } from '../types';

export interface IProctoringEventDocument extends Omit<IProctoringEvent, '_id'>, Document {}

const ProctoringEventSchema = new Schema<IProctoringEventDocument>(
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
    eventType: {
      type: String,
      enum: [
        'TAB_SWITCH',
        'WINDOW_BLUR',
        'FULLSCREEN_EXIT',
        'COPY_ATTEMPT',
        'PASTE_ATTEMPT',
        'CUT_ATTEMPT',
        'RIGHT_CLICK',
        'CAMERA_INTERRUPTED',
        'CAMERA_INTERRUPTION',
        'FACE_NOT_DETECTED',
        'MULTIPLE_FACES_DETECTED',
        'MICROPHONE_INTERRUPTED',
        'MICROPHONE_INTERRUPTION',
        'HUMAN_SPEECH_DETECTED',
        'NETWORK_DISCONNECT',
        'TIME_WARNING',
        'ASSESSMENT_TIMEOUT',
      ],
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    evidenceSnapshot: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'HIGH'],
      default: 'WARNING',
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ProctoringEventSchema.index({ sessionId: 1, timestamp: 1 });

export const ProctoringEvent = model<IProctoringEventDocument>(
  'ProctoringEvent',
  ProctoringEventSchema
);
