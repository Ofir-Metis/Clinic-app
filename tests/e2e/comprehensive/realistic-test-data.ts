/**
 * Realistic Test Data Generator
 *
 * This module generates complete, realistic test data for comprehensive E2E testing.
 * NO default values - everything is explicitly defined and verified.
 * All data simulates a real coaching practice being built from scratch.
 */

// ============================================
// Type Definitions
// ============================================

export interface CoachProfile {
  // Personal Information
  name: string;
  email: string;
  password: string;
  phone: string;

  // Professional Details
  specializations: string[];
  bio: string;
  yearsExperience: number;
  certifications: string[];

  // Business Settings
  sessionRate: number;
  currency: string;
  sessionDuration: number; // minutes

  // Availability (working hours)
  availability: {
    sunday: { enabled: boolean; start: string; end: string };
    monday: { enabled: boolean; start: string; end: string };
    tuesday: { enabled: boolean; start: string; end: string };
    wednesday: { enabled: boolean; start: string; end: string };
    thursday: { enabled: boolean; start: string; end: string };
    friday: { enabled: boolean; start: string; end: string };
    saturday: { enabled: boolean; start: string; end: string };
  };

  // Preferences
  notificationPreferences: {
    emailReminders: boolean;
    smsReminders: boolean;
    whatsappReminders: boolean;
    reminderHoursBefore: number;
  };
}

export interface ClientProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Contact Preferences
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  whatsappOptIn: boolean;

  // Coaching Context
  primaryGoal: string;
  secondaryGoals: string[];
  challenges: string[];
  motivation: string;

  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };

  // Notes
  initialNotes: string;
}

export interface AppointmentData {
  clientIndex: number; // Reference to which client
  title: string;
  description: string;
  type: 'online' | 'in_person' | 'phone';
  scheduledDate: Date;
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meetingLink?: string;
  location?: string;

  // For completed sessions
  sessionNotes?: string;
  sessionRating?: number;
  followUpActions?: string[];
}

export interface GoalData {
  clientIndex: number;
  title: string;
  description: string;
  category: 'personal_growth' | 'career' | 'health' | 'relationships' | 'financial' | 'mindfulness';
  targetDate: Date;
  milestones: Array<{
    title: string;
    targetDate: Date;
    completed: boolean;
  }>;
  progress: number; // 0-100
}

export interface InvoiceData {
  clientIndex: number;
  appointmentIndices: number[];
  amount: number;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
}

// ============================================
// Realistic Coach Data
// ============================================

/**
 * Complete coach profile - represents a real wellness coach
 * setting up their practice for the first time
 */
export const REALISTIC_COACH: CoachProfile = {
  name: 'Dr. Sarah Mitchell',
  email: `coach-${Date.now()}@wellnesscoach.test`,
  password: 'SecureCoach2024!@#',
  phone: '+972-52-123-4567',

  specializations: [
    'Life Coaching',
    'Career Transition',
    'Stress Management',
    'Work-Life Balance',
    'Personal Development'
  ],

  bio: `Certified Life Coach with over 12 years of experience helping professionals
achieve their personal and career goals. Specializing in career transitions,
stress management, and work-life balance. Former corporate executive turned
wellness advocate. ICF certified with additional training in cognitive behavioral
techniques and mindfulness-based coaching.`,

  yearsExperience: 12,

  certifications: [
    'ICF Professional Certified Coach (PCC)',
    'Certified Career Coach (CCC)',
    'Mindfulness-Based Stress Reduction (MBSR)',
    'Cognitive Behavioral Coaching Certificate'
  ],

  sessionRate: 450, // ILS
  currency: 'ILS',
  sessionDuration: 60,

  availability: {
    sunday: { enabled: true, start: '09:00', end: '18:00' },
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: false, start: '09:00', end: '13:00' },
    saturday: { enabled: false, start: '00:00', end: '00:00' }
  },

  notificationPreferences: {
    emailReminders: true,
    smsReminders: true,
    whatsappReminders: true,
    reminderHoursBefore: 24
  }
};

// ============================================
// Realistic Client Data (12 diverse clients)
// ============================================

/**
 * 12 diverse clients representing different demographics,
 * goals, and stages of their coaching journey
 */
