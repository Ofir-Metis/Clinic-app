
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionRecording } from './recording.entity';
import { Appointment } from '../appointments/appointment.entity';
import * as fs from 'fs';

@Injectable()
export class RecordingService {
    private readonly logger = new Logger(RecordingService.name);
    private readonly uploadDir = process.env.UPLOAD_DIR || 'uploads/recordings';

    constructor(
        @InjectRepository(SessionRecording)
        private readonly recordingRepository: Repository<SessionRecording>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
    ) {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveRecording(
        appointmentId: string,
        file: Express.Multer.File,
        userId: string,
        metadata?: any
    ): Promise<SessionRecording> {
        const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
        if (!appointment) {
            throw new NotFoundException(`Appointment ${appointmentId} not found`);
        }

        // Move file to permanent location if needed (Multer stores in /tmp usually if not configured)
        // Here we assume configuration puts it in a temp, so we move it or if using diskStorage it's already there.
        // Since we'll define Multer config in controller/module, let's assume `file.path` is valid.

        // If file is in memory (buffer), write it. 
        // But better to use diskStorage in controller. 
        // Let's assume the controller handles the physical save via Interceptor and passes the file info here.

        // Actually, for simplicity, I'll assume the controller passed the file object after Multer saved it locally.

        const recording = this.recordingRepository.create({
            appointmentId,
            filename: file.filename,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
            storageProvider: 'local',
            createdBy: userId,
            metadata
        });

        const savedRecording = await this.recordingRepository.save(recording);

        // Update Appointment recording files JSONB
        const fileEntry = {
            id: savedRecording.id,
            type: file.mimetype.includes('video') ? 'video' : 'audio',
            url: `/api/appointments/${appointmentId}/recordings/${savedRecording.id}/stream`, // Placeholder
            duration: 0, // Need to process to get duration later
            size: file.size,
            createdAt: new Date()
        };

        if (!appointment.recordingFiles) {
            appointment.recordingFiles = [];
        }
        // @ts-ignore
        appointment.recordingFiles.push(fileEntry);
        appointment.recordingStatus = 'completed';

        await this.appointmentRepository.save(appointment);

        // Trigger background summary generation
        this.generateSummary(savedRecording.id).catch(err =>
            this.logger.error(`Summary generation failed for ${savedRecording.id}`, err)
        );

        return savedRecording;
    }

    async generateSummary(recordingId: string): Promise<void> {
        this.logger.log(`Starting background summary generation for ${recordingId}`);

        const recording = await this.recordingRepository.findOne({ where: { id: recordingId } });
        if (!recording) return;

        recording.processingStatus = 'processing';
        await this.recordingRepository.save(recording);

        // Simulate AI delay
        setTimeout(async () => {
            try {
                // Mock AI response
                const mockSummary = {
                    keyPoints: [
                        'Client expressed concerns about work-life balance',
                        'Discussed strategies for stress management',
                        'Identified triggers for anxiety in social situations'
                    ],
                    actionItems: [
                        'Practice breathing exercises daily',
                        'Keep a mood journal for the next week',
                        'Schedule a follow-up appointment in two weeks'
                    ],
                    insights: [
                        'Client shows high self-awareness',
                        'Progress noted in articulating feelings',
                        'Motivation for change is evident'
                    ],
                    recommendations: [
                        'Continue cognitive behavioral therapy techniques',
                        'Explore mindfulness meditation apps'
                    ],
                    mood: 'Reflective and open',
                    progressNotes: 'Client engaged well in the session. Showed improvement in recognizing emotional patterns.',
                    nextSessionFocus: 'Reviewing homework assignments and discussing relationship dynamics.'
                };

                recording.summary = mockSummary;
                recording.processingStatus = 'completed';
                recording.transcription = "This is a simulated transcription of the session...";

                await this.recordingRepository.save(recording);
                this.logger.log(`Summary generation completed for ${recordingId}`);
            } catch (err) {
                this.logger.error(`Background summary failed`, err);
                recording.processingStatus = 'failed';
                await this.recordingRepository.save(recording);
            }
        }, 5000); // 5 seconds delay
    }

    async getRecording(id: string): Promise<SessionRecording> {
        const recording = await this.recordingRepository.findOne({ where: { id } });
        if (!recording) {
            throw new NotFoundException(`Recording ${id} not found`);
        }
        return recording;
    }

    async getRecordingsByAppointment(appointmentId: string): Promise<SessionRecording[]> {
        return this.recordingRepository.find({
            where: { appointmentId },
            order: { createdAt: 'DESC' }
        });
    }

    // Consent Management Methods
    async submitConsent(
        sessionId: string,
        consent: {
            audioConsent: boolean;
            transcriptionConsent: boolean;
            aiAnalysisConsent: boolean;
            userId: string;
        }
    ): Promise<SessionRecording> {
        // Find recording by appointment ID (treating sessionId as appointmentId)
        const recordings = await this.recordingRepository.find({
            where: { appointmentId: sessionId },
            order: { createdAt: 'DESC' }
        });

        if (!recordings || recordings.length === 0) {
            // Create a placeholder recording for consent tracking
            const recording = this.recordingRepository.create({
                appointmentId: sessionId,
                filename: 'consent-placeholder',
                originalFilename: 'consent-placeholder',
                mimeType: 'application/json',
                size: 0,
                path: '',
                storageProvider: 'local',
                createdBy: consent.userId,
                audioConsent: consent.audioConsent,
                transcriptionConsent: consent.transcriptionConsent,
                aiAnalysisConsent: consent.aiAnalysisConsent,
                consentGivenAt: new Date(),
            });

            return this.recordingRepository.save(recording);
        }

        // Update the most recent recording with consent
        const recording = recordings[0];
        recording.audioConsent = consent.audioConsent;
        recording.transcriptionConsent = consent.transcriptionConsent;
        recording.aiAnalysisConsent = consent.aiAnalysisConsent;
        recording.consentGivenAt = new Date();
        recording.consentRevokedAt = null as any;

        return this.recordingRepository.save(recording);
    }

    async getConsentStatus(sessionId: string): Promise<{
        audioConsent: boolean;
        transcriptionConsent: boolean;
        aiAnalysisConsent: boolean;
        consentGivenAt?: Date;
        consentRevokedAt?: Date;
    } | null> {
        const recordings = await this.recordingRepository.find({
            where: { appointmentId: sessionId },
            order: { createdAt: 'DESC' }
        });

        if (!recordings || recordings.length === 0) {
            return null;
        }

        const recording = recordings[0];
        return {
            audioConsent: recording.audioConsent,
            transcriptionConsent: recording.transcriptionConsent,
            aiAnalysisConsent: recording.aiAnalysisConsent,
            consentGivenAt: recording.consentGivenAt,
            consentRevokedAt: recording.consentRevokedAt,
        };
    }

    async getConsentHistory(userId: string): Promise<SessionRecording[]> {
        return this.recordingRepository.find({
            where: { createdBy: userId },
            order: { consentGivenAt: 'DESC' }
        });
    }

    async revokeConsent(sessionId: string, _userId: string): Promise<SessionRecording> {
        const recordings = await this.recordingRepository.find({
            where: { appointmentId: sessionId },
            order: { createdAt: 'DESC' }
        });

        if (!recordings || recordings.length === 0) {
            throw new NotFoundException(`No recording found for session ${sessionId}`);
        }

        const recording = recordings[0];
        recording.audioConsent = false;
        recording.transcriptionConsent = false;
        recording.aiAnalysisConsent = false;
        recording.consentRevokedAt = new Date();

        return this.recordingRepository.save(recording);
    }
}
