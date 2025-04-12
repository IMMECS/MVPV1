import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';

/**
 * Filter for validating uploaded files
 */
export class FileFilter {
  /**
   * Supported file types
   */
  private static readonly allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  /**
   * Supported file extensions
   */
  private static readonly allowedExtensions = ['.pdf', '.docx'];
  
  /**
   * Filter files based on mime type and extension
   */
  static filter(req: Request, file: Express.Multer.File, callback: Function) {
    // Get file extension from original name
    const fileExtension = FileFilter.getFileExtension(file.originalname);
    
    // Check if file type is supported
    if (!FileFilter.isAllowedFile(file.mimetype, fileExtension)) {
      return callback(
        new BadRequestException(
          `File type not supported. Allowed types: ${FileFilter.allowedExtensions.join(', ')}`
        ),
        false
      );
    }
    
    callback(null, true);
  }
  
  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : '';
  }
  
  /**
   * Check if file is allowed based on mime type and extension
   */
  private static isAllowedFile(mimetype: string, extension: string): boolean {
    return (
      FileFilter.allowedMimeTypes.includes(mimetype) &&
      FileFilter.allowedExtensions.includes(extension)
    );
  }
} 