import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpException, 
  HttpStatus, 
  Logger 
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standardized error response structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
  suggestedAction?: string;
}

/**
 * Global exception filter that standardizes error responses
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    // Determine HTTP status and error details
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;
    let suggestedAction: string | undefined = undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const exceptionObj = exceptionResponse as Record<string, unknown>;
        message = exceptionObj.message as string || message;
        
        // Map HTTP status to error codes
        switch (status) {
          case HttpStatus.BAD_REQUEST:
            errorCode = 'BAD_REQUEST';
            break;
          case HttpStatus.UNAUTHORIZED:
            errorCode = 'UNAUTHORIZED';
            break;
          case HttpStatus.FORBIDDEN:
            errorCode = 'FORBIDDEN';
            break;
          case HttpStatus.NOT_FOUND:
            errorCode = 'NOT_FOUND';
            break;
          case HttpStatus.REQUEST_TIMEOUT:
            errorCode = 'REQUEST_TIMEOUT';
            suggestedAction = 'Please try again later';
            break;
          case HttpStatus.PAYLOAD_TOO_LARGE:
            errorCode = 'FILE_TOO_LARGE';
            suggestedAction = 'Please upload a smaller file (max 10MB)';
            break;
          case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
            errorCode = 'INVALID_FILE_FORMAT';
            suggestedAction = 'Please upload a .docx or .pdf file';
            break;
          default:
            errorCode = `HTTP_ERROR_${status}`;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack;
      
      // Custom error detection based on message
      if (message.includes('file format')) {
        errorCode = 'INVALID_FILE_FORMAT';
        status = HttpStatus.UNSUPPORTED_MEDIA_TYPE;
        suggestedAction = 'Please upload a .docx or .pdf file';
      } else if (message.includes('file size')) {
        errorCode = 'FILE_TOO_LARGE';
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        suggestedAction = 'Please upload a smaller file (max 10MB)';
      } else if (message.includes('validation')) {
        errorCode = 'VALIDATION_ERROR';
        status = HttpStatus.BAD_REQUEST;
      }
    }

    // Create standardized error response
    const errorResponse: ApiError = {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path,
    };

    // Only include details in non-production environments
    if (process.env.NODE_ENV !== 'production' && details) {
      errorResponse.details = details;
    }

    if (suggestedAction) {
      errorResponse.suggestedAction = suggestedAction;
    }

    // Log the error
    this.logger.error(
      `${errorCode}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      `${request.method} ${path}`,
    );

    // Send response
    response.status(status).json({ error: errorResponse });
  }
} 