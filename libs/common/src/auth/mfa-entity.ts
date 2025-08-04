import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * MFA Secrets Entity - Stores encrypted MFA secrets and backup codes
 * 
 * This entity represents the database table for storing Multi-Factor Authentication
 * secrets, backup codes, and related metadata with healthcare compliance features.
 */
@Entity('mfa_secrets')
@Index(['userId'], { unique: true })
export class MFASecretEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @Column({ type: 'text', nullable: false })
  encryptedSecret: string; // AES-256-CBC encrypted TOTP secret

  @Column({ type: 'json', nullable: false })
  encryptedBackupCodes: string[]; // Array of hashed backup codes

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastBackupCodeUsedAt?: Date;

  @Column({ type: 'text', nullable: true })
  encryptedRecoveryCode?: string; // Emergency recovery code (encrypted)

  @Column({ type: 'timestamp', nullable: true })
  recoveryCodeExpiresAt?: Date;

  @Column({ type: 'int', default: 10 })
  backupCodesRemaining: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceInfo?: string; // Info about the device used for setup

  @Column({ type: 'inet', nullable: true })
  setupIpAddress?: string;

  @Column({ type: 'text', nullable: true })
  setupUserAgent?: string;

  // HIPAA Compliance Fields
  @Column({ type: 'boolean', default: true })
  hipaaCompliant: boolean;

  @Column({ type: 'varchar', length: 50, default: 'phi' })
  dataClassification: string; // 'phi', 'pii', 'public'

  @Column({ type: 'timestamp', nullable: true })
  lastAuditedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  auditTrailId?: string; // Reference to audit trail
}

/**
 * MFA User Settings Entity - Stores user-specific MFA preferences and policies
 */
@Entity('mfa_user_settings')
@Index(['userId'], { unique: true })
export class MFAUserSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @Column({ type: 'boolean', default: false })
  isMFAEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  isMFARequired: boolean; // Based on role/policy

  @Column({ type: 'boolean', default: false })
  hasVerifiedMFA: boolean;

  @Column({ type: 'int', default: 0 })
  backupCodesRemaining: number;

  @Column({ type: 'timestamp', nullable: true })
  lastMFAUsed?: Date;

  @Column({ type: 'boolean', default: true })
  mfaEnforcedByPolicy: boolean; // Organizational policy enforcement

  @Column({ type: 'json', nullable: true })
  roleBasedRequirements?: {
    alwaysRequired: boolean;
    maxSessionDuration: number;
    requiredForOperations: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Policy Override Fields (for emergency situations)
  @Column({ type: 'boolean', default: false })
  policyOverrideActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  policyOverrideExpiresAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  policyOverrideAuthorizedBy?: string; // Admin who authorized override

  @Column({ type: 'text', nullable: true })
  policyOverrideReason?: string;

  // Healthcare Specific Fields
  @Column({ type: 'boolean', default: true })
  phiAccessRequiresMFA: boolean;

  @Column({ type: 'int', default: 1800 }) // 30 minutes
  phiSessionTimeout: number;

  @Column({ type: 'boolean', default: true })
  auditAllMFAActivity: boolean;
}

/**
 * MFA Audit Log Entity - Tracks all MFA-related activities for compliance
 */
@Entity('mfa_audit_logs')
@Index(['userId', 'timestamp'])
@Index(['action', 'timestamp'])
@Index(['hipaaRelevant', 'timestamp'])
export class MFAAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  action: string; // 'setup', 'verify', 'backup_code_used', 'disabled', etc.

  @Column({ type: 'varchar', length: 50, nullable: false })
  result: string; // 'success', 'failure', 'blocked'

  @Column({ type: 'timestamp', nullable: false })
  @Index()
  timestamp: Date;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    method?: 'totp' | 'backup_code' | 'recovery_code';
    deviceInfo?: string;
    backupCodesRemaining?: number;
    failureReason?: string;
    riskLevel?: string;
  };

  // HIPAA Compliance Fields
  @Column({ type: 'boolean', default: true })
  hipaaRelevant: boolean;

  @Column({ type: 'boolean', default: true })
  auditRequired: boolean;

  @Column({ type: 'varchar', length: 50, default: 'medium' })
  riskLevel: string; // 'low', 'medium', 'high', 'critical'

  @Column({ type: 'varchar', length: 100, nullable: true })
  correlationId?: string; // For tracking related events

  @Column({ type: 'uuid', nullable: true })
  relatedPatientId?: string; // If action was related to patient data access

  @Column({ type: 'varchar', length: 200, nullable: true })
  resourceAccessed?: string; // What resource was accessed with MFA

  // Retention and Archival
  @Column({ type: 'timestamp', nullable: true })
  retentionExpiresAt?: Date; // For automated cleanup (HIPAA: 7 years)

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;
}

