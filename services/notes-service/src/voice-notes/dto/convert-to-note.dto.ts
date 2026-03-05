import { IsString, IsIn, IsUUID, IsOptional } from 'class-validator';

export class ConvertToNoteDto {
  @IsString()
  @IsIn(['appointment', 'client', 'patient'])
  entityType!: 'appointment' | 'client' | 'patient';

  @IsUUID()
  entityId!: string;

  @IsString()
  @IsOptional()
  additionalContent?: string;
}
