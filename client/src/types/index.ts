export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  isActive?: boolean;
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
  skills: ISkillsCategory;
  education: IEducation[];
  experience: IExperience[];
  projects: IProject[];
  certifications: ICertification[];
}

export interface IResume {
  id: string;
  _id?: string;
  userId?: string;
  originalFileName: string;
  fileSize: number;
  status: 'UPLOADING' | 'PARSING' | 'ANALYZING' | 'INDEXING' | 'PROCESSING' | 'ANALYZED' | 'FAILED';
  analysis?: IResumeAnalysis;
  resumeEvidenceScore?: number;
  assessmentPerformanceScore?: number | null;
  consistencyAlignmentScore?: number | null;
  trustScore?: number | null;
  assessmentStatus?: 'NOT_TAKEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  latestAssessmentSessionId?: string | null;
  errorMessage?: string;
  createdAt: string;
}

export interface IJob {
  id: string;
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
  responsibilities?: string[];
  assessmentRoomId?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  applicantsCount?: number;
  createdAt: string;
}

export interface IApplication {
  id: string;
  _id?: string;
  candidateId: string;
  recruiterId: string;
  jobId: string;
  resumeId: string;
  status: 'APPLIED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';
  matchStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  matchScore: number;
  matchBreakdown?: {
    overallMatch: number;
    skillAlignment: number;
    experienceAlignment: number;
    educationAlignment: number;
    projectRelevance: number;
    technologyAlignment: number;
  };
  matchingSkills?: string[];
  missingRequiredSkills?: string[];
  matchingProjects?: string[];
  matchExplanation?: string;
  isStarred?: boolean;
  isShortlisted?: boolean;
  invitationStatus?: 'NOT_INVITED' | 'INVITED' | 'STARTED' | 'COMPLETED' | 'EXPIRED';
  assessmentInvitationId?: string;
  recruiterNotes?: string;
  appliedAt: string;
  trustScore?: number | null;
  verificationScore?: number | null;
  evidenceScore?: number | null;
  resumeEvidence?: number | null;
  assessmentScore?: number | null;
  assessmentPerformance?: number | null;
  consistencyScore?: number | null;
  consistencyAlignment?: number | null;
  assessmentStatus?: string;
  latestSessionId?: string | null;
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidate?: any;
  job?: any;
  resume?: any;
}

export interface IAssessmentInvitation {
  id: string;
  _id?: string;
  candidateId: string;
  applicationId: string;
  jobId: string;
  assessmentRoomId: string;
  invitedBy: string;
  status: 'INVITED' | 'STARTED' | 'COMPLETED' | 'EXPIRED';
  invitedAt: string;
}

export type ResumeItem = IResume;
export type JobItem = IJob;
export type ApplicationItem = IApplication;

// V2.0 Skill Evidence Mapping & Verification Types
export type SkillProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type SkillVerificationStatus = 'CLAIMED' | 'EVIDENCE_FOUND' | 'PARTIALLY_SUPPORTED' | 'NEEDS_ASSESSMENT' | 'VERIFIED' | 'NEEDS_REVIEW';

export interface ISkillEvidenceItem {
  sourceType: 'PROJECT' | 'EXPERIENCE' | 'CERTIFICATION' | 'SUMMARY' | 'EDUCATION' | 'SKILLS_ONLY';
  sourceTitle: string;
  snippet: string;
  relevanceScore: number;
  semanticScore?: number;
  keywordScore?: number;
  sourceScore?: number;
}

export interface ISkillEvidence {
  _id?: string;
  candidateId: string;
  resumeId?: string;
  skill: string;
  claimedLevel: SkillProficiencyLevel;
  confidence: number;
  status: SkillVerificationStatus;
  evidence: ISkillEvidenceItem[];
  assessmentScore?: number;
  verificationLevel?: 'Strong' | 'Moderate' | 'Needs Review' | 'Unverified';
  notes?: string;
  credRagScore?: number;
  semanticScore?: number;
  keywordScore?: number;
  sourceScore?: number;
  diversityScore?: number;
  explanation?: string;
}

