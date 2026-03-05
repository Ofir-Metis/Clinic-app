/**
 * GoogleAuthController - Handles Google OAuth 2.0 authentication flow
 * Manages user authorization, token exchange, and calendar access setup
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Redirect,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GoogleOAuthService, GoogleTokens } from './google-oauth.service';
import { GoogleCalendarService } from './google-calendar.service';
import { JwtAuthGuard, RequireRoles } from '@clinic/common';

@Controller('api/auth/google')
export class GoogleAuthController {
  private readonly logger = new Logger(GoogleAuthController.name);

  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  /**
   * Initiate Google OAuth flow
   */
  @Get('authorize')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'therapist', 'admin')
  async authorize(@Request() req: any) {
    try {
      const userId = req.user.sub;
      const state = this.googleOAuthService.generateState(userId);
      const authUrl = this.googleOAuthService.getAuthorizationUrl(state);

      this.logger.log(`🔗 Generated OAuth URL for user ${userId}`);

      return {
        status: 'success',
        authUrl,
        message: 'Visit the authorization URL to grant calendar access',
      };
    } catch (error) {
      this.logger.error('❌ Failed to generate authorization URL:', error);
      throw new HttpException(
        `Authorization URL generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle OAuth callback from Google
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    try {
      if (error) {
        this.logger.error(`❌ OAuth error: ${error}`);
        throw new HttpException(
          `OAuth authorization failed: ${error}`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (!code) {
        throw new HttpException(
          'Authorization code is required',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!state) {
        throw new HttpException(
          'State parameter is required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Exchange code for tokens
      const tokens = await this.googleOAuthService.exchangeCodeForTokens(code);
      
      // Get user information
      const userInfo = await this.googleOAuthService.getUserInfo(tokens.access_token);

      // Get user's calendars
      const calendars = await this.googleOAuthService.getCalendarList(tokens.access_token);

      this.logger.log(`✅ OAuth completed for user ${userInfo.email}`);

      // In a real implementation, you'd:
      // 1. Verify the state parameter against the logged-in user
      // 2. Store the tokens securely in your database
      // 3. Associate the Google account with the user
      // 4. Optionally set up webhooks automatically

      return {
        status: 'success',
        message: 'Google Calendar access granted successfully',
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
        },
        calendars: calendars.map(cal => ({
          id: cal.id,
          summary: cal.summary,
          description: cal.description,
          primary: cal.primary,
          accessRole: cal.accessRole,
        })),
        tokenInfo: {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expires_in,
          scope: tokens.scope,
        },
      };
    } catch (error) {
      this.logger.error('❌ OAuth callback failed:', error);
      throw new HttpException(
        `OAuth callback failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'therapist', 'admin')
  async refreshToken(
    @Body() refreshData: { refreshToken: string },
    @Request() req: any,
  ) {
    try {
      if (!refreshData.refreshToken) {
        throw new HttpException(
          'Refresh token is required',
          HttpStatus.BAD_REQUEST
        );
      }

      const tokens = await this.googleOAuthService.refreshAccessToken(
        refreshData.refreshToken
      );

      this.logger.log(`🔄 Refreshed tokens for user ${req.user.sub}`);

      return {
        status: 'success',
        message: 'Tokens refreshed successfully',
        tokenInfo: {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expires_in,
          scope: tokens.scope,
        },
      };
    } catch (error) {
      this.logger.error('❌ Token refresh failed:', error);
      throw new HttpException(
        `Token refresh failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Revoke Google access
   */
  @Post('revoke')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'therapist', 'admin')
  async revokeAccess(
    @Body() revokeData: { accessToken: string },
    @Request() req: any,
  ) {
    try {
      if (!revokeData.accessToken) {
        throw new HttpException(
          'Access token is required',
          HttpStatus.BAD_REQUEST
        );
      }

      await this.googleOAuthService.revokeToken(revokeData.accessToken);

      this.logger.log(`🚫 Revoked Google access for user ${req.user.sub}`);

      return {
        status: 'success',
        message: 'Google Calendar access revoked successfully',
      };
    } catch (error) {
      this.logger.error('❌ Token revocation failed:', error);
      throw new HttpException(
        `Token revocation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Validate current access token
   */
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'therapist', 'admin')
  async validateToken(
    @Body() validateData: { accessToken: string },
    @Request() req: any,
  ) {
    try {
      if (!validateData.accessToken) {
        throw new HttpException(
          'Access token is required',
          HttpStatus.BAD_REQUEST
        );
      }

      const validation = await this.googleOAuthService.validateToken(
        validateData.accessToken
      );

      return {
        status: 'success',
        valid: validation.valid,
        tokenInfo: validation.valid ? {
          expiresIn: validation.expiresIn,
          scope: validation.scope,
          email: validation.email,
          needsRefresh: this.googleOAuthService.needsRefresh(validation.expiresIn || 0),
          hasCalendarAccess: this.googleOAuthService.hasCalendarScope(validation.scope || ''),
        } : null,
      };
    } catch (error) {
      this.logger.error('❌ Token validation failed:', error);
      throw new HttpException(
        `Token validation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Setup calendar integration (OAuth + Webhook)
   */
  @Post('setup-integration')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'therapist', 'admin')
  async setupIntegration(
    @Body() setupData: {
      accessToken: string;
      calendarId?: string;
      enableWebhook?: boolean;
    },
    @Request() req: any,
  ) {
    try {
      if (!setupData.accessToken) {
        throw new HttpException(
          'Access token is required',
          HttpStatus.BAD_REQUEST
        );
      }

      const userId = req.user.sub;
      const calendarId = setupData.calendarId || 'primary';

      // Validate token first
      const validation = await this.googleOAuthService.validateToken(setupData.accessToken);
      if (!validation.valid) {
        throw new HttpException(
          'Invalid or expired access token',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Check calendar permissions
      if (!this.googleOAuthService.hasCalendarScope(validation.scope || '')) {
        throw new HttpException(
          'Calendar access not granted. Please re-authorize with calendar permissions.',
          HttpStatus.FORBIDDEN
        );
      }

      const result: any = {
        status: 'success',
        message: 'Calendar integration setup completed',
        calendarId,
        tokenValid: true,
        calendarAccess: true,
      };

      // Set up webhook if requested
      if (setupData.enableWebhook !== false) {
        try {
          const webhookInfo = await this.googleCalendarService.setupCalendarWebhook(
            setupData.accessToken,
            calendarId,
            `channel_${userId}_${Date.now()}`
          );

          result.webhook = {
            enabled: true,
            channelId: webhookInfo.id,
            resourceId: webhookInfo.resourceId,
            expiration: new Date(parseInt(webhookInfo.expiration)),
          };

          this.logger.log(`🔔 Webhook setup completed for user ${userId}, calendar ${calendarId}`);
        } catch (webhookError) {
          this.logger.warn(`⚠️  Webhook setup failed for user ${userId}:`, webhookError.message);
          result.webhook = {
            enabled: false,
            error: webhookError.message,
          };
        }
      }

      // Perform initial sync
      try {
        const syncResult = await this.googleCalendarService.syncCalendarEvents(
          setupData.accessToken,
          calendarId,
          {
            start: new Date(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          }
        );

        result.initialSync = {
          success: syncResult.success,
          eventsProcessed: syncResult.eventsProcessed,
          appointmentsCreated: syncResult.appointmentsCreated,
          appointmentsUpdated: syncResult.appointmentsUpdated,
        };

        this.logger.log(`📅 Initial sync completed for user ${userId}: ${syncResult.appointmentsCreated} created, ${syncResult.appointmentsUpdated} updated`);
      } catch (syncError) {
        this.logger.warn(`⚠️  Initial sync failed for user ${userId}:`, syncError.message);
        result.initialSync = {
          success: false,
          error: syncError.message,
        };
      }

      return result;
    } catch (error) {
      this.logger.error('❌ Integration setup failed:', error);
      throw new HttpException(
        `Integration setup failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get integration status
   */
  @Get('integration-status')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'therapist', 'admin')
  async getIntegrationStatus(@Request() req: any) {
    try {
      const userId = req.user.sub;

      // In a real implementation, you'd:
      // 1. Check if user has valid Google tokens stored
      // 2. Check webhook status
      // 3. Get last sync information
      // 4. Return comprehensive status

      // Mock status for now
      const mockStatus = {
        connected: false,
        user: null,
        calendars: [],
        webhook: {
          enabled: false,
          channelId: null,
          expiration: null,
        },
        lastSync: null,
        tokenStatus: {
          valid: false,
          expiresIn: null,
          needsRefresh: false,
        },
      };

      return {
        status: 'success',
        integration: mockStatus,
      };
    } catch (error) {
      this.logger.error('❌ Failed to get integration status:', error);
      throw new HttpException(
        `Failed to get integration status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}