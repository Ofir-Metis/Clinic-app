/**
 * RecordingUpload Entity - Track multipart uploads for session recordings
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'aborted';

@Entity('recording_uploads')
@Index(['sessionId', 'participantId'])
@Index(['status', 'updatedAt'])
export class RecordingUpload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  @Index()
  recordingId!: string;

  @Column({ length: 255 })
  sessionId!: string;

  @Column({ length: 255 })
  participantId!: string;

  @Column({ length: 500 })
  s3Key!: string;

  @Column({ length: 255 })
  s3UploadId!: string;

  @Column({ nullable: true, length: 500 })
  s3Location?: string;

  @Column('int')
  totalChunks!: number;

  @Column('int', { default: 0 })
  uploadedChunks!: number;

  @Column('bigint')
  estimatedSize!: number;

  @Column('bigint', { default: 0 })
  uploadedSize!: number;

  @Column({ length: 100 })
  mimeType!: string;

  @Column({ nullable: true, length: 255 })
  originalName?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'uploading', 'completed', 'failed', 'aborted'],
    default: 'pending'
  })
  status!: UploadStatus;

  @Column({ nullable: true, type: 'text' })
  error?: string;

  @Column({ nullable: true, type: 'timestamp' })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Virtual properties
  get progressPercentage(): number {
    if (this.totalChunks === 0) return 0;
    return Math.round((this.uploadedChunks / this.totalChunks) * 100);
  }

  get sizeProgressPercentage(): number {
    if (this.estimatedSize === 0) return 0;
    return Math.round((this.uploadedSize / this.estimatedSize) * 100);
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isFailed(): boolean {
    return this.status === 'failed';
  }

  get isInProgress(): boolean {
    return this.status === 'uploading' || this.status === 'pending';
  }

  get uploadDurationMs(): number | null {
    if (!this.completedAt) return null;
    return this.completedAt.getTime() - this.createdAt.getTime();
  }

  get averageUploadSpeedBps(): number | null {
    const duration = this.uploadDurationMs;
    if (!duration || duration === 0) return null;
    return Math.round((this.uploadedSize * 1000) / duration); // bytes per second
  }
}