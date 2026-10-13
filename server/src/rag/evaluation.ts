/**
 * CredRAG Experimental Benchmark & Ablation Study Evaluation Module (Requirements 31 & 32)
 * Evaluates real test data across baseline, hybrid, and full CredRAG ablation configurations.
 * Computes empirical metrics: Precision@K, Recall@K, F1-Score, Source Diversity, and Latency (ms).
 * Strictly computes real numbers from actual database data — NEVER fabricates results.
 */

import { getCredRAGConfig, setCredRAGConfig, resetCredRAGConfig } from './config';
import { CredRAG } from './cred_rag';
import { VectorDocument } from '../models/VectorDocument';
import { Resume } from '../models/Resume';

export interface IAblationMetrics {
  modeName: string;
  description: string;
  evaluatedSkillsCount: number;
  avgLatencyMs: number;
  avgPrecisionAtK: number;
  avgRecallAtK: number;
  avgF1Score: number;
  avgDiversityScore: number;
  avgConfidence: number;
  strongCount: number;
  moderateCount: number;
  needsReviewCount: number;
  unverifiedCount: number;
}

export interface IBenchmarkReport {
  timestamp: Date;
  candidateId: string;
  resumeId: string;
  skillsEvaluated: string[];
  totalResumeChunks: number;
  results: IAblationMetrics[];
}

