/**
 * BackupJob Entity - Database entity for backup jobs
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('backup_jobs')
@Index(['status'])
@Index(['type'])
@Index(['scheduledAt'])
@Index(['completedAt'])
export class BackupJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'enum',
    enum: ['full', 'incremental', 'differential', 'snapshot'],
    default: 'full'
  })
  type: string;

  @Column({ 
    type: 'enum',
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  })
  status: string;

  @Column({ type: 'json' })
  sources: string[];

  @Column({ type: 'varchar', length: 255 })
  destination: string;

  @Column({ type: 'boolean', default: false })
  encrypted: boolean;

  @Column({ type: 'boolean', default: false })
  compressed: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  schedule: string; // cron expression

  @Column({ type: 'int', default: 30 })
  retentionDays: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes: number;

  @Column({ type: 'int', nullable: true })
  fileCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  progressPercentage: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  logs: string[];

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  checksumHash: string;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  cancelledBy: string;
}