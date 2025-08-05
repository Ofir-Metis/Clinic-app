import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Archived Record Entity
 * 
 * Stores archived healthcare data in compliance with HIPAA and data retention policies.
 * All archived data is encrypted and includes integrity checks.
 */

@Entity('archived_records')
@Index(['retention_policy_id', 'archived_at'])
@Index(['original_table', 'original_id'])
@Index(['archived_at'])
export class ArchivedRecord {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column('varchar', { length: 100 })
  original_table: string;

  @Column('varchar', { length: 255 })
  original_id: string;

  @Column('text')
  data: string; // Encrypted JSON data

  @CreateDateColumn()
  archived_at: Date;

  @Column('varchar', { length: 100 })
  retention_policy_id: string;

  @Column('varchar', { length: 64 })
  checksum: string; // SHA-256 checksum for data integrity

  @Column('varchar', { length: 20, default: 'gzip' })
  compression_type: string;

  @Column('varchar', { length: 20, default: 'AES-256' })
  encryption_algorithm: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    original_size: number;
    compressed_size: number;
    archive_version: string;
    compliance_tags: string[];
  };

  @Column('timestamp', { nullable: true })
  deletion_scheduled_at: Date;

  @Column('varchar', { length: 50, default: 'active' })
  status: 'active' | 'scheduled_for_deletion' | 'deleted';
}