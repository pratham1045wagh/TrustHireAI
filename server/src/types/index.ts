import { Request } from 'express';

export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  companyName?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
}

export interface IPersonalInfo {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
}

export interface ISkillsCategory {
  programmingLanguages: string[];
  frameworks: string[];
  libraries: string[];
  databases: string[];
  tools: string[];
  cloud: string[];
  other: string[];
}

export interface IEducation {
  degree: string | null;
  institution: string | null;
  field: string | null;
  startYear: string | null;
  endYear: string | null;
  grade: string | null;
}

export interface IExperience {
  company: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string[];
}

export interface IProject {
  name: string | null;
  description: string | null;
  technologies: string[];
  role: string | null;
  duration: string | null;
}

export interface ICertification {
  name: string | null;
  issuer: string | null;
  date: string | null;
}

export interface IResumeAnalysis {
  personalInfo: IPersonalInfo;
  summary: string | null;
  aiExecutiveSummary?: string | null;
  ai_executive_summary?: string | null;
  skills: ISkillsCategory;
  education: IEducation[];
  experience: IExperience[];
  projects: IProject[];
  certifications: ICertification[];
}

export type ResumeStatus = 'UPLOADING' | 'PARSING' | 'ANALYZING' | 'INDEXING' | 'ANALYZED' | 'FAILED';

export interface IResume {
  _id?: string;
  userId: string;
  originalFileName: string;
  fileSize: number;
  filePath: string;
  mimeType?: string;
  status: ResumeStatus;
  extractedText?: string;
  contentHash?: string;
  analysis?: IResumeAnalysis;
  resumeEvidenceScore?: number | null;
  assessmentPerformanceScore?: number | null;
  consistencyAlignmentScore?: number | null;
  trustScore?: number | null;
  assessmentStatus?: 'NOT_TAKEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  latestAssessmentSessionId?: string | null;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Vector & RAG Types
export type DocumentSection =
  | 'personalInfo'
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'responsibilities'
  | 'requirements'
  | 'other';

export interface IVectorDocument {
  _id?: string;
  documentId: string;
  userId?: string;
  resumeId?: string;
  jobId?: string;
  chunkId: string;
  documentType: 'resume' | 'job' | 'skill';
  section: DocumentSection;
  skill?: string;
  text: string;
  embedding: number[];
  contentHash?: string;
  sourceType?: string;
  skills?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
}

// Skill Evidence Mapping & Verification Types
export type SkillProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type SkillVerificationStatus = 'CLAIMED' | 'EVIDENCE_FOUND' | 'PARTIALLY_SUPPORTED' | 'NEEDS_ASSESSMENT' | 'VERIFIED' | 'NEEDS_REVIEW';

export interface ISkillEvidence {
  sourceType: 'PROJECT' | 'EXPERIENCE' | 'WORK_EXPERIENCE' | 'CERTIFICATION' | 'SUMMARY' | 'EDUCATION' | 'SKILLS_ONLY';
  sourceTitle: string;
  snippet: string;
  relevanceScore: number;
  semanticScore?: number;
  keywordScore?: number;
  sourceScore?: number;
}

export interface ISkillVerificationItem {
  skill: string;
  claimedLevel: SkillProficiencyLevel;
  confidence: number;
  status: SkillVerificationStatus;
  evidence: ISkillEvidence[];
  assessmentScore?: number;
  verificationLevel?: 'Strong' | 'Moderate' | 'Needs Review' | 'Unverified';
  notes?: string;
  credRagScore?: number;
  semanticScore?: number;
  keywordScore?: number;
  sourceScore?: number;
  diversityScore?: number;
  credibilityConfidence?: number;
  explanation?: string;
}

export interface IVerificationScore {
  overallScore: number; // 0-100
  evidenceScore: number; // 0-100 (30% weight default)
  assessmentScore: number; // 0-100 (50% weight default)
  consistencyScore: number; // 0-100 (20% weight default)
  positiveFactors: string[];
  limitations: string[];
  summary: string;
}

// Assessment Types
export type AssessmentType = 'RESUME_BASED' | 'RECRUITER_ROOM';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AssessmentStatus = 'QUEUED' | 'GENERATING' | 'READY' | 'FALLBACK_READY' | 'FAILED' | 'EXPIRED';
export type AssessmentSessionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface IAssessmentQuestion {
  _id?: string;
  assessmentId: string;
  skill: string;
  topic?: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: string[];
  correctAnswer?: number; // 0-3 (kept secret from candidate)
  explanation?: string;
}

export interface IAssessmentAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  difficulty: QuestionDifficulty;
  skill: string;
  answeredAt: Date;
}

