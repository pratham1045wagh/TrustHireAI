/**
 * CredRAG Evidence-Grounded Gemini Verification Module (Component 12, Requirement 17)
 * Evaluates retrieved, re-ranked, and diversified evidence using Google Gemini.
 * Instructed strictly to ground evaluation only in supplied evidence.
 * Resilient: falls back to CredRAG algorithmic scores if Gemini is throttled or offline.
 */

import { GoogleGenAI } from '@google/genai';
import { IRerankedCandidate } from './reranker';
import { ICredibilityScoringResult } from './evidence_scorer';
import { getCredRAGConfig } from './config';

export interface IGeminiVerificationResult {
  skill: string;
  status: 'Strong' | 'Moderate' | 'Needs Review' | 'Unverified';
  confidence: number;
  evidence_sources: string[];
  explanation: string;
  isAiVerified: boolean;
}

export class GeminiEvidenceVerifier {
  private static getAiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('replace_with') || apiKey.length < 10) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Performs strictly evidence-grounded verification using Gemini AI with deterministic algorithmic fallback
   */
  public static async verifyEvidence(
    skill: string,
    evidenceItems: IRerankedCandidate[],
    algorithmicResult: ICredibilityScoringResult
  ): Promise<IGeminiVerificationResult> {
    const config = getCredRAGConfig();

    // Fast-path: if no evidence found, candidate has no textual proof
    if (evidenceItems.length === 0) {
      return {
        skill,
        status: 'Unverified',
        confidence: algorithmicResult.confidence,
        evidence_sources: [],
        explanation: `No concrete project or work experience evidence was found in the submitted resume for ${skill}.`,
        isAiVerified: false,
      };
    }

    // Check if Gemini verification is enabled in configuration
    if (!config.useGeminiVerification) {
      return {
        skill,
        status: algorithmicResult.verificationLevel,
        confidence: algorithmicResult.confidence,
        evidence_sources: evidenceItems.map(
          (e) => (e.document.metadata?.sourceTitle as string) || e.document.section
        ),
        explanation: `Algorithmic CredRAG verified with confidence ${algorithmicResult.confidence}%. (${evidenceItems.length} evidence sources examined).`,
        isAiVerified: false,
      };
    }

    try {
      const ai = this.getAiClient();
      if (!ai) {
        throw new Error('Gemini API key is not configured.');
      }

      // Format retrieved evidence items strictly for Gemini prompt (Requirement 17)
      const formattedEvidence = evidenceItems
        .map((e, idx) => {
          const doc = e.document;
          const title = (doc.metadata?.sourceTitle as string) || doc.section;
          return `[EVIDENCE ${idx + 1}] Source: ${e.sourceType} | Title: "${title}"\nRelevance Scores: Semantic=${(e.semanticScore * 100).toFixed(0)}%, Keyword=${(e.keywordScore * 100).toFixed(0)}%, SourceWeight=${(e.sourceWeight * 100).toFixed(0)}%\nSnippet: "${doc.text.slice(0, 300)}"`;
        })
        .join('\n\n');

      const systemInstruction = `You are the CredRAG Evidence Verification Engine for TrustHireAI.
Your role is to strictly verify candidate skills based ONLY on supplied resume evidence chunks.

STRICT VERIFICATION CONSTRAINTS:
1. Use ONLY the provided evidence. DO NOT invent, hallucinate, or infer unmentioned skills, employers, dates, or experience.
2. Determine whether the concrete evidence demonstrates practical application, implementation, or hands-on usage of the claimed skill.
3. Return ONLY a parseable JSON object matching this schema:
{
  "skill": "string",
  "status": "Strong" | "Moderate" | "Needs Review" | "Unverified",
  "confidence": number (integer between 0 and 100),
  "evidence_sources": ["string title of valid sources"],
  "explanation": "string explaining exactly which project or role demonstrated the skill (max 2 sentences)"
}
4. Status guidelines:
- "Strong" (80-100): Clear practical project implementation, production role, or accredited certification.
- "Moderate" (60-79): Mentioned in relevant context but limited detailed architecture or scope.
- "Needs Review" (40-59): Ambiguous or indirect mention.
- "Unverified" (0-39): Mentioned only in isolated list without context.`;

      const prompt = `Candidate Claimed Skill: ${skill}

Algorithmic CredRAG Baseline Confidence: ${algorithmicResult.confidence}%
Diversity Score: ${(algorithmicResult.diversityScore * 100).toFixed(0)}%

Retrieved Resume Evidence:
${formattedEvidence}

Verify this skill claim against the provided evidence and return JSON:`;

      const configuredModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
      const modelsToTry = [configuredModel, 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

      let responseText: string | null = null;
      for (const m of modelsToTry) {
        try {
          const genCall = ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const timeoutCall = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 5000ms on model ${m}`)), 5000)
          );

          const res: any = await Promise.race([genCall, timeoutCall]);

          if (res?.text && res.text.trim().length > 10) {
            responseText = res.text.trim();
            break;
          }
        } catch {
          // try next model or fall back to algorithmic
        }
      }

      if (responseText) {
        let clean = responseText;
        if (clean.startsWith('```json')) {
          clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (clean.startsWith('```')) {
          clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(clean);
        const validStatuses = ['Strong', 'Moderate', 'Needs Review', 'Unverified'];
        const status = validStatuses.includes(parsed.status)
          ? parsed.status
          : algorithmicResult.verificationLevel;

        const aiConfidence = typeof parsed.confidence === 'number'
          ? Math.min(100, Math.max(0, parsed.confidence))
          : algorithmicResult.confidence;

        // Blend algorithmic confidence with LLM judgment (70% algorithmic, 30% LLM) for maximum calibration
        const calibratedConfidence = Math.round(algorithmicResult.confidence * 0.70 + aiConfidence * 0.30);

        return {
          skill,
          status,
          confidence: calibratedConfidence,
          evidence_sources: Array.isArray(parsed.evidence_sources) && parsed.evidence_sources.length > 0
            ? parsed.evidence_sources
            : evidenceItems.map((e) => (e.document.metadata?.sourceTitle as string) || e.document.section),
          explanation: parsed.explanation || `Evidence grounded across ${evidenceItems.length} resume sources.`,
          isAiVerified: true,
        };
      }
    } catch (err: any) {
      console.warn(`[CredRAG Verifier] LLM verification unavailable (${err?.message || err}), using calibrated algorithmic fallback.`);
    }

    // Graceful Fallback (Requirement 25)
    return {
      skill,
      status: algorithmicResult.verificationLevel,
      confidence: algorithmicResult.confidence,
      evidence_sources: evidenceItems.map(
        (e) => (e.document.metadata?.sourceTitle as string) || e.document.section
      ),
      explanation: `Verified through CredRAG multi-source evidence retrieval (${evidenceItems.length} sources analyzed).`,
      isAiVerified: false,
    };
  }
}
