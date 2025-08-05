import { PartialType } from '@nestjs/swagger';
import { CreatePerformanceAlertDto } from './create-performance-alert.dto';
import { IsOptional, IsString, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AlertStatus } from '../entities/performance-alert.entity';

export class UpdatePerformanceAlertDto extends PartialType(CreatePerformanceAlertDto) {
  @ApiProperty({ required: false, description: 'Alert status', enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiProperty({ required: false, description: 'Mark alert as resolved' })
  @IsOptional()
  @IsBoolean()
  resolved?: boolean;

  @ApiProperty({ required: false, description: 'Resolution timestamp' })
  @IsOptional()
  resolvedAt?: Date;

  @ApiProperty({ required: false, description: 'User who resolved the alert' })
  @IsOptional()
  @IsString()
  resolvedBy?: string;

  @ApiProperty({ required: false, description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiProperty({ required: false, description: 'Mark alert as acknowledged' })
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;

  @ApiProperty({ required: false, description: 'Acknowledgment timestamp' })
  @IsOptional()
  acknowledgedAt?: Date;

  @ApiProperty({ required: false, description: 'User who acknowledged the alert' })
  @IsOptional()
  @IsString()
  acknowledgedBy?: string;

  @ApiProperty({ required: false, description: 'Root cause of the issue' })
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiProperty({ required: false, description: 'Prevention measures taken' })
  @IsOptional()
  @IsString()
  preventionMeasures?: string;

  @ApiProperty({ required: false, description: 'Actions taken to resolve the issue' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actionsTaken?: string[];

  @ApiProperty({ required: false, description: 'Mark alert as escalated' })
  @IsOptional()
  @IsBoolean()
  escalated?: boolean;

  @ApiProperty({ required: false, description: 'Escalation timestamp' })
  @IsOptional()
  escalatedAt?: Date;

  @ApiProperty({ required: false, description: 'Escalation level' })
  @IsOptional()
  @IsString()
  escalationLevel?: string;

  @ApiProperty({ required: false, description: 'Mark alert as archived' })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @ApiProperty({ required: false, description: 'Archive timestamp' })
  @IsOptional()
  archivedAt?: Date;

  @ApiProperty({ required: false, description: 'User who archived the alert' })
  @IsOptional()
  @IsString()
  archivedBy?: string;
}