/**
 * SessionAnalysisService - Orchestrates transcription and AI analysis of coaching sessions
 * Handles the complete pipeline from audio file to actionable insights
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { OpenaiService, SessionSummaryRequest, TranscriptionRequest } from '../openai.service';
import { SessionSummary, ProcessingStatus } from '../entities/session-summary.entity';
import { Transcription, TranscriptionStatus } from '../entities/transcription.entity';

export interface AnalysisRequest {
  appointmentId: string;
  recordingId: string;
  coachId: string;
  clientId: string;
  audioFilePath: string;
  sessionType?: 'initial-consultation' | 'follow-up' | 'goal-setting' | 'progress-review' | 'breakthrough' | 'other';
  clientGoals?: string[];
  coachNotes?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface AnalysisResult {
  success: boolean;
  transcriptionId?: string;
  summaryId?: string;
  processingTimeMs: number;
  errors?: string[];
  warnings?: string[];
}

@Injectable()
export class SessionAnalysisService {
  private readonly logger = new Logger(SessionAnalysisService.name);

  constructor(
    @InjectRepository(SessionSummary)
    private readonly summaryRepository: Repository<SessionSummary>,
    
    @InjectRepository(Transcription)
    private readonly transcriptionRepository: Repository<Transcription>,
    
    private readonly openaiService: OpenaiService,
    
    @Inject('FILES_SERVICE')
    private readonly filesClient: ClientProxy,
    
    @Inject('APPOINTMENTS_SERVICE') 
    private readonly appointmentsClient: ClientProxy
  ) {}

  /**
   * Process a coaching session recording end-to-end
   */
  async processSessionRecording(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.logger.debug(`Starting session analysis for appointment ${request.appointmentId}`);

      // 1. Create initial transcription record
      const transcription = await this.createTranscriptionRecord(request);
      
      // 2. Download and validate audio file
      const audioBuffer = await this.downloadAudioFile(request.audioFilePath);
      if (!audioBuffer) {
        throw new Error('Failed to download audio file');
      }

      // 3. Create initial summary record
      const summary = await this.createSummaryRecord(request, transcription.id);

      // 4. Process transcription
      await this.updateTranscriptionStatus(transcription.id, 'processing');
      const transcriptionResult = await this.transcribeAudio(transcription, audioBuffer);
      
      if (!transcriptionResult.success) {
        errors.push(`Transcription failed: ${transcriptionResult.error}`);
        await this.updateTranscriptionStatus(transcription.id, 'failed', transcriptionResult.error);
        await this.updateSummaryStatus(summary.id, 'failed', 'Transcription failed');
        
        return {
          success: false,
          transcriptionId: transcription.id,
          summaryId: summary.id,
          processingTimeMs: Date.now() - startTime,
          errors
        };
      }

      // 5. Generate AI summary
      await this.updateSummaryStatus(summary.id, 'processing');
      const summaryResult = await this.generateSummary(
        summary.id, 
        transcriptionResult.text!,
        request
      );

      if (!summaryResult.success) {
        errors.push(`Summary generation failed: ${summaryResult.error}`);
        await this.updateSummaryStatus(summary.id, 'failed', summaryResult.error);
        
        return {
          success: false,
          transcriptionId: transcription.id,
          summaryId: summary.id,
          processingTimeMs: Date.now() - startTime,
          errors
        };
      }

      // 6. Link transcription to summary
      await this.linkTranscriptionToSummary(transcription.id, summary.id);

      // 7. Notify appointment service of completion
      try {
        await this.notifyAppointmentService(request.appointmentId, {
          transcriptionId: transcription.id,
          summaryId: summary.id,
          processingComplete: true
        });
      } catch (error) {
        warnings.push(`Failed to notify appointment service: ${error.message}`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Session analysis completed for ${request.appointmentId} in ${processingTime}ms`);

      return {
        success: true,
        transcriptionId: transcription.id,
        summaryId: summary.id,
        processingTimeMs: processingTime,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      this.logger.error(`Session analysis failed for ${request.appointmentId}: ${error.message}`, error.stack);
      
      return {
        success: false,
        processingTimeMs: Date.now() - startTime,
        errors: [error.message, ...errors]
      };
    }
  }

  /**
   * Get session summary by appointment ID
   */
  async getSessionSummary(appointmentId: string): Promise<SessionSummary | null> {
    return this.summaryRepository.findOne({
      where: { appointmentId },
      relations: ['sessionSummary']
    });
  }

  /**
   * Get transcription by appointment ID
   */
  async getTranscription(appointmentId: string): Promise<Transcription | null> {
    return this.transcriptionRepository.findOne({
      where: { appointmentId }
    });
  }

  /**
   * Update coach review for summary
   */
  async updateCoachReview(
    summaryId: string, 
    coachId: string,
    review: {
      feedback?: string;
      rating?: number;
      approved: boolean;
    }
  ): Promise<void> {
    const summary = await this.summaryRepository.findOne({ 
      where: { id: summaryId, coachId } 
    });
    
    if (!summary) {
      throw new Error('Summary not found or access denied');
    }

    await this.summaryRepository.update(summaryId, {
      reviewedByCoach: true,
      coachFeedback: review.feedback,
      coachRating: review.rating,
      reviewedAt: new Date(),
      sharedWithClient: review.approved
    });

    this.logger.debug(`Coach review updated for summary ${summaryId}`);
  }

  /**
   * Share summary with client
   */
  async shareWithClient(summaryId: string, coachId: string): Promise<void> {
    const summary = await this.summaryRepository.findOne({ 
      where: { id: summaryId, coachId } 
    });
    
    if (!summary) {
      throw new Error('Summary not found or access denied');
    }

    const validationErrors = summary.validateForSharing();
    if (validationErrors.length > 0) {
      throw new Error(`Cannot share summary: ${validationErrors.join(', ')}`);
    }

    await this.summaryRepository.update(summaryId, {
      sharedWithClient: true
    });

    // Notify client through notifications service
    try {
      await firstValueFrom(this.appointmentsClient.send('notification.session_summary_available', {
        clientId: summary.clientId,
        appointmentId: summary.appointmentId,
        summaryId: summary.id
      }));
    } catch (error) {
      this.logger.warn(`Failed to notify client about summary: ${error.message}`);
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(coachId?: string): Promise<{
    totalSessions: number;
    completedSummaries: number;
    pendingProcessing: number;
    failedProcessing: number;
    averageProcessingTimeMs: number;
    qualityMetrics: {
      averageConfidenceLevel: number;
      reviewedSummaries: number;
      sharedWithClients: number;
    };
  }> {
    const whereCondition = coachId ? { coachId } : {};

    const [totalSessions, completedSummaries, pendingProcessing, failedProcessing] = await Promise.all([
      this.summaryRepository.count({ where: whereCondition }),
      this.summaryRepository.count({ where: { ...whereCondition, processingStatus: 'completed' } }),
      this.summaryRepository.count({ where: { ...whereCondition, processingStatus: 'processing' } }),
      this.summaryRepository.count({ where: { ...whereCondition, processingStatus: 'failed' } })
    ]);

    const completedSessions = await this.summaryRepository.find({
      where: { ...whereCondition, processingStatus: 'completed' },
      select: ['processingTimeMs', 'confidenceLevel', 'reviewedByCoach', 'sharedWithClient']
    });

    const averageProcessingTimeMs = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.processingTimeMs || 0), 0) / completedSessions.length
      : 0;

    const averageConfidenceLevel = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + s.confidenceLevel, 0) / completedSessions.length
      : 0;

    const reviewedSummaries = completedSessions.filter(s => s.reviewedByCoach).length;
    const sharedWithClients = completedSessions.filter(s => s.sharedWithClient).length;

    return {
      totalSessions,
      completedSummaries,
      pendingProcessing,
      failedProcessing,
      averageProcessingTimeMs: Math.round(averageProcessingTimeMs),
      qualityMetrics: {
        averageConfidenceLevel: Math.round(averageConfidenceLevel * 10) / 10,
        reviewedSummaries,
        sharedWithClients
      }
    };
  }

  // Private helper methods

  private async createTranscriptionRecord(request: AnalysisRequest): Promise<Transcription> {
    const transcription = this.transcriptionRepository.create({
      appointmentId: request.appointmentId,
      recordingId: request.recordingId,
      coachId: request.coachId,
      clientId: request.clientId,
      originalFilename: request.audioFilePath.split('/').pop() || 'unknown',
      filePath: request.audioFilePath,
      fileSize: 0, // Will be updated after download
      durationSeconds: 0, // Will be updated after analysis
      status: 'pending'
    });

    return this.transcriptionRepository.save(transcription);
  }

  private async createSummaryRecord(request: AnalysisRequest, transcriptionId: string): Promise<SessionSummary> {
    const summary = this.summaryRepository.create({
      appointmentId: request.appointmentId,
      coachId: request.coachId,
      clientId: request.clientId,
      sessionType: request.sessionType || 'other',
      processingStatus: 'pending',
      keyInsights: [],
      progressMade: [],
      challengesDiscussed: [],
      actionItems: [],
      nextSessionFocus: '',
      emotionalTone: 'neutral',
      clientEngagement: 'medium',
      coachingTechniques: [],
      followUpRequired: false,
      confidenceLevel: 0
    });

    return this.summaryRepository.save(summary);
  }

  private async downloadAudioFile(filePath: string): Promise<Buffer | null> {
    try {
      const result = await firstValueFrom(
        this.filesClient.send('file.download', { filePath })
      );
      return result.buffer;
    } catch (error) {
      this.logger.error(`Failed to download audio file: ${error.message}`);
      return null;
    }
  }

  private async transcribeAudio(
    transcription: Transcription, 
    audioBuffer: Buffer
  ): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const request: TranscriptionRequest = {
        audioBuffer,
        fileName: transcription.originalFilename,
        language: 'en',
        prompt: 'This is a personal development coaching session focusing on growth, goals, and positive change.'
      };

      const result = await this.openaiService.transcribeAudio(request);
      
      // Update transcription record
      await this.transcriptionRepository.update(transcription.id, {
        fullText: result.text,
        characterCount: result.text.length,
        wordCount: result.text.split(' ').length,
        durationSeconds: result.duration,
        languageDetected: result.language,
        confidenceScore: result.confidence,
        segments: result.segments,
        status: 'completed',
        processingCompletedAt: new Date(),
        metadata: {
          model: 'whisper-1',
          language: result.language,
          duration: result.duration,
          file_size: audioBuffer.length,
          processing_time_ms: 0 // Will be calculated
        }
      });

      return { success: true, text: result.text };

    } catch (error) {
      this.logger.error(`Transcription failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  private async generateSummary(
    summaryId: string,
    transcript: string,
    request: AnalysisRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const summaryRequest: SessionSummaryRequest = {
        appointmentId: request.appointmentId,
        transcript,
        sessionType: request.sessionType || 'other',
        clientGoals: request.clientGoals,
        coachNotes: request.coachNotes
      };

      const aiSummary = await this.openaiService.generateSessionSummary(summaryRequest);
      
      // Update summary record
      await this.summaryRepository.update(summaryId, {
        ...aiSummary,
        processingStatus: 'completed',
        rawTranscript: transcript,
        transcriptLength: transcript.length,
        processingTimeMs: Date.now() // This should be calculated properly
      });

      return { success: true };

    } catch (error) {
      this.logger.error(`Summary generation failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  private async updateTranscriptionStatus(
    id: string, 
    status: TranscriptionStatus, 
    error?: string
  ): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'processing') {
      updateData.processingStartedAt = new Date();
    } else if (status === 'completed') {
      updateData.processingCompletedAt = new Date();
    } else if (status === 'failed' && error) {
      updateData.errorMessage = error;
    }

    await this.transcriptionRepository.update(id, updateData);
  }

  private async updateSummaryStatus(
    id: string, 
    status: ProcessingStatus, 
    error?: string
  ): Promise<void> {
    const updateData: any = { processingStatus: status };
    
    if (status === 'failed' && error) {
      updateData.processingError = error;
    }

    await this.summaryRepository.update(id, updateData);
  }

  private async linkTranscriptionToSummary(transcriptionId: string, summaryId: string): Promise<void> {
    await this.transcriptionRepository.update(transcriptionId, {
      sessionSummaryId: summaryId
    });
  }

  private async notifyAppointmentService(appointmentId: string, data: any): Promise<void> {
    await firstValueFrom(
      this.appointmentsClient.send('appointment.analysis_complete', {
        appointmentId,
        ...data
      })
    );
  }
}