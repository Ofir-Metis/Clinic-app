/**
 * SystemAlert Entity - Database entity for system alerts
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('system_alerts')
@Index(['severity'])
@Index(['status'])
@Index(['service'])
@Index(['alertType'])
@Index(['resolvedAt'])
export class SystemAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ 
    type: 'enum',
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  })
  severity: string;

  @Column({ 
    type: 'enum',
    enum: ['active', 'acknowledged', 'resolved', 'suppressed'],
    default: 'active'
  })
  status: string;

  @Column({ 
    type: 'enum',
    enum: ['system', 'performance', 'security', 'backup', 'compliance', 'api', 'database'],
  })
  alertType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  service: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metric: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  threshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentValue: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  actionsTaken: string;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  acknowledgedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({ type: 'int', default: 1 })
  count: number;

  @Column({ type: 'timestamp', nullable: true })
  lastOccurrence: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}