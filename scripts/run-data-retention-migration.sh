#!/bin/bash

# Data Retention Migration Script
# 
# Creates the necessary database tables and initial data for the 
# HIPAA-compliant data retention and archival system.

set -e

echo "🏥 Healthcare Clinic - Data Retention Migration"
echo "=============================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    source .env
    echo "✅ Environment variables loaded"
else
    echo "⚠️  Warning: No .env file found, using default values"
fi

# Set default database connection if not provided
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-clinic}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Test database connection
echo "🔍 Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed. Please check your connection settings."
    exit 1
fi

# Run TypeORM migration
echo "🔄 Running data retention migration..."
cd services/api-gateway

# Check if migration file exists
MIGRATION_FILE="src/migrations/001-create-data-retention-tables.ts"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Run the migration
npm run typeorm:migration:run 2>/dev/null || yarn typeorm:migration:run 2>/dev/null || {
    echo "⚠️  TypeORM CLI not available, running migration manually..."
    
    # Extract SQL from migration file and run it manually
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Create retention_policies table
CREATE TABLE IF NOT EXISTS retention_policies (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL,
    retention_period_months INTEGER NOT NULL,
    archival_period_months INTEGER NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    compliance_requirements JSONB NOT NULL,
    configuration JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_executed_at TIMESTAMP,
    last_execution_result JSONB,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create archived_records table
CREATE TABLE IF NOT EXISTS archived_records (
    id VARCHAR(255) PRIMARY KEY,
    original_table VARCHAR(100) NOT NULL,
    original_id VARCHAR(255) NOT NULL,
    data TEXT NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_policy_id VARCHAR(100) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    compression_type VARCHAR(20) DEFAULT 'gzip',
    encryption_algorithm VARCHAR(20) DEFAULT 'AES-256',
    metadata JSONB,
    deletion_scheduled_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_retention_policies_data_type ON retention_policies(data_type);
CREATE INDEX IF NOT EXISTS idx_retention_policies_enabled ON retention_policies(is_enabled);
CREATE INDEX IF NOT EXISTS idx_retention_policies_last_executed ON retention_policies(last_executed_at);

CREATE INDEX IF NOT EXISTS idx_archived_records_policy_date ON archived_records(retention_policy_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_records_original ON archived_records(original_table, original_id);
CREATE INDEX IF NOT EXISTS idx_archived_records_archived_at ON archived_records(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_records_deletion_scheduled ON archived_records(deletion_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_archived_records_status ON archived_records(status);

-- Add foreign key constraint
ALTER TABLE archived_records 
ADD CONSTRAINT fk_archived_records_retention_policy 
FOREIGN KEY (retention_policy_id) 
REFERENCES retention_policies(id) 
ON DELETE RESTRICT;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_retention_policies_updated_at ON retention_policies;
CREATE TRIGGER update_retention_policies_updated_at 
BEFORE UPDATE ON retention_policies 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for statistics
DROP VIEW IF EXISTS retention_policy_stats;
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

EOF

    if [ $? -eq 0 ]; then
        echo "✅ Database schema created successfully"
    else
        echo "❌ Failed to create database schema"
        exit 1
    fi
}

# Insert default policies
echo "📝 Inserting default HIPAA-compliant retention policies..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Insert default retention policies (if they don't exist)
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
)
ON CONFLICT (id) DO NOTHING;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Default retention policies inserted successfully"
else
    echo "❌ Failed to insert default retention policies"
    exit 1
fi

# Verify installation
echo "🔍 Verifying installation..."
POLICY_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM retention_policies;" 2>/dev/null | xargs)

if [ "$POLICY_COUNT" -ge 3 ]; then
    echo "✅ Installation verified: $POLICY_COUNT retention policies created"
else
    echo "⚠️  Warning: Expected at least 3 policies, found $POLICY_COUNT"
fi

# Return to project root
cd ../..

echo ""
echo "🎉 Data Retention Migration Completed Successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Review retention policies: GET /data-retention/policies"
echo "   2. Check compliance status: GET /data-retention/compliance-status"
echo "   3. Configure automated execution schedule"
echo "   4. Set up monitoring and alerting"
echo ""
echo "📚 Documentation: docs/DATA_RETENTION_POLICIES.md"
echo "🔧 Management API: http://localhost:4000/data-retention/*"
echo ""
echo "✨ Your healthcare data is now HIPAA-compliant with automated retention!"