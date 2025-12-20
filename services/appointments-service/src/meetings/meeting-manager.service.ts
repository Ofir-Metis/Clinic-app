/**
 * MeetingManagerService - Orchestrates meeting types, recording, and integrations
 * Handles the complex logic for managing different meeting types and their recording requirements
 */

import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Appointment, MeetingType, RecordingType, RecordingSettings, MeetingConfig } from '../appointments/appointment.entity';

export interface MeetingCreationRequest {
  appointmentId: string;
  meetingType: MeetingType;
  location?: string;
  recordingSettings?: Partial<RecordingSettings>;
  googleMeetEnabled?: boolean;
  meetingDuration?: number;
  therapistPreferences?: {
    defaultRecordingType: RecordingType;
    autoStartRecording: boolean;
    shareRecordingsWithClient: boolean;
  };
}

export interface MeetingUpdateRequest {
  meetingType?: MeetingType;
  location?: string;
  recordingSettings?: Partial<RecordingSettings>;
  googleMeetEnabled?: boolean;
  generateNewMeetLink?: boolean;
}

export interface MeetingTypeChangeResult {
  success: boolean;
  appointment: Appointment;
  meetingUrl?: string;
  calendarEventUpdated: boolean;
  notificationsSent: boolean;
  recordingConfigUpdated: boolean;
  changes: string[];
  warnings: string[];
}

export interface GoogleMeetResponse {
  success: boolean;
  meetingUrl?: string;
  meetingId?: string;
  error?: string;
}

@Injectable()
export class MeetingManagerService {
  private readonly logger = new Logger(MeetingManagerService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @Inject('GOOGLE_INTEGRATION_SERVICE')
    private readonly googleIntegrationClient: ClientProxy
  ) {}

