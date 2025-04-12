import { Injectable, OnModuleInit, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { IDocumentExtractor, ParsedDocument } from './document-extractor.interface';
import { DocxExtractor } from './docx-extractor';
import { PdfExtractor } from './pdf-extractor';
import { existsSync } from 'fs';
import * as path from 'path';
import * as CryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for extracting text from different document formats
 */
@Injectable()
export class ExtractorService implements OnModuleInit {
  private readonly extractors: IDocumentExtractor[];
  private readonly logger = new Logger(ExtractorService.name);
  private readonly encryptionKey: string;
  
  constructor(
    private readonly docxExtractor: DocxExtractor,
    private readonly pdfExtractor: PdfExtractor,
    private readonly configService: ConfigService,
  ) {
    this.extractors = [this.docxExtractor, this.pdfExtractor];
    
    // Get encryption key from config
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!this.encryptionKey) {
      this.logger.warn('No encryption key found. Document content will not be encrypted.');
    }
  }
  
  /**
   * Register extractors on module initialization
   */
  onModuleInit() {
    // Register all document extractors
    this.registerExtractor('docx', this.docxExtractor);
    this.registerExtractor('pdf', this.pdfExtractor);
    
    this.logger.log(`Registered ${this.extractors.size} document extractors`);
  }
  
  /**
   * Register a document extractor for a specific file type
   */
  private registerExtractor(fileType: string, extractor: IDocumentExtractor): void {
    this.extractors.set(fileType.toLowerCase(), extractor);
  }
  
  /**
   * Extract text from a document file
   * @param filePath Path to the document file
   * @param fileType Type of the file (extension or mime type)
   * @returns Parsed document with text and structure
   */
  async extractText(filePath: string, fileType: string, fileName: string, fileSize: number): Promise<ParsedDocument> {
    try {
      // Check if file exists
      if (!existsSync(filePath)) {
        throw new NotFoundException(`File not found at path: ${filePath}`);
      }
      
      // Validate file type
      const extractor = this.getExtractor(fileType);
      if (!extractor) {
        throw new BadRequestException(`Unsupported file type: ${fileType}`);
      }
      
      this.logger.log(`Extracting text from ${fileName} (${fileType})`);
      
      // Extract text
      const parsedDocument = await extractor.extractText(filePath);
      
      // Add metadata
      parsedDocument.documentId = parsedDocument.documentId || uuidv4();
      parsedDocument.metadata = {
        fileName,
        fileType: fileType.includes('pdf') ? 'pdf' : 'docx',
        fileSize,
        uploadedAt: new Date(),
      };
      
      // Encrypt text if encryption key is available
      if (this.encryptionKey) {
        return this.encryptDocumentContent(parsedDocument);
      }
      
      return parsedDocument;
    } catch (error) {
      // Handle specific errors with appropriate status codes
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      // Log and rethrow other errors
      this.logger.error(`Error extracting text from ${fileName}: ${error.message}`, error.stack);
      throw new Error(`Failed to extract text from document: ${error.message}`);
    }
  }
  
  /**
   * Encrypt document content for security
   * @param document Parsed document
   * @returns Document with encrypted content
   */
  private encryptDocumentContent(document: ParsedDocument): ParsedDocument {
    try {
      // Generate a random IV
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Encrypt the full text
      const encryptedText = CryptoJS.AES.encrypt(
        document.text,
        this.encryptionKey,
        { iv }
      ).toString();
      
      // Encrypt the text of each chunk separately
      const encryptedChunks = document.chunks.map(chunk => ({
        ...chunk,
        text: CryptoJS.AES.encrypt(
          chunk.text,
          this.encryptionKey,
          { iv }
        ).toString()
      }));
      
      // Return document with encrypted content
      return {
        ...document,
        text: encryptedText,
        chunks: encryptedChunks,
        encryptionInfo: {
          algorithm: 'AES-256',
          iv: iv.toString()
        }
      };
    } catch (error) {
      this.logger.error(`Error encrypting document content: ${error.message}`, error.stack);
      // Return unencrypted document if encryption fails
      return document;
    }
  }
  
  /**
   * Decrypt document content
   * @param document Encrypted document
   * @returns Decrypted document
   */
  decryptDocumentContent(document: ParsedDocument): ParsedDocument {
    if (!document.encryptionInfo || !this.encryptionKey) {
      return document;
    }
    
    try {
      const iv = CryptoJS.enc.Hex.parse(document.encryptionInfo.iv);
      
      // Decrypt the full text
      const decryptedText = CryptoJS.AES.decrypt(
        document.text,
        this.encryptionKey,
        { iv }
      ).toString(CryptoJS.enc.Utf8);
      
      // Decrypt the text of each chunk
      const decryptedChunks = document.chunks.map(chunk => ({
        ...chunk,
        text: CryptoJS.AES.decrypt(
          chunk.text,
          this.encryptionKey,
          { iv }
        ).toString(CryptoJS.enc.Utf8)
      }));
      
      // Return document with decrypted content
      return {
        ...document,
        text: decryptedText,
        chunks: decryptedChunks
      };
    } catch (error) {
      this.logger.error(`Error decrypting document content: ${error.message}`, error.stack);
      return document;
    }
  }
  
  /**
   * Get the appropriate extractor for a file type
   * @param fileType File extension or mime type
   * @returns Document extractor or null if not supported
   */
  private getExtractor(fileType: string): IDocumentExtractor | null {
    const normalizedType = fileType.toLowerCase();
    
    for (const extractor of this.extractors) {
      if (extractor.canHandle(normalizedType)) {
        return extractor;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a file type is supported
   */
  isSupportedFileType(fileType: string): boolean {
    return !!this.getExtractor(fileType);
  }
  
  /**
   * Get all supported file types
   */
  getSupportedFileTypes(): string[] {
    return Array.from(this.extractors.keys());
  }
} 