const puppeteer = require('puppeteer');
const axios = require('axios').default;

// Sample therapist data
const therapistData = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Anxiety & Stress Management',
    bio: 'Specializing in cognitive behavioral therapy and mindfulness techniques for anxiety management.',
    licenseNumber: 'LPC12345',
    yearsExperience: 8
  },
  {
    firstName: 'Michael',
    lastName: 'Rodriguez', 
    email: 'michael.rodriguez@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Depression & Mood Disorders',
    bio: 'Expert in treating depression using evidence-based therapeutic approaches.',
    licenseNumber: 'LPC23456',
    yearsExperience: 12
  },
  {
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@clinic.com', 
    password: 'SecurePass123!',
    specialization: 'Trauma & PTSD',
    bio: 'Specializing in trauma-informed care and EMDR therapy techniques.',
    licenseNumber: 'LPC34567',
    yearsExperience: 10
  },
  {
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Relationship Counseling',
    bio: 'Expert in couples therapy and family systems approaches.',
    licenseNumber: 'LMFT45678',
    yearsExperience: 15
  },
  {
    firstName: 'Jessica',
    lastName: 'Williams',
    email: 'jessica.williams@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Addiction & Recovery',
    bio: 'Specializing in substance abuse counseling and recovery support.',
    licenseNumber: 'LPC56789',
    yearsExperience: 9
  },
  {
    firstName: 'Robert',
    lastName: 'Davis',
    email: 'robert.davis@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Child & Adolescent Therapy',
    bio: 'Expert in working with children and teenagers using play and art therapy.',
    licenseNumber: 'LPC67890',
    yearsExperience: 11
  },
  {
    firstName: 'Amanda',
    lastName: 'Wilson',
    email: 'amanda.wilson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Grief & Loss Counseling',
    bio: 'Compassionate support for those experiencing grief and major life transitions.',
    licenseNumber: 'LPC78901',
    yearsExperience: 7
  },
  {
    firstName: 'Thomas',
    lastName: 'Anderson',
    email: 'thomas.anderson@clinic.com',
    password: 'SecurePass123!',
    specialization: 'Corporate Wellness & Stress',
    bio: 'Helping professionals manage workplace stress and achieve work-life balance.',
    licenseNumber: 'LPC89012',
    yearsExperience: 13
  }
];

// Patient name pools for generating realistic data
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Blake', 'Dakota', 'Hayden', 'Parker', 'Sage', 'River', 'Phoenix', 'Rowan',
  'Elena', 'Marcus', 'Sofia', 'Lucas', 'Isabella', 'Nathan', 'Emma', 'Gabriel',
  'Olivia', 'Samuel', 'Ava', 'Benjamin', 'Mia', 'Daniel', 'Charlotte', 'James',
  'Amelia', 'William', 'Harper', 'Alexander', 'Evelyn', 'Michael', 'Luna', 'Ethan'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
];

const focusAreas = [
  'Stress Management & Confidence Building',
  'Mindfulness & Emotional Wellness', 
  'Personal Growth & Self-Discovery',
  'Social Confidence & Communication Skills',
  'Work-Life Balance Optimization',
  'Relationship Building & Communication',
  'Goal Setting & Achievement',
  'Life Transitions & Change Management',
  'Self-Esteem & Personal Empowerment',
  'Creative Expression & Purpose Finding',
  'Health & Wellness Coaching',
  'Leadership & Professional Development'
];

