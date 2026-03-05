import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class CreateVoiceNoteDto {
  @IsString()
  audioFileKey!: string;

  @IsNumber()
  @Min(1)
  @Max(7200) // Max 2 hours
  durationSeconds!: number;

  @IsNumber()
  @Min(1)
  fileSizeBytes!: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  sessionTimestamp?: number;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  language?: string; // Preferred language for transcription
}
