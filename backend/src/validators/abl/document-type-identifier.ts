import { ParsedDocument } from '../../extractors/document-extractor.interface';

export class DocumentTypeIdentifier {
  identifyExtraBolagsstamma(document: ParsedDocument): boolean {
    // Sök i titeln och första avsnitten efter nyckelord som indikerar extra bolagsstämma
    const titleMatch = /extra\s+bolagsstämma/i.test(document.text);
    
    if (titleMatch) return true;
    
    // Sök i de första sektionerna (rubrik och inledning)
    const firstChunks = document.chunks.slice(0, Math.min(3, document.chunks.length));
    for (const chunk of firstChunks) {
      if (/extra\s+bolagsstämma/i.test(chunk.text)) {
        return true;
      }
    }
    
    // Sök i hela dokumentet som fallback, men med lägre tillit
    return /protokoll[\s\S]*?extra\s+bolagsstämma/i.test(document.text);
  }
} 