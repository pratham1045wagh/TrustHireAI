import { DocumentService } from './document.service';

export class PDFService {
  /**
   * Extract readable plain text from a local PDF or DOCX file path
   */
  public static async extractText(filePath: string): Promise<string> {
    return DocumentService.extractText(filePath);
  }
}
