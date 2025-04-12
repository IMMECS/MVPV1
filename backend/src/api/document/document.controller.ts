import { 
  Controller, 
  Post, 
  Get, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards,
  Request,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DocumentService } from './document.service';
import { FileUploadDto } from './document.dto';
import { FileFilter } from './file-filter';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * Upload a document for validation
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: FileFilter.filter,
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded or invalid file format');
    }

    return this.documentService.processDocument(file, req.user.userId);
  }

  /**
   * Get all documents for the authenticated user
   */
  @Get()
  async getAllDocuments(
    @Request() req,
    @Query('limit') limit = 10,
    @Query('page') page = 1,
  ) {
    return this.documentService.getAllDocuments(req.user.userId, { limit, page });
  }

  /**
   * Get a document by ID
   */
  @Get(':id')
  async getDocument(@Param('id') id: string, @Request() req) {
    const document = await this.documentService.getDocument(id, req.user.userId);
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  /**
   * Delete a document
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string, @Request() req) {
    await this.documentService.deleteDocument(id, req.user.userId);
  }

  /**
   * Get validation results for a document
   */
  @Get(':id/validation')
  async getValidationResults(@Param('id') id: string, @Request() req) {
    const results = await this.documentService.getValidationResults(id, req.user.userId);
    
    if (!results) {
      throw new NotFoundException('Document or validation results not found');
    }
    
    return results;
  }
} 