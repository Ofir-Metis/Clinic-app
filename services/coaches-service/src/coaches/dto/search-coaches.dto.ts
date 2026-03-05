import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CoachSpecialization } from '../coach-profile.entity';

/**
 * DTO for searching and filtering coaches
 */
export class SearchCoachesDto {
  @ApiPropertyOptional({ description: 'Search text for name/bio', example: 'life coach' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by specialization',
    enum: CoachSpecialization,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CoachSpecialization, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  specializations?: CoachSpecialization[];

  @ApiPropertyOptional({ description: 'Filter by language', example: ['English', 'Spanish'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  languages?: string[];

  @ApiPropertyOptional({ description: 'Only coaches accepting new clients', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  acceptingNewClients?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['rating', 'experience', 'name', 'updated'] })
  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'experience' | 'name' | 'updated';

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
