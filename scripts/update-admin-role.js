
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'clinic',
    password: 'your-strong-postgres-password-here',
    port: 5432,
});

async function updateAdminRole() {
    try {
        await client.connect();
        console.log('Connected to database');

        const email = 'real-admin@clinic.com';

        // Check if user exists - key change: "user" table in quotes
        const res = await client.query('SELECT * FROM "user" WHERE email = $1', [email]);
        if (res.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        console.log('Found user:', res.rows[0].email, 'Current roles:', res.rows[0].roles);

        // Update role - key change: "user" table in quotes
        const updateRes = await client.query('UPDATE "user" SET roles = $1 WHERE email = $2 RETURNING *', [['admin'], email]);
        console.log('Updated user roles:', updateRes.rows[0].roles);

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

updateAdminRole();
