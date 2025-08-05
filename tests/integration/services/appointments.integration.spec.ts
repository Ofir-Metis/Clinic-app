import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BaseIntegrationTest } from '../integration-test-setup';
import { AppointmentsModule } from '../../../services/appointments-service/src/appointments/appointments.module';

describe('Appointments Service Integration Tests', () => {
  let integrationTest: BaseIntegrationTest;
  let clientToken: string;
  let coachToken: string;
  let clientUserId: string;
  let coachUserId: string;

  beforeAll(async () => {
    integrationTest = new (class extends BaseIntegrationTest {
      protected configureTestApp(): void {
        // Add any appointments-specific test configuration
      }
    })();

    await integrationTest.setupTest(async () => {
      const config = integrationTest['testEnv'].getConfig();
      
      return Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                POSTGRES_HOST: config.postgres.host,
                POSTGRES_PORT: config.postgres.port,
                POSTGRES_USER: config.postgres.username,
                POSTGRES_PASSWORD: config.postgres.password,
                POSTGRES_DB: config.postgres.database,
                JWT_SECRET: 'test-jwt-secret-key',
                NATS_URL: config.nats.url,
                TWILIO_ACCOUNT_SID: 'test_account_sid',
                TWILIO_AUTH_TOKEN: 'test_auth_token',
                GOOGLE_CLIENT_ID: 'test_google_client_id',
                GOOGLE_CLIENT_SECRET: 'test_google_client_secret',
              })
            ]
          }),
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: config.postgres.host,
            port: config.postgres.port,
            username: config.postgres.username,
            password: config.postgres.password,
            database: config.postgres.database,
            entities: ['src/**/*.entity{.ts,.js}'],
            synchronize: true,
            dropSchema: false,
          }),
          AppointmentsModule,
        ],
      }).compile();
    });
  });

  afterAll(async () => {
    await integrationTest.teardownTest();
  });

  beforeEach(async () => {
    await integrationTest.cleanDatabase();
    await integrationTest.seedTestData();

    // Create test users
    const client = await integrationTest.createTestUser('client', {
      email: 'client-appointments@example.com',
      password: 'TestPassword123!'
    });
    clientUserId = client.id;
    clientToken = await integrationTest.authenticateUser('client-appointments@example.com', 'TestPassword123!');

    const coach = await integrationTest.createTestUser('coach', {
      email: 'coach-appointments@example.com',
      password: 'TestPassword123!',
      specializations: ['life-coaching', 'wellness']
    });
    coachUserId = coach.id;
    coachToken = await integrationTest.authenticateUser('coach-appointments@example.com', 'TestPassword123!');
  });

  describe('Appointment Creation', () => {
    it('should create appointment successfully', async () => {
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Initial Consultation',
        description: 'First coaching session to understand goals',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        type: 'video',
        status: 'scheduled'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        clientId: appointmentData.clientId,
        coachId: appointmentData.coachId,
        title: appointmentData.title,
        description: appointmentData.description,
        type: appointmentData.type,
        status: 'scheduled'
      });

      expect(new Date(response.body.startTime)).toEqual(new Date(appointmentData.startTime));
      expect(new Date(response.body.endTime)).toEqual(new Date(appointmentData.endTime));
    });

    it('should reject appointment with past date', async () => {
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Past Appointment',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        endTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // Yesterday + 1 hour
        type: 'video'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toContain('cannot be in the past');
    });

    it('should reject appointment with invalid time range', async () => {
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Invalid Time Range',
        startTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        type: 'video'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toContain('End time must be after start time');
    });

    it('should handle coach availability conflicts', async () => {
      const baseTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Create first appointment
      const firstAppointment = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'First Appointment',
        startTime: baseTime.toISOString(),
        endTime: new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString(), // +1 hour
        type: 'video'
      };

      await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(firstAppointment)
        .expect(201);

      // Try to create conflicting appointment
      const conflictingAppointment = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Conflicting Appointment',
        startTime: new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString(), // +30 minutes
        endTime: new Date(baseTime.getTime() + 90 * 60 * 1000).toISOString(), // +1.5 hours
        type: 'video'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(conflictingAppointment)
        .expect(409);

      expect(response.body.message).toContain('Coach is not available');
    });
  });

  describe('Appointment Retrieval', () => {
    let appointmentId: string;

    beforeEach(async () => {
      // Create test appointment
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Test Appointment',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        type: 'video',
        status: 'scheduled'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData);

      appointmentId = response.body.id;
    });

    it('should get appointment by ID', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/appointments/${appointmentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: appointmentId,
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Test Appointment',
        type: 'video',
        status: 'scheduled'
      });
    });

    it('should get client appointments', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get('/appointments/client/my-appointments')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: appointmentId,
        clientId: clientUserId,
        title: 'Test Appointment'
      });
    });

    it('should get coach appointments', async () => {
      const response = await integrationTest['authenticatedRequest'](coachToken)
        .get('/appointments/coach/my-appointments')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: appointmentId,
        coachId: coachUserId,
        title: 'Test Appointment'
      });
    });

    it('should filter appointments by date range', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get('/appointments/client/my-appointments')
        .query({
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: dayAfterTomorrow.toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('should filter appointments by status', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get('/appointments/client/my-appointments')
        .query({ status: 'scheduled' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('scheduled');
    });
  });

  describe('Appointment Updates', () => {
    let appointmentId: string;

    beforeEach(async () => {
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Original Appointment',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        type: 'video',
        status: 'scheduled'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData);

      appointmentId = response.body.id;
    });

    it('should update appointment successfully', async () => {
      const updateData = {
        title: 'Updated Appointment',
        description: 'Updated description',
        type: 'phone'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .put(`/appointments/${appointmentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: appointmentId,
        title: updateData.title,
        description: updateData.description,
        type: updateData.type
      });
    });

    it('should reschedule appointment', async () => {
      const newStartTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const newEndTime = new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString();

      const rescheduleData = {
        startTime: newStartTime,
        endTime: newEndTime,
        reason: 'Client requested reschedule'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .put(`/appointments/${appointmentId}/reschedule`)
        .send(rescheduleData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: appointmentId,
        status: 'rescheduled'
      });
      expect(new Date(response.body.startTime)).toEqual(new Date(newStartTime));
      expect(new Date(response.body.endTime)).toEqual(new Date(newEndTime));
    });

    it('should cancel appointment', async () => {
      const cancelData = {
        reason: 'Personal emergency',
        cancelledBy: 'client'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .put(`/appointments/${appointmentId}/cancel`)
        .send(cancelData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: appointmentId,
        status: 'cancelled',
        cancellationReason: cancelData.reason,
        cancelledBy: cancelData.cancelledBy
      });
    });

    it('should complete appointment', async () => {
      const completeData = {
        notes: 'Great session, client made significant progress',
        nextSteps: 'Continue with weekly sessions'
      };

      const response = await integrationTest['authenticatedRequest'](coachToken)
        .put(`/appointments/${appointmentId}/complete`)
        .send(completeData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: appointmentId,
        status: 'completed',
        sessionNotes: completeData.notes,
        nextSteps: completeData.nextSteps
      });
    });
  });

  describe('Appointment Notifications', () => {
    it('should send appointment reminders', async () => {
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Reminder Test',
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        type: 'video',
        reminderEnabled: true
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData)
        .expect(201);

      const appointmentId = response.body.id;

      // Trigger reminder
      await integrationTest['authenticatedRequest'](coachToken)
        .post(`/appointments/${appointmentId}/send-reminder`)
        .expect(200);
    });

    it('should handle appointment confirmation workflow', async () => {
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Confirmation Test',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        type: 'video',
        requiresConfirmation: true
      };

      const createResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData)
        .expect(201);

      const appointmentId = createResponse.body.id;
      expect(createResponse.body.status).toBe('pending_confirmation');

      // Coach confirms appointment
      const confirmResponse = await integrationTest['authenticatedRequest'](coachToken)
        .put(`/appointments/${appointmentId}/confirm`)
        .expect(200);

      expect(confirmResponse.body.status).toBe('confirmed');
    });
  });

  describe('Recurring Appointments', () => {
    it('should create recurring appointments', async () => {
      const recurringData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Weekly Coaching Session',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        type: 'video',
        isRecurring: true,
        recurrencePattern: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [1], // Monday
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
        }
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments/recurring')
        .send(recurringData)
        .expect(201);

      expect(response.body.recurringSeriesId).toBeDefined();
      expect(response.body.appointmentIds).toBeInstanceOf(Array);
      expect(response.body.appointmentIds.length).toBeGreaterThan(1);
    });

    it('should update recurring series', async () => {
      // First create a recurring series
      const recurringData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Weekly Sessions',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        type: 'video',
        isRecurring: true,
        recurrencePattern: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [1],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      const createResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments/recurring')
        .send(recurringData);

      const seriesId = createResponse.body.recurringSeriesId;

      // Update the series
      const updateData = {
        title: 'Updated Weekly Sessions',
        type: 'phone'
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .put(`/appointments/recurring/${seriesId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.updatedCount).toBeGreaterThan(0);
    });
  });

  describe('Coach Availability', () => {
    it('should set coach availability', async () => {
      const availabilityData = {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true
      };

      const response = await integrationTest['authenticatedRequest'](coachToken)
        .post('/appointments/coach/availability')
        .send(availabilityData)
        .expect(201);

      expect(response.body).toMatchObject({
        coachId: coachUserId,
        dayOfWeek: availabilityData.dayOfWeek,
        startTime: availabilityData.startTime,
        endTime: availabilityData.endTime,
        isAvailable: availabilityData.isAvailable
      });
    });

    it('should get coach available time slots', async () => {
      // Set availability first
      await integrationTest['authenticatedRequest'](coachToken)
        .post('/appointments/coach/availability')
        .send({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        });

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (tomorrow.getDay() === 1) { // If tomorrow is Monday
        const response = await integrationTest['authenticatedRequest'](clientToken)
          .get(`/appointments/coach/${coachUserId}/available-slots`)
          .query({
            date: tomorrow.toISOString().split('T')[0]
          })
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration with External Services', () => {
    it('should handle Google Calendar integration', async () => {
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'Calendar Integration Test',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        type: 'video',
        syncWithGoogleCalendar: true
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData)
        .expect(201);

      expect(response.body.googleCalendarEventId).toBeDefined();
    });

    it('should send SMS notifications', async () => {
      const appointmentData = {
        clientId: clientUserId,
        coachId: coachUserId,
        title: 'SMS Test',
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        type: 'video',
        smsReminder: true
      };

      const createResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments')
        .send(appointmentData)
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Test SMS reminder
      const response = await integrationTest['authenticatedRequest'](coachToken)
        .post(`/appointments/${appointmentId}/send-sms-reminder`)
        .expect(200);

      expect(response.body.message).toContain('SMS reminder sent');
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent appointment bookings', async () => {
      const baseTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Try to book the same time slot concurrently
      const appointmentPromises = Array.from({ length: 5 }, (_, i) => 
        integrationTest['authenticatedRequest'](clientToken)
          .post('/appointments')
          .send({
            clientId: clientUserId,
            coachId: coachUserId,
            title: `Concurrent Appointment ${i}`,
            startTime: baseTime.toISOString(),
            endTime: new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString(),
            type: 'video'
          })
      );

      const results = await Promise.allSettled(appointmentPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 201).length;
      const conflicts = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 409).length;

      // Only one should succeed, others should get conflict error
      expect(successful).toBe(1);
      expect(conflicts).toBe(4);
    });

    it('should handle bulk appointment operations', async () => {
      const appointments = Array.from({ length: 10 }, (_, i) => ({
        clientId: clientUserId,
        coachId: coachUserId,
        title: `Bulk Appointment ${i}`,
        startTime: new Date(Date.now() + (24 + i) * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + (25 + i) * 60 * 60 * 1000).toISOString(),
        type: 'video'
      }));

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/appointments/bulk')
        .send({ appointments })
        .expect(201);

      expect(response.body.created).toBe(10);
      expect(response.body.failed).toBe(0);
    });
  });
});