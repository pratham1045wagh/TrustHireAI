/**
 * CredRAG Skill-Aware Evidence Chunking Module (Component 1 & 6)
 * Enhances chunking with skill associations, source typing, and source entity metadata.
 * Optimizes performance via contentHash deduplication, existing embedding reuse, and safe parallel embedding.
 * Backward compatible with existing VectorDocument schema.
 */

import { IResumeAnalysis, IVectorDocument, DocumentSection } from '../types';
import { EmbeddingService } from '../services/embedding.service';
import { SourceWeightService, CredRAGSourceType } from './source_weights';
import { VectorDocument } from '../models/VectorDocument';

export class CredRAGChunker {
  /**
   * Helper to execute async tasks with a strict concurrency limit
   */
  private static async runWithConcurrency<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency: number = 3
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;

    const worker = async () => {
      while (index < items.length) {
        const i = index++;
        results[i] = await fn(items[i]);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
  }

  /**
   * Chunks resume analysis into skill-aware, source-typed evidence chunks.
   * Efficiently reuses existing embeddings when contentHash is unchanged.
   */
  public static async chunkResume(
    resumeId: string,
    userId: string,
    analysis: IResumeAnalysis
  ): Promise<Partial<IVectorDocument>[]> {
    const rawChunks: Partial<IVectorDocument>[] = [];

    // Collect all candidate skills for cross-referencing within chunks
    const allSkills = Array.from(
      new Set([
        ...(analysis.skills?.programmingLanguages || []),
        ...(analysis.skills?.frameworks || []),
        ...(analysis.skills?.libraries || []),
        ...(analysis.skills?.databases || []),
        ...(analysis.skills?.tools || []),
        ...(analysis.skills?.cloud || []),
        ...(analysis.skills?.other || []),
      ])
    ).filter(Boolean);

    const findMentionedSkills = (text: string, explicitList?: string[]): string[] => {
      const detected = new Set<string>(explicitList || []);
      const lowerText = text.toLowerCase();
      for (const sk of allSkills) {
        const lowerSk = sk.toLowerCase();
        const regex = new RegExp(`\\b${lowerSk.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerText)) {
          detected.add(sk);
        }
      }
      return Array.from(detected);
    };

    // 1. Professional Summary Chunk
    if (analysis.summary && analysis.summary.trim().length > 10) {
      const summaryText = analysis.summary.trim();
      const text = `Professional Summary: ${summaryText}`;
      const mentioned = findMentionedSkills(text);

      rawChunks.push({
        documentId: resumeId as any,
        resumeId: resumeId as any,
        userId: userId as any,
        chunkId: `${resumeId}-summary`,
        documentType: 'resume',
        section: 'summary',
        sourceType: 'SUMMARY',
        skills: mentioned,
        text,
        contentHash: EmbeddingService.computeHash(text),
        metadata: {
          sourceType: 'SUMMARY',
          sourceTitle: 'Professional Summary',
          fullName: analysis.personalInfo?.fullName,
          experienceLevel: 'overview',
        },
      });
    }

    // 2. Work Experience Chunks
    if (analysis.experience && analysis.experience.length > 0) {
      for (let i = 0; i < analysis.experience.length; i++) {
        const exp = analysis.experience[i];
        const bullets = (exp.description || []).join(' ');
        const text = `Experience at ${exp.company || 'Company'} as ${exp.role || 'Role'} (${exp.startDate || ''} - ${exp.endDate || ''}): ${bullets}`;

        if (text.length > 15) {
          const mentioned = findMentionedSkills(text);

          rawChunks.push({
            documentId: resumeId as any,
            resumeId: resumeId as any,
            userId: userId as any,
            chunkId: `${resumeId}-exp-${i}`,
            documentType: 'resume',
            section: 'experience',
            sourceType: 'WORK_EXPERIENCE',
            skills: mentioned,
            text,
            contentHash: EmbeddingService.computeHash(text),
            metadata: {
              sourceType: 'WORK_EXPERIENCE',
              sourceTitle: `${exp.role || 'Professional Role'} at ${exp.company || 'Company'}`,
              company: exp.company,
              role: exp.role,
              startDate: exp.startDate,
              endDate: exp.endDate,
              experienceLevel: 'professional',
            },
          });
        }
      }
    }

    // 3. Projects Chunks
    if (analysis.projects && analysis.projects.length > 0) {
      for (let i = 0; i < analysis.projects.length; i++) {
        const proj = analysis.projects[i];
        const techs = (proj.technologies || []).join(', ');
        const text = `Project: ${proj.name || 'Untitled Project'} (${proj.role || 'Contributor'}). Technologies: ${techs}. Description: ${proj.description || ''}`;

        if (text.length > 15) {
          const mentioned = findMentionedSkills(text, proj.technologies);

          rawChunks.push({
            documentId: resumeId as any,
            resumeId: resumeId as any,
            userId: userId as any,
            chunkId: `${resumeId}-proj-${i}`,
            documentType: 'resume',
            section: 'projects',
            sourceType: 'PROJECT',
            skills: mentioned,
            text,
            contentHash: EmbeddingService.computeHash(text),
            metadata: {
              sourceType: 'PROJECT',
              sourceTitle: proj.name || 'Project Implementation',
              projectName: proj.name,
              technologies: proj.technologies,
              role: proj.role,
              duration: proj.duration,
              experienceLevel: 'project',
            },
          });
        }
      }
    }

    // 4. Certifications Chunks
    if (analysis.certifications && analysis.certifications.length > 0) {
      for (let i = 0; i < analysis.certifications.length; i++) {
        const cert = analysis.certifications[i];
        const text = `Certification: ${cert.name || 'Certification'} issued by ${cert.issuer || 'Issuer'} (${cert.date || ''})`;

        if (text.length > 10) {
          const mentioned = findMentionedSkills(text);

          rawChunks.push({
            documentId: resumeId as any,
            resumeId: resumeId as any,
            userId: userId as any,
            chunkId: `${resumeId}-cert-${i}`,
            documentType: 'resume',
            section: 'certifications',
            sourceType: 'CERTIFICATION',
            skills: mentioned,
            text,
            contentHash: EmbeddingService.computeHash(text),
            metadata: {
              sourceType: 'CERTIFICATION',
              sourceTitle: cert.name || 'Professional Certification',
              issuer: cert.issuer,
              date: cert.date,
              experienceLevel: 'certification',
            },
          });
        }
      }
    }

    // 5. Education Chunks
    if (analysis.education && analysis.education.length > 0) {
      for (let i = 0; i < analysis.education.length; i++) {
        const edu = analysis.education[i];
        const text = `Education: ${edu.degree || 'Degree'} in ${edu.field || 'Field'} from ${edu.institution || 'Institution'} (${edu.startYear || ''} - ${edu.endYear || ''})`;

        if (text.length > 10) {
          const mentioned = findMentionedSkills(text);

          rawChunks.push({
            documentId: resumeId as any,
            resumeId: resumeId as any,
            userId: userId as any,
            chunkId: `${resumeId}-edu-${i}`,
            documentType: 'resume',
            section: 'education',
            sourceType: 'EDUCATION',
            skills: mentioned,
            text,
            contentHash: EmbeddingService.computeHash(text),
            metadata: {
              sourceType: 'EDUCATION',
              sourceTitle: `${edu.degree || 'Degree'} - ${edu.institution || 'Institution'}`,
              degree: edu.degree,
              institution: edu.institution,
              experienceLevel: 'academic',
            },
          });
        }
      }
    }

    // 6. Comprehensive Skills Chunk
    if (allSkills.length > 0) {
      const skillsText = `Skills & Technologies: ${allSkills.join(', ')}`;

      rawChunks.push({
        documentId: resumeId as any,
        resumeId: resumeId as any,
        userId: userId as any,
        chunkId: `${resumeId}-skills-all`,
        documentType: 'resume',
        section: 'skills',
        sourceType: 'SKILLS_ONLY',
        skills: allSkills,
        text: skillsText,
        contentHash: EmbeddingService.computeHash(skillsText),
        metadata: {
          sourceType: 'SKILLS_ONLY',
          sourceTitle: 'Skills & Competencies',
          experienceLevel: 'listed',
        },
      });
    }

    // 7. Deduplicate raw chunks with identical contentHash
    const seenHashes = new Set<string>();
    const deduplicatedChunks: Partial<IVectorDocument>[] = [];
    for (const chunk of rawChunks) {
      const hash = chunk.contentHash || chunk.text!;
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        deduplicatedChunks.push(chunk);
      }
    }

    // 8. Embedding Cache Lookup in MongoDB VectorDocument (Requirement Part 6 & 7)
    const allHashes = deduplicatedChunks.map((c) => c.contentHash!).filter(Boolean);
    const existingVectorDocs = await VectorDocument.find({
      $or: [
        { resumeId, contentHash: { $in: allHashes } },
        { userId, contentHash: { $in: allHashes } },
      ],
    })
      .select('contentHash embedding')
      .lean();

    const embeddingCache = new Map<string, number[]>();
    for (const doc of existingVectorDocs) {
      if (doc.contentHash && doc.embedding && doc.embedding.length > 0) {
        embeddingCache.set(doc.contentHash, doc.embedding);
        EmbeddingService.cacheEmbedding(doc.contentHash, doc.embedding);
      }
    }

    // 9. Identify chunks needing new embeddings and generate them with controlled concurrency
    const chunksNeedingEmbedding: { text: string; hash: string }[] = [];
    for (const chunk of deduplicatedChunks) {
      const hash = chunk.contentHash!;
      if (embeddingCache.has(hash)) {
        chunk.embedding = embeddingCache.get(hash);
      } else if (EmbeddingService.hasCachedEmbedding(hash)) {
        chunk.embedding = await EmbeddingService.generateEmbedding(chunk.text!);
      } else {
        chunksNeedingEmbedding.push({ text: chunk.text!, hash });
      }
    }

    if (chunksNeedingEmbedding.length > 0) {
      // Deduplicate texts needing embedding
      const uniqueNeedTexts = Array.from(new Set(chunksNeedingEmbedding.map((item) => item.text)));

      // Controlled concurrency = 3 (Requirement Part 6: avoid overloading Gemini API)
      await this.runWithConcurrency(
        uniqueNeedTexts,
        async (text) => {
          try {
            const emb = await EmbeddingService.generateEmbedding(text);
            const hash = EmbeddingService.computeHash(text);
            embeddingCache.set(hash, emb);
          } catch (err: any) {
            console.warn(`[CredRAG Chunker] Non-fatal embedding generation fallback:`, err?.message || err);
            const hash = EmbeddingService.computeHash(text);
            const fallbackEmb = EmbeddingService.generateDeterministicEmbedding(text);
            embeddingCache.set(hash, fallbackEmb);
          }
        },
        3
      );

      // Assign newly generated embeddings
      for (const chunk of deduplicatedChunks) {
        if (!chunk.embedding) {
          const hash = chunk.contentHash!;
          chunk.embedding = embeddingCache.get(hash) || EmbeddingService.generateDeterministicEmbedding(chunk.text!);
        }
      }
    }

    return deduplicatedChunks;
  }
}
