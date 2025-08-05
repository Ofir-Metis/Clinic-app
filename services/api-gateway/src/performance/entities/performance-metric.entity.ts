import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('performance_metrics')
@Index(['serviceName', 'timestamp'])
@Index(['timestamp'])
@Index(['performanceScore'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serviceName: string;

  @Column({ type: 'timestamp' })
  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  cpuUsage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  memoryUsage: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  responseTime: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  errorRate: number;

  @Column({ type: 'int' })
  databaseConnections: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  cacheHitRatio: number;

  @Column({ type: 'decimal', precision: 8, scale: 3 })
  eventLoopDelay: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  performanceScore: number;

  @Column({ type: 'text', array: true, default: '{}' })
  recommendations: string[];

  @Column({ type: 'jsonb' })
  rawMetrics: any;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  heapUsed: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  heapTotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gcDuration: number;

  @Column({ type: 'int', nullable: true })
  gcCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  eventLoopUtilization: number;

  @Column({ type: 'int', nullable: true })
  activeConnections: number;

  @Column({ type: 'int', nullable: true })
  queueDepth: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cacheHitRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cacheMissRate: number;

  @Column({ type: 'int', nullable: true })
  cacheSize: number;

  @Column({ type: 'int', nullable: true })
  cacheEvictions: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  averageQueryTime: number;

  @Column({ type: 'int', nullable: true })
  slowQueries: number;

  @Column({ type: 'int', nullable: true })
  deadlockCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  loadAverage1m: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  loadAverage5m: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  loadAverage15m: number;

  @Column({ type: 'int', nullable: true })
  cpuCores: number;

  @Column({ type: 'bigint', nullable: true })
  memoryTotal: number;

  @Column({ type: 'bigint', nullable: true })
  memoryFree: number;

  @Column({ type: 'bigint', nullable: true })
  memoryUsed: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  processUptime: number;

  @Column({ type: 'int', nullable: true })
  processPid: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  processCpuUsage: number;

  @Column({ type: 'bigint', nullable: true })
  processMemoryUsage: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  requestsPerSecond: number;

  @Column({ type: 'jsonb', nullable: true })
  customMetrics: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;
}