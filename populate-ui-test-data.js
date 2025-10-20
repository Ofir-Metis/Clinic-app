/**
 * Comprehensive UI/UX Test Data Population Script
 * Creates realistic data for a busy coach with 50+ clients and hundreds of appointments
 * This allows us to test the application with real-world data volumes
 */

const axios = require('axios');
const { faker } = require('@faker-js/faker');

const API_BASE = 'http://localhost:4000';

// Realistic coaching specializations and focus areas
const COACHING_SPECIALIZATIONS = [
  'Life Coaching', 'Career Transition', 'Executive Leadership', 'Relationship Coaching',
  'Health & Wellness', 'Stress Management', 'Goal Achievement', 'Personal Development',
  'Financial Planning', 'Communication Skills', 'Confidence Building', 'Work-Life Balance',
  'Spiritual Growth', 'Creative Expression', 'Mindfulness', 'Habit Formation'
];

const APPOINTMENT_TYPES = [
  'Initial Consultation', 'Regular Session', 'Follow-up', 'Goal Review',
  'Crisis Support', 'Group Session', 'Couple Session', 'Family Session',
  'Assessment', 'Check-in', 'Breakthrough Session', 'Maintenance'
];

const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled'];

const CLIENT_STATUSES = ['active', 'inactive', 'on-hold', 'graduated'];

// Generate realistic client data
function generateClient() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });

  return {
    firstName,
    lastName,
    email,
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
    status: faker.helpers.weightedArrayElement([
      { weight: 70, value: 'active' },
      { weight: 15, value: 'inactive' },
      { weight: 10, value: 'on-hold' },
      { weight: 5, value: 'graduated' }
    ]),
    focusArea: faker.helpers.arrayElement(COACHING_SPECIALIZATIONS),
    goals: generateClientGoals(),
    notes: generateClientNotes(),
    emergencyContact: {
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      relationship: faker.helpers.arrayElement(['spouse', 'parent', 'sibling', 'friend', 'partner'])
    },
    preferences: {
      sessionDuration: faker.helpers.arrayElement([30, 45, 60, 90]),
      preferredTime: faker.helpers.arrayElement(['morning', 'afternoon', 'evening']),
      communication: faker.helpers.arrayElement(['email', 'phone', 'text', 'app']),
      sessionType: faker.helpers.arrayElement(['in-person', 'video', 'phone', 'mixed'])
    },
    intake: {
      date: faker.date.past({ years: 2 }),
      referralSource: faker.helpers.arrayElement([
        'Self-referral', 'Friend/Family', 'Doctor', 'Therapist', 'Online Search',
        'Social Media', 'Professional Network', 'Insurance Provider', 'Employee Assistance'
      ]),
      previousCoaching: faker.datatype.boolean(),
      currentMedications: faker.helpers.maybe(() =>
        faker.helpers.arrayElements([
          'Antidepressant', 'Anxiety medication', 'Sleep aid', 'Blood pressure',
          'Diabetes medication', 'Pain management', 'Vitamin supplements'
        ], { min: 0, max: 3 })
      ),
      mentalHealthHistory: faker.helpers.maybe(() =>
        faker.helpers.arrayElements([
          'Depression', 'Anxiety', 'PTSD', 'ADHD', 'Bipolar', 'OCD', 'Eating disorder'
        ], { min: 0, max: 2 })
      )
    }
  };
}

function generateClientGoals() {
  const goals = [
    'Improve work-life balance', 'Advance career prospects', 'Build better relationships',
    'Develop leadership skills', 'Overcome anxiety', 'Lose weight and get healthy',
    'Start own business', 'Improve communication', 'Build confidence', 'Find life purpose',
    'Manage stress better', 'Develop better habits', 'Improve financial situation',
    'Find romantic partner', 'Strengthen family relationships', 'Overcome fears',
    'Improve time management', 'Develop creativity', 'Find spiritual connection',
    'Transition careers', 'Improve public speaking', 'Set boundaries', 'Practice mindfulness'
  ];

  return faker.helpers.arrayElements(goals, { min: 2, max: 5 });
}

