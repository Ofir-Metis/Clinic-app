const puppeteer = require('puppeteer');
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

const therapists = [
    { email: 'sarah.johnson@clinic.com', password: 'SecurePass123!' },
    { email: 'michael.rodriguez@clinic.com', password: 'SecurePass123!' },
    { email: 'emily.chen@clinic.com', password: 'SecurePass123!' }
];

async function getClientsForTherapist(therapistEmail) {
    const client = new Client(dbConfig);
    await client.connect();
    try {
        // 1. Get Coach ID from coaches table
        const coachRes = await client.query('SELECT id FROM coaches WHERE email = $1', [therapistEmail]);
        const coachId = coachRes.rows[0]?.id;

        if (!coachId) {
            console.log(`Therapist ${therapistEmail} not found in coaches table.`);
            return [];
        }

        // 2. Get Clients via relationship
        const clientsRes = await client.query(
            `SELECT c.first_name as "firstName", c.last_name as "lastName", c.id 
             FROM clients c
             JOIN client_coach_relationships r ON c.id = r.client_id
             WHERE r.coach_id = $1
             LIMIT 10`,
            [coachId]
        );
        return clientsRes.rows;
    } finally {
        await client.end();
    }
}

async function populateAppointments() {
    console.log('📅 Creating Appointments via UI');

    const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();

        for (const therapist of therapists) {
            console.log(`\n👨‍⚕️ Processing for ${therapist.email}...`);

            try {
                // 1. Login
                await page.goto('http://localhost:5173/login');
                await page.waitForSelector('#email');
                await page.type('#email', therapist.email);
                await page.type('#password', therapist.password);

                const loginBtn = await page.evaluateHandle(() => document.querySelector('button[type="submit"]'));
                await loginBtn.click();

                await page.waitForNavigation({ waitUntil: 'networkidle2' });
            } catch (e) {
                console.log(`   ❌ Login failed: ${e.message}`);
                continue;
            }

            const clients = await getClientsForTherapist(therapist.email);
            console.log(`   Found ${clients.length} clients for this therapist.`);

            for (let i = 0; i < clients.length; i++) {
                const client = clients[i];

                try {
                    // 2. Open Appointment Modal
                    try {
                        const addBtnHandle = await page.evaluateHandle(() => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            return buttons.find(b => b.innerText.includes('הוספה') || b.innerText.includes('Add'));
                        });

                        if (addBtnHandle.asElement()) {
                            await addBtnHandle.click();
                        } else {
                            throw new Error("Add button not found");
                        }
                    } catch (e) {
                        console.log("   ⚠️ 'Add' button not found, trying navigation to /calendar");
                        await page.goto('http://localhost:5173/calendar');
                        await new Promise(r => setTimeout(r, 2000));

                        const addBtnHandle = await page.evaluateHandle(() => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            return buttons.find(b => b.innerText.includes('הוספה') || b.innerText.includes('Add'));
                        });
                        if (addBtnHandle.asElement()) await addBtnHandle.click();
                    }

                    // 3. Fill Form
                    await new Promise(r => setTimeout(r, 1000));

                    // Client Select
                    const inputs = await page.$$('input[role="combobox"]');
                    if (inputs.length > 0) {
                        await inputs[0].click();
                        await page.keyboard.type(client.firstName);
                        await new Promise(r => setTimeout(r, 1000));
                        await page.keyboard.press('ArrowDown');
                        await page.keyboard.press('Enter');
                    }

                    // Notes
                    const notes = await page.$('textarea[placeholder="הערות למפגש"]');
                    if (notes) await notes.type('Regular check-in session.');

                    // Submit
                    const submitHandle = await page.evaluateHandle(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        return buttons.find(b => b.innerText.includes('קביעה') || b.innerText.includes('Create') || b.innerText.includes('Set'));
                    });

                    if (submitHandle.asElement()) {
                        await submitHandle.click();
                        await new Promise(r => setTimeout(r, 2000));
                        console.log(`   ✅ Appt set for ${client.firstName} ${client.lastName}`);
                    } else {
                        console.log(`   ❌ Submit button not found for ${client.firstName}`);
                    }

                } catch (e) {
                    console.log(`   ❌ Failed to set appt for ${client.firstName}: ${e.message}`);
                }

                // Refresh to reset state
                await page.reload({ waitUntil: 'networkidle0' });
            }

            // Logout
            await page.goto('http://localhost:5173/logout');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await browser.close();
    }
}

populateAppointments();
