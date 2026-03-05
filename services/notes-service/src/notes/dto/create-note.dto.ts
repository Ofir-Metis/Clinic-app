import { IsString, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  entityId!: string;

  @IsString()
  @IsIn(['appointment', 'patient'])
  entityType!: 'appointment' | 'patient';

  @IsString()
  content!: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
