import { IsString, IsOptional, IsNumber, IsObject, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SortDto {
  @ApiProperty({ description: 'Field to sort by' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsString()
  order: 'asc' | 'desc';
}

export class SearchDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Search filters as JSON object' })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sort configuration', type: [SortDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortDto)
  @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
  sort?: SortDto[];

  @ApiPropertyOptional({ description: 'Starting index for pagination', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  from?: number = 0;

  @ApiPropertyOptional({ description: 'Number of results to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  size?: number = 20;
}

export class GlobalSearchDto extends SearchDto {
  @ApiPropertyOptional({ 
    description: 'Types of content to search', 
    type: [String],
    enum: ['clients', 'appointments', 'session-notes', 'files', 'coaches']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => typeof value === 'string' ? value.split(',') : value)
  types?: string[];
}

export class AutocompleteDto {
  @ApiProperty({ description: 'Query string for autocomplete' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Field to get suggestions for' })
  @IsOptional()
  @IsString()
  field?: string = 'title';

  @ApiPropertyOptional({ description: 'Number of suggestions to return', minimum: 1, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  size?: number = 5;
}

export class SearchResultDto<T = any> {
  @ApiProperty({ description: 'Search results' })
  hits: Array<{
    _id: string;
    _score: number;
    _source: T;
    highlight?: Record<string, string[]>;
  }>;

  @ApiProperty({ description: 'Total number of results' })
  total: number;

  @ApiProperty({ description: 'Time taken for search in milliseconds' })
  took: number;

  @ApiPropertyOptional({ description: 'Search aggregations' })
  aggregations?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Pagination information' })
  pagination?: {
    from: number;
    size: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}