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
    'Aria', 'Owen', 'Zoe', 'Liam', 'Chloe', 'Noah', 'Grace', 'Jackson', 'Lily', 'Aiden'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
  ];

  const patients = [];
  
  for (let i = 0; i < totalPatients; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Distribute patients across therapists (some therapists get more patients)
    let therapistId;
    if (i < totalPatients * 0.3) {
      // 30% to first 2 therapists (busier therapists)
      therapistId = therapistIds[Math.floor(Math.random() * Math.min(2, therapistIds.length))];
    } else if (i < totalPatients * 0.7) {
      // 40% to next 3 therapists
      therapistId = therapistIds[2 + Math.floor(Math.random() * Math.min(3, therapistIds.length - 2))];
    } else {
      // 30% to remaining therapists
      therapistId = therapistIds[5 + Math.floor(Math.random() * Math.max(1, therapistIds.length - 5))];
    }
    
    patients.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      whatsappOptIn: Math.random() > 0.3, // 70% opt in to WhatsApp
      therapistId,
      emergencyContact: {
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        relationship: ['spouse', 'parent', 'sibling', 'friend'][Math.floor(Math.random() * 4)]
      },
      preferences: {
        communicationPreference: ['email', 'phone', 'whatsapp'][Math.floor(Math.random() * 3)],
        sessionReminders: Math.random() > 0.2, // 80% want reminders
        reminderHours: [1, 2, 24, 48][Math.floor(Math.random() * 4)],
        preferredTime: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)]
      },
      gdprConsent: {
        dataProcessing: true,
        marketing: Math.random() > 0.4, // 60% consent to marketing
        consentDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in past year
      updatedAt: new Date()
    });
  }
  
  return patients;
}

async function populateRealDatabase() {
  console.log('🏥 Populating Real Database with Patients');
  console.log('Using actual clinic database schema...\n');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // First, get the therapist IDs from the user table
    console.log('🔍 Finding created therapist accounts...');
    
    const therapistQuery = `
      SELECT id, email, "firstName", "lastName" 
      FROM "user" 
      WHERE email LIKE '%@clinic.com'
      ORDER BY id
    `;
    
    const therapistResult = await client.query(therapistQuery);
    const therapists = therapistResult.rows;
    
    console.log(`📋 Found ${therapists.length} therapist accounts:`);
    therapists.forEach((therapist, index) => {
      console.log(`   ${index + 1}. ${therapist.firstName} ${therapist.lastName} (ID: ${therapist.id})`);
    });
    
    if (therapists.length === 0) {
      console.log('❌ No therapists found. Please run the therapist creation script first.');
      return;
    }
    
    const therapistIds = therapists.map(t => t.id);
    
    // Generate patient data
    console.log('\\n👥 Generating patient data...');
    const patients = generatePatients(therapistIds, 500); // Generate 500 patients
    
    console.log(`   📊 Generated ${patients.length} patients for ${therapists.length} therapists`);
    
    // Show distribution
    const distribution = {};
    patients.forEach(p => {
      distribution[p.therapistId] = (distribution[p.therapistId] || 0) + 1;
    });
    
    console.log('   📈 Patient distribution:');
    therapists.forEach(therapist => {
      const count = distribution[therapist.id] || 0;
      console.log(`      ${therapist.firstName} ${therapist.lastName}: ${count} patients`);
    });
    
    // Insert patients in batches
    console.log('\\n💾 Inserting patients into database...');
    let insertedPatients = 0;
    const batchSize = 25;
    
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
          if (!error.message.includes('duplicate key')) {
            console.log(`   ⚠️ Error inserting patient ${patientData.firstName} ${patientData.lastName}: ${error.message}`);
          }
        }
      }
      
      console.log(`   📈 Progress: ${Math.min(i + batchSize, patients.length)}/${patients.length} processed (${insertedPatients} successful)`);
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
        u."firstName", u."lastName", u.email,
        COUNT(p.id) as patient_count
      FROM "user" u
      LEFT JOIN patients p ON u.id = p."therapistId"
      WHERE u.email LIKE '%@clinic.com'
      GROUP BY u.id, u."firstName", u."lastName", u.email
      ORDER BY patient_count DESC
    `;
    
    const distributionResult = await client.query(distributionQuery);
    const finalDistribution = distributionResult.rows;
    
    console.log(`\\n🎉 DATABASE POPULATION COMPLETED!`);
    console.log(`📊 Final Statistics:`);
    console.log(`   👨‍⚕️ Total Therapists: ${therapists.length}`);
    console.log(`   👥 Total Patients: ${stats.total_patients}`);
    console.log(`   📈 Therapists with Patients: ${stats.therapists_with_patients}`);
    console.log(`   ✅ Success Rate: ${Math.round((insertedPatients / patients.length) * 100)}%`);
    
    console.log(`\\n📊 Final Patient Distribution:`);
    finalDistribution.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.firstName} ${row.lastName}: ${row.patient_count} patients`);
    });
    
    // Create some sample appointments for variety
    console.log('\\n📅 Creating sample appointments...');
    
    let appointmentsCreated = 0;
    const appointmentsBatch = 50;
    
    for (let i = 0; i < appointmentsBatch; i++) {
      try {
        // Get random patient and therapist
        const randomPatient = Math.floor(Math.random() * insertedPatients) + 1;
        const randomTherapist = therapistIds[Math.floor(Math.random() * therapistIds.length)];
        
        // Generate future appointment time
        const futureDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Next 30 days
        const startTime = new Date(futureDate);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour session
        
        const appointmentQuery = `
          INSERT INTO appointments (
            therapist_id, client_id, start_time, end_time, meeting_type, 
            status, title, description, meeting_config, calendar_synced,
            reminder_sent, confirmation_sent, reminder_times, is_recurring,
            created_at, updated_at, created_by, "patientId", datetime
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `;
        
        const appointmentValues = [
          therapistIds[0], // therapist_id (UUID - using first therapist ID)
          therapistIds[0], // client_id (UUID - using same for now) 
          startTime,
          endTime,
          'in_person',
          'scheduled',
          'Coaching Session',
          'Regular coaching session focusing on personal development goals',
          JSON.stringify({ type: 'in_person', location: 'Office' }),
          false,
          false,
          false,
          JSON.stringify([24, 1]), // 24h and 1h reminders
          false,
          new Date(),
          new Date(), 
          therapistIds[0], // created_by
          randomPatient, // patientId
          startTime // datetime
        ];
        
        await client.query(appointmentQuery, appointmentValues);
        appointmentsCreated++;
        
      } catch (error) {
        // Ignore appointment creation errors for now
        if (i < 3) {
          console.log(`   ⚠️ Appointment creation error: ${error.message}`);
        }
      }
    }
    
    if (appointmentsCreated > 0) {
      console.log(`   ✅ Created ${appointmentsCreated} sample appointments`);
    }
    
    console.log(`\\n🌐 You can now access the application at: http://localhost:5173`);
    console.log(`🔑 Login with any therapist credentials to see the populated data:`);
    
    console.log('\\n👨‍⚕️ Sample Login Credentials:');
    console.log('   Email: sarah.johnson@clinic.com');
    console.log('   Password: SecurePass123!');
    console.log('   (Or use any of the other 7 therapist accounts created earlier)');
    
  } catch (error) {
    console.error('❌ Database population error:', error);
  } finally {
    await client.end();
    console.log('\\n👋 Database connection closed');
  }
}

populateRealDatabase().catch(console.error);