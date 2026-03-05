import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Meeting types for appointments
 */
export type MeetingType = 'in-person' | 'online' | 'hybrid';

/**
 * Recording types based on meeting type
 */
export type RecordingType = 'none' | 'audio-only' | 'video' | 'screen-share' | 'full-session';

/**
 * Appointment status enum
 */
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';

/**
 * Recording quality settings
 */
export interface RecordingSettings {
  enabled: boolean;
  type: RecordingType;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  autoStart: boolean;
  includeTranscription: boolean;
  retentionDays: number;
  shareWithClient: boolean;
}

/**
 * Meeting configuration for different appointment types
 */
export interface MeetingConfig {
  type: MeetingType;
  location?: string;
  meetingUrl?: string;
  googleMeetEnabled: boolean;
  googleEventId?: string;
  meetingPassword?: string;
  waitingRoomEnabled: boolean;
  recordingSettings: RecordingSettings;
  allowClientToJoinEarly: boolean;
  meetingDuration: number; // in minutes
}

/**
 * Enhanced Appointment entity with comprehensive meeting and recording support
 */
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'therapist_id', type: 'uuid', nullable: true })
  therapistId?: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId?: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime!: Date;

  @Column({ 
    name: 'meeting_type',
    type: 'enum',
    enum: ['in-person', 'online', 'hybrid'],
    default: 'in-person'
  })
  meetingType!: MeetingType;

  @Column({ 
    name: 'status',
    type: 'enum',
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  })
  status!: AppointmentStatus;

  @Column({ name: 'title', type: 'varchar', length: 200 })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  // Meeting Configuration (stored as JSONB for flexibility)
  @Column({ 
    name: 'meeting_config',
    type: 'jsonb',
    default: {
      type: 'in-person',
      googleMeetEnabled: false,
      waitingRoomEnabled: true,
      recordingSettings: {
        enabled: false,
        type: 'none',
        quality: 'medium',
        autoStart: false,
        includeTranscription: false,
        retentionDays: 30,
        shareWithClient: false
      },
      allowClientToJoinEarly: false,
      meetingDuration: 60
    }
  })
  meetingConfig!: MeetingConfig;

  // Google Calendar Integration
  @Column({ name: 'google_event_id', type: 'varchar', nullable: true })
  googleEventId?: string;

  @Column({ name: 'google_account_id', type: 'uuid', nullable: true })
  googleAccountId?: string;

  @Column({ name: 'calendar_synced', type: 'boolean', default: false })
  calendarSynced!: boolean;

  @Column({ name: 'last_calendar_sync', type: 'timestamptz', nullable: true })
  lastCalendarSync?: Date;

  // Recording Management
  @Column({ name: 'recording_session_id', type: 'uuid', nullable: true })
  recordingSessionId?: string;

  @Column({ name: 'recording_status', type: 'varchar', nullable: true })
  recordingStatus?: 'not-started' | 'recording' | 'paused' | 'stopped' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'recording_files', type: 'jsonb', nullable: true })
  recordingFiles?: Array<{
    id: string;
    type: 'audio' | 'video' | 'screen';
    url: string;
    duration: number;
    size: number;
    createdAt: Date;
  }>;

  // Notifications and Reminders
  @Column({ name: 'reminder_sent', type: 'boolean', default: false })
  reminderSent!: boolean;

  @Column({ name: 'confirmation_sent', type: 'boolean', default: false })
  confirmationSent!: boolean;

  @Column({ name: 'reminder_times', type: 'jsonb', default: ['24h', '1h'] })
  reminderTimes!: string[];

  // Client Preferences
  @Column({ name: 'client_timezone', type: 'varchar', nullable: true })
  clientTimezone?: string;

  @Column({ name: 'client_preferences', type: 'jsonb', nullable: true })
  clientPreferences?: {
    preferredNotificationMethod: 'email' | 'sms' | 'both';
    allowRecording: boolean;
    requireConfirmation: boolean;
  };

  // Metadata
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ name: 'is_recurring', type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ name: 'recurring_pattern', type: 'jsonb', nullable: true })
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
    maxOccurrences?: number;
  };

  @Column({ name: 'parent_appointment_id', type: 'uuid', nullable: true })
  parentAppointmentId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  // Virtual properties for computed values
  get duration(): number {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }

  get isOnline(): boolean {
    return this.meetingType === 'online' || this.meetingType === 'hybrid';
  }

  get isInPerson(): boolean {
    return this.meetingType === 'in-person' || this.meetingType === 'hybrid';
  }

  get canRecord(): boolean {
    return this.meetingConfig.recordingSettings.enabled;
  }

  get meetingUrl(): string | undefined {
    return this.meetingConfig.meetingUrl;
  }

  get location(): string | undefined {
    return this.meetingConfig.location;
  }

  get recordingType(): RecordingType {
    return this.meetingConfig.recordingSettings.type;
  }

  // Helper methods for meeting type management
  convertToOnline(generateMeetLink: boolean = true): void {
    this.meetingType = 'online';
    this.meetingConfig = {
      ...this.meetingConfig,
      type: 'online',
      googleMeetEnabled: generateMeetLink,
      recordingSettings: {
        ...this.meetingConfig.recordingSettings,
        type: this.meetingConfig.recordingSettings.enabled ? 'full-session' : 'none'
      }
    };
  }

  convertToInPerson(location: string): void {
    this.meetingType = 'in-person';
    this.meetingConfig = {
      ...this.meetingConfig,
      type: 'in-person',
      location,
      meetingUrl: null as any,
      googleMeetEnabled: false,
      recordingSettings: {
        ...this.meetingConfig.recordingSettings,
        type: this.meetingConfig.recordingSettings.enabled ? 'audio-only' : 'none'
      }
    };
  }

  updateRecordingSettings(settings: Partial<RecordingSettings>): void {
    this.meetingConfig = {
      ...this.meetingConfig,
      recordingSettings: {
        ...this.meetingConfig.recordingSettings,
        ...settings
      }
    };
  }

  // Status management helpers
  canBeModified(): boolean {
    return ['scheduled', 'confirmed'].includes(this.status);
  }

  canBeRecorded(): boolean {
    return this.status === 'in-progress' && this.meetingConfig.recordingSettings.enabled;
  }

  isUpcoming(): boolean {
    return this.startTime > new Date() && ['scheduled', 'confirmed'].includes(this.status);
  }

  isActive(): boolean {
    const now = new Date();
    return this.startTime <= now && this.endTime >= now && this.status === 'in-progress';
  }
}
