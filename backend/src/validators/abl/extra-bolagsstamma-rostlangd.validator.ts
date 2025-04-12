import { BaseProtokollValidator } from './abl-validator-base';
import { ParsedDocument } from '../../extractors/document-extractor.interface';
import { RuleResult } from '../../api/document/document.model';

export class ExtraBolagsstammaRostlangdValidator extends BaseProtokollValidator {
  id = 'abl-extrastamma-rostlangd';
  description = 'Godkännande av röstlängd';
  
  keywordPatterns = [
    /\bgodkän(?:de|des)\s+(?:som)?\s*röstlängd\b/i,
    /\bröstlängd(?:en)?\s+godkän(?:de|des)\b/i,
    /\bfastställ(?:de|des)\s+(?:som)?\s*röstlängd\b/i,
    /\bförteckning\s+godkändes\s+som\s+röstlängd\b/i
  ];
  
  validate(document: ParsedDocument): RuleResult {
    const headingPatterns = [
      /\bröstlängd\b/i,
      /\bnärvarande\b/i
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
        [`Protokollet innehåller godkännande av röstlängd (matchat i sektion "${matchedSection}")`] : 
        ['Protokollet saknar information om godkännande av röstlängd']
    };
  }
} 