import { Module } from '@nestjs/common';
import { DummyValidator, StructureValidator, KeywordValidator } from './dummy-validator';
import { ValidatorRegistry } from './validator-registry.service';
import {
  ExtraBolagsstammaOrdforandeValidator,
  ExtraBolagsstammaRostlangdValidator,
  ExtraBolagsstammaDagordningValidator,
  ExtraBolagsstammaBehorighetValidator,
  ExtraBolagsstammaObligatoriskaPunkterValidator,
  ProtocolValidationRunner
} from './abl';

@Module({
  providers: [
    // Register all validator implementations
    DummyValidator,
    StructureValidator,
    KeywordValidator,
    
    // Register ABL validators
    ExtraBolagsstammaOrdforandeValidator,
    ExtraBolagsstammaRostlangdValidator,
    ExtraBolagsstammaDagordningValidator,
    ExtraBolagsstammaBehorighetValidator,
    ExtraBolagsstammaObligatoriskaPunkterValidator,
    ProtocolValidationRunner,
    
    // Register the validator registry service
    ValidatorRegistry,
  ],
  exports: [
    // Export the registry for use in other modules
    ValidatorRegistry,
    // Export the protocol validation runner for direct use
    ProtocolValidationRunner,
  ],
})
export class ValidatorModule {} 