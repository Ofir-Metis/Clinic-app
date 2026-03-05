import { Test, TestingModule } from '@nestjs/testing';
import { RecordingController } from './recording.controller';
import { RecordingService } from './recording.service';
import { StreamableFile, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('RecordingController', () => {
    let controller: RecordingController;

    const mockRecordingService = {
        saveRecording: jest.fn().mockImplementation((appId, file, _userId) =>
            Promise.resolve({ id: 'rec_1', appointmentId: appId, filename: file.filename })
        ),
        getRecording: jest.fn().mockImplementation((id) => {
            if (id === 'rec_1') return Promise.resolve({
                id: 'rec_1',
                appointmentId: 'app_1',
                path: '/tmp/test.webm',
                mimeType: 'video/webm',
                originalFilename: 'test.webm'
            });
            return Promise.resolve(null);
        }),
        getRecordingsByAppointment: jest.fn().mockResolvedValue([]),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RecordingController],
            providers: [
                {
                    provide: RecordingService,
                    useValue: mockRecordingService,
                },
            ],
        }).compile();

        controller = module.get<RecordingController>(RecordingController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('uploadRecording', () => {
        it('should call service.saveRecording', async () => {
            const file = { filename: 'test.webm', size: 100 } as Express.Multer.File;
            const result = await controller.uploadRecording('app_1', file, 'p_1', 's_1');
            expect(result).toEqual(expect.objectContaining({ id: 'rec_1' }));
            expect(mockRecordingService.saveRecording).toHaveBeenCalledWith('app_1', file, 'p_1', expect.any(Object));
        });
    });

    describe('streamRecording', () => {
        it('should return a StreamableFile', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.createReadStream as jest.Mock).mockReturnValue('stream');

            const res = { set: jest.fn() } as any;
            const result = await controller.streamRecording('app_1', 'rec_1', res);

            expect(result).toBeInstanceOf(StreamableFile);
            expect(mockRecordingService.getRecording).toHaveBeenCalledWith('rec_1');
        });

        it('should throw NotFoundException if recording does not exist', async () => {
            await expect(controller.streamRecording('app_1', 'invalid', {} as any)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if file path invalid', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            await expect(controller.streamRecording('app_1', 'rec_1', {} as any)).rejects.toThrow(NotFoundException);
        });
    });
});
