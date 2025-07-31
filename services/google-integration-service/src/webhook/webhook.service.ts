/**
 * WebhookService - Handle Google API webhook notifications
 * Processes real-time notifications from Google Calendar and Gmail APIs
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleAccount } from '../entities/google-account.entity';
import { CalendarSyncLog } from '../entities/calendar-sync-log.entity';
import { GoogleCalendarService } from '../calendar/google-calendar.service';
import { GoogleOAuthService } from '../auth/google-oauth.service';

export interface GoogleWebhookNotification {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration?: string;
  channelId: string;
}

export interface CalendarWebhookEvent {
  kind: 'calendar#event';
  etag: string;
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  created: string;
  updated: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri?: string;
    }>;
  };
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(GoogleAccount)
    private readonly googleAccountRepository: Repository<GoogleAccount>,
    @InjectRepository(CalendarSyncLog)
    private readonly syncLogRepository: Repository<CalendarSyncLog>,
    private readonly calendarService: GoogleCalendarService,
    private readonly googleOAuthService: GoogleOAuthService
  ) {}

  /**
   * Process Google Calendar webhook notification
   */
  async processCalendarWebhook(
    notification: GoogleWebhookNotification,
    headers: Record<string, string>
  ): Promise<void> {
    try {
      this.logger.log(`Received calendar webhook notification: ${notification.channelId}`);

      // Validate webhook headers
      if (!this.validateWebhookHeaders(headers)) {
        this.logger.warn('Invalid webhook headers, ignoring notification');
        return;
      }

      // Find the Google account associated with this webhook
      const googleAccount = await this.findAccountByChannelId(notification.channelId);
      if (!googleAccount) {
        this.logger.warn(`No Google account found for channel: ${notification.channelId}`);
        return;
      }

      // Check if calendar sync is enabled
      if (!googleAccount.calendarSyncEnabled) {
        this.logger.log(`Calendar sync disabled for account: ${googleAccount.email}`);
        return;
      }

      // Process the calendar change
      await this.processCalendarChange(googleAccount, notification);

      // Update last sync timestamp
      googleAccount.lastCalendarSync = new Date();
      await this.googleAccountRepository.save(googleAccount);

      this.logger.log(`Processed calendar webhook for account: ${googleAccount.email}`);

    } catch (error) {
      this.logger.error(`Failed to process calendar webhook: ${error instanceof Error ? error.message : String(error)}`);
      
      // Log the failed webhook processing
      await this.logWebhookError(notification, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Process Gmail webhook notification
   */
  async processGmailWebhook(
    notification: GoogleWebhookNotification,
    headers: Record<string, string>
  ): Promise<void> {
    try {
      this.logger.log(`Received Gmail webhook notification: ${notification.channelId}`);

      // Validate webhook headers
      if (!this.validateWebhookHeaders(headers)) {
        this.logger.warn('Invalid webhook headers, ignoring notification');
        return;
      }

      // Find the Google account associated with this webhook
      const googleAccount = await this.findAccountByChannelId(notification.channelId);
      if (!googleAccount) {
        this.logger.warn(`No Google account found for channel: ${notification.channelId}`);
        return;
      }

      // Check if Gmail sync is enabled
      if (!googleAccount.gmailSyncEnabled) {
        this.logger.log(`Gmail sync disabled for account: ${googleAccount.email}`);
        return;
      }

      // Update last sync timestamp
      googleAccount.lastGmailSync = new Date();
      await this.googleAccountRepository.save(googleAccount);

      this.logger.log(`Processed Gmail webhook for account: ${googleAccount.email}`);

    } catch (error) {
      this.logger.error(`Failed to process Gmail webhook: ${error instanceof Error ? error.message : String(error)}`);
      
      // Log the failed webhook processing
      await this.logWebhookError(notification, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Set up Google Calendar webhook subscription
   */
  async setupCalendarWebhook(googleAccountId: string): Promise<{
    success: boolean;
    channelId?: string;
    resourceId?: string;
    expiration?: Date;
    error?: string;
  }> {
    try {
      const googleAccount = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!googleAccount?.calendarSyncEnabled) {
        return { success: false, error: 'Calendar sync not enabled' };
      }

      const auth = await this.googleOAuthService.getAuthenticatedClient(googleAccountId);
      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      const channelId = `calendar_${googleAccountId}_${Date.now()}`;
      const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/v1/webhook/calendar`;

      const response = await calendar.events.watch({
        calendarId: googleAccount.calendarId || 'primary',
        resource: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          token: googleAccountId, // Use account ID as token for verification
        },
      });

      const watchResponse = response.data;
      const expiration = watchResponse.expiration ? new Date(parseInt(watchResponse.expiration)) : undefined;

      this.logger.log(`Set up calendar webhook for account ${googleAccount.email}: ${channelId}`);

      return {
        success: true,
        channelId,
        resourceId: watchResponse.resourceId,
        expiration,
      };

    } catch (error) {
      this.logger.error(`Failed to setup calendar webhook: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Stop Google Calendar webhook subscription
   */
  async stopCalendarWebhook(channelId: string, resourceId: string): Promise<boolean> {
    try {
      // Find the account associated with this webhook
      const googleAccount = await this.findAccountByChannelId(channelId);
      if (!googleAccount) {
        this.logger.warn(`No Google account found for channel: ${channelId}`);
        return false;
      }

      const auth = await this.googleOAuthService.getAuthenticatedClient(googleAccount.id);
      const { google } = require('googleapis');
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.channels.stop({
        resource: {
          id: channelId,
          resourceId,
        },
      });

      this.logger.log(`Stopped calendar webhook: ${channelId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to stop calendar webhook: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Validate webhook headers for security
   */
  private validateWebhookHeaders(headers: Record<string, string>): boolean {
    // Check for required Google webhook headers
    const channelId = headers['x-goog-channel-id'];
    const resourceId = headers['x-goog-resource-id'];
    const resourceState = headers['x-goog-resource-state'];

    if (!channelId || !resourceId || !resourceState) {
      this.logger.warn('Missing required webhook headers');
      return false;
    }

    // Only process 'exists' state changes (new/updated events)
    if (resourceState !== 'exists') {
      this.logger.log(`Ignoring webhook with state: ${resourceState}`);
      return false;
    }

    return true;
  }

  /**
   * Find Google account by webhook channel ID
   */
  private async findAccountByChannelId(channelId: string): Promise<GoogleAccount | null> {
    // Extract account ID from channel ID (format: calendar_accountId_timestamp)
    const parts = channelId.split('_');
    if (parts.length < 2) {
      return null;
    }

    const accountId = parts[1];
    return await this.googleAccountRepository.findOne({ where: { id: accountId } });
  }

  /**
   * Process calendar change notification
   */
  private async processCalendarChange(
    googleAccount: GoogleAccount,
    notification: GoogleWebhookNotification
  ): Promise<void> {
    try {
      // Get recent events from Google Calendar to identify changes
      const now = new Date();
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Next 30 days

      const events = await this.calendarService.getCalendarEvents(
        googleAccount.id,
        startDate,
        endDate
      );

      // Log the sync activity
      await this.syncLogRepository.save({
        googleAccountId: googleAccount.id,
        syncDirection: 'from_google',
        syncResult: 'success',
        syncType: 'webhook_notification',
        eventTitle: `Webhook notification processed`,
        syncedAt: new Date(),
        syncMetadata: {
          channelId: notification.channelId,
          resourceId: notification.resourceId,
          eventsFound: events.length,
        },
      });

      this.logger.log(`Processed ${events.length} calendar events from webhook notification`);

    } catch (error) {
      // Log the failed sync
      await this.syncLogRepository.save({
        googleAccountId: googleAccount.id,
        syncDirection: 'from_google',
        syncResult: 'failed',
        syncType: 'webhook_notification',
        errorMessage: error instanceof Error ? error.message : String(error),
        syncedAt: new Date(),
        syncMetadata: {
          channelId: notification.channelId,
          resourceId: notification.resourceId,
        },
      });

      throw error;
    }
  }

  /**
   * Log webhook processing errors
   */
  private async logWebhookError(
    notification: GoogleWebhookNotification,
    errorMessage: string
  ): Promise<void> {
    try {
      await this.syncLogRepository.save({
        googleAccountId: 'unknown',
        syncDirection: 'from_google',
        syncResult: 'failed',
        syncType: 'webhook_error',
        errorMessage,
        syncedAt: new Date(),
        syncMetadata: {
          channelId: notification.channelId,
          resourceId: notification.resourceId,
          resourceUri: notification.resourceUri,
        },
      });
    } catch (logError) {
      this.logger.error(`Failed to log webhook error: ${logError instanceof Error ? logError.message : String(logError)}`);
    }
  }

  /**
   * Cleanup expired webhook subscriptions
   */
  async cleanupExpiredWebhooks(): Promise<number> {
    let cleanedCount = 0;

    try {
      // This would typically involve querying a webhooks table
      // For now, we'll just log that cleanup should be implemented
      this.logger.log('Webhook cleanup should be implemented with a dedicated webhooks table');

      // TODO: Implement proper webhook subscription tracking
      // - Create a webhook_subscriptions table
      // - Track channel IDs, resource IDs, and expiration times
      // - Automatically renew expiring webhooks
      // - Clean up expired/failed webhooks

    } catch (error) {
      this.logger.error(`Failed to cleanup expired webhooks: ${error instanceof Error ? error.message : String(error)}`);
    }

    return cleanedCount;
  }
}