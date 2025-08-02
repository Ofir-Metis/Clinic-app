/**
 * GoogleOAuthService - Handles Google OAuth 2.0 authentication for Calendar API access
 * Manages access tokens, refresh tokens, and user consent
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
  scope: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.clientId = this.configService.get('GOOGLE_CLIENT_ID', '');
    this.clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET', '');
    this.redirectUri = this.configService.get('GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/google/callback');

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('⚠️  Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    }
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.append('state', state);
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    this.logger.log('🔗 Generated Google OAuth authorization URL');
    return authUrl;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://oauth2.googleapis.com/token',
          {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
      );

      this.logger.log('🔑 Successfully exchanged authorization code for tokens');
      return response.data;
    } catch (error) {
      this.logger.error('❌ Failed to exchange code for tokens:', error.response?.data || error.message);
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://oauth2.googleapis.com/token',
          {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
      );

      this.logger.log('🔄 Successfully refreshed access token');
      
      // Refresh tokens might not always include a new refresh token
      const tokens = response.data;
      if (!tokens.refresh_token) {
        tokens.refresh_token = refreshToken; // Keep the original refresh token
      }

      return tokens;
    } catch (error) {
      this.logger.error('❌ Failed to refresh access token:', error.response?.data || error.message);
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://oauth2.googleapis.com/revoke?token=${token}`,
          {},
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
      );

      this.logger.log('🚫 Successfully revoked access token');
    } catch (error) {
      this.logger.error('❌ Failed to revoke token:', error.response?.data || error.message);
      throw new Error(`Token revocation failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )
      );

      this.logger.log(`👤 Retrieved user info for ${response.data.email}`);
      return response.data;
    } catch (error) {
      this.logger.error('❌ Failed to get user info:', error.response?.data || error.message);
      throw new Error(`Get user info failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<{
    valid: boolean;
    expiresIn?: number;
    scope?: string;
    email?: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
        )
      );

      const tokenInfo = response.data;
      
      return {
        valid: true,
        expiresIn: parseInt(tokenInfo.expires_in),
        scope: tokenInfo.scope,
        email: tokenInfo.email,
      };
    } catch (error) {
      this.logger.warn('🔍 Token validation failed:', error.response?.data || error.message);
      return { valid: false };
    }
  }

  /**
   * Check if token needs refresh (expires within 5 minutes)
   */
  needsRefresh(expiresIn: number): boolean {
    return expiresIn < 300; // 5 minutes
  }

  /**
   * Get calendar list for authenticated user
   */
  async getCalendarList(accessToken: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )
      );

      this.logger.log(`📅 Retrieved ${response.data.items?.length || 0} calendars`);
      return response.data.items || [];
    } catch (error) {
      this.logger.error('❌ Failed to get calendar list:', error.response?.data || error.message);
      throw new Error(`Get calendar list failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Generate state parameter for OAuth flow (to prevent CSRF)
   */
  generateState(userId: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(7);
    return Buffer.from(`${userId}:${timestamp}:${random}`).toString('base64');
  }

  /**
   * Verify state parameter from OAuth callback
   */
  verifyState(state: string, expectedUserId: string): boolean {
    try {
      const decoded = Buffer.from(state, 'base64').toString();
      const [userId, timestamp, random] = decoded.split(':');
      
      // Check if user ID matches
      if (userId !== expectedUserId) {
        return false;
      }

      // Check if state is not too old (within 10 minutes)
      const stateAge = Date.now() - parseInt(timestamp);
      if (stateAge > 10 * 60 * 1000) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('❌ State verification failed:', error);
      return false;
    }
  }

  /**
   * Check if current scopes include calendar access
   */
  hasCalendarScope(scope: string): boolean {
    const requiredScopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return requiredScopes.some(requiredScope => scope.includes(requiredScope));
  }
}