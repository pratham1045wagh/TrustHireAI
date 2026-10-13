import { IResumeAnalysis, IVectorDocument, DocumentSection } from '../types';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector.store.service';
import { Resume } from '../models/Resume';
import { Job, IJob } from '../models/Job';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { CredRAG } from '../rag/cred_rag';

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

export class RAGService {
  /**
   * Chunks and indexes a candidate resume into the vector database using CredRAG skill-aware chunking
   */
  public static async indexResume(
    resumeId: string,
    userId: string,
    analysis: IResumeAnalysis
  ): Promise<number> {
    return CredRAG.indexResume(resumeId, userId, analysis);
  }

  /**
   * Chunks and indexes a Job Description into the vector database
   */
  public static async indexJob(job: IJob): Promise<number> {
    if (!job._id) return 0;
    const jobId = job._id.toString();

    await VectorStoreService.deleteByDocumentId(jobId);

    const chunks: Partial<IVectorDocument>[] = [];

    // Overview chunk
    const overviewText = `Job Title: ${job.title} at ${job.companyName} (${job.location}, ${job.employmentType}). Experience: ${job.experienceLevel}. Overview: ${job.description}`;
    const overviewEmb = await EmbeddingService.generateEmbedding(overviewText);
    chunks.push({
      documentId: jobId,
      jobId,
      chunkId: `${jobId}-overview`,
      documentType: 'job',
      section: 'summary',
      text: overviewText,
      embedding: overviewEmb,
      contentHash: EmbeddingService.computeHash(overviewText),
    });

    // Required skills chunk
    if (job.requiredSkills && job.requiredSkills.length > 0) {
      const reqText = `Required Skills and Competencies: ${job.requiredSkills.join(', ')}`;
      const reqEmb = await EmbeddingService.generateEmbedding(reqText);
      chunks.push({
        documentId: jobId,
        jobId,
        chunkId: `${jobId}-required-skills`,
        documentType: 'job',
        section: 'requirements',
        text: reqText,
        embedding: reqEmb,
        contentHash: EmbeddingService.computeHash(reqText),
      });
    }

    // Responsibilities chunk
    if (job.responsibilities && job.responsibilities.length > 0) {
      const respText = `Core Responsibilities: ${job.responsibilities.join(' ')}`;
      const respEmb = await EmbeddingService.generateEmbedding(respText);
      chunks.push({
        documentId: jobId,
        jobId,
        chunkId: `${jobId}-responsibilities`,
        documentType: 'job',
        section: 'responsibilities',
        text: respText,
        embedding: respEmb,
        contentHash: EmbeddingService.computeHash(respText),
      });
    }

    if (chunks.length > 0) {
      await VectorStoreService.insertDocuments(chunks);
    }

    return chunks.length;
  }

  /**
   * Search resume chunks to locate concrete evidence for a specific skill using CredRAG
   */
  public static async searchResumeEvidence(
    candidateId: string,
    skill: string,
    topK: number = 4,
    resumeId?: string
  ): Promise<{ text: string; section: DocumentSection; similarity: number; metadata?: any }[]> {
    return CredRAG.retrieveEvidence(candidateId, skill, topK, resumeId);
  }

