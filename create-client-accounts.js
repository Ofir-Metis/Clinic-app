const { Client } = require('pg');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'clinic',
  user: 'postgres',
  password: 'your-strong-postgres-password-here'
};

async function createClientAccounts() {
  console.log('👥 Creating Client Login Accounts (Simplified)');

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Get random clients who don't have user accounts yet (by checking email matches? simplistic check)
    // Actually, we'll just try to create accounts for 10 random clients.
    // Assuming clients table has emails that might NOT be in "user" table yet.

    const randomClientsQuery = `
      SELECT id, "first_name" as "firstName", "last_name" as "lastName", email
      FROM clients
      ORDER BY RANDOM()
      LIMIT 10
    `;

    const clientsResult = await client.query(randomClientsQuery);
    const clients = clientsResult.rows;

    console.log(`📋 Found ${clients.length} random clients to create accounts for:`);

    let createdAccounts = 0;

    for (const c of clients) {
      console.log(`\n👤 Creating account for: ${c.firstName} ${c.lastName}`);

      try {
        const password = 'ClientPass123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user account
        // Roles is array
        const insertUserQuery = `
          INSERT INTO "user" (email, name, password, roles, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `;

        const userData = [
          c.email,
          `${c.firstName} ${c.lastName}`,
          hashedPassword,
          ['client'],
          new Date(),
          new Date()
        ];

        const userResult = await client.query(insertUserQuery, userData);
        const userId = userResult.rows[0].id; // unused but good to know it worked

        console.log(`   ✅ Created account - Email: ${c.email}`);
        createdAccounts++;

      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`   ⚠️ Account already exists for ${c.email}`);
        } else {
          console.log(`   ❌ Error creating account: ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 CLIENT ACCOUNT CREATION COMPLETED!`);
    console.log(`   Accounts Created: ${createdAccounts}`);
    console.log(`   Password: ClientPass123!`);

  } catch (error) {
    console.error('❌ Client account creation error:', error.message);
  } finally {
    await client.end();
  }
}

// Check if bcrypt is available
try {
  require('bcrypt');
  createClientAccounts().catch(console.error);
} catch (error) {
  console.log('❌ bcrypt not available.');
}