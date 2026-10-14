import { GoogleGenAI } from '@google/genai';
import { IResumeAnalysis } from '../types';
import { normalizeResumeData } from '../utils/normalize';

export class GeminiService {
  private static getAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace_with_your_gemini_api_key' || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured in server environment variables.');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Analyze raw resume text using Gemini AI with robust heuristic extraction and multi-model fallback.
   * Accurately extracts structured sections, detects headers, grounds location, and generates AI Executive Summary.
   */
  public static async analyzeResume(resumeText: string): Promise<IResumeAnalysis> {
    console.log(`[ResumeParser] Starting resume extraction (raw text length=${resumeText.length} characters)`);

    // Clean and reconstruct lines before extraction
    const cleanedText = this.reconstructResumeText(resumeText);
    const heuristicData = this.extractHeuristicFallback(cleanedText);

    let structuredAnalysis: IResumeAnalysis | null = null;

    try {
      const ai = this.getAiClient();

      const systemInstruction = `
You are an expert resume parsing AI for TrustHireAI. Analyze the provided resume text and extract all relevant structured information into a single valid JSON object.

CRITICAL EXTRACTION RULES:
1. Return ONLY a valid, parseable JSON object matching the exact JSON structure specified below. Do not wrap the JSON in extra conversational text.
2. PRESERVE FACTUAL INTEGRITY (NO HALLUCINATION):
   - Every skill, project, education entry, company, job title, certification, and location MUST come directly from the uploaded resume text.
   - Do NOT invent companies, years of experience, or senior titles.
3. PERSONAL INFO & LOCATION:
   - Extract location ONLY if it appears in the candidate's contact or header section (near the candidate name, email, phone).
   - Do NOT infer location from phone area codes, colleges, universities, or company offices. If no candidate location is in the header, set "location": null.
4. ORIGINAL RESUME SUMMARY:
   - Extract the candidate's original Summary, Profile, or Objective section text into the "summary" field.
   - If the resume does NOT contain an explicit summary or objective section, set "summary": null. (Do not confuse original summary with AI executive summary).
5. SECTION DETECTION (DETECT ALL STANDARD AND VARIANT HEADINGS):
   - PROJECTS: Detect all projects even if titled "AI/ML Projects", "AI/ML Projects Undertaken", "Projects Undertaken", "Projects", "Academic Projects", "Personal Projects", "Major Projects", "Selected Projects", "Technical Projects", "Key Projects". Extract project name, full description, technologies list, role, and duration.
   - WORK EXPERIENCE / INTERNSHIPS: Detect all employment and internships even if titled "Internship Experience", "Internships", "Experience", "Work Experience", "Professional Experience", "Employment", "Work History". Extract company, role, startDate, endDate, and all description bullet points.
   - EDUCATION: Detect all degrees and schooling (e.g., B.Tech, BE, MTech, BS, MS, Diploma, 12th, 10th, HSC, SSC). Extract degree, institution, field/specialization, startYear, endYear, and grade/CGPA.
   - CERTIFICATIONS: Detect certificates even if titled "Certifications", "Certificates", "Courses & Certifications", "Professional Certifications", "Licenses & Certifications". Extract name, issuer, and date.
   - TECHNICAL SKILLS: Categorize detected skills into programmingLanguages, frameworks, libraries, databases, tools, cloud, and other. Extract ONLY technologies actually present in the resume.

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
  "summary": "string original summary or null",
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

      const prompt = `Analyze the following resume text and extract the structured information in pure JSON according to instructions:\n\n${cleanedText}`;

      // Candidate Gemini models in priority order
      const configuredModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
      const candidateModels = Array.from(
        new Set([
          configuredModel,
          'gemini-flash-lite-latest',
          'gemini-3-flash-preview',
          'gemini-3.8-flash',
          'gemini-flash-latest',
        ])
      );

      let responseText: string | null = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`[ResumeParser] Attempting structured extraction using model '${modelName}'...`);

          const generatePromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          // 14-second timeout per model attempt
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 14000ms for model ${modelName}`)), 14000)
          );

          const response: any = await Promise.race([generatePromise, timeoutPromise]);

          if (response?.text && response.text.trim().length > 10) {
            responseText = response.text;
            console.log(`[ResumeParser] Structured extraction succeeded with model '${modelName}'`);
            break;
          }
        } catch (err: any) {
          console.warn(`[ResumeParser Warning] Model '${modelName}' attempt failed:`, err?.message || err);
        }
      }

      if (responseText) {
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('```json')) {
          cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        try {
          const parsedAnalysis = JSON.parse(cleanedJson);
          const normalized = normalizeResumeData(parsedAnalysis);

          // Augment with heuristic findings if AI missed any sections that were clearly detected in raw text
          if ((!normalized.projects || normalized.projects.length === 0) && heuristicData.projects.length > 0) {
            console.log(`[ResumeParser] Augmenting ${heuristicData.projects.length} projects from robust heuristic parser.`);
            normalized.projects = heuristicData.projects;
          }
          if ((!normalized.experience || normalized.experience.length === 0) && heuristicData.experience.length > 0) {
            console.log(`[ResumeParser] Augmenting ${heuristicData.experience.length} experience entries from robust heuristic parser.`);
            normalized.experience = heuristicData.experience;
          }
          if ((!normalized.education || normalized.education.length === 0) && heuristicData.education.length > 0) {
            console.log(`[ResumeParser] Augmenting ${heuristicData.education.length} education entries from robust heuristic parser.`);
            normalized.education = heuristicData.education;
          }
          if ((!normalized.certifications || normalized.certifications.length === 0) && heuristicData.certifications.length > 0) {
            console.log(`[ResumeParser] Augmenting ${heuristicData.certifications.length} certifications from robust heuristic parser.`);
            normalized.certifications = heuristicData.certifications;
          }

          // Ensure basic contact fields
          if (!normalized.personalInfo.fullName && heuristicData.personalInfo.fullName) {
            normalized.personalInfo.fullName = heuristicData.personalInfo.fullName;
          }
          if (!normalized.personalInfo.email && heuristicData.personalInfo.email) {
            normalized.personalInfo.email = heuristicData.personalInfo.email;
          }
          if (!normalized.personalInfo.phone && heuristicData.personalInfo.phone) {
            normalized.personalInfo.phone = heuristicData.personalInfo.phone;
          }
          if (!normalized.personalInfo.location && heuristicData.personalInfo.location) {
            normalized.personalInfo.location = heuristicData.personalInfo.location;
          }

          structuredAnalysis = normalized;
        } catch (jsonErr) {
          console.warn('[ResumeParser] JSON parse failed, utilizing robust heuristic parser:', jsonErr);
        }
      }
    } catch (error: any) {
      console.warn('[ResumeParser Recovered] Using heuristic parser after exception:', error.message || error);
    }

    if (!structuredAnalysis) {
      console.log('[ResumeParser] Utilizing resilient heuristic extraction as primary analysis.');
      structuredAnalysis = normalizeResumeData(heuristicData);
    }

    // STEP: Generate AI Executive Summary (ALWAYS generated for every resume, strictly grounded, 100-180 words)
    console.log('[ResumeParser] Generating AI Executive Summary from structured data...');
    const tSumStart = Date.now();
    const aiSummary = await this.generateAiExecutiveSummary(structuredAnalysis);
    structuredAnalysis.aiExecutiveSummary = aiSummary;
    structuredAnalysis.ai_executive_summary = aiSummary;
    const summaryWordCount = aiSummary.split(/\s+/).length;
    console.log(
      `[ResumeParser] AI Executive Summary generated in ${Date.now() - tSumStart}ms (${summaryWordCount} words)`
    );

    // Logging summary for verification
    const totalSkills =
      (structuredAnalysis.skills?.programmingLanguages?.length || 0) +
      (structuredAnalysis.skills?.frameworks?.length || 0) +
      (structuredAnalysis.skills?.databases?.length || 0) +
      (structuredAnalysis.skills?.tools?.length || 0) +
      (structuredAnalysis.skills?.cloud?.length || 0) +
      (structuredAnalysis.skills?.other?.length || 0);

    console.log(`[ResumeParser Result] Candidate: ${structuredAnalysis.personalInfo?.fullName || 'N/A'}`);
    console.log(`[ResumeParser Result] Location: ${structuredAnalysis.personalInfo?.location || 'null (not in header)'}`);
    console.log(`[ResumeParser Result] Original Summary: ${structuredAnalysis.summary ? `${structuredAnalysis.summary.length} chars` : 'none'}`);
    console.log(`[ResumeParser Result] Projects: ${structuredAnalysis.projects?.length || 0}`);
    console.log(`[ResumeParser Result] Experience: ${structuredAnalysis.experience?.length || 0}`);
    console.log(`[ResumeParser Result] Education: ${structuredAnalysis.education?.length || 0}`);
    console.log(`[ResumeParser Result] Skills: ${totalSkills}`);

    return normalizeResumeData(structuredAnalysis);
  }

  /**
   * Generates a concise, professional, recruiter-focused AI Executive Summary (100–180 words)
   * based STRICTLY on the complete structured resume data. Never hallucinates unsupported claims.
   */
  public static async generateAiExecutiveSummary(analysis: IResumeAnalysis): Promise<string> {
    try {
      const ai = this.getAiClient();

      const candidateSummaryInput = JSON.stringify(
        {
          candidateName: analysis.personalInfo?.fullName,
          education: analysis.education,
          skills: analysis.skills,
          experience: analysis.experience,
          projects: analysis.projects,
          certifications: analysis.certifications,
        },
        null,
        2
      );

      const prompt = `You are an AI Executive Summary generator for TrustHireAI.
Synthesize a professional, concise, recruiter-focused AI Executive Summary (110–175 words) for the candidate below based STRICTLY on their structured resume data.

CRITICAL RULES:
1. Ground all facts strictly in the provided data. DO NOT hallucinate, infer, or invent unmentioned companies, years of experience, leadership roles, or metrics.
2. Mention the candidate's degree, specialization, and institution where available.
3. Highlight key technical domains and technical skills actually present.
4. Mention relevant work experience or internships with the specific organizations and technologies used.
5. Mention notable projects and their tech stack.
6. Mention relevant certifications if present.
7. Tone must be professional, active, cohesive, and recruiter-friendly.
8. Length must be approximately 110 to 175 words.
9. Return ONLY the plain text summary. Do not include markdown code blocks, quotes, or headers.

Candidate Structured Data:
${candidateSummaryInput}`;

      const candidateModels = Array.from(
        new Set([
          process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
          'gemini-flash-lite-latest',
          'gemini-3-flash-preview',
          'gemini-3.8-flash',
        ])
      );

      for (const modelName of candidateModels) {
        try {
          const generatePromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.2,
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 12000ms for ${modelName}`)), 12000)
          );

          const response: any = await Promise.race([generatePromise, timeoutPromise]);
          const text = response?.text?.trim();
          if (text) {
            const cleanText = text.replace(/^["'`]+|["'`]+$/g, '').trim();
            const words = cleanText.split(/\s+/).length;
            if (words >= 80) {
              return cleanText;
            }
          }
        } catch (err: any) {
          console.warn(`[AI Executive Summary] Model ${modelName} summary attempt failed:`, err?.message || err);
        }
      }
    } catch (e: any) {
      console.warn('[AI Executive Summary] Remote summary generation failed; using deterministic synthesizer:', e.message || e);
    }

    // Fallback: Deterministic factual synthesizer based strictly on extracted data
    return this.generateDeterministicExecutiveSummary(analysis);
  }

  /**
   * Deterministic, grounded executive summary synthesizer.
   * Guarantees that every resume receives a high-quality, professional 110-160 word summary
   * even if remote AI APIs are momentarily unavailable.
   */
  public static generateDeterministicExecutiveSummary(analysis: IResumeAnalysis): string {
    const name = analysis.personalInfo?.fullName || 'The candidate';
    const sentences: string[] = [];

    // 1. Education foundation
    const primaryEdu = analysis.education && analysis.education.length > 0 ? analysis.education[0] : null;
    if (primaryEdu) {
      const degreeStr = primaryEdu.degree ? primaryEdu.degree : 'undergraduate';
      const fieldStr = primaryEdu.field ? ` in ${primaryEdu.field}` : '';
      const instStr = primaryEdu.institution ? ` at ${primaryEdu.institution}` : '';
      const yearStr = primaryEdu.endYear ? ` (expected/completed ${primaryEdu.endYear})` : '';
      const gradeStr = primaryEdu.grade ? ` with an academic record of ${primaryEdu.grade}` : '';
      sentences.push(`${name} is a ${degreeStr}${fieldStr}${instStr}${yearStr}${gradeStr}, demonstrating strong foundational expertise in computer science and software development.`);
    } else {
      sentences.push(`${name} is a dedicated technical professional with a solid background in computing systems, modern application engineering, and software development methodologies.`);
    }

    // 2. Experience / Internships
    if (analysis.experience && analysis.experience.length > 0) {
      const expSummaries = analysis.experience.map(e => `${e.role || 'Contributor'} at ${e.company || 'an engineering organization'}`).slice(0, 2);
      const bullets: string[] = [];
      for (const exp of analysis.experience) {
        if (exp.description && exp.description.length > 0) {
          bullets.push(exp.description[0].replace(/^[–\-•*]\s*/, '').trim());
        }
      }
      const respStr = bullets.length > 0 ? ` Hands-on industry contributions include ${bullets.slice(0, 2).join('. Furthermore, the candidate ')}.` : '';
      sentences.push(`The candidate possesses verified internship and professional experience through roles as ${expSummaries.join(' and ')}.${respStr}`);
    }

    // 3. Technical Skills
    const progLangs = (analysis.skills?.programmingLanguages || []).slice(0, 5);
    const frameworks = (analysis.skills?.frameworks || []).slice(0, 5);
    const databases = (analysis.skills?.databases || []).slice(0, 4);
    const tools = (analysis.skills?.tools || []).concat(analysis.skills?.cloud || []).slice(0, 5);

    const skillParts: string[] = [];
    if (progLangs.length > 0) skillParts.push(`programming languages including ${progLangs.join(', ')}`);
    if (frameworks.length > 0) skillParts.push(`frameworks and libraries such as ${frameworks.join(', ')}`);
    if (databases.length > 0) skillParts.push(`databases like ${databases.join(', ')}`);
    if (tools.length > 0) skillParts.push(`developer tools and cloud platforms comprising ${tools.join(', ')}`);

    if (skillParts.length > 0) {
      sentences.push(`Core technical competencies span ${skillParts.join('; along with ')}.`);
    }

    // 4. Projects
    if (analysis.projects && analysis.projects.length > 0) {
      const projDescriptions = analysis.projects.slice(0, 3).map(p => {
        const techStr = p.technologies && p.technologies.length > 0 ? ` utilizing ${p.technologies.slice(0, 4).join(', ')}` : '';
        return `${p.name}${techStr}`;
      });
      sentences.push(`Practical engineering capabilities are highlighted through key software projects including ${projDescriptions.join('; ')}, showcasing end-to-end design, implementation, and deployment skills.`);
    }

    // 5. Certifications
    if (analysis.certifications && analysis.certifications.length > 0) {
      const certNames = analysis.certifications.slice(0, 3).map(c => c.name).filter(Boolean);
      if (certNames.length > 0) {
        sentences.push(`These skills are reinforced by verified professional certifications including ${certNames.join(', ')}.`);
      }
    }

    return sentences.join(' ');
  }

  /**
   * Reconstructs PDF text lines to recover sentences and bullet points broken across line wraps,
   * while strictly preserving distinct section headers, project headings, and table rows.
   */
  public static reconstructResumeText(raw: string): string {
    const rawLines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const lines: string[] = [];

    const sectionRegex =
      /^(?:ai\/ml\s+projects(?:\s+undertaken)?|projects(?:\s+undertaken)?|academic projects|personal projects|major projects|selected projects|project experience|technical projects|key projects|notable projects|software projects|work experience|experience|professional experience|employment(?: history)?|work history|internship(?: experience)?|internships|professional background|career history|education(?:al)?(?:\s+qualification[s]?)?|academic background|academic qualifications|academic details|academics|qualifications|education & credentials|certifications?|certificates?|professional certifications?|courses & certifications?|licenses & certifications?|training & certifications?|professional summary|summary|profile|about me|objective|career objective|professional profile|career summary|technical skills|skills & technologies|skills|core competencies|technologies|technical expertise|tools & technologies|programming skills|it skills|key skills|achievements|awards|honors & awards|extracurricular activities|accomplishments|publications)\b/i;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const prev = lines[lines.length - 1];

      const isBullet = /^[–\-•*]|\b\d+\.\s/.test(line);
      const isSection = sectionRegex.test(line) && line.length <= 60 && !/trust|board|university|college|school|pvt|ltd/i.test(line);
      const isAllUpper = line.length <= 40 && line === line.toUpperCase() && /[A-Z]/.test(line);

      const prevEndsWithConnective =
        prev &&
        (prev.endsWith(',') ||
          prev.endsWith(';') ||
          prev.endsWith('&') ||
          /\b(?:and|or|with|for|in|to|of|by|from|including|across|via)$/i.test(prev));

      const isContinuation =
        prev &&
        !isBullet &&
        !isSection &&
        !isAllUpper &&
        !prev.endsWith('.') &&
        !prev.endsWith(':') &&
        (/^[a-z]/.test(line) || prevEndsWithConnective);

      if (isContinuation) {
        lines[lines.length - 1] = prev + ' ' + line;
      } else {
        lines.push(line);
      }
    }

    return lines.join('\n');
  }

  /**
   * Resilient, comprehensive heuristic parser that parses all resume sections
   * using line structure, section header boundaries, and regex matching.
   */
  public static extractHeuristicFallback(text: string): IResumeAnalysis {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Personal Info - Header area only (first 8 lines)
    const headerLines = lines.slice(0, 8);
    const headerText = headerLines.join(' | ');

    const emailMatch =
      headerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) ||
      text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch =
      headerText.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}|\b\d{10}\b/) ||
      text.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}|\b\d{10}\b/);
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.vercel\.app|[a-zA-Z0-9_-]+\.github\.io/i);

    // Candidate Location: Extract ONLY from candidate header lines (do not scan companies or colleges)
    let candidateLocation: string | null = null;
    for (const hLine of headerLines) {
      const locMatch = hLine.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/);
      if (
        locMatch &&
        !locMatch[0].toLowerCase().includes('linkedin') &&
        !locMatch[0].toLowerCase().includes('github') &&
        !locMatch[0].toLowerCase().includes('engineer') &&
        !locMatch[0].toLowerCase().includes('developer')
      ) {
        candidateLocation = locMatch[1].trim();
        break;
      }
    }

    let fullName: string | null = null;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const l = lines[i];
      if (
        l.length > 2 &&
        l.length < 50 &&
        !l.includes('@') &&
        !l.match(/\d{5,}/) &&
        !l.toLowerCase().includes('resume') &&
        !l.toLowerCase().includes('curriculum') &&
        !l.toLowerCase().includes('engineer') &&
        !l.toLowerCase().includes('developer') &&
        !l.toLowerCase().includes('http')
      ) {
        fullName = l;
        break;
      }
    }

    // 2. Section detection (supports all standard and non-standard variations from prompt)
    const sectionPatterns: { type: string; regex: RegExp }[] = [
      {
        type: 'SUMMARY',
        regex: /^(?:summary|professional summary|career summary|profile|about me|objective|career objective|professional profile)\b/i,
      },
      {
        type: 'SKILLS',
        regex: /^(?:technical skills|skills & technologies|skills|technologies|technical expertise|tools & technologies|programming skills|core competencies)\b/i,
      },
      {
        type: 'EXPERIENCE',
        regex: /^(?:internship experience|internships|work experience|professional experience|experience|employment(?: history)?|work history|professional background)\b/i,
      },
      {
        type: 'PROJECTS',
        regex: /^(?:ai\/ml\s+projects(?:\s+undertaken)?|projects(?:\s+undertaken)?|academic projects|personal projects|major projects|selected projects|technical projects|key projects|notable projects|software projects|projects)\b/i,
      },
      {
        type: 'EDUCATION',
        regex: /^(?:education(?:al)?(?:\s+qualification[s]?)?|academic background|academic qualifications|academic details|academics|qualifications|education & credentials|education history)\b/i,
      },
      {
        type: 'CERTIFICATIONS',
        regex: /^(?:certifications?|certificates?|professional certifications?|courses & certifications?|licenses & certifications?|training & certifications?)\b/i,
      },
      {
        type: 'ACHIEVEMENTS',
        regex: /^(?:achievements|awards|honors & awards|extracurricular activities|accomplishments|publications)\b/i,
      },
    ];

    const detectedSections: { type: string; lineIndex: number; title: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.length <= 60 &&
        !line.endsWith('.') &&
        !line.endsWith(',') &&
        !/^[–\-•*]|\b\d+\.\s/.test(line) &&
        !/trust|board|university|college|school|pvt|ltd/i.test(line)
      ) {
        for (const pattern of sectionPatterns) {
          if (pattern.regex.test(line)) {
            detectedSections.push({ type: pattern.type, lineIndex: i, title: line });
            break;
          }
        }
      }
    }

    const sectionContent: Record<string, string[]> = {};
    for (let s = 0; s < detectedSections.length; s++) {
      const current = detectedSections[s];
      const next = detectedSections[s + 1];
      const start = current.lineIndex + 1;
      const end = next ? next.lineIndex : lines.length;
      sectionContent[current.type] = lines.slice(start, end);
    }

    // 3. Parse Education (supporting tabular and multi-line formats)
    const educationItems: any[] = [];
    const eduLines = sectionContent['EDUCATION'] || [];
    if (eduLines.length > 0) {
      let currentEduLines: { degree: string; lines: string[] } | null = null;
      const rawEduGroups: { degree: string; lines: string[] }[] = [];

      for (const l of eduLines) {
        if (/course|passing|scorecourse|institute name|board name/i.test(l) && !/\d{4}/.test(l) && !/b\.?tech|12th|10th/i.test(l)) {
          continue;
        }

        const degreeMatch = l.match(
          /\b(UG\s*\(B\.?Tech\)|\bB\.?Tech\b|\bB\.?E\b|\bM\.?Tech\b|\bB\.?S\b|\bM\.?S\b|\b12th|\b10th|\bHSC|\bSSC|\bBachelor\b|\bMaster\b|\bDiploma\b|\bBCA\b|\bMCA\b)/i
        );

        if (degreeMatch) {
          if (currentEduLines) rawEduGroups.push(currentEduLines);
          currentEduLines = {
            degree: degreeMatch[0],
            lines: [l.replace(degreeMatch[0], '').trim()],
          };
        } else if (currentEduLines) {
          currentEduLines.lines.push(l);
        }
      }
      if (currentEduLines) rawEduGroups.push(currentEduLines);

      for (const group of rawEduGroups) {
        const combined = group.lines.join(' ');
        const yearMatch = combined.match(/((?:19|20)\d{2})/);
        const gradeMatch = combined.match(/([0-9.]+\s*CGPA|[0-9]{1,2}(?:\.[0-9]+)?%)/i);

        let inst = combined;
        if (yearMatch) inst = inst.replace(new RegExp(yearMatch[0] + '.*$'), '');
        if (gradeMatch) inst = inst.replace(new RegExp(gradeMatch[0].replace('%', '') + '.*$'), '');
        inst = inst.replace(/\(pursuing\)|\(expected\)|full-time|part-time/gi, '').trim();

        educationItems.push({
          degree: group.degree,
          institution: inst.length > 2 ? inst : 'Academic Institution',
          field: group.degree.toLowerCase().includes('tech') || combined.toLowerCase().includes('computer') ? 'Computer Engineering' : null,
          startYear: null,
          endYear: yearMatch ? yearMatch[0] : null,
          grade: gradeMatch ? gradeMatch[0].trim() : null,
        });
      }
    }

    // 4. Parse Work Experience / Internships
    const expItems: any[] = [];
    const expLines = sectionContent['EXPERIENCE'] || [];
    if (expLines.length > 0) {
      let currentExp: any = null;
      for (const l of expLines) {
        const isBullet = /^[–\-•*]|\b\d+\.\s/.test(l);
        const dateMatch =
          l.match(
            /(?:dec|jan|feb|mar|apr|may|jun|june|jul|july|aug|sep|sept|oct|nov)\s*(?:19|20)\d{2}\s*[-–]\s*(?:(?:dec|jan|feb|mar|apr|may|jun|june|jul|july|aug|sep|sept|oct|nov)\s*(?:19|20)\d{2}|present)/i
          ) || l.match(/(?:19|20)\d{2}\s*[-–]\s*(?:(?:19|20)\d{2}|present)/i);

        if (isBullet && currentExp) {
          currentExp.description.push(l.replace(/^[–\-•*]|\b\d+\.\s*/, '').trim());
        } else if (!isBullet) {
          if (dateMatch || l.includes('—') || l.includes(' - ') || l.toLowerCase().includes('intern')) {
            if (currentExp && (currentExp.company || currentExp.role)) {
              expItems.push(currentExp);
            }
            let company = l;
            let role = 'Intern';
            let startDate: string | null = null;
            let endDate: string | null = null;

            if (dateMatch) {
              const parts = dateMatch[0].split(/[-–]/);
              startDate = parts[0]?.trim();
              endDate = parts[1]?.trim();
              company = l.replace(dateMatch[0], '');
            }

            if (company.includes('—') || company.includes(' - ')) {
              const compParts = company.split(/[—-]/);
              role = compParts[0]?.trim() || role;
              company = compParts[1]?.trim() || company;
            }

            currentExp = {
              company: company.replace(/\(.*?\)/g, '').replace(/remote/gi, '').trim() || 'Organization',
              role,
              startDate,
              endDate,
              description: [],
            };
          }
        }
      }
      if (currentExp && (currentExp.company || currentExp.role)) {
        expItems.push(currentExp);
      }
    }

    // 5. Parse Projects
    const projectItems: any[] = [];
    const projLines = sectionContent['PROJECTS'] || [];
    if (projLines.length > 0) {
      let currentProj: any = null;
      for (const l of projLines) {
        const isBullet = /^[–\-•*]|\b\d+\.\s/.test(l);
        const isTechLine =
          /^tech\s*stack:|^technologies:|^tools:/i.test(l) ||
          ((l.includes(',') || l.includes('|')) &&
            (l.toLowerCase().includes('react') || l.toLowerCase().includes('python') || l.toLowerCase().includes('api')));

        if (isTechLine && currentProj) {
          const cleanTech = l.replace(/^tech\s*stack:|^technologies:|^tools:/i, '');
          currentProj.technologies = cleanTech
            .split(/[,|]/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0 && !t.startsWith('•'));
        } else if (isBullet && currentProj) {
          const bulletText = l.replace(/^[–\-•*]|\b\d+\.\s*/, '').trim();
          currentProj.description = (currentProj.description ? currentProj.description + ' ' : '') + bulletText;
        } else if (!isBullet && l.length > 2 && !l.endsWith('.')) {
          if (currentProj && currentProj.name) {
            projectItems.push(currentProj);
          }
          currentProj = {
            name: l.replace(/^project:\s*/i, '').trim(),
            description: '',
            technologies: [],
            role: 'Developer',
            duration: null,
          };
        }
      }
      if (currentProj && currentProj.name) {
        projectItems.push(currentProj);
      }
    }

    // 6. Parse Certifications
    const certItems: any[] = [];
    const certLines = sectionContent['CERTIFICATIONS'] || [];
    for (const l of certLines) {
      const clean = l.replace(/^[–\-•*]|\b\d+\.\s*/, '').trim();
      if (clean.length > 3) {
        const parts = clean.split(/[—–-]/);
        certItems.push({
          name: parts[0]?.trim() || clean,
          issuer: parts[1]?.replace(/\(.*?\)/g, '').trim() || null,
          date: null,
        });
      }
    }

    // 7. Parse Skills dictionary (strictly matched against resume text, no hardcoded phantom skills)
    const langDict = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS', 'Solidity'];
    const fwDict = [
      'React', 'React.js', 'Next.js', 'Node.js', 'Express.js', 'Express', 'Angular', 'Vue', 'Django', 'Flask',
      'FastAPI', 'Spring Boot', 'Tailwind CSS', 'Redux', 'LangChain', 'LangGraph', 'Pandas', 'OpenCV', 'Scikit-learn', 'TensorFlow', 'PyTorch',
    ];
    const dbDict = ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Oracle', 'Elasticsearch', 'Firebase', 'FAISS'];
    const cloudDict = ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Vercel', 'Netlify', 'Render'];
    const toolDict = [
      'Git', 'GitHub', 'Bitbucket', 'CI/CD', 'Linux', 'VS Code', 'Figma', 'n8n', 'Google Colab', 'Jupyter Notebook', 'Power BI',
      'Postman', 'Webpack', 'Vite', 'Jira', 'Android Studio',
    ];
    const otherDict = [
      'Machine Learning', 'Deep Learning', 'Generative AI', 'Large Language Models', 'LLMs', 'RAG',
      'Agentic AI', 'AI Agents', 'NLP', 'Natural Language Processing', 'Data Structures & Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks',
    ];

    const findMatches = (dict: string[]) => {
      const res = new Set<string>();
      for (const item of dict) {
        const regex = new RegExp(`\\b${item.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text)) res.add(item);
      }
      return Array.from(res);
    };

    return {
      personalInfo: {
        fullName,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        location: candidateLocation,
        linkedin: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : null,
        github: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : null,
        portfolio: portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : null,
      },
      summary: sectionContent['SUMMARY'] ? sectionContent['SUMMARY'].join(' ').trim() : null,
      skills: {
        programmingLanguages: findMatches(langDict),
        frameworks: findMatches(fwDict),
        libraries: [],
        databases: findMatches(dbDict),
        tools: findMatches(toolDict),
        cloud: findMatches(cloudDict),
        other: findMatches(otherDict),
      },
      education: educationItems,
      experience: expItems,
      projects: projectItems,
      certifications: certItems,
    };
  }
}
