/**
 * CredRAG Evidence Diversity Module (Component 10, Requirement 15)
 * Prevents redundant evidence from a single source from dominating the retrieved evidence set.
 * Calculates EvidenceDiversity = UniqueEvidenceSources / SelectedEvidenceCount.
 */

import { IRerankedCandidate } from './reranker';
import { getCredRAGConfig } from './config';

export interface IDiverseSelectionResult {
  selected: IRerankedCandidate[];
  diversityScore: number; // 0.0 - 1.0
  uniqueSourcesCount: number;
}

export class DiversitySelector {
  /**
   * Generates a unique key identifying the concrete source entity
   */
  private static getSourceEntityKey(candidate: IRerankedCandidate): string {
    const doc = candidate.document;
    const meta = doc.metadata || {};

    switch (candidate.sourceType) {
      case 'PROJECT':
        return `proj:${(meta.projectName || meta.sourceTitle || doc.chunkId).toLowerCase().trim()}`;
      case 'WORK_EXPERIENCE':
        return `exp:${(meta.company || meta.sourceTitle || doc.chunkId).toLowerCase().trim()}`;
      case 'CERTIFICATION':
        return `cert:${(meta.issuer || meta.sourceTitle || doc.chunkId).toLowerCase().trim()}`;
      case 'EDUCATION':
        return `edu:${(meta.institution || meta.sourceTitle || doc.chunkId).toLowerCase().trim()}`;
      case 'SUMMARY':
        return 'summary';
      case 'SKILLS_ONLY':
        return 'skills_only';
      default:
        return `chunk:${doc.chunkId}`;
    }
  }

  /**
   * Selects up to maxEvidence items enforcing source diversity
   */
  public static select(
    candidates: IRerankedCandidate[],
    maxEvidence: number = 4
  ): IDiverseSelectionResult {
    const config = getCredRAGConfig();

    if (!candidates || candidates.length === 0) {
      return { selected: [], diversityScore: 1.0, uniqueSourcesCount: 0 };
    }

    if (!config.useDiversity) {
      // Ablation mode: naive top-K selection without source diversity balancing
      const naive = candidates.slice(0, maxEvidence);
      const uniqueKeys = new Set(naive.map((c) => this.getSourceEntityKey(c)));
      const diversity = naive.length > 0 ? uniqueKeys.size / naive.length : 1.0;
      return {
        selected: naive,
        diversityScore: Number(diversity.toFixed(3)),
        uniqueSourcesCount: uniqueKeys.size,
      };
    }

    const selected: IRerankedCandidate[] = [];
    const seenEntities = new Set<string>();
    const entityUsageCount = new Map<string, number>();

    // Pass 1: Select highest-ranked candidate from distinct source entities
    for (const candidate of candidates) {
      if (selected.length >= maxEvidence) break;

      const entityKey = this.getSourceEntityKey(candidate);
      if (!seenEntities.has(entityKey)) {
        seenEntities.add(entityKey);
        entityUsageCount.set(entityKey, 1);
        selected.push(candidate);
      }
    }

    // Pass 2: If available slots remain, fill with remaining candidates (capping at max 2 per entity)
    if (selected.length < maxEvidence) {
      for (const candidate of candidates) {
        if (selected.length >= maxEvidence) break;

        const alreadySelected = selected.some(
          (s) => s.document.chunkId === candidate.document.chunkId
        );
        if (alreadySelected) continue;

        const entityKey = this.getSourceEntityKey(candidate);
        const currentCount = entityUsageCount.get(entityKey) || 0;

        if (currentCount < 2) {
          entityUsageCount.set(entityKey, currentCount + 1);
          selected.push(candidate);
        }
      }
    }

    // Pass 3: Final fallback to top items if still below maxEvidence
    if (selected.length < maxEvidence) {
      for (const candidate of candidates) {
        if (selected.length >= maxEvidence) break;
        const alreadySelected = selected.some(
          (s) => s.document.chunkId === candidate.document.chunkId
        );
        if (!alreadySelected) {
          selected.push(candidate);
        }
      }
    }

    // Calculate EvidenceDiversity = UniqueEvidenceSources / SelectedEvidenceCount (Requirement 15)
    const finalUniqueEntities = new Set(selected.map((c) => this.getSourceEntityKey(c)));
    const diversityScore = selected.length > 0 ? finalUniqueEntities.size / selected.length : 1.0;

    return {
      selected,
      diversityScore: Number(diversityScore.toFixed(3)),
      uniqueSourcesCount: finalUniqueEntities.size,
    };
  }
}
