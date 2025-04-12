import { IValidator } from '../validator.interface';
import { ParsedDocument } from '../../extractors/document-extractor.interface';
import { RuleResult } from '../../api/document/document.model';
import { ExtraBolagsstammaOrdforandeValidator } from './extra-bolagsstamma-ordforande.validator';
import { ExtraBolagsstammaRostlangdValidator } from './extra-bolagsstamma-rostlangd.validator';
import { ExtraBolagsstammaDagordningValidator } from './extra-bolagsstamma-dagordning.validator';
import { ExtraBolagsstammaBehorighetValidator } from './extra-bolagsstamma-behorighet.validator';

export class ExtraBolagsstammaObligatoriskaPunkterValidator implements IValidator {
  id = 'abl-extrastamma-obligatoriska-punkter';
  description = 'Kontroll av samtliga obligatoriska punkter för extra bolagsstämma';
  
  private validators = [
    new ExtraBolagsstammaOrdforandeValidator(),
    new ExtraBolagsstammaRostlangdValidator(),
    new ExtraBolagsstammaDagordningValidator(),
    new ExtraBolagsstammaBehorighetValidator()
  ];
  
  validate(document: ParsedDocument): RuleResult {
    const results = this.validators.map(validator => validator.validate(document));
    
    const passed = results.every(result => result.passed);
    const failedValidators = results.filter(result => !result.passed);
    
    const details = passed ? 
      ['Protokollet innehåller samtliga obligatoriska punkter för extra bolagsstämma'] : 
      [
        'Protokollet saknar följande obligatoriska punkter:',
        ...failedValidators.map(result => `- ${result.description}`)
      ];
    
    return {
      ruleId: this.id,
      description: this.description,
      passed,
      details
    };
  }
} 