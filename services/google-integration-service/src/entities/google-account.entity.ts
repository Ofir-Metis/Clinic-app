/**
 * GoogleAccount Entity - Store Google OAuth2 tokens and sync settings
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type SyncStatus = 'active' | 'inactive' | 'error' | 'expired';

@Entity('google_accounts')
@Index(['userId'])
@Index(['googleUserId'], { unique: true })
@Index(['email'])
export class GoogleAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ name: 'google_user_id', length: 255, unique: true })
  googleUserId!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ name: 'display_name', length: 255, nullable: true })
  displayName?: string;

  @Column({ name: 'profile_picture', length: 500, nullable: true })
  profilePicture?: string;

  // Encrypted token storage
  @Column({ name: 'access_token', type: 'text' })
  accessToken!: string;

  @Column({ name: 'refresh_token', type: 'text' })
  refreshToken!: string;

  @Column({ name: 'token_expires_at', type: 'timestamp' })
  tokenExpiresAt!: Date;

  @Column({ name: 'token_scope', type: 'text' })
  tokenScope!: string; // Space-separated list of granted scopes

  // Sync settings
  @Column({ name: 'calendar_sync_enabled', type: 'boolean', default: true })
  calendarSyncEnabled!: boolean;

  @Column({ name: 'gmail_sync_enabled', type: 'boolean', default: true })
  gmailSyncEnabled!: boolean;

  @Column({ name: 'calendar_id', length: 255, nullable: true })
  calendarId?: string; // Primary calendar ID

  // Sync status tracking
  @Column({ name: 'last_calendar_sync', type: 'timestamp', nullable: true })
  lastCalendarSync?: Date;

  @Column({ name: 'last_gmail_sync', type: 'timestamp', nullable: true })
  lastGmailSync?: Date;

  @Column({
    name: 'sync_status',
    type: 'enum',
    enum: ['active', 'inactive', 'error', 'expired'],
    default: 'active'
  })
  syncStatus!: SyncStatus;

  @Column({ name: 'sync_error', type: 'text', nullable: true })
  syncError?: string;

  // Webhook management
  @Column({ name: 'calendar_channel_id', length: 255, nullable: true })
  calendarChannelId?: string;

  @Column({ name: 'calendar_resource_id', length: 255, nullable: true })
  calendarResourceId?: string;

  @Column({ name: 'webhook_expires_at', type: 'timestamp', nullable: true })
  webhookExpiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Virtual properties
  get isTokenExpired(): boolean {
    return new Date() >= this.tokenExpiresAt;
  }

  get needsTokenRefresh(): boolean {
    // Refresh token 5 minutes before expiry
    const refreshThreshold = new Date(this.tokenExpiresAt.getTime() - 5 * 60 * 1000);
    return new Date() >= refreshThreshold;
  }

  get isWebhookExpired(): boolean {
    if (!this.webhookExpiresAt) return true;
    return new Date() >= this.webhookExpiresAt;
  }

  get hasCalendarScope(): boolean {
    return this.tokenScope.includes('https://www.googleapis.com/auth/calendar');
  }

  get hasGmailScope(): boolean {
    return this.tokenScope.includes('https://www.googleapis.com/auth/gmail.send');
  }

  get syncStatusDisplay(): string {
    switch (this.syncStatus) {
      case 'active': return 'Connected & Syncing';
      case 'inactive': return 'Connected (Sync Disabled)';
      case 'error': return 'Connection Error';
      case 'expired': return 'Authorization Expired';
      default: return 'Unknown Status';
    }
  }
}