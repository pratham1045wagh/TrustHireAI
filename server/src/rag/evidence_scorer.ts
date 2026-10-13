/**
 * CredRAG Evidence Scorer & Credibility Confidence Module (Component 11, Requirement 16)
 * Calculates the final CredibilityConfidence score (0–100) and maps systematically to verification levels.
 *
 * Formula:
 *   CredibilityConfidence = w1 * SemanticRelevance + w2 * KeywordRelevance + w3 * SourceRelevance + w4 * EvidenceDiversity
 *
 * Classifications:
 *   80–100 -> Strong
 *   60–79  -> Moderate
 *   40–59  -> Needs Review
 *   0–39   -> Unverified
 */

import { IRerankedCandidate } from './reranker';
import { getCredRAGConfig } from './config';
import { SkillProficiencyLevel, SkillVerificationStatus } from '../types';

export interface ICredibilityScoringResult {
  confidence: number; // 0 - 100
  credRagScore: number; // 0 - 100
  verificationLevel: 'Strong' | 'Moderate' | 'Needs Review' | 'Unverified';
  status: SkillVerificationStatus;
  claimedLevel: SkillProficiencyLevel;
  semanticRelevance: number; // 0.0 - 1.0
  keywordRelevance: number;  // 0.0 - 1.0
  sourceRelevance: number;   // 0.0 - 1.0
  diversityScore: number;    // 0.0 - 1.0
}

export class EvidenceScorer {
  /**
   * Calculates algorithmic credibility confidence and maps to verified classification levels
   */
  public static calculateConfidence(
    selectedEvidence: IRerankedCandidate[],
    diversityScore: number
  ): ICredibilityScoringResult {
    const config = getCredRAGConfig();

    if (!selectedEvidence || selectedEvidence.length === 0) {
      return {
        confidence: 35,
        credRagScore: 35,
        verificationLevel: 'Unverified',
        status: 'NEEDS_ASSESSMENT',
        claimedLevel: 'Beginner',
        semanticRelevance: 0,
        keywordRelevance: 0,
        sourceRelevance: 0.3,
        diversityScore: 1.0,
      };
    }

    // 1. Calculate average component relevances
    const count = selectedEvidence.length;
    const avgSemantic = selectedEvidence.reduce((acc, c) => acc + c.semanticScore, 0) / count;
    const avgKeyword = selectedEvidence.reduce((acc, c) => acc + c.keywordScore, 0) / count;
    const avgSource = selectedEvidence.reduce((acc, c) => acc + c.sourceWeight, 0) / count;

    // 2. CredibilityConfidence Formula (Requirement 16)
    const { semantic: w1, keyword: w2, source: w3, diversity: w4 } = config.confidenceWeights;
    const totalWeights = w1 + w2 + w3 + w4;

    const rawScore = (w1 * avgSemantic + w2 * avgKeyword + w3 * avgSource + w4 * diversityScore) / totalWeights;
    let confidence = Math.round(rawScore * 100);

    // Multi-evidence boost: having 3+ distinct corroborating sources provides a slight robustness bonus
    if (selectedEvidence.length >= 3 && diversityScore >= 0.75) {
      confidence = Math.min(98, confidence + 3);
    }

    confidence = Math.min(100, Math.max(0, confidence));

    // 3. Systematically map to verification levels & claimed proficiency
    const { strong, moderate, needsReview } = config.thresholds;
    let verificationLevel: 'Strong' | 'Moderate' | 'Needs Review' | 'Unverified';
    let status: SkillVerificationStatus;
    let claimedLevel: SkillProficiencyLevel;

    if (confidence >= strong) {
      verificationLevel = 'Strong';
      status = 'EVIDENCE_FOUND';
      claimedLevel = selectedEvidence.length >= 2 ? 'Advanced' : 'Intermediate';
    } else if (confidence >= moderate) {
      verificationLevel = 'Moderate';
      status = 'PARTIALLY_SUPPORTED';
      claimedLevel = 'Intermediate';
    } else if (confidence >= needsReview) {
      verificationLevel = 'Needs Review';
      status = 'PARTIALLY_SUPPORTED';
      claimedLevel = 'Beginner';
    } else {
      verificationLevel = 'Unverified';
      status = 'NEEDS_ASSESSMENT';
      claimedLevel = 'Beginner';
    }

    return {
      confidence,
      credRagScore: confidence,
      verificationLevel,
      status,
      claimedLevel,
      semanticRelevance: Number(avgSemantic.toFixed(3)),
      keywordRelevance: Number(avgKeyword.toFixed(3)),
      sourceRelevance: Number(avgSource.toFixed(3)),
      diversityScore: Number(diversityScore.toFixed(3)),
    };
  }
}
