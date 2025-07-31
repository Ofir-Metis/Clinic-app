/**
 * RecordingChunk Entity - Track individual chunks of multipart uploads
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { RecordingUpload } from './recording-upload.entity';

@Entity('recording_chunks')
@Index(['recordingId', 'chunkIndex'], { unique: true })
@Index(['recordingId'])
export class RecordingChunk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  recordingId!: string;

  @Column('int')
  chunkIndex!: number;

  @Column('int')
  size!: number;

  @Column({ length: 255 })
  etag!: string;

  @Column({ nullable: true, type: 'int' })
  retryCount?: number;

  @Column({ nullable: true, type: 'text' })
  lastError?: string;

  @CreateDateColumn()
  uploadedAt!: Date;

  // Relationship to parent upload
  @ManyToOne(() => RecordingUpload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recordingId', referencedColumnName: 'recordingId' })
  upload!: RecordingUpload;

  // Virtual properties
  get sizeInMB(): number {
    return Math.round((this.size / (1024 * 1024)) * 100) / 100;
  }

  get hasErrors(): boolean {
    return !!(this.retryCount && this.retryCount > 0);
  }
}