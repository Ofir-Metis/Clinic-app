#!/usr/bin/env node

/**
 * Comprehensive UI Testing Script for Clinic App
 * This script will create users through the actual API endpoints that the UI calls
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000';

// Set up axios defaults
axios.defaults.baseURL = API_BASE;
axios.defaults.timeout = 10000;

const testUsers = [
  // Admin Users
  {
    name: 'System Administrator',
    email: 'admin@clinic.com',
    password: 'Admin123!',
    role: 'admin',
    type: 'therapist'
  },
  
  // Therapist/Coach Users
  {
    name: 'Dr. Sarah Johnson',
    email: 'dr.sarah@clinic.com',
    password: 'DrSarah123!',
    role: 'therapist',
    type: 'therapist'
  },
  {
    name: 'Mike Chen - Life Coach',
    email: 'coach.mike@clinic.com',
    password: 'CoachMike123!',
    role: 'therapist',
    type: 'therapist'
  },
  {
    name: 'Emily Rodriguez',
    email: 'coach.emily@clinic.com',
    password: 'CoachEmily123!',
    role: 'therapist',
    type: 'therapist'
  },
  
  // Patient Users (through main registration)
  {
    name: 'John Doe',
    email: 'john.doe@email.com',
    password: 'JohnDoe123!',
    role: 'patient',
    type: 'patient'
  },
];

// Client users (through client registration endpoint)
const clientUsers = [
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    password: 'JaneSmith123!',
    phone: '+1-555-0101',
    dateOfBirth: '1990-05-15',
    primaryGoals: ['Career Advancement', 'Self-Confidence'],
    coachingStyle: 'structured',
    sessionPreference: 'weekly',
    agreedToTerms: true
  },
  {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@email.com',
    password: 'AlexJ123!',
    phone: '+1-555-0102',
    dateOfBirth: '1988-09-22',
    primaryGoals: ['Health & Wellness', 'Stress Management'],
    coachingStyle: 'supportive',
    sessionPreference: 'biweekly',
    agreedToTerms: true
  },
  {
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@email.com',
    password: 'MariaG123!',
    phone: '+1-555-0103',
    dateOfBirth: '1985-12-08',
    primaryGoals: ['Personal Relationships', 'Life Purpose'],
    coachingStyle: 'flexible',
    sessionPreference: 'weekly',
    agreedToTerms: true
  }
];

async function testAPIConnection() {
  console.log('🔍 Testing API connection...');
  try {
    const response = await axios.get('/health');
    console.log('✅ API Gateway is responsive');
    return true;
  } catch (error) {
    try {
      const response = await axios.get('/');
      console.log('✅ API Gateway is responsive (root endpoint)');
      return true;
    } catch (err) {
      console.log('❌ API Gateway is not responding');
      console.log('Error:', err.message);
      return false;
    }
  }
}

async function registerUser(user) {
  console.log(`👤 Registering ${user.type}: ${user.name} (${user.email})`);
  try {
    const response = await axios.post('/api/auth/register', {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role
    });
    console.log(`✅ ${user.name} registered successfully`);
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Failed to register ${user.name}`);
    console.log('Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function registerClientUser(client) {
  console.log(`👥 Registering client: ${client.firstName} ${client.lastName} (${client.email})`);
  try {
    const response = await axios.post('/api/client/register', client);
    console.log(`✅ ${client.firstName} ${client.lastName} registered successfully as client`);
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Failed to register client ${client.firstName} ${client.lastName}`);
    console.log('Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function loginUser(email, password) {
  console.log(`🔑 Testing login for: ${email}`);
  try {
    const response = await axios.post('/api/auth/login', {
      email,
      password
    });
    console.log(`✅ ${email} logged in successfully`);
    return { success: true, token: response.data.token, user: response.data.user };
  } catch (error) {
    console.log(`❌ Failed to login ${email}`);
    console.log('Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function main() {
  console.log('🚀 Starting Clinic App UI Testing Suite');
  console.log('=====================================\n');

  // Test API connection
  const apiConnected = await testAPIConnection();
  if (!apiConnected) {
    console.log('❌ Cannot proceed without API connection. Exiting...');
    process.exit(1);
  }
  console.log('');

  // Register all therapist/admin users
  console.log('📝 REGISTERING THERAPIST/ADMIN USERS');
  console.log('==================================');
  for (const user of testUsers) {
    const result = await registerUser(user);
    if (result.success) {
      // Test immediate login
      await loginUser(user.email, user.password);
    }
    console.log('');
  }

  // Register all client users
  console.log('📝 REGISTERING CLIENT USERS');
  console.log('=========================');
  for (const client of clientUsers) {
    const result = await registerClientUser(client);
    console.log('');
  }

  console.log('🎉 Registration testing complete!');
  console.log('🌐 Frontend should now be ready for UI testing at: http://localhost:5173');
  console.log('\n📋 Test Users Created:');
  console.log('======================');
  console.log('👑 Admin: admin@clinic.com / Admin123!');
  console.log('🏥 Therapists:');
  console.log('   - dr.sarah@clinic.com / DrSarah123!');
  console.log('   - coach.mike@clinic.com / CoachMike123!');
  console.log('   - coach.emily@clinic.com / CoachEmily123!');
  console.log('🏥 Patient: john.doe@email.com / JohnDoe123!');
  console.log('👥 Clients:');
  console.log('   - jane.smith@email.com / JaneSmith123!');
  console.log('   - alex.johnson@email.com / AlexJ123!');
  console.log('   - maria.garcia@email.com / MariaG123!');
}

main().catch(console.error);