export const REALISTIC_CLIENTS: ClientProfile[] = [
  {
    firstName: 'David',
    lastName: 'Cohen',
    email: `david.cohen-${Date.now()}@gmail.test`,
    phone: '+972-54-111-2222',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    preferredContactMethod: 'whatsapp',
    whatsappOptIn: true,
    primaryGoal: 'Career transition from tech to entrepreneurship',
    secondaryGoals: ['Improve work-life balance', 'Build confidence in public speaking'],
    challenges: ['Fear of financial instability', 'Imposter syndrome', 'Time management'],
    motivation: 'Want to build something meaningful and have more control over my life',
    emergencyContact: {
      name: 'Rachel Cohen',
      relationship: 'Wife',
      phone: '+972-54-111-3333'
    },
    initialNotes: 'Referred by previous client. Very motivated but anxious about leaving stable job.'
  },
  {
    firstName: 'Maya',
    lastName: 'Levi',
    email: `maya.levi-${Date.now()}@outlook.test`,
    phone: '+972-52-222-3333',
    dateOfBirth: '1992-07-22',
    gender: 'female',
    preferredContactMethod: 'email',
    whatsappOptIn: true,
    primaryGoal: 'Overcome burnout and rediscover passion for work',
    secondaryGoals: ['Set healthy boundaries', 'Practice self-care', 'Explore new career paths'],
    challenges: ['Chronic stress', 'Difficulty saying no', 'Perfectionism'],
    motivation: 'I used to love my job but now I dread Mondays. I want that spark back.',
    emergencyContact: {
      name: 'Yael Levi',
      relationship: 'Mother',
      phone: '+972-52-222-4444'
    },
    initialNotes: 'Marketing manager at tech startup. Working 70+ hours/week for 3 years.'
  },
  {
    firstName: 'Michael',
    lastName: 'Shapiro',
    email: `michael.shapiro-${Date.now()}@yahoo.test`,
    phone: '+972-50-333-4444',
    dateOfBirth: '1978-11-08',
    gender: 'male',
    preferredContactMethod: 'phone',
    whatsappOptIn: false,
    primaryGoal: 'Navigate midlife career change at 45',
    secondaryGoals: ['Update professional skills', 'Build professional network', 'Gain clarity on values'],
    challenges: ['Age discrimination concerns', 'Outdated skills', 'Family financial responsibilities'],
    motivation: 'Company restructuring made me realize I want something different for the next 20 years',
    emergencyContact: {
      name: 'Tali Shapiro',
      relationship: 'Wife',
      phone: '+972-50-333-5555'
    },
    initialNotes: '20 years in manufacturing. Looking at project management or consulting.'
  },
  {
    firstName: 'Noa',
    lastName: 'Goldberg',
    email: `noa.goldberg-${Date.now()}@gmail.test`,
    phone: '+972-54-444-5555',
    dateOfBirth: '1998-02-14',
    gender: 'female',
    preferredContactMethod: 'whatsapp',
    whatsappOptIn: true,
    primaryGoal: 'Build confidence as a young professional',
    secondaryGoals: ['Develop leadership skills', 'Learn to handle criticism', 'Network effectively'],
    challenges: ['Imposter syndrome', 'Social anxiety in professional settings', 'Comparing self to peers'],
    motivation: 'I want to be taken seriously and advance quickly in my career',
    emergencyContact: {
      name: 'Avi Goldberg',
      relationship: 'Father',
      phone: '+972-54-444-6666'
    },
    initialNotes: 'Recently graduated, first job in HR. Very eager but lacks confidence.'
  },
  {
    firstName: 'Amit',
    lastName: 'Berkowitz',
    email: `amit.berkowitz-${Date.now()}@company.test`,
    phone: '+972-52-555-6666',
    dateOfBirth: '1982-09-30',
    gender: 'male',
    preferredContactMethod: 'email',
    whatsappOptIn: true,
    primaryGoal: 'Improve leadership and team management skills',
    secondaryGoals: ['Handle difficult conversations', 'Delegate effectively', 'Reduce micromanagement'],
    challenges: ['Recently promoted', 'Former peer now reports to me', 'High expectations from management'],
    motivation: 'I want to be the kind of manager I wish I had when starting out',
    emergencyContact: {
      name: 'Dana Berkowitz',
      relationship: 'Partner',
      phone: '+972-52-555-7777'
    },
    initialNotes: 'Promoted to team lead 3 months ago. Managing 8 people. Struggling with transition.'
  },
  {
    firstName: 'Shira',
    lastName: 'Mizrahi',
    email: `shira.mizrahi-${Date.now()}@gmail.test`,
    phone: '+972-50-666-7777',
    dateOfBirth: '1988-05-18',
    gender: 'female',
    preferredContactMethod: 'whatsapp',
    whatsappOptIn: true,
    primaryGoal: 'Return to workforce after 5-year career break',
    secondaryGoals: ['Update skills', 'Rebuild professional identity', 'Balance work and family'],
    challenges: ['Gap in resume', 'Lost confidence', 'Changed industry landscape'],
    motivation: 'My youngest is starting school and I\'m ready to reclaim my professional identity',
    emergencyContact: {
      name: 'Yoni Mizrahi',
      relationship: 'Husband',
      phone: '+972-50-666-8888'
    },
    initialNotes: 'Former software developer. Left to raise children. Very capable but nervous.'
  },
  {
    firstName: 'Jonathan',
    lastName: 'Weiss',
    email: `jonathan.weiss-${Date.now()}@startup.test`,
    phone: '+972-54-777-8888',
    dateOfBirth: '1990-12-03',
    gender: 'male',
    preferredContactMethod: 'email',
    whatsappOptIn: true,
    primaryGoal: 'Manage stress as a startup founder',
    secondaryGoals: ['Improve decision-making', 'Build resilience', 'Maintain relationships'],
    challenges: ['Constant pressure', 'Loneliness of leadership', 'Work consuming personal life'],
    motivation: 'My startup is growing but I\'m falling apart. Need to find sustainable success.',
    emergencyContact: {
      name: 'Ruth Weiss',
      relationship: 'Mother',
      phone: '+972-54-777-9999'
    },
    initialNotes: 'CEO of 2-year-old startup. 15 employees. Recent funding round. High stress.'
  },
  {
    firstName: 'Tamar',
    lastName: 'Friedman',
    email: `tamar.friedman-${Date.now()}@gmail.test`,
    phone: '+972-52-888-9999',
    dateOfBirth: '1975-08-25',
    gender: 'female',
    preferredContactMethod: 'phone',
    whatsappOptIn: false,
    primaryGoal: 'Prepare for executive role',
    secondaryGoals: ['Executive presence', 'Board communication', 'Strategic thinking'],
    challenges: ['Breaking glass ceiling', 'Visibility in male-dominated field', 'Self-promotion'],
    motivation: 'I\'ve been passed over twice. This time I want to be ready.',
    emergencyContact: {
      name: 'Eli Friedman',
      relationship: 'Husband',
      phone: '+972-52-888-0000'
    },
    initialNotes: 'VP of Operations at large company. Aiming for C-suite. Very experienced.'
  },
  {
    firstName: 'Eyal',
    lastName: 'Katz',
    email: `eyal.katz-${Date.now()}@gmail.test`,
    phone: '+972-50-999-0000',
    dateOfBirth: '1995-04-10',
    gender: 'male',
    preferredContactMethod: 'whatsapp',
    whatsappOptIn: true,
    primaryGoal: 'Transition from military to civilian career',
    secondaryGoals: ['Translate military skills', 'Adapt communication style', 'Build civilian network'],
    challenges: ['Identity shift', 'Different workplace culture', 'Starting from scratch'],
    motivation: 'After 8 years in IDF, I want to find meaningful work in tech',
    emergencyContact: {
      name: 'Orit Katz',
      relationship: 'Sister',
      phone: '+972-50-999-1111'
    },
    initialNotes: 'Just completed military service. Strong leadership but needs corporate adaptation.'
  },
  {
    firstName: 'Yael',
    lastName: 'Rosen',
    email: `yael.rosen-${Date.now()}@freelance.test`,
    phone: '+972-54-000-1111',
    dateOfBirth: '1987-01-20',
    gender: 'female',
    preferredContactMethod: 'email',
    whatsappOptIn: true,
    primaryGoal: 'Scale freelance business to agency',
    secondaryGoals: ['Hire first employee', 'Raise prices', 'Create systems'],
    challenges: ['Fear of delegation', 'Pricing confidence', 'Time management'],
    motivation: 'I\'ve maxed out my solo capacity. Need to grow or burn out.',
    emergencyContact: {
      name: 'Gal Rosen',
      relationship: 'Partner',
      phone: '+972-54-000-2222'
    },
    initialNotes: 'Successful freelance graphic designer for 5 years. Ready to scale.'
  },
  {
    firstName: 'Oren',
    lastName: 'Levy',
    email: `oren.levy-${Date.now()}@corp.test`,
    phone: '+972-52-111-2222',
    dateOfBirth: '1980-06-15',
    gender: 'male',
    preferredContactMethod: 'email',
    whatsappOptIn: true,
    primaryGoal: 'Recover from job loss and rebuild career',
    secondaryGoals: ['Process emotions', 'Update job search skills', 'Explore new directions'],
    challenges: ['Depression', 'Lost identity', 'Financial pressure'],
    motivation: 'Got laid off after 15 years. Need to figure out who I am now.',
    emergencyContact: {
      name: 'Miri Levy',
      relationship: 'Wife',
      phone: '+972-52-111-3333'
    },
    initialNotes: 'Recently laid off from senior position. Taking it hard. Needs support.'
  },
  {
    firstName: 'Daniella',
    lastName: 'Ben-David',
    email: `daniella.bendavid-${Date.now()}@gmail.test`,
    phone: '+972-50-222-3333',
    dateOfBirth: '1993-10-28',
    gender: 'female',
    preferredContactMethod: 'whatsapp',
    whatsappOptIn: true,
    primaryGoal: 'Find purpose and direction in career',
    secondaryGoals: ['Explore interests', 'Overcome analysis paralysis', 'Take action'],
    challenges: ['Too many options', 'Fear of wrong choice', 'Comparison to peers'],
    motivation: 'Everyone around me seems to know what they want. I feel lost.',
    emergencyContact: {
      name: 'Alon Ben-David',
      relationship: 'Brother',
      phone: '+972-50-222-4444'
    },
    initialNotes: 'Has tried 3 different fields in 5 years. Intelligent but scattered.'
  }
];

