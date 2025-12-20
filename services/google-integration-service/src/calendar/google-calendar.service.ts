/**
 * GoogleCalendarService - Handle Google Calendar API operations
 * Manages calendar events, sync, and Google Meet integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google, calendar_v3 } from 'googleapis';
import { CalendarSyncLog } from '../entities/calendar-sync-log.entity';
import { GoogleOAuthService } from '../auth/google-oauth.service';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  meetingUrl?: string;
  isOnlineMeeting?: boolean;
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface SyncResult {
  success: boolean;
  eventId?: string;
  googleEventId?: string;
  action: 'created' | 'updated' | 'deleted' | 'skipped';
  error?: string;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    @InjectRepository(CalendarSyncLog)
    private readonly syncLogRepository: Repository<CalendarSyncLog>,
    private readonly googleOAuthService: GoogleOAuthService
  ) {}

  /**
   * Create an event in Google Calendar
   */
  async createEvent(googleAccountId: string, event: CalendarEvent): Promise<SyncResult> {
    try {
      const auth = await this.googleOAuthService.getAuthenticatedClient(googleAccountId);
      const calendar = google.calendar({ version: 'v3', auth });
      
      const googleAccount = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!googleAccount?.calendarSyncEnabled) {
        return { success: false, action: 'skipped', error: 'Calendar sync disabled' };
      }

      // Prepare Google Calendar event
      const googleEvent: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name,
          responseStatus: attendee.responseStatus || 'needsAction',
        })),
        location: event.location,
        reminders: event.reminders || {
          useDefault: true,
        },
      };

      // Add Google Meet if requested
      if (event.isOnlineMeeting) {
        googleEvent.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        };
      }

      // Create event in Google Calendar
      const response = await calendar.events.insert({
        calendarId: googleAccount.calendarId || 'primary',
        requestBody: googleEvent,
        conferenceDataVersion: event.isOnlineMeeting ? 1 : 0,
        sendUpdates: 'all', // Send invitations to attendees
      });

      const createdEvent = response.data;
      const googleEventId = createdEvent.id ?? undefined;

      // Log sync activity
      await this.logSyncActivity({
        googleAccountId,
        googleEventId,
        syncDirection: 'to_google',
        syncResult: 'success',
        syncType: 'create',
        eventTitle: event.title,
        eventStart: event.startTime,
        eventEnd: event.endTime,
        attendeeCount: event.attendees?.length || 0,
      });

      // Extract Google Meet link if created (not used but kept for future reference)
      // Google Meet links are automatically included in conference data
      if (createdEvent.conferenceData?.entryPoints) {
        const meetEntry = createdEvent.conferenceData.entryPoints.find(
          entry => entry.entryPointType === 'video'
        );
        if (meetEntry?.uri) {
          // meetingUrl would be meetEntry.uri
        }
      }

      this.logger.log(`Created Google Calendar event: ${googleEventId} for account ${googleAccount.email}`);

      return {
        success: true,
        googleEventId,
        action: 'created',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create Google Calendar event: ${errorMessage}`);

      // Log failed sync
      await this.logSyncActivity({
        googleAccountId,
        syncDirection: 'to_google',
        syncResult: 'failed',
        syncType: 'create',
        eventTitle: event.title,
        eventStart: event.startTime,
        eventEnd: event.endTime,
        errorMessage,
      });

      return {
        success: false,
        action: 'skipped',
        error: errorMessage,
      };
    }
  }

  /**
   * Update an existing Google Calendar event
   */
  async updateEvent(
    googleAccountId: string,
    googleEventId: string,
    updatedEvent: Partial<CalendarEvent>
  ): Promise<SyncResult> {
    try {
      const auth = await this.googleOAuthService.getAuthenticatedClient(googleAccountId);
      const calendar = google.calendar({ version: 'v3', auth });
      
      const googleAccount = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!googleAccount?.calendarSyncEnabled) {
        return { success: false, action: 'skipped', error: 'Calendar sync disabled' };
      }

      // Get existing event
      const existingResponse = await calendar.events.get({
        calendarId: googleAccount.calendarId || 'primary',
        eventId: googleEventId,
      });

      const existingEvent = existingResponse.data;

      // Prepare updated event data
      const updatedGoogleEvent: calendar_v3.Schema$Event = {
        ...existingEvent,
      };

      if (updatedEvent.title !== undefined) {
        updatedGoogleEvent.summary = updatedEvent.title;
      }
      if (updatedEvent.description !== undefined) {
        updatedGoogleEvent.description = updatedEvent.description;
      }
      if (updatedEvent.startTime) {
        updatedGoogleEvent.start = {
          dateTime: updatedEvent.startTime.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updatedEvent.endTime) {
        updatedGoogleEvent.end = {
          dateTime: updatedEvent.endTime.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updatedEvent.location !== undefined) {
        updatedGoogleEvent.location = updatedEvent.location;
      }
      if (updatedEvent.attendees) {
        updatedGoogleEvent.attendees = updatedEvent.attendees.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name,
          responseStatus: attendee.responseStatus || 'needsAction',
        }));
      }

      // Update event in Google Calendar
      await calendar.events.update({
        calendarId: googleAccount.calendarId || 'primary',
        eventId: googleEventId,
        requestBody: updatedGoogleEvent,
        sendUpdates: 'all',
      });

      // Log sync activity
      await this.logSyncActivity({
        googleAccountId,
        googleEventId,
        syncDirection: 'to_google',
        syncResult: 'success',
        syncType: 'update',
        eventTitle: updatedEvent.title || existingEvent.summary || 'Untitled',
        eventStart: updatedEvent.startTime || new Date(existingEvent.start?.dateTime || Date.now()),
        eventEnd: updatedEvent.endTime || new Date(existingEvent.end?.dateTime || Date.now()),
        attendeeCount: updatedEvent.attendees?.length || existingEvent.attendees?.length || 0,
      });

      this.logger.log(`Updated Google Calendar event: ${googleEventId}`);

      return {
        success: true,
        googleEventId,
        action: 'updated',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update Google Calendar event: ${errorMessage}`);

      await this.logSyncActivity({
        googleAccountId,
        googleEventId,
        syncDirection: 'to_google',
        syncResult: 'failed',
        syncType: 'update',
        errorMessage,
      });

      return {
        success: false,
        action: 'skipped',
        error: errorMessage,
      };
    }
  }

  /**
   * Delete a Google Calendar event
   */
  async deleteEvent(googleAccountId: string, googleEventId: string): Promise<SyncResult> {
    try {
      const auth = await this.googleOAuthService.getAuthenticatedClient(googleAccountId);
      const calendar = google.calendar({ version: 'v3', auth });
      
      const googleAccount = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!googleAccount?.calendarSyncEnabled) {
        return { success: false, action: 'skipped', error: 'Calendar sync disabled' };
      }

      // Delete event from Google Calendar
      await calendar.events.delete({
        calendarId: googleAccount.calendarId || 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
      });

      // Log sync activity
      await this.logSyncActivity({
        googleAccountId,
        googleEventId,
        syncDirection: 'to_google',
        syncResult: 'success',
        syncType: 'delete',
      });

      this.logger.log(`Deleted Google Calendar event: ${googleEventId}`);

      return {
        success: true,
        googleEventId,
        action: 'deleted',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete Google Calendar event: ${errorMessage}`);

      await this.logSyncActivity({
        googleAccountId,
        googleEventId,
        syncDirection: 'to_google',
        syncResult: 'failed',
        syncType: 'delete',
        errorMessage,
      });

      return {
        success: false,
        action: 'skipped',
        error: errorMessage,
      };
    }
  }

  /**
   * Get events from Google Calendar (for importing external events)
   */
  async getCalendarEvents(
    googleAccountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const auth = await this.googleOAuthService.getAuthenticatedClient(googleAccountId);
      const calendar = google.calendar({ version: 'v3', auth });
      
      const googleAccount = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!googleAccount?.calendarSyncEnabled) {
        return [];
      }

      const response = await calendar.events.list({
        calendarId: googleAccount.calendarId || 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      return events.map(event => ({
        id: event.id ?? undefined,
        title: event.summary || 'Untitled Event',
        description: event.description ?? undefined,
        startTime: new Date(event.start?.dateTime || event.start?.date || Date.now()),
        endTime: new Date(event.end?.dateTime || event.end?.date || Date.now()),
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email || '',
          name: attendee.displayName ?? undefined,
          responseStatus: attendee.responseStatus as any,
        })) || [],
        location: event.location ?? undefined,
        meetingUrl: event.conferenceData?.entryPoints?.find(
          entry => entry.entryPointType === 'video'
        )?.uri ?? undefined,
        isOnlineMeeting: !!event.conferenceData,
      }));

    } catch (error) {
      this.logger.error(`Failed to get Google Calendar events: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Check for calendar conflicts
   */
  async checkForConflicts(
    googleAccountId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<CalendarEvent[]> {
    const events = await this.getCalendarEvents(googleAccountId, startTime, endTime);
    
    return events.filter(event => {
      if (excludeEventId && event.id === excludeEventId) {
        return false;
      }
      
      // Check for time overlap
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (startTime >= eventStart && startTime < eventEnd) ||
        (endTime > eventStart && endTime <= eventEnd) ||
        (startTime <= eventStart && endTime >= eventEnd)
      );
    });
  }

  /**
   * Get sync logs for a Google account
   */
  async getSyncLogs(
    googleAccountId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: CalendarSyncLog[]; total: number }> {
    const [logs, total] = await this.syncLogRepository.findAndCount({
      where: { googleAccountId },
      order: { syncedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { logs, total };
  }

  /**
   * Log sync activity
   */
  private async logSyncActivity(data: {
    googleAccountId: string;
    appointmentId?: string;
    googleEventId?: string;
    syncDirection: 'to_google' | 'from_google';
    syncResult: 'success' | 'failed' | 'conflict' | 'skipped';
    syncType: string;
    eventTitle?: string;
    eventStart?: Date;
    eventEnd?: Date;
    attendeeCount?: number;
    conflictReason?: string;
    errorMessage?: string;
    errorCode?: string;
    syncMetadata?: Record<string, any>;
  }): Promise<CalendarSyncLog> {
    const syncLog = this.syncLogRepository.create({
      googleAccountId: data.googleAccountId,
      appointmentId: data.appointmentId,
      googleEventId: data.googleEventId,
      syncDirection: data.syncDirection,
      syncResult: data.syncResult,
      syncType: data.syncType,
      eventTitle: data.eventTitle,
      eventStart: data.eventStart,
      eventEnd: data.eventEnd,
      attendeeCount: data.attendeeCount,
      conflictReason: data.conflictReason,
      errorMessage: data.errorMessage,
      errorCode: data.errorCode,
      syncMetadata: data.syncMetadata,
    });

    return await this.syncLogRepository.save(syncLog);
  }

  /**
   * Retry failed sync operations
   */
  async retryFailedSyncs(googleAccountId: string): Promise<number> {
    const failedSyncs = await this.syncLogRepository.find({
      where: {
        googleAccountId,
        syncResult: 'failed',
        retryCount: { $lt: 3 } as any,
      },
      order: { syncedAt: 'ASC' },
      take: 10, // Process 10 at a time
    });

    let retriedCount = 0;

    for (const syncLog of failedSyncs) {
      try {
        // Update retry count
        syncLog.retryCount += 1;
        syncLog.nextRetryAt = new Date(Date.now() + Math.pow(2, syncLog.retryCount) * 60000); // Exponential backoff

        await this.syncLogRepository.save(syncLog);
        retriedCount++;

        this.logger.log(`Retrying sync operation ${syncLog.id} (attempt ${syncLog.retryCount})`);

      } catch (error) {
        this.logger.error(`Failed to retry sync ${syncLog.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return retriedCount;
  }
}