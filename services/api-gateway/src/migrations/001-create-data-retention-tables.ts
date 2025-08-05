import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

/**
 * Migration: Create Data Retention Tables
 * 
 * Creates the necessary tables for HIPAA-compliant data retention and archival system.
 */

export class CreateDataRetentionTables1706000000001 implements MigrationInterface {
  name = 'CreateDataRetentionTables1706000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create retention_policies table
    await queryRunner.createTable(
      new Table({
        name: 'retention_policies',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '100',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'data_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'retention_period_months',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'archival_period_months',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'compliance_requirements',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'configuration',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'last_executed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_execution_result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create archived_records table
    await queryRunner.createTable(
      new Table({
        name: 'archived_records',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'original_table',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'original_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'data',
            type: 'text',
            isNullable: false,
            comment: 'Encrypted and compressed data',
          },
          {
            name: 'archived_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'retention_policy_id',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'checksum',
            type: 'varchar',
            length: '64',
            isNullable: false,
            comment: 'SHA-256 checksum for data integrity',
          },
          {
            name: 'compression_type',
            type: 'varchar',
            length: '20',
            default: "'gzip'",
          },
          {
            name: 'encryption_algorithm',
            type: 'varchar',
            length: '20',
            default: "'AES-256'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Archive metadata including size, version, compliance tags',
          },
          {
            name: 'deletion_scheduled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
        ],
      }),
      true,
    );

    // Create indexes for retention_policies
    await queryRunner.createIndex(
      'retention_policies',
      new Index('idx_retention_policies_data_type', ['data_type']),
    );

    await queryRunner.createIndex(
      'retention_policies',
      new Index('idx_retention_policies_enabled', ['is_enabled']),
    );

    await queryRunner.createIndex(
      'retention_policies',
      new Index('idx_retention_policies_last_executed', ['last_executed_at']),
    );

    // Create indexes for archived_records
    await queryRunner.createIndex(
      'archived_records',
      new Index('idx_archived_records_policy_date', ['retention_policy_id', 'archived_at']),
    );

    await queryRunner.createIndex(
      'archived_records',
      new Index('idx_archived_records_original', ['original_table', 'original_id']),
    );

    await queryRunner.createIndex(
      'archived_records',
      new Index('idx_archived_records_archived_at', ['archived_at']),
    );

    await queryRunner.createIndex(
      'archived_records',
      new Index('idx_archived_records_deletion_scheduled', ['deletion_scheduled_at']),
    );

    await queryRunner.createIndex(
      'archived_records',
      new Index('idx_archived_records_status', ['status']),
    );

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE archived_records 
      ADD CONSTRAINT fk_archived_records_retention_policy 
      FOREIGN KEY (retention_policy_id) 
      REFERENCES retention_policies(id) 
      ON DELETE RESTRICT
    `);

    // Create trigger to update updated_at timestamp
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_retention_policies_updated_at 
      BEFORE UPDATE ON retention_policies 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create view for retention policy statistics
    await queryRunner.query(`
      CREATE VIEW retention_policy_stats AS
      SELECT 
        rp.id,
        rp.name,
        rp.data_type,
        rp.is_enabled,
        rp.last_executed_at,
        COUNT(ar.id) as archived_records_count,
        SUM(CASE WHEN ar.status = 'active' THEN 1 ELSE 0 END) as active_archives,
        SUM(CASE WHEN ar.status = 'scheduled_for_deletion' THEN 1 ELSE 0 END) as scheduled_for_deletion,
        MIN(ar.archived_at) as first_archive_date,
        MAX(ar.archived_at) as last_archive_date
      FROM retention_policies rp
      LEFT JOIN archived_records ar ON rp.id = ar.retention_policy_id
      GROUP BY rp.id, rp.name, rp.data_type, rp.is_enabled, rp.last_executed_at;
    `);

    // Insert default HIPAA-compliant retention policies
    await queryRunner.query(`
      INSERT INTO retention_policies (
        id, name, description, data_type, retention_period_months, archival_period_months,
        is_enabled, compliance_requirements, configuration, created_by
      ) VALUES 
      (
        'patient-records-retention',
        'Patient Medical Records',
        'HIPAA-compliant retention for patient medical records',
        'PATIENT_RECORDS',
        72,
        120,
        true,
        '["HIPAA", "State Medical Record Laws"]'::jsonb,
        '{
          "selectionCriteria": {
            "tables": ["patients", "medical_history", "diagnoses", "treatment_plans"],
            "dateField": "last_activity_date",
            "additionalConditions": {"status": "inactive"}
          },
          "archival": {
            "enabled": true,
            "compressionLevel": 9,
            "encryptionRequired": true,
            "storageLocation": "s3",
            "partitionStrategy": "yearly"
          },
          "deletion": {
            "secureWipe": true,
            "auditTrail": true,
            "requireApproval": true,
            "approvalRoles": ["admin", "compliance_officer"]
          },
          "notifications": {
            "beforeArchival": 30,
            "beforeDeletion": 90,
            "recipients": ["compliance@clinic.com", "admin@clinic.com"]
          }
        }'::jsonb,
        'system'
      ),
      (
        'session-notes-retention',
        'Therapy Session Notes',
        'Retention policy for therapy session documentation',
        'SESSION_NOTES',
        84,
        120,
        true,
        '["HIPAA", "Professional Standards"]'::jsonb,
        '{
          "selectionCriteria": {
            "tables": ["session_notes", "progress_notes", "treatment_summaries"],
            "dateField": "session_date"
          },
          "archival": {
            "enabled": true,
            "compressionLevel": 8,
            "encryptionRequired": true,
            "storageLocation": "s3",
            "partitionStrategy": "yearly"
          },
          "deletion": {
            "secureWipe": true,
            "auditTrail": true,
            "requireApproval": true,
            "approvalRoles": ["admin", "clinical_director"]
          },
          "notifications": {
            "beforeArchival": 60,
            "beforeDeletion": 120,
            "recipients": ["clinical@clinic.com", "compliance@clinic.com"]
          }
        }'::jsonb,
        'system'
      ),
      (
        'audit-logs-retention',
        'Security Audit Logs',
        'Retention policy for security and access audit logs',
        'AUDIT_LOGS',
        72,
        84,
        true,
        '["HIPAA", "SOX", "Security Standards"]'::jsonb,
        '{
          "selectionCriteria": {
            "tables": ["audit_events", "access_logs", "hipaa_audit_trail"],
            "dateField": "event_timestamp"
          },
          "archival": {
            "enabled": true,
            "compressionLevel": 9,
            "encryptionRequired": true,
            "storageLocation": "s3",
            "partitionStrategy": "monthly"
          },
          "deletion": {
            "secureWipe": true,
            "auditTrail": true,
            "requireApproval": false,
            "approvalRoles": []
          },
          "notifications": {
            "beforeArchival": 7,
            "beforeDeletion": 30,
            "recipients": ["security@clinic.com", "compliance@clinic.com"]
          }
        }'::jsonb,
        'system'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop view
    await queryRunner.query(`DROP VIEW IF EXISTS retention_policy_stats;`);

    // Drop trigger and function
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_retention_policies_updated_at ON retention_policies;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column();`);

    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE archived_records DROP CONSTRAINT IF EXISTS fk_archived_records_retention_policy;`);

    // Drop indexes
    await queryRunner.dropIndex('archived_records', 'idx_archived_records_status');
    await queryRunner.dropIndex('archived_records', 'idx_archived_records_deletion_scheduled');
    await queryRunner.dropIndex('archived_records', 'idx_archived_records_archived_at');
    await queryRunner.dropIndex('archived_records', 'idx_archived_records_original');
    await queryRunner.dropIndex('archived_records', 'idx_archived_records_policy_date');

    await queryRunner.dropIndex('retention_policies', 'idx_retention_policies_last_executed');
    await queryRunner.dropIndex('retention_policies', 'idx_retention_policies_enabled');
    await queryRunner.dropIndex('retention_policies', 'idx_retention_policies_data_type');

    // Drop tables
    await queryRunner.dropTable('archived_records');
    await queryRunner.dropTable('retention_policies');
  }
}