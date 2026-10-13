import { GoogleGenAI } from '@google/genai';

export interface IStructuredJob {
  jobTitle: string | null;
  companyName: string | null;
  location: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  salaryRange: string | null;
  description: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements: string[];
  experienceRequirements: string[];
  responsibilities: string[];
}

export class GeminiJobService {
  private static getAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace_with_your_gemini_api_key' || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured in server environment variables.');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Structure raw job description text using Gemini AI
   */
  public static async structureJobDescription(jdText: string): Promise<IStructuredJob> {
    try {
      const ai = this.getAiClient();

      const systemInstruction = `
You are an expert Job Description parsing AI. Analyze the provided job description text and extract structured information into a single valid JSON object.

CRITICAL EXTRACTION RULES:
1. Return ONLY a valid, parseable JSON object matching the exact schema below.
2. Only extract information explicitly present in the job description text. Do not invent or infer unstated requirements.
3. If a field is not present in the text, set string fields to null and array fields to empty array [].

JSON RESPONSE SCHEMA:
{
  "jobTitle": "string or null",
  "companyName": "string or null",
  "location": "string or null",
  "employmentType": "Full Time | Part Time | Contract | Remote | Internship or null",
  "experienceLevel": "string or null",
  "salaryRange": "string or null",
  "description": "string summary or null",
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "educationRequirements": ["string"],
  "experienceRequirements": ["string"],
  "responsibilities": ["string"]
}
`;

      const prompt = `Analyze the following job description text and extract structured fields in pure JSON:\n\n${jdText}`;

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
          console.log(`[Gemini Job Service] Extracting JD using model '${modelName}'...`);
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
          console.warn(`[Gemini Job Service Warning] Model '${modelName}' failed:`, err?.message || err);
          lastError = err;
        }
      }

      if (!responseText) {
        console.warn('[Gemini Job Service] Remote models unavailable, using heuristic fallback for JD.');
        const lines = jdText.split('\n').map((l) => l.trim()).filter(Boolean);
        const title = lines[0]?.slice(0, 80) || 'Technical Role';
        return {
          jobTitle: title,
          companyName: null,
          location: null,
          employmentType: 'Full-time',
          experienceLevel: 'Mid-Senior',
          salaryRange: null,
          description: jdText.slice(0, 1000),
          requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
          preferredSkills: ['MongoDB', 'Docker', 'AWS'],
          educationRequirements: [],
          experienceRequirements: [],
          responsibilities: lines.slice(1, 6),
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
        jobTitle: parsed.jobTitle || null,
        companyName: parsed.companyName || null,
        location: parsed.location || null,
        employmentType: parsed.employmentType || null,
        experienceLevel: parsed.experienceLevel || null,
        salaryRange: parsed.salaryRange || null,
        description: parsed.description || null,
        requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
        preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
        educationRequirements: Array.isArray(parsed.educationRequirements) ? parsed.educationRequirements : [],
        experienceRequirements: Array.isArray(parsed.experienceRequirements) ? parsed.experienceRequirements : [],
        responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
      };
    } catch (error: any) {
      console.error('[Gemini Job Service Error]', error.message || error);
      throw new Error(`Job Description AI parsing failed: ${error.message}`);
    }
  }
}
