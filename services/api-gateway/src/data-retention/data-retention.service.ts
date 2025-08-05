import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StructuredLoggerService } from '@clinic/common/logging';
import { EncryptionService } from '../encryption/encryption.service';

/**
 * Data Retention Service
 * 
 * Manages healthcare data retention and archival policies in compliance with HIPAA,
 * state regulations, and organizational requirements. Handles automated cleanup,
 * archival, and secure deletion of sensitive healthcare data.
 */

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataType: DataType;
  retentionPeriod: number; // in months
  archivalPeriod: number; // in months (before deletion)
  isEnabled: boolean;
  complianceRequirements: string[];
  createdAt: Date;
  lastExecuted?: Date;
  configuration: RetentionConfiguration;
}

export interface RetentionConfiguration {
  // Criteria for data selection
  selectionCriteria: {
    tables: string[];
    dateField: string;
    additionalConditions?: Record<string, any>;
  };
  
  // Archival settings
  archival: {
    enabled: boolean;
    compressionLevel: number;
    encryptionRequired: boolean;
    storageLocation: 'database' | 's3' | 'local';
    partitionStrategy: 'monthly' | 'yearly' | 'none';
  };
  
  // Deletion settings
  deletion: {
    secureWipe: boolean;
    auditTrail: boolean;
    requireApproval: boolean;
    approvalRoles: string[];
  };
  
  // Notification settings
  notifications: {
    beforeArchival: number; // days
    beforeDeletion: number; // days
    recipients: string[];
  };
}

export enum DataType {
  PATIENT_RECORDS = 'patient_records',
  SESSION_NOTES = 'session_notes',
  RECORDINGS = 'recordings',
  COMMUNICATION_LOGS = 'communication_logs',
  AUDIT_LOGS = 'audit_logs',
  SYSTEM_LOGS = 'system_logs',
  BILLING_RECORDS = 'billing_records',
  APPOINTMENTS = 'appointments',
  USER_ACTIVITY = 'user_activity',
  METRICS_DATA = 'metrics_data'
}

export interface RetentionExecutionResult {
  policyId: string;
  executionTime: Date;
  recordsProcessed: number;
  recordsArchived: number;
  recordsDeleted: number;
  errors: string[];
  duration: number; // milliseconds
  status: 'success' | 'partial' | 'failed';
}

