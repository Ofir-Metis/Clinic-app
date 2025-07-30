/**
 * Test data fixtures for Playwright E2E tests
 * Provides mock data for clinic management app testing
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'therapist' | 'patient';
  name: string;
  id?: string;
}

export interface TestPatient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
}

export interface TestAppointment {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'initial' | 'followup' | 'group' | 'online';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

// Test users for authentication flows
export const testUsers: Record<string, TestUser> = {
  therapist: {
    email: 'therapist@test.com',
    password: 'TestPassword123!',
    role: 'therapist',
    name: 'Dr. Sarah Wilson',
    id: 'therapist-1'
  },
  patient: {
    email: 'patient@test.com',
    password: 'PatientPass123!',
    role: 'patient',
    name: 'John Doe',
    id: 'patient-1'
  },
  newUser: {
    email: 'newuser@test.com',
    password: 'NewUser123!',
    role: 'therapist',
    name: 'Dr. Alex Thompson'
  }
};

// Mock patients for patient management tests
export const mockPatients: TestPatient[] = [
  {
    id: 'patient-1',
    name: 'John Doe',
    email: 'john.doe@test.com',
    phone: '+1-555-0123',
    dateOfBirth: '1985-03-15',
    address: '123 Main St, Springfield, IL 62701',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+1-555-0124',
    notes: 'Anxiety and stress management. Prefers morning appointments.'
  },
  {
    id: 'patient-2',
    name: 'Emily Johnson',
    email: 'emily.johnson@test.com',
    phone: '+1-555-0125',
    dateOfBirth: '1992-07-22',
    address: '456 Oak Ave, Springfield, IL 62702',
    emergencyContact: 'Robert Johnson',
    emergencyPhone: '+1-555-0126',
    notes: 'Depression therapy. Weekly sessions preferred.'
  },
  {
    id: 'patient-3',
    name: 'Michael Chen',
    email: 'michael.chen@test.com',
    phone: '+1-555-0127',
    dateOfBirth: '1978-11-08',
    address: '789 Pine Rd, Springfield, IL 62703',
    emergencyContact: 'Lisa Chen',
    emergencyPhone: '+1-555-0128',
    notes: 'Couples therapy with spouse. Scheduled together.'
  }
];

// Mock appointments for scheduling tests
export const mockAppointments: TestAppointment[] = [
  {
    id: 'apt-1',
    patientId: 'patient-1',
    patientName: 'John Doe',
    title: 'Initial Consultation',
    startTime: '2024-02-15T09:00:00Z',
    endTime: '2024-02-15T10:00:00Z',
    type: 'initial',
    status: 'scheduled',
    notes: 'First session - intake and assessment'
  },
  {
    id: 'apt-2',
    patientId: 'patient-2',
    patientName: 'Emily Johnson',
    title: 'Weekly Therapy Session',
    startTime: '2024-02-15T14:00:00Z',
    endTime: '2024-02-15T15:00:00Z',
    type: 'followup',
    status: 'scheduled',
    notes: 'Continuing depression therapy'
  },
  {
    id: 'apt-3',
    patientId: 'patient-3',
    patientName: 'Michael Chen',
    title: 'Couples Therapy',
    startTime: '2024-02-16T16:00:00Z',
    endTime: '2024-02-16T17:30:00Z',
    type: 'group',
    status: 'completed',
    notes: 'Communication exercises completed successfully'
  }
];

// Form validation test data
export const formTestData = {
  validPatient: {
    name: 'Test Patient',
    email: 'test.patient@example.com',
    phone: '+1-555-0199',
    dateOfBirth: '1990-01-01',
    address: '123 Test St, Test City, TC 12345',
    emergencyContact: 'Emergency Contact',
    emergencyPhone: '+1-555-0198'
  },
  invalidPatient: {
    name: '', // Missing required field
    email: 'invalid-email', // Invalid format
    phone: '123', // Invalid format
    dateOfBirth: '2030-01-01', // Future date
    address: '',
    emergencyContact: '',
    emergencyPhone: 'invalid'
  },
  validAppointment: {
    patientName: 'John Doe',
    title: 'Test Appointment',
    date: '2024-12-31',
    time: '10:00',
    duration: '60',
    type: 'followup',
    notes: 'Test appointment notes'
  },
  invalidAppointment: {
    patientName: '',
    title: '',
    date: '2020-01-01', // Past date
    time: '',
    duration: '0',
    type: '',
    notes: ''
  }
};

// Accessibility test selectors
export const accessibilitySelectors = {
  buttons: 'button',
  links: 'a',
  inputs: 'input, textarea, select',
  headings: 'h1, h2, h3, h4, h5, h6',
  landmarks: '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]',
  focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
};

// Responsive breakpoints (matches theme.ts)
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
};

// Test timeouts and delays
export const testConfig = {
  shortDelay: 500,
  mediumDelay: 1000,
  longDelay: 2000,
  apiTimeout: 5000,
  navigationTimeout: 10000
};

// Wellness theme colors for visual tests
export const wellnessColors = {
  primary: '#2E7D6B',
  primaryLight: '#4A9B8A',
  primaryDark: '#1F5A4E',
  secondary: '#8B5A87',
  accent: '#F4A261',
  wellnessLight: '#F0F8F4',
  wellnessUltraLight: '#FAFCFB'
};

// Error messages for validation tests
export const errorMessages = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  pastDate: 'Date cannot be in the past',
  futureDate: 'Date cannot be in the future',
  shortPassword: 'Password must be at least 8 characters',
  weakPassword: 'Password must contain uppercase, lowercase, and numbers'
};