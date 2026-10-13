const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

async function testParse() {
  const filePath = path.join(__dirname, '../../uploads/resume-1790072384983-752515149.pdf');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are an expert AI Resume Parsing Engine. Extract structured data in JSON:
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "portfolio": "" },
  "summary": "",
  "skills": { "programmingLanguages": [], "frameworks": [], "libraries": [], "databases": [], "tools": [], "cloud": [], "other": [] },
  "education": [{ "degree": "", "institution": "", "field": "", "startYear": "", "endYear": "", "grade": "" }],
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": [] }],
  "projects": [{ "name": "", "description": "", "technologies": [], "role": "", "duration": "" }],
  "certifications": [{ "name": "", "issuer": "", "date": "" }]
}`;

  const prompt = `Analyze this resume and output purely valid JSON according to schema:\n\n${data.text}`;
  const res = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.1,
    }
  });

  console.log('Returned JSON:');
  const parsed = JSON.parse(res.text);
  console.log('personalInfo:', parsed.personalInfo || parsed.personal_information);
  console.log('skills count:', Object.keys(parsed.skills || {}).map(k => `${k}: ${parsed.skills[k]?.length}`));
  console.log('education count:', parsed.education?.length);
  console.log('projects count:', parsed.projects?.length);
  console.log('experience count:', parsed.experience?.length);
}
testParse();
