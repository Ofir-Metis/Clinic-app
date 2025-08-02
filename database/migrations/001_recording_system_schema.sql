-- ===================================================================
-- CLINIC RECORDING SYSTEM - COMPREHENSIVE DATABASE SCHEMA
-- ===================================================================
-- This schema supports the complete coaching session recording pipeline
-- with proper indexing, constraints, and performance optimizations

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- RECORDING CORE TABLES
-- ===================================================================

-- Recordings table - Core recording metadata and files
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    duration INTEGER, -- duration in seconds
    
    -- Session metadata
    appointment_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    participant_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    
    -- Recording configuration
    recording_mode VARCHAR(20) NOT NULL CHECK (recording_mode IN ('audio', 'video', 'screen')),
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('online', 'offline', 'hybrid')),
    quality VARCHAR(20) DEFAULT 'standard' CHECK (quality IN ('low', 'standard', 'high', 'ultra')),
    
    -- Status and processing
    status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploading', 'uploaded', 'processing', 'completed', 'failed', 'archived')),
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'transcribing', 'analyzing', 'completed', 'failed')),
    
    -- Storage information
    storage_provider VARCHAR(50) DEFAULT 'minio',
    bucket_name VARCHAR(255),
    encryption_key_id VARCHAR(255),
    
    -- AI Processing results (will be populated by AI service)
    transcription_id UUID,
    summary_id UUID,
    insights_id UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ===================================================================
-- AI PROCESSING TABLES
-- ===================================================================

