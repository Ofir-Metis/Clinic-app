const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'your-strong-postgres-password-here',
    database: 'clinic',
});

async function checkData() {
    try {
        await client.connect();
        console.log('✅ Connected');

        // Check columns of appointments table
        const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments'");
        // console.log('Cols:', cols.rows.map(r => r.column_name).join(', '));

        // Check appointment for QA/Test patient
        // We first find the patient ID
        const patParams = ['QA', 'Test'];
        // Note: column names likely camelCase or snake_case. 
        // Based on previous 'clients' query dump (which I didn't see), let's try broadly.
        // Standardize to likely columns based on known schema style
        const patRes = await client.query(`SELECT id FROM clients WHERE first_name = $1 AND last_name = $2`, patParams);

        if (patRes.rows.length === 0) {
            console.log('❌ Patient QA Test not found via explicit query.');
            // Try listing top 5 clients again
            const all = await client.query('SELECT id, first_name, last_name FROM clients LIMIT 5');
            console.log('Top clients:', all.rows);
        } else {
            const patId = patRes.rows[0].id;
            console.log('Found Patient ID:', patId);

            // Query appointments
            // Try 'client_id' or 'patient_id'
            try {
                const appts = await client.query(`SELECT * FROM appointments WHERE client_id = '${patId}' OR patient_id = '${patId}'`);
                console.log('Appointments found:', appts.rows.length);
                console.table(appts.rows);
            } catch (e) {
                console.log('Query failed using OR. Checking columns...');
                console.log('Cols:', cols.rows.map(r => r.column_name).join(', '));
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkData();