export interface IAssessmentSession {
  _id?: string;
  candidateId: string;
  assessmentId: string;
  assessmentType?: AssessmentType;
  resumeId?: string;
  roomId?: string;
  startedAt?: Date;
  durationMs?: number;
  expiresAt?: Date;
  submittedAt?: Date;
  status: AssessmentSessionStatus;
  currentQuestionIndex: number;
  currentDifficulty: QuestionDifficulty;
  questions: string[]; // references
  answers: IAssessmentAnswer[];
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  skillScores: Record<string, { total: number; correct: number; percentage: number }>;
  difficultyPerformance: Record<QuestionDifficulty, { total: number; correct: number; percentage: number }>;
  proctoringSummary: {
    totalEvents: number;
    tabSwitches: number;
    fullscreenExits: number;
    cameraInterruptions: number;
    copyPasteAttempts: number;
    rightClicks: number;
    multipleFaces?: number;
    faceNotDetected?: number;
    humanSpeech?: number;
    microphoneInterruptions?: number;
    integrityIndicator: 'High' | 'Moderate' | 'Review Recommended';
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Proctoring Types
export type ProctoringEventType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CUT_ATTEMPT'
  | 'RIGHT_CLICK'
  | 'CAMERA_INTERRUPTED'
  | 'CAMERA_INTERRUPTION'
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'MICROPHONE_INTERRUPTED'
  | 'MICROPHONE_INTERRUPTION'
  | 'HUMAN_SPEECH_DETECTED'
  | 'NETWORK_DISCONNECT'
  | 'TIME_WARNING'
  | 'ASSESSMENT_TIMEOUT';

export type EventSeverity = 'INFO' | 'WARNING' | 'HIGH';

export interface IProctoringEvent {
  _id?: string;
  sessionId: string;
  candidateId: string;
  eventType: ProctoringEventType;
  timestamp: Date;
  startedAt?: Date;
  endedAt?: Date;
  durationMs?: number;
  durationSeconds?: number;
  metadata?: Record<string, any>;
  severity: EventSeverity;
  evidenceSnapshot?: string;
  resolved: boolean;
  description: string;
}

export interface IAssessmentSnapshot {
  _id?: string;
  sessionId: string;
  candidateId: string;
  timestamp: Date;
  imageFileName: string;
  eventContext?: string;
}

// Audit Log Types
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'RESUME_UPLOAD'
  | 'RESUME_ANALYSIS'
  | 'EMBEDDING_CREATED'
  | 'JD_CREATED'
  | 'JD_ANALYZED'
  | 'APPLICATION_CREATED'
  | 'ASSESSMENT_CREATED'
  | 'ASSESSMENT_STARTED'
  | 'ASSESSMENT_ANSWERED'
  | 'ASSESSMENT_SUBMITTED'
  | 'PROCTORING_EVENT'
  | 'REPORT_VIEWED'
  | 'CANDIDATE_SHORTLISTED'
  | 'RESUME_RETRY'
  | 'ADMIN_ACTION';

export interface IAuditLog {
  _id?: string;
  userId?: string;
  userEmail?: string;
  role?: UserRole;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}
