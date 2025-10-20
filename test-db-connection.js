const { Client } = require('pg');

const client = new Client({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: +(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'clinic',
  connectTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    console.log('Attempting to connect to PostgreSQL...');
    console.log(`Host: ${client.host}:${client.port}`);
    console.log(`Database: ${client.database}`);
    console.log(`User: ${client.user}`);
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query executed successfully:', result.rows[0]);
    
    await client.end();
    console.log('✅ Connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();