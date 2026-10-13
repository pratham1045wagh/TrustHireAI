/**
 * CredRAG Evidence Re-ranking Module (Component 8 & 13)
 * Re-ranks candidates by incorporating Source Hierarchy and Skill Relevance into HybridScore.
 *
 * Scoring Formula:
 *   EvidenceScore = w1 * HybridScore + w2 * SourceWeight + w3 * SkillRelevance
 *
 * Configurable weights and ablation-aware.
 */

import { IHybridCandidate } from './hybrid_retriever';
import { SourceWeightService, CredRAGSourceType } from './source_weights';
import { getCredRAGConfig } from './config';

export interface IRerankedCandidate extends IHybridCandidate {
  sourceType: CredRAGSourceType;
  sourceWeight: number;
  skillRelevanceScore: number;
  evidenceScore: number; // 0.0 - 1.0
}

export class EvidenceReranker {
  /**
   * Re-ranks evidence candidates based on HybridScore, Source Weight, and Skill Relevance
   */
  public static rerank(
    candidates: IHybridCandidate[],
    skill: string
  ): IRerankedCandidate[] {
    const config = getCredRAGConfig();
    const normalizedSkill = skill.toLowerCase();

    const rerankedList: IRerankedCandidate[] = [];

    for (const item of candidates) {
      const doc = item.document;

      // 1. Resolve source type and weight (Requirement 14)
      const sourceType = SourceWeightService.resolveSourceType(
        doc.section,
        doc.sourceType || doc.metadata?.sourceType
      );
      const sourceWeight = SourceWeightService.getWeight(sourceType);

      // 2. Compute Skill Relevance (presence in explicit tags, title, or body)
      let skillRelevance = 0.20;
      const taggedSkills = (doc.skills || []).map((s) => s.toLowerCase());
      const metaTechs = ((doc.metadata?.technologies as string[]) || []).map((t) => t.toLowerCase());
      const sourceTitle = ((doc.metadata?.sourceTitle as string) || '').toLowerCase();
      const text = (doc.text || '').toLowerCase();

      if (taggedSkills.includes(normalizedSkill) || metaTechs.includes(normalizedSkill)) {
        skillRelevance = 1.00;
      } else if (sourceTitle.includes(normalizedSkill)) {
        skillRelevance = 0.85;
      } else {
        const regex = new RegExp(`\\b${normalizedSkill.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text)) {
          skillRelevance = 0.75;
        } else if (item.matchedTerms && item.matchedTerms.length > 0) {
          skillRelevance = 0.50;
        }
      }

      // 3. Compute EvidenceScore (Requirement 13)
      let finalEvidenceScore: number;
      if (!config.useReranking) {
        // Ablation mode: skip re-ranking
        finalEvidenceScore = item.hybridScore;
      } else {
        const w1 = config.rerankWeights.hybrid;
        const w2 = config.rerankWeights.source;
        const w3 = config.rerankWeights.skillRelevance;
        const total = w1 + w2 + w3 > 0 ? w1 + w2 + w3 : 1;

        finalEvidenceScore = (w1 * item.hybridScore + w2 * sourceWeight + w3 * skillRelevance) / total;
      }

      rerankedList.push({
        ...item,
        sourceType,
        sourceWeight: Number(sourceWeight.toFixed(3)),
        skillRelevanceScore: Number(skillRelevance.toFixed(3)),
        evidenceScore: Number(finalEvidenceScore.toFixed(4)),
      });
    }

    // Sort descending by EvidenceScore
    rerankedList.sort((a, b) => b.evidenceScore - a.evidenceScore);

    return rerankedList;
  }
}