  /**
   * Semantic candidate matching for a Job Description
   */
  public static async searchCandidatesForJob(
    jobId: string,
    topK: number = 10
  ): Promise<ISemanticCandidateMatch[]> {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job Description not found.');

    const jdQuery = `${job.title} ${job.requiredSkills.join(' ')} ${job.description}`;
    const jdEmbedding = await EmbeddingService.generateEmbedding(jdQuery);

    // Find all candidate resumes belonging strictly to eligible candidates (role: CANDIDATE)
    const candidateUsers = await User.find({
      role: 'CANDIDATE',
      isActive: { $ne: false },
    }).select('_id');
    const candidateUserIds = candidateUsers.map((u) => u._id.toString());

    if (candidateUserIds.length === 0) {
      return [];
    }

    const candidateResumes = await Resume.find({
      status: 'ANALYZED',
      userId: { $in: candidateUserIds },
    })
      .populate('userId', 'name email role')
      .lean();

    const matches: ISemanticCandidateMatch[] = [];

    for (const resDoc of candidateResumes) {
      const user = resDoc.userId as any;
      if (!user?._id || user.role !== 'CANDIDATE') continue;

      const candidateId = user._id.toString();

      // Retrieve top resume chunks matching the job description
      const evidenceChunks = await VectorStoreService.similaritySearch(
        jdEmbedding,
        {
          userId: candidateId,
          documentType: 'resume',
        },
        5
      );

      const topSimilarity = evidenceChunks.length > 0 ? evidenceChunks[0].similarity : 0.4;

      // Extract skills from resume
      const resumeSkills: string[] = [
        ...(resDoc.analysis?.skills?.programmingLanguages || []),
        ...(resDoc.analysis?.skills?.frameworks || []),
        ...(resDoc.analysis?.skills?.libraries || []),
        ...(resDoc.analysis?.skills?.databases || []),
        ...(resDoc.analysis?.skills?.tools || []),
        ...(resDoc.analysis?.skills?.cloud || []),
      ];

      const lowerResumeSkills = resumeSkills.map((s) => s.toLowerCase());
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      for (const req of job.requiredSkills) {
        if (lowerResumeSkills.some((s) => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))) {
          matchedSkills.push(req);
        } else {
          missingSkills.push(req);
        }
      }

      const skillOverlapRatio = job.requiredSkills.length > 0
        ? matchedSkills.length / job.requiredSkills.length
        : 1.0;

      // Overall Score combines semantic similarity (50%) + hard skill overlap (50%)
      const overallScore = Math.round(
        (topSimilarity * 0.5 + skillOverlapRatio * 0.5) * 100
      );

      matches.push({
        candidateId,
        candidateName: user.name || 'Candidate',
        candidateEmail: user.email || '',
        resumeId: resDoc._id.toString(),
        overallScore: Math.min(100, Math.max(0, overallScore)),
        semanticSimilarity: Math.round(topSimilarity * 100),
        matchedSkills,
        missingSkills,
        topEvidence: evidenceChunks.slice(0, 3).map((c) => ({
          section: c.document.section,
          text: c.document.text,
          score: Math.round(c.similarity * 100),
        })),
      });
    }

    // Sort descending by overall match score
    matches.sort((a, b) => b.overallScore - a.overallScore);

    return matches.slice(0, topK);
  }

  /**
   * Recruiter semantic query search (e.g. "Find candidates with strong React and Node.js experience")
   * Strictly returns eligible candidate profiles (role: CANDIDATE), excluding recruiter accounts.
   */
  public static async semanticSearchCandidates(
    queryText: string,
    topK: number = 10
  ): Promise<ISemanticCandidateMatch[]> {
    // 1. Fetch eligible candidates (strictly role: CANDIDATE, excluding RECRUITER and ADMIN)
    const candidateUsers = await User.find({
      role: 'CANDIDATE',
      isActive: { $ne: false },
    })
      .select('_id name email role')
      .lean();

    if (!candidateUsers || candidateUsers.length === 0) {
      return [];
    }

    const candidateUserIds = candidateUsers.map((u) => u._id.toString());
    const candidateUserMap = new Map<string, any>(
      candidateUsers.map((u) => [u._id.toString(), u])
    );

    const queryEmbedding = await EmbeddingService.generateEmbedding(queryText);

    // 2. Retrieve matching resume chunks strictly for candidate users at vector retrieval level
    // Request sufficient chunks to guarantee topK candidate diversity
    const chunkMatches = await VectorStoreService.similaritySearch(
      queryEmbedding,
      {
        documentType: 'resume',
        userIds: candidateUserIds,
      },
      Math.max(topK * 6, 40)
    );

    // 3. Group by candidate userId
    const candidateMap = new Map<string, { topScore: number; chunks: any[] }>();

    for (const match of chunkMatches) {
      const uId = match.document.userId;
      if (!uId || !candidateUserMap.has(uId)) continue;

      if (!candidateMap.has(uId)) {
        candidateMap.set(uId, {
          topScore: match.similarity,
          chunks: [match],
        });
      } else {
        const item = candidateMap.get(uId)!;
        if (item.chunks.length < 3) {
          item.chunks.push(match);
        }
      }
    }

    const results: ISemanticCandidateMatch[] = [];

    for (const [candidateId, data] of candidateMap.entries()) {
      const user = candidateUserMap.get(candidateId);
      if (!user || user.role !== 'CANDIDATE') continue;

      const resume = await Resume.findOne({ userId: candidateId, status: 'ANALYZED' }).sort({ createdAt: -1 });

      const score = Math.round(data.topScore * 100);

      results.push({
        candidateId,
        candidateName: user.name || 'Candidate',
        candidateEmail: user.email || '',
        resumeId: resume?._id?.toString() || '',
        overallScore: Math.min(100, Math.max(20, score)),
        semanticSimilarity: score,
        matchedSkills: [],
        missingSkills: [],
        topEvidence: data.chunks.map((c) => ({
          section: c.document.section,
          text: c.document.text,
          score: Math.round(c.similarity * 100),
        })),
      });
    }

    results.sort((a, b) => b.overallScore - a.overallScore);
    return results.slice(0, topK);
  }
}
