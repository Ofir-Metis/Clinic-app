const puppeteer = require('puppeteer');

async function openUIForManualWork() {
  console.log('🖥️  Opening UI for Manual Database Population');
  console.log('========================================\n');
  
  console.log('🎯 Your mission: Create clients for the 8 therapists we created!\n');
  
  console.log('👨‍⚕️ Available Therapist Login Credentials:');
  console.log('1. Sarah Johnson - sarah.johnson@clinic.com (Password: SecurePass123!)');
  console.log('   🎯 Specialization: Stress Management & Confidence Building');
  console.log('2. Michael Rodriguez - michael.rodriguez@clinic.com (Password: SecurePass123!)');
  console.log('   🎯 Specialization: Personal Growth & Life Transitions');
  console.log('3. Emily Chen - emily.chen@clinic.com (Password: SecurePass123!)');
  console.log('   🎯 Specialization: Trauma Recovery & Resilience Building');
  console.log('4. David Thompson - david.thompson@clinic.com (Password: SecurePass123!)');
  console.log('   🎯 Specialization: Relationship & Communication Coaching');
  console.log('5. Jessica Williams - jessica.williams@clinic.com (Password: SecurePass123!)');
  console.log('   🎯 Specialization: Habit Change & Wellness Coaching');
  console.log('6. Robert Davis - robert.davis@clinic.com (Password: SecurePass123!)');
  console.log('   🎯 Specialization: Youth Empowerment & Development');
  console.log('7. Amanda Wilson - amanda.wilson@clinic.com (Password: SecurePass123!)');
  console.log('   🎯 Specialization: Grief Support & Life Renewal');
  console.log('8. Thomas Anderson - thomas.anderson@clinic.com (Password: SecurePass123!)');
  console.log('   🎯 Specialization: Executive Coaching & Leadership Development\\n');
  
  console.log('📝 Manual Steps to Complete:');
  console.log('   1. 🌐 Browser will open to http://localhost:5173');
  console.log('   2. 🔐 Login with any therapist credentials above');
  console.log('   3. 👥 Navigate to "Patients" or "Clients" section');  
  console.log('   4. ➕ Click "Add New Patient/Client" button');
  console.log('   5. 📋 Fill out client forms with sample data');
  console.log('   6. 🔄 Repeat for 15-100 clients per therapist');
  console.log('   7. 🔄 Logout and repeat with different therapists\\n');
  
  console.log('💡 Sample Client Data to Use:');
  
  const sampleClients = [
    'Alex Thompson - alex.thompson@email.com - Focus: Stress Management',
    'Jordan Smith - jordan.smith@email.com - Focus: Personal Growth', 
    'Taylor Davis - taylor.davis@email.com - Focus: Social Confidence',
    'Morgan Wilson - morgan.wilson@email.com - Focus: Work-Life Balance',
    'Casey Brown - casey.brown@email.com - Focus: Mindfulness',
    'Riley Garcia - riley.garcia@email.com - Focus: Goal Setting',
    'Avery Miller - avery.miller@email.com - Focus: Life Transitions',
    'Quinn Johnson - quinn.johnson@email.com - Focus: Self-Esteem',
    'Blake Williams - blake.williams@email.com - Focus: Communication',
    'Dakota Lee - dakota.lee@email.com - Focus: Creative Expression'
  ];
  
  sampleClients.forEach((client, index) => {
    console.log(`   ${index + 1}. ${client}`);
  });
  
  console.log('\\n🎯 Goal: Create 15-100 clients per therapist (total 400-800 clients)');
  console.log('⚡ Tip: Use variations of the sample names and add numbers/variations');
  console.log('📞 Phone numbers: Use format +1 (555) XXX-XXXX');
  console.log('🎭 Mix active/inactive status and different focus areas\\n');
  
  console.log('🚀 Opening browser now... Happy data creation!\\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 0,
    args: ['--no-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the application
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    console.log('🌐 Application loaded! You can now start creating clients manually.');
    console.log('💾 This script will keep the browser open for you to work.');
    console.log('❌ Close this terminal window when you are done to close the browser.\\n');
    
    // Keep the browser open indefinitely
    const keepAlive = setInterval(() => {
      // Just keep the process alive
    }, 30000);
    
    // Wait for user to close manually or press Ctrl+C
    process.on('SIGINT', () => {
      console.log('\\n👋 Closing browser...');
      clearInterval(keepAlive);
      browser.close();
      process.exit(0);
    });
    
    // Keep alive forever until user closes
    await new Promise(resolve => {
      // This will never resolve, keeping browser open
    });
    
  } catch (error) {
    console.error('❌ Error opening browser:', error.message);
    await browser.close();
  }
}

openUIForManualWork().catch(console.error);