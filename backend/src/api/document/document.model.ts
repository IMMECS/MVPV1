import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export interface DocumentChunk {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'other';
  text: string;
  level?: number;
  parentId?: string;
}

export interface RuleResult {
  ruleId: string;
  description: string;
  passed: boolean;
  details: string[];
}

@Schema({ timestamps: true })
export class ProcessedDocument extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true, enum: ['docx', 'pdf'] })
  fileType: string;

  @Prop({ 
    type: { 
      algorithm: String, 
      iv: String 
    } 
  })
  encryptionInfo: {
    algorithm: string;
    iv: string;
  };

  @Prop()
  filePath: string;

  @Prop({ default: '' })
  text: string;

  @Prop({ type: [{ 
    id: String,
    type: { type: String, enum: ['heading', 'paragraph', 'list', 'other'] },
    text: String,
    level: Number,
    parentId: String
  }] })
  chunks: DocumentChunk[];

  @Prop({ required: true, enum: ['pending', 'processing', 'completed', 'failed'] })
  processingStatus: string;

  @Prop()
  processingError?: string;

  @Prop({ type: [{ 
    ruleId: String,
    description: String,
    passed: Boolean,
    details: [String]
  }] })
  ruleResults: RuleResult[];

  @Prop({ type: [String] })
  structureWarnings: string[];

  @Prop({ default: false })
  overallStatus: boolean;

  @Prop({ type: Date, default: Date.now, expires: 60 * 60 * 24 }) // 24 hours
  expiresAt: Date;
}

export const ProcessedDocumentSchema = SchemaFactory.createForClass(ProcessedDocument);

// Create indexes for better query performance
ProcessedDocumentSchema.index({ userId: 1, createdAt: -1 });
ProcessedDocumentSchema.index({ processingStatus: 1 }); 