-- Transcriptions table - AI-generated transcripts
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    
    -- Transcription content
    text TEXT NOT NULL,
    segments JSONB, -- Individual segments with timestamps
    language VARCHAR(10) DEFAULT 'en',
    confidence DECIMAL(5,4), -- 0.0000 to 1.0000
    
    -- Speaker identification
    speaker_labels JSONB, -- Speaker diarization results
    speaker_count INTEGER DEFAULT 1,
    
    -- Processing metadata
    model_used VARCHAR(100) DEFAULT 'whisper-1',
    processing_time INTEGER, -- processing time in milliseconds
    cost DECIMAL(10,4), -- processing cost in USD
    
    -- Quality metrics
    word_count INTEGER,
    estimated_accuracy DECIMAL(5,4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session summaries table - AI-generated session summaries
CREATE TABLE session_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
    transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    
    -- Summary content
    key_points JSONB NOT NULL, -- Array of key discussion points
    main_topics JSONB, -- Primary topics covered
    action_items JSONB, -- Action items and follow-ups
    insights JSONB, -- Key insights and observations
    
    -- Session context
    session_context JSONB, -- Coach name, client name, goals, etc.
    next_session_focus TEXT,
    challenges_identified JSONB,
    progress_notes TEXT,
    
    -- AI Analysis
    sentiment_analysis JSONB, -- Overall sentiment and emotions
    engagement_score DECIMAL(3,2), -- 0.00 to 10.00
    session_quality_score DECIMAL(3,2), -- 0.00 to 10.00
    
    -- Processing metadata
    model_used VARCHAR(100) DEFAULT 'gpt-4',
    processing_time INTEGER,
    cost DECIMAL(10,4),
    confidence DECIMAL(5,4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coaching insights table - AI-generated coaching recommendations
CREATE TABLE coaching_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
    summary_id UUID REFERENCES session_summaries(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    
    -- Insight categories
    strengths JSONB, -- Client strengths identified
    challenges JSONB, -- Challenges and areas for improvement
    recommendations JSONB, -- Coaching recommendations
    next_session_questions JSONB, -- Suggested questions for next session
    
    -- Progress tracking
    goal_progress JSONB, -- Progress on specific goals
    mood_indicators JSONB, -- Mood and emotional indicators
    behavioral_patterns JSONB, -- Observed behavioral patterns
    
    -- Coach feedback
    coach_effectiveness JSONB, -- Analysis of coaching effectiveness
    communication_style JSONB, -- Communication style analysis
    suggested_techniques JSONB, -- Suggested coaching techniques
    
    -- Predictive analysis
    success_probability DECIMAL(5,4), -- Predicted client success probability
    risk_factors JSONB, -- Identified risk factors
    intervention_suggestions JSONB, -- Suggested interventions
    
    -- Processing metadata
    model_used VARCHAR(100) DEFAULT 'gpt-4',
    processing_time INTEGER,
    cost DECIMAL(10,4),
    confidence DECIMAL(5,4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- PROGRAM AND CLIENT MANAGEMENT TABLES
-- ===================================================================

-- Program templates table
CREATE TABLE program_templates (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Program structure
    modules JSONB NOT NULL, -- Program modules and lessons
    duration INTEGER NOT NULL, -- Duration in weeks
    total_sessions INTEGER NOT NULL,
    
    -- Pricing and enrollment
    price DECIMAL(10,2),
    enrollment_limit INTEGER,
    prerequisites JSONB,
    
    -- Content and resources
    materials JSONB, -- Program materials and resources
    assessments JSONB, -- Assessments and evaluations
    certification_criteria JSONB,
    
    -- Metadata
    tags JSONB,
    target_audience TEXT,
    learning_outcomes JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Client program enrollments
CREATE TABLE program_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(255) NOT NULL,
    program_id VARCHAR(255) NOT NULL REFERENCES program_templates(id),
    coach_id VARCHAR(255),
    
    -- Enrollment details
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date TIMESTAMP WITH TIME ZONE,
    expected_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    
    -- Progress tracking
    current_module INTEGER DEFAULT 1,
    current_lesson INTEGER DEFAULT 1,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_modules JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'active', 'paused', 'completed', 'dropped', 'cancelled')),
    
    -- Assessment and outcomes
    initial_assessment JSONB,
    progress_assessments JSONB DEFAULT '[]',
    final_assessment JSONB,
    completion_certificate_id VARCHAR(255),
    
    -- Custom fields
    custom_goals JSONB,
    custom_schedule JSONB,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client onboarding progress
CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_email VARCHAR(255) NOT NULL UNIQUE,
    client_id VARCHAR(255),
    
    -- Onboarding steps
    current_step INTEGER DEFAULT 1,
    completed_steps JSONB DEFAULT '[]',
    total_steps INTEGER DEFAULT 8,
    
    -- Step data
    step_data JSONB DEFAULT '{}', -- Data collected from each step
    
    -- Assessment results
    personality_assessment JSONB,
    goals_assessment JSONB,
    preferences_assessment JSONB,
    lifestyle_assessment JSONB,
    
    -- Recommendations
    recommended_programs JSONB,
    recommended_coaches JSONB,
    recommended_schedule JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned')),
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    referral_source VARCHAR(255),
    user_agent TEXT,
    ip_address INET
);

-- ===================================================================
-- ANALYTICS AND REPORTING TABLES
-- ===================================================================

-- Session analytics aggregated data
CREATE TABLE session_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    coach_id VARCHAR(255),
    client_id VARCHAR(255),
    program_id VARCHAR(255),
    
    -- Session metrics
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    cancelled_sessions INTEGER DEFAULT 0,
    no_show_sessions INTEGER DEFAULT 0,
    
    -- Duration metrics
    total_duration INTEGER DEFAULT 0, -- in minutes
    average_duration DECIMAL(5,2) DEFAULT 0.00,
    
    -- Quality metrics
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    engagement_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Recording metrics
    recorded_sessions INTEGER DEFAULT 0,
    total_recording_size BIGINT DEFAULT 0,
    ai_processed_sessions INTEGER DEFAULT 0,
    
    -- Financial metrics
    revenue DECIMAL(10,2) DEFAULT 0.00,
    ai_processing_costs DECIMAL(10,4) DEFAULT 0.0000,
    storage_costs DECIMAL(10,4) DEFAULT 0.0000,
    
    -- Client progress metrics
    goals_achieved INTEGER DEFAULT 0,
    action_items_completed INTEGER DEFAULT 0,
    client_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Updated timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint on date and identifiers
    UNIQUE(date, coach_id, client_id, program_id)
);

-- Recording analytics aggregated data
CREATE TABLE recording_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- Volume metrics
    total_recordings INTEGER DEFAULT 0,
    total_file_size BIGINT DEFAULT 0,
    average_file_size BIGINT DEFAULT 0,
    total_duration INTEGER DEFAULT 0, -- in seconds
    
    -- Processing metrics
    transcriptions_completed INTEGER DEFAULT 0,
    summaries_generated INTEGER DEFAULT 0,
    insights_generated INTEGER DEFAULT 0,
    processing_failures INTEGER DEFAULT 0,
    
    -- Quality metrics
    average_transcription_accuracy DECIMAL(5,4) DEFAULT 0.0000,
    average_confidence_score DECIMAL(5,4) DEFAULT 0.0000,
    average_processing_time INTEGER DEFAULT 0, -- in milliseconds
    
    -- Cost metrics
    total_transcription_cost DECIMAL(10,4) DEFAULT 0.0000,
    total_ai_processing_cost DECIMAL(10,4) DEFAULT 0.0000,
    total_storage_cost DECIMAL(10,4) DEFAULT 0.0000,
    cost_per_minute DECIMAL(8,4) DEFAULT 0.0000,
    
    -- Storage metrics by provider
    minio_storage_used BIGINT DEFAULT 0,
    s3_storage_used BIGINT DEFAULT 0,
    
    -- Updated timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint on date
    UNIQUE(date)
);

