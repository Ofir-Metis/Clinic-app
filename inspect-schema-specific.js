const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const dbConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'clinic',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'your-strong-postgres-password-here'
};

async function checkSchema() {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const tables = ['user', 'coaches', 'client_coach_relationships', 'clients'];
        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const res = await client.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
            if (res.rows.length === 0) {
                // Check for singular/plural mismatch if not found (though I saw specific names)
                console.log("No columns found. Checking if table exists in lowercase...");
            }
            res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`));
        }
    } catch (e) { console.error(e); }
    finally { await client.end(); }
}

checkSchema();
