/**
 * CredRAG Hybrid Retrieval Module (Component 7, Requirement 12)
 * Combines semantic and lexical retrieval signals into a weighted hybrid score.
 * Configurable weights: alpha (semantic) and beta (keyword).
 */

import { IVectorDocument } from '../types';
import { getCredRAGConfig } from './config';
import { ISemanticCandidate } from './semantic_retriever';
import { IKeywordCandidate } from './keyword_retriever';

export interface IHybridCandidate {
  document: IVectorDocument;
  semanticScore: number;
  keywordScore: number;
  hybridScore: number;
  matchedTerms: string[];
}

export class HybridRetriever {
  /**
   * Merges semantic and lexical candidate sets, computing the configurable HybridScore
   */
  public static fuse(
    semanticCandidates: ISemanticCandidate[],
    keywordCandidates: IKeywordCandidate[]
  ): IHybridCandidate[] {
    const config = getCredRAGConfig();
    const candidateMap = new Map<string, IHybridCandidate>();

    // 1. Ingest Semantic Candidates
    for (const sem of semanticCandidates) {
      const id = sem.document.chunkId || sem.document._id || '';
      candidateMap.set(id, {
        document: sem.document,
        semanticScore: sem.semanticScore,
        keywordScore: 0,
        hybridScore: 0,
        matchedTerms: [],
      });
    }

    // 2. Merge Lexical Candidates
    for (const kw of keywordCandidates) {
      const id = kw.document.chunkId || kw.document._id || '';
      if (candidateMap.has(id)) {
        const existing = candidateMap.get(id)!;
        existing.keywordScore = kw.keywordScore;
        existing.matchedTerms = kw.matchedTerms;
      } else {
        candidateMap.set(id, {
          document: kw.document,
          semanticScore: 0,
          keywordScore: kw.keywordScore,
          hybridScore: 0,
          matchedTerms: kw.matchedTerms,
        });
      }
    }

    // 3. Compute HybridScore (Requirement 12)
    const alpha = config.semanticWeight;
    const beta = config.useKeyword ? config.keywordWeight : 0;
    const totalWeight = alpha + beta > 0 ? alpha + beta : 1;

    const mergedList: IHybridCandidate[] = [];

    for (const item of candidateMap.values()) {
      let score: number;
      if (!config.useKeyword) {
        // Ablation mode: pure vector retrieval
        score = item.semanticScore;
      } else {
        score = (alpha * item.semanticScore + beta * item.keywordScore) / totalWeight;
      }

      item.hybridScore = Number(score.toFixed(4));
      mergedList.push(item);
    }

    // Sort descending by HybridScore
    mergedList.sort((a, b) => b.hybridScore - a.hybridScore);

    return mergedList;
  }
}
