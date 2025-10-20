import { IsString, IsOptional, IsDateString, IsArray, IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  DASHBOARD = 'dashboard',
  APPOINTMENTS = 'appointments',
  CLIENTS = 'clients',
  REVENUE = 'revenue',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom',
}

export enum TimePeriod {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  LAST_6_MONTHS = '6m',
  LAST_YEAR = '1y',
  CUSTOM = 'custom',
}

export enum MetricType {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  PERCENTAGE = 'percentage',
  RATE = 'rate',
}

export class ReportFiltersDto {
  @ApiPropertyOptional({ description: 'Start date for the report period' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for the report period' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Predefined time period', enum: TimePeriod })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod;

  @ApiPropertyOptional({ description: 'Coach ID to filter by' })
  @IsOptional()
  @IsString()
  coachId?: string;

  @ApiPropertyOptional({ description: 'Client ID to filter by' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Appointment type to filter by' })
  @IsOptional()
  @IsString()
  appointmentType?: string;

  @ApiPropertyOptional({ description: 'Tags to filter by', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => typeof value === 'string' ? value.split(',') : value)
  tags?: string[];

  @ApiPropertyOptional({ description: 'Group results by field' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ description: 'Include inactive records' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeInactive?: boolean;
}

export class MetricConfigDto {
  @ApiProperty({ description: 'Metric name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Metric type', enum: MetricType })
  @IsEnum(MetricType)
  type!: MetricType;

  @ApiProperty({ description: 'Source field for the metric' })
  @IsString()
  field!: string;

  @ApiPropertyOptional({ description: 'Metric label for display' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Metric description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ChartConfigDto {
  @ApiProperty({ description: 'Chart type', enum: ['line', 'bar', 'pie', 'donut', 'area'] })
  @IsEnum(['line', 'bar', 'pie', 'donut', 'area'])
  type!: string;

  @ApiProperty({ description: 'Chart title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'X-axis field' })
  @IsOptional()
  @IsString()
  xAxis?: string;

  @ApiPropertyOptional({ description: 'Y-axis field' })
  @IsOptional()
  @IsString()
  yAxis?: string;

  @ApiPropertyOptional({ description: 'Chart colors', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];
}

export class CreateReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  type!: ReportType;

  @ApiPropertyOptional({ description: 'Report description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Report filters' })
  @ValidateNested()
  @Type(() => ReportFiltersDto)
  filters!: ReportFiltersDto;

  @ApiProperty({ description: 'Metrics to include in the report', type: [MetricConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricConfigDto)
  metrics!: MetricConfigDto[];

  @ApiPropertyOptional({ description: 'Chart configurations', type: [ChartConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChartConfigDto)
  charts?: ChartConfigDto[];

  @ApiPropertyOptional({ description: 'Schedule for automatic report generation' })
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Recipients for scheduled reports', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];
}

export class AnalyticsDataPointDto {
  @ApiProperty({ description: 'Data point label' })
  label!: string;

  @ApiProperty({ description: 'Data point value' })
  value!: number;

  @ApiPropertyOptional({ description: 'Data point timestamp' })
  timestamp?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class AnalyticsChartDto {
  @ApiProperty({ description: 'Chart configuration' })
  config!: ChartConfigDto;

  @ApiProperty({ description: 'Chart data points', type: [AnalyticsDataPointDto] })
  data!: AnalyticsDataPointDto[];

  @ApiPropertyOptional({ description: 'Chart summary statistics' })
  summary?: {
    total: number;
    average: number;
    min: number;
    max: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  };
}

export class AnalyticsReportDto {
  @ApiProperty({ description: 'Report ID' })
  id!: string;

  @ApiProperty({ description: 'Report name' })
  name!: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  type!: ReportType;

  @ApiPropertyOptional({ description: 'Report description' })
  description?: string;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt!: Date;

  @ApiProperty({ description: 'Report filters used' })
  filters!: ReportFiltersDto;

  @ApiProperty({ description: 'Report metrics' })
  metrics!: Record<string, number>;

  @ApiProperty({ description: 'Report charts', type: [AnalyticsChartDto] })
  charts!: AnalyticsChartDto[];

  @ApiPropertyOptional({ description: 'Report insights' })
  insights?: {
    key: string;
    message: string;
    type: 'positive' | 'negative' | 'neutral';
    priority: 'high' | 'medium' | 'low';
  }[];

  @ApiPropertyOptional({ description: 'Export URLs' })
  exports?: {
    pdf?: string;
    excel?: string;
    csv?: string;
  };
}