import { IsOptional, IsDateString, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PerformanceQueryDto {
  @ApiProperty({ required: false, description: 'Start date for metrics query' })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({ required: false, description: 'End date for metrics query' })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({ required: false, description: 'Limit number of results' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10000)
  limit?: number;

  @ApiProperty({ required: false, description: 'Service name filter' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiProperty({ required: false, description: 'Metric type filter' })
  @IsOptional()
  @IsString()
  metricType?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Time range preset',
    enum: ['1h', '6h', '12h', '24h', '7d', '30d']
  })
  @IsOptional()
  @IsEnum(['1h', '6h', '12h', '24h', '7d', '30d'])
  timeRange?: string;

  @ApiProperty({ required: false, description: 'Aggregation interval' })
  @IsOptional()
  @IsEnum(['1m', '5m', '15m', '1h', '6h', '24h'])
  interval?: string;

  @ApiProperty({ required: false, description: 'Include raw metrics data' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeRawMetrics?: boolean;

  @ApiProperty({ required: false, description: 'Include trend analysis' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeTrends?: boolean;
}