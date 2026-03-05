require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'clinic',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');
        await client.query('TRUNCATE table "user", coaches, clients, client_coach_relationships, appointments, patient_appointment CASCADE');
        console.log('Truncated tables.');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
