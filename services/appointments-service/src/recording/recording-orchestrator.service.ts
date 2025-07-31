/**
 * RecordingOrchestratorService - Manages recording lifecycle for different meeting types
 * Coordinates between WebRTC recording, Google Meet recording, and file management
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, RecordingType, MeetingType } from '../appointments/appointment.entity';

export interface RecordingSession {
  id: string;
  appointmentId: string;
  type: RecordingType;
  meetingType: MeetingType;
  status: 'preparing' | 'recording' | 'paused' | 'stopped' | 'processing' | 'completed' | 'failed';
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  fileIds: string[];
  metadata: {
    quality: string;
    includeTranscription: boolean;
    autoStarted: boolean;
    recordingMethod: 'webrtc' | 'google-meet' | 'hybrid';
  };
}

export interface RecordingConfiguration {
  appointmentId: string;
  recordingType: RecordingType;
  meetingType: MeetingType;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  autoStart: boolean;
  includeTranscription: boolean;
  shareWithClient: boolean;
  retentionDays: number;
}

export interface RecordingStartRequest {
  appointmentId: string;
  recordingType?: RecordingType;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  includeTranscription?: boolean;
  userId: string;
}

export interface RecordingControlResult {
  success: boolean;
  sessionId?: string;
  status?: string;
  message: string;
  error?: string;
  fileUrls?: string[];
}

@Injectable()
export class RecordingOrchestratorService {
  private readonly logger = new Logger(RecordingOrchestratorService.name);
  private activeSessions = new Map<string, RecordingSession>();

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>
  ) {}

  /**
   * Start recording for an appointment based on its configuration
   */
  async startRecording(request: RecordingStartRequest): Promise<RecordingControlResult> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: request.appointmentId }
      });

      if (!appointment) {
        throw new BadRequestException('Appointment not found');
      }

      if (!appointment.canBeRecorded()) {
        throw new BadRequestException('Appointment cannot be recorded in its current state');
      }

      // Check if recording is already active
      if (this.activeSessions.has(appointment.id)) {
        const session = this.activeSessions.get(appointment.id)!;
        if (session.status === 'recording') {
          return {
            success: false,
            message: 'Recording is already active for this appointment',
            sessionId: session.id,
            status: session.status
          };
        }
      }

      // Determine recording configuration
      const recordingConfig = this.buildRecordingConfiguration(appointment, request);
      
      // Create recording session
      const session = await this.createRecordingSession(appointment, recordingConfig, request.userId);
      
      // Start appropriate recording method based on meeting type
      const startResult = await this.initiateRecording(session, appointment);

      if (startResult.success) {
        // Update appointment with recording session info
        appointment.recordingSessionId = session.id;
        appointment.recordingStatus = 'recording';
        await this.appointmentRepository.save(appointment);

        // Store active session
        this.activeSessions.set(appointment.id, session);

        this.logger.log(`Started ${recordingConfig.recordingType} recording for appointment ${appointment.id}`);
      }

      return startResult;

    } catch (error) {
      this.logger.error(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Stop recording for an appointment
   */
  async stopRecording(appointmentId: string, userId: string): Promise<RecordingControlResult> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId }
      });

      if (!appointment) {
        throw new BadRequestException('Appointment not found');
      }

      const session = this.activeSessions.get(appointmentId);
      if (!session) {
        throw new BadRequestException('No active recording session found');
      }

      if (session.status !== 'recording') {
        return {
          success: false,
          message: `Recording is not active (current status: ${session.status})`,
          sessionId: session.id,
          status: session.status
        };
      }

      // Stop recording based on method
      const stopResult = await this.terminateRecording(session, appointment);

      if (stopResult.success) {
        // Update session
        session.status = 'processing';
        session.endedAt = new Date();
        session.duration = session.startedAt ? 
          Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000) : 0;

        // Update appointment
        appointment.recordingStatus = 'processing';
        await this.appointmentRepository.save(appointment);

        // Process recording files asynchronously
        this.processRecordingFiles(session, appointment)
          .catch(error => {
            this.logger.error(`Failed to process recording files: ${error instanceof Error ? error.message : String(error)}`);
          });

        this.logger.log(`Stopped recording for appointment ${appointmentId}, processing files...`);
      }

      return stopResult;

    } catch (error) {
      this.logger.error(`Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(appointmentId: string, userId: string): Promise<RecordingControlResult> {
    try {
      const session = this.activeSessions.get(appointmentId);
      if (!session) {
        throw new BadRequestException('No active recording session found');
      }

      if (session.status !== 'recording') {
        return {
          success: false,
          message: `Cannot pause recording (current status: ${session.status})`,
          sessionId: session.id,
          status: session.status
        };
      }

      // Pause recording based on method
      const pauseResult = await this.pauseRecordingByMethod(session);

      if (pauseResult.success) {
        session.status = 'paused';
        
        const appointment = await this.appointmentRepository.findOne({
          where: { id: appointmentId }
        });
        
        if (appointment) {
          appointment.recordingStatus = 'paused';
          await this.appointmentRepository.save(appointment);
        }

        this.logger.log(`Paused recording for appointment ${appointmentId}`);
      }

      return pauseResult;

    } catch (error) {
      this.logger.error(`Failed to pause recording: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(appointmentId: string, userId: string): Promise<RecordingControlResult> {
    try {
      const session = this.activeSessions.get(appointmentId);
      if (!session) {
        throw new BadRequestException('No active recording session found');
      }

      if (session.status !== 'paused') {
        return {
          success: false,
          message: `Cannot resume recording (current status: ${session.status})`,
          sessionId: session.id,
          status: session.status
        };
      }

      // Resume recording based on method
      const resumeResult = await this.resumeRecordingByMethod(session);

      if (resumeResult.success) {
        session.status = 'recording';
        
        const appointment = await this.appointmentRepository.findOne({
          where: { id: appointmentId }
        });
        
        if (appointment) {
          appointment.recordingStatus = 'recording';
          await this.appointmentRepository.save(appointment);
        }

        this.logger.log(`Resumed recording for appointment ${appointmentId}`);
      }

      return resumeResult;

    } catch (error) {
      this.logger.error(`Failed to resume recording: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get recording status for an appointment
   */
  async getRecordingStatus(appointmentId: string): Promise<{
    hasActiveSession: boolean;
    session?: RecordingSession;
    appointment?: Appointment;
  }> {
    const session = this.activeSessions.get(appointmentId);
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId }
    });

    return {
      hasActiveSession: !!session,
      session,
      appointment: appointment || undefined
    };
  }

  /**
   * Get all active recording sessions
   */
  getActiveRecordingSessions(): RecordingSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Clean up completed or failed sessions
   */
  async cleanupCompletedSessions(): Promise<number> {
    let cleanedCount = 0;

    for (const [appointmentId, session] of this.activeSessions.entries()) {
      if (['completed', 'failed'].includes(session.status)) {
        this.activeSessions.delete(appointmentId);
        cleanedCount++;
        this.logger.log(`Cleaned up session ${session.id} for appointment ${appointmentId}`);
      }
    }

    return cleanedCount;
  }

  // Private helper methods

  private buildRecordingConfiguration(
    appointment: Appointment,
    request: RecordingStartRequest
  ): RecordingConfiguration {
    const settings = appointment.meetingConfig.recordingSettings;
    
    return {
      appointmentId: appointment.id,
      recordingType: request.recordingType || settings.type,
      meetingType: appointment.meetingType,
      quality: request.quality || settings.quality,
      autoStart: settings.autoStart,
      includeTranscription: request.includeTranscription ?? settings.includeTranscription,
      shareWithClient: settings.shareWithClient,
      retentionDays: settings.retentionDays
    };
  }

  private async createRecordingSession(
    appointment: Appointment,
    config: RecordingConfiguration,
    userId: string
  ): Promise<RecordingSession> {
    const sessionId = `rec_${appointment.id}_${Date.now()}`;
    
    return {
      id: sessionId,
      appointmentId: appointment.id,
      type: config.recordingType,
      meetingType: config.meetingType,
      status: 'preparing',
      fileIds: [],
      metadata: {
        quality: config.quality,
        includeTranscription: config.includeTranscription,
        autoStarted: config.autoStart,
        recordingMethod: this.getRecordingMethod(config.meetingType, config.recordingType)
      }
    };
  }

  private getRecordingMethod(
    meetingType: MeetingType,
    recordingType: RecordingType
  ): 'webrtc' | 'google-meet' | 'hybrid' {
    if (meetingType === 'online' && recordingType === 'full-session') {
      return 'google-meet';
    } else if (meetingType === 'in-person') {
      return 'webrtc';
    } else if (meetingType === 'hybrid') {
      return 'hybrid';
    }
    return 'webrtc';
  }

  private async initiateRecording(
    session: RecordingSession,
    appointment: Appointment
  ): Promise<RecordingControlResult> {
    try {
      session.startedAt = new Date();
      session.status = 'recording';

      switch (session.metadata.recordingMethod) {
        case 'webrtc':
          return await this.startWebRTCRecording(session, appointment);
        
        case 'google-meet':
          return await this.startGoogleMeetRecording(session, appointment);
        
        case 'hybrid':
          return await this.startHybridRecording(session, appointment);
        
        default:
          throw new Error(`Unsupported recording method: ${session.metadata.recordingMethod}`);
      }
    } catch (error) {
      session.status = 'failed';
      throw error;
    }
  }

  private async startWebRTCRecording(
    session: RecordingSession,
    appointment: Appointment
  ): Promise<RecordingControlResult> {
    // This would integrate with the WebRTC recording service
    // For now, return a mock successful response
    
    this.logger.log(`Starting WebRTC ${session.type} recording for appointment ${appointment.id}`);
    
    return {
      success: true,
      sessionId: session.id,
      status: 'recording',
      message: `Started ${session.type} recording via WebRTC`
    };
  }

  private async startGoogleMeetRecording(
    session: RecordingSession,
    appointment: Appointment
  ): Promise<RecordingControlResult> {
    // This would integrate with Google Meet recording API
    // For now, return a mock successful response
    
    this.logger.log(`Starting Google Meet recording for appointment ${appointment.id}`);
    
    return {
      success: true,
      sessionId: session.id,
      status: 'recording',
      message: 'Started full session recording via Google Meet'
    };
  }

  private async startHybridRecording(
    session: RecordingSession,
    appointment: Appointment
  ): Promise<RecordingControlResult> {
    // This would coordinate both WebRTC and Google Meet recording
    // For now, return a mock successful response
    
    this.logger.log(`Starting hybrid recording for appointment ${appointment.id}`);
    
    return {
      success: true,
      sessionId: session.id,
      status: 'recording',
      message: 'Started hybrid recording (WebRTC + Google Meet)'
    };
  }

  private async terminateRecording(
    session: RecordingSession,
    appointment: Appointment
  ): Promise<RecordingControlResult> {
    try {
      switch (session.metadata.recordingMethod) {
        case 'webrtc':
          return await this.stopWebRTCRecording(session);
        
        case 'google-meet':
          return await this.stopGoogleMeetRecording(session);
        
        case 'hybrid':
          return await this.stopHybridRecording(session);
        
        default:
          throw new Error(`Unsupported recording method: ${session.metadata.recordingMethod}`);
      }
    } catch (error) {
      session.status = 'failed';
      throw error;
    }
  }

  private async stopWebRTCRecording(session: RecordingSession): Promise<RecordingControlResult> {
    // Integrate with WebRTC recording service to stop recording
    this.logger.log(`Stopping WebRTC recording for session ${session.id}`);
    
    return {
      success: true,
      sessionId: session.id,
      status: 'processing',
      message: 'WebRTC recording stopped, processing files...'
    };
  }

  private async stopGoogleMeetRecording(session: RecordingSession): Promise<RecordingControlResult> {
    // Integrate with Google Meet API to stop recording
    this.logger.log(`Stopping Google Meet recording for session ${session.id}`);
    
    return {
      success: true,
      sessionId: session.id,
      status: 'processing',
      message: 'Google Meet recording stopped, processing files...'
    };
  }

  private async stopHybridRecording(session: RecordingSession): Promise<RecordingControlResult> {
    // Stop both recording methods
    this.logger.log(`Stopping hybrid recording for session ${session.id}`);
    
    return {
      success: true,
      sessionId: session.id,
      status: 'processing',
      message: 'Hybrid recording stopped, processing files...'
    };
  }

  private async pauseRecordingByMethod(session: RecordingSession): Promise<RecordingControlResult> {
    // Implement pause logic based on recording method
    return {
      success: true,
      sessionId: session.id,
      status: 'paused',
      message: 'Recording paused'
    };
  }

  private async resumeRecordingByMethod(session: RecordingSession): Promise<RecordingControlResult> {
    // Implement resume logic based on recording method
    return {
      success: true,
      sessionId: session.id,
      status: 'recording',
      message: 'Recording resumed'
    };
  }

  private async processRecordingFiles(
    session: RecordingSession,
    appointment: Appointment
  ): Promise<void> {
    try {
      this.logger.log(`Processing recording files for session ${session.id}`);

      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update session status
      session.status = 'completed';
      
      // Create mock file entries
      const recordingFiles = [
        {
          id: `file_${session.id}_audio`,
          type: 'audio' as const,
          url: `/recordings/${session.id}/audio.mp3`,
          duration: session.duration || 0,
          size: 1024 * 1024 * 5, // 5MB
          createdAt: new Date()
        }
      ];

      if (session.type === 'video' || session.type === 'full-session') {
        recordingFiles.push({
          id: `file_${session.id}_video`,
          type: 'video' as const,
          url: `/recordings/${session.id}/video.mp4`,
          duration: session.duration || 0,
          size: 1024 * 1024 * 50, // 50MB
          createdAt: new Date()
        });
      }

      // Update appointment with recording files
      appointment.recordingStatus = 'completed';
      appointment.recordingFiles = recordingFiles;
      await this.appointmentRepository.save(appointment);

      // Clean up session after delay
      setTimeout(() => {
        this.activeSessions.delete(appointment.id);
      }, 5 * 60 * 1000); // 5 minutes

      this.logger.log(`Completed processing recording files for session ${session.id}`);

    } catch (error) {
      this.logger.error(`Failed to process recording files: ${error instanceof Error ? error.message : String(error)}`);
      
      session.status = 'failed';
      appointment.recordingStatus = 'failed';
      await this.appointmentRepository.save(appointment);
    }
  }
}