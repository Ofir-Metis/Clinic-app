/**
 * OAuthController - Handle Google OAuth2 authentication endpoints
 */

import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  Param, 
  Req, 
  Res, 
  BadRequestException,
  UnauthorizedException,
  Logger,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleOAuthService } from './google-oauth.service';
import { TokenManagerService } from './token-manager.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

interface CallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

@ApiTags('Google OAuth')
@Controller('oauth/google')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly tokenManager: TokenManagerService
  ) {}

  @Get('connect')
  @ApiOperation({ summary: 'Initiate Google OAuth2 connection' })
  @ApiResponse({ status: 200, description: 'Returns authorization URL' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initiateConnection(
    @Req() req: AuthenticatedRequest
  ) {
    try {
      const userId = req.user.id;
      
      // Generate secure state parameter
      const state = this.tokenManager.generateSecureState(userId);
      
      // Generate Google OAuth URL
      const authUrl = this.googleOAuthService.generateAuthUrl(userId, state);
      
      this.logger.log(`Generated OAuth URL for user ${userId}`);
      
      return {
        success: true,
        authUrl,
        state,
        message: 'Please complete authentication with Google'
      };
      
    } catch (error) {
      this.logger.error(`Failed to initiate Google connection: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Failed to initiate Google connection');
    }
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Google OAuth2 callback' })
  @ApiResponse({ status: 200, description: 'Account connected successfully' })
  @ApiResponse({ status: 400, description: 'Authentication failed' })
  async handleCallback(
    @Query() query: CallbackQuery,
    @Res() res: Response
  ) {
    try {
      // Check for OAuth errors
      if (query.error) {
        this.logger.warn(`OAuth error: ${query.error} - ${query.error_description}`);
        return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=${encodeURIComponent(query.error)}`);
      }

      // Validate required parameters
      if (!query.code || !query.state) {
        throw new BadRequestException('Missing authorization code or state parameter');
      }

      // Extract user ID from state
      const stateParts = query.state.split(':');
      if (stateParts.length < 4) {
        throw new BadRequestException('Invalid state parameter');
      }
      
      const userId = stateParts[0];
      
      // Validate state parameter
      if (!this.tokenManager.validateState(query.state, userId)) {
        throw new UnauthorizedException('Invalid or expired state parameter');
      }

      // Exchange code for tokens and create/update account
      const googleAccount = await this.googleOAuthService.exchangeCodeForTokens(query.code, userId);
      
      this.logger.log(`Successfully connected Google account for user ${userId}`);
      
      // Redirect to frontend with success
      const successUrl = `${process.env.FRONTEND_URL}/integrations?connected=true&email=${encodeURIComponent(googleAccount.email)}`;
      return res.redirect(successUrl);

    } catch (error) {
      this.logger.error(`OAuth callback error: ${error instanceof Error ? error.message : String(error)}`);
      
      const errorUrl = `${process.env.FRONTEND_URL}/integrations?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`;
      return res.redirect(errorUrl);
    }
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get user\'s connected Google accounts' })
  @ApiResponse({ status: 200, description: 'List of connected accounts' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getConnectedAccounts(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const accounts = await this.googleOAuthService.getUserGoogleAccounts(userId);
      
      // Return safe account information (no tokens)
      const safeAccounts = accounts.map(account => ({
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        profilePicture: account.profilePicture,
        calendarSyncEnabled: account.calendarSyncEnabled,
        gmailSyncEnabled: account.gmailSyncEnabled,
        syncStatus: account.syncStatus,
        syncStatusDisplay: account.syncStatusDisplay,
        lastCalendarSync: account.lastCalendarSync,
        lastGmailSync: account.lastGmailSync,
        hasCalendarScope: account.hasCalendarScope,
        hasGmailScope: account.hasGmailScope,
        isTokenExpired: account.isTokenExpired,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }));

      return {
        success: true,
        accounts: safeAccounts,
        count: safeAccounts.length
      };

    } catch (error) {
      this.logger.error(`Failed to get connected accounts: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Failed to retrieve connected accounts');
    }
  }

  @Post('accounts/:accountId/settings')
  @ApiOperation({ summary: 'Update Google account sync settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateAccountSettings(
    @Param('accountId') accountId: string,
    @Body() settings: {
      calendarSyncEnabled?: boolean;
      gmailSyncEnabled?: boolean;
      calendarId?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(accountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Account not found or access denied');
      }

      const updatedAccount = await this.googleOAuthService.updateSyncSettings(accountId, settings);
      
      this.logger.log(`Updated settings for Google account ${updatedAccount.email}`);
      
      return {
        success: true,
        message: 'Account settings updated successfully',
        account: {
          id: updatedAccount.id,
          email: updatedAccount.email,
          calendarSyncEnabled: updatedAccount.calendarSyncEnabled,
          gmailSyncEnabled: updatedAccount.gmailSyncEnabled,
          calendarId: updatedAccount.calendarId
        }
      };

    } catch (error) {
      this.logger.error(`Failed to update account settings: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Failed to update account settings');
    }
  }

  @Post('accounts/:accountId/refresh')
  @ApiOperation({ summary: 'Manually refresh account tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async refreshTokens(
    @Param('accountId') accountId: string,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(accountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Account not found or access denied');
      }

      const refreshedAccount = await this.googleOAuthService.refreshAccessToken(accountId);
      
      this.logger.log(`Refreshed tokens for Google account ${refreshedAccount.email}`);
      
      return {
        success: true,
        message: 'Tokens refreshed successfully',
        tokenExpiresAt: refreshedAccount.tokenExpiresAt,
        syncStatus: refreshedAccount.syncStatus
      };

    } catch (error) {
      this.logger.error(`Failed to refresh tokens: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to refresh tokens');
    }
  }

  @Post('accounts/:accountId/disconnect')
  @ApiOperation({ summary: 'Disconnect Google account' })
  @ApiResponse({ status: 200, description: 'Account disconnected successfully' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async disconnectAccount(
    @Param('accountId') accountId: string,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(accountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Account not found or access denied');
      }

      await this.googleOAuthService.revokeAccess(accountId);
      
      this.logger.log(`Disconnected Google account ${account.email} for user ${req.user.id}`);
      
      return {
        success: true,
        message: 'Google account disconnected successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to disconnect account: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Failed to disconnect Google account');
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get Google integration status' })
  @ApiResponse({ status: 200, description: 'Integration status' })
  async getIntegrationStatus() {
    const hasConfig = !!(
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REDIRECT_URI
    );

    const encryptionValid = await this.tokenManager.validateEncryption();

    return {
      success: true,
      status: {
        configured: hasConfig,
        encryptionValid,
        requiredScopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.compose'
        ]
      }
    };
  }
}