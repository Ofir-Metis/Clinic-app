const puppeteer = require('puppeteer');

// Therapist credentials from the API creation
const therapists = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Stress Management & Confidence Building'
  },
  {
    firstName: 'Michael', 
    lastName: 'Rodriguez',
    email: 'michael.rodriguez@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Personal Growth & Life Transitions'
  },
  {
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Trauma Recovery & Resilience Building'
  }
  // We'll start with first 3 therapists for testing
];

// Sample client data
const sampleClients = [
  {
    firstName: 'Alex',
    lastName: 'Thompson',
    email: 'alex.thompson@email.com',
    phone: '+1 (555) 123-4567',
    focusArea: 'Stress Management & Confidence Building'
  },
  {
    firstName: 'Jordan',
    lastName: 'Smith',
    email: 'jordan.smith@email.com', 
    phone: '+1 (555) 234-5678',
    focusArea: 'Personal Growth & Self-Discovery'
  },
  {
    firstName: 'Taylor',
    lastName: 'Davis',
    email: 'taylor.davis@email.com',
    phone: '+1 (555) 345-6789',
    focusArea: 'Social Confidence & Communication Skills'
  },
  {
    firstName: 'Morgan',
    lastName: 'Wilson',
    email: 'morgan.wilson@email.com',
    phone: '+1 (555) 456-7890',
    focusArea: 'Work-Life Balance Optimization'
  },
  {
    firstName: 'Casey',
    lastName: 'Brown',
    email: 'casey.brown@email.com',
    phone: '+1 (555) 567-8901',
    focusArea: 'Mindfulness & Emotional Wellness'
  }
];

async function populateClientsViaUI() {
  console.log('👥 Creating Clients via UI for Each Therapist\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Track successful creations
    let totalClientsCreated = 0;
    
    for (let therapistIndex = 0; therapistIndex < therapists.length; therapistIndex++) {
      const therapist = therapists[therapistIndex];
      
      console.log(`👨‍⚕️ Working on ${therapist.firstName} ${therapist.lastName}...`);
      
      // Navigate to login page
      console.log('   🔐 Logging in...');
      await page.goto('http://localhost:5173/login', { 
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await new Promise(r => setTimeout(r, 2000));
      
      // Clear any existing form data
      await page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.value = '');
      });
      
      // Login with therapist credentials
      try {
        await page.type('input[type="email"], input[name="email"]', therapist.email, { delay: 50 });
        await page.type('input[type="password"], input[name="password"]', therapist.password, { delay: 50 });
        
        // Find and click login button
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
        
        // Wait for login to complete
        await new Promise(r => setTimeout(r, 4000));
        
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log('   ❌ Login failed - still on login page');
          continue;
        }
        
        console.log('   ✅ Successfully logged in');
        
      } catch (error) {
        console.log('   ❌ Login error:', error.message);
        continue;
      }
      
      // Create clients for this therapist
      const clientsToCreate = therapistIndex === 0 ? 15 : (therapistIndex === 1 ? 25 : 10); // Vary the numbers
      console.log(`   👥 Creating ${clientsToCreate} clients...`);
      
      let clientsCreatedForTherapist = 0;
      
      for (let clientIndex = 0; clientIndex < clientsToCreate; clientIndex++) {
        try {
          // Navigate to add patient/client page
          await page.goto('http://localhost:5173/patients/new', { 
            waitUntil: 'networkidle2',
            timeout: 10000
          });
          
          await new Promise(r => setTimeout(r, 2000));
          
          // Generate client data (cycle through samples and add variations)
          const baseClient = sampleClients[clientIndex % sampleClients.length];
          const client = {
            firstName: baseClient.firstName + (Math.floor(clientIndex / sampleClients.length) || ''),
            lastName: baseClient.lastName,
            email: `${baseClient.firstName.toLowerCase()}${clientIndex}.${baseClient.lastName.toLowerCase()}@email.com`,
            phone: baseClient.phone.replace(/\\d{4}$/, (Math.floor(Math.random() * 9000) + 1000).toString()),
            focusArea: baseClient.focusArea
          };
          
          // Clear form first
          await page.evaluate(() => {
            document.querySelectorAll('input, textarea').forEach(el => el.value = '');
          });
          
          // Fill the form
          await page.type('input[name="firstName"], input[placeholder*="First"]', client.firstName, { delay: 30 });
          await page.type('input[name="lastName"], input[placeholder*="Last"]', client.lastName, { delay: 30 });
          await page.type('input[name="email"], input[type="email"]', client.email, { delay: 30 });
          
          // Phone field (if exists)
          const phoneField = await page.$('input[name="phone"], input[type="tel"]');
          if (phoneField) {
            await page.type('input[name="phone"], input[type="tel"]', client.phone, { delay: 30 });
          }
          
          // Notes or focus area (if exists)
          const notesField = await page.$('textarea[name="notes"], textarea[placeholder*="note"]');
          if (notesField) {
            await page.type('textarea[name="notes"], textarea[placeholder*="note"]', 
              `Focus area: ${client.focusArea}. Initial consultation completed.`, { delay: 20 });
          }
          
          // Submit the form
          await page.click('button[type="submit"], button:has-text("Add"), button:has-text("Create"), button:has-text("Save")');
          
          // Wait for form submission
          await new Promise(r => setTimeout(r, 3000));
          
          // Check if we were redirected (success) or stayed on form (error)
          const newUrl = page.url();
          if (!newUrl.includes('/new')) {
            clientsCreatedForTherapist++;
            totalClientsCreated++;
          }
          
          // Progress update
          if ((clientIndex + 1) % 5 === 0 || clientIndex === clientsToCreate - 1) {
            console.log(`      📈 Progress: ${clientIndex + 1}/${clientsToCreate} (${clientsCreatedForTherapist} successful)`);
          }
          
        } catch (error) {
          if (clientIndex < 3) {
            console.log(`      ⚠️ Client ${clientIndex + 1} creation error:`, error.message);
          }
        }
      }
      
      console.log(`   ✅ Completed: ${clientsCreatedForTherapist}/${clientsToCreate} clients created for ${therapist.firstName} ${therapist.lastName}`);
      
      // Logout before next therapist
      try {
        const logoutButton = await page.$('button:has-text("Logout"), button:has-text("Sign Out"), a[href*="logout"]');
        if (logoutButton) {
          await logoutButton.click();
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (error) {
        console.log('   ⚠️ Logout failed, continuing...');
      }
    }
    
    console.log(`\n🎉 CLIENT CREATION COMPLETED!`);
    console.log(`📊 Summary:`);
    console.log(`   👨‍⚕️ Therapists processed: ${therapists.length}`);
    console.log(`   👥 Total clients created: ${totalClientsCreated}`);
    
    if (totalClientsCreated > 0) {
      console.log(`\n✅ Database now contains:`);
      console.log(`   • 8 therapist accounts (created via API)`);
      console.log(`   • ${totalClientsCreated}+ client records (created via UI)`);
      console.log(`   • Realistic coaching-focused data with wellness terminology`);
      
      console.log(`\n🌐 Access the application at: http://localhost:5173`);
      console.log(`🔑 Login with any therapist credentials to explore the populated data`);
    }
    
    // Keep browser open for manual inspection
    console.log(`\n📱 Browser will remain open for 30 seconds for manual verification...`);
    await new Promise(r => setTimeout(r, 30000));
    
  } catch (error) {
    console.error('❌ UI population error:', error.message);
  } finally {
    await browser.close();
  }
}

populateClientsViaUI().catch(console.error);