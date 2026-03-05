import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { VoiceNotesService, TranscriptionMetadata } from './voice-notes.service';
import { VoiceNote } from './voice-note.entity';
import { NotesService } from '../notes/notes.service';

describe('VoiceNotesService', () => {
  let service: VoiceNotesService;
  let voiceNoteRepository: jest.Mocked<Repository<VoiceNote>>;
  let notesService: jest.Mocked<NotesService>;

  const mockCoachId = 'coach-123';
  const createMockVoiceNote = (): Partial<VoiceNote> => ({
    id: 'voice-note-123',
    coachId: mockCoachId,
    audioFileKey: 'voice-notes/coach-123/audio.webm',
    durationSeconds: 120,
    fileSizeBytes: 1024000,
    mimeType: 'audio/webm',
    transcriptionStatus: 'pending',
    isPrivate: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  let mockVoiceNote: Partial<VoiceNote>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(1),
    getMany: jest.fn(), // Will be configured in beforeEach
  };

  const mockRepositoryFactory = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  });

  beforeEach(async () => {
    // Reset all mock functions before each test
    jest.clearAllMocks();
    // Create fresh mock data
    mockVoiceNote = createMockVoiceNote();
    mockQueryBuilder.getMany.mockResolvedValue([mockVoiceNote]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceNotesService,
        {
          provide: getRepositoryToken(VoiceNote),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: NotesService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VoiceNotesService>(VoiceNotesService);
    voiceNoteRepository = module.get(getRepositoryToken(VoiceNote));
    notesService = module.get(NotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a voice note', async () => {
      const dto = {
        audioFileKey: 'voice-notes/coach-123/audio.webm',
        durationSeconds: 120,
        fileSizeBytes: 1024000,
        appointmentId: 'apt-123',
      };

      voiceNoteRepository.create.mockReturnValue(mockVoiceNote as VoiceNote);
      voiceNoteRepository.save.mockResolvedValue(mockVoiceNote as VoiceNote);

      const result = await service.create(mockCoachId, dto);

      expect(voiceNoteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          coachId: mockCoachId,
          audioFileKey: dto.audioFileKey,
          durationSeconds: dto.durationSeconds,
          transcriptionStatus: 'pending',
        }),
      );
      expect(voiceNoteRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(mockVoiceNote.id);
    });

    it('should set default values for optional fields', async () => {
      const dto = {
        audioFileKey: 'test.webm',
        durationSeconds: 60,
        fileSizeBytes: 512000,
      };

      voiceNoteRepository.create.mockReturnValue(mockVoiceNote as VoiceNote);
      voiceNoteRepository.save.mockResolvedValue(mockVoiceNote as VoiceNote);

      await service.create(mockCoachId, dto);

      expect(voiceNoteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'audio/webm',
          isPrivate: true,
          transcriptionStatus: 'pending',
        }),
      );
    });
  });

  describe('findByCoach', () => {
    it('should return voice notes for a coach', async () => {
      const result = await service.findByCoach({ coachId: mockCoachId });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by appointment ID', async () => {
      await service.findByCoach({
        coachId: mockCoachId,
        appointmentId: 'apt-123',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a voice note by ID', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);

      const result = await service.findOne('voice-note-123');

      expect(result.id).toBe(mockVoiceNote.id);
    });

    it('should throw NotFoundException when voice note not found', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneForCoach', () => {
    it('should return voice note if coach owns it', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);

      const result = await service.findOneForCoach('voice-note-123', mockCoachId);

      expect(result.id).toBe(mockVoiceNote.id);
    });

    it('should throw ForbiddenException if coach does not own voice note', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);

      await expect(
        service.findOneForCoach('voice-note-123', 'other-coach'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update transcription and calculate word count', async () => {
      const updatedNote = {
        ...mockVoiceNote,
        transcription: 'Hello world test',
        wordCount: 3,
      };
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);
      voiceNoteRepository.save.mockResolvedValue(updatedNote as VoiceNote);

      const result = await service.update('voice-note-123', mockCoachId, {
        transcription: 'Hello world test',
      });

      expect(voiceNoteRepository.save).toHaveBeenCalled();
    });

    it('should update title', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);
      voiceNoteRepository.save.mockResolvedValue({
        ...mockVoiceNote,
        title: 'New Title',
      } as VoiceNote);

      await service.update('voice-note-123', mockCoachId, {
        title: 'New Title',
      });

      expect(voiceNoteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Title' }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a voice note', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);
      voiceNoteRepository.remove.mockResolvedValue(mockVoiceNote as VoiceNote);

      await service.delete('voice-note-123', mockCoachId);

      expect(voiceNoteRepository.remove).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update transcription status', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);
      voiceNoteRepository.save.mockResolvedValue({
        ...mockVoiceNote,
        transcriptionStatus: 'processing',
      } as VoiceNote);

      const result = await service.updateStatus('voice-note-123', 'processing');

      expect(result.transcriptionStatus).toBe('processing');
    });

    it('should record error on failure', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);
      voiceNoteRepository.save.mockResolvedValue({
        ...mockVoiceNote,
        transcriptionStatus: 'failed',
        transcriptionError: 'API error',
      } as VoiceNote);

      const result = await service.updateStatus('voice-note-123', 'failed', 'API error');

      expect(result.transcriptionStatus).toBe('failed');
    });
  });

  describe('updateTranscription', () => {
    it('should update transcription with metadata', async () => {
      const metadata: TranscriptionMetadata = {
        confidence: 0.95,
        language: 'en',
        duration: 120,
        wordCount: 50,
      };

      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);
      voiceNoteRepository.save.mockResolvedValue({
        ...mockVoiceNote,
        transcription: 'Test transcription',
        transcriptionStatus: 'completed',
        transcriptionConfidence: 0.95,
        languageDetected: 'en',
      } as VoiceNote);

      const result = await service.updateTranscription(
        'voice-note-123',
        'Test transcription',
        metadata,
      );

      expect(result.transcriptionStatus).toBe('completed');
      expect(result.transcriptionConfidence).toBe(0.95);
    });

    it('should auto-generate title from transcription', async () => {
      const noteWithoutTitle = { ...mockVoiceNote, title: undefined };
      voiceNoteRepository.findOne.mockResolvedValue(noteWithoutTitle as VoiceNote);
      voiceNoteRepository.save.mockImplementation(async (note) => note as VoiceNote);

      await service.updateTranscription('voice-note-123', 'This is a test sentence. More content.', {
        confidence: 0.9,
        language: 'en',
        duration: 60,
      });

      expect(voiceNoteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('This is a test sentence'),
        }),
      );
    });
  });

  describe('convertToNote', () => {
    it('should convert voice note to regular note', async () => {
      const transcribedNote = {
        ...mockVoiceNote,
        transcription: 'Test transcription content',
        transcriptionStatus: 'completed',
      };

      voiceNoteRepository.findOne.mockResolvedValue(transcribedNote as VoiceNote);
      notesService.create.mockResolvedValue({
        id: 'note-123',
        coachId: mockCoachId,
        entityId: 'apt-123',
        entityType: 'appointment',
        content: 'Test transcription content',
        isPrivate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      voiceNoteRepository.save.mockResolvedValue({
        ...transcribedNote,
        linkedNoteId: 'note-123',
      } as VoiceNote);

      const result = await service.convertToNote('voice-note-123', mockCoachId, {
        entityType: 'appointment',
        entityId: 'apt-123',
      });

      expect(result.noteId).toBe('note-123');
      expect(result.voiceNoteId).toBe('voice-note-123');
      expect(notesService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no transcription', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);

      await expect(
        service.convertToNote('voice-note-123', mockCoachId, {
          entityType: 'appointment',
          entityId: 'apt-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('retryTranscription', () => {
    it('should reset status to pending for failed transcriptions', async () => {
      const failedNote = {
        ...mockVoiceNote,
        transcriptionStatus: 'failed',
        transcriptionError: 'Previous error',
      };

      voiceNoteRepository.findOne.mockResolvedValue(failedNote as VoiceNote);
      voiceNoteRepository.save.mockResolvedValue({
        ...failedNote,
        transcriptionStatus: 'pending',
        transcriptionError: undefined,
      } as VoiceNote);

      const result = await service.retryTranscription('voice-note-123', mockCoachId);

      expect(result.transcriptionStatus).toBe('pending');
    });

    it('should throw BadRequestException if not in failed state', async () => {
      voiceNoteRepository.findOne.mockResolvedValue(mockVoiceNote as VoiceNote);

      await expect(
        service.retryTranscription('voice-note-123', mockCoachId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingTranscriptions', () => {
    it('should return pending voice notes', async () => {
      const pendingNotes = [mockVoiceNote];
      voiceNoteRepository.find.mockResolvedValue(pendingNotes as VoiceNote[]);

      const result = await service.getPendingTranscriptions(5);

      expect(voiceNoteRepository.find).toHaveBeenCalledWith({
        where: { transcriptionStatus: 'pending' },
        order: { createdAt: 'ASC' },
        take: 5,
      });
      expect(result).toHaveLength(1);
    });
  });
});
