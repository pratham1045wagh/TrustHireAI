const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

async function testAnalyze() {
  const filePath = path.join(__dirname, '../../uploads/resume-1790072384983-752515149.pdf');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const resumeText = data.text;

  console.log('Testing analysis on text of length:', resumeText.length);
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are an expert AI Resume Parsing Engine... Output purely in valid JSON.`;
  const prompt = `Analyze the following resume text and extract the structured information in pure JSON according to instructions:\n\n${resumeText}`;

  const models = [
    process.env.GEMINI_MODEL,
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash'
  ];

  for (const m of models) {
    if (!m) continue;
    try {
      console.log('--- Calling Gemini model:', m);
      const res = await ai.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });
      console.log('SUCCESS with', m);
      console.log('Output length:', res.text ? res.text.length : 0);
      console.log('Output sample:', res.text ? res.text.slice(0, 300) : 'null');
      return;
    } catch (e) {
      console.error('FAILED with', m, ':', e.message);
    }
  }
}
testAnalyze();
