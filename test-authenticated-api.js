const axios = require('axios');

async function testAuthenticatedAPI() {
  try {
    console.log('1. Testing login...');

    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:4000/auth/login', {
      email: 'coach@example.com',
      password: 'CoachPassword123!'
    });

    console.log('✅ Login successful');
    console.log('Response:', loginResponse.data);

    const token = loginResponse.data.access_token || loginResponse.data.token;

    if (!token) {
      console.log('❌ No token received in login response');
      return;
    }

    console.log('✅ Token received:', token.substring(0, 20) + '...');

    // Now try to access dashboard stats with authentication
    console.log('\n2. Testing dashboard stats with authentication...');

    const dashboardResponse = await axios.get('http://localhost:4000/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Dashboard stats retrieved successfully');
    console.log('Stats data:', JSON.stringify(dashboardResponse.data, null, 2));

    // Test appointments endpoint
    console.log('\n3. Testing dashboard appointments...');

    const appointmentsResponse = await axios.get('http://localhost:4000/dashboard/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Dashboard appointments retrieved successfully');
    console.log('Appointments data:', JSON.stringify(appointmentsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testAuthenticatedAPI();