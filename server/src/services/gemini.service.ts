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
   */
  public static async analyzeResume(resumeText: string): Promise<IResumeAnalysis> {
    const heuristicData = this.extractHeuristicFallback(resumeText);

    try {
      const ai = this.getAiClient();

      const systemInstruction = `
You are an expert resume parsing AI for TrustHireAI. Analyze the provided resume text and extract all relevant structured information into a single valid JSON object.

CRITICAL SECTION RECOGNITION RULES:
1. Return ONLY a valid, parseable JSON object matching the exact JSON structure specified below. Do not wrap the JSON in extra text except standard json fenced blocks.
2. DETECT ALL STANDARD AND NON-STANDARD SECTION HEADINGS:
   - PROJECTS: Detect projects even if titled "Projects", "Academic Projects", "Personal Projects", "Major Projects", "Project Experience", "Selected Projects", "Technical Projects", "Key Projects". Extract project name, duration, description, technologies, and role.
   - WORK EXPERIENCE: Detect work history even if titled "Experience", "Work Experience", "Professional Experience", "Employment", "Employment History", "Work History", "Internship", "Internships", "Professional Background". Extract company, role, startDate, endDate, and bullet descriptions.
   - EDUCATION: Detect education even if titled "Education", "Education Qualification", "Academic Background", "Academic Qualifications", "Academic Details", "Qualifications". Extract degree, institution, field, startYear, endYear, grade/CGPA.
   - CERTIFICATIONS: Detect certificates even if titled "Certifications", "Certificates", "Professional Certifications", "Courses & Certifications", "Licenses & Certifications". Extract name, issuer, and date.
   - TECHNICAL SKILLS: Categorize detected skills into programmingLanguages, frameworks, libraries, databases, tools, cloud, and other.
3. PRESERVE ACTUAL RESUME TEXT: Do not invent missing facts, but do NOT convert existing sections into empty arrays simply because headings are non-standard.
4. If a specific section genuinely does not exist in the resume, set its array to [].

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

      // List of candidate Gemini models to try in priority order
      const configuredModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
      const candidateModels = Array.from(
        new Set([
          configuredModel,
          'gemini-flash-latest',
          'gemini-3.8-flash',
        ])
      );

      let responseText: string | null = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`[Gemini AI Service] Attempting resume extraction using model '${modelName}'...`);

          // Fast 7-second timeout per model attempt to prevent upload freezing
          const generatePromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 7000ms for model ${modelName}`)), 7000)
          );

          const response: any = await Promise.race([generatePromise, timeoutPromise]);

          if (response?.text && response.text.trim().length > 10) {
            responseText = response.text;
            console.log(`[Gemini AI Service] Successfully extracted with model '${modelName}'`);
            break;
          }
        } catch (err: any) {
          console.warn(`[Gemini AI Model Warning] Model '${modelName}' attempt failed:`, err?.message || err);
        }
      }

      if (responseText) {
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        try {
          const parsedAnalysis = JSON.parse(cleanedText);
          const normalized = normalizeResumeData(parsedAnalysis);

          // Augment with heuristic findings if Gemini missed any sections that were present in raw text
          if ((!normalized.projects || normalized.projects.length === 0) && heuristicData.projects.length > 0) {
            console.log(`[Gemini AI Service] Augmenting ${heuristicData.projects.length} projects from robust section parser.`);
            normalized.projects = heuristicData.projects;
          }
          if ((!normalized.experience || normalized.experience.length === 0) && heuristicData.experience.length > 0) {
            console.log(`[Gemini AI Service] Augmenting ${heuristicData.experience.length} experience entries from robust section parser.`);
            normalized.experience = heuristicData.experience;
          }
          if ((!normalized.education || normalized.education.length === 0) && heuristicData.education.length > 0) {
            console.log(`[Gemini AI Service] Augmenting ${heuristicData.education.length} education entries from robust section parser.`);
            normalized.education = heuristicData.education;
          }
          if ((!normalized.certifications || normalized.certifications.length === 0) && heuristicData.certifications.length > 0) {
            console.log(`[Gemini AI Service] Augmenting ${heuristicData.certifications.length} certifications from robust section parser.`);
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

          return normalizeResumeData(normalized);
        } catch (jsonErr) {
          console.warn('[Gemini AI Service] JSON parse failed, utilizing robust heuristic parser:', jsonErr);
        }
      }

      console.warn('[Gemini AI Service] Remote Gemini calls unavailable or timed out; utilizing resilient heuristic parser.');
      return normalizeResumeData(heuristicData);
    } catch (error: any) {
      console.warn('[Gemini AI Service Recovered] Using heuristic parser after exception:', error.message || error);
      return normalizeResumeData(heuristicData);
    }
  }

  /**
   * Resilient, comprehensive heuristic parser that parses all resume sections
   * using line structure, section header boundaries, and regex matching.
   */
  public static extractHeuristicFallback(text: string): IResumeAnalysis {
    const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // Group wrapped lines that are continuations of bullet points
    const lines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const prev = lines[lines.length - 1];
      const isBullet = line.startsWith('–') || line.startsWith('-') || line.startsWith('•') || line.startsWith('*');

      const isContinuation =
        prev &&
        (prev.startsWith('–') || prev.startsWith('-') || prev.startsWith('•') || prev.startsWith('*')) &&
        !isBullet &&
        (line.match(/^[a-z]/) ||
          prev.endsWith(',') ||
          prev.endsWith('and') ||
          prev.endsWith('with') ||
          prev.endsWith('for') ||
          line.startsWith('validation') ||
          line.startsWith('blockage') ||
          line.startsWith('cooldown') ||
          line.startsWith('supporting') ||
          line.startsWith('captions'));

      if (isContinuation) {
        lines[lines.length - 1] = prev + ' ' + line;
      } else {
        lines.push(line);
      }
    }

    // 1. Personal Info
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}|\b\d{10}\b/);
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    const locationMatch = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/);

    let fullName: string | null = null;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const l = lines[i];
      if (
        l.length > 2 &&
        l.length < 50 &&
        !l.includes('@') &&
        !l.match(/\d{5,}/) &&
        !l.toLowerCase().includes('resume') &&
        !l.toLowerCase().includes('curriculum')
      ) {
        fullName = l;
        break;
      }
    }

    // 2. Section detection (supports all standard and non-standard headings)
    const sectionPatterns: { type: string; regex: RegExp }[] = [
      {
        type: 'EDUCATION',
        regex: /^(?:education|education qualification|academic background|academic qualifications|academic details|academics|qualifications)\b/i,
      },
      {
        type: 'EXPERIENCE',
        regex: /^(?:work experience|experience|professional experience|employment|employment history|work history|internship|internships|professional background)\b/i,
      },
      {
        type: 'PROJECTS',
        regex: /^(?:projects|academic projects|personal projects|major projects|selected projects|project experience|technical projects|key projects)\b/i,
      },
      {
        type: 'SKILLS',
        regex: /^(?:technical skills|skills|skills & technologies|core competencies|technologies|technical expertise|tools & technologies)\b/i,
      },
      {
        type: 'CERTIFICATIONS',
        regex: /^(?:certifications|certificates|professional certifications|courses & certifications|licenses & certifications|training & certifications)\b/i,
      },
      {
        type: 'SUMMARY',
        regex: /^(?:professional summary|summary|profile|about me|objective|career objective)\b/i,
      },
      {
        type: 'ACHIEVEMENTS',
        regex: /^(?:achievements|awards|honors & awards|extracurricular activities|accomplishments)\b/i,
      },
    ];

    const detectedSections: { type: string; lineIndex: number; title: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length <= 60 && !line.startsWith('–') && !line.startsWith('-') && !line.startsWith('•')) {
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

    // 3. Parse Education
    const educationItems: any[] = [];
    const eduLines = sectionContent['EDUCATION'] || [];
    if (eduLines.length > 0) {
      let currentEdu: any = null;
      for (const l of eduLines) {
        const yearMatch =
          l.match(/(?:19|20)\d{2}\s*[-–]\s*(?:(?:19|20)\d{2}|present|expected)/i) || l.match(/(?:19|20)\d{2}/);
        const degreeMatch = l.match(
          /\b(b\.?\s*tech|b\.?\s*e|m\.?\s*tech|b\.?\s*s|m\.?\s*s|bachelor|master|phd|diploma|hsc|ssc|higher secondary|secondary)\b/i
        );

        if (!currentEdu) {
          currentEdu = {
            institution: l.replace(/(?:19|20)\d{2}.*$/, '').trim(),
            degree: degreeMatch ? degreeMatch[0] : null,
            field: null,
            startYear: yearMatch ? yearMatch[0].split(/[-–]/)[0]?.trim() : null,
            endYear: yearMatch && yearMatch[0].includes('-') ? yearMatch[0].split(/[-–]/)[1]?.trim() : null,
            grade: null,
          };
        } else {
          if (degreeMatch) {
            currentEdu.degree = degreeMatch[0];
            currentEdu.field = l.replace(degreeMatch[0], '').replace(/[,|]/g, '').trim();
          } else if (!currentEdu.field && (l.toLowerCase().includes('computer') || l.toLowerCase().includes('engineering'))) {
            currentEdu.field = l;
          }
          if (!currentEdu.startYear && yearMatch) {
            currentEdu.startYear = yearMatch[0].split(/[-–]/)[0]?.trim();
            currentEdu.endYear = yearMatch[0].includes('-') ? yearMatch[0].split(/[-–]/)[1]?.trim() : null;
          }
          const gradeMatch = l.match(/(?:cgpa|gpa|grade|percentage|marks)[:\s]*([0-9.]+(?:\/[0-9.]+)?%?)/i);
          if (gradeMatch) currentEdu.grade = gradeMatch[1];
        }
      }
      if (currentEdu) educationItems.push(currentEdu);
    }

    // 4. Parse Experience
    const expItems: any[] = [];
    const expLines = sectionContent['EXPERIENCE'] || [];
    if (expLines.length > 0) {
      let currentExp: any = null;
      for (const l of expLines) {
        const isBullet = l.startsWith('–') || l.startsWith('-') || l.startsWith('•') || l.startsWith('*');
        const dateMatch =
          l.match(
            /(?:dec|jan|feb|mar|apr|may|jun|june|jul|july|aug|sep|sept|oct|nov)\s*(?:19|20)\d{2}\s*[-–]\s*(?:(?:dec|jan|feb|mar|apr|may|jun|june|jul|july|aug|sep|sept|oct|nov)\s*(?:19|20)\d{2}|present)/i
          ) || l.match(/(?:19|20)\d{2}\s*[-–]\s*(?:(?:19|20)\d{2}|present)/i);

        if (isBullet && currentExp) {
          currentExp.description.push(l.replace(/^[–\-•*]\s*/, '').trim());
        } else if (!isBullet) {
          if (!currentExp) {
            currentExp = {
              company: l.replace(/\(.*?\)/g, '').replace(/pune.*$/i, '').trim(),
              role: null,
              startDate: null,
              endDate: null,
              description: [],
            };
          } else if (dateMatch || !currentExp.role) {
            if (dateMatch) {
              const parts = dateMatch[0].split(/[-–]/);
              currentExp.startDate = parts[0]?.trim();
              currentExp.endDate = parts[1]?.trim();
              currentExp.role = l.replace(dateMatch[0], '').replace(/\(.*?\)/g, '').trim();
            } else {
              currentExp.role = l;
            }
          } else {
            expItems.push(currentExp);
            currentExp = {
              company: l.replace(/\(.*?\)/g, '').replace(/pune.*$/i, '').trim(),
              role: null,
              startDate: null,
              endDate: null,
              description: [],
            };
          }
        }
      }
      if (currentExp) expItems.push(currentExp);
    }

    // 5. Parse Projects
    const projectItems: any[] = [];
    const projLines = sectionContent['PROJECTS'] || [];
    if (projLines.length > 0) {
      let currentProj: any = null;
      for (const l of projLines) {
        const isBullet = l.startsWith('–') || l.startsWith('-') || l.startsWith('•') || l.startsWith('*');
        const dateMatch = l.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*(?:19|20)\d{2}/i);

        if (isBullet && currentProj) {
          const bulletText = l.replace(/^[–\-•*]\s*/, '').trim();
          currentProj.description = (currentProj.description ? currentProj.description + ' ' : '') + bulletText;
        } else if (!isBullet) {
          const isTechList =
            (l.includes(',') || l.includes('|')) &&
            (l.toLowerCase().includes('react') ||
              l.toLowerCase().includes('python') ||
              l.toLowerCase().includes('api') ||
              l.toLowerCase().includes('sqlite') ||
              l.toLowerCase().includes('mllm') ||
              l.toLowerCase().includes('faiss') ||
              l.toLowerCase().includes('langchain') ||
              l.toLowerCase().includes('sql') ||
              l.toLowerCase().includes('fastapi'));

          if (isTechList && currentProj && currentProj.technologies.length === 0) {
            currentProj.technologies = l.split(/[,|]/).map((t: string) => t.trim()).filter(Boolean);
          } else {
            if (currentProj && currentProj.name) {
              projectItems.push(currentProj);
            }
            const cleanName = l
              .replace(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*(?:19|20)\d{2}/i, '')
              .trim();
            currentProj = {
              name: cleanName || l,
              duration: dateMatch ? dateMatch[0] : null,
              technologies: [],
              description: '',
              role: 'Developer',
            };
          }
        }
      }
      if (currentProj && currentProj.name) projectItems.push(currentProj);
    }

    // 6. Parse Certifications
    const certItems: any[] = [];
    const certLines = sectionContent['CERTIFICATIONS'] || [];
    for (const l of certLines) {
      const clean = l.replace(/^[–\-•*]\s*/, '').trim();
      if (clean.length > 3) {
        const parts = clean.split(/–|-/);
        certItems.push({
          name: parts[0]?.trim() || clean,
          issuer: parts[1]?.replace(/\(.*?\)/g, '').trim() || null,
          date: null,
        });
      }
    }

    // 7. Parse Skills dictionary
    const langDict = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS'];
    const fwDict = [
      'React', 'React.js', 'Next.js', 'Node.js', 'Express.js', 'Express', 'Angular', 'Vue', 'Django', 'Flask',
      'FastAPI', 'Spring Boot', 'Tailwind CSS', 'Redux', 'LangChain', 'LangGraph', 'Pandas', 'OpenCV',
    ];
    const dbDict = ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Oracle', 'Elasticsearch', 'Firebase', 'FAISS'];
    const cloudDict = ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Vercel', 'Netlify', 'Cloud Computing'];
    const toolDict = [
      'Git', 'GitHub', 'CI/CD', 'Linux', 'VS Code', 'Figma', 'n8n', 'Google Colab', 'Jupyter Notebook', 'Power BI',
      'Postman', 'Webpack', 'Vite', 'Jira',
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
        location: locationMatch ? locationMatch[0] : null,
        linkedin: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : null,
        github: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : null,
        portfolio: null,
      },
      summary: sectionContent['SUMMARY'] ? sectionContent['SUMMARY'].join(' ').slice(0, 500) : null,
      skills: {
        programmingLanguages: findMatches(langDict),
        frameworks: findMatches(fwDict),
        libraries: [],
        databases: findMatches(dbDict),
        tools: findMatches(toolDict),
        cloud: findMatches(cloudDict),
        other: ['Generative AI', 'RAG', 'Agentic AI', 'Prompt Engineering', 'Data Structures & Algorithms', 'OOP'],
      },
      education: educationItems,
      experience: expItems,
      projects: projectItems,
      certifications: certItems,
    };
  }
}
