-- Migration: Create Audit Events Table
-- Description: Creates the comprehensive audit_events table for HIPAA compliance
-- Date: 2024
-- Author: Healthcare Platform Team

-- Create enum types
CREATE TYPE audit_event_type AS ENUM (
  'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED', 'MFA_ENABLED', 'MFA_DISABLED', 'MFA_VERIFIED', 'MFA_FAILED',
  'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'PATIENT_DATA_VIEWED', 'PATIENT_DATA_CREATED',
  'PATIENT_DATA_UPDATED', 'PATIENT_DATA_DELETED', 'PATIENT_DATA_EXPORTED', 'PATIENT_SEARCH_PERFORMED',
  'MEDICAL_RECORD_ACCESSED', 'MEDICAL_RECORD_MODIFIED', 'CLINICAL_NOTES_VIEWED', 'CLINICAL_NOTES_CREATED',
  'CLINICAL_NOTES_UPDATED', 'LAB_RESULTS_ACCESSED', 'PRESCRIPTION_ACCESSED', 'IMAGING_ACCESSED',
  'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_SUSPENDED', 'USER_REACTIVATED',
  'ROLE_CHANGED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'ADMIN_IMPERSONATION_STARTED',
  'ADMIN_IMPERSONATION_ENDED', 'SYSTEM_CONFIGURATION_CHANGED', 'BACKUP_CREATED', 'BACKUP_RESTORED',
  'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'INVALID_TOKEN',
  'TOKEN_EXPIRED', 'CSRF_DETECTED', 'SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT', 'BRUTE_FORCE_ATTEMPT',
  'PRIVILEGE_ESCALATION_ATTEMPT', 'DATA_BREACH_DETECTED', 'SECURITY_POLICY_VIOLATION',
  'FILE_UPLOADED', 'FILE_DOWNLOADED', 'FILE_DELETED', 'FILE_SHARED', 'DOCUMENT_PRINTED',
  'DOCUMENT_EMAILED', 'DOCUMENT_FAXED', 'MESSAGE_SENT', 'MESSAGE_RECEIVED', 'EMAIL_SENT',
  'SMS_SENT', 'APPOINTMENT_REMINDER_SENT', 'COMMUNICATION_CONSENT_UPDATED', 'APPOINTMENT_CREATED',
  'APPOINTMENT_UPDATED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_CHECKED_IN', 'APPOINTMENT_NO_SHOW',
  'SCHEDULE_ACCESSED', 'INVOICE_CREATED', 'PAYMENT_PROCESSED', 'PAYMENT_FAILED', 'REFUND_PROCESSED',
  'BILLING_INFORMATION_UPDATED', 'INSURANCE_CLAIM_SUBMITTED', 'SYSTEM_STARTUP', 'SYSTEM_SHUTDOWN',
  'SERVICE_UNAVAILABLE', 'DATABASE_CONNECTION_FAILED', 'API_RATE_LIMIT_CONFIGURED',
  'MAINTENANCE_MODE_ENABLED', 'MAINTENANCE_MODE_DISABLED', 'AUDIT_LOG_ACCESSED', 'AUDIT_LOG_EXPORTED',
  'COMPLIANCE_REPORT_GENERATED', 'DATA_RETENTION_POLICY_APPLIED', 'GDPR_REQUEST_RECEIVED',
  'HIPAA_VIOLATION_DETECTED', 'BREACH_NOTIFICATION_SENT', 'EXTERNAL_API_CALLED', 'EXTERNAL_API_FAILED',
  'WEBHOOK_RECEIVED', 'DATA_SYNC_STARTED', 'DATA_SYNC_COMPLETED', 'DATA_SYNC_FAILED',
  'AI_MODEL_ACCESSED', 'AI_PREDICTION_MADE', 'ANALYTICS_REPORT_VIEWED', 'DATA_ANALYSIS_PERFORMED'
);

CREATE TYPE audit_category AS ENUM (
  'AUTHENTICATION', 'DATA_ACCESS', 'ADMINISTRATIVE', 'SECURITY', 'SYSTEM',
  'COMMUNICATION', 'FINANCIAL', 'COMPLIANCE', 'INTEGRATION', 'CLINICAL',
  'FILE_MANAGEMENT', 'AI_ANALYTICS'
);

