/**
 * WebhookController - Handle Google API webhook HTTP endpoints
 * Receives and processes webhook notifications from Google services
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  Res,
  Query,
  Param,
  Logger,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { WebhookService, GoogleWebhookNotification } from './webhook.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Webhooks')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('calendar')
  @ApiOperation({ summary: 'Receive Google Calendar webhook notifications' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook notification' })
  async handleCalendarWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      // Log the incoming webhook
      this.logger.log(`Received calendar webhook from ${req.ip}`);
      this.logger.debug(`Headers: ${JSON.stringify(headers)}`);

      // Extract webhook notification data from headers
      const notification: GoogleWebhookNotification = {
        kind: 'api#channel',
        id: headers['x-goog-channel-id'] || '',
        resourceId: headers['x-goog-resource-id'] || '',
        resourceUri: headers['x-goog-resource-uri'] || '',
        token: headers['x-goog-channel-token'],
        expiration: headers['x-goog-channel-expiration'],
        channelId: headers['x-goog-channel-id'] || '',
      };

      // Validate required headers
      if (!notification.id || !notification.resourceId) {
        this.logger.warn('Missing required webhook headers');
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Missing required webhook headers',
        });
      }

      // Process the webhook notification asynchronously
      this.webhookService.processCalendarWebhook(notification, headers)
        .catch(error => {
          this.logger.error(`Async webhook processing failed: ${error instanceof Error ? error.message : String(error)}`);
        });

      // Respond immediately to Google (required within 10 seconds)
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Webhook received and queued for processing',
      });

    } catch (error) {
      this.logger.error(`Failed to handle calendar webhook: ${error instanceof Error ? error.message : String(error)}`);
      
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to process webhook',
      });
    }
  }

  @Post('gmail')
  @ApiOperation({ summary: 'Receive Gmail webhook notifications' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleGmailWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`Received Gmail webhook from ${req.ip}`);

      // Extract webhook notification data from headers
      const notification: GoogleWebhookNotification = {
        kind: 'api#channel',
        id: headers['x-goog-channel-id'] || '',
        resourceId: headers['x-goog-resource-id'] || '',
        resourceUri: headers['x-goog-resource-uri'] || '',
        token: headers['x-goog-channel-token'],
        expiration: headers['x-goog-channel-expiration'],
        channelId: headers['x-goog-channel-id'] || '',
      };

      // Validate required headers
      if (!notification.id || !notification.resourceId) {
        this.logger.warn('Missing required webhook headers');
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Missing required webhook headers',
        });
      }

      // Process the webhook notification asynchronously
      this.webhookService.processGmailWebhook(notification, headers)
        .catch(error => {
          this.logger.error(`Async Gmail webhook processing failed: ${error instanceof Error ? error.message : String(error)}`);
        });

      // Respond immediately to Google
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Gmail webhook received and queued for processing',
      });

    } catch (error) {
      this.logger.error(`Failed to handle Gmail webhook: ${error instanceof Error ? error.message : String(error)}`);
      
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to process Gmail webhook',
      });
    }
  }

  @Post('setup/calendar')
  @ApiOperation({ summary: 'Set up Google Calendar webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook subscription created' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setupCalendarWebhook(
    @Body() body: { googleAccountId: string },
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Note: In a production environment, you should verify that the account belongs to the user
      const result = await this.webhookService.setupCalendarWebhook(body.googleAccountId);

      if (result.success) {
        this.logger.log(`Set up calendar webhook for account: ${body.googleAccountId}`);
      }

      return {
        success: result.success,
        message: result.success ? 'Calendar webhook subscription created' : 'Failed to create webhook subscription',
        channelId: result.channelId,
        resourceId: result.resourceId,
        expiration: result.expiration,
        error: result.error,
      };

    } catch (error) {
      this.logger.error(`Failed to setup calendar webhook: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup calendar webhook',
      };
    }
  }

  @Post('stop/calendar')
  @ApiOperation({ summary: 'Stop Google Calendar webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook subscription stopped' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async stopCalendarWebhook(
    @Body() body: { channelId: string; resourceId: string },
    @Req() req: AuthenticatedRequest
  ) {
    try {
      const success = await this.webhookService.stopCalendarWebhook(body.channelId, body.resourceId);

      if (success) {
        this.logger.log(`Stopped calendar webhook: ${body.channelId}`);
      }

      return {
        success,
        message: success ? 'Calendar webhook subscription stopped' : 'Failed to stop webhook subscription',
      };

    } catch (error) {
      this.logger.error(`Failed to stop calendar webhook: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop calendar webhook',
      };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get webhook service status' })
  @ApiResponse({ status: 200, description: 'Webhook service status' })
  async getWebhookStatus() {
    try {
      const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3009';

      return {
        success: true,
        status: 'active',
        endpoints: {
          calendar: `${baseUrl}/api/v1/webhook/calendar`,
          gmail: `${baseUrl}/api/v1/webhook/gmail`,
        },
        configuration: {
          webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'Not configured',
          domainVerificationRequired: true,
          ssl: process.env.NODE_ENV === 'production',
        },
        requirements: [
          'WEBHOOK_BASE_URL environment variable must be set',
          'Domain must be verified with Google',
          'HTTPS required in production',
          'Webhook endpoints must respond within 10 seconds',
        ],
      };

    } catch (error) {
      this.logger.error(`Failed to get webhook status: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get webhook status',
      };
    }
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up expired webhook subscriptions' })
  @ApiResponse({ status: 200, description: 'Webhook cleanup completed' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cleanupWebhooks(@Req() req: AuthenticatedRequest) {
    try {
      const cleanedCount = await this.webhookService.cleanupExpiredWebhooks();

      this.logger.log(`Cleaned up ${cleanedCount} expired webhooks`);

      return {
        success: true,
        message: `Cleaned up ${cleanedCount} expired webhook subscriptions`,
        cleanedCount,
      };

    } catch (error) {
      this.logger.error(`Failed to cleanup webhooks: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup webhooks',
      };
    }
  }

  @Get('test')
  @ApiOperation({ summary: 'Test webhook endpoint connectivity' })
  @ApiResponse({ status: 200, description: 'Webhook endpoint test' })
  async testWebhookEndpoint(@Query('type') type: string = 'calendar') {
    try {
      return {
        success: true,
        message: `${type} webhook endpoint is accessible`,
        timestamp: new Date().toISOString(),
        endpoint: `/api/v1/webhook/${type}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Channel-Id': 'test-channel-id',
          'X-Goog-Resource-Id': 'test-resource-id',
          'X-Goog-Resource-State': 'exists',
        },
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook test failed',
      };
    }
  }
}