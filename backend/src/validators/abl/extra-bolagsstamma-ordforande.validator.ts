import { BaseProtokollValidator } from './abl-validator-base';
import { ParsedDocument } from '../../extractors/document-extractor.interface';
import { RuleResult } from '../../api/document/document.model';

export class ExtraBolagsstammaOrdforandeValidator extends BaseProtokollValidator {
  id = 'abl-extrastamma-ordforande';
  description = 'Val av ordförande vid stämman';
  
  keywordPatterns = [
    /\bvaldes\s+till\s+ordförande\b/i,
    /\butsågs\s+till\s+ordförande\b/i,
    /\bordförande\s+vid\s+(?:stämman|mötet)\b/i,
    /\bstämmans\s+ordförande\b/i,
    /\böppnades\s+av[\s\w]+som\s+valdes\s+till\s+ordförande\b/i
  ];
  
  validate(document: ParsedDocument): RuleResult {
    const headingPatterns = [
      /\bordförande\b/i,
      /\böppnande\b/i,
      /\binledning\b/i
    ];
    
    const relevantSections = this.findRelevantSections(document, headingPatterns);
    
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
        [`Protokollet innehåller val av ordförande vid stämman (matchat i sektion "${matchedSection}")`] : 
        ['Protokollet saknar information om val av ordförande vid stämman']
    };
  }
} 