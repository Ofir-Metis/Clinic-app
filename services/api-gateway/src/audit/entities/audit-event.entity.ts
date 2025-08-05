import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditEventType, AuditCategory, AuditSeverity } from '../enums/audit.enums';

@Entity('audit_events')
@Index(['timestamp', 'userId'])
@Index(['timestamp', 'patientId'])
@Index(['category', 'severity'])
@Index(['eventType', 'timestamp'])
@Index(['ipAddress', 'timestamp'])
export class AuditEvent {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({
    type: 'enum',
    enum: AuditEventType,
    comment: 'Type of audit event that occurred',
  })
  eventType: AuditEventType;

  @Column({
    type: 'enum',
    enum: AuditCategory,
    comment: 'Category classification of the audit event',
  })
  category: AuditCategory;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    comment: 'Severity level of the audit event',
  })
  severity: AuditSeverity;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID of the user who performed the action',
  })
  @Index()
  userId: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Role of the user who performed the action',
  })
  userRole: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID of the patient whose data was accessed (HIPAA)',
  })
  @Index()
  patientId: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID of the target user (for admin actions)',
  })
  targetUserId: string;

  @Column({
    type: 'text',
    comment: 'Human-readable description of the event',
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'IP address from which the action was performed',
  })
  @Index()
  ipAddress: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'User agent string from the client',
  })
  userAgent: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Session ID associated with the action',
  })
  sessionId: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Type of resource that was accessed or modified',
  })
  resourceType: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID of the specific resource that was accessed',
  })
  resourceId: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'API endpoint that was called',
  })
  endpoint: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'HTTP method used (GET, POST, PUT, DELETE)',
  })
  httpMethod: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'HTTP response status code',
  })
  responseStatus: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Response time in milliseconds',
  })
  responseTime: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Additional structured data related to the event',
  })
  additionalData: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Geographic location derived from IP address',
  })
  geolocation: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Device type (mobile, desktop, tablet)',
  })
  deviceType: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Browser or application name',
  })
  clientApplication: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this event requires immediate attention',
  })
  requiresAlert: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this event has been reviewed by an administrator',
  })
  reviewed: boolean;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID of the administrator who reviewed this event',
  })
  reviewedBy: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When this event was reviewed',
  })
  reviewedAt: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notes from the administrator review',
  })
  reviewNotes: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Compliance framework this event relates to (HIPAA, SOX, etc.)',
  })
  complianceFramework: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Risk level assessment (LOW, MEDIUM, HIGH, CRITICAL)',
  })
  riskLevel: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether data was exported or downloaded',
  })
  dataExported: boolean;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Number of records affected by this action',
  })
  recordsAffected: number;

  @CreateDateColumn({
    type: 'timestamp',
    comment: 'When the audit event occurred',
  })
  @Index()
  timestamp: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'When this audit record was created',
  })
  @Index()
  createdAt: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Source system or service that generated this event',
  })
  sourceSystem: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Version of the audit schema used',
  })
  schemaVersion: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Hash of sensitive data for integrity verification',
  })
  dataHash: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this event is part of a suspicious pattern',
  })
  suspiciousActivity: boolean;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID linking related events together',
  })
  correlationId: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'HIPAA-specific metadata for compliance reporting',
  })
  hipaaMetadata: {
    accessPurpose?: string;
    minimumNecessary?: boolean;
    patientConsent?: boolean;
    emergencyAccess?: boolean;
    disclosureReason?: string;
    retentionPeriod?: number;
  };

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this event should be included in compliance reports',
  })
  includeInComplianceReport: boolean;
}