import { Schema, model, Document, Types } from 'mongoose';
import { IResume } from '../types';

export interface IResumeDocument extends Omit<IResume, '_id'>, Document {}

const PersonalInfoSchema = new Schema(
  {
    fullName: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    location: { type: String, default: null },
    linkedin: { type: String, default: null },
    github: { type: String, default: null },
    portfolio: { type: String, default: null },
  },
  { _id: false }
);

const SkillsCategorySchema = new Schema(
  {
    programmingLanguages: { type: [String], default: [] },
    frameworks: { type: [String], default: [] },
    libraries: { type: [String], default: [] },
    databases: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    cloud: { type: [String], default: [] },
    other: { type: [String], default: [] },
  },
  { _id: false }
);

const EducationSchema = new Schema(
  {
    degree: { type: String, default: null },
    institution: { type: String, default: null },
    field: { type: String, default: null },
    startYear: { type: String, default: null },
    endYear: { type: String, default: null },
    grade: { type: String, default: null },
  },
  { _id: false }
);

const ExperienceSchema = new Schema(
  {
    company: { type: String, default: null },
    role: { type: String, default: null },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    description: { type: [String], default: [] },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    name: { type: String, default: null },
    description: { type: String, default: null },
    technologies: { type: [String], default: [] },
    role: { type: String, default: null },
    duration: { type: String, default: null },
  },
  { _id: false }
);

const CertificationSchema = new Schema(
  {
    name: { type: String, default: null },
    issuer: { type: String, default: null },
    date: { type: String, default: null },
  },
  { _id: false }
);

const ResumeAnalysisSchema = new Schema(
  {
    personalInfo: { type: PersonalInfoSchema, required: true },
    summary: { type: String, default: null },
    skills: { type: SkillsCategorySchema, required: true },
    education: { type: [EducationSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
  },
  { _id: false }
);

const ResumeSchema = new Schema<IResumeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    status: {
      type: String as any,
      enum: ['UPLOADING', 'PARSING', 'ANALYZING', 'INDEXING', 'PROCESSING', 'ANALYZED', 'FAILED'],
      default: 'PROCESSING',
    },
    extractedText: {
      type: String,
    },
    analysis: {
      type: ResumeAnalysisSchema,
    },
    resumeEvidenceScore: {
      type: Number,
      default: null,
    },
    assessmentPerformanceScore: {
      type: Number,
      default: null,
    },
    consistencyAlignmentScore: {
      type: Number,
      default: null,
    },
    trustScore: {
      type: Number,
      default: null,
    },
    assessmentStatus: {
      type: String,
      enum: ['NOT_TAKEN', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'NOT_TAKEN',
    },
    latestAssessmentSessionId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AssessmentSession',
      default: null,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Resume = model<IResumeDocument>('Resume', ResumeSchema);
