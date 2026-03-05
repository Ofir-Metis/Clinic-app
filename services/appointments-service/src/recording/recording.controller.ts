
import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Param,
    Body,
    ParseUUIDPipe,
    Logger,
    Get,
    StreamableFile,
    Res,
    NotFoundException,
    Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordingService } from './recording.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const UPLOAD_DIR = 'uploads/recordings';

// Ensure dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('appointments/:appointmentId/recordings')
export class RecordingController {
    private readonly logger = new Logger(RecordingController.name);

    constructor(private readonly recordingService: RecordingService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('recording', {
        storage: diskStorage({
            destination: UPLOAD_DIR,
            filename: (_req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        limits: {
            fileSize: 500 * 1024 * 1024 // 500MB
        }
    }))
    async uploadRecording(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('participantId') participantId: string, // passed from frontend
        @Body('sessionId') sessionId: string
    ) {
        this.logger.log(`Uploading file for appointment ${appointmentId}, size: ${file.size}`);

        // In a real app, userId would come from @User() decorator from JWT guard
        // For now we use participantId or a hardcoded system user ID if necessary
        const userId = participantId || 'system';

        return this.recordingService.saveRecording(appointmentId, file, userId, { sessionId });
    }

    @Get(':recordingId/stream')
    async streamRecording(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
        @Param('recordingId', ParseUUIDPipe) recordingId: string,
        @Res({ passthrough: true }) res: Response
    ): Promise<StreamableFile> {
        this.logger.log(`Streaming recording ${recordingId} for appointment ${appointmentId}`);

        const recording = await this.recordingService.getRecording(recordingId);

        if (!recording || recording.appointmentId !== appointmentId) {
            throw new NotFoundException('Recording not found for this appointment');
        }

        if (!fs.existsSync(recording.path)) {
            throw new NotFoundException('Recording file not found on disk');
        }

        const file = createReadStream(recording.path);

        res.set({
            'Content-Type': recording.mimeType,
            'Content-Disposition': `inline; filename="${recording.originalFilename}"`,
        });

        return new StreamableFile(file);
    }

    @Get(':recordingId')
    async getRecording(
        @Param('appointmentId', ParseUUIDPipe) _appointmentId: string,
        @Param('recordingId', ParseUUIDPipe) recordingId: string
    ) {
        return this.recordingService.getRecording(recordingId);
    }

    @Get()
    async getRecordings(@Param('appointmentId', ParseUUIDPipe) appointmentId: string) {
        return this.recordingService.getRecordingsByAppointment(appointmentId);
    }
}

// Consent endpoints controller
@Controller('recordings/consent')
export class RecordingConsentController {
    private readonly logger = new Logger(RecordingConsentController.name);

    constructor(private readonly recordingService: RecordingService) { }

    // Static route BEFORE parameterized :sessionId
    @Get('history')
    async getConsentHistory(
        @Body('userId') userId: string // In production, get from JWT
    ) {
        this.logger.log(`Getting consent history for user ${userId}`);
        return this.recordingService.getConsentHistory(userId);
    }

    @Post()
    async submitConsent(
        @Body('sessionId') sessionId: string,
        @Body('audioConsent') audioConsent: boolean,
        @Body('transcriptionConsent') transcriptionConsent: boolean,
        @Body('aiAnalysisConsent') aiAnalysisConsent: boolean,
        @Body('userId') userId: string // In production, get from JWT
    ) {
        this.logger.log(`Submitting consent for session ${sessionId}`);

        return this.recordingService.submitConsent(sessionId, {
            audioConsent,
            transcriptionConsent,
            aiAnalysisConsent,
            userId,
        });
    }

    @Get(':sessionId')
    async getConsentStatus(
        @Param('sessionId', ParseUUIDPipe) sessionId: string
    ) {
        this.logger.log(`Getting consent status for session ${sessionId}`);
        return this.recordingService.getConsentStatus(sessionId);
    }

    @Delete(':sessionId')
    async revokeConsent(
        @Param('sessionId', ParseUUIDPipe) sessionId: string,
        @Body('userId') userId: string // In production, get from JWT
    ) {
        this.logger.log(`Revoking consent for session ${sessionId}`);
        return this.recordingService.revokeConsent(sessionId, userId);
    }
}