  /**
   * Create a new meeting configuration for an appointment
   */
  async createMeetingConfiguration(
    request: MeetingCreationRequest,
    createdBy: string
  ): Promise<MeetingTypeChangeResult> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: request.appointmentId }
      });

      if (!appointment) {
        throw new BadRequestException('Appointment not found');
      }

      if (!appointment.canBeModified()) {
        throw new BadRequestException('Appointment cannot be modified in its current state');
      }

      const changes: string[] = [];
      const warnings: string[] = [];

      // Configure meeting based on type
      const meetingConfig = await this.buildMeetingConfig(
        request.meetingType,
        request,
        appointment
      );

      // Update appointment
      appointment.meetingType = request.meetingType;
      appointment.meetingConfig = meetingConfig;
      appointment.updatedBy = createdBy;

      // Handle Google Meet link generation for online meetings
      let meetingUrl: string | undefined;
      if (meetingConfig.googleMeetEnabled && request.meetingType === 'online') {
        const meetResult = await this.generateGoogleMeetLink(appointment);
        if (meetResult.success) {
          meetingUrl = meetResult.meetingUrl;
          appointment.meetingConfig.meetingUrl = meetingUrl;
          changes.push('Google Meet link generated');
        } else {
          warnings.push(`Failed to generate Google Meet link: ${meetResult.error}`);
        }
      }

      // Save appointment
      const savedAppointment = await this.appointmentRepository.save(appointment);

      // Log the meeting configuration
      this.logger.log(
        `Created ${request.meetingType} meeting configuration for appointment ${appointment.id}`
      );

      return {
        success: true,
        appointment: savedAppointment,
        meetingUrl,
        calendarEventUpdated: false, // Will be handled by calendar sync service
        notificationsSent: false, // Will be handled by notification service
        recordingConfigUpdated: true,
        changes,
        warnings
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to create meeting configuration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Change meeting type (in-person <-> online)
   */
  async changeMeetingType(
    appointmentId: string,
    updateRequest: MeetingUpdateRequest,
    updatedBy: string
  ): Promise<MeetingTypeChangeResult> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId }
      });

      if (!appointment) {
        throw new BadRequestException('Appointment not found');
      }

      if (!appointment.canBeModified()) {
        throw new BadRequestException('Appointment cannot be modified in its current state');
      }

      const changes: string[] = [];
      const warnings: string[] = [];
      const oldMeetingType = appointment.meetingType;
      const newMeetingType = updateRequest.meetingType || appointment.meetingType;

      // Handle meeting type change
      if (oldMeetingType !== newMeetingType) {
        changes.push(`Meeting type changed from ${oldMeetingType} to ${newMeetingType}`);
        
        if (newMeetingType === 'online') {
          await this.convertToOnlineMeeting(appointment, updateRequest, changes, warnings);
        } else if (newMeetingType === 'in-person') {
          await this.convertToInPersonMeeting(appointment, updateRequest, changes, warnings);
        }
      }

      // Update recording settings if provided
      if (updateRequest.recordingSettings) {
        this.updateRecordingConfiguration(appointment, updateRequest.recordingSettings, newMeetingType, changes);
      }

      // Update other meeting configuration
      if (updateRequest.location && (newMeetingType === 'in-person' || newMeetingType === 'hybrid')) {
        appointment.meetingConfig.location = updateRequest.location;
        changes.push('Meeting location updated');
      }

      appointment.updatedBy = updatedBy;
      const savedAppointment = await this.appointmentRepository.save(appointment);

      // Update Google Calendar event if exists
      await this.updateGoogleCalendarEvent(savedAppointment, changes);

      // Send notifications about meeting type change
      await this.sendMeetingTypeChangeNotification(savedAppointment, oldMeetingType, newMeetingType);

      this.logger.log(`Meeting type changed for appointment ${appointmentId}: ${changes.join(', ')}`);

      return {
        success: true,
        appointment: savedAppointment,
        meetingUrl: savedAppointment.meetingConfig.meetingUrl,
        calendarEventUpdated: savedAppointment.calendarSynced || false,
        notificationsSent: true,
        recordingConfigUpdated: true,
        changes,
        warnings
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to change meeting type: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update recording settings for an appointment
   */
  async updateRecordingSettings(
    appointmentId: string,
    recordingSettings: Partial<RecordingSettings>,
    updatedBy: string
  ): Promise<{ success: boolean; appointment: Appointment; changes: string[] }> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId }
      });

      if (!appointment) {
        throw new BadRequestException('Appointment not found');
      }

      const changes: string[] = [];
      const oldSettings = appointment.meetingConfig.recordingSettings;

      // Update recording settings with validation
      const newSettings = {
        ...oldSettings,
        ...recordingSettings
      };

      // Validate recording type based on meeting type
      if (newSettings.enabled) {
        newSettings.type = this.getValidRecordingType(appointment.meetingType, newSettings.type);
        
        if (newSettings.type !== recordingSettings.type) {
          changes.push(`Recording type adjusted to ${newSettings.type} for ${appointment.meetingType} meeting`);
        }
      }

      appointment.meetingConfig.recordingSettings = newSettings;
      appointment.updatedBy = updatedBy;

      const savedAppointment = await this.appointmentRepository.save(appointment);

      changes.push('Recording settings updated');
      this.logger.log(`Recording settings updated for appointment ${appointmentId}`);

      return {
        success: true,
        appointment: savedAppointment,
        changes
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to update recording settings: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get meeting configuration recommendations based on meeting type
   */
  getRecommendedConfiguration(
    meetingType: MeetingType,
    therapistPreferences?: any
  ): Partial<MeetingConfig> {
    const baseConfig: Partial<MeetingConfig> = {
      type: meetingType,
      waitingRoomEnabled: true,
      allowClientToJoinEarly: false,
      meetingDuration: 60
    };

    switch (meetingType) {
      case 'online':
        return {
          ...baseConfig,
          googleMeetEnabled: true,
          recordingSettings: {
            enabled: therapistPreferences?.enableRecordingByDefault || false,
            type: 'full-session',
            quality: 'high',
            autoStart: therapistPreferences?.autoStartRecording || false,
            includeTranscription: true,
            retentionDays: 90,
            shareWithClient: therapistPreferences?.shareRecordingsWithClient || false
          }
        };

      case 'in-person':
        return {
          ...baseConfig,
          googleMeetEnabled: false,
          recordingSettings: {
            enabled: therapistPreferences?.enableRecordingByDefault || false,
            type: 'audio-only',
            quality: 'medium',
            autoStart: false,
            includeTranscription: true,
            retentionDays: 90,
            shareWithClient: therapistPreferences?.shareRecordingsWithClient || false
          }
        };

      case 'hybrid':
        return {
          ...baseConfig,
          googleMeetEnabled: true,
          recordingSettings: {
            enabled: therapistPreferences?.enableRecordingByDefault || false,
            type: 'video',
            quality: 'high',
            autoStart: false,
            includeTranscription: true,
            retentionDays: 90,
            shareWithClient: therapistPreferences?.shareRecordingsWithClient || false
          }
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Validate if a meeting type change is allowed
   */
  async validateMeetingTypeChange(
    appointmentId: string,
    newMeetingType: MeetingType
  ): Promise<{ valid: boolean; reasons: string[] }> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return { valid: false, reasons: ['Appointment not found'] };
    }

    const reasons: string[] = [];

    // Check if appointment can be modified
    if (!appointment.canBeModified()) {
      reasons.push('Appointment cannot be modified in its current state');
    }

    // Check timing constraints
    const now = new Date();
    const timeUntilAppointment = appointment.startTime.getTime() - now.getTime();
    const hoursUntilAppointment = timeUntilAppointment / (1000 * 60 * 60);

    if (hoursUntilAppointment < 2 && appointment.meetingType !== newMeetingType) {
      reasons.push('Meeting type cannot be changed less than 2 hours before the appointment');
    }

    // Check if client allows this type of meeting
    if (appointment.clientPreferences?.requireConfirmation && newMeetingType === 'online') {
      reasons.push('Client confirmation required for online meetings');
    }

    return {
      valid: reasons.length === 0,
      reasons
    };
  }

  // Private helper methods

  private async buildMeetingConfig(
    meetingType: MeetingType,
    request: MeetingCreationRequest,
    appointment: Appointment
  ): Promise<MeetingConfig> {
    const recommended = this.getRecommendedConfiguration(meetingType, request.therapistPreferences);
    
    return {
      type: meetingType,
      location: request.location,
      googleMeetEnabled: request.googleMeetEnabled ?? recommended.googleMeetEnabled ?? false,
      waitingRoomEnabled: true,
      recordingSettings: {
        ...recommended.recordingSettings!,
        ...request.recordingSettings
      },
      allowClientToJoinEarly: false,
      meetingDuration: request.meetingDuration || appointment.duration
    };
  }

  private async convertToOnlineMeeting(
    appointment: Appointment,
    updateRequest: MeetingUpdateRequest,
    changes: string[],
    warnings: string[]
  ): Promise<void> {
    appointment.meetingType = 'online';
    appointment.meetingConfig.type = 'online';
    appointment.meetingConfig.location = undefined;
    
    // Enable Google Meet if requested or by default
    if (updateRequest.googleMeetEnabled !== false) {
      appointment.meetingConfig.googleMeetEnabled = true;
      
      // Generate new meet link if requested or if none exists
      if (updateRequest.generateNewMeetLink || !appointment.meetingConfig.meetingUrl) {
        const meetResult = await this.generateGoogleMeetLink(appointment);
        if (meetResult.success) {
          appointment.meetingConfig.meetingUrl = meetResult.meetingUrl;
          changes.push('Google Meet link generated');
        } else {
          warnings.push(`Failed to generate Google Meet link: ${meetResult.error}`);
        }
      }
    }

    // Update recording settings for online meetings
    if (appointment.meetingConfig.recordingSettings.enabled) {
      appointment.meetingConfig.recordingSettings.type = 'full-session';
      changes.push('Recording type changed to full-session for online meeting');
    }
  }

  private async convertToInPersonMeeting(
    appointment: Appointment,
    updateRequest: MeetingUpdateRequest,
    changes: string[],
    _warnings: string[]
  ): Promise<void> {
    appointment.meetingType = 'in-person';
    appointment.meetingConfig.type = 'in-person';
    appointment.meetingConfig.googleMeetEnabled = false;
    appointment.meetingConfig.meetingUrl = undefined;
    
    if (updateRequest.location) {
      appointment.meetingConfig.location = updateRequest.location;
      changes.push('Meeting location set');
    }

    // Update recording settings for in-person meetings
    if (appointment.meetingConfig.recordingSettings.enabled) {
      const currentType = appointment.meetingConfig.recordingSettings.type;
      if (currentType === 'full-session' || currentType === 'screen-share') {
        appointment.meetingConfig.recordingSettings.type = 'audio-only';
        changes.push('Recording type changed to audio-only for in-person meeting');
      }
    }
  }

  private updateRecordingConfiguration(
    appointment: Appointment,
    recordingSettings: Partial<RecordingSettings>,
    meetingType: MeetingType,
    changes: string[]
  ): void {
    const currentSettings = appointment.meetingConfig.recordingSettings;
    const newSettings = { ...currentSettings, ...recordingSettings };

    // Validate and adjust recording type based on meeting type
    if (newSettings.enabled && newSettings.type) {
      const validType = this.getValidRecordingType(meetingType, newSettings.type);
      if (validType !== newSettings.type) {
        newSettings.type = validType;
        changes.push(`Recording type adjusted to ${validType} for ${meetingType} meeting`);
      }
    }

    appointment.meetingConfig.recordingSettings = newSettings;
    changes.push('Recording configuration updated');
  }

  private getValidRecordingType(meetingType: MeetingType, preferredType: RecordingType): RecordingType {
    switch (meetingType) {
      case 'online':
        // Online meetings support all recording types
        return preferredType === 'none' ? 'none' : preferredType;
      
      case 'in-person':
        // In-person meetings primarily support audio and video (no screen-share)
        if (preferredType === 'screen-share' || preferredType === 'full-session') {
          return 'audio-only';
        }
        return preferredType;
      
      case 'hybrid':
        // Hybrid meetings support all types but default to video
        return preferredType === 'none' ? 'none' : preferredType;
      
      default:
        return 'none';
    }
  }

  private async generateGoogleMeetLink(appointment: Appointment): Promise<GoogleMeetResponse> {
    try {
      this.logger.log(`Generating Google Meet link for appointment ${appointment.id}`);

      // Find coach's Google account for calendar integration
      const coachGoogleAccount = await this.findCoachGoogleAccount(appointment.therapistId);
      if (!coachGoogleAccount) {
        return {
          success: false,
          error: 'Coach has not connected their Google account. Please connect Google account to enable automatic Meet link generation.'
        };
      }

      // Prepare calendar event data for Google Calendar API
      const calendarEvent = {
        googleAccountId: coachGoogleAccount.id,
        title: appointment.title || `Coaching Session with ${appointment.clientId}`,
        description: appointment.description || 'Personal development coaching session',
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        isOnlineMeeting: true,
        attendees: [
          {
            email: coachGoogleAccount.email,
            name: 'Coach',  
            responseStatus: 'accepted' as const
          },
          // Add client email if available (would need to fetch from user service)
          // For now, creating without client email - can be added separately
          // TODO: Integrate with user service to get client email
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email' as const, minutes: 60 },
            { method: 'popup' as const, minutes: 15 }
          ]
        }
      };

      // Create calendar event with Google Meet link via Google Integration Service
      const createEventResult = await firstValueFrom(
        this.googleIntegrationClient.send('calendar.create_event', calendarEvent)
      );

      if (!createEventResult.success) {
        return {
          success: false,
          error: createEventResult.error || 'Failed to create calendar event with Google Meet link'
        };
      }

      // Extract the Google Meet link from the created event
      let meetingUrl: string | undefined;
      if (createEventResult.meetingUrl) {
        meetingUrl = createEventResult.meetingUrl;
      } else {
        // Fallback: query the created event to get the meet link
        const eventDetails = await firstValueFrom(
          this.googleIntegrationClient.send('calendar.get_event', {
            googleAccountId: coachGoogleAccount.id,
            googleEventId: createEventResult.googleEventId
          })
        );
        meetingUrl = eventDetails?.meetingUrl;
      }

      if (!meetingUrl) {
        return {
          success: false,
          error: 'Google Meet link was not generated in the calendar event'
        };
      }

      // Update appointment with Google Calendar event ID for future sync
      appointment.googleEventId = createEventResult.googleEventId;
      appointment.googleAccountId = coachGoogleAccount.id;
      appointment.calendarSynced = true;
      appointment.lastCalendarSync = new Date();

      this.logger.log(`Generated Google Meet link for appointment ${appointment.id}: ${meetingUrl}`);

      return {
        success: true,
        meetingUrl,
        meetingId: this.extractMeetingIdFromUrl(meetingUrl)
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to generate Google Meet link: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate Google Meet link'
      };
    }
  }

  /**
   * Find coach's connected Google account
   */
  private async findCoachGoogleAccount(therapistId: string): Promise<{ id: string; email: string } | null> {
    try {
      const result = await firstValueFrom(
        this.googleIntegrationClient.send('google_account.find_by_user', { 
          userId: therapistId,
          active: true,
          calendarSyncEnabled: true
        })
      );
      
      return result?.googleAccount || null;
    } catch (error: unknown) {
      this.logger.error(`Failed to find coach Google account: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Extract meeting ID from Google Meet URL
   */
  private extractMeetingIdFromUrl(meetingUrl: string): string {
    const match = meetingUrl.match(/meet\.google\.com\/([a-z-]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Update Google Calendar event when meeting type changes
   */
  private async updateGoogleCalendarEvent(
    appointment: Appointment,
    changes: string[]
  ): Promise<void> {
    if (!appointment.googleEventId || !appointment.googleAccountId) {
      return; // No calendar event to update
    }

    try {
      const updateData = {
        googleAccountId: appointment.googleAccountId,
        googleEventId: appointment.googleEventId,
        title: appointment.title,
        description: appointment.description,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        location: appointment.meetingConfig.location,
        isOnlineMeeting: appointment.meetingType === 'online',
      };

      const updateResult = await firstValueFrom(
        this.googleIntegrationClient.send('calendar.update_event', updateData)
      );

      if (updateResult.success) {
        appointment.lastCalendarSync = new Date();
        changes.push('Google Calendar event updated');
        this.logger.log(`Updated Google Calendar event ${appointment.googleEventId}`);
      } else {
        changes.push(`Warning: Failed to update Google Calendar event - ${updateResult.error}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Failed to update Google Calendar event: ${error instanceof Error ? error.message : String(error)}`);
      changes.push('Warning: Could not update Google Calendar event');
    }
  }

  /**
   * Send notifications about meeting type change
   */
  private async sendMeetingTypeChangeNotification(
    appointment: Appointment,
    oldMeetingType: MeetingType,
    newMeetingType: MeetingType
  ): Promise<void> {
    try {
      const notificationData = {
        type: 'coaching_session_meeting_type_changed',
        recipientId: appointment.clientId,
        appointmentId: appointment.id,
        data: {
          appointmentTitle: appointment.title,
          startTime: appointment.startTime,
          oldMeetingType,
          newMeetingType,
          meetingUrl: appointment.meetingConfig.meetingUrl,
          location: appointment.meetingConfig.location,
          therapistId: appointment.therapistId
        },
        scheduledFor: new Date(), // Send immediately
        priority: 'high'
      };

      // Send notification via notifications service
      await firstValueFrom(
        this.googleIntegrationClient.send('notification.send', notificationData)
      );

      this.logger.log(`Sent meeting type change notification for appointment ${appointment.id}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to send meeting type change notification: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw error - notification failure shouldn't break the meeting type change
    }
  }
}