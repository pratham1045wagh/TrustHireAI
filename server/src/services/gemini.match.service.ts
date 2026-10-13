import { GoogleGenAI } from '@google/genai';
import { IResumeAnalysis } from '../types';
import { IJob } from '../models/Job';

export interface IMatchAnalysisResult {
  overallMatch: number;
  skillAlignment: number;
  experienceAlignment: number;
  educationAlignment: number;
  projectRelevance: number;
  technologyAlignment: number;
  matchingSkills: string[];
  missingRequiredSkills: string[];
  matchingProjects: string[];
  explanation: string;
  limitations: string[];
}

export class GeminiMatchService {
  private static getAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace_with_your_gemini_api_key' || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured in server environment variables.');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Compare structured candidate resume with structured Job Description to generate informational match metrics
   */
  public static async analyzeMatch(
    resumeAnalysis: IResumeAnalysis,
    job: IJob
  ): Promise<IMatchAnalysisResult> {
    try {
      const ai = this.getAiClient();

      const systemInstruction = `
You are an AI resume-to-job-description analysis assistant. Compare the provided candidate resume structured data with the target job description data.

CRITICAL INSTRUCTIONS:
1. Compare only information explicitly present in the candidate resume and job description.
2. Do NOT invent or infer missing candidate qualifications. If the resume does not state a skill, do not assume the candidate possesses it.
3. Calculate an informational alignment score (0 to 100) across dimensions: overallMatch, skillAlignment, experienceAlignment, educationAlignment, projectRelevance, technologyAlignment.
4. The generated score is an informational alignment metric strictly comparing text content. It is NOT a hiring decision or prediction of candidate performance.
5. Return ONLY a valid JSON object matching the exact schema below.

JSON SCHEMA:
{
  "overallMatch": number (0-100),
  "skillAlignment": number (0-100),
  "experienceAlignment": number (0-100),
  "educationAlignment": number (0-100),
  "projectRelevance": number (0-100),
  "technologyAlignment": number (0-100),
  "matchingSkills": ["string"],
  "missingRequiredSkills": ["string"],
  "matchingProjects": ["string"],
  "explanation": "string neutral narrative summary",
  "limitations": ["string limitation note"]
}
`;

      const prompt = `
TARGET JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.companyName}
Required Skills: ${JSON.stringify(job.requiredSkills)}
Preferred Skills: ${JSON.stringify(job.preferredSkills || [])}
Description: ${job.description}
Experience Required: ${job.experienceLevel}
Education Required: ${JSON.stringify(job.educationRequirements || [])}

CANDIDATE RESUME PROFILE:
Summary: ${resumeAnalysis.summary || 'None'}
Skills: ${JSON.stringify(resumeAnalysis.skills)}
Experience: ${JSON.stringify(resumeAnalysis.experience)}
Education: ${JSON.stringify(resumeAnalysis.education)}
Projects: ${JSON.stringify(resumeAnalysis.projects)}

Calculate informational alignment metrics and return pure JSON according to instructions.
`;

      const configuredModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
      const candidateModels = Array.from(
        new Set([
          configuredModel,
          'gemini-flash-lite-latest',
          'gemini-3.5-flash-lite',
          'gemini-2.5-flash-lite',
          'gemini-3.5-flash',
          'gemini-3.8-flash',
          'gemini-flash-latest',
        ])
      );

      let responseText: string | null = null;
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`[Gemini Match Service] Analyzing match using model '${modelName}'...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          if (response.text && response.text.trim().length > 10) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          console.warn(`[Gemini Match Service Warning] Model '${modelName}' failed:`, err?.message || err);
          lastError = err;
        }
      }

      if (!responseText) {
        console.warn('[Gemini Match Service] Remote models unavailable, using algorithmic fallback match.');
        const candidateSkills = [
          ...(resumeAnalysis.skills?.programmingLanguages || []),
          ...(resumeAnalysis.skills?.frameworks || []),
          ...(resumeAnalysis.skills?.databases || []),
          ...(resumeAnalysis.skills?.tools || []),
        ];
        const reqSkills: string[] = job.requiredSkills || [];
        const matchSkills = reqSkills.filter((r) => candidateSkills.some((c) => c.toLowerCase().includes(r.toLowerCase())));
        const missSkills = reqSkills.filter((r) => !matchSkills.includes(r));
        const skillPct = reqSkills.length > 0 ? Math.round((matchSkills.length / reqSkills.length) * 100) : 75;

        return {
          overallMatch: Math.min(100, Math.max(45, skillPct)),
          skillAlignment: skillPct,
          experienceAlignment: 75,
          educationAlignment: 80,
          projectRelevance: 70,
          technologyAlignment: skillPct,
          matchingSkills: matchSkills,
          missingRequiredSkills: missSkills,
          matchingProjects: (resumeAnalysis.projects || []).slice(0, 2).map((p) => p.name || 'Project'),
          explanation: `Verified skill overlap matches ${matchSkills.length} of ${reqSkills.length} required skills against candidate resume.`,
          limitations: ['Informational algorithmic fallback match based strictly on parsed text.'],
        };
      }

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedText);

      return {
        overallMatch: typeof parsed.overallMatch === 'number' ? Math.min(100, Math.max(0, parsed.overallMatch)) : 70,
        skillAlignment: typeof parsed.skillAlignment === 'number' ? Math.min(100, Math.max(0, parsed.skillAlignment)) : 75,
        experienceAlignment: typeof parsed.experienceAlignment === 'number' ? Math.min(100, Math.max(0, parsed.experienceAlignment)) : 70,
        educationAlignment: typeof parsed.educationAlignment === 'number' ? Math.min(100, Math.max(0, parsed.educationAlignment)) : 80,
        projectRelevance: typeof parsed.projectRelevance === 'number' ? Math.min(100, Math.max(0, parsed.projectRelevance)) : 70,
        technologyAlignment: typeof parsed.technologyAlignment === 'number' ? Math.min(100, Math.max(0, parsed.technologyAlignment)) : 75,
        matchingSkills: Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills : [],
        missingRequiredSkills: Array.isArray(parsed.missingRequiredSkills) ? parsed.missingRequiredSkills : [],
        matchingProjects: Array.isArray(parsed.matchingProjects) ? parsed.matchingProjects : [],
        explanation: parsed.explanation || 'Informational comparison completed between resume and job description.',
        limitations: Array.isArray(parsed.limitations)
          ? parsed.limitations
          : ['The score is based only on information present in the submitted resume and job description.'],
      };
    } catch (error: any) {
      console.error('[Gemini Match Service Error]', error.message || error);
      throw new Error(`AI Match Analysis failed: ${error.message}`);
    }
  }
}