CREATE TYPE audit_severity AS ENUM (
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
);

CREATE TYPE risk_level AS ENUM (
  'MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'SEVERE', 'CRITICAL'
);

CREATE TYPE compliance_framework AS ENUM (
  'HIPAA', 'GDPR', 'SOX', 'PCI_DSS', 'HITECH', 'FERPA', 'SOC2'
);

CREATE TYPE device_type AS ENUM (
  'DESKTOP', 'MOBILE', 'TABLET', 'KIOSK', 'API_CLIENT', 'UNKNOWN'
);

-- Create the main audit_events table
CREATE TABLE audit_events (
  -- Primary identification
  id VARCHAR(50) PRIMARY KEY,
  event_type audit_event_type NOT NULL,
  category audit_category NOT NULL,
  severity audit_severity NOT NULL,
  
  -- User information
  user_id UUID,
  user_role VARCHAR(50),
  patient_id UUID,
  target_user_id UUID,
  
  -- Event description
  description TEXT NOT NULL,
  
  -- Network and session information
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Resource information
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  endpoint VARCHAR(255),
  http_method VARCHAR(10),
  response_status INTEGER,
  response_time INTEGER,
  
  -- Additional context
  additional_data JSONB,
  geolocation VARCHAR(255),
  device_type device_type,
  client_application VARCHAR(100),
  
  -- Alert and review management
  requires_alert BOOLEAN DEFAULT FALSE,
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  
  -- Compliance and risk assessment
  compliance_framework compliance_framework,
  risk_level risk_level,
  data_exported BOOLEAN DEFAULT FALSE,
  records_affected INTEGER,
  
  -- Timestamps
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- System metadata
  source_system VARCHAR(100),
  schema_version VARCHAR(50),
  data_hash TEXT,
  suspicious_activity BOOLEAN DEFAULT FALSE,
  correlation_id VARCHAR(100),
  
  -- HIPAA-specific metadata
  hipaa_metadata JSONB,
  include_in_compliance_report BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_patient_id ON audit_events(patient_id);
CREATE INDEX idx_audit_events_category_severity ON audit_events(category, severity);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_ip_address ON audit_events(ip_address);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);
CREATE INDEX idx_audit_events_correlation_id ON audit_events(correlation_id);
CREATE INDEX idx_audit_events_suspicious ON audit_events(suspicious_activity) WHERE suspicious_activity = TRUE;
CREATE INDEX idx_audit_events_compliance ON audit_events(include_in_compliance_report) WHERE include_in_compliance_report = TRUE;
CREATE INDEX idx_audit_events_patient_timestamp ON audit_events(patient_id, timestamp) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_audit_events_user_timestamp ON audit_events(user_id, timestamp) WHERE user_id IS NOT NULL;

-- Create partial indexes for common queries
CREATE INDEX idx_audit_events_recent ON audit_events(timestamp DESC) WHERE timestamp > (CURRENT_TIMESTAMP - INTERVAL '30 days');
CREATE INDEX idx_audit_events_security ON audit_events(timestamp DESC) WHERE category = 'SECURITY';
CREATE INDEX idx_audit_events_data_access ON audit_events(timestamp DESC) WHERE category = 'DATA_ACCESS' OR category = 'CLINICAL';

-- Create GIN index for JSONB columns
CREATE INDEX idx_audit_events_additional_data ON audit_events USING GIN(additional_data);
CREATE INDEX idx_audit_events_hipaa_metadata ON audit_events USING GIN(hipaa_metadata);

-- Add table comments
COMMENT ON TABLE audit_events IS 'Comprehensive audit trail for HIPAA compliance and security monitoring';
COMMENT ON COLUMN audit_events.id IS 'Unique audit event identifier';
COMMENT ON COLUMN audit_events.event_type IS 'Type of audit event that occurred';
COMMENT ON COLUMN audit_events.category IS 'Category classification of the audit event';
COMMENT ON COLUMN audit_events.severity IS 'Severity level of the audit event';
COMMENT ON COLUMN audit_events.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_events.patient_id IS 'ID of the patient whose data was accessed (HIPAA)';
COMMENT ON COLUMN audit_events.description IS 'Human-readable description of the event';
COMMENT ON COLUMN audit_events.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN audit_events.additional_data IS 'Additional structured data related to the event';
COMMENT ON COLUMN audit_events.hipaa_metadata IS 'HIPAA-specific metadata for compliance reporting';
COMMENT ON COLUMN audit_events.timestamp IS 'When the audit event occurred';
COMMENT ON COLUMN audit_events.include_in_compliance_report IS 'Whether this event should be included in compliance reports';

