import { Module } from '@nestjs/common';
import { DocxExtractor } from './docx-extractor';
import { PdfExtractor } from './pdf-extractor';
import { ExtractorService } from './extractor.service';

@Module({
  providers: [
    // Register document extractors
    DocxExtractor,
    PdfExtractor,
    
    // Register the extractor service
    ExtractorService,
  ],
  exports: [
    // Export the extractor service
    ExtractorService,
  ],
})
export class ExtractorModule {} 