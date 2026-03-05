/**
 * Test Data Factory
 * Dynamic test data generation for integration and E2E tests
 */

import { ApiClient } from './api-client';

// ============================================
// Type Definitions
// ============================================

export interface CreateClientData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  status?: 'active' | 'inactive' | 'on_hold';
  notes?: string;
}

export interface CreateAppointmentData {
  clientId: string;
  coachId?: string;
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  type?: 'online' | 'in_person' | 'hybrid';
  location?: string;
  meetingLink?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  recordingEnabled?: boolean;
}

export interface CreateGoalData {
  clientId: string;
  coachId?: string;
  title?: string;
  description?: string;
  category?: 'personal_growth' | 'career' | 'health' | 'relationships' | 'financial' | 'other';
  targetDate?: Date;
  milestones?: Array<{
    title: string;
    targetDate?: Date;
  }>;
}

export interface CreateNoteData {
  appointmentId?: string;
  clientId: string;
  coachId?: string;
  title?: string;
  content?: string;
  type?: 'session' | 'progress' | 'general';
}

export interface CreateInvoiceData {
  clientId: string;
  amount: number;
  currency?: string;
  description?: string;
  dueDate?: Date;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// ============================================
// Random Data Generators
// ============================================

function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomEmail(): string {
  return `test-${randomString(8)}-${Date.now()}@test.clinic.com`;
}

function randomPhone(): string {
  return `+1${randomNumber(100, 999)}${randomNumber(100, 999)}${randomNumber(1000, 9999)}`;
}

function randomDate(daysFromNow: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + randomNumber(1, daysFromNow));
  date.setHours(randomNumber(9, 17), 0, 0, 0);
  return date;
}

function randomPastDate(daysAgo: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomNumber(1, daysAgo));
  return date;
}

// ============================================
// First/Last Name Pools
// ============================================

const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

function randomFirstName(): string {
  return firstNames[randomNumber(0, firstNames.length - 1)];
}

function randomLastName(): string {
  return lastNames[randomNumber(0, lastNames.length - 1)];
}

// ============================================
// Factory Class
// ============================================

