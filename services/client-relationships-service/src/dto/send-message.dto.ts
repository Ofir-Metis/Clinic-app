import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  url!: string;

  @IsString()
  type!: string;
}

export class SendMessageDto {
  @IsString()
  threadId!: string;

  @IsString()
  senderId!: string;

  @IsString()
  recipientId!: string;

  @IsString()
  content!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];
}
