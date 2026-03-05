
const fetch = require('node-fetch');

async function createRealAdmin() {
    console.log('Creating REAL admin using /auth/register...');

    const email = 'real-admin@clinic.com';
    const password = 'AdminPass123!';

    try {
        const response = await fetch('http://localhost:4000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name: 'Real Admin',
                role: 'admin'
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Failed: ${response.status} ${text}`);
            return;
        }

        const data = await response.json();
        console.log('Success!', data);
        console.log(`Credentials: ${email} / ${password}`);

    } catch (err) {
        console.error('Error:', err);
    }
}

createRealAdmin();
