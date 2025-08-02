/**
 * PerformanceMetric Entity - Database entity for performance metrics
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('performance_metrics')
@Index(['service'])
@Index(['metricName'])
@Index(['timestamp'])
@Index(['service', 'metricName', 'timestamp'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  service: string;

  @Column({ type: 'varchar', length: 255 })
  metricName: string;

  @Column({ type: 'decimal', precision: 15, scale: 6 })
  value: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ type: 'json', nullable: true })
  tags: Record<string, string>;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}