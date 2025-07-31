/**
 * GoogleCalendarController - Handle calendar API requests from other services
 * Provides NATS microservice endpoints for calendar operations
 */

import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GoogleCalendarService, CalendarEvent, SyncResult } from './google-calendar.service';
import { GoogleOAuthService } from '../auth/google-oauth.service';

interface CreateEventRequest {
  googleAccountId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isOnlineMeeting?: boolean;
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

interface UpdateEventRequest {
  googleAccountId: string;
  googleEventId: string;
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  isOnlineMeeting?: boolean;
}

interface GetEventRequest {
  googleAccountId: string;
  googleEventId: string;
}

interface FindAccountRequest {
  userId: string;
  active?: boolean;
  calendarSyncEnabled?: boolean;
}

@Controller()
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);

  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly googleOAuthService: GoogleOAuthService
  ) {}

  /**
   * Create a calendar event with optional Google Meet link
   */
  @MessagePattern('calendar.create_event')
  async createEvent(@Payload() request: CreateEventRequest): Promise<{
    success: boolean;
    googleEventId?: string;
    meetingUrl?: string;
    error?: string;
  }> {
    try {
      this.logger.log(`Creating calendar event for account ${request.googleAccountId}`);

      const calendarEvent: CalendarEvent = {
        title: request.title,
        description: request.description,
        startTime: new Date(request.startTime),
        endTime: new Date(request.endTime),
        isOnlineMeeting: request.isOnlineMeeting || false,
        attendees: request.attendees,
        location: request.location,
        reminders: request.reminders
      };

      const result = await this.googleCalendarService.createEvent(
        request.googleAccountId,
        calendarEvent
      );

      if (result.success) {
        // Get the created event to extract meeting URL
        const events = await this.googleCalendarService.getCalendarEvents(
          request.googleAccountId,
          calendarEvent.startTime,
          calendarEvent.endTime
        );

        const createdEvent = events.find(event => event.id === result.googleEventId);
        
        return {
          success: true,
          googleEventId: result.googleEventId,
          meetingUrl: createdEvent?.meetingUrl,
        };
      }

      return {
        success: false,
        error: result.error
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create calendar event: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Update an existing calendar event
   */
  @MessagePattern('calendar.update_event')
  async updateEvent(@Payload() request: UpdateEventRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      this.logger.log(`Updating calendar event ${request.googleEventId}`);

      const updateData: Partial<CalendarEvent> = {};
      
      if (request.title !== undefined) updateData.title = request.title;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.startTime) updateData.startTime = new Date(request.startTime);
      if (request.endTime) updateData.endTime = new Date(request.endTime);
      if (request.location !== undefined) updateData.location = request.location;
      if (request.isOnlineMeeting !== undefined) updateData.isOnlineMeeting = request.isOnlineMeeting;

      const result = await this.googleCalendarService.updateEvent(
        request.googleAccountId,
        request.googleEventId,
        updateData
      );

      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update calendar event: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get a specific calendar event
   */
  @MessagePattern('calendar.get_event')
  async getEvent(@Payload() request: GetEventRequest): Promise<{
    success: boolean;
    event?: CalendarEvent;
    meetingUrl?: string;
    error?: string;
  }> {
    try {
      this.logger.log(`Getting calendar event ${request.googleEventId}`);

      // Get events in a reasonable time range around now
      const now = new Date();
      const startRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endRange = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);   // 30 days from now

      const events = await this.googleCalendarService.getCalendarEvents(
        request.googleAccountId,
        startRange,
        endRange
      );

      const event = events.find(e => e.id === request.googleEventId);

      if (event) {
        return {
          success: true,
          event,
          meetingUrl: event.meetingUrl
        };
      }

      return {
        success: false,
        error: 'Event not found'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get calendar event: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Delete a calendar event
   */
  @MessagePattern('calendar.delete_event')
  async deleteEvent(@Payload() request: { googleAccountId: string; googleEventId: string }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      this.logger.log(`Deleting calendar event ${request.googleEventId}`);

      const result = await this.googleCalendarService.deleteEvent(
        request.googleAccountId,
        request.googleEventId
      );

      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete calendar event: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Find Google account by user ID
   */
  @MessagePattern('google_account.find_by_user')
  async findGoogleAccountByUser(@Payload() request: FindAccountRequest): Promise<{
    success: boolean;
    googleAccount?: {
      id: string;
      email: string;
      calendarSyncEnabled: boolean;
    };
    error?: string;
  }> {
    try {
      this.logger.log(`Finding Google account for user ${request.userId}`);

      const accounts = await this.googleOAuthService.getConnectedAccounts(request.userId);
      
      // Filter accounts based on criteria
      const filteredAccounts = accounts.filter(account => {
        if (request.active !== undefined && account.isActive !== request.active) {
          return false;
        }
        if (request.calendarSyncEnabled !== undefined && account.calendarSyncEnabled !== request.calendarSyncEnabled) {
          return false;
        }
        return true;
      });

      if (filteredAccounts.length > 0) {
        const account = filteredAccounts[0]; // Return first matching account
        
        return {
          success: true,
          googleAccount: {
            id: account.id,
            email: account.email,
            calendarSyncEnabled: account.calendarSyncEnabled
          }
        };
      }

      return {
        success: false,
        error: 'No matching Google account found'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to find Google account: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check for calendar conflicts
   */
  @MessagePattern('calendar.check_conflicts')
  async checkConflicts(@Payload() request: {
    googleAccountId: string;
    startTime: Date;
    endTime: Date;
    excludeEventId?: string;
  }): Promise<{
    success: boolean;
    conflicts: CalendarEvent[];
    error?: string;
  }> {
    try {
      this.logger.log(`Checking calendar conflicts for account ${request.googleAccountId}`);

      const conflicts = await this.googleCalendarService.checkForConflicts(
        request.googleAccountId,
        new Date(request.startTime),
        new Date(request.endTime),
        request.excludeEventId
      );

      return {
        success: true,
        conflicts
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to check calendar conflicts: ${errorMessage}`);
      
      return {
        success: false,
        conflicts: [],
        error: errorMessage
      };
    }
  }

  /**
   * Get calendar sync logs
   */
  @MessagePattern('calendar.get_sync_logs')
  async getSyncLogs(@Payload() request: {
    googleAccountId: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    logs: any[];
    total: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Getting sync logs for account ${request.googleAccountId}`);

      const result = await this.googleCalendarService.getSyncLogs(
        request.googleAccountId,
        request.limit,
        request.offset
      );

      return {
        success: true,
        logs: result.logs,
        total: result.total
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get sync logs: ${errorMessage}`);
      
      return {
        success: false,
        logs: [],
        total: 0,
        error: errorMessage
      };
    }
  }
}