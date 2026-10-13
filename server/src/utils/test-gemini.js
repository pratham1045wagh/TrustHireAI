const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

async function testEmbedding() {
  try {
    const res = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: 'Software engineer with React and Node.js'
    });
    console.log('Result keys:', Object.keys(res));
    console.log('Embedding keys:', res.embedding ? Object.keys(res.embedding) : null);
    if (res.embedding?.values) {
      console.log('Values length:', res.embedding.values.length);
    }
  } catch (e) {
    console.log('Failed:', e.message);
  }
}
testEmbedding();
