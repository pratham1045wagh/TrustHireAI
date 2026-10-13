/**
 * CredRAG Master Pipeline Orchestrator (Requirements 5, 27, 28, 29)
 * Credibility-Aware Retrieval-Augmented Generation for Resume Skill Verification.
 *
 * Implements the 16-step CredRAG algorithm:
 *   1. Construct skill verification query Q.
 *   2. Apply candidate and resume metadata filters.
 *   3. Retrieve semantic candidates using embeddings.
 *   4. Retrieve lexical candidates using controlled skill terms.
 *   5. Merge candidates.
 *   6. Calculate HybridScore.
 *   7. Re-rank candidates using multi-factor relevance.
 *   8. Apply evidence source weighting.
 *   9. Remove duplicate/near-duplicate evidence.
 *   10. Select diverse top-K evidence.
 *   11. Calculate CredibilityConfidence.
 *   12. Send selected evidence to Gemini.
 *   13. Gemini verifies evidence using only supplied context.
 *   14. Classify: Strong, Moderate, Needs Review, Unverified.
 *   15. Store evidence mapping.
 *   16. Return result to existing evidence pipeline.
 */

import { QueryBuilder } from './query_builder';
import { SemanticRetriever } from './semantic_retriever';
import { KeywordRetriever } from './keyword_retriever';
import { HybridRetriever } from './hybrid_retriever';
import { EvidenceReranker, IRerankedCandidate } from './reranker';
import { DiversitySelector } from './diversity_selector';
import { EvidenceScorer } from './evidence_scorer';
import { GeminiEvidenceVerifier } from './verifier';
import { CredRAGChunker } from './chunker';
import { SourceWeightService } from './source_weights';
import { getCredRAGConfig } from './config';
import {
  ISkillEvidence,
  SkillProficiencyLevel,
  SkillVerificationStatus,
  IResumeAnalysis,
  DocumentSection,
} from '../types';
import { SkillEvidence, ISkillEvidenceDocument } from '../models/SkillEvidence';
import { VectorStoreService } from '../services/vector.store.service';

export interface ICredRAGVerificationResult {
  skill: string;
  claimedLevel: SkillProficiencyLevel;
  confidence: number;
  status: SkillVerificationStatus;
  verificationLevel: 'Strong' | 'Moderate' | 'Needs Review' | 'Unverified';
  evidence: ISkillEvidence[];
  credRagScore: number;
  semanticScore: number;
  keywordScore: number;
  sourceScore: number;
  diversityScore: number;
  explanation: string;
  isAiVerified: boolean;
}

export class CredRAG {
  /**
   * Chunks and indexes a resume with CredRAG skill-aware evidence tags
   */
  public static async indexResume(
    resumeId: string,
    userId: string,
    analysis: IResumeAnalysis
  ): Promise<number> {
    const t0 = Date.now();
    // 1. Chunk resume with contentHash deduplication & embedding cache lookup
    const chunks = await CredRAGChunker.chunkResume(resumeId, userId, analysis);

    // 2. Idempotent upsert into VectorStore (preserving embeddings and preventing duplicates)
    if (chunks.length > 0) {
      for (const chunk of chunks) {
        await VectorStoreService.upsertChunk(chunk);
      }
      // Prune any outdated chunks for this resume
      const currentChunkIds = chunks.map((c) => c.chunkId).filter(Boolean);
      await VectorStoreService.deleteStaleChunks(resumeId, currentChunkIds as string[]);
    }

    console.log(`[CredRAG] indexResume finished in ${Date.now() - t0}ms for resume ${resumeId} (${chunks.length} chunks indexed)`);
    return chunks.length;
  }

