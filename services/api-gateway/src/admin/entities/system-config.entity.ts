/**
 * SystemConfig Entity - Database entity for system configuration
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('system_configs')
@Index(['key', 'environment'], { unique: true })
@Index(['service'])
@Index(['category'])
@Index(['isSecret'])
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ 
    type: 'enum',
    enum: ['string', 'number', 'boolean', 'json', 'encrypted'],
    default: 'string'
  })
  type: string;

  @Column({ type: 'varchar', length: 100, default: 'production' })
  environment: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  service: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isSecret: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  validation: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  modifiedBy: string;
}