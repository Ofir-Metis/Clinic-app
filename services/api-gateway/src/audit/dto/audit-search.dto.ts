import { IsOptional, IsEnum, IsString, IsDateString, IsNumber, IsUUID, IsIP, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AuditEventType, AuditCategory, AuditSeverity, RiskLevel } from '../enums/audit.enums';

export class AuditSearchDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  userRole?: string;

  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @IsOptional()
  @IsEnum(AuditCategory)
  category?: AuditCategory;

  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  httpMethod?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  requiresAlert?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  reviewed?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  suspiciousActivity?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  dataExported?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeInComplianceReport?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  searchTerm?: string;

  // Additional filters for advanced searching
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minResponseTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxResponseTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRecordsAffected?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxRecordsAffected?: number;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  clientApplication?: string;

  @IsOptional()
  @IsString()
  geolocation?: string;

  // Time-based filters
  @IsOptional()
  @IsString()
  timeRange?: 'last_hour' | 'last_24_hours' | 'last_week' | 'last_month' | 'last_year' | 'custom';

  // HIPAA-specific filters
  @IsOptional()
  @IsString()
  accessPurpose?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  minimumNecessary?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  patientConsent?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  emergencyAccess?: boolean;

  // Export options
  @IsOptional()
  @IsEnum(['json', 'csv', 'pdf'])
  exportFormat?: 'json' | 'csv' | 'pdf';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeAdditionalData?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  anonymizePatientData?: boolean;
}