import { GoogleGenAI } from '@google/genai';
import { IResumeAnalysis } from '../types';

export class GeminiService {
  private static getAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace_with_your_gemini_api_key' || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured in server environment variables.');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Analyze raw resume text using Gemini AI and return structured JSON output
   */
  public static async analyzeResume(resumeText: string): Promise<IResumeAnalysis> {
    try {
      const ai = this.getAiClient();

      const systemInstruction = `
You are an expert resume parsing AI. Analyze the provided resume text and extract all relevant structured information into a single valid JSON object.

CRITICAL EXTRACTION RULES:
1. Return ONLY a valid, parseable JSON object matching the exact JSON structure specified below. Do not wrap the JSON in extra text or markdown formatting except standard json fenced blocks.
2. Only extract information that is explicitly present or strongly supported by the resume text. Do not invent, fabricate, or infer credentials, employers, skills, dates, degrees, projects, or achievements.
3. If a specific field or section is not present in the resume text, set string fields to null and array fields to empty array [].
4. Organize skills into appropriate categories: programmingLanguages, frameworks, libraries, databases, tools, cloud, other.

JSON RESPONSE SCHEMA:
{
  "personalInfo": {
    "fullName": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "github": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string summary or null",
  "skills": {
    "programmingLanguages": ["string"],
    "frameworks": ["string"],
    "libraries": ["string"],
    "databases": ["string"],
    "tools": ["string"],
    "cloud": ["string"],
    "other": ["string"]
  },
  "education": [
    {
      "degree": "string or null",
      "institution": "string or null",
      "field": "string or null",
      "startYear": "string or null",
      "endYear": "string or null",
      "grade": "string or null"
    }
  ],
  "experience": [
    {
      "company": "string or null",
      "role": "string or null",
      "startDate": "string or null",
      "endDate": "string or null",
      "description": ["string bullet point"]
    }
  ],
  "projects": [
    {
      "name": "string or null",
      "description": "string or null",
      "technologies": ["string"],
      "role": "string or null",
      "duration": "string or null"
    }
  ],
  "certifications": [
    {
      "name": "string or null",
      "issuer": "string or null",
      "date": "string or null"
    }
  ]
}
`;

      const prompt = `Analyze the following resume text and extract the structured information in pure JSON according to instructions:\n\n${resumeText}`;

      // List of candidate Gemini model names to try in order of verified availability
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

      let lastError: any = null;
      let responseText: string | null = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`[Gemini AI Service] Attempting resume extraction using model '${modelName}'...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          if (response.text && response.text.trim().length > 10) {
            responseText = response.text;
            console.log(`[Gemini AI Service] Successfully extracted with model '${modelName}'`);
            break;
          }
        } catch (err: any) {
          console.warn(`[Gemini AI Model Warning] Model '${modelName}' failed:`, err?.message || err);
          lastError = err;
        }
      }

      if (responseText) {
        // Clean response text if wrapped in ```json ... ```
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        try {
          const parsedAnalysis = JSON.parse(cleanedText);
          return this.sanitizeAnalysis(parsedAnalysis, resumeText);
        } catch (jsonErr) {
          console.warn('[Gemini AI Service] JSON parse failed, utilizing safe heuristic parser:', jsonErr);
        }
      }

      console.warn('[Gemini AI Service] Remote Gemini calls failed, using resilient heuristic parser fallback.');
      return this.extractHeuristicFallback(resumeText);
    } catch (error: any) {
      console.warn('[Gemini AI Service Recovered] Using heuristic fallback after exception:', error.message || error);
      return this.extractHeuristicFallback(resumeText);
    }
  }

  /**
   * Helper to ensure defaults exist for all fields and map camelCase/snake_case variations
   */
  private static sanitizeAnalysis(data: any, originalText?: string): IResumeAnalysis {
    const pInfo = data?.personalInfo || data?.personal_information || data?.contact || {};
    const sk = data?.skills || data?.technical_skills || data?.skills_by_category || {};

    let fullName = pInfo?.fullName || pInfo?.full_name || pInfo?.name || data?.name || null;
    let email = pInfo?.email || data?.email || null;
    let phone = pInfo?.phone || pInfo?.phoneNumber || data?.phone || null;
    let location = pInfo?.location || pInfo?.address || data?.location || null;
    let linkedin = pInfo?.linkedin || pInfo?.linkedIn || data?.linkedin || null;
    let github = pInfo?.github || data?.github || null;
    let portfolio = pInfo?.portfolio || pInfo?.website || data?.portfolio || null;

    // Fill missing basic contact info from original text if available
    if (originalText) {
      if (!email) {
        const emailMatch = originalText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) email = emailMatch[0];
      }
      if (!phone) {
        const phoneMatch = originalText.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/);
        if (phoneMatch) phone = phoneMatch[0];
      }
      if (!fullName) {
        const firstLine = originalText.split('\n').map((l) => l.trim()).find((l) => l.length > 2 && l.length < 50 && !l.includes('@'));
        if (firstLine) fullName = firstLine;
      }
    }

    const toStringArray = (val: any): string[] => {
      if (Array.isArray(val)) return val.map((v) => (typeof v === 'string' ? v.trim() : String(v))).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
      return [];
    };

    return {
      personalInfo: {
        fullName,
        email,
        phone,
        location,
        linkedin,
        github,
        portfolio,
      },
      summary: data?.summary || data?.professional_summary || data?.objective || null,
      skills: {
        programmingLanguages: toStringArray(sk?.programmingLanguages || sk?.programming_languages || sk?.languages),
        frameworks: toStringArray(sk?.frameworks || sk?.libraries_and_frameworks || sk?.technologies),
        libraries: toStringArray(sk?.libraries),
        databases: toStringArray(sk?.databases),
        tools: toStringArray(sk?.tools || sk?.developer_tools || sk?.devops),
        cloud: toStringArray(sk?.cloud || sk?.cloud_platforms),
        other: toStringArray(sk?.other || sk?.core_competencies),
      },
      education: Array.isArray(data?.education)
        ? data.education.map((edu: any) => ({
            degree: edu?.degree || edu?.title || null,
            institution: edu?.institution || edu?.school || edu?.university || null,
            field: edu?.field || edu?.major || null,
            startYear: edu?.startYear || edu?.start_year || edu?.startDate || null,
            endYear: edu?.endYear || edu?.end_year || edu?.endDate || null,
            grade: edu?.grade || edu?.cgpa || edu?.gpa || null,
          }))
        : [],
      experience: Array.isArray(data?.experience || data?.work_experience || data?.employment_history)
        ? (data.experience || data.work_experience || data.employment_history).map((exp: any) => ({
            company: exp?.company || exp?.organization || exp?.employer || null,
            role: exp?.role || exp?.title || exp?.position || null,
            startDate: exp?.startDate || exp?.start_date || null,
            endDate: exp?.endDate || exp?.end_date || null,
            description: toStringArray(exp?.description || exp?.responsibilities || exp?.highlights),
          }))
        : [],
      projects: Array.isArray(data?.projects || data?.personal_projects)
        ? (data.projects || data.personal_projects).map((proj: any) => ({
            name: proj?.name || proj?.title || null,
            description: proj?.description || proj?.summary || null,
            technologies: toStringArray(proj?.technologies || proj?.tech_stack || proj?.tools),
            role: proj?.role || null,
            duration: proj?.duration || null,
          }))
        : [],
      certifications: Array.isArray(data?.certifications || data?.licenses_and_certifications)
        ? (data.certifications || data.licenses_and_certifications).map((cert: any) => ({
            name: cert?.name || cert?.title || null,
            issuer: cert?.issuer || cert?.organization || null,
            date: cert?.date || cert?.issue_date || null,
          }))
        : [],
    };
  }

  /**
   * Resilient heuristic extraction fallback if all remote Gemini models are unavailable
   */
  private static extractHeuristicFallback(text: string): IResumeAnalysis {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // Extract basic personal info
    let fullName = lines.find((l) => l.length > 2 && l.length < 50 && !l.includes('@') && !l.toLowerCase().includes('resume')) || null;
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/);
    const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const githubMatch = text.match(/github\.com\/[a-zA-Z0-9_-]+/i);

    // Common skills dictionaries
    const langDict = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS'];
    const fwDict = ['React', 'Next.js', 'Node.js', 'Express', 'Angular', 'Vue', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Tailwind CSS', 'Redux'];
    const dbDict = ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Oracle', 'Elasticsearch', 'Firebase'];
    const cloudDict = ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Vercel', 'Netlify'];
    const toolDict = ['Git', 'GitHub', 'CI/CD', 'Linux', 'Jest', 'Postman', 'Webpack', 'Vite', 'Jira'];

    const findMatches = (dict: string[]) => dict.filter((item) => new RegExp(`\\b${item.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}\\b`, 'i').test(text));

    return {
      personalInfo: {
        fullName,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        location: null,
        linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : null,
        github: githubMatch ? `https://${githubMatch[0]}` : null,
        portfolio: null,
      },
      summary: lines.slice(1, 4).join(' ').slice(0, 300) || null,
      skills: {
        programmingLanguages: findMatches(langDict),
        frameworks: findMatches(fwDict),
        libraries: [],
        databases: findMatches(dbDict),
        tools: findMatches(toolDict),
        cloud: findMatches(cloudDict),
        other: [],
      },
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    };
  }
}