  /**
   * Executes the full 16-step CredRAG verification algorithm for a single skill
   */
  public static async verifySkill(
    candidateId: string,
    resumeId: string,
    skill: string,
    claimedLevelHint: SkillProficiencyLevel = 'Intermediate',
    options: { fastMode?: boolean } = {}
  ): Promise<ICredRAGVerificationResult> {
    const config = getCredRAGConfig();

    // Step 1: Construct skill verification query & controlled aliases (Requirement 8)
    const queryObj = QueryBuilder.buildQuery(skill);

    // Step 2 & 3: Retrieve semantic candidates with resume + candidate boundaries (Requirements 9 & 10)
    const semanticCandidates = await SemanticRetriever.retrieve(
      candidateId,
      resumeId,
      queryObj.verificationQuery,
      config.topK * 3
    );

    // Step 4: Retrieve lexical candidates using controlled terms (Requirement 11)
    const keywordCandidates = await KeywordRetriever.retrieve(
      candidateId,
      resumeId,
      skill,
      queryObj.lexicalTerms,
      config.topK * 3
    );

    // Step 5 & 6: Merge candidates and calculate HybridScore (Requirement 12)
    const hybridCandidates = HybridRetriever.fuse(semanticCandidates, keywordCandidates);

    // Step 7 & 8: Re-rank candidates with source hierarchy and skill relevance (Requirements 13 & 14)
    const rerankedCandidates = EvidenceReranker.rerank(hybridCandidates, skill);

    // Step 9 & 10: Remove redundant items and select diverse top-K evidence (Requirement 15)
    const diversityResult = DiversitySelector.select(rerankedCandidates, config.maxEvidenceSources);
    const selectedEvidence = diversityResult.selected;
    const diversityScore = diversityResult.diversityScore;

    // Step 11: Calculate CredibilityConfidence (0–100) (Requirement 16)
    const scoringResult = EvidenceScorer.calculateConfidence(selectedEvidence, diversityScore);

    // Step 12, 13 & 14: Evidence-Grounded Gemini Verification (Requirement 17)
    let finalConfidence = scoringResult.confidence;
    let finalVerificationLevel = scoringResult.verificationLevel;
    let explanation = `CredRAG verified with ${scoringResult.confidence}% confidence (${selectedEvidence.length} evidence sources examined).`;
    let isAiVerified = false;

    // Use fast algorithmic CredRAG scoring during upload/batch verification to prevent timeouts
    if (!options?.fastMode && config.useGeminiVerification && selectedEvidence.length > 0) {
      const geminiResult = await GeminiEvidenceVerifier.verifyEvidence(
        skill,
        selectedEvidence,
        scoringResult
      );
      finalConfidence = geminiResult.confidence;
      finalVerificationLevel = geminiResult.status;
      explanation = geminiResult.explanation;
      isAiVerified = geminiResult.isAiVerified;
    }

    const finalStatus: SkillVerificationStatus =
      finalVerificationLevel === 'Strong'
        ? 'EVIDENCE_FOUND'
        : finalVerificationLevel === 'Moderate'
        ? 'PARTIALLY_SUPPORTED'
        : finalVerificationLevel === 'Needs Review'
        ? 'NEEDS_REVIEW'
        : 'NEEDS_ASSESSMENT';

    const finalClaimedLevel: SkillProficiencyLevel =
      finalConfidence >= 80 ? 'Advanced' : finalConfidence >= 60 ? 'Intermediate' : 'Beginner';

    // Format evidence items to match existing ISkillEvidence structure (Requirement 18)
    const formattedEvidence: ISkillEvidence[] = selectedEvidence.map((c) => ({
      sourceType: SourceWeightService.toLegacySourceType(c.sourceType),
      sourceTitle: (c.document.metadata?.sourceTitle as string) || c.document.section,
      snippet: c.document.text.slice(0, 280),
      relevanceScore: Math.round(c.evidenceScore * 100),
      semanticScore: Math.round(c.semanticScore * 100),
      keywordScore: Math.round(c.keywordScore * 100),
      sourceScore: Math.round(c.sourceWeight * 100),
    }));

    // Step 15 & 16: Structured logging (Requirement 27)
    console.log(
      `[CREDRAG] Skill: ${skill} | Resume: ${resumeId} | Semantic: ${semanticCandidates.length} | Keyword: ${keywordCandidates.length} | Merged: ${hybridCandidates.length} | Re-ranked: ${rerankedCandidates.length} | Diverse Selected: ${selectedEvidence.length} | Diversity: ${diversityScore} | Confidence: ${finalConfidence}% | Verification: ${finalVerificationLevel}`
    );

    return {
      skill,
      claimedLevel: finalClaimedLevel,
      confidence: finalConfidence,
      status: finalStatus,
      verificationLevel: finalVerificationLevel,
      evidence: formattedEvidence,
      credRagScore: finalConfidence,
      semanticScore: Math.round(scoringResult.semanticRelevance * 100),
      keywordScore: Math.round(scoringResult.keywordRelevance * 100),
      sourceScore: Math.round(scoringResult.sourceRelevance * 100),
      diversityScore: Math.round(diversityScore * 100),
      explanation,
      isAiVerified,
    };
  }

