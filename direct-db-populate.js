const { Client } = require('pg');

// Database connection config
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'clinic',
  user: 'postgres',
  password: 'postgres'
};

// Sample client data generator
function generateClients(therapistIds, totalClients = 500) {
  const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
    'Blake', 'Dakota', 'Hayden', 'Parker', 'Sage', 'River', 'Phoenix', 'Rowan',
    'Elena', 'Marcus', 'Sofia', 'Lucas', 'Isabella', 'Nathan', 'Emma', 'Gabriel',
    'Olivia', 'Samuel', 'Ava', 'Benjamin', 'Mia', 'Daniel', 'Charlotte', 'James',
    'Amelia', 'William', 'Harper', 'Alexander', 'Evelyn', 'Michael', 'Luna', 'Ethan'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
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
    'Leadership & Professional Development'
  ];

  const clients = [];
  
  for (let i = 0; i < totalClients; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const focusArea = focusAreas[Math.floor(Math.random() * focusAreas.length)];
    
    // Assign therapist (some clients can have multiple therapists)
    const primaryTherapist = therapistIds[Math.floor(Math.random() * therapistIds.length)];
    const hasSecondaryTherapist = Math.random() > 0.8; // 20% chance
    const secondaryTherapist = hasSecondaryTherapist ? 
      therapistIds.filter(id => id !== primaryTherapist)[Math.floor(Math.random() * (therapistIds.length - 1))] : null;
    
    clients.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      focusArea,
      status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'on-hold' : 'inactive'),
      primaryTherapist,
      secondaryTherapist,
      notes: `Initial consultation completed. Focus on ${focusArea.toLowerCase()}. Recommended bi-weekly sessions.`,
      dateOfBirth: new Date(1970 + Math.floor(Math.random() * 35), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      emergencyContactName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      emergencyContactPhone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      totalSessions: Math.floor(Math.random() * 20),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in past year
    });
  }
  
  return clients;
}

