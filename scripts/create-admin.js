#!/usr/bin/env node
/**
 * Create Admin User Script
 * Usage: node scripts/create-admin.js [email] [password]
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Mock database connection - replace with actual database client
const createAdminUser = async (email, password) => {
  try {
    console.log('🔧 Creating admin user...');
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate user ID
    const userId = `admin_${Date.now()}`;
    
    // User data
    const userData = {
      id: userId,
      email: email,
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Profile data
    const profileData = {
      user_id: userId,
      first_name: 'System',
      last_name: 'Administrator',
      phone_number: '+1-555-0100',
      timezone: 'UTC',
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Permissions
    const permissions = [
      'admin:*',
      'users:*', 
      'system:*',
      'analytics:*',
      'maintenance:*',
      'audit:*',
      'clients:impersonate',
    ];
    
    // In a real implementation, you would save to database here
    console.log('📝 User Data:', JSON.stringify(userData, null, 2));
    console.log('👤 Profile Data:', JSON.stringify(profileData, null, 2));
    console.log('🔑 Permissions:', permissions);
    
    // Generate SQL for manual execution
    const sql = `
-- Generated SQL to create admin user
INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
VALUES ('${userId}', '${email}', '${passwordHash}', 'admin', 'active', true, NOW(), NOW());

INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, timezone, language, created_at, updated_at)
VALUES ('${userId}', 'System', 'Administrator', '+1-555-0100', 'UTC', 'en', NOW(), NOW());

${permissions.map(permission => 
  `INSERT INTO user_permissions (user_id, permission, granted_at, granted_by) VALUES ('${userId}', '${permission}', NOW(), 'script');`
).join('\n')}

INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
VALUES ('${uuidv4()}', 'system', 'create_admin_user', 'user', '${userId}', 
        '{"reason": "Script-generated admin user", "email": "${email}"}', '127.0.0.1', 'create-admin-script', NOW());
`;
    
    console.log('\n📄 Generated SQL:');
    console.log('='.repeat(50));
    console.log(sql);
    console.log('='.repeat(50));
    
    console.log('\n✅ Admin user creation script completed!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log('⚠️  Execute the generated SQL in your database to create the user.');
    console.log('⚠️  Change the password immediately after first login!');
    
    return { userId, email, sql };
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
};

// REST API method to create admin user
const createAdminViaAPI = async (email, password) => {
  try {
    console.log('🌐 Creating admin user via API...');
    
    const response = await fetch('http://localhost:4000/auth/create-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': process.env.ADMIN_SECRET || 'clinic-admin-secret-2024',
      },
      body: JSON.stringify({
        email,
        password,
        firstName: 'System',
        lastName: 'Administrator',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Admin user created successfully via API!');
    console.log('User ID:', result.userId);
    console.log('Email:', result.email);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to create admin via API:', error.message);
    console.log('💡 Falling back to SQL generation method...');
    return createAdminUser(email, password);
  }
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  
  let email = args[0] || 'admin@clinic-app.com';
  let password = args[1];
  
  // Prompt for password if not provided
  if (!password) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    password = await new Promise((resolve) => {
      rl.question('Enter admin password (default: admin123): ', (answer) => {
        rl.close();
        resolve(answer || 'admin123');
      });
    });
  }
  
  console.log('🚀 Creating admin user...');
  console.log(`📧 Email: ${email}`);
  console.log(`🔐 Password: ${'*'.repeat(password.length)}`);
  console.log();
  
  try {
    // Try API first, fallback to SQL generation
    await createAdminViaAPI(email, password);
  } catch (error) {
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  }
};

// Run script if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createAdminUser, createAdminViaAPI };