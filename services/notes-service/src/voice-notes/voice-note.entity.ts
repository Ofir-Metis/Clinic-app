/**
 * VoiceNote Entity - Stores voice recordings and their transcriptions
 * Enables coaches to dictate notes during/after sessions with automatic transcription
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('voice_notes')
@Index(['coachId'])
@Index(['appointmentId'])
@Index(['clientId'])
@Index(['createdAt'])
export class VoiceNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'coach_id', type: 'uuid' })
  coachId!: string;

  // Context linking
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId?: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId?: string;

  @Column({ name: 'linked_note_id', type: 'uuid', nullable: true })
  linkedNoteId?: string; // If converted to regular note

  // Audio file reference
  @Column({ name: 'audio_file_key', type: 'varchar', length: 512 })
  audioFileKey!: string; // S3/MinIO key

  @Column({ name: 'audio_url', type: 'text', nullable: true })
  audioUrl?: string; // Signed URL (temporary, refreshed on request)

  @Column({ name: 'duration_seconds', type: 'integer' })
  durationSeconds!: number;

  @Column({ name: 'file_size_bytes', type: 'integer' })
  fileSizeBytes!: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, default: 'audio/webm' })
  mimeType!: string;

  // Transcription
  @Column({
    name: 'transcription_status',
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  transcriptionStatus!: TranscriptionStatus;

  @Column({ name: 'transcription', type: 'text', nullable: true })
  transcription?: string;

  @Column({
    name: 'transcription_confidence',
    type: 'decimal',
    precision: 4,
    scale: 3,
    nullable: true,
  })
  transcriptionConfidence?: number;

  @Column({ name: 'language_detected', type: 'varchar', length: 10, nullable: true })
  languageDetected?: string;

  @Column({ name: 'word_count', type: 'integer', nullable: true })
  wordCount?: number;

  @Column({ name: 'transcription_error', type: 'text', nullable: true })
  transcriptionError?: string;

  // Metadata
  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ name: 'session_timestamp', type: 'integer', nullable: true })
  sessionTimestamp?: number; // Seconds into the session when recorded

  @Column({ name: 'is_private', type: 'boolean', default: true })
  isPrivate!: boolean;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'transcribed_at', type: 'timestamp', nullable: true })
  transcribedAt?: Date;

  // Computed properties
  get isTranscribed(): boolean {
    return this.transcriptionStatus === 'completed' && !!this.transcription;
  }

  get durationText(): string {
    const minutes = Math.floor(this.durationSeconds / 60);
    const seconds = this.durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getTextPreview(length: number = 100): string {
    if (!this.transcription) return 'Transcription pending...';
    if (this.transcription.length <= length) return this.transcription;
    return this.transcription.substring(0, length).trim() + '...';
  }
}
