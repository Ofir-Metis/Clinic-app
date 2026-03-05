import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecordingService } from './recording.service';
import { SessionRecording } from './recording.entity';
import { Appointment } from '../appointments/appointment.entity';
import { NotFoundException } from '@nestjs/common';

describe('RecordingService', () => {
    let service: RecordingService;

    const mockRecordingRepository = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockImplementation(recording => Promise.resolve({ id: 'rec_1', ...recording })),
        findOne: jest.fn().mockImplementation(({ where: { id } }) => {
            if (id === 'rec_1') return Promise.resolve({ id: 'rec_1', appointmentId: 'app_1', processingStatus: 'pending' });
            return Promise.resolve(null);
        }),
        find: jest.fn(),
    };

    const mockAppointmentRepository = {
        findOne: jest.fn().mockImplementation(({ where: { id } }) => {
            if (id === 'app_1') return Promise.resolve({ id: 'app_1', recordingFiles: [] });
            return Promise.resolve(null);
        }),
        save: jest.fn().mockResolvedValue(true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RecordingService,
                {
                    provide: getRepositoryToken(SessionRecording),
                    useValue: mockRecordingRepository,
                },
                {
                    provide: getRepositoryToken(Appointment),
                    useValue: mockAppointmentRepository,
                },
            ],
        }).compile();

        service = module.get<RecordingService>(RecordingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('saveRecording', () => {
        it('should save a recording and update appointment', async () => {
            const file = {
                filename: 'test.webm',
                originalname: 'test.webm',
                mimetype: 'video/webm',
                size: 1024,
                path: '/tmp/test.webm',
            } as Express.Multer.File;

            const result = await service.saveRecording('app_1', file, 'user_1', {});

            expect(result).toBeDefined();
            expect(mockRecordingRepository.create).toHaveBeenCalled();
            expect(mockRecordingRepository.save).toHaveBeenCalled();
            expect(mockAppointmentRepository.findOne).toHaveBeenCalledWith({ where: { id: 'app_1' } });
            expect(mockAppointmentRepository.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if appointment not found', async () => {
            const file = {
                filename: 'test.webm',
            } as Express.Multer.File;

            await expect(service.saveRecording('invalid_app', file, 'user_1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getRecording', () => {
        it('should return a recording if found', async () => {
            const recording = await service.getRecording('rec_1');
            expect(recording).toBeDefined();
            expect(recording.id).toBe('rec_1');
        });

        it('should throw NotFoundException if recording not found', async () => {
            await expect(service.getRecording('invalid_rec')).rejects.toThrow(NotFoundException);
        });
    });

    describe('generateSummary', () => {
        it('should initiate background processing', async () => {
            jest.useFakeTimers();
            await service.generateSummary('rec_1');

            expect(mockRecordingRepository.findOne).toHaveBeenCalledWith({ where: { id: 'rec_1' } });
            // Since it's background, we just verify the initial status update call
            // Ideally we'd test the setTimeout callback but that requires more complex mocking or e2e tests
            jest.useRealTimers();
        });
    });
});