-- Create a view for common audit queries
CREATE VIEW recent_audit_events AS
SELECT 
  id,
  event_type,
  category,
  severity,
  user_id,
  patient_id,
  description,
  ip_address,
  timestamp,
  requires_alert,
  suspicious_activity
FROM audit_events 
WHERE timestamp > (CURRENT_TIMESTAMP - INTERVAL '7 days')
ORDER BY timestamp DESC;

-- Create a view for compliance reporting
CREATE VIEW compliance_audit_events AS
SELECT 
  id,
  event_type,
  category,
  severity,
  user_id,
  patient_id,
  description,
  timestamp,
  hipaa_metadata,
  data_exported,
  records_affected
FROM audit_events 
WHERE include_in_compliance_report = TRUE
ORDER BY timestamp DESC;

-- Create a view for security events
CREATE VIEW security_audit_events AS
SELECT 
  id,
  event_type,
  severity,
  user_id,
  ip_address,
  description,
  timestamp,
  suspicious_activity,
  additional_data
FROM audit_events 
WHERE category = 'SECURITY' OR suspicious_activity = TRUE
ORDER BY timestamp DESC;

-- Add row-level security policy (if needed)
-- ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Create a function to automatically set created_at
CREATE OR REPLACE FUNCTION set_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set created_at
CREATE TRIGGER trigger_set_created_at
  BEFORE INSERT ON audit_events
  FOR EACH ROW
  EXECUTE FUNCTION set_created_at();

-- Create a function for audit event statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(
  start_date TIMESTAMP,
  end_date TIMESTAMP
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_events', COUNT(*),
    'events_by_category', json_object_agg(category, category_count),
    'events_by_severity', json_object_agg(severity, severity_count),
    'security_events', SUM(CASE WHEN category = 'SECURITY' THEN 1 ELSE 0 END),
    'patient_access_events', SUM(CASE WHEN patient_id IS NOT NULL THEN 1 ELSE 0 END)
  ) INTO result
  FROM (
    SELECT 
      category,
      severity,
      COUNT(*) OVER (PARTITION BY category) as category_count,
      COUNT(*) OVER (PARTITION BY severity) as severity_count
    FROM audit_events
    WHERE timestamp BETWEEN start_date AND end_date
  ) stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT SELECT, INSERT ON audit_events TO clinic_app;
GRANT SELECT ON recent_audit_events TO clinic_app;
GRANT SELECT ON compliance_audit_events TO clinic_app;
GRANT SELECT ON security_audit_events TO clinic_app;
GRANT EXECUTE ON FUNCTION get_audit_statistics TO clinic_app;

-- Create indexes for audit retention cleanup
CREATE INDEX idx_audit_events_cleanup_security ON audit_events(timestamp) WHERE category = 'SECURITY';
CREATE INDEX idx_audit_events_cleanup_data_access ON audit_events(timestamp) WHERE category IN ('DATA_ACCESS', 'CLINICAL');
CREATE INDEX idx_audit_events_cleanup_admin ON audit_events(timestamp) WHERE category = 'ADMINISTRATIVE';
CREATE INDEX idx_audit_events_cleanup_system ON audit_events(timestamp) WHERE category = 'SYSTEM';

-- Insert initial configuration audit event
INSERT INTO audit_events (
  id,
  event_type,
  category,
  severity,
  description,
  timestamp,
  source_system,
  include_in_compliance_report
) VALUES (
  'AUD_INIT_' || extract(epoch from now())::text,
  'SYSTEM_STARTUP',
  'SYSTEM',
  'MEDIUM',
  'Audit events table created and initialized',
  CURRENT_TIMESTAMP,
  'database-migration',
  TRUE
);