async function populateDatabaseDirectly() {
  console.log('🏥 Direct Database Population');
  console.log('Creating clients directly in PostgreSQL database...\n');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // First, get the therapist IDs from the users table
    console.log('🔍 Finding created therapist accounts...');
    
    const therapistQuery = `
      SELECT id, email, "firstName", "lastName" 
      FROM users 
      WHERE email LIKE '%@clinic.com' 
      AND role = 'therapist'
      ORDER BY id
    `;
    
    const therapistResult = await client.query(therapistQuery);
    const therapists = therapistResult.rows;
    
    console.log(`📋 Found ${therapists.length} therapist accounts:`);
    therapists.forEach((therapist, index) => {
      console.log(`   ${index + 1}. ${therapist.firstName} ${therapist.lastName} (ID: ${therapist.id})`);
    });
    
    if (therapists.length === 0) {
      console.log('❌ No therapists found. Please run the API population script first.');
      return;
    }
    
    const therapistIds = therapists.map(t => t.id);
    
    // Generate client data
    console.log('\\n👥 Generating client data...');
    const clients = generateClients(therapistIds, 600); // Generate 600 clients
    
    // Check if patients table exists and create if needed
    console.log('🔧 Checking database schema...');
    
    const createPatientsTable = `
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        "firstName" VARCHAR(100) NOT NULL,
        "lastName" VARCHAR(100) NOT NULL,
        email VARCHAR(320) UNIQUE NOT NULL,
        phone VARCHAR(20),
        "focusArea" VARCHAR(200),
        status VARCHAR(20) DEFAULT 'active',
        notes TEXT,
        "dateOfBirth" DATE,
        "emergencyContactName" VARCHAR(200),
        "emergencyContactPhone" VARCHAR(20),
        "totalSessions" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createPatientsTable);
    console.log('✅ Patients table ready');
    
    // Create therapist-patient relationship table
    const createTherapistPatientTable = `
      CREATE TABLE IF NOT EXISTS therapist_patients (
        id SERIAL PRIMARY KEY,
        therapist_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        relationship_type VARCHAR(20) DEFAULT 'primary',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(therapist_id, patient_id, relationship_type)
      );
    `;
    
    await client.query(createTherapistPatientTable);
    console.log('✅ Therapist-patient relationship table ready');
    
    // Insert clients in batches
    console.log('\\n💾 Inserting clients into database...');
    let insertedClients = 0;
    const batchSize = 50;
    
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);
      
      for (const clientData of batch) {
        try {
          // Insert patient
          const insertPatientQuery = `
            INSERT INTO patients (
              "firstName", "lastName", email, phone, "focusArea", 
              status, notes, "dateOfBirth", "emergencyContactName", 
              "emergencyContactPhone", "totalSessions", "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
          `;
          
          const patientValues = [
            clientData.firstName,
            clientData.lastName, 
            clientData.email,
            clientData.phone,
            clientData.focusArea,
            clientData.status,
            clientData.notes,
            clientData.dateOfBirth,
            clientData.emergencyContactName,
            clientData.emergencyContactPhone,
            clientData.totalSessions,
            clientData.createdAt
          ];
          
          const patientResult = await client.query(insertPatientQuery, patientValues);
          const patientId = patientResult.rows[0].id;
          
          // Insert primary therapist relationship
          const insertRelationshipQuery = `
            INSERT INTO therapist_patients (therapist_id, patient_id, relationship_type)
            VALUES ($1, $2, 'primary')
            ON CONFLICT DO NOTHING
          `;
          
          await client.query(insertRelationshipQuery, [clientData.primaryTherapist, patientId]);
          
          // Insert secondary therapist relationship if exists
          if (clientData.secondaryTherapist) {
            await client.query(insertRelationshipQuery, [clientData.secondaryTherapist, patientId]);
          }
          
          insertedClients++;
          
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.log(`   ⚠️ Error inserting client ${clientData.firstName} ${clientData.lastName}: ${error.message}`);
          }
        }
      }
      
      console.log(`   📈 Progress: ${Math.min(i + batchSize, clients.length)}/${clients.length} processed (${insertedClients} successful)`);
    }
    
    // Get final statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT p.id) as total_patients,
        COUNT(DISTINCT tp.therapist_id) as therapists_with_patients,
        AVG(patient_count.count) as avg_patients_per_therapist
      FROM patients p
      JOIN therapist_patients tp ON p.id = tp.patient_id
      JOIN (
        SELECT therapist_id, COUNT(*) as count
        FROM therapist_patients
        GROUP BY therapist_id
      ) patient_count ON tp.therapist_id = patient_count.therapist_id
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    // Get multi-therapist clients count
    const multiTherapistQuery = `
      SELECT COUNT(DISTINCT patient_id) as multi_therapist_patients
      FROM (
        SELECT patient_id, COUNT(DISTINCT therapist_id) as therapist_count
        FROM therapist_patients
        GROUP BY patient_id
        HAVING COUNT(DISTINCT therapist_id) > 1
      ) multi_patients
    `;
    
    const multiResult = await client.query(multiTherapistQuery);
    const multiTherapistCount = multiResult.rows[0].multi_therapist_patients;
    
    console.log(`\\n🎉 DATABASE POPULATION COMPLETED!`);
    console.log(`📊 Final Statistics:`);
    console.log(`   👨‍⚕️ Total Therapists: ${therapists.length}`);
    console.log(`   👥 Total Clients: ${stats.total_patients}`);
    console.log(`   📈 Avg Clients per Therapist: ${Math.round(stats.avg_patients_per_therapist)}`);
    console.log(`   🔄 Multi-Therapist Clients: ${multiTherapistCount}`);
    console.log(`   ✅ Success Rate: ${Math.round((insertedClients / clients.length) * 100)}%`);
    
    console.log(`\\n🌐 You can now access the application at: http://localhost:5173`);
    console.log(`🔑 Login with any of the therapist credentials to see the populated data!`);
    
  } catch (error) {
    console.error('❌ Database population error:', error);
  } finally {
    await client.end();
    console.log('\\n👋 Database connection closed');
  }
}

// Check if pg module is available
try {
  require('pg');
  populateDatabaseDirectly().catch(console.error);
} catch (error) {
  console.log('❌ PostgreSQL client not available. Installing...');
  console.log('💡 Run: npm install pg');
  console.log('🔄 Then run this script again');
}