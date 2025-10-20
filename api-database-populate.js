const axios = require('axios');

// API base URL
const API_BASE = 'http://localhost:4000';

// Sample therapist data with coaching/wellness focus
const therapistData = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Stress Management & Confidence Building',
    bio: 'Empowering clients to overcome anxiety and build unshakeable confidence through mindfulness and CBT techniques.',
    licenseNumber: 'LPC12345',
    yearsExperience: 8,
    role: 'therapist'
  },
  {
    firstName: 'Michael',
    lastName: 'Rodriguez', 
    email: 'michael.rodriguez@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Personal Growth & Life Transitions',
    bio: 'Guiding individuals through major life changes and personal transformation journeys.',
    licenseNumber: 'LPC23456',
    yearsExperience: 12,
    role: 'therapist'
  },
  {
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@clinic.com', 
    password: 'SecurePass123!',
    specialization: 'Trauma Recovery & Resilience Building',
    bio: 'Specializing in helping clients heal from past experiences and build emotional resilience.',
    licenseNumber: 'LPC34567',
    yearsExperience: 10,
    role: 'therapist'
  },
  {
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Relationship & Communication Coaching',
    bio: 'Expert in helping individuals and couples build stronger, more meaningful connections.',
    licenseNumber: 'LMFT45678',
    yearsExperience: 15,
    role: 'therapist'
  },
  {
    firstName: 'Jessica',
    lastName: 'Williams',
    email: 'jessica.williams@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Habit Change & Wellness Coaching',
    bio: 'Supporting clients in breaking negative patterns and building healthy, sustainable lifestyles.',
    licenseNumber: 'LPC56789',
    yearsExperience: 9,
    role: 'therapist'
  },
  {
    firstName: 'Robert',
    lastName: 'Davis',
    email: 'robert.davis@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Youth Empowerment & Development',
    bio: 'Passionate about helping young people discover their potential and navigate life challenges.',
    licenseNumber: 'LPC67890',
    yearsExperience: 11,
    role: 'therapist'
  },
  {
    firstName: 'Amanda',
    lastName: 'Wilson',
    email: 'amanda.wilson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Grief Support & Life Renewal',
    bio: 'Compassionate guidance for those experiencing loss and seeking to rebuild meaningful lives.',
    licenseNumber: 'LPC78901',
    yearsExperience: 7,
    role: 'therapist'
  },
  {
    firstName: 'Thomas',
    lastName: 'Anderson',
    email: 'thomas.anderson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Executive Coaching & Leadership Development',
    bio: 'Helping professionals achieve peak performance and lead with authenticity and purpose.',
    licenseNumber: 'LPC89012',
    yearsExperience: 13,
    role: 'therapist'
  }
];

// Patient name pools
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Blake', 'Dakota', 'Hayden', 'Parker', 'Sage', 'River', 'Phoenix', 'Rowan',
  'Elena', 'Marcus', 'Sofia', 'Lucas', 'Isabella', 'Nathan', 'Emma', 'Gabriel',
  'Olivia', 'Samuel', 'Ava', 'Benjamin', 'Mia', 'Daniel', 'Charlotte', 'James',
  'Amelia', 'William', 'Harper', 'Alexander', 'Evelyn', 'Michael', 'Luna', 'Ethan',
  'Aria', 'Owen', 'Zoe', 'Liam', 'Chloe', 'Noah', 'Grace', 'Jackson', 'Lily', 'Aiden'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const focusAreas = [
  'Stress Management & Confidence Building',
  'Mindfulness & Emotional Wellness', 
  'Personal Growth & Self-Discovery',
  'Social Confidence & Communication Skills',
  'Work-Life Balance Optimization',
  'Relationship Building & Communication',
  'Goal Setting & Achievement',
  'Life Transitions & Change Management',
  'Self-Esteem & Personal Empowerment',
  'Creative Expression & Purpose Finding',
  'Health & Wellness Coaching',
  'Leadership & Professional Development',
  'Parenting & Family Dynamics',
  'Career Transition & Professional Growth',
  'Financial Wellness & Abundance Mindset',
  'Spiritual Growth & Meaning-Making'
];

