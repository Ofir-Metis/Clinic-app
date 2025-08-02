/**
 * RelationshipPermission Entity - Granular permissions for coach-client relationships
 * Controls what data coaches can access and what actions they can perform
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { ClientCoachRelationship } from './client-coach-relationship.entity';

export enum PermissionType {
  // Data Access Permissions
  VIEW_PROFILE = 'view_profile',
  VIEW_GOALS = 'view_goals',
  VIEW_PROGRESS = 'view_progress',
  VIEW_SESSION_HISTORY = 'view_session_history',
  VIEW_ACHIEVEMENTS = 'view_achievements',
  VIEW_ASSESSMENTS = 'view_assessments',
  VIEW_OTHER_COACHES_NOTES = 'view_other_coaches_notes',
  
  // Data Modification Permissions
  CREATE_GOALS = 'create_goals',
  MODIFY_GOALS = 'modify_goals',
  DELETE_GOALS = 'delete_goals',
  CREATE_SESSION_NOTES = 'create_session_notes',
  MODIFY_SESSION_NOTES = 'modify_session_notes',
  CREATE_ASSESSMENTS = 'create_assessments',
  MODIFY_CLIENT_PROFILE = 'modify_client_profile',
  
  // Communication Permissions
  SEND_MESSAGES = 'send_messages',
  SCHEDULE_SESSIONS = 'schedule_sessions',
  RESCHEDULE_SESSIONS = 'reschedule_sessions',
  CANCEL_SESSIONS = 'cancel_sessions',
  SEND_REMINDERS = 'send_reminders',
  EMERGENCY_CONTACT = 'emergency_contact',
  
  // Collaboration Permissions
  COLLABORATE_WITH_OTHER_COACHES = 'collaborate_with_other_coaches',
  SHARE_SESSION_NOTES = 'share_session_notes',
  VIEW_SHARED_NOTES = 'view_shared_notes',
  PARTICIPATE_IN_CASE_DISCUSSIONS = 'participate_in_case_discussions',
  
  // Administrative Permissions
  MANAGE_RELATIONSHIP = 'manage_relationship',
  TERMINATE_RELATIONSHIP = 'terminate_relationship',
  EXPORT_CLIENT_DATA = 'export_client_data',
  INVITE_OTHER_COACHES = 'invite_other_coaches'
}

export enum PermissionScope {
  FULL = 'full',           // Full access to all data/actions
  LIMITED = 'limited',     // Access only to own data/sessions
  READ_ONLY = 'read_only', // View-only access
  NONE = 'none'           // No access
}

@Entity('relationship_permissions')
@Index(['relationshipId', 'permissionType'], { unique: true })
@Index(['relationshipId'])
export class RelationshipPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'relationship_id', type: 'uuid' })
  relationshipId: string;

  @Column({
    type: 'enum',
    enum: PermissionType,
    name: 'permission_type'
  })
  permissionType: PermissionType;

  @Column({
    type: 'enum',
    enum: PermissionScope,
    default: PermissionScope.LIMITED
  })
  scope: PermissionScope;

  @Column({ type: 'boolean', default: true })
  granted: boolean;

  // Conditional permissions based on time, client consent, etc.
  @Column('jsonb', { nullable: true })
  conditions: {
    requiresClientConsent?: boolean;
    clientConsentObtained?: boolean;
    consentDate?: Date;
    timeRestricted?: boolean;
    validFrom?: Date;
    validUntil?: Date;
    sessionRestricted?: boolean; // Only during active sessions
    emergencyOnly?: boolean;
    approvalRequired?: boolean; // Requires approval from primary coach
    autoExpires?: boolean;
    expirationDate?: Date;
  };

  // Data filtering and restrictions
  @Column('jsonb', { nullable: true })
  restrictions: {
    dataTypes?: string[]; // Which types of data can be accessed
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    excludeFields?: string[]; // Specific fields to exclude
    includeFields?: string[]; // Only these fields can be accessed
    maxRecords?: number; // Limit number of records
    categories?: string[]; // Limit to specific categories
  };

  // Permission metadata
  @Column({ name: 'granted_by', type: 'uuid', nullable: true })
  grantedBy: string; // Who granted this permission (client or primary coach)

  @Column({ type: 'timestamp', nullable: true, name: 'granted_date' })
  grantedDate: Date;

  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedBy: string; // Who revoked this permission

  @Column({ type: 'timestamp', nullable: true, name: 'revoked_date' })
  revokedDate: Date;

  @Column('text', { nullable: true, name: 'revocation_reason' })
  revocationReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used' })
  lastUsed: Date; // When this permission was last used

  @Column({ type: 'integer', default: 0, name: 'usage_count' })
  usageCount: number; // How many times this permission has been used

  // Audit trail
  @Column('text', { nullable: true })
  notes: string; // Administrative notes about this permission

  @Column('jsonb', { nullable: true, name: 'audit_log' })
  auditLog: Array<{
    action: 'granted' | 'revoked' | 'modified' | 'used';
    performedBy: string;
    performedAt: Date;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }>;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => ClientCoachRelationship, (relationship) => relationship.permissions, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'relationship_id' })
  relationship: ClientCoachRelationship;

  // Helper methods
  isActive(): boolean {
    if (!this.granted) return false;
    
    const now = new Date();
    
    // Check time restrictions
    if (this.conditions?.timeRestricted) {
      if (this.conditions.validFrom && now < this.conditions.validFrom) return false;
      if (this.conditions.validUntil && now > this.conditions.validUntil) return false;
    }
    
    // Check auto-expiration
    if (this.conditions?.autoExpires && this.conditions.expirationDate && now > this.conditions.expirationDate) {
      return false;
    }
    
    return true;
  }

  requiresConsent(): boolean {
    return this.conditions?.requiresClientConsent === true;
  }

  hasValidConsent(): boolean {
    if (!this.requiresConsent()) return true;
    return this.conditions?.clientConsentObtained === true && !!this.conditions?.consentDate;
  }

  canUse(): boolean {
    return this.isActive() && this.hasValidConsent();
  }

  isEmergencyOnly(): boolean {
    return this.conditions?.emergencyOnly === true;
  }

  requiresApproval(): boolean {
    return this.conditions?.approvalRequired === true;
  }

  isTimeRestricted(): boolean {
    return this.conditions?.timeRestricted === true;
  }

  isSessionRestricted(): boolean {
    return this.conditions?.sessionRestricted === true;
  }

  recordUsage(userId: string, details?: Record<string, any>): void {
    this.lastUsed = new Date();
    this.usageCount++;
    
    // Add to audit log
    if (!this.auditLog) this.auditLog = [];
    this.auditLog.push({
      action: 'used',
      performedBy: userId,
      performedAt: new Date(),
      details
    });
  }

  revoke(revokedBy: string, reason?: string): void {
    this.granted = false;
    this.revokedBy = revokedBy;
    this.revokedDate = new Date();
    this.revocationReason = reason;
    
    // Add to audit log
    if (!this.auditLog) this.auditLog = [];
    this.auditLog.push({
      action: 'revoked',
      performedBy: revokedBy,
      performedAt: new Date(),
      details: { reason }
    });
  }

  grant(grantedBy: string, conditions?: any): void {
    this.granted = true;
    this.grantedBy = grantedBy;
    this.grantedDate = new Date();
    this.revokedBy = null;
    this.revokedDate = null;
    this.revocationReason = null;
    
    if (conditions) {
      this.conditions = { ...this.conditions, ...conditions };
    }
    
    // Add to audit log
    if (!this.auditLog) this.auditLog = [];
    this.auditLog.push({
      action: 'granted',
      performedBy: grantedBy,
      performedAt: new Date(),
      details: { conditions }
    });
  }

  getEffectiveScope(): PermissionScope {
    if (!this.canUse()) return PermissionScope.NONE;
    return this.scope;
  }

  isExpiringSoon(daysThreshold: number = 7): boolean {
    if (!this.conditions?.autoExpires || !this.conditions.expirationDate) return false;
    
    const now = new Date();
    const threshold = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));
    
    return this.conditions.expirationDate <= threshold;
  }
}