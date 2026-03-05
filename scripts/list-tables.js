
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'clinic',
    password: 'your-strong-postgres-password-here',
    port: 5432,
});

async function listTables() {
    try {
        await client.connect();
        console.log('Connected to database');

        const res = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name;
    `);

        console.log('Tables found:');
        res.rows.forEach(row => {
            console.log(`${row.table_schema}.${row.table_name}`);
        });

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

listTables();