export interface ArchivedRecord {
  id: string;
  originalTable: string;
  originalId: string;
  data: string; // encrypted JSON
  archivedAt: Date;
  retentionPolicyId: string;
  checksum: string;
}

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);
  private readonly policies: Map<string, RetentionPolicy> = new Map();
  
  constructor(
    private readonly entityManager: EntityManager,
    private readonly structuredLogger: StructuredLoggerService,
    private readonly encryptionService: EncryptionService
  ) {
    this.initializeDefaultPolicies();
  }
  
  /**
   * Initialize HIPAA-compliant default retention policies
   */
  private initializeDefaultPolicies() {
    const defaultPolicies: RetentionPolicy[] = [
      {
        id: 'patient-records-retention',
        name: 'Patient Medical Records',
        description: 'HIPAA-compliant retention for patient medical records',
        dataType: DataType.PATIENT_RECORDS,
        retentionPeriod: 72, // 6 years (HIPAA minimum)
        archivalPeriod: 120, // 10 years total (archive for 4 additional years)
        isEnabled: true,
        complianceRequirements: ['HIPAA', 'State Medical Record Laws'],
        createdAt: new Date(),
        configuration: {
          selectionCriteria: {
            tables: ['patients', 'medical_history', 'diagnoses', 'treatment_plans'],
            dateField: 'last_activity_date',
            additionalConditions: {
              status: 'inactive'
            }
          },
          archival: {
            enabled: true,
            compressionLevel: 9,
            encryptionRequired: true,
            storageLocation: 's3',
            partitionStrategy: 'yearly'
          },
          deletion: {
            secureWipe: true,
            auditTrail: true,
            requireApproval: true,
            approvalRoles: ['admin', 'compliance_officer']
          },
          notifications: {
            beforeArchival: 30,
            beforeDeletion: 90,
            recipients: ['compliance@clinic.com', 'admin@clinic.com']
          }
        }
      },
      
      {
        id: 'session-notes-retention',
        name: 'Therapy Session Notes',
        description: 'Retention policy for therapy session documentation',
        dataType: DataType.SESSION_NOTES,
        retentionPeriod: 84, // 7 years
        archivalPeriod: 120, // 10 years total
        isEnabled: true,
        complianceRequirements: ['HIPAA', 'Professional Standards'],
        createdAt: new Date(),
        configuration: {
          selectionCriteria: {
            tables: ['session_notes', 'progress_notes', 'treatment_summaries'],
            dateField: 'session_date',
          },
          archival: {
            enabled: true,
            compressionLevel: 8,
            encryptionRequired: true,
            storageLocation: 's3',
            partitionStrategy: 'yearly'
          },
          deletion: {
            secureWipe: true,
            auditTrail: true,
            requireApproval: true,
            approvalRoles: ['admin', 'clinical_director']
          },
          notifications: {
            beforeArchival: 60,
            beforeDeletion: 120,
            recipients: ['clinical@clinic.com', 'compliance@clinic.com']
          }
        }
      },
      
      {
        id: 'recordings-retention',
        name: 'Session Recordings',
        description: 'Retention policy for audio/video session recordings',
        dataType: DataType.RECORDINGS,
        retentionPeriod: 36, // 3 years (shorter due to storage costs)
        archivalPeriod: 84, // 7 years total
        isEnabled: true,
        complianceRequirements: ['HIPAA', 'Consent Requirements'],
        createdAt: new Date(),
        configuration: {
          selectionCriteria: {
            tables: ['recordings', 'session_media'],
            dateField: 'created_at',
            additionalConditions: {
              consent_status: 'expired'
            }
          },
          archival: {
            enabled: true,
            compressionLevel: 6,
            encryptionRequired: true,
            storageLocation: 's3',
            partitionStrategy: 'monthly'
          },
          deletion: {
            secureWipe: true,
            auditTrail: true,
            requireApproval: true,
            approvalRoles: ['admin', 'privacy_officer']
          },
          notifications: {
            beforeArchival: 14,
            beforeDeletion: 30,
            recipients: ['privacy@clinic.com', 'it@clinic.com']
          }
        }
      },
      
      {
        id: 'audit-logs-retention',
        name: 'Security Audit Logs',
        description: 'Retention policy for security and access audit logs',
        dataType: DataType.AUDIT_LOGS,
        retentionPeriod: 72, // 6 years (HIPAA requirement)
        archivalPeriod: 84, // 7 years total
        isEnabled: true,
        complianceRequirements: ['HIPAA', 'SOX', 'Security Standards'],
        createdAt: new Date(),
        configuration: {
          selectionCriteria: {
            tables: ['audit_events', 'access_logs', 'hipaa_audit_trail'],
            dateField: 'event_timestamp',
          },
          archival: {
            enabled: true,
            compressionLevel: 9,
            encryptionRequired: true,
            storageLocation: 's3',
            partitionStrategy: 'monthly'
          },
          deletion: {
            secureWipe: true,
            auditTrail: true,
            requireApproval: false, // System logs can be auto-deleted
            approvalRoles: []
          },
          notifications: {
            beforeArchival: 7,
            beforeDeletion: 30,
            recipients: ['security@clinic.com', 'compliance@clinic.com']
          }
        }
      },
      
      {
        id: 'system-logs-retention',
        name: 'System and Application Logs',
        description: 'Retention policy for system and application logs',
        dataType: DataType.SYSTEM_LOGS,
        retentionPeriod: 12, // 1 year
        archivalPeriod: 24, // 2 years total
        isEnabled: true,
        complianceRequirements: ['Operational Requirements'],
        createdAt: new Date(),
        configuration: {
          selectionCriteria: {
            tables: ['application_logs', 'error_logs', 'performance_logs'],
            dateField: 'created_at',
          },
          archival: {
            enabled: true,
            compressionLevel: 9,
            encryptionRequired: false,
            storageLocation: 's3',
            partitionStrategy: 'monthly'
          },
          deletion: {
            secureWipe: false,
            auditTrail: false,
            requireApproval: false,
            approvalRoles: []
          },
          notifications: {
            beforeArchival: 0,
            beforeDeletion: 7,
            recipients: ['devops@clinic.com']
          }
        }
      },
      
      {
        id: 'billing-records-retention',
        name: 'Billing and Financial Records',
        description: 'Retention policy for billing and financial data',
        dataType: DataType.BILLING_RECORDS,
        retentionPeriod: 84, // 7 years (IRS requirement)
        archivalPeriod: 120, // 10 years total
        isEnabled: true,
        complianceRequirements: ['IRS', 'HIPAA', 'State Tax Laws'],
        createdAt: new Date(),
        configuration: {
          selectionCriteria: {
            tables: ['invoices', 'payments', 'billing_history', 'insurance_claims'],
            dateField: 'transaction_date',
          },
          archival: {
            enabled: true,
            compressionLevel: 8,
            encryptionRequired: true,
            storageLocation: 's3',
            partitionStrategy: 'yearly'
          },
          deletion: {
            secureWipe: true,
            auditTrail: true,
            requireApproval: true,
            approvalRoles: ['admin', 'financial_officer']
          },
          notifications: {
            beforeArchival: 90,
            beforeDeletion: 180,
            recipients: ['finance@clinic.com', 'compliance@clinic.com']
          }
        }
      }
    ];
    
    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
    
    this.logger.log('Default retention policies initialized', {
      policyCount: defaultPolicies.length
    });
  }
  
  /**
   * Execute retention policies (scheduled daily at 2 AM)
   */
  @Cron('0 2 * * *') // Daily at 2 AM
  async executeRetentionPolicies(): Promise<RetentionExecutionResult[]> {
    const results: RetentionExecutionResult[] = [];
    
    this.structuredLogger.info('Starting scheduled retention policy execution', {
      operation: 'execute_retention_policies',
      activePolicies: Array.from(this.policies.values()).filter(p => p.isEnabled).length
    });
    
    for (const policy of this.policies.values()) {
      if (!policy.isEnabled) {
        continue;
      }
      
      try {
        const result = await this.executeSinglePolicy(policy);
        results.push(result);
        
        // Update last executed time
        policy.lastExecuted = new Date();
        
      } catch (error) {
        this.structuredLogger.error('Failed to execute retention policy', {
          operation: 'execute_retention_policy',
          policyId: policy.id,
          error: error.message,
          stack: error.stack
        });
        
        results.push({
          policyId: policy.id,
          executionTime: new Date(),
          recordsProcessed: 0,
          recordsArchived: 0,
          recordsDeleted: 0,
          errors: [error.message],
          duration: 0,
          status: 'failed'
        });
      }
    }
    
    // Log summary
    const totalProcessed = results.reduce((sum, r) => sum + r.recordsProcessed, 0);
    const totalArchived = results.reduce((sum, r) => sum + r.recordsArchived, 0);
    const totalDeleted = results.reduce((sum, r) => sum + r.recordsDeleted, 0);
    
    this.structuredLogger.info('Retention policy execution completed', {
      operation: 'execute_retention_policies_complete',
      totalPolicies: results.length,
      totalProcessed,
      totalArchived,
      totalDeleted,
      successfulPolicies: results.filter(r => r.status === 'success').length
    });
    
    return results;
  }
  
  /**
   * Execute a single retention policy
   */
  async executeSinglePolicy(policy: RetentionPolicy): Promise<RetentionExecutionResult> {
    const startTime = Date.now();
    
    this.structuredLogger.info('Executing retention policy', {
      operation: 'execute_single_policy',
      policyId: policy.id,
      policyName: policy.name,
      dataType: policy.dataType
    });
    
    const result: RetentionExecutionResult = {
      policyId: policy.id,
      executionTime: new Date(),
      recordsProcessed: 0,
      recordsArchived: 0,
      recordsDeleted: 0,
      errors: [],
      duration: 0,
      status: 'success'
    };
    
    try {
      // Step 1: Identify records for archival
      const recordsForArchival = await this.identifyRecordsForArchival(policy);
      result.recordsProcessed += recordsForArchival.length;
      
      // Step 2: Archive eligible records
      if (policy.configuration.archival.enabled && recordsForArchival.length > 0) {
        const archived = await this.archiveRecords(policy, recordsForArchival);
        result.recordsArchived = archived;
      }
      
      // Step 3: Identify records for deletion
      const recordsForDeletion = await this.identifyRecordsForDeletion(policy);
      result.recordsProcessed += recordsForDeletion.length;
      
      // Step 4: Delete eligible records
      if (recordsForDeletion.length > 0) {
        const deleted = await this.deleteRecords(policy, recordsForDeletion);
        result.recordsDeleted = deleted;
      }
      
      result.duration = Date.now() - startTime;
      
      this.structuredLogger.info('Retention policy executed successfully', {
        operation: 'execute_single_policy_complete',
        policyId: policy.id,
        recordsProcessed: result.recordsProcessed,
        recordsArchived: result.recordsArchived,
        recordsDeleted: result.recordsDeleted,
        duration: result.duration
      });
      
    } catch (error) {
      result.errors.push(error.message);
      result.status = 'failed';
      result.duration = Date.now() - startTime;
      
      this.structuredLogger.error('Retention policy execution failed', {
        operation: 'execute_single_policy_error',
        policyId: policy.id,
        error: error.message,
        duration: result.duration
      });
    }
    
    return result;
  }
  
  /**
   * Identify records eligible for archival
   */
  private async identifyRecordsForArchival(policy: RetentionPolicy): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - policy.retentionPeriod);
    
    const records: any[] = [];
    
    for (const tableName of policy.configuration.selectionCriteria.tables) {
      try {
        const queryBuilder = this.entityManager
          .createQueryBuilder()
          .select('*')
          .from(tableName, tableName)
          .where(`${policy.configuration.selectionCriteria.dateField} < :cutoffDate`, {
            cutoffDate
          });
        
        // Add additional conditions if specified
        if (policy.configuration.selectionCriteria.additionalConditions) {
          for (const [field, value] of Object.entries(policy.configuration.selectionCriteria.additionalConditions)) {
            queryBuilder.andWhere(`${field} = :${field}`, { [field]: value });
          }
        }
        
        const tableRecords = await queryBuilder.getRawMany();
        records.push(...tableRecords.map(record => ({ ...record, _tableName: tableName })));
        
      } catch (error) {
        this.logger.warn(`Failed to query table ${tableName} for archival:`, error);
      }
    }
    
    return records;
  }
  
  /**
   * Archive records to secure storage
   */
  private async archiveRecords(policy: RetentionPolicy, records: any[]): Promise<number> {
    let archivedCount = 0;
    
    for (const record of records) {
      try {
        // Prepare archived record
        const archivedRecord: ArchivedRecord = {
          id: `archived_${record.id}_${Date.now()}`,
          originalTable: record._tableName,
          originalId: record.id,
          data: await this.encryptRecordData(record, policy),
          archivedAt: new Date(),
          retentionPolicyId: policy.id,
          checksum: await this.calculateChecksum(record)
        };
        
        // Store in archive table
        await this.entityManager
          .createQueryBuilder()
          .insert()
          .into('archived_records')
          .values(archivedRecord)
          .execute();
        
        // Remove from original table if archival successful
        await this.entityManager
          .createQueryBuilder()
          .delete()
          .from(record._tableName)
          .where('id = :id', { id: record.id })
          .execute();
        
        archivedCount++;
        
      } catch (error) {
        this.logger.error(`Failed to archive record ${record.id}:`, error);
      }
    }
    
    return archivedCount;
  }
  
  /**
   * Identify records eligible for deletion
   */
  private async identifyRecordsForDeletion(policy: RetentionPolicy): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - policy.archivalPeriod);
    
    // Query archived records that have exceeded archival period
    const archivedRecords = await this.entityManager
      .createQueryBuilder()
      .select('*')
      .from('archived_records', 'archived')
      .where('archived_at < :cutoffDate', { cutoffDate })
      .andWhere('retention_policy_id = :policyId', { policyId: policy.id })
      .getRawMany();
    
    return archivedRecords;
  }
  
  /**
   * Securely delete records
   */
  private async deleteRecords(policy: RetentionPolicy, records: any[]): Promise<number> {
    let deletedCount = 0;
    
    for (const record of records) {
      try {
        // Create audit trail before deletion
        if (policy.configuration.deletion.auditTrail) {
          await this.createDeletionAuditRecord(policy, record);
        }
        
        // Perform secure deletion
        if (policy.configuration.deletion.secureWipe) {
          await this.secureDeleteRecord(record);
        } else {
          await this.entityManager
            .createQueryBuilder()
            .delete()
            .from('archived_records')
            .where('id = :id', { id: record.id })
            .execute();
        }
        
        deletedCount++;
        
      } catch (error) {
        this.logger.error(`Failed to delete archived record ${record.id}:`, error);
      }
    }
    
    return deletedCount;
  }
  
  /**
   * Encrypt record data for archival
   */
  private async encryptRecordData(record: any, policy: RetentionPolicy): Promise<string> {
    if (!policy.configuration.archival.encryptionRequired) {
      return JSON.stringify(record);
    }
    
    const recordData = { ...record };
    delete recordData._tableName; // Remove internal field
    
    const encryptedData = await this.encryptionService.encryptSensitiveData(
      JSON.stringify(recordData)
    );
    
    return encryptedData;
  }
  
  /**
   * Calculate checksum for data integrity
   */
  private async calculateChecksum(record: any): Promise<string> {
    const crypto = require('crypto');
    const recordData = { ...record };
    delete recordData._tableName;
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(recordData))
      .digest('hex');
  }
  
  /**
   * Create audit record for deletion
   */
  private async createDeletionAuditRecord(policy: RetentionPolicy, record: any): Promise<void> {
    const auditRecord = {
      event_type: 'DATA_DELETION',
      resource_type: 'archived_record',
      resource_id: record.id,
      user_id: 'system',
      event_timestamp: new Date(),
      details: JSON.stringify({
        policyId: policy.id,
        policyName: policy.name,
        originalTable: record.original_table,
        originalId: record.original_id,
        archivedAt: record.archived_at,
        reason: 'Retention policy expiration'
      }),
      ip_address: '127.0.0.1',
      user_agent: 'DataRetentionService'
    };
    
    await this.entityManager
      .createQueryBuilder()
      .insert()
      .into('audit_events')
      .values(auditRecord)
      .execute();
  }
  
  /**
   * Perform secure deletion with multiple overwrites
   */
  private async secureDeleteRecord(record: any): Promise<void> {
    const crypto = require('crypto');
    
    // Perform multiple overwrites for secure deletion
    for (let i = 0; i < 3; i++) {
      const randomData = crypto.randomBytes(1024).toString('hex');
      
      // Overwrite the record data (simulated - in practice would overwrite storage)
      await this.entityManager
        .createQueryBuilder()
        .update('archived_records')
        .set({ data: randomData })
        .where('id = :id', { id: record.id })
        .execute();
    }
    
    // Final deletion
    await this.entityManager
      .createQueryBuilder()
      .delete()
      .from('archived_records')
      .where('id = :id', { id: record.id })
      .execute();
  }
  
  /**
   * Get all retention policies
   */
  getRetentionPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }
  
  /**
   * Get specific retention policy
   */
  getRetentionPolicy(policyId: string): RetentionPolicy | null {
    return this.policies.get(policyId) || null;
  }
  
  /**
   * Create custom retention policy
   */
  async createRetentionPolicy(policy: Omit<RetentionPolicy, 'createdAt'>): Promise<void> {
    const newPolicy: RetentionPolicy = {
      ...policy,
      createdAt: new Date()
    };
    
    this.policies.set(policy.id, newPolicy);
    
    this.structuredLogger.info('Retention policy created', {
      operation: 'create_retention_policy',
      policyId: policy.id,
      dataType: policy.dataType,
      retentionPeriod: policy.retentionPeriod
    });
  }
  
  /**
   * Update retention policy
   */
  async updateRetentionPolicy(policyId: string, updates: Partial<RetentionPolicy>): Promise<void> {
    const existingPolicy = this.policies.get(policyId);
    if (!existingPolicy) {
      throw new Error(`Retention policy not found: ${policyId}`);
    }
    
    const updatedPolicy = { ...existingPolicy, ...updates };
    this.policies.set(policyId, updatedPolicy);
    
    this.structuredLogger.info('Retention policy updated', {
      operation: 'update_retention_policy',
      policyId,
      updates: Object.keys(updates)
    });
  }
  
  /**
   * Get retention statistics
   */
  async getRetentionStatistics(): Promise<any> {
    const stats = {
      activePolicies: Array.from(this.policies.values()).filter(p => p.isEnabled).length,
      totalPolicies: this.policies.size,
      lastExecution: Math.max(...Array.from(this.policies.values())
        .map(p => p.lastExecuted?.getTime() || 0)),
      archivedRecordsCount: 0,
      totalStorageSaved: 0
    };
    
    try {
      // Get archived records count
      const archivedCount = await this.entityManager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('archived_records', 'archived')
        .getRawOne();
      
      stats.archivedRecordsCount = parseInt(archivedCount.count) || 0;
      
    } catch (error) {
      this.logger.warn('Failed to get retention statistics:', error);
    }
    
    return stats;
  }
}