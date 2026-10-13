const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

async function testRealFile() {
  const filePath = path.join(__dirname, '../../uploads/resume-1790072384983-752515149.pdf');
  console.log('Testing file:', filePath, 'Exists:', fs.existsSync(filePath));
  try {
    const buffer = fs.readFileSync(filePath);
    console.log('Buffer read, size:', buffer.length);
    const data = await pdfParse(buffer);
    console.log('SUCCESS! Text length:', data.text.length);
    console.log('First 200 chars:', JSON.stringify(data.text.slice(0, 200)));
  } catch (e) {
    console.error('PDF Parse Error:', e);
  }
}
testRealFile();
