import { ParsedDocument } from '../../extractors/document-extractor.interface';
import { RuleResult } from '../../api/document/document.model';
import { DocumentTypeIdentifier } from './document-type-identifier';
import { ExtraBolagsstammaOrdforandeValidator } from './extra-bolagsstamma-ordforande.validator';
import { ExtraBolagsstammaRostlangdValidator } from './extra-bolagsstamma-rostlangd.validator';
import { ExtraBolagsstammaDagordningValidator } from './extra-bolagsstamma-dagordning.validator';
import { ExtraBolagsstammaBehorighetValidator } from './extra-bolagsstamma-behorighet.validator';
import { ExtraBolagsstammaObligatoriskaPunkterValidator } from './extra-bolagsstamma-obligatoriska-punkter.validator';

export class ProtocolValidationRunner {
  static run(document: ParsedDocument): {
    isExtraBolagsstamma: boolean;
    results: Record<string, RuleResult>;
  } {
    const typeIdentifier = new DocumentTypeIdentifier();
    const isExtraBolagsstamma = typeIdentifier.identifyExtraBolagsstamma(document);
    
    // Om det inte är en extra bolagsstämma, tillämpa inte reglerna
    if (!isExtraBolagsstamma) {
      return {
        isExtraBolagsstamma: false,
        results: {
          'document-type': {
            ruleId: 'document-type',
            description: 'Identifiering av dokumenttyp',
            passed: true,
            details: ['Dokumentet är inte identifierat som protokoll från extra bolagsstämma, därför tillämpas inte relaterade valideringsregler.']
          }
        }
      };
    }
    
    // Om det är en extra bolagsstämma, tillämpa alla regler
    const validators = [
      new ExtraBolagsstammaOrdforandeValidator(),
      new ExtraBolagsstammaRostlangdValidator(),
      new ExtraBolagsstammaDagordningValidator(),
      new ExtraBolagsstammaBehorighetValidator(),
      new ExtraBolagsstammaObligatoriskaPunkterValidator()
    ];
    
    const results: Record<string, RuleResult> = {
      'document-type': {
        ruleId: 'document-type',
        description: 'Identifiering av dokumenttyp',
        passed: true,
        details: ['Dokumentet är identifierat som protokoll från extra bolagsstämma.']
      }
    };
    
    for (const validator of validators) {
      results[validator.id] = validator.validate(document);
    }
    
    return {
      isExtraBolagsstamma: true,
      results
    };
  }
  
  // Hjälpmetod för formaterad utskrift av resultat
  static formatResults(validationResult: {
    isExtraBolagsstamma: boolean;
    results: Record<string, RuleResult>;
  }): string {
    let output = '=== PROTOKOLLVALIDERING ===\n\n';
    
    // Visa dokumenttyp
    output += `DOKUMENTTYP: ${validationResult.isExtraBolagsstamma ? 'Extra bolagsstämma' : 'Annan typ'}\n\n`;
    
    if (!validationResult.isExtraBolagsstamma) {
      output += "Inga ytterligare valideringsregler tillämpades eftersom dokumentet inte identifierades som protokoll från extra bolagsstämma.\n";
      return output;
    }
    
    for (const [id, result] of Object.entries(validationResult.results)) {
      const status = result.passed ? '✅ GODKÄND' : '❌ EJ GODKÄND';
      
      output += `${status}: ${result.description}\n`;
      for (const detail of result.details) {
        output += `  - ${detail}\n`;
      }
      output += '\n';
    }
    
    const passedCount = Object.values(validationResult.results).filter(r => r.passed).length;
    const totalCount = Object.values(validationResult.results).length;
    
    output += `=== SAMMANFATTNING: ${passedCount}/${totalCount} GODKÄNDA REGLER ===\n`;
    
    return output;
  }
} 