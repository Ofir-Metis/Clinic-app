/**
 * AuditEvent Entity - Database entity for audit trail events
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_events')
@Index(['userId'])
@Index(['action'])
@Index(['resourceType'])
@Index(['timestamp'])
@Index(['riskLevel'])
@Index(['complianceFlags'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  userEmail: string;

  @Column({ type: 'varchar', length: 100 })
  userRole: string;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'varchar', length: 255 })
  resource: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceId: string;

  @Column({ 
    type: 'enum',
    enum: ['user', 'patient', 'appointment', 'file', 'system', 'configuration', 'api_key', 'backup'],
  })
  resourceType: string;

  @Column({ 
    type: 'enum',
    enum: ['success', 'failure', 'warning'],
  })
  outcome: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId: string;

  @Column({ type: 'json', nullable: true })
  details: Record<string, any>;

  @Column({ 
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  })
  riskLevel: string;

  @Column({ type: 'json', nullable: true })
  complianceFlags: string[];

  @Column({ 
    type: 'enum',
    enum: ['public', 'internal', 'confidential', 'restricted', 'phi'],
    nullable: true
  })
  dataClassification: string;

  @CreateDateColumn()
  createdAt: Date;
}