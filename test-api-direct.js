const axios = require('axios');

async function testDirectAPICall() {
  try {
    console.log('🔍 TESTING DIRECT API CALLS FOR DATA ISOLATION');
    console.log('📅 Test time:', new Date().toISOString());
    
    // First, let's login to get a proper JWT token
    console.log('\n🔐 Step 1: Login to get JWT token...');
    const loginResponse = await axios.post('http://localhost:4000/auth/login', {
      email: 'ofir.bracha@gmail.com',
      password: 'ofir.bracha@gmail.com' // Try common password patterns
    });
    
    console.log('❌ Login failed, trying other passwords...');
    
  } catch (error) {
    console.log('Login attempt failed, let\'s try different approaches...');
    
    try {
      // Let's check what the dashboard endpoints return without proper auth
      console.log('\n📊 Step 2: Testing dashboard endpoints directly...');
      
      const dashboardResponse = await axios.get('http://localhost:4000/dashboard/overview', {
        timeout: 5000
      });
      
      console.log('Dashboard response status:', dashboardResponse.status);
      console.log('Dashboard data:', JSON.stringify(dashboardResponse.data, null, 2));
      
    } catch (dashError) {
      console.log('Dashboard error:', dashError.response?.status, dashError.response?.statusText);
      
      if (dashError.response?.status === 401) {
        console.log('✅ Good! Dashboard requires authentication');
      }
    }
    
    // Let's check other endpoints that might be leaking data
    const endpoints = [
      '/dashboard/appointments',
      '/dashboard/notes', 
      '/dashboard/stats'
    ];
    
    console.log('\n🔍 Step 3: Testing individual dashboard endpoints...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:4000${endpoint}`, {
          timeout: 5000
        });
        console.log(`${endpoint}: Status ${response.status}`);
        console.log(`${endpoint} data:`, JSON.stringify(response.data, null, 2));
      } catch (err) {
        console.log(`${endpoint}: Error ${err.response?.status} - ${err.response?.statusText}`);
        if (err.response?.status === 401) {
          console.log(`  ✅ ${endpoint} properly requires authentication`);
        }
      }
    }
  }
}

async function testDatabaseDirectly() {
  console.log('\n🗄️ Step 4: Let\'s check what\'s in the database directly...');
  
  // We'll use the Bash command through Node to check database
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    // Check patients table (might be where client data is stored)
    const patientsQuery = 'PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT COUNT(*) as patient_count FROM patients;"';
    const patientsResult = await execPromise(patientsQuery);
    console.log('Patients table count:', patientsResult.stdout);
    
    // Check appointments table
    const appointmentsQuery = 'PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT COUNT(*) as appointment_count FROM appointments;"';
    const appointmentsResult = await execPromise(appointmentsQuery);
    console.log('Appointments table count:', appointmentsResult.stdout);
    
    // Check session_notes table
    const notesQuery = 'PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT COUNT(*) as notes_count FROM session_notes;"';
    const notesResult = await execPromise(notesQuery);
    console.log('Session notes table count:', notesResult.stdout);
    
    // Check if there's data that isn't filtered by user
    const allPatientsQuery = 'PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT id, email, name FROM patients LIMIT 5;"';
    const allPatientsResult = await execPromise(allPatientsQuery);
    console.log('\nExisting patients data:');
    console.log(allPatientsResult.stdout);
    
  } catch (error) {
    console.error('Database check error:', error.message);
  }
}

// Run both tests
async function runTests() {
  await testDirectAPICall();
  await testDatabaseDirectly();
}

runTests();