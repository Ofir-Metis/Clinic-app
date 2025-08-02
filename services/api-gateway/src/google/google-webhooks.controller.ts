/**
 * GoogleWebhooksController - Handles incoming Google Calendar webhooks
 * Processes real-time calendar changes and syncs with appointment system
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { GoogleCalendarService, WebhookNotification, CalendarSyncResult } from './google-calendar.service';
import { JwtAuthGuard, RequireRoles } from '@clinic/common';

@Controller('api/webhooks/google-calendar')
export class GoogleWebhooksController {
  private readonly logger = new Logger(GoogleWebhooksController.name);

  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  /**
   * Handle Google Calendar webhook notifications
   * This endpoint receives real-time updates when calendar events change
   */
  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    try {
      this.logger.log('📨 Received Google Calendar webhook notification');
      
      // Log webhook headers for debugging
      this.logger.debug('Webhook headers:', {
        'x-goog-channel-id': headers['x-goog-channel-id'],
        'x-goog-channel-token': headers['x-goog-channel-token'],
        'x-goog-channel-expiration': headers['x-goog-channel-expiration'],
        'x-goog-resource-id': headers['x-goog-resource-id'],
        'x-goog-resource-uri': headers['x-goog-resource-uri'],
        'x-goog-resource-state': headers['x-goog-resource-state'],
        'x-goog-message-number': headers['x-goog-message-number'],
      });

      // Google Calendar webhooks often have empty body, data is in headers
      const notification: WebhookNotification = {
        kind: 'api#channel',
        id: headers['x-goog-channel-id'] || '',
        resourceId: headers['x-goog-resource-id'] || '',
        resourceUri: headers['x-goog-resource-uri'] || '',
        token: headers['x-goog-channel-token'],
        expiration: headers['x-goog-channel-expiration'] || '',
      };

      // Skip sync notifications (initial setup)
      const resourceState = headers['x-goog-resource-state'];
      if (resourceState === 'sync') {
        this.logger.log('📡 Received sync notification - webhook channel established');
        return { status: 'ok', message: 'Sync notification received' };
      }

      // Process the notification
      const result = await this.googleCalendarService.processWebhookNotification(
        notification,
        headers
      );

      if (!result.success) {
        this.logger.error('❌ Webhook processing failed:', result.errors);
        throw new HttpException(
          `Webhook processing failed: ${result.errors.join(', ')}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log(`✅ Webhook processed successfully: ${result.appointmentsCreated} created, ${result.appointmentsUpdated} updated`);
      
      return {
        status: 'success',
        eventsProcessed: result.eventsProcessed,
        appointmentsCreated: result.appointmentsCreated,
        appointmentsUpdated: result.appointmentsUpdated,
      };
    } catch (error) {
      this.logger.error('❌ Webhook handling failed:', error);
      throw new HttpException(
        `Webhook handling failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Setup webhook for a calendar (authenticated endpoint)
   */
  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async setupWebhook(
    @Body() setupData: {
      accessToken: string;
      calendarId?: string;
      channelId?: string;
    }
  ) {
    try {
      this.logger.log(`🔧 Setting up webhook for calendar ${setupData.calendarId || 'primary'}`);

      const webhookInfo = await this.googleCalendarService.setupCalendarWebhook(
        setupData.accessToken,
        setupData.calendarId,
        setupData.channelId
      );

      return {
        status: 'success',
        message: 'Webhook setup completed',
        webhook: {
          channelId: webhookInfo.id,
          resourceId: webhookInfo.resourceId,
          expiration: new Date(parseInt(webhookInfo.expiration)),
        },
      };
    } catch (error) {
      this.logger.error('❌ Webhook setup failed:', error);
      throw new HttpException(
        `Webhook setup failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Stop webhook subscription (authenticated endpoint)
   */
  @Post('stop')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async stopWebhook(
    @Body() stopData: {
      accessToken: string;
      channelId: string;
      resourceId: string;
    }
  ) {
    try {
      this.logger.log(`🛑 Stopping webhook for channel ${stopData.channelId}`);

      await this.googleCalendarService.stopCalendarWebhook(
        stopData.accessToken,
        stopData.channelId,
        stopData.resourceId
      );

      return {
        status: 'success',
        message: 'Webhook stopped successfully',
      };
    } catch (error) {
      this.logger.error('❌ Stop webhook failed:', error);
      throw new HttpException(
        `Stop webhook failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Manual sync calendar events (authenticated endpoint)
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async syncCalendar(
    @Body() syncData: {
      accessToken: string;
      calendarId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<CalendarSyncResult> {
    try {
      const calendarId = syncData.calendarId || 'primary';
      
      // Default to sync next 30 days
      const startDate = syncData.startDate ? new Date(syncData.startDate) : new Date();
      const endDate = syncData.endDate ? new Date(syncData.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      this.logger.log(`🔄 Manual sync requested for calendar ${calendarId}`);

      const result = await this.googleCalendarService.syncCalendarEvents(
        syncData.accessToken,
        calendarId,
        { start: startDate, end: endDate }
      );

      return result;
    } catch (error) {
      this.logger.error('❌ Manual sync failed:', error);
      throw new HttpException(
        `Manual sync failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get calendar events (authenticated endpoint)
   */
  @Get('events')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async getEvents(
    @Query('accessToken') accessToken: string,
    @Query('calendarId') calendarId?: string,
    @Query('timeMin') timeMin?: string,
    @Query('timeMax') timeMax?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    try {
      if (!accessToken) {
        throw new HttpException('Access token is required', HttpStatus.BAD_REQUEST);
      }

      const events = await this.googleCalendarService.getCalendarEvents(
        accessToken,
        calendarId || 'primary',
        timeMin ? new Date(timeMin) : undefined,
        timeMax ? new Date(timeMax) : undefined,
        maxResults ? parseInt(maxResults) : 50
      );

      return {
        status: 'success',
        events: events.map(event => ({
          id: event.id,
          title: event.summary,
          description: event.description,
          start: {
            dateTime: event.start.dateTime,
            timeZone: event.start.timeZone,
          },
          end: {
            dateTime: event.end.dateTime,
            timeZone: event.end.timeZone,
          },
          location: event.location,
          status: event.status,
          attendees: event.attendees,
          conferenceData: event.conferenceData,
          created: event.created,
          updated: event.updated,
        })),
      };
    } catch (error) {
      this.logger.error('❌ Get events failed:', error);
      throw new HttpException(
        `Get events failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health check endpoint to verify webhook is accessible
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      message: 'Google Calendar webhook endpoint is healthy',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Webhook verification challenge (used by Google during setup)
   */
  @Get()
  async verifyWebhook(@Query('hub.challenge') challenge?: string) {
    if (challenge) {
      this.logger.log('📋 Webhook verification challenge received');
      return challenge;
    }

    return {
      status: 'ok',
      message: 'Google Calendar webhook endpoint',
    };
  }
}