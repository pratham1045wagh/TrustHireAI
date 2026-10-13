/**
 * CredRAG Lexical / Keyword Retrieval Module (Component 6, Requirement 11)
 * Evaluates explicit textual occurrences, skill tag matching, and controlled alias mentions.
 */

import { VectorDocument } from '../models/VectorDocument';
import { IVectorDocument } from '../types';
import { getCredRAGConfig } from './config';

export interface IKeywordCandidate {
  document: IVectorDocument;
  keywordScore: number; // 0.0 - 1.0
  matchedTerms: string[];
}

export class KeywordRetriever {
  /**
   * Evaluates lexical relevance of resume chunks for the given skill and controlled terms
   */
  public static async retrieve(
    candidateId: string,
    resumeId: string,
    skill: string,
    lexicalTerms: string[],
    topK: number = 10
  ): Promise<IKeywordCandidate[]> {
    const config = getCredRAGConfig();
    if (!config.useKeyword) {
      return [];
    }

    const filterQuery: any = {
      documentType: 'resume',
      userId: candidateId,
    };

    if (config.useMetadata && resumeId) {
      filterQuery.resumeId = resumeId;
    }

    const evidenceSections = ['projects', 'experience', 'certifications', 'education', 'summary', 'skills'];
    filterQuery.section = { $in: evidenceSections };

    const docs = await VectorDocument.find(filterQuery).lean();
    if (!docs || docs.length === 0) {
      return [];
    }

    const normalizedSkill = skill.toLowerCase();
    const candidateResults: IKeywordCandidate[] = [];

    for (const doc of docs) {
      const text = (doc.text || '').toLowerCase();
      const metadataTechs = ((doc.metadata?.technologies as string[]) || []).map((t) => t.toLowerCase());
      const taggedSkills = (doc.skills || []).map((s: string) => s.toLowerCase());
      const sourceTitle = ((doc.metadata?.sourceTitle as string) || '').toLowerCase();

      const matchedTerms: string[] = [];
      let score = 0;

      // 1. Direct tag match in chunk skills or project technologies
      const hasTaggedSkill = taggedSkills.includes(normalizedSkill);
      const hasMetaTech = metadataTechs.includes(normalizedSkill);
      if (hasTaggedSkill || hasMetaTech) {
        score = Math.max(score, 0.90);
        matchedTerms.push(skill);
      }

      // 2. Direct presence in sourceTitle (e.g. "React Developer")
      if (sourceTitle.includes(normalizedSkill)) {
        score = Math.max(score, 0.85);
        matchedTerms.push(skill);
      }

      // 3. Exact word match in text
      const exactRegex = new RegExp(`\\b${normalizedSkill.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}\\b`, 'i');
      if (exactRegex.test(text)) {
        score = Math.max(score, 0.75);
        if (!matchedTerms.includes(skill)) matchedTerms.push(skill);

        // Term frequency bonus (bounded)
        const occurrences = (text.match(new RegExp(exactRegex, 'gi')) || []).length;
        score += Math.min(0.20, (occurrences - 1) * 0.05);
      }

      // 4. Controlled alias matches
      for (const alias of lexicalTerms) {
        const lowerAlias = alias.toLowerCase();
        if (lowerAlias === normalizedSkill) continue;

        const aliasRegex = new RegExp(`\\b${lowerAlias.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}\\b`, 'i');
        if (aliasRegex.test(text) || metadataTechs.includes(lowerAlias) || taggedSkills.includes(lowerAlias)) {
          if (!matchedTerms.includes(alias)) matchedTerms.push(alias);
          score = Math.max(score, 0.60);
          score += 0.05; // additive bonus for alias presence
        }
      }

      score = Math.min(1.0, Math.max(0.0, score));

      if (score > 0) {
        const docFormatted: IVectorDocument = {
          _id: doc._id.toString(),
          documentId: doc.documentId?.toString(),
          userId: doc.userId?.toString(),
          resumeId: doc.resumeId?.toString(),
          chunkId: doc.chunkId,
          documentType: doc.documentType,
          section: doc.section,
          sourceType: doc.sourceType || doc.metadata?.sourceType,
          skills: doc.skills || [],
          skill: doc.skill,
          text: doc.text,
          embedding: doc.embedding,
          contentHash: doc.contentHash,
          metadata: doc.metadata || {},
          createdAt: doc.createdAt,
        };

        candidateResults.push({
          document: docFormatted,
          keywordScore: Number(score.toFixed(4)),
          matchedTerms,
        });
      }
    }

    // Sort descending by keyword score
    candidateResults.sort((a, b) => b.keywordScore - a.keywordScore);

    return candidateResults.slice(0, topK);
  }
}
