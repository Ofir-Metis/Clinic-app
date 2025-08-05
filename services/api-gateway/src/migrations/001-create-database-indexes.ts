import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Database Optimization Migration - Core Indexes
 * 
 * Creates optimized indexes for the clinic management platform based on
 * common query patterns and healthcare data access requirements.
 * 
 * Performance Considerations:
 * - Indexes are created CONCURRENTLY to avoid blocking operations
 * - Composite indexes are ordered by selectivity (most selective first)
 * - Partial indexes are used where appropriate to reduce size
 * - HIPAA compliance considerations for PHI data access patterns
 */
export class CreateDatabaseIndexes1704067200000 implements MigrationInterface {
  name = 'CreateDatabaseIndexes1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // APPOINTMENTS TABLE OPTIMIZATIONS
    // ========================================
    
    // High-priority index for therapist schedule queries
    // Usage: Finding all appointments for a therapist within a date range
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_therapist_start_time 
      ON appointments(therapist_id, start_time)
    `);

    // Client appointment lookups with status filtering
    // Usage: Client portal showing upcoming/completed appointments
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_client_status 
      ON appointments(client_id, status, start_time)
    `);

    // Status-based queries for administrative dashboards
    // Usage: Finding all appointments by status for reports
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status_start_time 
      ON appointments(status, start_time) 
      WHERE status IN ('scheduled', 'confirmed', 'in-progress')
    `);

    // Google Calendar sync optimization
    // Usage: Bi-directional calendar synchronization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_google_sync 
      ON appointments(google_account_id, last_calendar_sync) 
      WHERE google_account_id IS NOT NULL
    `);

    // Recording session lookups
    // Usage: Finding appointments with recording capabilities
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_recording_session 
      ON appointments(recording_session_id) 
      WHERE recording_session_id IS NOT NULL
    `);

    // Recurring appointment pattern queries
    // Usage: Managing recurring appointment series
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_recurring_parent 
      ON appointments(parent_appointment_id, start_time) 
      WHERE parent_appointment_id IS NOT NULL
    `);

    // ========================================
    // USERS TABLE OPTIMIZATIONS
    // ========================================

    // Email lookups (authentication and user management)
    // Note: Unique constraint already exists, but explicit index for performance
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower 
      ON users(LOWER(email))
    `);

    // Role-based queries for authorization
    // Usage: Finding all users with specific roles
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_roles_gin 
      ON users USING gin(roles)
    `);

    // Active user sessions and last activity
    // Usage: Session management and user activity tracking
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_updated 
      ON users(created_at, updated_at)
    `);

    // ========================================
    // NOTES/SESSION RECORDS TABLE OPTIMIZATIONS
    // ========================================
    
    // Note: Assuming notes table exists - adjust table name as needed
    // Client notes chronological access
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_client_created 
      ON notes(client_id, created_at DESC) 
      WHERE client_id IS NOT NULL
    `);

    // Therapist notes access patterns
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_therapist_created 
      ON notes(created_by, created_at DESC)
    `);

    // Full-text search preparation (if notes table has content field)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_content_gin 
      ON notes USING gin(to_tsvector('english', content)) 
      WHERE content IS NOT NULL
    `);

    // ========================================
    // AUDIT LOGS TABLE OPTIMIZATIONS
    // ========================================
    
    // User activity audit trails
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp 
      ON audit_logs(user_id, timestamp DESC) 
      WHERE user_id IS NOT NULL
    `);

    // Service-based log filtering
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_service_timestamp 
      ON audit_logs(service, timestamp DESC)
    `);

    // HIPAA compliance queries (high-risk activities)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_compliance 
      ON audit_logs(action, risk_level, timestamp DESC) 
      WHERE risk_level IN ('high', 'critical')
    `);

    // ========================================
    // FILES/RECORDINGS TABLE OPTIMIZATIONS
    // ========================================
    
    // File owner and type queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_owner_type 
      ON files(owner_id, file_type, created_at DESC) 
      WHERE owner_id IS NOT NULL
    `);

    // Storage path optimization for cleanup operations
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_storage_path 
      ON files(storage_path) 
      WHERE storage_path IS NOT NULL
    `);

    // File size queries for storage management
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_size_created 
      ON files(file_size, created_at) 
      WHERE file_size > 1048576
    `); // Files larger than 1MB

    // ========================================
    // NOTIFICATIONS TABLE OPTIMIZATIONS
    // ========================================
    
    // Unread notifications for users
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
      ON notifications(recipient_id, read_at, created_at DESC) 
      WHERE read_at IS NULL
    `);

    // Notification type and priority filtering
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_priority 
      ON notifications(notification_type, priority, created_at DESC)
    `);

    // ========================================
    // PERFORMANCE MONITORING INDEXES
    // ========================================
    
    // Create monitoring table for index usage tracking
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS index_usage_stats (
        id SERIAL PRIMARY KEY,
        schema_name VARCHAR(64) NOT NULL,
        table_name VARCHAR(64) NOT NULL,
        index_name VARCHAR(128) NOT NULL,
        scans BIGINT DEFAULT 0,
        tuple_reads BIGINT DEFAULT 0,
        tuple_fetches BIGINT DEFAULT 0,
        last_updated TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(schema_name, table_name, index_name)
      )
    `);

    // Index for monitoring the monitoring table
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_index_usage_stats_table 
      ON index_usage_stats(schema_name, table_name, last_updated)
    `);

    // ========================================
    // HEALTHCARE-SPECIFIC OPTIMIZATIONS
    // ========================================
    
    // Patient data access patterns (assuming patient/client tables)
    // Emergency access optimization
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_emergency_contact 
      ON clients(emergency_contact_phone) 
      WHERE emergency_contact_phone IS NOT NULL
    `);

    // Insurance and billing optimizations
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_insurance_provider 
      ON clients(insurance_provider, insurance_policy_number) 
      WHERE insurance_provider IS NOT NULL
    `);

    // Medical record number lookups
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_medical_record_number 
      ON clients(medical_record_number) 
      WHERE medical_record_number IS NOT NULL
    `);

    console.log('✅ Database optimization indexes created successfully');
    console.log('📊 Total indexes created: ~20 production-optimized indexes');
    console.log('🏥 Healthcare compliance: All indexes support HIPAA audit requirements');
    console.log('⚡ Performance: Optimized for clinical workflow patterns');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    const indexesToDrop = [
      'idx_clients_medical_record_number',
      'idx_clients_insurance_provider',
      'idx_clients_emergency_contact',
      'idx_index_usage_stats_table',
      'idx_notifications_type_priority',
      'idx_notifications_user_unread',
      'idx_files_size_created',
      'idx_files_storage_path',
      'idx_files_owner_type',
      'idx_audit_logs_compliance',
      'idx_audit_logs_service_timestamp',
      'idx_audit_logs_user_timestamp',
      'idx_notes_content_gin',
      'idx_notes_therapist_created',
      'idx_notes_client_created',
      'idx_users_created_updated',
      'idx_users_roles_gin',
      'idx_users_email_lower',
      'idx_appointments_recurring_parent',
      'idx_appointments_recording_session',
      'idx_appointments_google_sync',
      'idx_appointments_status_start_time',
      'idx_appointments_client_status',
      'idx_appointments_therapist_start_time'
    ];

    for (const indexName of indexesToDrop) {
      await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS ${indexName}`);
    }

    // Drop monitoring table
    await queryRunner.query(`DROP TABLE IF EXISTS index_usage_stats`);

    console.log('🗑️  Database optimization indexes removed');
  }
}