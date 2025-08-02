/**
 * Recording Entity - Core recording metadata and files
 * Supports the complete coaching session recording pipeline
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export type RecordingStatus = 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed' | 'archived';
export type ProcessingStatus = 'pending' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
export type RecordingMode = 'audio' | 'video' | 'screen';
export type SessionType = 'online' | 'offline' | 'hybrid';
export type Quality = 'low' | 'standard' | 'high' | 'ultra';

@Entity('recordings')
@Index(['sessionId'])
@Index(['userId'])
@Index(['appointmentId'])
@Index(['status'])
@Index(['userId', 'createdAt'])
@Index(['sessionId', 'status'])
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'filename', length: 255 })
  filename: string;

  @Column({ name: 'original_filename', length: 255 })
  originalFilename: string;

  @Column({ name: 'file_path', type: 'text' })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'duration', type: 'int', nullable: true })
  duration?: number; // duration in seconds

  // Session metadata
  @Column({ name: 'appointment_id', length: 255, nullable: true })
  appointmentId?: string;

  @Column({ name: 'session_id', length: 255 })
  sessionId: string;

  @Column({ name: 'participant_id', length: 255, nullable: true })
  participantId?: string;

  @Column({ name: 'user_id', length: 255 })
  userId: string;

  @Column({ name: 'user_role', length: 50 })
  userRole: string;

  // Recording configuration
  @Column({
    name: 'recording_mode',
    type: 'enum',
    enum: ['audio', 'video', 'screen'],
  })
  recordingMode: RecordingMode;

  @Column({
    name: 'session_type',
    type: 'enum',
    enum: ['online', 'offline', 'hybrid'],
  })
  sessionType: SessionType;

  @Column({
    name: 'quality',
    type: 'enum',
    enum: ['low', 'standard', 'high', 'ultra'],
    default: 'standard',
  })
  quality: Quality;

  // Status and processing
  @Column({
    name: 'status',
    type: 'enum',
    enum: ['uploading', 'uploaded', 'processing', 'completed', 'failed', 'archived'],
    default: 'uploaded',
  })
  status: RecordingStatus;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: ['pending', 'transcribing', 'analyzing', 'completed', 'failed'],
    default: 'pending',
  })
  processingStatus: ProcessingStatus;

  // Storage information
  @Column({ name: 'storage_provider', length: 50, default: 'minio' })
  storageProvider: string;

  @Column({ name: 'bucket_name', length: 255, nullable: true })
  bucketName?: string;

  @Column({ name: 'encryption_key_id', length: 255, nullable: true })
  encryptionKeyId?: string;

  // AI Processing results
  @Column({ name: 'transcription_id', type: 'uuid', nullable: true })
  transcriptionId?: string;

  @Column({ name: 'summary_id', type: 'uuid', nullable: true })
  summaryId?: string;

  @Column({ name: 'insights_id', type: 'uuid', nullable: true })
  insightsId?: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'timestamp', nullable: true })
  archivedAt?: Date;

  // Soft delete
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // Relations (will be added when other entities are created)
  // @OneToOne(() => Transcription, transcription => transcription.recording)
  // @JoinColumn({ name: 'transcription_id' })
  // transcription?: Transcription;

  // Helper methods
  isProcessed(): boolean {
    return this.processingStatus === 'completed';
  }

  isArchived(): boolean {
    return this.status === 'archived' && this.archivedAt !== null;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  getStorageKey(): string {
    return `recordings/${this.appointmentId || 'no-appointment'}/${this.sessionId}/${this.filename}`;
  }

  getThumbnailKey(): string {
    return `thumbnails/${this.appointmentId || 'no-appointment'}/${this.sessionId}/${this.id}_thumb.jpg`;
  }

  getFileExtension(): string {
    return this.filename.split('.').pop()?.toLowerCase() || '';
  }

  getFileSizeInMB(): number {
    return Math.round((Number(this.fileSize) / (1024 * 1024)) * 100) / 100;
  }

  getDurationInMinutes(): number {
    return this.duration ? Math.round((this.duration / 60) * 100) / 100 : 0;
  }
}