import { ProtocolValidationRunner } from './protocol-validation-runner';
import { ParsedDocument } from '../../extractors/document-extractor.interface';
import { DocumentChunk } from '../../api/document/document.model';

// Sample document that passes all validations
const sampleValidDocument: ParsedDocument = {
  documentId: 'test-1',
  text: `PROTOKOLL
Extra bolagsstämma i Example AB

Stämman öppnades av Anna Andersson som valdes till ordförande.

Närvarande och röstlängd:
Förteckning över närvarande godkändes som röstlängd.

Dagordning:
Stämman godkände den framlagda dagordningen.

Behörighet:
Stämman förklarade sig beslutsför.`,
  chunks: [
    { id: '1', type: 'heading', text: 'PROTOKOLL', level: 1 },
    { id: '2', type: 'heading', text: 'Extra bolagsstämma i Example AB', level: 2 },
    { id: '3', type: 'paragraph', text: 'Stämman öppnades av Anna Andersson som valdes till ordförande.' },
    { id: '4', type: 'heading', text: 'Närvarande och röstlängd', level: 2 },
    { id: '5', type: 'paragraph', text: 'Förteckning över närvarande godkändes som röstlängd.' },
    { id: '6', type: 'heading', text: 'Dagordning', level: 2 },
    { id: '7', type: 'paragraph', text: 'Stämman godkände den framlagda dagordningen.' },
    { id: '8', type: 'heading', text: 'Behörighet', level: 2 },
    { id: '9', type: 'paragraph', text: 'Stämman förklarade sig beslutsför.' }
  ],
  metadata: {
    fileName: 'sample-valid-protocol.docx',
    fileType: 'docx',
    fileSize: 1000,
    uploadedAt: new Date()
  }
};

// Sample document that fails some validations
const sampleInvalidDocument: ParsedDocument = {
  documentId: 'test-2',
  text: `PROTOKOLL
Extra bolagsstämma i Example AB

Stämman öppnades av Anna Andersson.

Närvarande:
Förteckning över närvarande presenterades.

Dagordning:
Stämman diskuterade dagordningen.

Behörighet:
Stämman diskuterade behörighetsfrågor.`,
  chunks: [
    { id: '1', type: 'heading', text: 'PROTOKOLL', level: 1 },
    { id: '2', type: 'heading', text: 'Extra bolagsstämma i Example AB', level: 2 },
    { id: '3', type: 'paragraph', text: 'Stämman öppnades av Anna Andersson.' },
    { id: '4', type: 'heading', text: 'Närvarande', level: 2 },
    { id: '5', type: 'paragraph', text: 'Förteckning över närvarande presenterades.' },
    { id: '6', type: 'heading', text: 'Dagordning', level: 2 },
    { id: '7', type: 'paragraph', text: 'Stämman diskuterade dagordningen.' },
    { id: '8', type: 'heading', text: 'Behörighet', level: 2 },
    { id: '9', type: 'paragraph', text: 'Stämman diskuterade behörighetsfrågor.' }
  ],
  metadata: {
    fileName: 'sample-invalid-protocol.docx',
    fileType: 'docx',
    fileSize: 1000,
    uploadedAt: new Date()
  }
};

// Test the validators
function testValidators() {
  console.log('=== Testing with valid document ===');
  const validResult = ProtocolValidationRunner.run(sampleValidDocument);
  console.log(ProtocolValidationRunner.formatResults(validResult));

  console.log('\n=== Testing with invalid document ===');
  const invalidResult = ProtocolValidationRunner.run(sampleInvalidDocument);
  console.log(ProtocolValidationRunner.formatResults(invalidResult));
}

// Run the tests
testValidators(); 