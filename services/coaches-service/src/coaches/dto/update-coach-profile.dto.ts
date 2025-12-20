import { IsString, IsArray, IsOptional, IsEnum, IsNumber, IsEmail, IsUrl } from 'class-validator';
import { CoachSpecialization } from '../coach-profile.entity';

/**
 * Enterprise-grade DTO for coach profile updates with comprehensive validation
 */
export class UpdateCoachProfileDto {
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
  @IsEnum(CoachSpecialization, { each: true })
  specializations?: CoachSpecialization[];

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