export class CredRAGEvaluator {
  /**
   * Runs an ablation benchmark on a candidate resume across the 6 formal experiment modes:
   *   Mode A: Keyword-Only Baseline
   *   Mode B: Vector-Only Baseline (Pre-CredRAG)
   *   Mode C: Hybrid Retrieval (Semantic + Keyword)
   *   Mode D: Hybrid + Metadata Filtering
   *   Mode E: Hybrid + Metadata + Source Re-ranking
   *   Mode F: Full CredRAG Pipeline
   */
  public static async runBenchmark(
    candidateId: string,
    resumeId: string,
    sampleSkills?: string[]
  ): Promise<IBenchmarkReport> {
    // 1. Locate resume and extract skills to evaluate
    const resumeDoc = await Resume.findById(resumeId);
    if (!resumeDoc) {
      throw new Error(`Resume ${resumeId} not found for evaluation.`);
    }

    const availableSkills = sampleSkills && sampleSkills.length > 0
      ? sampleSkills
      : Array.from(
          new Set([
            ...(resumeDoc.analysis?.skills?.programmingLanguages || []),
            ...(resumeDoc.analysis?.skills?.frameworks || []),
            ...(resumeDoc.analysis?.skills?.databases || []),
            ...(resumeDoc.analysis?.skills?.tools || []),
          ])
        ).slice(0, 8);

    if (availableSkills.length === 0) {
      availableSkills.push('JavaScript', 'React', 'Node.js', 'MongoDB');
    }

    // 2. Count total chunks belonging to this resume
    const totalChunks = await VectorDocument.countDocuments({ resumeId });

    // Store original configuration to restore later
    const initialConfig = { ...getCredRAGConfig() };

    const modes = [
      {
        modeName: 'Mode A: Keyword-Only Baseline',
        description: 'Pure lexical keyword matching without semantic embeddings or source hierarchy',
        setup: () => {
          setCredRAGConfig({
            useKeyword: true,
            semanticWeight: 0.0,
            keywordWeight: 1.0,
            useMetadata: true,
            useReranking: false,
            useDiversity: false,
            useGeminiVerification: false,
          });
        },
      },
      {
        modeName: 'Mode B: Vector-Only Baseline',
        description: 'Generic cosine similarity semantic retrieval without lexical or diversity',
        setup: () => {
          setCredRAGConfig({
            useKeyword: false,
            semanticWeight: 1.0,
            keywordWeight: 0.0,
            useMetadata: false,
            useReranking: false,
            useDiversity: false,
            useGeminiVerification: false,
          });
        },
      },
      {
        modeName: 'Mode C: Hybrid Retrieval',
        description: 'Combined semantic + lexical retrieval (alpha=0.7, beta=0.3)',
        setup: () => {
          setCredRAGConfig({
            useKeyword: true,
            semanticWeight: 0.70,
            keywordWeight: 0.30,
            useMetadata: false,
            useReranking: false,
            useDiversity: false,
            useGeminiVerification: false,
          });
        },
      },
      {
        modeName: 'Mode D: Hybrid + Metadata Filtering',
        description: 'Hybrid retrieval with strict candidate and resume isolation',
        setup: () => {
          setCredRAGConfig({
            useKeyword: true,
            semanticWeight: 0.70,
            keywordWeight: 0.30,
            useMetadata: true,
            useReranking: false,
            useDiversity: false,
            useGeminiVerification: false,
          });
        },
      },
      {
        modeName: 'Mode E: Hybrid + Metadata + Re-ranking',
        description: 'Hybrid + Metadata with Source Hierarchy and Skill Relevance re-ranking',
        setup: () => {
          setCredRAGConfig({
            useKeyword: true,
            semanticWeight: 0.70,
            keywordWeight: 0.30,
            useMetadata: true,
            useReranking: true,
            useDiversity: false,
            useGeminiVerification: false,
          });
        },
      },
      {
        modeName: 'Mode F: Full CredRAG Pipeline',
        description: 'Complete pipeline: Hybrid + Metadata + Re-ranking + Diversity + Grounded Verification',
        setup: () => {
          setCredRAGConfig({
            useKeyword: true,
            semanticWeight: 0.70,
            keywordWeight: 0.30,
            useMetadata: true,
            useReranking: true,
            useDiversity: true,
            useConfidence: true,
            useGeminiVerification: true,
          });
        },
      },
    ];

    const modeResults: IAblationMetrics[] = [];

    // Preload all resume chunks for ground-truth relevance evaluation
    const resumeChunks = await VectorDocument.find({ resumeId }).lean();

    for (const mode of modes) {
      mode.setup();

      let totalLatency = 0;
      let totalPrecision = 0;
      let totalRecall = 0;
      let totalF1 = 0;
      let totalDiversity = 0;
      let totalConfidence = 0;

      let strongCount = 0;
      let moderateCount = 0;
      let needsReviewCount = 0;
      let unverifiedCount = 0;

      for (const skill of availableSkills) {
        const lowerSkill = skill.toLowerCase();

        // Calculate Ground Truth for this skill in this resume:
        // Chunks mentioning the skill or tagged with it
        const groundTruthRelevantChunks = resumeChunks.filter((chunk: any) => {
          const inText = (chunk.text || '').toLowerCase().includes(lowerSkill);
          const inSkills = (chunk.skills || []).some((s: string) => s.toLowerCase().includes(lowerSkill));
          const inTechs = ((chunk.metadata?.technologies as string[]) || []).some((t: string) =>
            t.toLowerCase().includes(lowerSkill)
          );
          return inText || inSkills || inTechs;
        });
        const groundTruthCount = Math.max(1, groundTruthRelevantChunks.length);

        const startTime = Date.now();
        const verification = await CredRAG.verifySkill(candidateId, resumeId, skill);
        const elapsed = Date.now() - startTime;

        totalLatency += elapsed;
        totalConfidence += verification.confidence;
        totalDiversity += verification.diversityScore;

        if (verification.verificationLevel === 'Strong') strongCount++;
        else if (verification.verificationLevel === 'Moderate') moderateCount++;
        else if (verification.verificationLevel === 'Needs Review') needsReviewCount++;
        else unverifiedCount++;

        // Measure Empirical Precision@K and Recall@K
        const retrieved = verification.evidence;
        const retrievedCount = Math.max(1, retrieved.length);

        let relevantRetrieved = 0;
        for (const item of retrieved) {
          const isRelevant = item.snippet.toLowerCase().includes(lowerSkill) || item.relevanceScore >= 70;
          if (isRelevant) relevantRetrieved++;
        }

        const precision = relevantRetrieved / retrievedCount;
        const recall = Math.min(1.0, relevantRetrieved / groundTruthCount);
        const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

        totalPrecision += precision;
        totalRecall += recall;
        totalF1 += f1;
      }

      const n = availableSkills.length;
      modeResults.push({
        modeName: mode.modeName,
        description: mode.description,
        evaluatedSkillsCount: n,
        avgLatencyMs: Math.round(totalLatency / n),
        avgPrecisionAtK: Number((totalPrecision / n).toFixed(3)),
        avgRecallAtK: Number((totalRecall / n).toFixed(3)),
        avgF1Score: Number((totalF1 / n).toFixed(3)),
        avgDiversityScore: Number(((totalDiversity / n) / 100).toFixed(3)),
        avgConfidence: Math.round(totalConfidence / n),
        strongCount,
        moderateCount,
        needsReviewCount,
        unverifiedCount,
      });
    }

    // Restore original active configuration
    setCredRAGConfig(initialConfig);

    return {
      timestamp: new Date(),
      candidateId,
      resumeId,
      skillsEvaluated: availableSkills,
      totalResumeChunks: totalChunks,
      results: modeResults,
    };
  }
}
