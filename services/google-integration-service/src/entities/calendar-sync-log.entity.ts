/**
 * CalendarSyncLog Entity - Track calendar synchronization events
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { GoogleAccount } from './google-account.entity';

export type SyncDirection = 'to_google' | 'from_google' | 'bidirectional';
export type SyncResult = 'success' | 'failed' | 'conflict' | 'skipped';

@Entity('calendar_sync_log')
@Index(['googleAccountId'])
@Index(['appointmentId'])
@Index(['googleEventId'])
@Index(['syncDirection', 'syncResult'])
@Index(['syncedAt'])
export class CalendarSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'google_account_id', type: 'uuid' })
  googleAccountId!: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId?: string;

  @Column({ name: 'google_event_id', length: 255, nullable: true })
  googleEventId?: string;

  @Column({
    name: 'sync_direction',
    type: 'enum',
    enum: ['to_google', 'from_google', 'bidirectional']
  })
  syncDirection!: SyncDirection;

  @Column({
    name: 'sync_result',
    type: 'enum',
    enum: ['success', 'failed', 'conflict', 'skipped']
  })
  syncResult!: SyncResult;

  @Column({ name: 'sync_type', length: 50 })
  syncType!: string; // 'create', 'update', 'delete', 'import'

  // Event details for tracking changes
  @Column({ name: 'event_title', length: 500, nullable: true })
  eventTitle?: string;

  @Column({ name: 'event_start', type: 'timestamp', nullable: true })
  eventStart?: Date;

  @Column({ name: 'event_end', type: 'timestamp', nullable: true })
  eventEnd?: Date;

  @Column({ name: 'attendee_count', type: 'int', nullable: true })
  attendeeCount?: number;

  // Conflict resolution
  @Column({ name: 'conflict_reason', type: 'text', nullable: true })
  conflictReason?: string;

  @Column({ name: 'conflict_resolved', type: 'boolean', default: false })
  conflictResolved!: boolean;

  @Column({ name: 'resolution_action', length: 100, nullable: true })
  resolutionAction?: string; // 'keep_local', 'keep_google', 'merge', 'manual'

  // Error tracking
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'error_code', length: 50, nullable: true })
  errorCode?: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt?: Date;

  // Metadata
  @Column({ name: 'sync_metadata', type: 'jsonb', nullable: true })
  syncMetadata?: Record<string, any>;

  @CreateDateColumn({ name: 'synced_at' })
  syncedAt!: Date;

  // Relationships
  @ManyToOne(() => GoogleAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'google_account_id' })
  googleAccount!: GoogleAccount;

  // Virtual properties
  get isConflict(): boolean {
    return this.syncResult === 'conflict';
  }

  get requiresRetry(): boolean {
    return this.syncResult === 'failed' && 
           this.retryCount < 3 && 
           (!this.nextRetryAt || new Date() >= this.nextRetryAt);
  }

  get syncStatusDisplay(): string {
    switch (this.syncResult) {
      case 'success': return '✅ Synced Successfully';
      case 'failed': return '❌ Sync Failed';
      case 'conflict': return '⚠️ Conflict Detected';
      case 'skipped': return '⏭️ Skipped';
      default: return '❓ Unknown';
    }
  }

  get directionDisplay(): string {
    switch (this.syncDirection) {
      case 'to_google': return '→ To Google';
      case 'from_google': return '← From Google';
      case 'bidirectional': return '↔️ Bidirectional';
      default: return '❓ Unknown';
    }
  }
}