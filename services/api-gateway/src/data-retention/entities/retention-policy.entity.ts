import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Retention Policy Entity
 * 
 * Defines data retention and archival policies for different types of healthcare data.
 * Ensures HIPAA compliance and regulatory requirements are met.
 */

@Entity('retention_policies')
export class RetentionPolicyEntity {
  @PrimaryColumn('varchar', { length: 100 })
  id: string;

  @Column('varchar', { length: 200 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('varchar', { length: 50 })
  data_type: string;

  @Column('int')
  retention_period_months: number;

  @Column('int')
  archival_period_months: number;

  @Column('boolean', { default: true })
  is_enabled: boolean;

  @Column('jsonb')
  compliance_requirements: string[];

  @Column('jsonb')
  configuration: {
    selectionCriteria: {
      tables: string[];
      dateField: string;
      additionalConditions?: Record<string, any>;
    };
    archival: {
      enabled: boolean;
      compressionLevel: number;
      encryptionRequired: boolean;
      storageLocation: 'database' | 's3' | 'local';
      partitionStrategy: 'monthly' | 'yearly' | 'none';
    };
    deletion: {
      secureWipe: boolean;
      auditTrail: boolean;
      requireApproval: boolean;
      approvalRoles: string[];
    };
    notifications: {
      beforeArchival: number;
      beforeDeletion: number;
      recipients: string[];
    };
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('timestamp', { nullable: true })
  last_executed_at: Date;

  @Column('jsonb', { nullable: true })
  last_execution_result: {
    recordsProcessed: number;
    recordsArchived: number;
    recordsDeleted: number;
    duration: number;
    status: string;
    errors: string[];
  };

  @Column('varchar', { length: 100, nullable: true })
  created_by: string;

  @Column('varchar', { length: 100, nullable: true })
  updated_by: string;
}