export interface IVerificationReport {
  _id?: string;
  candidateId: string;
  resumeId?: string;
  overallScore: number;
  trustScore?: number | null;
  evidenceScore: number;
  assessmentScore: number;
  consistencyScore: number;
  positiveFactors: string[];
  limitations: string[];
  summary: string;
}

// V2.5 Assessment Types
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AssessmentType = 'RESUME_BASED' | 'RECRUITER_ROOM';

export interface IAssessment {
  id: string;
  assessmentType?: AssessmentType;
  resumeId?: string;
  candidateId?: string;
  title: string;
  description: string;
  skills: string[];
  totalQuestions: number;
  generatedCount?: number;
  durationMinutes: number;
  defaultDifficulty: QuestionDifficulty;
  dynamicDifficulty: boolean;
  generationMode?: 'AI' | 'PDF';
  questionSource?: 'GENERATED' | 'UPLOADED_PDF' | 'FALLBACK';
  generationStatus: 'QUEUED' | 'GENERATING' | 'READY' | 'FALLBACK_READY' | 'FAILED' | 'EXPIRED';
  generationError?: string;
  createdAt: string;
}

export interface IAssessmentQuestion {
  id: string;
  questionId?: string;
  questionNumber: number;
  totalQuestions: number;
  skill: string;
  topic?: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: string[];
}

export interface IParsedPdfQuestion {
  question: string;
  options: string[];
  correctAnswer?: number | string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  hasAnswerKey: boolean;
}

export interface IAssessmentRoom {
  id: string;
  roomCode: string;
  title: string;
  description?: string;
  assessmentId: string;
  jobId?: string | null;
  jobTitle?: string | null;
  invitationId?: string | null;
  invitationStatus?: string | null;
  recruiterName?: string;
  skills: string[];
  topics?: string[];
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  generationMode?: 'AI' | 'PDF';
  questionSource?: 'GENERATED' | 'UPLOADED_PDF';
  naturalLanguagePrompt?: string;
  durationMinutes: number;
  questionCount?: number;
  totalQuestions: number;
  status: 'ACTIVE' | 'CLOSED';
  candidateStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | null;
  candidateScore?: number | null;
  sessionId?: string | null;
  candidatesCount?: number;
  completedCount?: number;
  candidates?: {
    candidateId: string;
    name: string;
    email: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    score?: number;
    sessionId?: string;
    completedAt?: string;
  }[];
  expiresAt: string;
  createdAt: string;
}

export interface IAssessmentSession {
  id: string;
  candidateId?: any;
  assessmentId?: any;
  assessmentType?: AssessmentType;
  resumeId?: string;
  roomId?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EXPIRED' | 'CANCELLED';
  currentQuestionIndex: number;
  totalQuestions: number;
  currentDifficulty: QuestionDifficulty;
  score: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  timeTakenSeconds: number;
  remainingSeconds?: number;
  durationMs?: number;
  startedAt?: string;
  expiresAt?: string;
  submittedAt?: string;
  existingAnswers?: { questionId: string; selectedOption: number }[];
  skillScores?: Record<string, { total: number; correct: number; percentage: number }>;
  difficultyPerformance?: Record<QuestionDifficulty, { total: number; correct: number; percentage: number }>;
  proctoringSummary?: {
    totalEvents: number;
    tabSwitches: number;
    fullscreenExits: number;
    cameraInterruptions: number;
    copyPasteAttempts: number;
    rightClicks: number;
    integrityIndicator: 'High' | 'Moderate' | 'Review Recommended';
  };
}

export interface IProctoringEvent {
  id: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'HIGH';
  description: string;
  timestamp: string;
  durationSeconds?: number;
}

export interface ISnapshotReference {
  id: string;
  timestamp: string;
  url: string;
  eventContext?: string;
}

export interface ISemanticCandidateMatch {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  resumeId: string;
  overallScore: number;
  semanticSimilarity: number;
  matchedSkills: string[];
  missingSkills: string[];
  topEvidence: { section: string; text: string; score: number }[];
}

export interface IAuditLog {
  _id: string;
  userId?: string;
  userEmail?: string;
  role?: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: any;
  timestamp: string;
}
