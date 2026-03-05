#!/bin/bash
# Create Admin User Script
# Multiple methods to create an admin user for the clinic application

set -e

API_URL=${API_URL:-"http://localhost:4000"}
ADMIN_SECRET=${ADMIN_SECRET:-"clinic-admin-secret-2024"}

echo "🔧 Clinic App - Admin User Creation Tool"
echo "========================================"

# Function to create admin via API
create_admin_api() {
    local email=$1
    local password=$2
    
    echo "🌐 Creating admin user via API..."
    echo "Email: $email"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/create-admin" \
        -H "Content-Type: application/json" \
        -H "X-Admin-Secret: $ADMIN_SECRET" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"firstName\": \"System\",
            \"lastName\": \"Administrator\"
        }" 2>/dev/null || echo -e "\n000")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        echo "✅ Admin user created successfully via API!"
        echo "$body" | jq -r '.message // "Admin user created"' 2>/dev/null || echo "Admin user created"
        
        # Extract tokens if available
        access_token=$(echo "$body" | jq -r '.tokens.accessToken // empty' 2>/dev/null)
        if [ -n "$access_token" ]; then
            echo "🔑 Access Token: $access_token"
            echo "💡 You can now login to the admin dashboard at: http://localhost:5173/admin"
        fi
        
        return 0
    else
        echo "❌ API creation failed (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo "Error: $body"
        fi
        return 1
    fi
}

# Function to check if admin exists
check_admin_exists() {
    echo "🔍 Checking if admin users exist..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/check-admin-exists" \
        -H "Content-Type: application/json" \
        -H "X-Admin-Secret: $ADMIN_SECRET" 2>/dev/null || echo -e "\n000")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        has_admin=$(echo "$body" | jq -r '.hasAdmin // false' 2>/dev/null)
        count=$(echo "$body" | jq -r '.count // 0' 2>/dev/null)
        
        if [ "$has_admin" = "true" ]; then
            echo "⚠️  Admin users already exist ($count total)"
            echo "Use the admin dashboard to create additional admin users."
            return 1
        else
            echo "✅ No admin users found. Safe to create initial admin."
            return 0
        fi
    else
        echo "⚠️  Could not check admin existence (HTTP $http_code)"
        echo "Proceeding with creation..."
        return 0
    fi
}

# Function to generate SQL
generate_sql() {
    local email=$1
    local password=$2
    
    echo "📄 Generating SQL for manual database insertion..."
    
    # Generate password hash (requires Node.js)
    if command -v node >/dev/null 2>&1; then
        password_hash=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$password', 12).then(hash => console.log(hash))" 2>/dev/null || echo "")
    fi
    
    if [ -z "$password_hash" ]; then
        echo "⚠️  Could not generate password hash. Using placeholder."
        password_hash="\$2b\$12\$placeholder_hash_change_me"
    fi
    
    user_id="admin_$(date +%s)"
    
    cat > "admin_user_$(date +%Y%m%d_%H%M%S).sql" << EOF
-- Generated Admin User Creation SQL
-- Created: $(date)
-- Email: $email

-- Create admin user
INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
VALUES ('$user_id', '$email', '$password_hash', 'admin', 'active', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Create admin profile
INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, timezone, language, created_at, updated_at)
VALUES ('$user_id', 'System', 'Administrator', '+1-555-ADMIN', 'UTC', 'en', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Grant admin permissions
INSERT INTO user_permissions (user_id, permission, granted_at, granted_by) VALUES
('$user_id', 'admin:*', NOW(), 'script'),
('$user_id', 'users:*', NOW(), 'script'),
('$user_id', 'system:*', NOW(), 'script'),
('$user_id', 'analytics:*', NOW(), 'script'),
('$user_id', 'maintenance:*', NOW(), 'script'),
('$user_id', 'audit:*', NOW(), 'script'),
('$user_id', 'clients:impersonate', NOW(), 'script')
ON CONFLICT (user_id, permission) DO NOTHING;

-- Log admin creation
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
VALUES (gen_random_uuid(), 'system', 'create_admin_user', 'user', '$user_id', 
        '{"email": "$email", "method": "sql_script"}', '127.0.0.1', 'admin-creation-script', NOW());

SELECT 'Admin user created successfully!' as result;
EOF
    
    echo "✅ SQL file generated: admin_user_$(date +%Y%m%d_%H%M%S).sql"
    echo "📝 Execute this SQL file in your PostgreSQL database."
}

# Get email and password
if [ $# -eq 0 ]; then
    echo
    read -p "📧 Enter admin email (default: admin@clinic-app.com): " email
    email=${email:-"admin@clinic-app.com"}
    
    echo
    read -s -p "🔐 Enter admin password (default: admin123): " password
    password=${password:-"admin123"}
    echo
else
    email=$1
    password=${2:-"admin123"}
fi

echo
echo "Creating admin user:"
echo "📧 Email: $email"
echo "🔐 Password: ${'*' for i in $(seq 1 ${#password})}"
echo

# Check if admin exists first (if API is available)
if check_admin_exists; then
    echo
    echo "🚀 Attempting to create admin user..."
    
    # Try API method first
    if create_admin_api "$email" "$password"; then
        echo
        echo "🎉 Admin user creation completed successfully!"
        echo "🌐 Admin Dashboard: http://localhost:5173/admin"
        echo "📧 Email: $email"
        echo "🔐 Password: $password"
        echo
        echo "⚠️  IMPORTANT: Change the password immediately after first login!"
    else
        echo
        echo "🔄 API method failed. Generating SQL as fallback..."
        generate_sql "$email" "$password"
        echo
        echo "💡 Manually execute the generated SQL file in your database."
    fi
else
    echo
    echo "🔄 Admin users already exist or API unavailable. Generating SQL..."
    generate_sql "$email" "$password"
fi

echo
echo "🔧 Other methods to create admin users:"
echo "1. Execute: node scripts/create-admin.js $email $password"
echo "2. Execute: psql -d clinic -f scripts/seed-admin.sql"
echo "3. Use the generated SQL file above"
echo
echo "✅ Admin creation script completed!"