-- Business metrics aggregated data
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    subscription_revenue DECIMAL(12,2) DEFAULT 0.00,
    session_revenue DECIMAL(12,2) DEFAULT 0.00,
    program_revenue DECIMAL(12,2) DEFAULT 0.00,
    
    -- Client metrics
    total_clients INTEGER DEFAULT 0,
    new_clients INTEGER DEFAULT 0,
    active_clients INTEGER DEFAULT 0,
    churned_clients INTEGER DEFAULT 0,
    
    -- Coach metrics
    total_coaches INTEGER DEFAULT 0,
    active_coaches INTEGER DEFAULT 0,
    coach_utilization_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Program metrics
    program_enrollments INTEGER DEFAULT 0,
    program_completions INTEGER DEFAULT 0,
    program_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Operational metrics
    total_costs DECIMAL(12,2) DEFAULT 0.00,
    ai_processing_costs DECIMAL(10,4) DEFAULT 0.0000,
    storage_costs DECIMAL(10,4) DEFAULT 0.0000,
    infrastructure_costs DECIMAL(10,2) DEFAULT 0.00,
    
    -- Efficiency metrics
    customer_acquisition_cost DECIMAL(10,2) DEFAULT 0.00,
    customer_lifetime_value DECIMAL(10,2) DEFAULT 0.00,
    profit_margin DECIMAL(5,2) DEFAULT 0.00,
    
    -- Updated timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(date, period_type)
);

-- ===================================================================
-- GOOGLE CALENDAR INTEGRATION TABLES
-- ===================================================================

-- Google calendar sync status
CREATE TABLE calendar_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    google_calendar_id VARCHAR(255) NOT NULL,
    
    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Webhook configuration
    webhook_id VARCHAR(255),
    webhook_expiration TIMESTAMP WITH TIME ZONE,
    webhook_url TEXT,
    
    -- Sync status
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active' CHECK (sync_status IN ('active', 'paused', 'error', 'expired')),
    sync_errors JSONB,
    
    -- Sync statistics
    events_synced INTEGER DEFAULT 0,
    last_event_sync_token VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Synced calendar events
CREATE TABLE synced_calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    google_event_id VARCHAR(255) NOT NULL,
    calendar_id VARCHAR(255) NOT NULL,
    
    -- Event details
    title VARCHAR(500),
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(100),
    
    -- Event status
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    event_type VARCHAR(50) DEFAULT 'coaching_session',
    
    -- Participant information
    attendees JSONB,
    organizer JSONB,
    client_email VARCHAR(255),
    
    -- Coaching session metadata
    session_id VARCHAR(255),
    appointment_id VARCHAR(255),
    program_id VARCHAR(255),
    
    -- Sync metadata
    last_modified TIMESTAMP WITH TIME ZONE,
    sync_version VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(google_event_id, calendar_id)
);

-- ===================================================================
-- SECURITY AND AUDIT TABLES
-- ===================================================================

-- Audit log for all recording-related activities
CREATE TABLE recording_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entity information
    entity_type VARCHAR(50) NOT NULL, -- 'recording', 'transcription', 'summary', etc.
    entity_id UUID,
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- 'create', 'read', 'update', 'delete', 'download', 'process'
    action_details JSONB,
    
    -- User context
    user_id VARCHAR(255),
    user_role VARCHAR(50),
    user_email VARCHAR(255),
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    session_id VARCHAR(255),
    
    -- Result
    result VARCHAR(20) NOT NULL CHECK (result IN ('success', 'failure', 'partial')),
    error_details JSONB,
    
    -- Compliance
    data_accessed JSONB, -- What data was accessed
    retention_policy VARCHAR(100),
    legal_hold BOOLEAN DEFAULT FALSE,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API key management for external integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key
    
    -- Key metadata
    service_name VARCHAR(100) NOT NULL, -- 'openai', 'google', etc.
    permissions JSONB NOT NULL, -- Array of allowed permissions
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    rate_limit_window INTEGER DEFAULT 3600, -- in seconds
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Ownership
    created_by VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===================================================================

