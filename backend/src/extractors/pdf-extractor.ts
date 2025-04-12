import { Injectable } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IDocumentExtractor, ParsedDocument } from './document-extractor.interface';
import { DocumentChunk } from '../api/document/document.model';

@Injectable()
export class PdfExtractor implements IDocumentExtractor {
  /**
   * Check if this extractor can handle the given file type
   */
  canHandle(fileType: string): boolean {
    const type = fileType.toLowerCase();
    return type === 'pdf' || type === 'application/pdf';
  }
  
  /**
   * Extract text and structure from a PDF file
   */
  async extractText(filePath: string): Promise<ParsedDocument> {
    try {
      // Read file as buffer
      const dataBuffer = fs.readFileSync(filePath);
      
      // Get file metadata
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      
      // Extract text from PDF file
      const data = await pdfParse(dataBuffer);
      
      // Get the raw text content
      const text = data.text;
      
      // Process the text into logical chunks
      const chunks = this.processTextIntoChunks(text);
      
      // Create and return parsed document
      return {
        documentId: uuidv4(),
        text,
        chunks,
        metadata: {
          fileName,
          fileType: 'pdf',
          fileSize: stats.size,
          uploadedAt: new Date(),
          pages: data.numpages,
        },
      };
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF file: ${error.message}`);
    }
  }
  
  /**
   * Process raw text into logical chunks
   * PDF extraction is more challenging than DOCX due to layout issues
   */
  private processTextIntoChunks(text: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    // Split text by multiple newlines or form feeds (page breaks)
    // PDF extraction often introduces extra whitespace
    const paragraphs = text
      .split(/\n{2,}|\f/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // Process each paragraph
    paragraphs.forEach(paragraph => {
      // Skip empty paragraphs and page numbers
      if (paragraph.length === 0 || /^\d+$/.test(paragraph)) {
        return;
      }
      
      // Remove excessive whitespace that often comes from PDF extraction
      const cleanedParagraph = paragraph
        .replace(/\s+/g, ' ')
        .trim();
      
      // Determine if this is likely a heading based on heuristics
      const isHeading = this.isLikelyHeading(cleanedParagraph);
      let chunkType: 'heading' | 'paragraph' | 'list' | 'other' = isHeading ? 'heading' : 'paragraph';
      
      // Check if this is a list item
      if (this.isLikelyListItem(cleanedParagraph)) {
        chunkType = 'list';
      }
      
      // Create chunk
      chunks.push({
        id: uuidv4(),
        type: chunkType,
        text: cleanedParagraph,
        level: isHeading ? this.estimateHeadingLevel(cleanedParagraph) : undefined
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
      (
        !text.endsWith('.') || 
        !!text.match(/\d+\.$/)
      ) && // No ending period (unless it's a number)
      (
        !!text.match(/^[0-9§]+(\.[0-9]+)*\.?\s+/) || // Starts with section number (e.g., "1. " or "1.2.3 ")
        !!text.match(/^[A-Z][\s\S]{0,2}\./) || // Starts with single letter followed by period (e.g., "A. ")
        (text.toUpperCase() === text && text.length < 50) || // All caps (short)
        (text.split(' ').length <= 7 && text.length < 30) // Few words and short
      )
    );
  }
  
  /**
   * Determine if a paragraph is likely a list item
   */
  private isLikelyListItem(text: string): boolean {
    // Check for common list item patterns
    return (
      !!text.match(/^[•\-–—*]/) || // Bullet points
      !!text.match(/^(\([0-9a-z]+\)|\[?[0-9a-z]+\]?\.)\s+/) || // (a) or a. or 1. etc.
      !!text.match(/^([ivxIVX]+)[\.\)]\s+/) // Roman numerals
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
    
    // Based on length (shorter tends to be higher level)
    if (text.length < 20) {
      return 1;
    } else if (text.length < 50) {
      return 2;
    }
    
    // Default
    return 3;
  }
} 