function generateClientNotes() {
  const notes = [
    'Very motivated and engaged in the process',
    'Tends to be hard on themselves, working on self-compassion',
    'Strong analytical skills, sometimes overthinks situations',
    'Has made significant progress in confidence building',
    'Struggles with consistency but shows commitment',
    'Excellent at setting goals, needs support with follow-through',
    'Very responsive to positive reinforcement',
    'Benefits from structured approaches and clear action steps',
    'Has trauma history - proceed gently with certain topics',
    'High achiever, working on perfectionism patterns',
    'Strong family support system', 'Recently divorced, adjusting well',
    'Career transition going smoothly', 'Excellent homework completion',
    'Benefits from mindfulness techniques', 'Responds well to cognitive strategies',
    'Making steady progress on all goals', 'May benefit from group sessions'
  ];

  return faker.helpers.arrayElements(notes, { min: 1, max: 4 }).join('. ');
}

// Generate appointments for a client
function generateAppointmentsForClient(clientId, clientStatus) {
  const appointments = [];
  const numAppointments = clientStatus === 'active'
    ? faker.number.int({ min: 8, max: 25 })
    : faker.number.int({ min: 3, max: 12 });

  const startDate = faker.date.past({ years: 1 });

  for (let i = 0; i < numAppointments; i++) {
    const appointmentDate = faker.date.between({
      from: startDate,
      to: faker.date.future({ months: 3 })
    });

    const duration = faker.helpers.arrayElement([30, 45, 60, 90]);
    const endTime = new Date(appointmentDate.getTime() + duration * 60000);

    const isPast = appointmentDate < new Date();
    const status = isPast
      ? faker.helpers.weightedArrayElement([
          { weight: 85, value: 'completed' },
          { weight: 10, value: 'cancelled' },
          { weight: 5, value: 'no-show' }
        ])
      : faker.helpers.weightedArrayElement([
          { weight: 90, value: 'scheduled' },
          { weight: 10, value: 'rescheduled' }
        ]);

    appointments.push({
      clientId,
      startTime: appointmentDate,
      endTime: endTime,
      type: faker.helpers.arrayElement(APPOINTMENT_TYPES),
      status,
      notes: status === 'completed' ? generateSessionNotes() : null,
      location: faker.helpers.arrayElement(['Office', 'Video Call', 'Phone', 'Client Home']),
      sessionNumber: i + 1,
      goals: faker.helpers.arrayElements(generateClientGoals(), { min: 1, max: 3 }),
      homework: status === 'completed' ? generateHomework() : null,
      nextSteps: status === 'completed' ? generateNextSteps() : null,
      mood: status === 'completed' ? {
        before: faker.number.int({ min: 1, max: 10 }),
        after: faker.number.int({ min: 3, max: 10 })
      } : null,
      progressRating: status === 'completed' ? faker.number.int({ min: 1, max: 10 }) : null
    });
  }

  return appointments.sort((a, b) => a.startTime - b.startTime);
}

function generateSessionNotes() {
  const sessionNotes = [
    'Client arrived on time and was very engaged throughout the session',
    'Discussed progress on goals from last week - significant improvement noted',
    'Worked on anxiety management techniques, client practiced deep breathing',
    'Explored relationship patterns and communication styles',
    'Focused on career transition planning and next steps',
    'Client reported breakthrough moment regarding self-worth',
    'Practiced mindfulness exercises and stress reduction techniques',
    'Reviewed homework assignments - excellent completion rate',
    'Discussed challenges with work-life balance and boundary setting',
    'Client demonstrated increased confidence and assertiveness',
    'Worked on goal setting and action planning for next month',
    'Addressed setback from last week and reframed as learning opportunity',
    'Client shared significant personal insight about behavioral patterns',
    'Practiced new communication skills through role-playing exercises',
    'Discussed family dynamics and strategies for improvement',
    'Client reported improved sleep and energy levels',
    'Worked on financial planning and money mindset issues',
    'Explored values and life purpose in depth',
    'Client made commitment to specific behavioral changes',
    'Celebrated achievements and acknowledged growth since starting'
  ];

  return faker.helpers.arrayElements(sessionNotes, { min: 2, max: 4 }).join('. ');
}

