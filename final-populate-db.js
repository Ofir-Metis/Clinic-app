const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'clinic',
  user: 'postgres',
  password: 'postgres'
};

// Sample client data generator
function generatePatients(therapistIds, totalPatients = 400) {
  const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
    'Blake', 'Dakota', 'Hayden', 'Parker', 'Sage', 'River', 'Phoenix', 'Rowan',
    'Elena', 'Marcus', 'Sofia', 'Lucas', 'Isabella', 'Nathan', 'Emma', 'Gabriel',
    'Olivia', 'Samuel', 'Ava', 'Benjamin', 'Mia', 'Daniel', 'Charlotte', 'James',
    'Amelia', 'William', 'Harper', 'Alexander', 'Evelyn', 'Michael', 'Luna', 'Ethan',
    'Aria', 'Owen', 'Zoe', 'Liam', 'Chloe', 'Noah', 'Grace', 'Jackson', 'Lily', 'Aiden',
    'Zara', 'Carter', 'Nora', 'Mason', 'Hazel', 'Logan', 'Violet', 'Sebastian', 'Aurora', 'Kai'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter'
  ];

  const patients = [];
  
  for (let i = 0; i < totalPatients; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Distribute patients across therapists with variation
    let therapistId;
    const rand = Math.random();
    if (rand < 0.25) {
      // 25% go to first 2 therapists (busier therapists)
      therapistId = therapistIds[Math.floor(Math.random() * Math.min(2, therapistIds.length))];
    } else if (rand < 0.65) {
      // 40% go to middle therapists
      const startIndex = Math.min(2, therapistIds.length - 1);
      const count = Math.min(4, therapistIds.length - startIndex);
      therapistId = therapistIds[startIndex + Math.floor(Math.random() * count)];
    } else {
      // 35% go to remaining therapists
      const startIndex = Math.min(6, therapistIds.length - 1);
      const count = Math.max(1, therapistIds.length - startIndex);
      therapistId = therapistIds[startIndex + Math.floor(Math.random() * count)];
    }
    
    patients.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@email.com`,
      phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      whatsappOptIn: Math.random() > 0.3, // 70% opt in to WhatsApp
      therapistId,
      emergencyContact: {
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        relationship: ['spouse', 'parent', 'sibling', 'friend', 'partner'][Math.floor(Math.random() * 5)]
      },
      preferences: {
        communicationPreference: ['email', 'phone', 'whatsapp'][Math.floor(Math.random() * 3)],
        sessionReminders: Math.random() > 0.2, // 80% want reminders
        reminderHours: [1, 2, 24, 48][Math.floor(Math.random() * 4)],
        preferredTime: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
        focusArea: [
          'Stress Management & Confidence Building',
          'Mindfulness & Emotional Wellness', 
          'Personal Growth & Self-Discovery',
          'Social Confidence & Communication Skills',
          'Work-Life Balance Optimization',
          'Goal Setting & Achievement',
          'Life Transitions & Change Management',
          'Self-Esteem & Personal Empowerment'
        ][Math.floor(Math.random() * 8)]
      },
      gdprConsent: {
        dataProcessing: true,
        marketing: Math.random() > 0.4, // 60% consent to marketing
        thirdParty: Math.random() > 0.7, // 30% consent to third party
        consentDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random date in past 6 months
      updatedAt: new Date()
    });
  }
  
  return patients;
}

async function finalPopulateDatabase() {
  console.log('🏥 Final Database Population with Real Schema');
  console.log('Creating patients using actual clinic database structure...\n');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Find all therapist accounts (users with therapist role)
    console.log('🔍 Finding therapist accounts...');
    
    const therapistQuery = `
      SELECT id, email, name
      FROM "user" 
      WHERE 'therapist' = ANY(roles)
      ORDER BY id
    `;
    
    const therapistResult = await client.query(therapistQuery);
    const therapists = therapistResult.rows;
    
    console.log(`📋 Found ${therapists.length} therapist accounts:`);
    therapists.forEach((therapist, index) => {
      console.log(`   ${index + 1}. ${therapist.name || 'No Name'} (${therapist.email}) - ID: ${therapist.id}`);
    });
    
    if (therapists.length === 0) {
      console.log('❌ No therapists found. Creating some sample therapists first...');
      
      // Create some sample therapists
      const sampleTherapists = [
        { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@clinic.com', password: '$2b$10$sample.hash' },
        { name: 'Dr. Michael Rodriguez', email: 'michael.rodriguez@clinic.com', password: '$2b$10$sample.hash' },
        { name: 'Dr. Emily Chen', email: 'emily.chen@clinic.com', password: '$2b$10$sample.hash' }
      ];
      
      for (const therapist of sampleTherapists) {
        try {
          const insertQuery = `
            INSERT INTO "user" (email, name, password, roles, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
          `;
          
          const result = await client.query(insertQuery, [
            therapist.email,
            therapist.name, 
            therapist.password,
            ['therapist'],
            new Date(),
            new Date()
          ]);
          
          console.log(`   ✅ Created therapist: ${therapist.name} (ID: ${result.rows[0].id})`);
          therapists.push({
            id: result.rows[0].id,
            name: therapist.name,
            email: therapist.email
          });
          
        } catch (error) {
          console.log(`   ⚠️ Could not create ${therapist.name}: ${error.message}`);
        }
      }
    }
    
    if (therapists.length === 0) {
      console.log('❌ Still no therapists available. Cannot proceed.');
      return;
    }
    
    const therapistIds = therapists.map(t => t.id);
    
    // Generate patient data
    console.log('\\n👥 Generating patient data...');
    const patients = generatePatients(therapistIds, 600); // Generate 600 patients total
    
    console.log(`   📊 Generated ${patients.length} patients for ${therapists.length} therapists`);
    
    // Show expected distribution
    const expectedDistribution = {};
    patients.forEach(p => {
      expectedDistribution[p.therapistId] = (expectedDistribution[p.therapistId] || 0) + 1;
    });
    
    console.log('   📈 Expected patient distribution:');
    therapists.forEach(therapist => {
      const count = expectedDistribution[therapist.id] || 0;
      console.log(`      ${therapist.name}: ${count} patients`);
    });
    
    // Insert patients in batches
    console.log('\\n💾 Inserting patients into database...');
    let insertedPatients = 0;
    let duplicateCount = 0;
    const batchSize = 20;
    
    for (let i = 0; i < patients.length; i += batchSize) {
      const batch = patients.slice(i, i + batchSize);
      
      for (const patientData of batch) {
        try {
          // Insert patient using the actual schema
          const insertPatientQuery = `
            INSERT INTO patients (
              "firstName", "lastName", email, phone, "whatsappOptIn", 
              "therapistId", "emergencyContact", preferences, "gdprConsent",
              "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
          `;
          
          const patientValues = [
            patientData.firstName,
            patientData.lastName, 
            patientData.email,
            patientData.phone,
            patientData.whatsappOptIn,
            patientData.therapistId,
            JSON.stringify(patientData.emergencyContact),
            JSON.stringify(patientData.preferences),
            JSON.stringify(patientData.gdprConsent),
            patientData.createdAt,
            patientData.updatedAt
          ];
          
          const patientResult = await client.query(insertPatientQuery, patientValues);
          insertedPatients++;
          
        } catch (error) {
          if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            duplicateCount++;
          } else {
            if (insertedPatients < 5) { // Only show first few errors
              console.log(`   ⚠️ Error inserting patient ${patientData.firstName} ${patientData.lastName}: ${error.message}`);
            }
          }
        }
      }
      
      console.log(`   📈 Progress: ${Math.min(i + batchSize, patients.length)}/${patients.length} processed (${insertedPatients} successful, ${duplicateCount} duplicates)`);
    }
    
    // Get final statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_patients,
        COUNT(DISTINCT "therapistId") as therapists_with_patients
      FROM patients
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    // Get detailed distribution
    const distributionQuery = `
      SELECT 
        u.name, u.email,
        COUNT(p.id) as patient_count
      FROM "user" u
      LEFT JOIN patients p ON u.id = p."therapistId"
      WHERE 'therapist' = ANY(u.roles)
      GROUP BY u.id, u.name, u.email
      ORDER BY patient_count DESC
    `;
    
    const distributionResult = await client.query(distributionQuery);
    const finalDistribution = distributionResult.rows;
    
    // Check for multi-therapist scenarios (we'll simulate this by creating some shared patients)
    console.log('\\n🔄 Creating multi-therapist patient relationships...');
    
    if (therapists.length >= 2) {
      // Get some patients to assign to multiple therapists
      const somePatients = await client.query('SELECT id, "firstName", "lastName" FROM patients LIMIT 20');
      
      let multiRelationships = 0;
      
      for (const patient of somePatients.rows.slice(0, 10)) { // 10 patients with multiple therapists
        try {
          // Randomly assign to a second therapist
          const secondTherapist = therapistIds[Math.floor(Math.random() * therapistIds.length)];
          
          // We'll use the notes or a separate table for this, but for now just add a note
          const updateQuery = `
            UPDATE patients 
            SET preferences = preferences || '{"secondaryTherapist": ${secondTherapist}}'::jsonb
            WHERE id = $1
          `;
          
          await client.query(updateQuery, [patient.id]);
          multiRelationships++;
          
        } catch (error) {
          // Ignore errors for multi-therapist setup
        }
      }
      
      if (multiRelationships > 0) {
        console.log(`   ✅ Set up ${multiRelationships} multi-therapist relationships`);
      }
    }
    
    console.log(`\\n🎉 DATABASE POPULATION COMPLETED!`);
    console.log(`📊 Final Statistics:`);
    console.log(`   👨‍⚕️ Total Therapists: ${therapists.length}`);
    console.log(`   👥 Total Patients: ${stats.total_patients}`);
    console.log(`   📈 Therapists with Patients: ${stats.therapists_with_patients}`);
    console.log(`   ✅ Successfully Inserted: ${insertedPatients}`);
    console.log(`   🔄 Duplicate Emails Skipped: ${duplicateCount}`);
    console.log(`   📊 Success Rate: ${Math.round((insertedPatients / (insertedPatients + duplicateCount)) * 100)}%`);
    
    console.log(`\\n📊 Final Patient Distribution by Therapist:`);
    finalDistribution.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.name || 'Unnamed'}: ${row.patient_count} patients`);
    });
    
    const avgPatientsPerTherapist = finalDistribution.reduce((sum, t) => sum + parseInt(t.patient_count), 0) / finalDistribution.length;
    console.log(`   📈 Average: ${Math.round(avgPatientsPerTherapist)} patients per therapist`);
    
    // Show range
    const patientCounts = finalDistribution.map(t => parseInt(t.patient_count)).sort((a, b) => a - b);
    console.log(`   📊 Range: ${patientCounts[0]} - ${patientCounts[patientCounts.length - 1]} patients per therapist`);
    
    console.log(`\\n🌐 Database is now populated! Access the application at: http://localhost:5173`);
    
    if (therapists.length > 0) {
      console.log(`\\n🔑 Sample Login Credentials:`);
      console.log(`   Email: ${therapists[0].email}`);
      console.log(`   Password: SecurePass123! (if created via API)`);
      console.log(`   Or try any of the other therapist emails shown above`);
    }
    
  } catch (error) {
    console.error('❌ Database population error:', error.message);
  } finally {
    await client.end();
    console.log('\\n👋 Database connection closed');
  }
}

finalPopulateDatabase().catch(console.error);