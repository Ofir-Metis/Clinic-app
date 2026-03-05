const { Client } = require('pg');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const dbConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'clinic',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'your-strong-postgres-password-here'
};

const therapists = [
    { first: 'Sarah', last: 'Johnson', email: 'sarah.johnson@clinic.com' },
    { first: 'Michael', last: 'Rodriguez', email: 'michael.rodriguez@clinic.com' },
    { first: 'Emily', last: 'Chen', email: 'emily.chen@clinic.com' }
];

// Password hash for 'SecurePass123!' (taken from create-test-data.sql or generated)
// Actually create-test-data used a hash. I'll use a known hash or generated one if possible. 
// Using the one from the SQL file for 'password': 
// $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
const bcrypt = require('bcrypt');

async function seed() {
    const client = new Client(dbConfig);
    const PASSHASH = await bcrypt.hash('SecurePass123!', 10);
    try {
        await client.connect();
        console.log('Connected to DB');

        // Clear existing data (optional, but good for reliable testing)
        await client.query('TRUNCATE table "user", coaches, clients, client_coach_relationships, appointments, patient_appointment CASCADE');

        for (const t of therapists) {
            console.log(`Creating therapist ${t.email}`);

            // 1. Create User
            // "user" table: email, password, name, roles, createdAt, updatedAt
            const userRes = await client.query(
                `INSERT INTO "user" (email, password, name, roles, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, NOW(), NOW()) 
         ON CONFLICT (email) DO UPDATE SET name = $3 RETURNING id`,
                [t.email, PASSHASH, `${t.first} ${t.last}`, ['coach']]
            );

            // 2. Create Coach
            const coachRes = await client.query(
                `INSERT INTO coaches (
           id, first_name, last_name, email, status, created_at, updated_at,
           professional_title, bio, specializations, verification_status,
           email_verified, phone_verified, background_check_completed,
           total_reviews, total_sessions_conducted, total_clients_served, accepting_new_clients
         )
         VALUES (
           gen_random_uuid(), $1, $2, $3, 'active', NOW(), NOW(),
           'Clinical Psychologist', 'Experienced therapist.', '{}', 'verified',
           true, false, true,
           0, 0, 0, true
         )
         ON CONFLICT (email) DO UPDATE SET first_name=$1 RETURNING id`,
                [t.first, t.last, t.email]
            );
            const coachId = coachRes.rows[0].id;

            // 3. Create Clients
            for (let i = 0; i < 5; i++) {
                const cEmail = `client${i}.${t.first.toLowerCase()}@test.com`;

                // User for client
                await client.query(
                    `INSERT INTO "user" (email, password, name, roles, "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, $4, NOW(), NOW()) 
             ON CONFLICT (email) DO NOTHING`,
                    [cEmail, PASSHASH, `Client ${i} of ${t.first}`, ['client']]
                );

                // Client record
                // Note: columns like status, onboarding_status, etc. were removed by appointments-service migration
                const clientRes = await client.query(
                    `INSERT INTO clients (
               id, first_name, last_name, email, "createdAt", "updatedAt",
               therapist_id, whatsapp_opt_in 
             )
             VALUES (
               gen_random_uuid(), $1, $2, $3, NOW(), NOW(),
               $4, false
             )
             ON CONFLICT (email) DO UPDATE SET first_name=$1 RETURNING id`,
                    [`Client${i}`, `${t.first}Client`, cEmail, coachId]
                );
                const clientId = clientRes.rows[0].id;

                // 4. Relationship
                await client.query(
                    `INSERT INTO client_coach_relationships (
               id, client_id, coach_id, status, created_at, updated_at,
               "relationshipType", "data_access_level"
             )
             VALUES (
               gen_random_uuid(), $1, $2, 'active', NOW(), NOW(),
               'primary', 'full'
             )`,
                    [clientId, coachId]
                );
            }
        }
        console.log("Seeding complete.");

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

seed();
