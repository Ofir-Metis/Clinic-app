const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'clinic',
  user: 'postgres',
  password: 'postgres'
};

async function checkUserTable() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Check user table structure
    console.log('🔍 User table structure:');
    const userColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const userResult = await client.query(userColumnsQuery);
    userResult.rows.forEach((column, index) => {
      console.log(`   ${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check if there are any users
    console.log('\\n🔍 Checking for existing users...');
    try {
      const countQuery = 'SELECT COUNT(*) as count FROM "user"';
      const countResult = await client.query(countQuery);
      console.log(`Found ${countResult.rows[0].count} users in database`);
      
      if (parseInt(countResult.rows[0].count) > 0) {
        console.log('\\n📋 Sample user data:');
        const sampleQuery = 'SELECT * FROM "user" LIMIT 3';
        const sampleResult = await client.query(sampleQuery);
        sampleResult.rows.forEach((user, index) => {
          console.log(`   User ${index + 1}:`, JSON.stringify(user, null, 2));
        });
      }
    } catch (error) {
      console.log('Error checking users:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserTable().catch(console.error);