const axios = require('axios');

const API_BASE = 'http://localhost:4000';

async function testLogin(email, expectedRole) {
  console.log(`\n🔐 Testing login for: ${email}`);
  console.log(`   Expected role: ${expectedRole}`);
  
  try {
    // Step 1: Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password: expectedRole === 'client' ? 'ClientPass123!' : 'SecurePass123!'
    });
    
    if (!loginResponse.data || !loginResponse.data.access_token) {
      console.log(`   ❌ Login failed - no token received`);
      return;
    }
    
    console.log(`   ✅ Login successful - token received`);
    
    // Step 2: Get user info
    const userInfoResponse = await axios.get(`${API_BASE}/auth/user-info`, {
      params: { email }
    });
    
    if (userInfoResponse.data) {
      console.log(`   👤 User found:`);
      console.log(`      ID: ${userInfoResponse.data.id}`);
      console.log(`      Name: ${userInfoResponse.data.name}`);
      console.log(`      Email: ${userInfoResponse.data.email}`);
      console.log(`      Roles: ${JSON.stringify(userInfoResponse.data.roles)}`);
      
      // Determine role for frontend
      const frontendRole = userInfoResponse.data.roles?.includes('client') ? 'client' : 
                          userInfoResponse.data.roles?.includes('admin') ? 'admin' : 'coach';
      
      console.log(`   🎯 Frontend role: ${frontendRole}`);
      console.log(`   🌐 Should redirect to: ${
        frontendRole === 'client' ? '/client/dashboard' : 
        frontendRole === 'admin' ? '/admin/dashboard' : '/dashboard'
      }`);
      
      if (frontendRole === expectedRole) {
        console.log(`   ✅ Role matches expected: ${expectedRole}`);
      } else {
        console.log(`   ⚠️ Role mismatch - expected: ${expectedRole}, got: ${frontendRole}`);
      }
    } else {
      console.log(`   ❌ User info not found`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
  }
}

async function testRoleBasedLogin() {
  console.log('🧪 Testing Role-Based Login System');
  console.log('===================================\n');
  
  // Test therapist/coach accounts
  console.log('👨‍⚕️ Testing Therapist/Coach Accounts:');
  await testLogin('sarah.johnson@clinic.com', 'coach');
  await testLogin('michael.rodriguez@clinic.com', 'coach');
  await testLogin('emily.chen@clinic.com', 'coach');
  
  // Test client accounts
  console.log('\n\n👤 Testing Client Accounts:');
  await testLogin('blake.brown3@email.com', 'client');
  await testLogin('aurora.scott4@email.com', 'client');
  await testLogin('sebastian.flores5@email.com', 'client');
  
  // Test non-existent user
  console.log('\n\n🚫 Testing Non-existent User:');
  await testLogin('nonexistent@example.com', 'unknown');
  
  console.log('\n✅ Role-based login testing completed!');
  console.log('\n🌐 Ready for frontend testing:');
  console.log('   • Go to http://localhost:5173/login');
  console.log('   • Try logging in with any of the accounts above');
  console.log('   • Should redirect based on user role automatically');
}

testRoleBasedLogin().catch(console.error);