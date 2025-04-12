import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { ProcessedDocument, ProcessedDocumentSchema } from './document.model';
import { ExtractorModule } from '../../extractors/extractor.module';
import { ValidatorModule } from '../../validators/validator.module';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    // Document model
    MongooseModule.forFeature([
      { name: ProcessedDocument.name, schema: ProcessedDocumentSchema },
    ]),
    
    // File upload configuration
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uploadDir = configService.get<string>('UPLOAD_DIRECTORY') || './uploads';
        
        // Create upload directory if it doesn't exist
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }
        
        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (req, file, cb) => {
              // Generate unique filename
              const uniqueFilename = `${uuidv4()}-${file.originalname.replace(/\s+/g, '_')}`;
              cb(null, uniqueFilename);
            },
          }),
        };
      },
    }),
    
    // Include other modules
    ExtractorModule,
    ValidatorModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {} 