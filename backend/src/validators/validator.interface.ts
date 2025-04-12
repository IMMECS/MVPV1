import { ParsedDocument } from '../extractors/document-extractor.interface';
import { RuleResult } from '../api/document/document.model';

/**
 * Rule definition including metadata
 */
export interface RuleDefinition {
  id: string;
  chapter?: number;
  section?: string;
  description: string;
  severity: 'critical' | 'important' | 'recommendation';
  tags: string[];
  applicableEntityTypes: string[];
  implementation: string;
  enabled: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for document validators
 * Each validator is responsible for checking a specific rule
 */
export interface IValidator {
  /**
   * Unique identifier for the rule
   */
  id: string;
  
  /**
   * Human-readable description of the rule
   */
  description: string;
  
  /**
   * Validate a document against this rule
   * @param document The parsed document to validate
   * @returns The result of the validation
   */
  validate(document: ParsedDocument): Promise<RuleResult> | RuleResult;
} 