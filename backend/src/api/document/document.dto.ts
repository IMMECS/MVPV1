import { IsNotEmpty, IsString, IsIn } from 'class-validator';

/**
 * DTO for file upload
 */
export class FileUploadDto {
  @IsNotEmpty({ message: 'File is required' })
  file: Express.Multer.File;
}

/**
 * DTO for document validation result
 */
export class ValidationResultDto {
  documentId: string;
  overallStatus: 'PASS' | 'FAIL';
  generatedAt: string;
  ruleResults: {
    ruleId: string;
    description: string;
    passed: boolean;
    details: string[];
  }[];
  structureWarnings: string[];
}

/**
 * DTO for pagination
 */
export class PaginationDto {
  limit: number = 10;
  page: number = 1;
}

/**
 * DTO for document response
 */
export class DocumentResponseDto {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  processingStatus: string;
  overallStatus: boolean;
}

/**
 * DTO for document list response
 */
export class DocumentListResponseDto {
  documents: DocumentResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 