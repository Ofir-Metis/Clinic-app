/**
 * ApiKey Entity - Database entity for API keys
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

@Entity('api_keys')
@Index(['clientId'])
@Index(['status'])
@Index(['keyHash'], { unique: true })
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  keyHash: string;

  @Column({ type: 'varchar', length: 20 })
  keyPreview: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'json' })
  permissions: string[];

  @Column({ type: 'json' })
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burst: number;
  };

  @Column({ type: 'bigint', default: 0 })
  totalRequests: number;

  @Column({ type: 'bigint', default: 0 })
  requestsThisMonth: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsed: Date;

  @Column({ 
    type: 'enum',
    enum: ['active', 'suspended', 'revoked'],
    default: 'active'
  })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  revocationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  revokedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  regeneratedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  regeneratedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;
}