function generateClient(therapistId, index) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const focusArea = focusAreas[Math.floor(Math.random() * focusAreas.length)];
  
  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@email.com`,
    phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    focusArea,
    status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'on-hold' : 'inactive'),
    therapistId,
    notes: `Initial consultation completed. Client is motivated to work on ${focusArea.toLowerCase()}. Recommended bi-weekly sessions with progress tracking.`,
    dateOfBirth: new Date(1970 + Math.floor(Math.random() * 35), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    emergencyContactName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    emergencyContactPhone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
  };
}

async function makeAPICall(endpoint, method = 'GET', data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

async function populateDatabaseViaAPI() {
  console.log('🏥 Clinic Database Population via API');
  console.log('Creating 8 therapists with 15-100 clients each...\n');
  
  try {
    // First, check if API is accessible
    console.log('🔍 Checking API connectivity...');
    const healthCheck = await makeAPICall('/health');
    
    if (!healthCheck.success) {
      console.log('❌ API not accessible. Trying alternative endpoints...');
      
      // Try different endpoints
      const endpoints = ['/api/health', '/status', '/ping'];
      let apiWorking = false;
      
      for (const endpoint of endpoints) {
        const check = await makeAPICall(endpoint);
        if (check.success) {
          console.log(`✅ API accessible at ${endpoint}`);
          apiWorking = true;
          break;
        }
      }
      
      if (!apiWorking) {
        console.log('❌ API is not responding. Please ensure the backend services are running.');
        console.log('💡 Try running: docker compose up -d');
        return;
      }
    } else {
      console.log('✅ API is accessible and healthy');
    }
    
    // Create therapists
    console.log('\n👨‍⚕️ Creating therapists...');
    const createdTherapists = [];
    
    for (let i = 0; i < therapistData.length; i++) {
      const therapist = therapistData[i];
      console.log(`   Creating ${i + 1}/8: ${therapist.firstName} ${therapist.lastName}`);
      
      // Try different registration endpoints
      const registrationEndpoints = [
        '/auth/register',
        '/api/auth/register', 
        '/users/register',
        '/api/users/register',
        '/register'
      ];
      
      let registered = false;
      
      for (const endpoint of registrationEndpoints) {
        const result = await makeAPICall(endpoint, 'POST', therapist);
        
        if (result.success) {
          console.log(`      ✅ Successfully registered via ${endpoint}`);
          createdTherapists.push({...therapist, id: result.data.id || i + 1});
          registered = true;
          break;
        } else if (result.status !== 404) {
          console.log(`      ⚠️ Registration attempt failed: ${result.error}`);
        }
      }
      
      if (!registered) {
        console.log(`      ❌ Failed to register ${therapist.firstName} ${therapist.lastName}`);
        // Add to list anyway for client creation attempts
        createdTherapists.push({...therapist, id: i + 1});
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`\n📊 Therapist creation completed: ${createdTherapists.length}/8`);
    
    // Create clients for each therapist
    console.log('\n👥 Creating clients for each therapist...');
    let totalClientsCreated = 0;
    
    for (let therapistIndex = 0; therapistIndex < createdTherapists.length; therapistIndex++) {
      const therapist = createdTherapists[therapistIndex];
      const clientCount = Math.floor(Math.random() * 86) + 15; // 15-100 clients
      
      console.log(`\n📋 Creating ${clientCount} clients for ${therapist.firstName} ${therapist.lastName}...`);
      
      // Try to login as this therapist first
      const loginEndpoints = ['/auth/login', '/api/auth/login', '/login'];
      let therapistToken = null;
      
      for (const endpoint of loginEndpoints) {
        const loginResult = await makeAPICall(endpoint, 'POST', {
          email: therapist.email,
          password: therapist.password
        });
        
        if (loginResult.success && loginResult.data.token) {
          therapistToken = loginResult.data.token;
          break;
        }
      }
      
      if (therapistToken) {
        console.log(`   🔐 Logged in as ${therapist.firstName} ${therapist.lastName}`);
      } else {
        console.log(`   ⚠️ Could not authenticate as ${therapist.firstName} ${therapist.lastName}, proceeding without auth`);
      }
      
      let clientsCreated = 0;
      
      for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
        const client = generateClient(therapist.id, clientIndex);
        
        // Try different client creation endpoints
        const clientEndpoints = [
          '/clients',
          '/api/clients', 
          '/patients',
          '/api/patients',
          '/users'
        ];
        
        let clientCreated = false;
        
        for (const endpoint of clientEndpoints) {
          const result = await makeAPICall(endpoint, 'POST', client, therapistToken);
          
          if (result.success) {
            clientsCreated++;
            totalClientsCreated++;
            clientCreated = true;
            break;
          }
        }
        
        if (!clientCreated && clientIndex < 5) {
          // Only log first few failures to avoid spam
          console.log(`      ⚠️ Failed to create client ${clientIndex + 1}`);
        }
        
        // Progress indicator
        if ((clientIndex + 1) % 25 === 0 || clientIndex === clientCount - 1) {
          console.log(`      📈 Progress: ${clientIndex + 1}/${clientCount} (${clientsCreated} successful)`);
        }
        
        // Small delay
        if (clientIndex % 10 === 0) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
      
      console.log(`   ✅ Completed: ${clientsCreated}/${clientCount} clients created for ${therapist.firstName} ${therapist.lastName}`);
    }
    
    console.log(`\n🎉 DATABASE POPULATION COMPLETED!`);
    console.log(`📊 Final Summary:`);
    console.log(`   👨‍⚕️ Therapists: ${createdTherapists.length}/8`);
    console.log(`   👥 Total Clients: ${totalClientsCreated}`);
    console.log(`   📈 Avg per Therapist: ${Math.round(totalClientsCreated / createdTherapists.length)}`);
    
    // Display login credentials
    console.log(`\n🔑 Therapist Login Credentials:`);
    createdTherapists.forEach((therapist, index) => {
      console.log(`   ${index + 1}. ${therapist.firstName} ${therapist.lastName}`);
      console.log(`      📧 Email: ${therapist.email}`);
      console.log(`      🔒 Password: ${therapist.password}`);
      console.log(`      🎯 Specialization: ${therapist.specialization}`);
    });
    
    console.log(`\n🌐 Access the application at: http://localhost:5173`);
    console.log(`💡 Use any of the therapist credentials above to login and explore the data.`);
    
  } catch (error) {
    console.error('❌ Database population error:', error.message);
  }
}

// Run the population script
populateDatabaseViaAPI().catch(console.error);