-- Seed script to create initial admin user
-- Run this script after setting up the database

-- Insert admin user into users table
INSERT INTO users (
    id, 
    email, 
    password_hash, 
    role, 
    status, 
    email_verified, 
    created_at, 
    updated_at
) VALUES (
    'admin_001',
    'admin@clinic-app.com',
    '$2b$10$rZ5F5B5B5B5B5B5B5B5B5OeHc5F5B5B5B5B5B5B5B5B5B5B5B5B5B5', -- Password: admin123
    'admin',
    'active',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert admin profile
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    phone_number,
    timezone,
    language,
    created_at,
    updated_at
) VALUES (
    'admin_001',
    'System',
    'Administrator',
    '+1-555-0100',
    'UTC',
    'en',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Grant admin permissions
INSERT INTO user_permissions (
    user_id,
    permission,
    granted_at,
    granted_by
) VALUES 
    ('admin_001', 'admin:*', NOW(), 'system'),
    ('admin_001', 'users:*', NOW(), 'system'),
    ('admin_001', 'system:*', NOW(), 'system'),
    ('admin_001', 'analytics:*', NOW(), 'system'),
    ('admin_001', 'maintenance:*', NOW(), 'system'),
    ('admin_001', 'audit:*', NOW(), 'system'),
    ('admin_001', 'clients:impersonate', NOW(), 'system')
ON CONFLICT (user_id, permission) DO NOTHING;

-- Log admin user creation
INSERT INTO audit_logs (
    id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    created_at
) VALUES (
    gen_random_uuid(),
    'system',
    'create_admin_user',
    'user',
    'admin_001',
    '{"reason": "Initial admin user setup", "method": "database_seed"}',
    '127.0.0.1',
    'database-seed-script',
    NOW()
);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin user created successfully!';
    RAISE NOTICE 'Email: admin@clinic-app.com';
    RAISE NOTICE 'Password: admin123';
    RAISE NOTICE '⚠️  Please change the password immediately after first login!';
END $$;