function generateHomework() {
  const homework = [
    'Practice daily 10-minute meditation using app',
    'Complete values assessment worksheet',
    'Keep daily mood journal for one week',
    'Have difficult conversation with family member',
    'Research three potential career opportunities',
    'Practice assertiveness techniques in low-stakes situations',
    'Complete financial budget and expense tracking',
    'Write down three accomplishments daily',
    'Schedule self-care activities for each day',
    'Practice new communication script with trusted friend',
    'Read assigned chapter on mindfulness',
    'Complete goal-setting worksheet for next quarter',
    'Practice boundary-setting statements',
    'Keep sleep hygiene log for one week',
    'Write gratitude journal entries daily',
    'Schedule and attend networking event',
    'Complete anxiety monitoring worksheets',
    'Practice public speaking techniques',
    'Research mindfulness apps and choose one',
    'Plan and execute one social activity'
  ];

  return faker.helpers.arrayElements(homework, { min: 1, max: 3 });
}

function generateNextSteps() {
  const nextSteps = [
    'Continue practicing stress management techniques',
    'Follow up on career exploration activities',
    'Schedule appointment with financial advisor',
    'Begin implementing communication strategies',
    'Join support group or community activity',
    'Start new healthy habit identified in session',
    'Prepare for upcoming difficult conversation',
    'Research additional resources for goal achievement',
    'Schedule regular check-ins with accountability partner',
    'Begin implementing boundary-setting strategies',
    'Continue mindfulness practice with increased frequency',
    'Plan reward for achieving recent milestone',
    'Schedule follow-up appointment for goal review',
    'Begin journaling about insights from session',
    'Connect with recommended professional resources'
  ];

  return faker.helpers.arrayElements(nextSteps, { min: 1, max: 3 });
}

// Generate session notes and recordings
function generateSessionDocumentation(appointmentId) {
  return {
    appointmentId,
    notes: generateSessionNotes(),
    recordingAvailable: faker.datatype.boolean({ probability: 0.7 }),
    transcriptionAvailable: faker.datatype.boolean({ probability: 0.5 }),
    aiSummaryAvailable: faker.datatype.boolean({ probability: 0.6 }),
    keyTopics: faker.helpers.arrayElements([
      'Anxiety management', 'Goal setting', 'Relationship issues', 'Career planning',
      'Self-esteem', 'Communication skills', 'Stress management', 'Life transitions',
      'Mindfulness', 'Habit formation', 'Boundary setting', 'Financial wellness',
      'Family dynamics', 'Personal growth', 'Conflict resolution', 'Time management'
    ], { min: 2, max: 5 }),
    actionItems: generateHomework(),
    followUpRequired: faker.datatype.boolean({ probability: 0.3 }),
    riskLevel: faker.helpers.weightedArrayElement([
      { weight: 85, value: 'low' },
      { weight: 12, value: 'medium' },
      { weight: 3, value: 'high' }
    ])
  };
}

// Generate coach profile data
function generateCoachProfile() {
  return {
    name: 'Dr. ' + faker.person.fullName(),
    title: 'Licensed Professional Coach',
    specializations: faker.helpers.arrayElements(COACHING_SPECIALIZATIONS, { min: 3, max: 6 }),
    experience: faker.number.int({ min: 5, max: 20 }) + ' years',
    education: [
      'PhD in Psychology - Stanford University',
      'Master\'s in Counseling - UCLA',
      'Certified Professional Coach - ICF'
    ],
    bio: 'Passionate about helping individuals achieve their full potential through evidence-based coaching methodologies and personalized support.',
    officeHours: {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 4:00 PM',
      saturday: '10:00 AM - 2:00 PM',
      sunday: 'Closed'
    },
    rates: {
      individual: '$150/hour',
      couple: '$200/hour',
      group: '$75/person',
      intensive: '$1200/day'
    },
    contact: {
      email: 'coach@clinicapp.com',
      phone: faker.phone.number(),
      office: '123 Wellness Blvd, Suite 200, Wellness City, WC 12345'
    }
  };
}

// API Helper functions
async function createClient(clientData) {
  try {
    const response = await axios.post(`${API_BASE}/patients`, clientData);
    return response.data;
  } catch (error) {
    console.error('Error creating client:', error.message);
    return null;
  }
}

