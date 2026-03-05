import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { RecordingConsent } from './consent.entity';

describe('ConsentService', () => {
  let service: ConsentService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        {
          provide: getRepositoryToken(RecordingConsent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);

    jest.clearAllMocks();
  });

  describe('createConsent', () => {
    const createConsentDto = {
      appointmentId: 'appt-123',
      participantId: 'user-456',
      participantRole: 'client' as const,
      participantName: 'John Doe',
      consentedFeatures: {
        audioRecording: true,
        videoRecording: true,
        aiAnalysis: true,
        transcription: true,
        sharing: false,
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    };

    it('creates a new consent record', async () => {
      const mockConsent = {
        id: 'consent-789',
        ...createConsentDto,
        consentGivenAt: new Date(),
        revokedAt: null,
        isValid: () => true,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockConsent);
      mockRepository.save.mockResolvedValue(mockConsent);

      const result = await service.createConsent(createConsentDto);

      expect(result.id).toBe('consent-789');
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws ConflictException if valid consent already exists', async () => {
      const existingConsent = {
        id: 'existing-consent',
        revokedAt: null,
        isValid: () => true,
      };

      mockRepository.findOne.mockResolvedValue(existingConsent);

      await expect(service.createConsent(createConsentDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates new consent if previous was revoked', async () => {
      const revokedConsent = {
        id: 'revoked-consent',
        revokedAt: new Date(),
        isValid: () => false,
      };

      const newConsent = {
        id: 'new-consent',
        ...createConsentDto,
        consentGivenAt: new Date(),
        revokedAt: null,
        isValid: () => true,
      };

      mockRepository.findOne.mockResolvedValue(revokedConsent);
      mockRepository.create.mockReturnValue(newConsent);
      mockRepository.save.mockResolvedValue(newConsent);

      const result = await service.createConsent(createConsentDto);

      expect(result.id).toBe('new-consent');
    });
  });

  describe('getConsentStatus', () => {
    it('returns status when both participants have consented', async () => {
      const consents = [
        {
          id: 'consent-1',
          participantRole: 'coach',
          revokedAt: null,
          isValid: () => true,
        },
        {
          id: 'consent-2',
          participantRole: 'client',
          revokedAt: null,
          isValid: () => true,
        },
      ];

      mockRepository.find.mockResolvedValue(consents);

      const result = await service.getConsentStatus('appt-123');

      expect(result.canRecord).toBe(true);
      expect(result.hasConsent).toBe(true);
      expect(result.missingConsents).toHaveLength(0);
    });

    it('returns missing consents when some are missing', async () => {
      const consents = [
        {
          id: 'consent-1',
          participantRole: 'coach',
          revokedAt: null,
          isValid: () => true,
        },
      ];

      mockRepository.find.mockResolvedValue(consents);

      const result = await service.getConsentStatus('appt-123');

      expect(result.canRecord).toBe(false);
      expect(result.missingConsents).toContain('client');
    });

    it('filters out revoked consents', async () => {
      const consents = [
        {
          id: 'consent-1',
          participantRole: 'coach',
          revokedAt: new Date(), // Revoked
          isValid: () => false,
        },
        {
          id: 'consent-2',
          participantRole: 'client',
          revokedAt: null,
          isValid: () => true,
        },
      ];

      mockRepository.find.mockResolvedValue(consents);

      const result = await service.getConsentStatus('appt-123');

      expect(result.canRecord).toBe(false);
      expect(result.missingConsents).toContain('coach');
    });
  });

  describe('getConsent', () => {
    it('returns consent by id', async () => {
      const mockConsent = {
        id: 'consent-123',
        appointmentId: 'appt-456',
      };

      mockRepository.findOne.mockResolvedValue(mockConsent);

      const result = await service.getConsent('consent-123');

      expect(result.id).toBe('consent-123');
    });

    it('throws NotFoundException when consent not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getConsent('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('revokeConsent', () => {
    it('revokes a valid consent', async () => {
      const mockConsent = {
        id: 'consent-123',
        revokedAt: null,
        isValid: () => true,
      };

      const revokedConsent = {
        ...mockConsent,
        revokedAt: expect.any(Date),
        revokeReason: 'User requested',
        revokedBy: 'user-789',
      };

      mockRepository.findOne.mockResolvedValue(mockConsent);
      mockRepository.save.mockResolvedValue(revokedConsent);

      const result = await service.revokeConsent('consent-123', {
        reason: 'User requested',
        revokedBy: 'user-789',
      });

      expect(result.revokeReason).toBe('User requested');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws ConflictException when already revoked', async () => {
      const mockConsent = {
        id: 'consent-123',
        revokedAt: new Date(),
        isValid: () => false,
      };

      mockRepository.findOne.mockResolvedValue(mockConsent);

      await expect(
        service.revokeConsent('consent-123', {
          reason: 'Test',
          revokedBy: 'user-789',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyConsent', () => {
    it('returns valid=true for active consent', async () => {
      const mockConsent = {
        id: 'consent-123',
        revokedAt: null,
        isValid: () => true,
      };

      mockRepository.findOne.mockResolvedValue(mockConsent);

      const result = await service.verifyConsent('consent-123');

      expect(result.valid).toBe(true);
    });

    it('returns valid=false for revoked consent', async () => {
      const mockConsent = {
        id: 'consent-123',
        revokedAt: new Date(),
        revokeReason: 'Withdrawn',
        isValid: () => false,
      };

      mockRepository.findOne.mockResolvedValue(mockConsent);

      const result = await service.verifyConsent('consent-123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Withdrawn');
    });

    it('returns valid=false for nonexistent consent', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyConsent('nonexistent');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Consent not found');
    });
  });

  describe('canRecord', () => {
    it('returns true when all consents are valid', async () => {
      const consents = [
        { participantRole: 'coach', revokedAt: null, isValid: () => true },
        { participantRole: 'client', revokedAt: null, isValid: () => true },
      ];

      mockRepository.find.mockResolvedValue(consents);

      const result = await service.canRecord('appt-123');

      expect(result).toBe(true);
    });

    it('returns false when consent is missing', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.canRecord('appt-123');

      expect(result).toBe(false);
    });
  });
});
