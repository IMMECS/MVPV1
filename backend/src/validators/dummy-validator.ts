import { Injectable } from '@nestjs/common';
import { IValidator } from './validator.interface';
import { ParsedDocument } from '../extractors/document-extractor.interface';
import { RuleResult } from '../api/document/document.model';

/**
 * Dummy validator to test if a document has any text content
 */
@Injectable()
export class DummyValidator implements IValidator {
  id = 'dummy-1';
  description = 'Checks if document contains any text';
  
  validate(document: ParsedDocument): RuleResult {
    const hasText = document.text.length > 0;
    
    return {
      ruleId: this.id,
      description: this.description,
      passed: hasText,
      details: hasText ? 
        ['Document contains text'] : 
        ['Document appears to be empty']
    };
  }
}

/**
 * Dummy validator to test if a document has proper structure
 */
@Injectable()
export class StructureValidator implements IValidator {
  id = 'dummy-2';
  description = 'Checks if document has proper heading structure';
  
  validate(document: ParsedDocument): RuleResult {
    // Check if document has at least one heading
    const hasHeadings = document.chunks.some(chunk => chunk.type === 'heading');
    
    // Check if document has content after headings
    let structureValid = true;
    const details: string[] = [];
    
    if (!hasHeadings) {
      structureValid = false;
      details.push('Document lacks headings for proper structure');
    }
    
    // Check for empty sections (headings with no content)
    const headingIndices = document.chunks
      .map((chunk, index) => chunk.type === 'heading' ? index : -1)
      .filter(index => index !== -1);
    
    for (let i = 0; i < headingIndices.length; i++) {
      const headingIndex = headingIndices[i];
      const nextHeadingIndex = i < headingIndices.length - 1 ? headingIndices[i + 1] : document.chunks.length;
      
      // If there's nothing between this heading and the next heading/end
      if (nextHeadingIndex - headingIndex <= 1) {
        structureValid = false;
        const headingText = document.chunks[headingIndex].text;
        details.push(`Section "${headingText}" appears to be empty`);
      }
    }
    
    if (structureValid && details.length === 0) {
      details.push('Document has proper heading structure');
    }
    
    return {
      ruleId: this.id,
      description: this.description,
      passed: structureValid,
      details
    };
  }
}

/**
 * Dummy validator to test for specific keywords
 */
@Injectable()
export class KeywordValidator implements IValidator {
  id = 'dummy-3';
  description = 'Checks if document contains ABL-related keywords';
  
  // Sample keywords related to Swedish ABL
  private readonly keywords = [
    'aktiebolag', 'bolagsordning', 'styrelse', 'aktier', 'bolagsstämma',
    'aktiekapital', 'ABL', 'aktiebolagslagen', 'årsredovisning', 'utdelning'
  ];
  
  validate(document: ParsedDocument): RuleResult {
    const text = document.text.toLowerCase();
    const foundKeywords: string[] = [];
    const missingKeywords: string[] = [];
    
    // Check for each keyword
    this.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });
    
    // Rule passes if at least 3 keywords are found
    const passed = foundKeywords.length >= 3;
    
    const details: string[] = [];
    if (foundKeywords.length > 0) {
      details.push(`Found keywords: ${foundKeywords.join(', ')}`);
    }
    if (missingKeywords.length > 0 && !passed) {
      details.push(`Missing important keywords: ${missingKeywords.join(', ')}`);
    }
    
    return {
      ruleId: this.id,
      description: this.description,
      passed,
      details
    };
  }
} 