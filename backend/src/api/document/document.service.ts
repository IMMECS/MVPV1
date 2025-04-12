import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as CryptoJS from 'crypto-js';
import { ProcessedDocument } from './document.model';
import { ExtractorService } from '../../extractors/extractor.service';
import { ValidatorRegistry } from '../../validators/validator-registry.service';
import { PaginationDto, DocumentListResponseDto, ValidationResultDto } from './document.dto';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectModel(ProcessedDocument.name) private documentModel: Model<ProcessedDocument>,
    private readonly extractorService: ExtractorService,
    private readonly validatorRegistry: ValidatorRegistry,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Process an uploaded document
   * @param file The uploaded file
   * @param userId The user ID
   */
  async processDocument(file: Express.Multer.File, userId: string) {
    try {
      // Create initial document record
      const document = await this.createDocumentRecord(file, userId);
      
      // Start asynchronous processing
      this.processDocumentAsync(document._id.toString(), file.path, file.mimetype);
      
      return {
        documentId: document._id.toString(),
        status: 'processing',
        message: 'Document uploaded and is being processed',
      };
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Create a document record in the database
   * @param file The uploaded file
   * @param userId The user ID
   */
  private async createDocumentRecord(file: Express.Multer.File, userId: string) {
    // Create document record
    const document = new this.documentModel({
      userId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: this.getFileType(file.originalname),
      filePath: file.path,
      processingStatus: 'pending',
      encryptionInfo: {
        algorithm: 'AES',
        iv: CryptoJS.lib.WordArray.random(16).toString(),
      },
    });
    
    // Save document record
    return document.save();
  }

  /**
   * Process a document asynchronously
   * @param documentId The document ID
   * @param filePath The file path
   * @param mimeType The file MIME type
   */
  private async processDocumentAsync(documentId: string, filePath: string, mimeType: string) {
    try {
      // Update status to processing
      await this.updateDocumentStatus(documentId, 'processing');
      
      // Get file type
      const fileType = this.getMimeTypeExtension(mimeType);
      
      // Extract text from document
      const parsedDocument = await this.extractorService.extractText(filePath, fileType);
      
      // Encrypt the file
      await this.encryptFile(documentId);
      
      // Validate document
      const validators = this.validatorRegistry.getEnabledValidators();
      const ruleResults = [];
      
      // Run all validators
      for (const validator of validators) {
        try {
          const result = await Promise.resolve(validator.validate(parsedDocument));
          ruleResults.push(result);
        } catch (error) {
          this.logger.error(`Validator ${validator.id} failed: ${error.message}`);
          // Add failed result
          ruleResults.push({
            ruleId: validator.id,
            description: validator.description,
            passed: false,
            details: [`Validator error: ${error.message}`],
          });
        }
      }
      
      // Determine overall status
      const overallStatus = ruleResults.every(result => result.passed);
      
      // Update document with results
      await this.documentModel.findByIdAndUpdate(documentId, {
        text: parsedDocument.text,
        chunks: parsedDocument.chunks,
        ruleResults,
        structureWarnings: this.extractStructureWarnings(parsedDocument),
        overallStatus,
        processingStatus: 'completed',
      });
      
      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing document ${documentId}: ${error.message}`, error.stack);
      
      // Update document with error
      await this.updateDocumentStatus(documentId, 'failed', error.message);
    }
  }

  /**
   * Extract structure warnings from parsed document
   */
  private extractStructureWarnings(parsedDocument: any): string[] {
    const warnings = [];
    
    // Check if document has headings
    if (!parsedDocument.chunks.some(chunk => chunk.type === 'heading')) {
      warnings.push('Document lacks proper heading structure');
    }
    
    // Check document length
    if (parsedDocument.text.length < 100) {
      warnings.push('Document appears to be too short');
    }
    
    return warnings;
  }

  /**
   * Update document status
   */
  private async updateDocumentStatus(documentId: string, status: string, error?: string) {
    const update: any = { processingStatus: status };
    
    if (error) {
      update.processingError = error;
    }
    
    await this.documentModel.findByIdAndUpdate(documentId, update);
  }

  /**
   * Encrypt file for secure storage
   */
  private async encryptFile(documentId: string) {
    try {
      const document = await this.documentModel.findById(documentId);
      
      if (!document || !document.filePath) {
        throw new Error('Document or file path not found');
      }
      
      // Read file
      const fileContent = fs.readFileSync(document.filePath);
      
      // Encrypt content
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-encryption-key';
      const encrypted = CryptoJS.AES.encrypt(
        fileContent.toString('base64'),
        encryptionKey,
        {
          iv: CryptoJS.enc.Hex.parse(document.encryptionInfo.iv),
        }
      ).toString();
      
      // Write encrypted content back to file
      fs.writeFileSync(document.filePath, encrypted);
      
      this.logger.log(`Document ${documentId} encrypted successfully`);
    } catch (error) {
      this.logger.error(`Error encrypting document ${documentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file type from file name
   */
  private getFileType(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();
    return extension === '.pdf' ? 'pdf' : 'docx';
  }

  /**
   * Get file extension from MIME type
   */
  private getMimeTypeExtension(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    return 'unknown';
  }

  /**
   * Get all documents for a user
   */
  async getAllDocuments(userId: string, pagination: PaginationDto): Promise<DocumentListResponseDto> {
    const { limit, page } = pagination;
    const skip = (page - 1) * limit;
    
    const [documents, total] = await Promise.all([
      this.documentModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.documentModel.countDocuments({ userId }).exec(),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      documents: documents.map(doc => this.mapDocumentToResponse(doc)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string, userId: string) {
    const document = await this.documentModel.findOne({ _id: id, userId }).exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return this.mapDocumentToResponse(document);
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string, userId: string) {
    const document = await this.documentModel.findOne({ _id: id, userId }).exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    // Delete file if it exists
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Delete document from database
    await document.deleteOne();
    
    return { success: true };
  }

  /**
   * Get validation results for a document
   */
  async getValidationResults(id: string, userId: string): Promise<ValidationResultDto> {
    const document = await this.documentModel.findOne({ _id: id, userId }).exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    if (document.processingStatus !== 'completed') {
      return {
        documentId: document._id.toString(),
        overallStatus: 'FAIL',
        generatedAt: document.updatedAt.toISOString(),
        ruleResults: [],
        structureWarnings: ['Document processing has not completed yet'],
      };
    }
    
    return {
      documentId: document._id.toString(),
      overallStatus: document.overallStatus ? 'PASS' : 'FAIL',
      generatedAt: document.updatedAt.toISOString(),
      ruleResults: document.ruleResults || [],
      structureWarnings: document.structureWarnings || [],
    };
  }

  /**
   * Map document model to response DTO
   */
  private mapDocumentToResponse(document: ProcessedDocument) {
    return {
      id: document._id.toString(),
      fileName: document.fileName,
      fileSize: document.fileSize,
      fileType: document.fileType,
      uploadedAt: document.createdAt,
      processingStatus: document.processingStatus,
      overallStatus: document.overallStatus,
    };
  }
} 