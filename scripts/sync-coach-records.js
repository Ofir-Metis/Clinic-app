/**
 * Sync Coach Records Script
 *
 * This script creates coach records for existing users who have
 * 'coach' or 'therapist' role but don't have a corresponding
 * record in the coaches table.
 *
 * Usage: node scripts/sync-coach-records.js
 */

const { Client } = require('pg');
require('dotenv').config();

async function syncCoachRecords() {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'clinic',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Find all coach/therapist users without coach records
    const missingCoaches = await client.query(`
      SELECT u.id, u.email, u.name
      FROM "user" u
      WHERE ('coach' = ANY(u.roles) OR 'therapist' = ANY(u.roles))
        AND NOT EXISTS (SELECT 1 FROM coaches c WHERE c.email = u.email)
    `);

    console.log(`Found ${missingCoaches.rows.length} coach users without coach records`);

    if (missingCoaches.rows.length === 0) {
      console.log('All coach users already have coach records. Nothing to sync.');
      return;
    }

    let created = 0;
    let failed = 0;

    for (const user of missingCoaches.rows) {
      try {
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || 'Coach';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        await client.query(`
          INSERT INTO coaches (
            id, first_name, last_name, email, status, created_at, updated_at,
            professional_title, bio, specializations, verification_status,
            email_verified, phone_verified, background_check_completed,
            total_reviews, total_sessions_conducted, total_clients_served, accepting_new_clients
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, 'active', NOW(), NOW(),
            'Life Coach', 'Welcome to my practice.', '{}', 'verified',
            true, false, true, 0, 0, 0, true
          )
          ON CONFLICT (email) DO NOTHING
        `, [firstName, lastName, user.email]);

        console.log(`  Created coach record for: ${user.email}`);
        created++;
      } catch (error) {
        console.error(`  Failed to create coach record for ${user.email}:`, error.message);
        failed++;
      }
    }

    console.log('');
    console.log('Sync complete!');
    console.log(`  Created: ${created}`);
    console.log(`  Failed: ${failed}`);

  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the sync
syncCoachRecords();