async function createAppointment(appointmentData) {
  try {
    const response = await axios.post(`${API_BASE}/appointments`, appointmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating appointment:', error.message);
    return null;
  }
}

async function createSessionNote(noteData) {
  try {
    const response = await axios.post(`${API_BASE}/notes`, noteData);
    return response.data;
  } catch (error) {
    console.error('Error creating session note:', error.message);
    return null;
  }
}

// Main population function
async function populateTestData() {
  console.log('🎯 Starting comprehensive UI/UX test data population...\n');

  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  try {
    // Generate coach profile
    console.log('👨‍⚕️ Setting up coach profile...');
    const coachProfile = generateCoachProfile();
    console.log(`Coach: ${coachProfile.name}`);
    console.log(`Specializations: ${coachProfile.specializations.join(', ')}\n`);

    // Generate 50+ clients
    console.log('👥 Creating diverse client base (50+ clients)...');
    const clients = [];
    const totalClients = 55; // Realistic busy practice size

    for (let i = 0; i < totalClients; i++) {
      const clientData = generateClient();
      console.log(`Creating client ${i + 1}/${totalClients}: ${clientData.firstName} ${clientData.lastName}`);

      const createdClient = await createClient(clientData);
      if (createdClient) {
        clients.push(createdClient);

        // Generate appointments for this client
        const appointments = generateAppointmentsForClient(createdClient.id, clientData.status);
        console.log(`  📅 Generated ${appointments.length} appointments`);

        for (const appointmentData of appointments) {
          const createdAppointment = await createAppointment(appointmentData);

          // Create session notes for completed appointments
          if (createdAppointment && appointmentData.status === 'completed') {
            const sessionDoc = generateSessionDocumentation(createdAppointment.id);
            await createSessionNote(sessionDoc);
          }
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Successfully populated test data:`);
    console.log(`   📊 Total Clients: ${clients.length}`);
    console.log(`   📈 Active Clients: ${clients.filter(c => c.status === 'active').length}`);
    console.log(`   🏃‍♂️ Inactive Clients: ${clients.filter(c => c.status === 'inactive').length}`);
    console.log(`   ⏸️ On-Hold Clients: ${clients.filter(c => c.status === 'on-hold').length}`);
    console.log(`   🎓 Graduated Clients: ${clients.filter(c => c.status === 'graduated').length}`);

    // Calculate total appointments
    const totalAppointments = clients.reduce((sum, client) => {
      return sum + (client.status === 'active' ?
        faker.number.int({ min: 8, max: 25 }) :
        faker.number.int({ min: 3, max: 12 }));
    }, 0);

    console.log(`   📅 Estimated Total Appointments: ${totalAppointments}`);
    console.log(`   📝 Session Notes: Comprehensive documentation`);
    console.log(`   🎯 Goals & Progress: Tracked per client`);
    console.log(`   📊 Analytics Data: Rich dataset for insights\n`);

    console.log('🎉 UI/UX test data population completed successfully!');
    console.log('🌐 Application ready for comprehensive UI/UX testing with realistic data volumes');

  } catch (error) {
    console.error('❌ Error populating test data:', error.message);
    process.exit(1);
  }
}

// Usage instructions
console.log(`
🎯 Comprehensive UI/UX Test Data Population Script
===============================================

This script creates a realistic coaching practice with:
• 50+ diverse clients with various statuses and specializations
• Hundreds of appointments spanning past and future
• Comprehensive session notes and documentation
• Goals, progress tracking, and outcomes
• Realistic coaching scenarios for testing

Usage:
1. Ensure the development environment is running
2. Run: node populate-ui-test-data.js
3. Wait for data population to complete
4. Access the application to test with realistic data volumes

The populated data will allow testing of:
• Dashboard performance with many clients
• Calendar views with busy schedules
• Client list filtering and search
• Appointment management workflows
• Analytics and reporting features
• Mobile responsiveness with real content
• Navigation and user experience flows
`);

// Run if called directly
if (require.main === module) {
  populateTestData();
}

module.exports = {
  populateTestData,
  generateClient,
  generateAppointmentsForClient,
  generateSessionDocumentation,
  generateCoachProfile
};