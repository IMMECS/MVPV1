import { DocumentChunk } from '../api/document/document.model';

/**
 * Represents a parsed document with text and structure
 */
export interface ParsedDocument {
  documentId: string;
  text: string;
  chunks: DocumentChunk[];
  metadata: {
    fileName: string;
    fileType: 'pdf' | 'docx';
    fileSize: number;
    uploadedAt: Date;
    pages?: number;
  };
  encryptionInfo?: {
    algorithm: string;
    iv: string;
  };
}

/**
 * Interface for document extractors
 * Each extractor is responsible for extracting text and structure from a specific file type
 */
export interface IDocumentExtractor {
  /**
   * Checks if this extractor can handle the given file type
   * @param fileType The file extension or mime type
   */
  canHandle(fileType: string): boolean;
  
  /**
   * Extracts text and structure from a document file
   * @param filePath Path to the document file
   * @returns A parsed document with text and structure
   */
  extractText(filePath: string): Promise<ParsedDocument>;
} 