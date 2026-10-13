import { Schema, model, Document, Types } from 'mongoose';

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface IJob {
  _id?: string;
  recruiterId: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  educationRequirements?: string[];
  experienceRequirements?: string[];
  responsibilities?: string[];
  sourceFileName?: string;
  sourceFilePath?: string;
  assessmentRoomId?: string;
  status: JobStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobDocument extends Omit<IJob, '_id'>, Document {}

const JobSchema = new Schema<IJobDocument>(
  {
    recruiterId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentRoomId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AssessmentRoom',
      required: false,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      default: 'Full Time',
    },
    experienceLevel: {
      type: String,
      required: [true, 'Experience level is required'],
      default: '0-2 years',
    },
    salaryRange: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requiredSkills: {
      type: [String],
      required: [true, 'At least one required skill is required'],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    educationRequirements: {
      type: [String],
      default: [],
    },
    experienceRequirements: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    sourceFileName: {
      type: String,
    },
    sourceFilePath: {
      type: String,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
      default: 'PUBLISHED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Job = model<IJobDocument>('Job', JobSchema);