// ============================================
// Helper Functions
// ============================================

/**
 * Generate dates relative to today for realistic scheduling
 */
export function getRelativeDate(daysFromNow: number, hour: number = 10, minute: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Generate realistic appointment schedule for a coach
 * Creates a mix of past, current, and future appointments
 */
export function generateRealisticSchedule(): AppointmentData[] {
  const appointments: AppointmentData[] = [];

  // Past appointments (completed sessions with notes)
  const pastAppointments: AppointmentData[] = [
    {
      clientIndex: 0, // David Cohen
      title: 'Initial Assessment - Career Transition',
      description: 'First session to discuss career transition goals and create action plan',
      type: 'online',
      scheduledDate: getRelativeDate(-30, 10),
      duration: 90,
      status: 'completed',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      sessionNotes: `## Initial Assessment Summary

### Client Background
- 15 years in tech (software development)
- Wants to start own consulting business
- Main fear: financial instability with family responsibilities

### Key Insights
- Strong technical skills, needs business development support
- Imposter syndrome around "being an entrepreneur"
- Clear vision but unclear execution path

### Action Items
1. Complete SWOT analysis of current skills
2. Research 5 successful tech consultants' journeys
3. Draft initial business concept (1 page)

### Next Session Focus
Review business concept and discuss financial runway`,
      sessionRating: 5,
      followUpActions: ['Send SWOT template', 'Share consultant interview podcasts']
    },
    {
      clientIndex: 0,
      title: 'Follow-up - Business Planning',
      description: 'Review business concept and financial planning',
      type: 'online',
      scheduledDate: getRelativeDate(-23, 10),
      duration: 60,
      status: 'completed',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      sessionNotes: `## Session 2 Summary

### Progress Review
- Completed SWOT analysis (impressive self-awareness)
- Business concept drafted - needs refinement
- Researched 3/5 consultants

### Discussion Points
- Financial runway calculation: 8 months without income
- Wife supportive but anxious
- Identified potential first clients from network

### Breakthroughs
- Realized can start part-time while employed
- Less scary when framed as "experiment" not "leap"

### Action Items
1. Identify 3 services to offer initially
2. Set pricing based on research
3. Draft transition timeline

### Mood/Energy
Client more optimistic. Initial anxiety reduced.`,
      sessionRating: 5,
      followUpActions: ['Send pricing strategy article', 'Connect with business coach in network']
    },
    {
      clientIndex: 1, // Maya Levi
      title: 'Burnout Recovery - Initial Session',
      description: 'First session to assess burnout level and create recovery plan',
      type: 'online',
      scheduledDate: getRelativeDate(-28, 14),
      duration: 60,
      status: 'completed',
      meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
      sessionNotes: `## Burnout Assessment

### Current State
- Working 70+ hours/week for 3 years
- Physical symptoms: insomnia, headaches, fatigue
- Emotional symptoms: cynicism, detachment, irritability
- Burnout score: 8/10 (severe)

### Root Causes Identified
1. No boundaries with demanding boss
2. Perfectionism - can't delegate
3. Identity tied to work performance
4. No hobbies or social life outside work

### Immediate Interventions
1. Set hard stop at 7pm (non-negotiable)
2. Take lunch break away from desk
3. One social activity per week

### Warning
Client shows signs of depression. Monitoring closely.
Discussed therapy referral if needed.`,
      sessionRating: 4,
      followUpActions: ['Send boundary-setting script', 'Share meditation app recommendation']
    },
    {
      clientIndex: 2, // Michael Shapiro
      title: 'Career Exploration Session',
      description: 'Explore options for midlife career change',
      type: 'in_person',
      scheduledDate: getRelativeDate(-21, 11),
      duration: 60,
      status: 'completed',
      location: 'Tel Aviv office',
      sessionNotes: `## Career Exploration

### Career History Review
- 20 years in manufacturing management
- Strong operations and team leadership skills
- Frustrated by industry decline

### Interests Assessment
- Loves problem-solving and optimization
- Enjoys mentoring younger employees
- Interested in technology but intimidated

### Potential Paths Discussed
1. Project Management - strong fit, requires PMP
2. Operations Consulting - leverage experience
3. Corporate Training - teaching skills

### Concerns
- Age discrimination in tech
- Salary expectations may need adjustment
- Learning curve anxiety

### Next Steps
1. Take PMP practice assessment
2. Informational interviews with PMs
3. LinkedIn profile update`,
      sessionRating: 4,
      followUpActions: ['PMP study guide link', 'PM contact introduction']
    },
    {
      clientIndex: 3, // Noa Goldberg
      title: 'Confidence Building Workshop',
      description: 'Techniques for building professional confidence',
      type: 'online',
      scheduledDate: getRelativeDate(-14, 16),
      duration: 60,
      status: 'completed',
      meetingLink: 'https://meet.google.com/noa-conf-bld',
      sessionNotes: `## Confidence Building Session

### Current Challenges
- Afraid to speak up in meetings
- Constantly second-guessing decisions
- Comparing self to more experienced colleagues

### Cognitive Reframes
1. "I don't know enough" → "I bring fresh perspective"
2. "They'll think I'm stupid" → "Asking questions shows engagement"
3. "I'm not ready" → "I learn by doing"

### Practical Exercises
- Power posing before meetings
- Preparation ritual (3 key points to contribute)
- "First to speak" challenge

### Homework
1. Speak up in at least 2 meetings this week
2. Journal wins daily (even small ones)
3. Ask one "dumb" question

### Progress
Already showing improvement from previous session.
More eye contact, clearer communication.`,
      sessionRating: 5,
      followUpActions: ['Send TED talk on confidence', 'Book recommendation: Presence by Amy Cuddy']
    }
  ];

  appointments.push(...pastAppointments);

  // Today's appointments
  const todayAppointments: AppointmentData[] = [
    {
      clientIndex: 4, // Amit Berkowitz
      title: 'Leadership Challenges Check-in',
      description: 'Weekly check-in on team management progress',
      type: 'online',
      scheduledDate: getRelativeDate(0, 10),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/amit-lead-chk'
    },
    {
      clientIndex: 5, // Shira Mizrahi
      title: 'Job Search Strategy Session',
      description: 'Refine job search approach and review applications',
      type: 'online',
      scheduledDate: getRelativeDate(0, 14),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/shira-job-str'
    },
    {
      clientIndex: 6, // Jonathan Weiss
      title: 'Founder Stress Management',
      description: 'Coping strategies for startup pressure',
      type: 'phone',
      scheduledDate: getRelativeDate(0, 16),
      duration: 45,
      status: 'scheduled'
    }
  ];

  appointments.push(...todayAppointments);

  // Future appointments (next 2 weeks)
  const futureAppointments: AppointmentData[] = [
    {
      clientIndex: 0, // David Cohen
      title: 'Business Launch Planning',
      description: 'Finalize transition timeline and first client outreach',
      type: 'online',
      scheduledDate: getRelativeDate(2, 10),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/david-launch'
    },
    {
      clientIndex: 7, // Tamar Friedman
      title: 'Executive Presence Coaching',
      description: 'Board presentation preparation',
      type: 'in_person',
      scheduledDate: getRelativeDate(3, 11),
      duration: 90,
      status: 'scheduled',
      location: 'Tel Aviv office'
    },
    {
      clientIndex: 1, // Maya Levi
      title: 'Burnout Recovery Progress',
      description: 'Review boundary implementation and self-care progress',
      type: 'online',
      scheduledDate: getRelativeDate(4, 14),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/maya-burnout'
    },
    {
      clientIndex: 8, // Eyal Katz
      title: 'Career Transition - Military to Tech',
      description: 'Initial assessment and goal setting',
      type: 'online',
      scheduledDate: getRelativeDate(5, 10),
      duration: 90,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/eyal-initial'
    },
    {
      clientIndex: 9, // Yael Rosen
      title: 'Business Scaling Strategy',
      description: 'First hire planning and systems development',
      type: 'online',
      scheduledDate: getRelativeDate(7, 15),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/yael-scale'
    },
    {
      clientIndex: 10, // Oren Levy
      title: 'Job Loss Recovery Session',
      description: 'Emotional processing and next steps',
      type: 'online',
      scheduledDate: getRelativeDate(8, 11),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/oren-recovery'
    },
    {
      clientIndex: 11, // Daniella Ben-David
      title: 'Career Direction Discovery',
      description: 'Values clarification and interest exploration',
      type: 'online',
      scheduledDate: getRelativeDate(9, 14),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/daniella-discovery'
    },
    {
      clientIndex: 2, // Michael Shapiro
      title: 'PMP Progress Check-in',
      description: 'Review study progress and interview prep',
      type: 'in_person',
      scheduledDate: getRelativeDate(10, 11),
      duration: 60,
      status: 'scheduled',
      location: 'Tel Aviv office'
    },
    {
      clientIndex: 3, // Noa Goldberg
      title: 'Confidence Progress Review',
      description: 'Celebrate wins and address setbacks',
      type: 'online',
      scheduledDate: getRelativeDate(12, 16),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/noa-progress'
    },
    {
      clientIndex: 4, // Amit Berkowitz
      title: 'Difficult Conversations Workshop',
      description: 'Practice handling team conflicts',
      type: 'online',
      scheduledDate: getRelativeDate(14, 10),
      duration: 60,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/amit-difficult'
    }
  ];

  appointments.push(...futureAppointments);

  return appointments;
}

/**
 * Generate goals for each client
 */
export function generateClientGoals(): GoalData[] {
  return [
    // David Cohen's goals
    {
      clientIndex: 0,
      title: 'Launch Consulting Business',
      description: 'Transition from employee to independent consultant within 6 months',
      category: 'career',
      targetDate: getRelativeDate(180),
      progress: 35,
      milestones: [
        { title: 'Define service offerings', targetDate: getRelativeDate(-20), completed: true },
        { title: 'Set up legal entity', targetDate: getRelativeDate(30), completed: false },
        { title: 'Land first paying client', targetDate: getRelativeDate(90), completed: false },
        { title: 'Replace 50% of salary', targetDate: getRelativeDate(150), completed: false },
        { title: 'Full transition', targetDate: getRelativeDate(180), completed: false }
      ]
    },
    // Maya Levi's goals
    {
      clientIndex: 1,
      title: 'Recover from Burnout',
      description: 'Achieve sustainable work-life balance and rediscover passion',
      category: 'health',
      targetDate: getRelativeDate(90),
      progress: 25,
      milestones: [
        { title: 'Establish work boundaries', targetDate: getRelativeDate(-14), completed: true },
        { title: 'Regular exercise routine', targetDate: getRelativeDate(14), completed: false },
        { title: 'Reduce work hours to 50/week', targetDate: getRelativeDate(45), completed: false },
        { title: 'Resume hobby/social activities', targetDate: getRelativeDate(60), completed: false },
        { title: 'Burnout score below 4/10', targetDate: getRelativeDate(90), completed: false }
      ]
    },
    // Noa Goldberg's goals
    {
      clientIndex: 3,
      title: 'Build Professional Confidence',
      description: 'Develop confidence to speak up and take on leadership opportunities',
      category: 'personal_growth',
      targetDate: getRelativeDate(120),
      progress: 40,
      milestones: [
        { title: 'Speak in every team meeting', targetDate: getRelativeDate(-7), completed: true },
        { title: 'Lead one project', targetDate: getRelativeDate(30), completed: false },
        { title: 'Present to leadership', targetDate: getRelativeDate(60), completed: false },
        { title: 'Mentor a new team member', targetDate: getRelativeDate(90), completed: false }
      ]
    },
    // Amit Berkowitz's goals
    {
      clientIndex: 4,
      title: 'Master Team Leadership',
      description: 'Become an effective and respected team leader',
      category: 'career',
      targetDate: getRelativeDate(150),
      progress: 30,
      milestones: [
        { title: 'Complete leadership training', targetDate: getRelativeDate(-7), completed: true },
        { title: 'Conduct effective 1:1s with all reports', targetDate: getRelativeDate(30), completed: false },
        { title: 'Handle first difficult conversation', targetDate: getRelativeDate(45), completed: false },
        { title: 'Team satisfaction score 8+', targetDate: getRelativeDate(120), completed: false }
      ]
    },
    // Tamar Friedman's goals
    {
      clientIndex: 7,
      title: 'Achieve C-Suite Promotion',
      description: 'Position for and secure COO or similar executive role',
      category: 'career',
      targetDate: getRelativeDate(365),
      progress: 20,
      milestones: [
        { title: 'Executive coaching engagement', targetDate: getRelativeDate(-30), completed: true },
        { title: 'Board presentation success', targetDate: getRelativeDate(30), completed: false },
        { title: 'Increase visibility with CEO', targetDate: getRelativeDate(90), completed: false },
        { title: 'Lead strategic initiative', targetDate: getRelativeDate(180), completed: false },
        { title: 'Formal promotion discussion', targetDate: getRelativeDate(300), completed: false }
      ]
    }
  ];
}

// ============================================
// Expected Outcomes for Verification
// ============================================

/**
 * Define expected outcomes for each test action
 * These are used to verify the system behaves correctly
 */
export const EXPECTED_OUTCOMES = {
  coachRegistration: {
    successMessage: /welcome|account created|registration successful/i,
    redirectUrl: '/dashboard',
    profileVisible: true,
    defaultsNotShown: true // Verify no placeholder/default data shown
  },

  clientCreation: {
    successMessage: /client added|saved successfully|invitation sent/i,
    clientInList: true,
    clientSearchable: true,
    noDefaultValues: true // Verify all fields match input
  },

  appointmentScheduling: {
    successMessage: /appointment scheduled|booking confirmed/i,
    calendarEntry: true,
    reminderScheduled: true,
    conflictDetection: true
  },

  sessionCompletion: {
    notesSaved: true,
    sessionMarkedComplete: true,
    historyUpdated: true,
    invoiceGenerable: true
  },

  dashboardStats: {
    clientCount: (expected: number) => expected,
    appointmentsToday: (expected: number) => expected,
    upcomingAppointments: (expected: number) => expected,
    revenueAccurate: true
  }
};

/**
 * Verification helpers
 */
export function verifyNoDefaultValues(actualData: Record<string, unknown>, inputData: Record<string, unknown>): boolean {
  // Common default/placeholder values to check against
  const defaultValues = [
    'Lorem ipsum',
    'John Doe',
    'Jane Doe',
    'test@test.com',
    'example@example.com',
    'TBD',
    'N/A',
    'placeholder',
    'default',
    '000-000-0000',
    '+1234567890'
  ];

  for (const [key, value] of Object.entries(actualData)) {
    if (typeof value === 'string') {
      // Check if value matches any default
      if (defaultValues.some(def => value.toLowerCase().includes(def.toLowerCase()))) {
        console.error(`Found default value in ${key}: ${value}`);
        return false;
      }

      // Check if value matches what was input
      if (inputData[key] && inputData[key] !== value) {
        console.error(`Value mismatch for ${key}: expected "${inputData[key]}", got "${value}"`);
        return false;
      }
    }
  }

  return true;
}
