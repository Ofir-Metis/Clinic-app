import { IsString, IsArray, IsOptional, IsEnum, IsNumber, IsEmail, IsUrl } from 'class-validator';
import { TherapistSpecialization } from '../therapist-profile.entity';

/**
 * Enterprise-grade DTO for therapist profile updates with comprehensive validation
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
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TherapistSpecialization, { each: true })
  specializations?: TherapistSpecialization[];

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @IsOptional()
  @IsArray()
  certifications?: any[];

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsArray()
  timeZones?: string[];

  @IsOptional()
  pricing?: any;

  @IsOptional()
  @IsArray()
  media?: any[];

  // Legacy compatibility
  @IsOptional()
  @IsArray()
  services?: any[];
}
