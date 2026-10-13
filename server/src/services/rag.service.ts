import { IResumeAnalysis, IVectorDocument, DocumentSection } from '../types';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector.store.service';
import { Resume } from '../models/Resume';
import { Job, IJob } from '../models/Job';
import { User } from '../models/User';
import { Application } from '../models/Application';

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
   * Chunks and indexes a candidate resume into the vector database
   */
  public static async indexResume(
    resumeId: string,
    userId: string,
    analysis: IResumeAnalysis
  ): Promise<number> {
    // Clean existing chunks for this resume to prevent stale duplicates
    await VectorStoreService.deleteByDocumentId(resumeId);

    const chunks: Partial<IVectorDocument>[] = [];

    // 1. Summary Chunk
    if (analysis.summary && analysis.summary.trim().length > 10) {
      const text = `Summary: ${analysis.summary.trim()}`;
      const embedding = await EmbeddingService.generateEmbedding(text);
      chunks.push({
        documentId: resumeId,
        resumeId,
        userId,
        chunkId: `${resumeId}-summary`,
        documentType: 'resume',
        section: 'summary',
        text,
        embedding,
        contentHash: EmbeddingService.computeHash(text),
        metadata: { fullName: analysis.personalInfo?.fullName },
      });
    }

    // 2. Skills Chunk & Individual Skill Chunks
    const allSkills = [
      ...(analysis.skills?.programmingLanguages || []),
      ...(analysis.skills?.frameworks || []),
      ...(analysis.skills?.libraries || []),
      ...(analysis.skills?.databases || []),
      ...(analysis.skills?.tools || []),
      ...(analysis.skills?.cloud || []),
      ...(analysis.skills?.other || []),
    ];

    if (allSkills.length > 0) {
      const skillsText = `Skills & Technologies: ${allSkills.join(', ')}`;
      const embedding = await EmbeddingService.generateEmbedding(skillsText);
      chunks.push({
        documentId: resumeId,
        resumeId,
        userId,
        chunkId: `${resumeId}-skills-all`,
        documentType: 'resume',
        section: 'skills',
        text: skillsText,
        embedding,
        contentHash: EmbeddingService.computeHash(skillsText),
      });

      // Index key individual skills for direct evidence matching
      for (const skill of allSkills.slice(0, 20)) {
        const text = `Skill: ${skill}`;
        const emb = await EmbeddingService.generateEmbedding(text);
        chunks.push({
          documentId: resumeId,
          resumeId,
          userId,
          chunkId: `${resumeId}-skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          documentType: 'skill',
          section: 'skills',
          skill,
          text,
          embedding: emb,
          contentHash: EmbeddingService.computeHash(text),
        });
      }
    }

    // 3. Experience Chunks
    if (analysis.experience && analysis.experience.length > 0) {
      for (let i = 0; i < analysis.experience.length; i++) {
        const exp = analysis.experience[i];
        const bullets = (exp.description || []).join(' ');
        const text = `Experience at ${exp.company || 'Company'} as ${exp.role || 'Role'} (${exp.startDate || ''} - ${exp.endDate || ''}): ${bullets}`;
        if (text.length > 20) {
          const embedding = await EmbeddingService.generateEmbedding(text);
          chunks.push({
            documentId: resumeId,
            resumeId,
            userId,
            chunkId: `${resumeId}-exp-${i}`,
            documentType: 'resume',
            section: 'experience',
            text,
            embedding,
            contentHash: EmbeddingService.computeHash(text),
            metadata: { company: exp.company, role: exp.role },
          });
        }
      }
    }

    // 4. Projects Chunks
    if (analysis.projects && analysis.projects.length > 0) {
      for (let i = 0; i < analysis.projects.length; i++) {
        const proj = analysis.projects[i];
        const techs = (proj.technologies || []).join(', ');
        const text = `Project: ${proj.name || 'Untitled Project'} (${proj.role || 'Contributor'}). Technologies: ${techs}. Description: ${proj.description || ''}`;
        if (text.length > 20) {
          const embedding = await EmbeddingService.generateEmbedding(text);
          chunks.push({
            documentId: resumeId,
            resumeId,
            userId,
            chunkId: `${resumeId}-proj-${i}`,
            documentType: 'resume',
            section: 'projects',
            text,
            embedding,
            contentHash: EmbeddingService.computeHash(text),
            metadata: { projectName: proj.name, technologies: proj.technologies },
          });
        }
      }
    }

    // 5. Education Chunks
    if (analysis.education && analysis.education.length > 0) {
      for (let i = 0; i < analysis.education.length; i++) {
        const edu = analysis.education[i];
        const text = `Education: ${edu.degree || 'Degree'} in ${edu.field || 'Field'} from ${edu.institution || 'Institution'} (${edu.startYear || ''} - ${edu.endYear || ''})`;
        if (text.length > 15) {
          const embedding = await EmbeddingService.generateEmbedding(text);
          chunks.push({
            documentId: resumeId,
            resumeId,
            userId,
            chunkId: `${resumeId}-edu-${i}`,
            documentType: 'resume',
            section: 'education',
            text,
            embedding,
            contentHash: EmbeddingService.computeHash(text),
          });
        }
      }
    }

    // 6. Certifications Chunks
    if (analysis.certifications && analysis.certifications.length > 0) {
      for (let i = 0; i < analysis.certifications.length; i++) {
        const cert = analysis.certifications[i];
        const text = `Certification: ${cert.name || 'Certification'} issued by ${cert.issuer || 'Issuer'} (${cert.date || ''})`;
        if (text.length > 15) {
          const embedding = await EmbeddingService.generateEmbedding(text);
          chunks.push({
            documentId: resumeId,
            resumeId,
            userId,
            chunkId: `${resumeId}-cert-${i}`,
            documentType: 'resume',
            section: 'certifications',
            text,
            embedding,
            contentHash: EmbeddingService.computeHash(text),
          });
        }
      }
    }

    if (chunks.length > 0) {
      await VectorStoreService.insertDocuments(chunks);
    }

    return chunks.length;
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
   * Search resume chunks to locate concrete evidence for a specific skill
   */
  public static async searchResumeEvidence(
    candidateId: string,
    skill: string,
    topK: number = 4
  ): Promise<{ text: string; section: DocumentSection; similarity: number; metadata?: any }[]> {
    const query = `Skill ${skill} hands-on implementation, project work, technical experience and architecture`;
    const queryEmbedding = await EmbeddingService.generateEmbedding(query);

    const results = await VectorStoreService.similaritySearch(
      queryEmbedding,
      {
        userId: candidateId,
        documentType: 'resume',
      },
      topK * 2
    );

    // Filter to sections that hold evidence (projects, experience, certifications, summary)
    const validSections: DocumentSection[] = ['projects', 'experience', 'certifications', 'summary', 'education'];
    const filtered = results
      .filter((r) => validSections.includes(r.document.section))
      .slice(0, topK);

    return filtered.map((r) => ({
      text: r.document.text,
      section: r.document.section,
      similarity: Number((r.similarity * 100).toFixed(1)),
      metadata: r.document.metadata,
    }));
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

    // Find all candidate resumes
    const candidateResumes = await Resume.find({ status: 'ANALYZED' })
      .populate('userId', 'name email')
      .lean();

    const matches: ISemanticCandidateMatch[] = [];

    for (const resDoc of candidateResumes) {
      const user = resDoc.userId as any;
      if (!user?._id) continue;

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
   */
  public static async semanticSearchCandidates(
    queryText: string,
    topK: number = 10
  ): Promise<ISemanticCandidateMatch[]> {
    const queryEmbedding = await EmbeddingService.generateEmbedding(queryText);

    // Retrieve matching resume chunks
    const chunkMatches = await VectorStoreService.similaritySearch(
      queryEmbedding,
      { documentType: 'resume' },
      topK * 4
    );

    // Group by userId
    const candidateMap = new Map<string, { topScore: number; chunks: any[] }>();

    for (const match of chunkMatches) {
      const uId = match.document.userId;
      if (!uId) continue;

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
      const user = await User.findById(candidateId).select('name email');
      if (!user) continue;

      const resume = await Resume.findOne({ userId: candidateId, status: 'ANALYZED' }).sort({ createdAt: -1 });

      const score = Math.round(data.topScore * 100);

      results.push({
        candidateId,
        candidateName: user.name,
        candidateEmail: user.email,
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
