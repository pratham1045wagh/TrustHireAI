import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export class DocumentService {
  /**
   * Extract readable text from PDF or DOCX file
   */
  public static async extractText(filePath: string, originalFileName?: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error('Uploaded file was not found on server storage.');
    }

    const fileBuffer = fs.readFileSync(filePath);
    if (fileBuffer.length === 0) {
      throw new Error('The uploaded file is empty (0 bytes).');
    }

    const ext = path.extname(originalFileName || filePath).toLowerCase();

    if (ext === '.docx' || ext === '.doc') {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value ? result.value.trim() : '';
        if (!text || text.length < 15) {
          throw new Error('Could not extract readable text from DOCX document. Please check the file formatting.');
        }
        return this.cleanExtractedText(text);
      } catch (err: any) {
        console.error('[DocumentService] DOCX extraction error:', err);
        throw new Error(err.message || 'Unable to extract readable text from this Word document.');
      }
    } else {
      // Default to PDF parsing
      try {
        const parsed = await pdfParse(fileBuffer);
        const text = parsed.text ? parsed.text.trim() : '';
        if (!text || text.length < 15) {
          throw new Error(
            "We couldn't extract readable text from this PDF. Please upload a text-based PDF (scanned image PDFs without OCR are not supported)."
          );
        }
        return this.cleanExtractedText(text);
      } catch (err: any) {
        console.error('[DocumentService] PDF extraction error:', err);
        throw new Error(err.message || 'Unable to extract readable text from this resume PDF.');
      }
    }
  }

  /**
   * Clean text removing excessive null bytes or control characters
   */
  public static cleanExtractedText(raw: string): string {
    return raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
