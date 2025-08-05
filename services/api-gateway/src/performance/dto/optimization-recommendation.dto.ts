import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsObject, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum OptimizationType {
  DATABASE = 'database',
  CACHE = 'cache',
  MEMORY = 'memory',
  CPU = 'cpu',
  NETWORK = 'network',
  DISK = 'disk',
  APPLICATION = 'application',
  INFRASTRUCTURE = 'infrastructure',
}

export enum OptimizationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum OptimizationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class OptimizationImpactDto {
  @ApiProperty({ description: 'Expected performance improvement percentage' })
  @IsNumber()
  performanceImprovement: number;

  @ApiProperty({ description: 'Expected cost reduction percentage' })
  @IsOptional()
  @IsNumber()
  costReduction?: number;

  @ApiProperty({ description: 'Expected resource savings percentage' })
  @IsOptional()
  @IsNumber()
  resourceSavings?: number;

  @ApiProperty({ description: 'Risk level of applying this optimization' })
  @IsEnum(['low', 'medium', 'high'])
  riskLevel: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Estimated implementation effort in hours' })
  @IsNumber()
  effortHours: number;

  @ApiProperty({ description: 'Rollback complexity' })
  @IsEnum(['easy', 'medium', 'difficult'])
  rollbackComplexity: 'easy' | 'medium' | 'difficult';
}

export class OptimizationParametersDto {
  @ApiProperty({ required: false, description: 'Database connection pool size' })
  @IsOptional()
  @IsNumber()
  connectionPoolSize?: number;

  @ApiProperty({ required: false, description: 'Cache TTL in seconds' })
  @IsOptional()
  @IsNumber()
  cacheTtl?: number;

  @ApiProperty({ required: false, description: 'Memory limit in MB' })
  @IsOptional()
  @IsNumber()
  memoryLimit?: number;

  @ApiProperty({ required: false, description: 'CPU limit in millicores' })
  @IsOptional()
  @IsNumber()
  cpuLimit?: number;

  @ApiProperty({ required: false, description: 'Replica count for scaling' })
  @IsOptional()
  @IsNumber()
  replicaCount?: number;

  @ApiProperty({ required: false, description: 'Buffer sizes' })
  @IsOptional()
  @IsObject()
  bufferSizes?: Record<string, number>;

  @ApiProperty({ required: false, description: 'Timeout configurations' })
  @IsOptional()
  @IsObject()
  timeouts?: Record<string, number>;

  @ApiProperty({ required: false, description: 'Additional custom parameters' })
  @IsOptional()
  @IsObject()
  customParameters?: Record<string, any>;
}

export class OptimizationPrerequisiteDto {
  @ApiProperty({ description: 'Prerequisite description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Whether prerequisite is met' })
  @IsBoolean()
  isMet: boolean;

  @ApiProperty({ required: false, description: 'How to fulfill this prerequisite' })
  @IsOptional()
  @IsString()
  fulfillmentInstructions?: string;
}

export class OptimizationValidationDto {
  @ApiProperty({ description: 'Validation check description' })
  @IsString()
  check: string;

  @ApiProperty({ description: 'Expected result of the validation' })
  @IsString()
  expectedResult: string;

  @ApiProperty({ description: 'Validation command or query' })
  @IsString()
  validationCommand: string;

  @ApiProperty({ description: 'Threshold for validation success' })
  @IsOptional()
  @IsNumber()
  threshold?: number;
}

export class OptimizationRecommendationDto {
  @ApiProperty({ description: 'Unique identifier for the recommendation' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Service name this recommendation applies to' })
  @IsString()
  serviceName: string;

  @ApiProperty({ description: 'Type of optimization', enum: OptimizationType })
  @IsEnum(OptimizationType)
  type: OptimizationType;

  @ApiProperty({ description: 'Priority level', enum: OptimizationPriority })
  @IsEnum(OptimizationPriority)
  priority: OptimizationPriority;

  @ApiProperty({ description: 'Recommendation title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description of the recommendation' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Current performance issue or bottleneck' })
  @IsString()
  currentIssue: string;

  @ApiProperty({ description: 'Proposed solution' })
  @IsString()
  proposedSolution: string;

  @ApiProperty({ description: 'Impact analysis', type: OptimizationImpactDto })
  @ValidateNested()
  @Type(() => OptimizationImpactDto)
  impact: OptimizationImpactDto;

  @ApiProperty({ description: 'Implementation parameters', type: OptimizationParametersDto })
  @ValidateNested()
  @Type(() => OptimizationParametersDto)
  parameters: OptimizationParametersDto;

  @ApiProperty({ description: 'Prerequisites for implementation', type: [OptimizationPrerequisiteDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptimizationPrerequisiteDto)
  prerequisites: OptimizationPrerequisiteDto[];

  @ApiProperty({ description: 'Implementation steps' })
  @IsArray()
  @IsString({ each: true })
  implementationSteps: string[];

  @ApiProperty({ description: 'Rollback steps' })
  @IsArray()
  @IsString({ each: true })
  rollbackSteps: string[];

  @ApiProperty({ description: 'Validation checks', type: [OptimizationValidationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptimizationValidationDto)
  validationChecks: OptimizationValidationDto[];

  @ApiProperty({ description: 'Current status', enum: OptimizationStatus })
  @IsEnum(OptimizationStatus)
  status: OptimizationStatus;

  @ApiProperty({ required: false, description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, description: 'Related recommendations' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedRecommendations?: string[];

  @ApiProperty({ required: false, description: 'Documentation links' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentationLinks?: string[];

  @ApiProperty({ required: false, description: 'Auto-apply flag' })
  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;

  @ApiProperty({ required: false, description: 'Monitoring metrics to track after implementation' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  monitoringMetrics?: string[];

  @ApiProperty({ required: false, description: 'Success criteria' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  successCriteria?: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ required: false, description: 'Last updated timestamp' })
  @IsOptional()
  updatedAt?: Date;

  @ApiProperty({ required: false, description: 'User who created the recommendation' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({ required: false, description: 'User who last updated the recommendation' })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiProperty({ required: false, description: 'Implementation timestamp' })
  @IsOptional()
  implementedAt?: Date;

  @ApiProperty({ required: false, description: 'User who implemented the recommendation' })
  @IsOptional()
  @IsString()
  implementedBy?: string;

  @ApiProperty({ required: false, description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}