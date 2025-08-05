import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsUUID, IsIP, IsDateString } from 'class-validator';
import { AuditEventType, AuditCategory, AuditSeverity, RiskLevel, ComplianceFramework, DeviceType } from '../enums/audit.enums';

export class CreateAuditEventDto {
  @IsEnum(AuditEventType)
  eventType: AuditEventType;

  @IsEnum(AuditCategory)
  category: AuditCategory;

  @IsEnum(AuditSeverity)
  severity: AuditSeverity;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  userRole?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  httpMethod?: string;

  @IsOptional()
  @IsNumber()
  responseStatus?: number;

  @IsOptional()
  @IsNumber()
  responseTime?: number;

  @IsOptional()
  @IsObject()
  additionalData?: Record<string, any>;

  @IsOptional()
  @IsString()
  geolocation?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  deviceType?: DeviceType;

  @IsOptional()
  @IsString()
  clientApplication?: string;

  @IsOptional()
  @IsBoolean()
  requiresAlert?: boolean;

  @IsOptional()
  @IsEnum(ComplianceFramework)
  complianceFramework?: ComplianceFramework;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsBoolean()
  dataExported?: boolean;

  @IsOptional()
  @IsNumber()
  recordsAffected?: number;

  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsObject()
  hipaaMetadata?: {
    accessPurpose?: string;
    minimumNecessary?: boolean;
    patientConsent?: boolean;
    emergencyAccess?: boolean;
    disclosureReason?: string;
    retentionPeriod?: number;
  };

  @IsOptional()
  @IsBoolean()
  includeInComplianceReport?: boolean;
}