/**
 * MFA Device Registry Entity - Tracks registered devices for enhanced security
 */
@Entity('mfa_device_registry')
@Index(['userId', 'deviceFingerprint'])
export class MFADeviceRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  deviceFingerprint: string; // Hash of device characteristics

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceName?: string; // User-friendly device name

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  operatingSystem?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  browser?: string;

  @Column({ type: 'boolean', default: true })
  isTrusted: boolean;

  @Column({ type: 'timestamp', nullable: false })
  firstSeenAt: Date;

  @Column({ type: 'timestamp', nullable: false })
  lastSeenAt: Date;

  @Column({ type: 'int', default: 1 })
  usageCount: number;

  @Column({ type: 'inet', nullable: true })
  lastKnownIp?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location?: string; // Approximate location

  // Risk Assessment
  @Column({ type: 'varchar', length: 20, default: 'low' })
  riskLevel: string; // 'low', 'medium', 'high'

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  blockedAt?: Date;

  @Column({ type: 'text', nullable: true })
  blockReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * MFA Policy Entity - Organizational MFA policies and requirements
 */
@Entity('mfa_policies')
export class MFAPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  policyName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: false })
  rules: {
    enforceForRoles: string[]; // Roles that must use MFA
    exemptRoles?: string[]; // Roles that can opt out
    maxSessionDuration: number; // Max time between MFA verifications
    requireForOperations: string[]; // Operations that always require MFA
    allowBackupCodes: boolean;
    maxBackupCodes: number;
    requireDeviceRegistration: boolean;
    allowedMFAMethods: ('totp' | 'backup_code' | 'recovery_code')[];
  };

  @Column({ type: 'json', nullable: true })
  healthcareSpecific?: {
    phiAccessRequirements: {
      maxSessionDuration: number;
      requireRecentVerification: boolean;
      auditAllAccess: boolean;
    };
    emergencyAccess: {
      allowEmergencyBypass: boolean;
      maxBypassDuration: number;
      requireManagerApproval: boolean;
    };
    complianceSettings: {
      hipaaCompliant: boolean;
      auditRetentionYears: number;
      encryptionRequired: boolean;
    };
  };

  @Column({ type: 'int', default: 0 })
  priority: number; // Higher priority policies override lower ones

  @Column({ type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  lastModifiedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  effectiveFrom?: Date;

  @Column({ type: 'timestamp', nullable: true })
  effectiveUntil?: Date;
}

/**
 * MFA Statistics Entity - Aggregate MFA usage statistics for monitoring
 */
@Entity('mfa_statistics')
@Index(['date', 'type'])
export class MFAStatisticsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', nullable: false })
  @Index()
  date: Date;

  @Column({ type: 'varchar', length: 50, nullable: false })
  type: string; // 'daily', 'weekly', 'monthly'

  @Column({ type: 'json', nullable: false })
  statistics: {
    totalUsers: number;
    usersWithMFAEnabled: number;
    usersWithMFARequired: number;
    mfaAdoptionRate: number;
    totalMFAVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    backupCodeUsage: number;
    recoveryCodeUsage: number;
    newMFASetups: number;
    mfaDisablements: number;
    averageSessionDuration: number;
    uniqueDevices: number;
    suspiciousActivity: number;
    policyViolations: number;
  };

  @Column({ type: 'json', nullable: true })
  healthcareMetrics?: {
    phiAccessWithMFA: number;
    phiAccessWithoutMFA: number;
    averageMFAVerificationTime: number;
    emergencyAccessEvents: number;
    complianceViolations: number;
    auditTrailEvents: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Export all entities for TypeORM configuration
export const MFAEntities = [
  MFASecretEntity,
  MFAUserSettingsEntity,
  MFAAuditLogEntity,
  MFADeviceRegistryEntity,
  MFAPolicyEntity,
  MFAStatisticsEntity
];

// Type definitions for better TypeScript support
export type MFAAction = 
  | 'setup_initiated'
  | 'setup_completed'
  | 'setup_failed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'mfa_verified'
  | 'mfa_verification_failed'
  | 'backup_code_used'
  | 'backup_codes_regenerated'
  | 'recovery_code_generated'
  | 'recovery_code_used'
  | 'device_registered'
  | 'device_blocked'
  | 'policy_violation'
  | 'emergency_access'
  | 'audit_access';

export type MFAResult = 'success' | 'failure' | 'blocked' | 'expired' | 'invalid';

export type MFAMethod = 'totp' | 'backup_code' | 'recovery_code';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'phi' | 'pii';