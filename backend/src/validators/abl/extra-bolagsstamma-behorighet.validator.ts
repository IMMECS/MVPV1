import { BaseProtokollValidator } from './abl-validator-base';
import { ParsedDocument } from '../../extractors/document-extractor.interface';
import { RuleResult } from '../../api/document/document.model';

export class ExtraBolagsstammaBehorighetValidator extends BaseProtokollValidator {
  id = 'abl-extrastamma-behorighet';
  description = 'Bedömning av stämmans behörighet';
  
  keywordPatterns = [
    /\bstämman\s+(?:var|förklarade\s+sig)\s+beslutsför\b/i,
    /\bbeslutför(?:het)?\b/i,
    /\bstämmans\s+behörighet\b/i,
    /\bbehörigen\s+utlyst\b/i,
    /\bförklarade\s+sig\s+stämman\s+beslutsför\b/i
  ];
  
  validate(document: ParsedDocument): RuleResult {
    const headingPatterns = [
      /\bbehörighet\b/i,
      /\bbeslutsför\b/i,
      /\bbehörigen\b/i
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
        [`Protokollet innehåller bedömning av stämmans behörighet (matchat i sektion "${matchedSection}")`] : 
        ['Protokollet saknar bedömning av stämmans behörighet/beslutförhet']
    };
  }
} 