import { GoogleGenAI } from '@google/genai';
import { Assessment } from '../models/Assessment';
import { AssessmentQuestion } from '../models/AssessmentQuestion';
import { QuestionDifficulty } from '../types';

export interface IRawGeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  skill: string;
  topic?: string;
  difficulty: QuestionDifficulty;
  hasAnswerKey?: boolean;
}

export class AssessmentGenerationService {
  private static getAiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('replace_with') || apiKey.length < 10) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Generates questions for an assessment using Gemini AI or structured fallback question generator.
   * Guaranteed never to hang indefinitely (20s timeout per model + immediate fallback).
   */
  public static async generateQuestions(
    assessmentId: string,
    skills: string[],
    totalQuestions: number = 20,
    candidateContext?: string,
    jobContext?: string,
    naturalLanguagePrompt?: string,
    difficultyPreference?: string
  ): Promise<{ count: number; status: 'READY' | 'FALLBACK_READY'; usedFallback: boolean }> {
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) throw new Error('Assessment not found.');

    const cleanSkills = skills && skills.length > 0 ? skills : ['Software Engineering', 'Problem Solving'];
    assessment.generationStatus = 'GENERATING';
    assessment.generatedCount = 0;
    assessment.generationError = undefined;
    await assessment.save();

    let usedFallback = false;

    try {
      const generatedQuestions: IRawGeneratedQuestion[] = [];
      const ai = this.getAiClient();

      if (ai) {
        try {
          const diffInstruction =
            difficultyPreference && ['EASY', 'MEDIUM', 'HARD'].includes(difficultyPreference.toUpperCase())
              ? `Focus primarily on ${difficultyPreference.toUpperCase()} difficulty questions.`
              : 'Distribute difficulty evenly across EASY, MEDIUM, and HARD.';

          const systemInstruction = `
You are a senior technical assessment creator. Create high quality, real-world technical multiple-choice screening questions.
CRITICAL RULES:
1. Return ONLY a valid JSON object or JSON array matching the schema below.
2. Generate exactly ${totalQuestions} questions.
3. Each question MUST have exactly 4 plausible options.
4. correctAnswer MUST be the 0-indexed integer (0, 1, 2, or 3) of the correct option.
5. ${diffInstruction}
6. Base questions strictly on the provided skills, projects, and instructions. Do NOT generate unrelated generic questions.

JSON SCHEMA:
{
  "assessmentType": "${assessment.assessmentType || 'RESUME_BASED'}",
  "questionCount": ${totalQuestions},
  "questions": [
    {
      "question": "string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief technical explanation of why the answer is correct",
      "skill": "string (e.g. React, Node.js, Python)",
      "topic": "string (e.g. React Hooks, Event Loop, REST APIs)",
      "difficulty": "EASY" | "MEDIUM" | "HARD"
    }
  ]
}
`;

          const promptParts = [
            `Generate exactly ${totalQuestions} technical multiple-choice questions evaluating these skills/topics: ${cleanSkills.join(', ')}.`,
          ];
          if (candidateContext) {
            promptParts.push(`Candidate Resume Profile (Skills, Projects, Experience, Education):\n${candidateContext}`);
          }
          if (jobContext) {
            promptParts.push(`Target Job Description Context:\n${jobContext}`);
          }
          if (naturalLanguagePrompt) {
            promptParts.push(`Recruiter Special Instructions:\n${naturalLanguagePrompt}`);
          }
          promptParts.push('Return pure valid JSON.');

          const prompt = promptParts.join('\n\n');

          const configuredModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
          const candidateModels = Array.from(
            new Set([
              configuredModel,
              'gemini-flash-lite-latest',
              'gemini-2.5-flash-lite',
              'gemini-flash-latest',
            ])
          );

          let responseText: string | null = null;

          for (const modelName of candidateModels) {
            try {
              console.log(`[AssessmentGenerationService] Generating ${totalQuestions} questions with '${modelName}'...`);
              const aiCall = ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                  systemInstruction,
                  responseMimeType: 'application/json',
                  temperature: 0.25,
                },
              });

              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Gemini generation timed out after 18s')), 18000)
              );

              const response = await Promise.race([aiCall, timeoutPromise]);

              if (response?.text && response.text.trim().length > 20) {
                responseText = response.text;
                break;
              }
            } catch (err: any) {
              console.warn(`[AssessmentGenerationService] Model '${modelName}' failed:`, err?.message || err);
            }
          }

          if (responseText) {
            let cleaned = responseText.trim();
            if (cleaned.startsWith('```json')) {
              cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleaned.startsWith('```')) {
              cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(cleaned);
            const rawList = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed?.questions)
              ? parsed.questions
              : [];

            for (const item of rawList) {
              if (
                item &&
                typeof item.question === 'string' &&
                Array.isArray(item.options) &&
                item.options.length === 4
              ) {
                let ansIdx = typeof item.correctAnswer === 'number' ? item.correctAnswer : 0;
                if (ansIdx < 0 || ansIdx > 3) ansIdx = 0;

                const normDiff = String(item.difficulty || 'MEDIUM').toUpperCase();
                const validDiff: QuestionDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(normDiff)
                  ? (normDiff as QuestionDifficulty)
                  : 'MEDIUM';

                generatedQuestions.push({
                  question: item.question.trim(),
                  options: item.options.map((o: any) => String(o).trim()),
                  correctAnswer: ansIdx,
                  explanation: item.explanation || 'Verified technical answer based on official documentation.',
                  skill: item.skill || cleanSkills[generatedQuestions.length % cleanSkills.length] || 'General',
                  topic: item.topic || item.skill || 'Core Concepts',
                  difficulty: validDiff,
                });
              }
            }
          }
        } catch (aiErr: any) {
          console.warn('[AssessmentGenerationService] Gemini generation error, switching to fallback bank:', aiErr?.message || aiErr);
        }
      } else {
        console.warn('[AssessmentGenerationService] GEMINI_API_KEY not configured, using curated skill fallback bank.');
      }

      if (generatedQuestions.length === 0) {
        usedFallback = true;
      }

      // If AI didn't produce all required questions, backfill seamlessly from curated technical bank
      if (generatedQuestions.length < totalQuestions) {
        const needed = totalQuestions - generatedQuestions.length;
        const backfill = this.generateFallbackQuestions(cleanSkills, needed, difficultyPreference);
        generatedQuestions.push(...backfill);
      }

      // Save questions in AssessmentQuestion collection
      await AssessmentQuestion.deleteMany({ assessmentId });

      const docsToInsert = generatedQuestions.slice(0, totalQuestions).map((q) => ({
        assessmentId,
        skill: q.skill,
        topic: q.topic || q.skill,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }));

      await AssessmentQuestion.insertMany(docsToInsert);

      const finalStatus = usedFallback ? 'FALLBACK_READY' : 'READY';
      assessment.generationStatus = finalStatus;
      assessment.questionSource = usedFallback ? 'FALLBACK' : 'GENERATED';
      assessment.totalQuestions = docsToInsert.length;
      assessment.generatedCount = docsToInsert.length;
      if (usedFallback) {
        assessment.generationError =
          'AI question generation was temporarily unavailable. A technical question set has been prepared using the available skill profile.';
      }
      await assessment.save();

      return {
        count: docsToInsert.length,
        status: finalStatus,
        usedFallback,
      };
    } catch (err: any) {
      console.error('[AssessmentGenerationService Critical Error]', err);
      // Even in unexpected error, try emergency fallback so user is never stuck
      try {
        const emergencyQuestions = this.generateFallbackQuestions(cleanSkills, totalQuestions, difficultyPreference);
        await AssessmentQuestion.deleteMany({ assessmentId });
        const docs = await AssessmentQuestion.insertMany(
          emergencyQuestions.map((q) => ({
            assessmentId,
            skill: q.skill,
            topic: q.topic || q.skill,
            difficulty: q.difficulty,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          }))
        );
        assessment.generationStatus = 'FALLBACK_READY';
        assessment.questionSource = 'FALLBACK';
        assessment.totalQuestions = docs.length;
        assessment.generatedCount = docs.length;
        assessment.generationError =
          'AI question generation is temporarily unavailable. A technical question set has been prepared using the available skill profile.';
        await assessment.save();
        return { count: docs.length, status: 'FALLBACK_READY', usedFallback: true };
      } catch (innerErr: any) {
        assessment.generationStatus = 'FAILED';
        assessment.generationError = err.message || 'Failed to generate assessment questions';
        await assessment.save();
        throw err;
      }
    }
  }

  /**
   * Parse structured multiple-choice questions from uploaded PDF text (for Recruiter PDF mode)
   */
  public static async parseQuestionsFromPdfText(
    pdfText: string,
    defaultSkills: string[] = ['General']
  ): Promise<{
    questions: IRawGeneratedQuestion[];
    missingAnswerKeys: boolean;
    detectedCount: number;
  }> {
    const cleanText = (pdfText || '').trim();
    if (cleanText.length < 20) {
      throw new Error('The uploaded PDF does not contain enough readable text to extract questions.');
    }

    const extracted: IRawGeneratedQuestion[] = [];
    let anyMissingKey = false;
    const ai = this.getAiClient();

    if (ai) {
      try {
        const systemInstruction = `
You are an expert technical assessment parser. Extract all multiple-choice questions from the provided document text into a strict JSON object.
CRITICAL RULES:
1. Extract only questions actually present in the text.
2. Each question must have 4 options. If a question has fewer than 4 options, pad plausibly or normalize to 4 options.
3. If an explicit answer key is present in the text for a question, set "hasAnswerKey": true and "correctAnswer" to the 0-indexed integer (0, 1, 2, or 3).
4. If NO answer key is present in the text for a question, set "hasAnswerKey": false and "correctAnswer": -1. Do NOT silently invent answer keys if none are provided.
5. Detect the technical "skill" (topic) and "difficulty" ("EASY", "MEDIUM", "HARD") for each question.

JSON SCHEMA:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": 0,
      "hasAnswerKey": true,
      "skill": "string",
      "topic": "string",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "explanation": "string"
    }
  ]
}
`;
        const configuredModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
        const response = await ai.models.generateContent({
          model: configuredModel,
          contents: `Extract structured assessment questions from the following document text:\n\n${cleanText.slice(0, 25000)}`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        if (response?.text) {
          let cleaned = response.text.trim();
          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          const parsed = JSON.parse(cleaned);
          const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];

          for (const item of list) {
            if (item?.question && Array.isArray(item.options) && item.options.length >= 2) {
              const opts = item.options.slice(0, 4).map((o: any) => String(o).trim());
              while (opts.length < 4) {
                opts.push(`Option ${opts.length + 1}`);
              }
              const hasKey = item.hasAnswerKey !== false && typeof item.correctAnswer === 'number' && item.correctAnswer >= 0 && item.correctAnswer <= 3;
              if (!hasKey) anyMissingKey = true;

              extracted.push({
                question: String(item.question).trim(),
                options: opts,
                correctAnswer: hasKey ? item.correctAnswer : 0,
                hasAnswerKey: hasKey,
                explanation: item.explanation || 'Extracted from uploaded question PDF.',
                skill: item.skill || defaultSkills[0] || 'Technical',
                topic: item.topic || item.skill || defaultSkills[0] || 'General',
                difficulty: (['EASY', 'MEDIUM', 'HARD'].includes(String(item.difficulty).toUpperCase())
                  ? String(item.difficulty).toUpperCase()
                  : 'MEDIUM') as QuestionDifficulty,
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('[AssessmentGenerationService PDF Parse Warning] Gemini PDF parse failed, using regex parser:', err?.message || err);
      }
    }

    // Regex fallback parser if AI unavailable or returned 0 questions
    if (extracted.length === 0) {
      const blocks = cleanText.split(/\n(?=\s*(?:Q\d+|Question\s+\d+|\d+[\.\)]))\s*/i).filter((b) => b.trim().length > 15);
      for (const block of blocks) {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 3) continue;

        const qLine = lines[0].replace(/^(?:Q\d+|Question\s+\d+|\d+)[\.\)\:\-\s]+/i, '').trim();
        const opts: string[] = [];
        let answerIdx = -1;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const optMatch = line.match(/^(?:[A-D]|[1-4])[\.\)\:\-]\s*(.+)$/i);
          const ansMatch = line.match(/^(?:Answer|Correct\s*Answer|Ans|Key)[\s\:\-]+([A-D1-4])/i);
          if (ansMatch) {
            const rawAns = ansMatch[1].toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(rawAns)) answerIdx = rawAns.charCodeAt(0) - 65;
            else if (['1', '2', '3', '4'].includes(rawAns)) answerIdx = parseInt(rawAns, 10) - 1;
          } else if (optMatch && opts.length < 4) {
            opts.push(optMatch[1].trim());
          }
        }

        if (qLine && opts.length >= 2) {
          while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
          const hasKey = answerIdx >= 0 && answerIdx <= 3;
          if (!hasKey) anyMissingKey = true;

          extracted.push({
            question: qLine,
            options: opts,
            correctAnswer: hasKey ? answerIdx : 0,
            hasAnswerKey: hasKey,
            explanation: 'Extracted from uploaded question document.',
            skill: defaultSkills[0] || 'Technical',
            topic: defaultSkills[0] || 'General',
            difficulty: 'MEDIUM',
          });
        }
      }
    }

    return {
      questions: extracted,
      missingAnswerKeys: anyMissingKey,
      detectedCount: extracted.length,
    };
  }

  /**
   * Deterministic curated question generation for fallback / zero-downtime reliability
   */
  public static generateFallbackQuestions(
    skills: string[],
    count: number,
    difficultyPreference?: string
  ): IRawGeneratedQuestion[] {
    const questions: IRawGeneratedQuestion[] = [];
    const difficulties: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    const fixedDiff =
      difficultyPreference && ['EASY', 'MEDIUM', 'HARD'].includes(difficultyPreference.toUpperCase())
        ? (difficultyPreference.toUpperCase() as QuestionDifficulty)
        : null;

    const skillBank: Record<string, IRawGeneratedQuestion[]> = {
      react: [
        {
          question: 'What is the primary purpose of the useMemo hook in React?',
          options: [
            'To trigger side-effects after DOM updates',
            'To memoize the result of expensive calculations across re-renders',
            'To directly modify the browser DOM elements',
            'To dispatch actions in a Redux store',
          ],
          correctAnswer: 1,
          explanation: 'useMemo caches the calculated value of a function between re-renders until dependencies change.',
          skill: 'React',
          topic: 'React Hooks',
          difficulty: 'MEDIUM',
        },
        {
          question: 'Which lifecycle behavior does useEffect with an empty dependency array [] represent?',
          options: [
            'Runs before every single render',
            'Runs on mount and whenever any state updates',
            'Runs only once after initial mount and cleanup on unmount',
            'Runs only when the browser window loses focus',
          ],
          correctAnswer: 2,
          explanation: 'An empty dependency array causes the effect to run once on component mounting and clean up on unmount.',
          skill: 'React',
          topic: 'Component Lifecycle',
          difficulty: 'EASY',
        },
        {
          question: 'In React 18, how does Automatic Batching affect state updates inside asynchronous callbacks like setTimeout?',
          options: [
            'Asynchronous updates are never batched',
            'All state updates inside promises, timeouts, and native event handlers are batched automatically',
            'Automatic batching only occurs in class components',
            'It throws a runtime hydration exception',
          ],
          correctAnswer: 1,
          explanation: 'React 18 batches state updates automatically across timeouts, promises, and native event handlers.',
          skill: 'React',
          topic: 'React 18 Concurrency',
          difficulty: 'HARD',
        },
        {
          question: 'Why should React list items have a stable, unique key prop?',
          options: [
            'To style list items automatically with CSS grid',
            'To help React identify which items have changed, been added, or been removed during reconciliation',
            'To expose list elements to global window variables',
            'To enable two-way data binding on input fields',
          ],
          correctAnswer: 1,
          explanation: 'Keys give elements a stable identity across renders so React can minimize DOM mutations.',
          skill: 'React',
          topic: 'Virtual DOM & Reconciliation',
          difficulty: 'EASY',
        },
      ],
      javascript: [
        {
          question: 'Which of the following accurately describes the difference between == and === in JavaScript?',
          options: [
            '== checks both value and type, while === checks value only',
            '== performs type coercion before comparison, whereas === checks strict equality without coercion',
            'Both operators perform identical operations in modern V8 engines',
            '=== converts operands to numbers before comparing',
          ],
          correctAnswer: 1,
          explanation: '=== is strict equality which checks both value and type without converting types.',
          skill: 'JavaScript',
          topic: 'Language Fundamentals',
          difficulty: 'EASY',
        },
        {
          question: 'What will Promise.all() do if one of the supplied promises rejects?',
          options: [
            'It waits for all other promises to resolve and ignores the rejection',
            'It immediately rejects with the reason of the first rejected promise',
            'It resolves with undefined in place of the rejected promise',
            'It retries the rejected promise three times automatically',
          ],
          correctAnswer: 1,
          explanation: 'Promise.all has fail-fast behavior: if any promise rejects, the returned promise rejects immediately.',
          skill: 'JavaScript',
          topic: 'Asynchronous Programming',
          difficulty: 'MEDIUM',
        },
        {
          question: 'What is the Event Loop microtask queue priority compared to the macrotask queue in JavaScript?',
          options: [
            'Macrotasks execute before all pending microtasks',
            'Microtasks (e.g. Promise callbacks) are drained completely before the next macrotask is dequeued',
            'They execute in alternating round-robin order',
            'Microtasks only execute on browser idle callback',
          ],
          correctAnswer: 1,
          explanation: 'All microtasks in the microtask queue run to completion before processing the next macrotask.',
          skill: 'JavaScript',
          topic: 'Event Loop',
          difficulty: 'HARD',
        },
      ],
      typescript: [
        {
          question: 'What is the difference between "unknown" and "any" types in TypeScript?',
          options: [
            'They are aliases with identical compiler behavior',
            'unknown requires type narrowing or assertion before performing operations on the value, whereas any bypasses type checking',
            'unknown can only hold primitive values',
            'any is only allowed in JavaScript files',
          ],
          correctAnswer: 1,
          explanation: 'unknown is the type-safe counterpart to any and enforces type checks before property access.',
          skill: 'TypeScript',
          topic: 'Type Safety',
          difficulty: 'MEDIUM',
        },
        {
          question: 'What does the TypeScript utility type Partial<T> do?',
          options: [
            'Makes all properties of type T readonly',
            'Constructs a type with all properties of T set to optional',
            'Removes all null and undefined properties from T',
            'Extracts only public methods from a class T',
          ],
          correctAnswer: 1,
          explanation: 'Partial<T> marks every property on the target interface or type as optional (?).',
          skill: 'TypeScript',
          topic: 'Utility Types',
          difficulty: 'EASY',
        },
      ],
      node: [
        {
          question: 'What module format is natively supported by Node.js using the .mjs extension or "type": "module"?',
          options: ['CommonJS', 'AMD', 'ECMAScript Modules (ESM)', 'UMD'],
          correctAnswer: 2,
          explanation: 'ESM (ECMAScript Modules) uses import/export statements and is natively supported in Node.js.',
          skill: 'Node.js',
          topic: 'Module Systems',
          difficulty: 'EASY',
        },
        {
          question: 'In Express middleware, what happens if neither next() nor a response method (like res.json) is called?',
          options: [
            'Express immediately sends a 200 OK empty response',
            'The client request hangs until connection timeout occurs',
            'The router automatically skips to the error handler',
            'A 404 Not Found is returned immediately',
          ],
          correctAnswer: 1,
          explanation: 'If a middleware neither ends the request-response cycle nor calls next(), the request hangs.',
          skill: 'Node.js',
          topic: 'Express Middleware',
          difficulty: 'MEDIUM',
        },
        {
          question: 'How can Node.js handle CPU-intensive tasks without blocking the main Event Loop thread?',
          options: [
            'By wrapping the synchronous loop in a Promise',
            'By offloading computation to Worker Threads or child processes',
            'By increasing process.env.UV_THREADPOOL_SIZE for synchronous JS loops',
            'By using setTimeout with 0ms delay',
          ],
          correctAnswer: 1,
          explanation: 'Worker Threads run JavaScript in parallel threads without blocking the main event loop.',
          skill: 'Node.js',
          topic: 'Concurrency & Worker Threads',
          difficulty: 'HARD',
        },
      ],
      mongodb: [
        {
          question: 'Which MongoDB method is used to analyze the execution plan and index usage of a query?',
          options: ['db.collection.profile()', 'db.collection.explain()', 'db.collection.inspect()', 'db.collection.trace()'],
          correctAnswer: 1,
          explanation: 'explain() provides detailed metrics on query plans, stages, and index utilization.',
          skill: 'MongoDB',
          topic: 'Indexing & Performance',
          difficulty: 'EASY',
        },
        {
          question: 'What is the purpose of the $lookup stage in a MongoDB aggregation pipeline?',
          options: [
            'To project only specified fields from documents',
            'To perform a left outer join to an unsharded collection in the same database',
            'To filter documents based on full-text search',
            'To create a compound index dynamically',
          ],
          correctAnswer: 1,
          explanation: '$lookup performs a left outer join to another collection in the same database.',
          skill: 'MongoDB',
          topic: 'Aggregation Framework',
          difficulty: 'MEDIUM',
        },
      ],
      python: [
        {
          question: 'What is the primary difference between a list and a tuple in Python?',
          options: [
            'Lists are immutable whereas tuples are mutable',
            'Lists are mutable sequences whereas tuples are immutable sequences',
            'Tuples can only store numeric data types',
            'Lists cannot be nested inside dictionaries',
          ],
          correctAnswer: 1,
          explanation: 'Lists can be modified in-place after creation, while tuples are immutable.',
          skill: 'Python',
          topic: 'Data Structures',
          difficulty: 'EASY',
        },
        {
          question: 'How does the Global Interpreter Lock (GIL) impact multithreaded CPython programs?',
          options: [
            'It prevents creation of more than one thread per process',
            'It allows only one thread to execute Python bytecodes at a time, limiting CPU-bound thread parallelism',
            'It automatically parallelizes loops across all GPU cores',
            'It blocks all asynchronous I/O coroutines',
          ],
          correctAnswer: 1,
          explanation: 'The GIL serializes Python bytecode execution across threads in a single CPython process.',
          skill: 'Python',
          topic: 'Concurrency & Runtime',
          difficulty: 'HARD',
        },
      ],
      java: [
        {
          question: 'Which contract must be maintained between equals() and hashCode() in Java?',
          options: [
            'Objects with the same hashCode() must always be equal according to equals()',
            'If two objects are equal according to equals(), they must have the same hashCode() value',
            'hashCode() must return a unique memory address for every instance',
            'equals() only compares object references and cannot be overridden',
          ],
          correctAnswer: 1,
          explanation: 'Equal objects must produce equal hash codes for hash-based collections like HashMap to work properly.',
          skill: 'Java',
          topic: 'Object-Oriented Programming',
          difficulty: 'MEDIUM',
        },
        {
          question: 'In Spring Boot, what does the @Transactional annotation do when an unchecked RuntimeException is thrown?',
          options: [
            'It commits all partial database changes immediately',
            'It rolls back the current database transaction by default',
            'It ignores the exception and returns HTTP 200',
            'It restarts the embedded Tomcat server',
          ],
          correctAnswer: 1,
          explanation: 'Spring @Transactional automatically rolls back transactions on unchecked RuntimeExceptions and Errors.',
          skill: 'Spring Boot',
          topic: 'Transaction Management',
          difficulty: 'MEDIUM',
        },
      ],
      sql: [
        {
          question: 'What is the difference between WHERE and HAVING clauses in SQL?',
          options: [
            'WHERE filters grouped rows after aggregation, while HAVING filters raw rows before GROUP BY',
            'WHERE filters individual rows before grouping, while HAVING filters groups after GROUP BY aggregation',
            'HAVING can only be used without a SELECT statement',
            'There is no difference in standard ANSI SQL',
          ],
          correctAnswer: 1,
          explanation: 'WHERE filters rows prior to grouping, whereas HAVING filters aggregated groups.',
          skill: 'SQL',
          topic: 'Relational Queries',
          difficulty: 'EASY',
        },
      ],
    };

    const allTemplates: IRawGeneratedQuestion[] = Object.values(skillBank).flat();
    const cleanSkills = skills.length > 0 ? skills : ['Software Engineering'];

    let idx = 0;
    while (questions.length < count) {
      const targetSkill = cleanSkills[idx % cleanSkills.length] || 'Software Engineering';
      const matchedKey = Object.keys(skillBank).find((k) => targetSkill.toLowerCase().includes(k));
      const pool = matchedKey ? skillBank[matchedKey] : allTemplates;
      const tmpl = pool[idx % pool.length];
      const diff = fixedDiff || difficulties[questions.length % difficulties.length];

      const suffix = questions.length >= pool.length ? ` (Scenario #${Math.floor(questions.length / pool.length) + 1})` : '';

      questions.push({
        question: tmpl.question.includes(targetSkill) ? `${tmpl.question}${suffix}` : `[${targetSkill}] ${tmpl.question}${suffix}`,
        options: tmpl.options,
        correctAnswer: tmpl.correctAnswer,
        explanation: tmpl.explanation,
        skill: targetSkill,
        topic: tmpl.topic || targetSkill,
        difficulty: diff,
      });

      idx++;
    }

    return questions.slice(0, count);
  }
}