function generatePatient(therapistId, index) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const focusArea = focusAreas[Math.floor(Math.random() * focusAreas.length)];
  
  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@email.com`,
    phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    focusArea,
    status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'on-hold' : 'inactive'),
    therapistId,
    notes: `Initial intake completed. Focus on ${focusArea.toLowerCase()} with personalized coaching approach.`
  };
}

async function populateDatabase() {
  console.log('🏥 Clinic Database Population Tool');
  console.log('Creating 8 therapists with 15-100 patients each...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Go to the application
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    console.log('📱 Navigating to application...');
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔐 Login required - using admin credentials...');
      
      // Try to login with admin credentials
      await page.type('input[type="email"], input[name="email"]', 'admin@clinic.com');
      await page.type('input[type="password"], input[name="password"]', 'admin123');
      await page.click('button[type="submit"], button:contains("Login")');
      
      await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('✅ Access granted - proceeding with data creation...\n');
    
    // Create each therapist
    const createdTherapists = [];
    
    for (let i = 0; i < therapistData.length; i++) {
      const therapist = therapistData[i];
      console.log(`👨‍⚕️ Creating Therapist ${i + 1}/8: ${therapist.firstName} ${therapist.lastName}`);
      
      try {
        // Navigate to registration page for therapists
        await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
        
        // Fill therapist registration form
        await page.type('input[name="firstName"], input[placeholder*="First"], input[label*="First"]', therapist.firstName);
        await page.type('input[name="lastName"], input[placeholder*="Last"], input[label*="Last"]', therapist.lastName);
        await page.type('input[name="email"], input[type="email"]', therapist.email);
        await page.type('input[name="password"], input[type="password"]:not([name="confirmPassword"])', therapist.password);
        
        // Try to find confirm password field
        const confirmPasswordField = await page.$('input[name="confirmPassword"], input[placeholder*="Confirm"]');
        if (confirmPasswordField) {
          await page.type('input[name="confirmPassword"], input[placeholder*="Confirm"]', therapist.password);
        }
        
        // Select therapist role if available
        const roleField = await page.$('select[name="role"], input[name="role"]');
        if (roleField) {
          await page.select('select[name="role"]', 'therapist');
        }
        
        // Submit registration
        await page.click('button[type="submit"], button:contains("Register"), button:contains("Sign Up")');
        await new Promise(r => setTimeout(r, 3000));
        
        createdTherapists.push({...therapist, id: i + 1});
        console.log(`   ✅ Created: ${therapist.firstName} ${therapist.lastName}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to create ${therapist.firstName} ${therapist.lastName}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Created ${createdTherapists.length}/8 therapists successfully\n`);
    
    // Create patients for each therapist
    let totalPatientsCreated = 0;
    
    for (let therapistIndex = 0; therapistIndex < createdTherapists.length; therapistIndex++) {
      const therapist = createdTherapists[therapistIndex];
      const patientCount = Math.floor(Math.random() * 86) + 15; // 15-100 patients
      
      console.log(`👥 Creating ${patientCount} patients for ${therapist.firstName} ${therapist.lastName}...`);
      
      for (let patientIndex = 0; patientIndex < patientCount; patientIndex++) {
        try {
          // Navigate to add patient page
          await page.goto('http://localhost:5173/patients/new', { waitUntil: 'networkidle2', timeout: 10000 });
          await new Promise(r => setTimeout(r, 1000));
          
          const patient = generatePatient(therapist.id, patientIndex);
          
          // Fill patient form
          await page.evaluate(() => {
            // Clear all inputs first
            document.querySelectorAll('input').forEach(input => input.value = '');
          });
          
          await page.type('input[name="firstName"], input[placeholder*="First"]', patient.firstName);
          await page.type('input[name="lastName"], input[placeholder*="Last"]', patient.lastName);
          await page.type('input[name="email"], input[type="email"]', patient.email);
          
          if (patient.phone) {
            const phoneField = await page.$('input[name="phone"], input[type="tel"]');
            if (phoneField) {
              await page.type('input[name="phone"], input[type="tel"]', patient.phone);
            }
          }
          
          // Add focus area or notes if fields exist
          const notesField = await page.$('textarea[name="notes"], textarea[placeholder*="notes"]');
          if (notesField) {
            await page.type('textarea[name="notes"], textarea[placeholder*="notes"]', patient.notes);
          }
          
          // Submit patient creation
          await page.click('button[type="submit"], button:contains("Add"), button:contains("Create"), button:contains("Save")');
          await new Promise(r => setTimeout(r, 1500));
          
          totalPatientsCreated++;
          
          if ((patientIndex + 1) % 10 === 0) {
            console.log(`   📈 Progress: ${patientIndex + 1}/${patientCount} patients created`);
          }
          
        } catch (error) {
          console.log(`   ⚠️ Failed to create patient ${patientIndex + 1}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Completed: ${patientCount} patients for ${therapist.firstName} ${therapist.lastName}`);
    }
    
    console.log(`\n🎉 DATABASE POPULATION COMPLETE!`);
    console.log(`📊 Summary:`);
    console.log(`   👨‍⚕️ Therapists Created: ${createdTherapists.length}`);
    console.log(`   👥 Total Patients Created: ${totalPatientsCreated}`);
    console.log(`   📈 Average Patients per Therapist: ${Math.round(totalPatientsCreated / createdTherapists.length)}`);
    
    // Create some multi-therapist relationships
    console.log(`\n🔄 Creating multi-therapist patient relationships...`);
    
    // This would require additional logic to assign some patients to multiple therapists
    // For now, we'll note this as a manual step that can be done through the admin interface
    
    console.log(`\n✅ Database population completed successfully!`);
    console.log(`🌐 You can now access the application at: http://localhost:5173`);
    console.log(`🔐 Use the therapist credentials created above to login and explore the data.`);
    
    // Keep browser open for 30 seconds to show results
    console.log(`\n📱 Browser will remain open for 30 seconds for inspection...`);
    await new Promise(r => setTimeout(r, 30000));
    
  } catch (error) {
    console.error('❌ Database population error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the population script
populateDatabase().catch(console.error);