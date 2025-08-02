-- Migration: Create admin tables for production-ready admin console
-- Version: 001
-- Description: Creates all necessary tables for admin operations

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'admin',
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    mfa_enabled BOOLEAN DEFAULT false,
    totp_secret VARCHAR(32),
    backup_codes JSONB,
    last_login_ip INET,
    last_login_at TIMESTAMP,
    last_password_change_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_locked ON admin_users(locked_until);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_preview VARCHAR(20) NOT NULL,
    client_id UUID NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    permissions JSONB NOT NULL,
    rate_limits JSONB NOT NULL,
    total_requests BIGINT DEFAULT 0,
    requests_this_month BIGINT DEFAULT 0,
    last_used TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    expires_at TIMESTAMP,
    metadata JSONB,
    revocation_reason VARCHAR(500),
    revoked_at TIMESTAMP,
    revoked_by UUID,
    regenerated_at TIMESTAMP,
    regenerated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL
);

-- Create indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_client_id ON api_keys(client_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at);

-- Audit Events Table
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id VARCHAR(100),
    resource_type VARCHAR(50) NOT NULL,
    outcome VARCHAR(20) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(100),
    details JSONB,
    risk_level VARCHAR(20) DEFAULT 'low',
    compliance_flags JSONB,
    data_classification VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_events
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type ON audit_events(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_events_risk_level ON audit_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_events_outcome ON audit_events(outcome);
CREATE INDEX IF NOT EXISTS idx_audit_events_compliance ON audit_events USING GIN(compliance_flags);

-- System Configurations Table
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'string',
    environment VARCHAR(100) DEFAULT 'production',
    service VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    tags JSONB,
    validation JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    modified_by UUID,
    UNIQUE(key, environment)
);

-- Create indexes for system_configs
CREATE INDEX IF NOT EXISTS idx_system_configs_key_env ON system_configs(key, environment);
CREATE INDEX IF NOT EXISTS idx_system_configs_service ON system_configs(service);
CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs(category);
CREATE INDEX IF NOT EXISTS idx_system_configs_secret ON system_configs(is_secret);

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    status VARCHAR(20) DEFAULT 'active',
    alert_type VARCHAR(50) NOT NULL,
    service VARCHAR(100),
    metric VARCHAR(255),
    threshold DECIMAL(10,2),
    current_value DECIMAL(10,2),
    metadata JSONB,
    actions_taken TEXT,
    resolution TEXT,
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    count INTEGER DEFAULT 1,
    last_occurrence TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for system_alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_service ON system_alerts(service);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved_at);

-- Backup Jobs Table
CREATE TABLE IF NOT EXISTS backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'full',
    status VARCHAR(20) DEFAULT 'pending',
    sources JSONB NOT NULL,
    destination VARCHAR(255) NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    compressed BOOLEAN DEFAULT false,
    schedule VARCHAR(100),
    retention_days INTEGER DEFAULT 30,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    size_bytes BIGINT,
    file_count INTEGER,
    progress_percentage DECIMAL(5,2),
    error_message TEXT,
    logs JSONB,
    metadata JSONB,
    checksum_hash VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    cancelled_by UUID
);

-- Create indexes for backup_jobs
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_type ON backup_jobs(type);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_scheduled ON backup_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_completed ON backup_jobs(completed_at);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(100) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    value DECIMAL(15,6) NOT NULL,
    unit VARCHAR(50),
    tags JSONB,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_service ON performance_metrics(service);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_service_name_time ON performance_metrics(service, metric_name, timestamp);

-- Create hypertable for performance_metrics (if TimescaleDB is available)
-- SELECT create_hypertable('performance_metrics', 'timestamp', if_not_exists => TRUE);

-- Insert default admin user (password: Admin123!)
INSERT INTO admin_users (
    email, 
    first_name, 
    last_name, 
    password_hash, 
    role, 
    permissions,
    is_active,
    is_verified
) VALUES (
    'admin@clinic.com',
    'System',
    'Administrator',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeF9h7vJLgmJp2Xk2', -- Admin123!
    'admin',
    '["*"]'::jsonb,
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample system configurations
INSERT INTO system_configs (key, value, type, environment, service, category, description, created_by) VALUES
    ('app.name', 'Clinic Management System', 'string', 'production', NULL, 'application', 'Application name', (SELECT id FROM admin_users WHERE email = 'admin@clinic.com')),
    ('app.version', '1.0.0', 'string', 'production', NULL, 'application', 'Application version', (SELECT id FROM admin_users WHERE email = 'admin@clinic.com')),
    ('security.session_timeout', '3600', 'number', 'production', NULL, 'security', 'Session timeout in seconds', (SELECT id FROM admin_users WHERE email = 'admin@clinic.com')),
    ('security.max_login_attempts', '5', 'number', 'production', NULL, 'security', 'Maximum failed login attempts', (SELECT id FROM admin_users WHERE email = 'admin@clinic.com')),
    ('cache.redis.ttl', '1800', 'number', 'production', 'api-gateway', 'cache', 'Default Redis TTL in seconds', (SELECT id FROM admin_users WHERE email = 'admin@clinic.com')),
    ('backup.retention_days', '90', 'number', 'production', NULL, 'backup', 'Backup retention period in days', (SELECT id FROM admin_users WHERE email = 'admin@clinic.com'))
ON CONFLICT (key, environment) DO NOTHING;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_alerts_updated_at BEFORE UPDATE ON system_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_backup_jobs_updated_at BEFORE UPDATE ON backup_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clinic_admin_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clinic_admin_user;

COMMENT ON TABLE admin_users IS 'Administrative users with elevated privileges for system management';
COMMENT ON TABLE api_keys IS 'API keys for client applications with rate limiting and usage tracking';
COMMENT ON TABLE audit_events IS 'Comprehensive audit trail for all system activities and compliance';
COMMENT ON TABLE system_configs IS 'System configuration parameters with environment and service isolation';
COMMENT ON TABLE system_alerts IS 'System alerts and notifications for monitoring and operations';
COMMENT ON TABLE backup_jobs IS 'Backup job tracking with scheduling and verification capabilities';
COMMENT ON TABLE performance_metrics IS 'Time-series performance metrics for monitoring and analysis';