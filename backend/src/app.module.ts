import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './error/global-exception.filter';
import { AuthModule } from './auth/auth.module';
import { DocumentModule } from './api/document/document.module';
import { ValidatorModule } from './validators/validator.module';
import { ExtractorModule } from './extractors/extractor.module';

@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),
    
    // Database connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/document-validator',
      }),
    }),
    
    // Application modules
    AuthModule,
    DocumentModule,
    ValidatorModule,
    ExtractorModule,
  ],
  providers: [
    // Global exception filter for standardized error responses
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {} 