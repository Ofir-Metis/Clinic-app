/**
 * ClientCoachRelationship Entity - Core relationship between clients and coaches
 * Supports multiple coaches per client with role-based permissions and data sharing
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany
} from 'typeorm';
import { Client } from './client.entity';
import { Coach } from './coach.entity';
import { RelationshipPermission } from './relationship-permission.entity';
import { SharedGoal } from './shared-goal.entity';

export enum RelationshipStatus {
  PENDING = 'pending',           // Coach invitation sent, awaiting client acceptance
  ACTIVE = 'active',             // Active coaching relationship
  PAUSED = 'paused',             // Temporarily paused by either party
  COMPLETED = 'completed',       // Coaching program completed successfully
  TERMINATED = 'terminated'      // Relationship ended by either party
}

export enum RelationshipType {
  PRIMARY = 'primary',           // Main coach relationship
  SECONDARY = 'secondary',       // Additional specialist coach
  CONSULTATION = 'consultation', // One-time or short-term consultation
  MENTORSHIP = 'mentorship',     // Long-term mentorship relationship
  GROUP = 'group'                // Group coaching program
}

export enum DataAccessLevel {
  FULL = 'full',                 // Access to all client data and history
  LIMITED = 'limited',           // Access only to own sessions and shared goals
  VIEW_ONLY = 'view_only',       // Read-only access to shared information
  NONE = 'none'                  // No access (for terminated relationships)
}

@Entity('client_coach_relationships')
@Index(['clientId', 'coachId'], { unique: true })
@Index(['clientId', 'status'])
@Index(['coachId', 'status'])
export class ClientCoachRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'coach_id', type: 'uuid' })
  coachId: string;

  @Column({
    type: 'enum',
    enum: RelationshipStatus,
    default: RelationshipStatus.PENDING
  })
  status: RelationshipStatus;

  @Column({
    type: 'enum',
    enum: RelationshipType,
    default: RelationshipType.SECONDARY
  })
  relationshipType: RelationshipType;

  @Column({
    type: 'enum',
    enum: DataAccessLevel,
    default: DataAccessLevel.LIMITED,
    name: 'data_access_level'
  })
  dataAccessLevel: DataAccessLevel;

  // Coaching focus areas and specialization
  @Column('jsonb', { nullable: true, name: 'focus_areas' })
  focusAreas: string[]; // ['career', 'relationships', 'health', 'finance']

  @Column('text', { nullable: true })
  specialization: string; // Coach's area of expertise for this client

  // Relationship timeline
  @Column({ type: 'timestamp', nullable: true, name: 'relationship_started' })
  relationshipStarted: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'relationship_ended' })
  relationshipEnded: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_session_date' })
  lastSessionDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'next_session_date' })
  nextSessionDate: Date;

  // Coaching configuration
  @Column('jsonb', { nullable: true, name: 'coaching_preferences' })
  coachingPreferences: {
    sessionFrequency: 'weekly' | 'biweekly' | 'monthly' | 'as-needed';
    preferredDuration: number; // minutes
    preferredType: 'online' | 'in-person' | 'hybrid';
    communicationStyle: 'direct' | 'supportive' | 'collaborative' | 'challenging';
    reminderSettings: {
      emailReminders: boolean;
      smsReminders: boolean;
      hoursBeforeSession: number;
    };
    goals: {
      canViewAllGoals: boolean;
      canCreateGoals: boolean;
      canModifyGoals: boolean;
      requiresApproval: boolean;
    };
  };

  // Data sharing and privacy settings
  @Column('jsonb', { nullable: true, name: 'privacy_settings' })
  privacySettings: {
    shareProgressWithOtherCoaches: boolean;
    shareSessionNotesWithOtherCoaches: boolean;
    shareGoalsWithOtherCoaches: boolean;
    shareAchievementsWithOtherCoaches: boolean;
    allowCoachCollaboration: boolean;
    dataSharingConsent: boolean;
    consentDate: Date;
  };

  // Financial and program information
  @Column('jsonb', { nullable: true, name: 'program_details' })
  programDetails: {
    programName?: string;
    programDuration?: number; // weeks
    totalSessions?: number;
    completedSessions?: number;
    packageType?: 'individual' | 'package' | 'subscription' | 'group';
    cost?: number;
    currency?: string;
    paymentFrequency?: 'per-session' | 'monthly' | 'quarterly' | 'upfront';
  };

  // Invitation and approval metadata
  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy: string; // Coach or client who initiated the relationship

  @Column({ type: 'timestamp', nullable: true, name: 'invitation_sent_date' })
  invitationSentDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'invitation_accepted_date' })
  invitationAcceptedDate: Date;

  @Column('text', { nullable: true, name: 'invitation_message' })
  invitationMessage: string;

  @Column('text', { nullable: true, name: 'termination_reason' })
  terminationReason: string;

  @Column({ name: 'terminated_by', type: 'uuid', nullable: true })
  terminatedBy: string; // Who ended the relationship

  // Notes and communication
  @Column('text', { nullable: true })
  notes: string; // Private notes about the coaching relationship

  @Column('jsonb', { nullable: true, name: 'tags' })
  tags: string[]; // Organizational tags

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Client, (client) => client.coachRelationships, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Coach, (coach) => coach.clientRelationships, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'coach_id' })
  coach: Coach;

  @OneToMany(() => RelationshipPermission, (permission) => permission.relationship, {
    cascade: true
  })
  permissions: RelationshipPermission[];

  @OneToMany(() => SharedGoal, (goal) => goal.relationship, {
    cascade: true
  })
  sharedGoals: SharedGoal[];

  // Helper methods
  isActive(): boolean {
    return this.status === RelationshipStatus.ACTIVE;
  }

  canAccessData(): boolean {
    return this.dataAccessLevel !== DataAccessLevel.NONE && this.isActive();
  }

  hasFullAccess(): boolean {
    return this.dataAccessLevel === DataAccessLevel.FULL && this.isActive();
  }

  isPrimaryCoach(): boolean {
    return this.relationshipType === RelationshipType.PRIMARY;
  }

  getDurationInDays(): number {
    if (!this.relationshipStarted) return 0;
    const endDate = this.relationshipEnded || new Date();
    return Math.floor((endDate.getTime() - this.relationshipStarted.getTime()) / (1000 * 60 * 60 * 24));
  }

  getSessionCount(): number {
    return this.programDetails?.completedSessions || 0;
  }
}