export class TestDataFactory {
  private apiClient: ApiClient;
  private createdEntities: {
    clients: string[];
    appointments: string[];
    goals: string[];
    notes: string[];
    invoices: string[];
  } = {
    clients: [],
    appointments: [],
    goals: [],
    notes: [],
    invoices: []
  };

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Create a test client
   */
  async createClient(data: CreateClientData = {}): Promise<{ id: string; [key: string]: unknown }> {
    const firstName = data.firstName || randomFirstName();
    const lastName = data.lastName || randomLastName();

    const clientData = {
      firstName,
      lastName,
      email: data.email || randomEmail(),
      phone: data.phone || randomPhone(),
      dateOfBirth: data.dateOfBirth || '1990-01-15',
      gender: data.gender || 'prefer_not_to_say',
      status: data.status || 'active',
      notes: data.notes || `Test client created at ${new Date().toISOString()}`
    };

    const response = await this.apiClient.post<{ id: string }>('/clients', clientData);

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Failed to create client: ${response.status}`);
    }

    const client = response.data;
    this.createdEntities.clients.push(client.id);
    return client;
  }

  /**
   * Create a test appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<{ id: string; [key: string]: unknown }> {
    const startTime = data.startTime || randomDate(14);
    const endTime = data.endTime || new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    const appointmentData = {
      clientId: data.clientId,
      coachId: data.coachId,
      title: data.title || `Coaching Session - ${randomString(6)}`,
      description: data.description || 'Test appointment created by test factory',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      type: data.type || 'online',
      location: data.location,
      meetingLink: data.meetingLink || (data.type !== 'in_person' ? 'https://meet.google.com/test-meeting' : undefined),
      status: data.status || 'scheduled',
      recordingEnabled: data.recordingEnabled ?? false
    };

    const response = await this.apiClient.post<{ id: string }>('/appointments', appointmentData);

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Failed to create appointment: ${response.status}`);
    }

    const appointment = response.data;
    this.createdEntities.appointments.push(appointment.id);
    return appointment;
  }

  /**
   * Create a test goal
   */
  async createGoal(data: CreateGoalData): Promise<{ id: string; [key: string]: unknown }> {
    const goalData = {
      clientId: data.clientId,
      coachId: data.coachId,
      title: data.title || `Goal - ${randomString(6)}`,
      description: data.description || 'Test goal created by test factory',
      category: data.category || 'personal_growth',
      targetDate: (data.targetDate || randomDate(90)).toISOString(),
      milestones: data.milestones || [
        { title: 'Initial milestone', targetDate: randomDate(30).toISOString() },
        { title: 'Mid-point milestone', targetDate: randomDate(60).toISOString() }
      ]
    };

    const response = await this.apiClient.post<{ id: string }>('/progress/goals', goalData);

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Failed to create goal: ${response.status}`);
    }

    const goal = response.data;
    this.createdEntities.goals.push(goal.id);
    return goal;
  }

  /**
   * Create a test note
   */
  async createNote(data: CreateNoteData): Promise<{ id: string; [key: string]: unknown }> {
    const noteData = {
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      coachId: data.coachId,
      title: data.title || `Session Notes - ${randomString(6)}`,
      content: data.content || 'Test note content created by test factory. This contains session observations and follow-up items.',
      type: data.type || 'session'
    };

    const response = await this.apiClient.post<{ id: string }>('/notes', noteData);

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Failed to create note: ${response.status}`);
    }

    const note = response.data;
    this.createdEntities.notes.push(note.id);
    return note;
  }

  /**
   * Create a test invoice
   */
  async createInvoice(data: CreateInvoiceData): Promise<{ id: string; [key: string]: unknown }> {
    const invoiceData = {
      clientId: data.clientId,
      amount: data.amount,
      currency: data.currency || 'ILS',
      description: data.description || 'Coaching session fee',
      dueDate: (data.dueDate || randomDate(30)).toISOString(),
      items: data.items || [
        {
          description: 'Individual Coaching Session',
          quantity: 1,
          unitPrice: data.amount
        }
      ]
    };

    const response = await this.apiClient.post<{ id: string }>('/billing/invoices', invoiceData);

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Failed to create invoice: ${response.status}`);
    }

    const invoice = response.data;
    this.createdEntities.invoices.push(invoice.id);
    return invoice;
  }

  /**
   * Create a complete test scenario with client, appointments, and goals
   */
  async createCompleteScenario(): Promise<{
    client: { id: string; [key: string]: unknown };
    appointments: Array<{ id: string; [key: string]: unknown }>;
    goals: Array<{ id: string; [key: string]: unknown }>;
  }> {
    // Create client
    const client = await this.createClient();

    // Create 3 appointments (1 past, 1 today, 1 future)
    const now = new Date();
    const appointments = await Promise.all([
      this.createAppointment({
        clientId: client.id,
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        status: 'completed'
      }),
      this.createAppointment({
        clientId: client.id,
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'scheduled'
      }),
      this.createAppointment({
        clientId: client.id,
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        status: 'scheduled'
      })
    ]);

    // Create 2 goals
    const goals = await Promise.all([
      this.createGoal({
        clientId: client.id,
        title: 'Career Development Goal',
        category: 'career'
      }),
      this.createGoal({
        clientId: client.id,
        title: 'Personal Wellness Goal',
        category: 'health'
      })
    ]);

    return { client, appointments, goals };
  }

  /**
   * Clean up all created test entities
   */
  async cleanup(): Promise<void> {
    const errors: string[] = [];

    // Delete in reverse order of dependencies
    for (const id of this.createdEntities.invoices) {
      try {
        await this.apiClient.delete(`/billing/invoices/${id}`);
      } catch (e) {
        errors.push(`Failed to delete invoice ${id}: ${e}`);
      }
    }

    for (const id of this.createdEntities.notes) {
      try {
        await this.apiClient.delete(`/notes/${id}`);
      } catch (e) {
        errors.push(`Failed to delete note ${id}: ${e}`);
      }
    }

    for (const id of this.createdEntities.goals) {
      try {
        await this.apiClient.delete(`/progress/goals/${id}`);
      } catch (e) {
        errors.push(`Failed to delete goal ${id}: ${e}`);
      }
    }

    for (const id of this.createdEntities.appointments) {
      try {
        await this.apiClient.delete(`/appointments/${id}`);
      } catch (e) {
        errors.push(`Failed to delete appointment ${id}: ${e}`);
      }
    }

    for (const id of this.createdEntities.clients) {
      try {
        await this.apiClient.delete(`/clients/${id}`);
      } catch (e) {
        errors.push(`Failed to delete client ${id}: ${e}`);
      }
    }

    // Reset tracking
    this.createdEntities = {
      clients: [],
      appointments: [],
      goals: [],
      notes: [],
      invoices: []
    };

    if (errors.length > 0) {
      console.warn('Cleanup warnings:', errors);
    }
  }

  /**
   * Get count of created entities
   */
  getCreatedCount(): Record<string, number> {
    return {
      clients: this.createdEntities.clients.length,
      appointments: this.createdEntities.appointments.length,
      goals: this.createdEntities.goals.length,
      notes: this.createdEntities.notes.length,
      invoices: this.createdEntities.invoices.length
    };
  }
}

// ============================================
// Static Test Data
// ============================================

export const STATIC_TEST_DATA = {
  validClient: {
    firstName: 'Test',
    lastName: 'Client',
    email: 'valid-test-client@test.clinic.com',
    phone: '+1234567890',
    dateOfBirth: '1990-05-15',
    gender: 'prefer_not_to_say' as const,
    status: 'active' as const
  },

  validAppointment: {
    title: 'Test Coaching Session',
    description: 'A test coaching session for E2E testing',
    type: 'online' as const,
    meetingLink: 'https://meet.google.com/test-session',
    recordingEnabled: false
  },

  validGoal: {
    title: 'Test Career Goal',
    description: 'A test goal for career development',
    category: 'career' as const
  },

  validNote: {
    title: 'Session Summary',
    content: 'Client showed progress in goal achievement. Next steps discussed.',
    type: 'session' as const
  },

  invalidData: {
    emptyEmail: { email: '' },
    invalidEmail: { email: 'not-an-email' },
    shortPassword: { password: '123' },
    missingRequired: {},
    invalidPhone: { phone: 'abc' },
    futureDoB: { dateOfBirth: '2099-01-01' }
  }
};

// ============================================
// Form Validation Test Cases
// ============================================

export const VALIDATION_TEST_CASES = {
  login: [
    { email: '', password: 'password', error: 'Email is required' },
    { email: 'invalid', password: 'password', error: 'Invalid email format' },
    { email: 'test@test.com', password: '', error: 'Password is required' },
    { email: 'test@test.com', password: '12', error: 'Password too short' }
  ],

  registration: [
    { firstName: '', error: 'First name is required' },
    { lastName: '', error: 'Last name is required' },
    { email: '', error: 'Email is required' },
    { email: 'invalid', error: 'Invalid email format' },
    { password: '', error: 'Password is required' },
    { password: 'weak', error: 'Password must be at least 8 characters' },
    { password: 'nodigits', error: 'Password must contain a number' }
  ],

  client: [
    { firstName: '', error: 'First name is required' },
    { lastName: '', error: 'Last name is required' },
    { email: 'invalid', error: 'Invalid email format' },
    { phone: 'abc', error: 'Invalid phone number' }
  ],

  appointment: [
    { title: '', error: 'Title is required' },
    { startTime: '', error: 'Start time is required' },
    { endTime: '', error: 'End time is required' }
  ],

  goal: [
    { title: '', error: 'Goal title is required' },
    { targetDate: '', error: 'Target date is required' }
  ]
};
