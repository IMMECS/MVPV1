import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IValidator, RuleDefinition } from './validator.interface';
import { ParsedDocument } from '../extractors/document-extractor.interface';
import { RuleResult } from '../api/document/document.model';
import { DummyValidator, StructureValidator, KeywordValidator } from './dummy-validator';
import {
  ExtraBolagsstammaOrdforandeValidator,
  ExtraBolagsstammaRostlangdValidator,
  ExtraBolagsstammaDagordningValidator,
  ExtraBolagsstammaBehorighetValidator,
  ExtraBolagsstammaObligatoriskaPunkterValidator
} from './abl';

/**
 * Service for managing and accessing validators
 */
@Injectable()
export class ValidatorRegistry implements OnModuleInit {
  private readonly logger = new Logger(ValidatorRegistry.name);
  private validators: Map<string, IValidator> = new Map();
  private ruleDefinitions: Map<string, RuleDefinition> = new Map();
  
  constructor(
    private readonly dummyValidator: DummyValidator,
    private readonly structureValidator: StructureValidator,
    private readonly keywordValidator: KeywordValidator,
    private readonly ordforandeValidator: ExtraBolagsstammaOrdforandeValidator,
    private readonly rostlangdValidator: ExtraBolagsstammaRostlangdValidator,
    private readonly dagordningValidator: ExtraBolagsstammaDagordningValidator,
    private readonly behorighetValidator: ExtraBolagsstammaBehorighetValidator,
    private readonly obligatoriskaPunkterValidator: ExtraBolagsstammaObligatoriskaPunkterValidator
  ) {}
  
  /**
   * Register all validators when the module initializes
   */
  onModuleInit() {
    // Register all validators
    this.registerValidator(this.dummyValidator);
    this.registerValidator(this.structureValidator);
    this.registerValidator(this.keywordValidator);
    
    // Register ABL validators
    this.registerValidator(this.ordforandeValidator);
    this.registerValidator(this.rostlangdValidator);
    this.registerValidator(this.dagordningValidator);
    this.registerValidator(this.behorighetValidator);
    this.registerValidator(this.obligatoriskaPunkterValidator);
    
    // Create rule definitions for each validator
    this.createRuleDefinitions();
    
    this.logger.log(`Registered ${this.validators.size} validators`);
  }
  
  /**
   * Register a validator
   * @param validator The validator to register
   */
  registerValidator(validator: IValidator) {
    if (this.validators.has(validator.id)) {
      this.logger.warn(`Validator with ID ${validator.id} already registered. Skipping.`);
      return;
    }
    
    this.validators.set(validator.id, validator);
    this.logger.debug(`Registered validator: ${validator.id}`);
    
    // If the validator has a rule definition, register it
    if ('getDefinition' in validator && typeof validator['getDefinition'] === 'function') {
      const definition = validator['getDefinition']();
      this.ruleDefinitions.set(validator.id, definition);
    }
  }
  
  /**
   * Create rule definitions for all registered validators
   * In a real application, these would come from a database or configuration
   */
  private createRuleDefinitions(): void {
    // Create basic definitions for all validators
    this.validators.forEach(validator => {
      const now = new Date();
      
      const definition: RuleDefinition = {
        id: validator.id,
        description: validator.description,
        severity: 'important',
        tags: ['abl', 'protokoll'],
        applicableEntityTypes: ['all'],
        implementation: validator.constructor.name,
        enabled: true,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
      };
      
      // Add some specific metadata for different validators
      if (validator.id.startsWith('abl-')) {
        definition.tags = ['abl', 'protokoll', 'extra-bolagsstämma'];
        definition.severity = 'critical';
      } else if (validator.id === 'dummy-1') {
        definition.tags = ['text', 'basic'];
        definition.severity = 'critical';
      } else if (validator.id === 'dummy-2') {
        definition.tags = ['structure', 'headings'];
        definition.severity = 'important';
      } else if (validator.id === 'dummy-3') {
        definition.tags = ['content', 'keywords', 'abl'];
        definition.severity = 'recommendation';
      }
      
      this.ruleDefinitions.set(validator.id, definition);
    });
  }
  
  /**
   * Get all registered validators
   */
  getValidators(): IValidator[] {
    return Array.from(this.validators.values());
  }
  
  /**
   * Get all rule definitions
   */
  getRuleDefinitions(): RuleDefinition[] {
    return Array.from(this.ruleDefinitions.values());
  }
  
  /**
   * Get enabled validators
   */
  getEnabledValidators(): IValidator[] {
    return this.getValidators().filter(validator => {
      const definition = this.ruleDefinitions.get(validator.id);
      return definition?.enabled === true;
    });
  }
  
  /**
   * Get a validator by ID
   * @param id Validator ID
   */
  getValidator(id: string): IValidator | undefined {
    return this.validators.get(id);
  }
  
  /**
   * Get a rule definition by ID
   * @param id Rule definition ID
   */
  getRuleDefinition(id: string): RuleDefinition | undefined {
    return this.ruleDefinitions.get(id);
  }
  
  /**
   * Validate a document against all registered rules
   * @param document The document to validate
   * @returns Validation results for each rule
   */
  async validateDocument(document: ParsedDocument): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const validators = this.getValidators();
    
    this.logger.log(`Validating document with ${validators.length} rules`);
    
    for (const validator of validators) {
      try {
        const result = await this.validateRule(validator, document);
        results.push(result);
      } catch (error) {
        this.logger.error(`Error validating rule ${validator.id}: ${error.message}`, error.stack);
        
        // Add a failed result for this rule
        results.push({
          ruleId: validator.id,
          description: validator.description,
          passed: false,
          details: [`Error during validation: ${error.message}`]
        });
      }
    }
    
    return results;
  }
  
  /**
   * Validate a document against a specific rule
   * @param validator The validator to use
   * @param document The document to validate
   * @returns Validation result
   */
  private async validateRule(validator: IValidator, document: ParsedDocument): Promise<RuleResult> {
    try {
      this.logger.debug(`Validating rule: ${validator.id}`);
      const startTime = Date.now();
      
      // Validate the document
      const result = await Promise.resolve(validator.validate(document));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.logger.debug(`Rule ${validator.id} validation completed in ${duration}ms, result: ${result.passed ? 'PASS' : 'FAIL'}`);
      
      // Ensure the result has the correct structure
      return {
        ruleId: validator.id,
        description: validator.description,
        passed: !!result.passed,  // Ensure boolean
        details: Array.isArray(result.details) ? result.details : [result.details].filter(Boolean)
      };
    } catch (error) {
      this.logger.error(`Error in validator ${validator.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
} 