-- Recording table indexes
CREATE INDEX idx_recordings_session_id ON recordings(session_id);
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_appointment_id ON recordings(appointment_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_recordings_created_at ON recordings(created_at);
CREATE INDEX idx_recordings_user_created ON recordings(user_id, created_at);
CREATE INDEX idx_recordings_session_status ON recordings(session_id, status);

-- Transcription indexes
CREATE INDEX idx_transcriptions_recording_id ON transcriptions(recording_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at);
CREATE INDEX idx_transcriptions_language ON transcriptions(language);
CREATE INDEX idx_transcriptions_confidence ON transcriptions(confidence);

-- Summary indexes
CREATE INDEX idx_summaries_recording_id ON session_summaries(recording_id);
CREATE INDEX idx_summaries_session_id ON session_summaries(session_id);
CREATE INDEX idx_summaries_created_at ON session_summaries(created_at);

-- Insights indexes
CREATE INDEX idx_insights_recording_id ON coaching_insights(recording_id);
CREATE INDEX idx_insights_session_id ON coaching_insights(session_id);
CREATE INDEX idx_insights_created_at ON coaching_insights(created_at);

-- Program template indexes
CREATE INDEX idx_program_templates_category ON program_templates(category);
CREATE INDEX idx_program_templates_level ON program_templates(level);
CREATE INDEX idx_program_templates_status ON program_templates(status);
CREATE INDEX idx_program_templates_created_at ON program_templates(created_at);

-- Enrollment indexes
CREATE INDEX idx_enrollments_client_id ON program_enrollments(client_id);
CREATE INDEX idx_enrollments_program_id ON program_enrollments(program_id);
CREATE INDEX idx_enrollments_coach_id ON program_enrollments(coach_id);
CREATE INDEX idx_enrollments_status ON program_enrollments(status);
CREATE INDEX idx_enrollments_enrollment_date ON program_enrollments(enrollment_date);

-- Onboarding indexes
CREATE INDEX idx_onboarding_client_email ON onboarding_progress(client_email);
CREATE INDEX idx_onboarding_status ON onboarding_progress(status);
CREATE INDEX idx_onboarding_started_at ON onboarding_progress(started_at);

-- Analytics indexes
CREATE INDEX idx_session_analytics_date ON session_analytics(date);
CREATE INDEX idx_session_analytics_coach_date ON session_analytics(coach_id, date);
CREATE INDEX idx_session_analytics_client_date ON session_analytics(client_id, date);
CREATE INDEX idx_recording_analytics_date ON recording_analytics(date);
CREATE INDEX idx_business_metrics_date ON business_metrics(date, period_type);

-- Calendar integration indexes
CREATE INDEX idx_calendar_sync_user_id ON calendar_sync_status(user_id);
CREATE INDEX idx_calendar_sync_webhook_exp ON calendar_sync_status(webhook_expiration);
CREATE INDEX idx_synced_events_user_id ON synced_calendar_events(user_id);
CREATE INDEX idx_synced_events_google_id ON synced_calendar_events(google_event_id);
CREATE INDEX idx_synced_events_start_time ON synced_calendar_events(start_time);
CREATE INDEX idx_synced_events_session_id ON synced_calendar_events(session_id);

-- Audit and security indexes
CREATE INDEX idx_audit_log_entity ON recording_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user_id ON recording_audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON recording_audit_log(created_at);
CREATE INDEX idx_audit_log_action ON recording_audit_log(action);
CREATE INDEX idx_api_keys_service ON api_keys(service_name);
CREATE INDEX idx_api_keys_status ON api_keys(status);

-- ===================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ===================================================================

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers to relevant tables
CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON recordings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transcriptions_updated_at BEFORE UPDATE ON transcriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON session_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON coaching_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_program_templates_updated_at BEFORE UPDATE ON program_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON program_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_sync_updated_at BEFORE UPDATE ON calendar_sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_synced_events_updated_at BEFORE UPDATE ON synced_calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- VIEWS FOR COMMON QUERIES
-- ===================================================================

-- Recording summary view with all related data
CREATE VIEW recording_summary_view AS
SELECT 
    r.id,
    r.filename,
    r.session_id,
    r.appointment_id,
    r.user_id,
    r.user_role,
    r.duration,
    r.file_size,
    r.status,
    r.processing_status,
    r.created_at,
    
    -- Transcription info
    t.id as transcription_id,
    t.text as transcript_text,
    t.confidence as transcription_confidence,
    t.language,
    t.word_count,
    
    -- Summary info
    s.id as summary_id,
    s.key_points,
    s.action_items,
    s.insights as summary_insights,
    s.sentiment_analysis,
    s.engagement_score,
    
    -- Coaching insights
    ci.strengths,
    ci.challenges,
    ci.recommendations,
    ci.success_probability
    
FROM recordings r
LEFT JOIN transcriptions t ON r.id = t.recording_id
LEFT JOIN session_summaries s ON r.id = s.recording_id
LEFT JOIN coaching_insights ci ON r.id = ci.recording_id
WHERE r.deleted_at IS NULL;

-- Analytics dashboard view
CREATE VIEW analytics_dashboard_view AS
SELECT 
    CURRENT_DATE as report_date,
    
    -- Today's metrics
    (SELECT COUNT(*) FROM recordings WHERE DATE(created_at) = CURRENT_DATE) as todays_recordings,
    (SELECT COUNT(*) FROM transcriptions WHERE DATE(created_at) = CURRENT_DATE) as todays_transcriptions,
    (SELECT COUNT(*) FROM session_summaries WHERE DATE(created_at) = CURRENT_DATE) as todays_summaries,
    
    -- Weekly metrics
    (SELECT COUNT(*) FROM recordings WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_recordings,
    (SELECT AVG(confidence) FROM transcriptions WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_avg_confidence,
    (SELECT SUM(file_size) FROM recordings WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_storage_used,
    
    -- Monthly metrics
    (SELECT COUNT(*) FROM recordings WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_recordings,
    (SELECT COUNT(DISTINCT user_id) FROM recordings WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_active_users,
    (SELECT AVG(engagement_score) FROM session_summaries WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_avg_engagement;

-- Program enrollment summary view
CREATE VIEW program_enrollment_summary AS
SELECT 
    pt.id as program_id,
    pt.title as program_title,
    pt.category,
    pt.level,
    pt.duration,
    pt.price,
    
    COUNT(pe.id) as total_enrollments,
    COUNT(CASE WHEN pe.status = 'active' THEN 1 END) as active_enrollments,
    COUNT(CASE WHEN pe.status = 'completed' THEN 1 END) as completed_enrollments,
    
    AVG(pe.progress_percentage) as average_progress,
    
    -- Calculate completion rate
    CASE 
        WHEN COUNT(pe.id) > 0 THEN 
            (COUNT(CASE WHEN pe.status = 'completed' THEN 1 END) * 100.0 / COUNT(pe.id))
        ELSE 0 
    END as completion_rate,
    
    SUM(pt.price) as total_revenue
    
FROM program_templates pt
LEFT JOIN program_enrollments pe ON pt.id = pe.program_id
WHERE pt.status = 'active'
GROUP BY pt.id, pt.title, pt.category, pt.level, pt.duration, pt.price;

-- ===================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- ===================================================================

-- Insert sample program templates
INSERT INTO program_templates (id, title, description, category, level, modules, duration, total_sessions, price) VALUES
('life-balance-mastery', 'Life Balance Mastery', 'Comprehensive program for achieving work-life balance', 'wellness', 'intermediate', 
 '[{"id": 1, "title": "Foundation", "lessons": [{"title": "Understanding Balance", "duration": 45}]}]', 
 12, 24, 1200.00),
('stress-management-pro', 'Stress Management Professional', 'Advanced stress management techniques', 'mental-health', 'advanced',
 '[{"id": 1, "title": "Stress Science", "lessons": [{"title": "Stress Physiology", "duration": 60}]}]',
 8, 16, 800.00);

-- ===================================================================
-- GRANTS AND PERMISSIONS
-- ===================================================================

-- Create role for the application
-- CREATE ROLE clinic_app WITH LOGIN PASSWORD 'your_secure_password';

-- Grant permissions to application role
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clinic_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clinic_app;

-- ===================================================================
-- MONITORING AND MAINTENANCE
-- ===================================================================

-- Create function to clean up old audit logs (run monthly)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM recording_audit_log 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND legal_hold = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to archive old recordings (run quarterly)
CREATE OR REPLACE FUNCTION archive_old_recordings()
RETURNS void AS $$
BEGIN
    UPDATE recordings 
    SET status = 'archived', archived_at = NOW()
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND status = 'completed'
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMIT;