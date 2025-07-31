/**
 * MeetingManagerService Test Suite
 * Tests for meeting type management and Google Meet integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { MeetingManagerService } from './meeting-manager.service';
import { Appointment, MeetingType, AppointmentStatus } from '../appointments/appointment.entity';

describe('MeetingManagerService', () => {
  let service: MeetingManagerService;
  let appointmentRepository: Repository<Appointment>;
  let googleIntegrationClient: ClientProxy;

  const mockAppointment: Partial<Appointment> = {
    id: 'test-appointment-id',
    therapistId: 'test-therapist-id',
    clientId: 'test-client-id',
    startTime: new Date('2024-12-01T10:00:00Z'),
    endTime: new Date('2024-12-01T11:00:00Z'),
    title: 'Test Coaching Session',
    description: 'Personal development session',
    meetingType: 'in-person',
    status: 'scheduled' as AppointmentStatus,
    meetingConfig: {
      type: 'in-person',
      googleMeetEnabled: false,
      waitingRoomEnabled: true,
      recordingSettings: {
        enabled: false,
        type: 'none',
        quality: 'medium',
        autoStart: false,
        includeTranscription: false,
        shareWithClient: false,
        retentionDays: 30
      },
      allowClientToJoinEarly: false,
      meetingDuration: 60
    },
    canBeModified: () => true
  };

  const mockRepositoryMethods = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockGoogleIntegrationClient = {
    send: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingManagerService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockRepositoryMethods,
        },
        {
          provide: 'GOOGLE_INTEGRATION_SERVICE',
          useValue: mockGoogleIntegrationClient,
        },
      ],
    }).compile();

    service = module.get<MeetingManagerService>(MeetingManagerService);
    appointmentRepository = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
    googleIntegrationClient = module.get<ClientProxy>('GOOGLE_INTEGRATION_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMeetingConfiguration', () => {
    it('should create in-person meeting configuration', async () => {
      const request = {
        appointmentId: 'test-appointment-id',
        meetingType: 'in-person' as MeetingType,
        location: 'Office Room 1',
        recordingSettings: {
          enabled: true,
          type: 'audio-only' as const,
          quality: 'high' as const
        }
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockAppointment);
      mockRepositoryMethods.save.mockResolvedValue({
        ...mockAppointment,
        meetingConfig: {
          ...mockAppointment.meetingConfig,
          location: request.location,
          recordingSettings: {
            ...mockAppointment.meetingConfig?.recordingSettings,
            ...request.recordingSettings
          }
        }
      });

      const result = await service.createMeetingConfiguration(request, 'test-user');

      expect(result.success).toBe(true);
      expect(result.appointment).toBeDefined();
      expect(result.changes).toContain('Recording configuration updated');
      expect(mockRepositoryMethods.save).toHaveBeenCalled();
    });

    it('should create online meeting with Google Meet link', async () => {
      const request = {
        appointmentId: 'test-appointment-id',
        meetingType: 'online' as MeetingType,
        googleMeetEnabled: true,
        recordingSettings: {
          enabled: true,
          type: 'full-session' as const
        }
      };

      const mockGoogleAccount = {
        id: 'google-account-id',
        email: 'coach@example.com'
      };

      const mockMeetResult = {
        success: true,
        googleEventId: 'google-event-id',
        meetingUrl: 'https://meet.google.com/abc-defg-hij'
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockAppointment);
      mockGoogleIntegrationClient.send.mockImplementation((pattern) => {
        if (pattern === 'google_account.find_by_user') {
          return of({ googleAccount: mockGoogleAccount });
        }
        if (pattern === 'calendar.create_event') {
          return of(mockMeetResult);
        }
        return of({});
      });

      mockRepositoryMethods.save.mockResolvedValue({
        ...mockAppointment,
        meetingType: 'online',
        meetingConfig: {
          ...mockAppointment.meetingConfig,
          type: 'online',
          googleMeetEnabled: true,
          meetingUrl: mockMeetResult.meetingUrl
        }
      });

      const result = await service.createMeetingConfiguration(request, 'test-user');

      expect(result.success).toBe(true);
      expect(result.meetingUrl).toBe(mockMeetResult.meetingUrl);
      expect(result.changes).toContain('Google Meet link generated');
      expect(mockGoogleIntegrationClient.send).toHaveBeenCalledWith(
        'google_account.find_by_user',
        expect.any(Object)
      );
      expect(mockGoogleIntegrationClient.send).toHaveBeenCalledWith(
        'calendar.create_event',
        expect.any(Object)
      );
    });

    it('should handle Google Meet generation failure gracefully', async () => {
      const request = {
        appointmentId: 'test-appointment-id',
        meetingType: 'online' as MeetingType,
        googleMeetEnabled: true
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockAppointment);
      mockGoogleIntegrationClient.send.mockImplementation((pattern) => {
        if (pattern === 'google_account.find_by_user') {
          return of({ googleAccount: null }); // No Google account connected
        }
        return of({});
      });

      mockRepositoryMethods.save.mockResolvedValue({
        ...mockAppointment,
        meetingType: 'online'
      });

      const result = await service.createMeetingConfiguration(request, 'test-user');

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('Coach has not connected their Google account')
      );
    });
  });

  describe('changeMeetingType', () => {
    it('should change from in-person to online meeting', async () => {
      const updateRequest = {
        meetingType: 'online' as MeetingType,
        googleMeetEnabled: true
      };

      const mockGoogleAccount = {
        id: 'google-account-id',
        email: 'coach@example.com'
      };

      const mockMeetResult = {
        success: true,
        googleEventId: 'google-event-id',
        meetingUrl: 'https://meet.google.com/xyz-abc-def'
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockAppointment);
      mockGoogleIntegrationClient.send.mockImplementation((pattern) => {
        if (pattern === 'google_account.find_by_user') {
          return of({ googleAccount: mockGoogleAccount });
        }
        if (pattern === 'calendar.create_event') {
          return of(mockMeetResult);
        }
        return of({ success: true });
      });

      mockRepositoryMethods.save.mockResolvedValue({
        ...mockAppointment,
        meetingType: 'online',
        meetingConfig: {
          ...mockAppointment.meetingConfig,
          type: 'online',
          googleMeetEnabled: true,
          meetingUrl: mockMeetResult.meetingUrl
        }
      });

      const result = await service.changeMeetingType(
        'test-appointment-id',
        updateRequest,
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.meetingUrl).toBe(mockMeetResult.meetingUrl);
      expect(result.changes).toContain('Meeting type changed from in-person to online');
      expect(result.changes).toContain('Google Meet link generated');
    });

    it('should change from online to in-person meeting', async () => {
      const onlineAppointment = {
        ...mockAppointment,
        meetingType: 'online' as MeetingType,
        meetingConfig: {
          ...mockAppointment.meetingConfig,
          type: 'online' as const,
          googleMeetEnabled: true,
          meetingUrl: 'https://meet.google.com/old-link'
        }
      };

      const updateRequest = {
        meetingType: 'in-person' as MeetingType,
        location: 'New Office Location'
      };

      mockRepositoryMethods.findOne.mockResolvedValue(onlineAppointment);
      mockRepositoryMethods.save.mockResolvedValue({
        ...onlineAppointment,
        meetingType: 'in-person',
        meetingConfig: {
          ...onlineAppointment.meetingConfig,
          type: 'in-person',
          googleMeetEnabled: false,
          meetingUrl: undefined,
          location: updateRequest.location
        }
      });

      const result = await service.changeMeetingType(
        'test-appointment-id',
        updateRequest,
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.appointment.meetingConfig.meetingUrl).toBeUndefined();
      expect(result.appointment.meetingConfig.location).toBe(updateRequest.location);
      expect(result.changes).toContain('Meeting type changed from online to in-person');
      expect(result.changes).toContain('Meeting location set');
    });
  });

  describe('validateMeetingTypeChange', () => {
    it('should allow meeting type change when appointment can be modified', async () => {
      const futureAppointment = {
        ...mockAppointment,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };

      mockRepositoryMethods.findOne.mockResolvedValue(futureAppointment);

      const result = await service.validateMeetingTypeChange(
        'test-appointment-id',
        'online'
      );

      expect(result.valid).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should reject meeting type change when too close to appointment time', async () => {
      const soonAppointment = {
        ...mockAppointment,
        startTime: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
      };

      mockRepositoryMethods.findOne.mockResolvedValue(soonAppointment);

      const result = await service.validateMeetingTypeChange(
        'test-appointment-id',
        'online'
      );

      expect(result.valid).toBe(false);
      expect(result.reasons).toContain(
        'Meeting type cannot be changed less than 2 hours before the appointment'
      );
    });

    it('should reject when appointment not found', async () => {
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      const result = await service.validateMeetingTypeChange(
        'non-existent-id',
        'online'
      );

      expect(result.valid).toBe(false);
      expect(result.reasons).toContain('Appointment not found');
    });
  });

  describe('getRecommendedConfiguration', () => {
    it('should return correct configuration for online meetings', () => {
      const config = service.getRecommendedConfiguration('online');

      expect(config.googleMeetEnabled).toBe(true);
      expect(config.recordingSettings?.type).toBe('full-session');
      expect(config.recordingSettings?.includeTranscription).toBe(true);
    });

    it('should return correct configuration for in-person meetings', () => {
      const config = service.getRecommendedConfiguration('in-person');

      expect(config.googleMeetEnabled).toBe(false);
      expect(config.recordingSettings?.type).toBe('audio-only');
      expect(config.recordingSettings?.includeTranscription).toBe(true);
    });

    it('should return correct configuration for hybrid meetings', () => {
      const config = service.getRecommendedConfiguration('hybrid');

      expect(config.googleMeetEnabled).toBe(true);
      expect(config.recordingSettings?.type).toBe('video');
      expect(config.recordingSettings?.includeTranscription).toBe(true);
    });
  });
});