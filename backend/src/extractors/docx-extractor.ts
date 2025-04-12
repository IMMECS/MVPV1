import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IDocumentExtractor, ParsedDocument } from './document-extractor.interface';
import { DocumentChunk } from '../api/document/document.model';

@Injectable()
export class DocxExtractor implements IDocumentExtractor {
  /**
   * Check if this extractor can handle the given file type
   */
  canHandle(fileType: string): boolean {
    const type = fileType.toLowerCase();
    return type === 'docx' || 
           type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  
  /**
   * Extract text and structure from a DOCX file
   */
  async extractText(filePath: string): Promise<ParsedDocument> {
    try {
      // Read file as buffer
      const buffer = fs.readFileSync(filePath);
      
      // Get file metadata
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      
      // Extract text from DOCX file
      const result = await mammoth.extractRawText({
        buffer,
        includeDefaultStyleMap: true,
      });
      
      // Get the raw text content
      const text = result.value;
      
      // Process the text into logical chunks
      const chunks = this.processTextIntoChunks(text);
      
      // Create and return parsed document
      return {
        documentId: uuidv4(),
        text,
        chunks,
        metadata: {
          fileName,
          fileType: 'docx',
          fileSize: stats.size,
          uploadedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error(`Failed to extract text from DOCX file: ${error.message}`);
    }
  }
  
  /**
   * Process raw text into logical chunks
   */
  private processTextIntoChunks(text: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    // Split text by empty lines to identify paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Process each paragraph
    paragraphs.forEach(paragraph => {
      const trimmedParagraph = paragraph.trim();
      
      // Skip empty paragraphs
      if (trimmedParagraph.length === 0) {
        return;
      }
      
      // Determine if this is likely a heading based on heuristics
      const isHeading = this.isLikelyHeading(trimmedParagraph);
      const chunkType = isHeading ? 'heading' : 'paragraph';
      
      // Create chunk
      chunks.push({
        id: uuidv4(),
        type: chunkType,
        text: trimmedParagraph,
        level: isHeading ? this.estimateHeadingLevel(trimmedParagraph) : undefined
      });
    });
    
    return chunks;
  }
  
  /**
   * Determine if a text paragraph is likely a heading
   */
  private isLikelyHeading(text: string): boolean {
    // Headings are usually short, lack ending punctuation, and may have section numbers
    return (
      (text.length < 100) && // Not too long
      (!text.endsWith('.') || Boolean(text.match(/\d+\.$/))) && // No ending period (unless it's a number)
      (
        Boolean(text.match(/^[0-9§]+(\.[0-9]+)*\.?\s+/)) || // Starts with section number (e.g., "1. " or "1.2.3 ")
        Boolean(text.match(/^[A-Z][\s\S]{0,2}\./)) || // Starts with single letter followed by period (e.g., "A. ")
        (text.toUpperCase() === text && text.length < 50) || // All caps (short)
        (!text.includes(' ') && text.length < 30) // Single word (short)
      )
    );
  }
  
  /**
   * Estimate heading level based on heuristics
   */
  private estimateHeadingLevel(text: string): number {
    // Check for numbering patterns
    if (text.match(/^[0-9]+\.[0-9]+\.[0-9]+/)) {
      return 3; // Like 1.1.1
    } else if (text.match(/^[0-9]+\.[0-9]+/)) {
      return 2; // Like 1.1
    } else if (text.match(/^[0-9]+\./)) {
      return 1; // Like 1.
    } else if (text.match(/^[IVX]+\./)) {
      return 1; // Roman numerals
    } else if (text.match(/^[A-Z]\./)) {
      return 2; // Like A.
    } else if (text.toUpperCase() === text) {
      return 1; // ALL CAPS headings are usually top-level
    }
    
    // Based on length
    if (text.length < 20) {
      return 1;
    } else if (text.length < 50) {
      return 2;
    }
    
    // Default
    return 3;
  }
} 