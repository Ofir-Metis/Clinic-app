import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class UpdateVoiceNoteDto {
  @IsString()
  @IsOptional()
  transcription?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
