import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertType {
  CPU = 'cpu',
  MEMORY = 'memory',
  RESPONSE_TIME = 'response_time',
  ERROR_RATE = 'error_rate',
  DATABASE = 'database',
  EVENT_LOOP = 'event_loop',
  HEAP = 'heap',
  CACHE = 'cache',
  DISK = 'disk',
  NETWORK = 'network',
  GENERAL = 'general',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
}

@Entity('performance_alerts')
@Index(['serviceName', 'timestamp'])
@Index(['alertType', 'severity'])
@Index(['resolved'])
@Index(['status'])
export class PerformanceAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serviceName: string;

  @Column({
    type: 'enum',
    enum: AlertType,
    default: AlertType.GENERAL,
  })
  alertType: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolvedBy: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'boolean', default: false })
  acknowledged: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'text', nullable: true })
  acknowledgedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  threshold: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  actualValue: number;

  @Column({ type: 'text', nullable: true })
  metricName: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  environment: string;

  @Column({ type: 'text', nullable: true })
  region: string;

  @Column({ type: 'text', nullable: true })
  cluster: string;

  @Column({ type: 'text', nullable: true })
  namespace: string;

  @Column({ type: 'text', nullable: true })
  podName: string;

  @Column({ type: 'text', nullable: true })
  nodeName: string;

  @Column({ type: 'text', nullable: true })
  containerId: string;

  @Column({ type: 'text', nullable: true })
  imageVersion: string;

  @Column({ type: 'int', default: 1 })
  occurrenceCount: number;

  @Column({ type: 'timestamp', nullable: true })
  firstOccurrence: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastOccurrence: Date;

  @Column({ type: 'boolean', default: false })
  suppressionEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  suppressionStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  suppressionEnd: Date;

  @Column({ type: 'text', nullable: true })
  suppressionReason: string;

  @Column({ type: 'text', array: true, default: '{}' })
  relatedAlerts: string[];

  @Column({ type: 'text', nullable: true })
  runbookUrl: string;

  @Column({ type: 'text', nullable: true })
  dashboardUrl: string;

  @Column({ type: 'text', array: true, default: '{}' })
  notificationChannels: string[];

  @Column({ type: 'boolean', default: false })
  escalated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'text', nullable: true })
  escalationLevel: string;

  @Column({ type: 'text', array: true, default: '{}' })
  actionsTaken: string[];

  @Column({ type: 'text', nullable: true })
  rootCause: string;

  @Column({ type: 'text', nullable: true })
  preventionMeasures: string;

  @Column({ type: 'jsonb', nullable: true })
  customFields: any;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column({ type: 'text', nullable: true })
  archivedBy: string;
}