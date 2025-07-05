import { IsString, IsArray, IsOptional } from 'class-validator';

/**
 * DTO validating therapist profile updates.
 */
export class UpdateTherapistProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  services?: any[];

  @IsOptional()
  @IsArray()
  media?: any[];
}
