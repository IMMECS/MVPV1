import { IValidator } from '../validator.interface';
import { ParsedDocument } from '../../extractors/document-extractor.interface';
import { DocumentChunk, RuleResult } from '../../api/document/document.model';

export abstract class BaseProtokollValidator implements IValidator {
  abstract id: string;
  abstract description: string;
  abstract keywordPatterns: RegExp[];
  
  validate(document: ParsedDocument): RuleResult {
    // Hitta relevanta avsnitt i dokumentet
    const relevantSections = this.findRelevantSections(document);
    
    // Om inget relevant avsnitt hittas
    if (relevantSections.length === 0) {
      return {
        ruleId: this.id,
        description: this.description,
        passed: false,
        details: [`Protokollet saknar avsnitt som behandlar ${this.description.toLowerCase()}`]
      };
    }
    
    // Kontrollera om något av nyckelorden förekommer i relevanta avsnitt
    let found = false;
    let matchedPattern = '';
    let matchedSection = '';
    
    for (const section of relevantSections) {
      for (const pattern of this.keywordPatterns) {
        if (pattern.test(section.text) || pattern.test(section.type === 'heading' ? section.text : '')) {
          found = true;
          matchedPattern = pattern.toString();
          matchedSection = section.type === 'heading' ? section.text : '';
          break;
        }
      }
      if (found) break;
    }
    
    return {
      ruleId: this.id,
      description: this.description,
      passed: found,
      details: found ? 
        [`Protokollet innehåller ${this.description.toLowerCase()} (matchat i sektion "${matchedSection}")`] : 
        [`Protokollet saknar ${this.description.toLowerCase()}`]
    };
  }
  
  protected findRelevantSections(document: ParsedDocument, headingPatterns?: RegExp[]): DocumentChunk[] {
    const sections: DocumentChunk[] = [];
    
    // Om specifika rubrikmönster angetts, sök efter dessa
    if (headingPatterns && headingPatterns.length > 0) {
      for (const chunk of document.chunks) {
        if (chunk.type === 'heading') {
          for (const pattern of headingPatterns) {
            if (pattern.test(chunk.text)) {
              sections.push(chunk);
              break;
            }
          }
        }
      }
    }
    
    // Om inga sektioner hittades eller inga rubrikmönster angavs, inkludera alla för genomsökning
    if (sections.length === 0) {
      return document.chunks;
    }
    
    return sections;
  }
} 