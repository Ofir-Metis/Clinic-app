import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsObject, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AlertSeverity, AlertType } from '../entities/performance-alert.entity';

export class CreatePerformanceAlertDto {
  @ApiProperty({ description: 'Service name for the alert' })
  @IsString()
  serviceName: string;

  @ApiProperty({ description: 'Type of alert', enum: AlertType })
  @IsEnum(AlertType)
  alertType: AlertType;

  @ApiProperty({ description: 'Alert severity', enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ description: 'Alert message' })
  @IsString()
  message: string;

  @ApiProperty({ required: false, description: 'Detailed description of the alert' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Threshold value that triggered the alert' })
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @ApiProperty({ required: false, description: 'Actual metric value' })
  @IsOptional()
  @IsNumber()
  actualValue?: number;

  @ApiProperty({ required: false, description: 'Metric name that triggered the alert' })
  @IsOptional()
  @IsString()
  metricName?: string;

  @ApiProperty({ required: false, description: 'Tags associated with the alert' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, description: 'Source of the alert' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false, description: 'Environment where alert occurred' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiProperty({ required: false, description: 'Region where alert occurred' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ required: false, description: 'Kubernetes cluster name' })
  @IsOptional()
  @IsString()
  cluster?: string;

  @ApiProperty({ required: false, description: 'Kubernetes namespace' })
  @IsOptional()
  @IsString()
  namespace?: string;

  @ApiProperty({ required: false, description: 'Pod name' })
  @IsOptional()
  @IsString()
  podName?: string;

  @ApiProperty({ required: false, description: 'Node name' })
  @IsOptional()
  @IsString()
  nodeName?: string;

  @ApiProperty({ required: false, description: 'Container ID' })
  @IsOptional()
  @IsString()
  containerId?: string;

  @ApiProperty({ required: false, description: 'Image version' })
  @IsOptional()
  @IsString()
  imageVersion?: string;

  @ApiProperty({ required: false, description: 'Related alert IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedAlerts?: string[];

  @ApiProperty({ required: false, description: 'Runbook URL for troubleshooting' })
  @IsOptional()
  @IsString()
  runbookUrl?: string;

  @ApiProperty({ required: false, description: 'Dashboard URL for monitoring' })
  @IsOptional()
  @IsString()
  dashboardUrl?: string;

  @ApiProperty({ required: false, description: 'Notification channels to alert' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationChannels?: string[];

  @ApiProperty({ required: false, description: 'Enable suppression for this alert' })
  @IsOptional()
  @IsBoolean()
  suppressionEnabled?: boolean;

  @ApiProperty({ required: false, description: 'Suppression start time' })
  @IsOptional()
  suppressionStart?: Date;

  @ApiProperty({ required: false, description: 'Suppression end time' })
  @IsOptional()
  suppressionEnd?: Date;

  @ApiProperty({ required: false, description: 'Reason for suppression' })
  @IsOptional()
  @IsString()
  suppressionReason?: string;

  @ApiProperty({ required: false, description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ required: false, description: 'Custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: any;
}