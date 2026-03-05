/**
 * GoogleOAuthService - Handle Google OAuth2 authentication flow
 * Manages token acquisition, refresh, and secure storage
 */

import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAccount } from '../entities/google-account.entity';
import { TokenManagerService } from './token-manager.service';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private oauth2Client!: OAuth2Client;

  // Required Google API scopes
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose'
  ];

  constructor(
    @InjectRepository(GoogleAccount)
    private readonly googleAccountRepository: Repository<GoogleAccount>,
    private readonly tokenManager: TokenManagerService
  ) {
    this.initializeOAuth2Client();
  }

  private initializeOAuth2Client(): void {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.error('Missing Google OAuth2 configuration. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    this.logger.log('Google OAuth2 client initialized successfully');
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthUrl(userId: string, state?: string): string {
    if (!this.oauth2Client) {
      throw new BadRequestException('Google OAuth2 not configured');
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh tokens
      prompt: 'consent', // Force consent screen to get refresh token
      scope: this.SCOPES,
      state: state || userId, // Use userId as state to track the request
      include_granted_scopes: true
    });

    this.logger.log(`Generated auth URL for user ${userId}`);
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<GoogleAccount> {
    if (!this.oauth2Client) {
      throw new BadRequestException('Google OAuth2 not configured');
    }

    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new BadRequestException('Invalid token response from Google');
      }

      // Set credentials to get user info
      this.oauth2Client.setCredentials(tokens);

      // Get user information
      const userInfo = await this.getUserInfo();

      // Check if account already exists
      let googleAccount = await this.googleAccountRepository.findOne({
        where: { googleUserId: userInfo.id }
      });

      if (googleAccount) {
        // Update existing account
        googleAccount = await this.updateExistingAccount(googleAccount, tokens, userInfo, userId);
      } else {
        // Create new account
        googleAccount = await this.createNewAccount(tokens, userInfo, userId);
      }

      this.logger.log(`Successfully connected Google account ${userInfo.email} for user ${userId}`);
      return googleAccount;

    } catch (error) {
      this.logger.error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Failed to connect Google account');
    }
  }

  /**
   * Get user information from Google
   */
  private async getUserInfo(): Promise<GoogleUserInfo> {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const response = await oauth2.userinfo.get();
      
      if (!response.data || !response.data.id || !response.data.email) {
        throw new Error('Invalid user info response');
      }

      return response.data as GoogleUserInfo;
    } catch (error) {
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create new Google account record
   */
  private async createNewAccount(
    tokens: any,
    userInfo: GoogleUserInfo,
    userId: string
  ): Promise<GoogleAccount> {
    const expiryDate = new Date(tokens.expiry_date || Date.now() + 3600000); // 1 hour default

    const googleAccount = this.googleAccountRepository.create({
      userId,
      googleUserId: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.name,
      profilePicture: userInfo.picture,
      accessToken: await this.tokenManager.encryptToken(tokens.access_token),
      refreshToken: await this.tokenManager.encryptToken(tokens.refresh_token),
      tokenExpiresAt: expiryDate,
      tokenScope: tokens.scope || this.SCOPES.join(' '),
      calendarSyncEnabled: true,
      gmailSyncEnabled: true,
      syncStatus: 'active'
    });

    return await this.googleAccountRepository.save(googleAccount);
  }

  /**
   * Update existing Google account
   */
  private async updateExistingAccount(
    googleAccount: GoogleAccount,
    tokens: any,
    userInfo: GoogleUserInfo,
    userId: string
  ): Promise<GoogleAccount> {
    const expiryDate = new Date(tokens.expiry_date || Date.now() + 3600000);

    googleAccount.userId = userId; // Update in case user changed
    googleAccount.email = userInfo.email;
    googleAccount.displayName = userInfo.name;
    googleAccount.profilePicture = userInfo.picture;
    googleAccount.accessToken = await this.tokenManager.encryptToken(tokens.access_token);
    googleAccount.refreshToken = await this.tokenManager.encryptToken(tokens.refresh_token);
    googleAccount.tokenExpiresAt = expiryDate;
    googleAccount.tokenScope = tokens.scope || this.SCOPES.join(' ');
    googleAccount.syncStatus = 'active';
    googleAccount.syncError = null as any;

    return await this.googleAccountRepository.save(googleAccount);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(googleAccountId: string): Promise<GoogleAccount> {
    const googleAccount = await this.googleAccountRepository.findOne({
      where: { id: googleAccountId }
    });

    if (!googleAccount) {
      throw new UnauthorizedException('Google account not found');
    }

    try {
      const refreshToken = await this.tokenManager.decryptToken(googleAccount.refreshToken);
      
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('No access token in refresh response');
      }

      // Update account with new tokens
      googleAccount.accessToken = await this.tokenManager.encryptToken(credentials.access_token);
      googleAccount.tokenExpiresAt = new Date(credentials.expiry_date || Date.now() + 3600000);
      googleAccount.syncStatus = 'active';
      googleAccount.syncError = null as any;

      if (credentials.refresh_token) {
        googleAccount.refreshToken = await this.tokenManager.encryptToken(credentials.refresh_token);
      }

      const updatedAccount = await this.googleAccountRepository.save(googleAccount);
      this.logger.log(`Refreshed access token for account ${googleAccount.email}`);
      
      return updatedAccount;

    } catch (error) {
      this.logger.error(`Failed to refresh token for account ${googleAccount.email}: ${error instanceof Error ? error.message : String(error)}`);
      
      // Mark account as expired
      googleAccount.syncStatus = 'expired';
      googleAccount.syncError = 'Token refresh failed - reauthorization required';
      await this.googleAccountRepository.save(googleAccount);
      
      throw new UnauthorizedException('Token refresh failed - please reconnect your Google account');
    }
  }

  /**
   * Get authenticated OAuth2 client for an account
   */
  async getAuthenticatedClient(googleAccountId: string): Promise<OAuth2Client> {
    let googleAccount = await this.googleAccountRepository.findOne({
      where: { id: googleAccountId }
    });

    if (!googleAccount) {
      throw new UnauthorizedException('Google account not found');
    }

    // Refresh token if needed
    if (googleAccount.needsTokenRefresh) {
      googleAccount = await this.refreshAccessToken(googleAccountId);
    }

    const accessToken = await this.tokenManager.decryptToken(googleAccount.accessToken);
    const refreshToken = await this.tokenManager.decryptToken(googleAccount.refreshToken);

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: googleAccount.tokenExpiresAt.getTime()
    });

    return client;
  }

  /**
   * Revoke Google account access
   */
  async revokeAccess(googleAccountId: string): Promise<void> {
    const googleAccount = await this.googleAccountRepository.findOne({
      where: { id: googleAccountId }
    });

    if (!googleAccount) {
      throw new BadRequestException('Google account not found');
    }

    try {
      const accessToken = await this.tokenManager.decryptToken(googleAccount.accessToken);
      
      // Revoke tokens with Google
      await this.oauth2Client.revokeToken(accessToken);
      
      // Delete account record
      await this.googleAccountRepository.remove(googleAccount);
      
      this.logger.log(`Revoked access for Google account ${googleAccount.email}`);
    } catch (error) {
      this.logger.error(`Failed to revoke access for account ${googleAccount.email}: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Failed to revoke Google account access');
    }
  }

  /**
   * Get all Google accounts for a user
   */
  async getUserGoogleAccounts(userId: string): Promise<GoogleAccount[]> {
    return await this.googleAccountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get Google account by ID
   */
  async getGoogleAccount(googleAccountId: string): Promise<GoogleAccount | null> {
    return await this.googleAccountRepository.findOne({
      where: { id: googleAccountId }
    });
  }

  /**
   * Update sync settings for a Google account
   */
  async updateSyncSettings(
    googleAccountId: string,
    settings: {
      calendarSyncEnabled?: boolean;
      gmailSyncEnabled?: boolean;
      calendarId?: string;
    }
  ): Promise<GoogleAccount> {
    const googleAccount = await this.googleAccountRepository.findOne({
      where: { id: googleAccountId }
    });

    if (!googleAccount) {
      throw new BadRequestException('Google account not found');
    }

    if (settings.calendarSyncEnabled !== undefined) {
      googleAccount.calendarSyncEnabled = settings.calendarSyncEnabled;
    }
    if (settings.gmailSyncEnabled !== undefined) {
      googleAccount.gmailSyncEnabled = settings.gmailSyncEnabled;
    }
    if (settings.calendarId !== undefined) {
      googleAccount.calendarId = settings.calendarId;
    }

    return await this.googleAccountRepository.save(googleAccount);
  }
}