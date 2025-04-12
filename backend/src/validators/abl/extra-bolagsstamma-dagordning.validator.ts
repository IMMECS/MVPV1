import { BaseProtokollValidator } from './abl-validator-base';
import { ParsedDocument } from '../../extractors/document-extractor.interface';
import { RuleResult } from '../../api/document/document.model';

export class ExtraBolagsstammaDagordningValidator extends BaseProtokollValidator {
  id = 'abl-extrastamma-dagordning';
  description = 'Godkännande av dagordning';
  
  keywordPatterns = [
    /\bgodkän(?:de|des)\s+(?:föreslagen|framlagd)?\s*dagordning\b/i,
    /\bdagordning(?:en)?\s+godkän(?:de|des)\b/i,
    /\bfastställ(?:de|des)\s+(?:föreslagen|framlagd)?\s*dagordning\b/i,
    /\bstämman\s+godkände\s+(?:framlagt\s+förslag\s+till)?\s*dagordning\b/i
  ];
  
  validate(document: ParsedDocument): RuleResult {
    const headingPatterns = [
      /\bdagordning\b/i,
      /\bföredragningslista\b/i
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
        [`Protokollet innehåller godkännande av dagordning (matchat i sektion "${matchedSection}")`] : 
        ['Protokollet saknar information om godkännande av dagordning']
    };
  }
} 