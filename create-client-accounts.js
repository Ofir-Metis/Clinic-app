const { Client } = require('pg');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'clinic',
  user: 'postgres',
  password: 'postgres'
};

async function createClientAccounts() {
  console.log('👥 Creating Client Login Accounts');
  console.log('Creating user accounts for patients with multiple therapists...\n');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Get patients with multiple therapists
    console.log('🔍 Finding patients with multiple therapists...');
    
    const multiTherapistQuery = `
      SELECT p.id, p."firstName", p."lastName", p.email, p.preferences
      FROM patients p
      WHERE p.preferences::text LIKE '%secondaryTherapist%'
      LIMIT 10
    `;
    
    const patientsResult = await client.query(multiTherapistQuery);
    const patients = patientsResult.rows;
    
    console.log(`📋 Found ${patients.length} patients with multiple therapists:`);
    
    let createdAccounts = 0;
    
    for (const patient of patients) {
      console.log(`\n👤 Creating account for: ${patient.firstName} ${patient.lastName}`);
      
      try {
        // Hash password
        const password = 'ClientPass123!';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user account
        const insertUserQuery = `
          INSERT INTO "user" (email, name, password, roles, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `;
        
        const userData = [
          patient.email,
          `${patient.firstName} ${patient.lastName}`,
          hashedPassword,
          ['client'], // Role as client
          new Date(),
          new Date()
        ];
        
        const userResult = await client.query(insertUserQuery, userData);
        const userId = userResult.rows[0].id;
        
        // Link patient to user account
        const linkQuery = `
          UPDATE patients 
          SET preferences = preferences || '{"userId": ${userId}}'::jsonb
          WHERE id = $1
        `;
        
        await client.query(linkQuery, [patient.id]);
        
        console.log(`   ✅ Created account - ID: ${userId}`);
        console.log(`   📧 Email: ${patient.email}`);
        console.log(`   🔒 Password: ${password}`);
        
        // Get therapist info for this client
        const therapistQuery = `
          SELECT u.name, u.email 
          FROM "user" u 
          WHERE u.id = $1
        `;
        
        const primaryTherapistResult = await client.query(therapistQuery, [JSON.parse(patient.preferences).secondaryTherapist]);
        const secondaryTherapist = primaryTherapistResult.rows[0];
        
        if (secondaryTherapist) {
          console.log(`   👨‍⚕️ Secondary Therapist: ${secondaryTherapist.name} (${secondaryTherapist.email})`);
        }
        
        createdAccounts++;
        
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`   ⚠️ Account already exists for ${patient.email}`);
        } else {
          console.log(`   ❌ Error creating account: ${error.message}`);
        }
      }
    }
    
    // Also create some additional client accounts for variety
    console.log(`\n\n🎯 Creating additional client accounts for testing...`);
    
    const additionalClientsQuery = `
      SELECT id, "firstName", "lastName", email
      FROM patients 
      WHERE id NOT IN (
        SELECT p.id FROM patients p
        WHERE p.preferences::text LIKE '%secondaryTherapist%'
      )
      ORDER BY RANDOM()
      LIMIT 5
    `;
    
    const additionalResult = await client.query(additionalClientsQuery);
    const additionalPatients = additionalResult.rows;
    
    for (const patient of additionalPatients) {
      console.log(`\n👤 Creating account for: ${patient.firstName} ${patient.lastName}`);
      
      try {
        // Hash password
        const password = 'ClientPass123!';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user account
        const insertUserQuery = `
          INSERT INTO "user" (email, name, password, roles, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `;
        
        const userData = [
          patient.email,
          `${patient.firstName} ${patient.lastName}`,
          hashedPassword,
          ['client'],
          new Date(),
          new Date()
        ];
        
        const userResult = await client.query(insertUserQuery, userData);
        const userId = userResult.rows[0].id;
        
        console.log(`   ✅ Created account - ID: ${userId}`);
        console.log(`   📧 Email: ${patient.email}`);
        console.log(`   🔒 Password: ${password}`);
        
        createdAccounts++;
        
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`   ⚠️ Account already exists for ${patient.email}`);
        } else {
          console.log(`   ❌ Error creating account: ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 CLIENT ACCOUNT CREATION COMPLETED!`);
    console.log(`📊 Summary:`);
    console.log(`   👥 Total Client Accounts Created: ${createdAccounts}`);
    console.log(`   🔐 Standard Password: ClientPass123!`);
    
    // Show all client accounts
    console.log(`\n🔑 ALL CLIENT LOGIN CREDENTIALS:`);
    
    const allClientsQuery = `
      SELECT u.id, u.name, u.email
      FROM "user" u
      WHERE 'client' = ANY(u.roles)
      ORDER BY u.id
    `;
    
    const allClientsResult = await client.query(allClientsQuery);
    const allClients = allClientsResult.rows;
    
    allClients.forEach((client, index) => {
      console.log(`\n   ${index + 1}. ${client.name}`);
      console.log(`      📧 Email: ${client.email}`);
      console.log(`      🔒 Password: ClientPass123!`);
      console.log(`      🆔 User ID: ${client.id}`);
    });
    
    // Show clients with multiple therapists specifically
    console.log(`\n🔄 CLIENTS WITH MULTIPLE THERAPISTS:`);
    
    const multiTherapistUsersQuery = `
      SELECT u.id, u.name, u.email, p.preferences
      FROM "user" u
      JOIN patients p ON u.email = p.email
      WHERE 'client' = ANY(u.roles) 
      AND p.preferences::text LIKE '%secondaryTherapist%'
    `;
    
    const multiResult = await client.query(multiTherapistUsersQuery);
    const multiClients = multiResult.rows;
    
    multiClients.forEach((client, index) => {
      console.log(`\n   ${index + 1}. ${client.name} ⭐ (Multiple Therapists)`);
      console.log(`      📧 Email: ${client.email}`);
      console.log(`      🔒 Password: ClientPass123!`);
      
      try {
        const prefs = JSON.parse(client.preferences);
        if (prefs.secondaryTherapist) {
          console.log(`      👥 Has secondary therapist (ID: ${prefs.secondaryTherapist})`);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    console.log(`\n🌐 CLIENT LOGIN URL: http://localhost:5173/client/login`);
    console.log(`💡 Use any of the client credentials above to test the client portal!`);
    
  } catch (error) {
    console.error('❌ Client account creation error:', error.message);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// Check if bcrypt is available
try {
  require('bcrypt');
  createClientAccounts().catch(console.error);
} catch (error) {
  console.log('❌ bcrypt not available. Installing...');
  console.log('💡 Run: npm install bcrypt');
  console.log('🔄 Then run this script again');
}