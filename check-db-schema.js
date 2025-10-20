const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'clinic',
  user: 'postgres',
  password: 'postgres'
};

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema\n');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Check what tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const tables = tablesResult.rows;
    
    console.log(`\n📋 Found ${tables.length} tables in database:`);
    
    if (tables.length === 0) {
      console.log('   (No tables found - database may need initialization)');
      
      console.log('\n💡 Possible solutions:');
      console.log('   1. Run database migrations from the services');
      console.log('   2. Start the backend services to auto-create tables');
      console.log('   3. Check if the database is properly initialized');
      
      return;
    }
    
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    // Check columns for key tables if they exist
    const keyTables = ['users', 'patients', 'clients', 'therapists', 'appointments'];
    
    for (const tableName of keyTables) {
      const tableExists = tables.some(t => t.table_name.toLowerCase() === tableName.toLowerCase());
      
      if (tableExists) {
        console.log(`\n🔍 Structure of ${tableName} table:`);
        
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
        
        const columnsResult = await client.query(columnsQuery, [tableName]);
        const columns = columnsResult.rows;
        
        columns.forEach((column, index) => {
          console.log(`   ${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Show sample data
        const sampleQuery = `SELECT * FROM "${tableName}" LIMIT 3;`;
        try {
          const sampleResult = await client.query(sampleQuery);
          if (sampleResult.rows.length > 0) {
            console.log(`   📊 Sample data (${sampleResult.rows.length} rows):`);
            sampleResult.rows.forEach((row, index) => {
              console.log(`      Row ${index + 1}:`, JSON.stringify(row, null, 2).substring(0, 100) + '...');
            });
          } else {
            console.log('   📊 No data found in table');
          }
        } catch (error) {
          console.log(`   ⚠️ Could not read sample data: ${error.message}`);
        }
      }
    }
    
    // Check for any existing user/therapist data
    console.log('\n🔍 Checking for existing user data...');
    
    const userTables = ['users', 'therapists', 'auth_users', 'accounts'];
    let foundUserData = false;
    
    for (const tableName of userTables) {
      const tableExists = tables.some(t => t.table_name.toLowerCase() === tableName.toLowerCase());
      
      if (tableExists) {
        try {
          const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
          const countResult = await client.query(countQuery);
          const count = parseInt(countResult.rows[0].count);
          
          if (count > 0) {
            console.log(`   ✅ Found ${count} records in ${tableName} table`);
            foundUserData = true;
            
            // Show sample emails/usernames if available
            const commonFields = ['email', 'username', 'firstName', 'lastName', 'name'];
            for (const field of commonFields) {
              try {
                const sampleQuery = `SELECT "${field}" FROM "${tableName}" LIMIT 5;`;
                const sampleResult = await client.query(sampleQuery);
                if (sampleResult.rows.length > 0) {
                  const values = sampleResult.rows.map(row => row[field]).filter(v => v);
                  if (values.length > 0) {
                    console.log(`      ${field}s: ${values.join(', ')}`);
                  }
                }
              } catch (error) {
                // Field doesn't exist, continue
              }
            }
          }
        } catch (error) {
          console.log(`   ⚠️ Could not count records in ${tableName}: ${error.message}`);
        }
      }
    }
    
    if (!foundUserData) {
      console.log('   ❌ No user/therapist data found in database');
      console.log('   💡 You may need to create users first before creating patients');
    }
    
  } catch (error) {
    console.error('❌ Database check error:', error.message);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

checkDatabaseSchema().catch(console.error);