  /**
   * Verifies all skills extracted from a resume and persists to SkillEvidence collection
   */
  public static async verifyAllResumeSkills(
    candidateId: string,
    resumeId: string,
    analysis: IResumeAnalysis,
    options: { fastMode?: boolean } = { fastMode: true }
  ): Promise<ISkillEvidenceDocument[]> {
    if (!candidateId || !resumeId) return [];

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

    const savedDocs: ISkillEvidenceDocument[] = [];
    const isFast = options.fastMode !== false;

    for (const skill of allSkills) {
      try {
        const credResult = await this.verifySkill(candidateId, resumeId, skill, 'Intermediate', { fastMode: isFast });

        const saved = await SkillEvidence.findOneAndUpdate(
          { candidateId, resumeId, skill },
          {
            candidateId,
            resumeId,
            skill,
            claimedLevel: credResult.claimedLevel,
            confidence: credResult.confidence,
            status: credResult.status,
            evidence: credResult.evidence,
            verificationLevel: credResult.verificationLevel,
            notes: credResult.explanation,
            credRagScore: credResult.credRagScore,
            semanticScore: credResult.semanticScore,
            keywordScore: credResult.keywordScore,
            sourceScore: credResult.sourceScore,
            diversityScore: credResult.diversityScore,
            explanation: credResult.explanation,
          },
          { upsert: true, new: true }
        );

        savedDocs.push(saved);
      } catch (err: any) {
        console.warn(`[CredRAG Warning] Failed to verify skill ${skill}:`, err?.message || err);
      }
    }

    return savedDocs;
  }

  /**
   * Compatibility adapter for legacy RAGService.searchResumeEvidence
   */
  public static async retrieveEvidence(
    candidateId: string,
    skill: string,
    topK: number = 4,
    resumeId?: string
  ): Promise<{ text: string; section: DocumentSection; similarity: number; metadata?: any }[]> {
    const queryObj = QueryBuilder.buildQuery(skill);
    const semanticCandidates = await SemanticRetriever.retrieve(
      candidateId,
      resumeId || '',
      queryObj.verificationQuery,
      topK * 2
    );

    const keywordCandidates = await KeywordRetriever.retrieve(
      candidateId,
      resumeId || '',
      skill,
      queryObj.lexicalTerms,
      topK * 2
    );

    const hybrid = HybridRetriever.fuse(semanticCandidates, keywordCandidates);
    const reranked = EvidenceReranker.rerank(hybrid, skill);
    const diverse = DiversitySelector.select(reranked, topK);

    return diverse.selected.map((c) => ({
      text: c.document.text,
      section: c.document.section,
      similarity: Number((c.evidenceScore * 100).toFixed(1)),
      metadata: c.document.metadata,
    }));
  }
}
