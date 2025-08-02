/**
 * JwtService - JWT token generation and validation for microservices
 * Handles authentication across recording endpoints and WebSocket connections
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, verify, decode } from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: 'coach' | 'client' | 'admin';
  permissions: string[];
  iat?: number;
  exp?: number;
  sessionId?: string;
  appointmentId?: string;
  // View switching fields
  originalUserId?: string; // Original therapist ID when viewing as client
  viewingAsClientId?: string; // Client ID being viewed
  isImpersonating?: boolean; // Flag indicating view switching is active
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DecodedToken {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

@Injectable()
class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(private configService: ConfigService) {
    this.jwtSecret = this.configService.get('JWT_SECRET', 'fallback-secret-key');
    this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '15m');
    this.refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');

    if (this.jwtSecret === 'fallback-secret-key') {
      this.logger.warn('⚠️  Using fallback JWT secret. Set JWT_SECRET in production!');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    try {
      const accessToken = sign(payload, this.jwtSecret as string, {
        expiresIn: this.jwtExpiresIn,
        issuer: 'clinic-app',
        audience: 'clinic-users',
      });

      const refreshToken = sign(
        { sub: payload.sub, type: 'refresh' },
        this.jwtSecret as string,
        {
          expiresIn: this.refreshExpiresIn,
          issuer: 'clinic-app',
          audience: 'clinic-users',
        }
      );

      // Calculate expiration time in seconds
      const decoded = decode(accessToken) as any;
      const expiresIn = decoded.exp - decoded.iat;

      this.logger.log(`🔑 Generated tokens for user ${payload.sub} (${payload.role})`);

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Failed to generate tokens:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Validate and decode JWT token
   */
  validateToken(token: string): DecodedToken {
    try {
      const payload = verify(token, this.jwtSecret, {
        issuer: 'clinic-app',
        audience: 'clinic-users',
      }) as JwtPayload;

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      this.logger.warn(`❌ Token validation failed: ${error.message}`);
      
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string): string {
    try {
      const decoded = verify(refreshToken, this.jwtSecret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      // In a real implementation, you'd fetch fresh user data from database
      // For now, we'll create a minimal payload
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: decoded.sub,
        email: 'user@example.com', // Should be fetched from DB
        role: 'coach', // Should be fetched from DB
        permissions: ['recordings:read', 'recordings:write'], // Should be fetched from DB
      };

      const newAccessToken = sign(payload, this.jwtSecret as string, {
        expiresIn: this.jwtExpiresIn,
        issuer: 'clinic-app',
        audience: 'clinic-users',
      });

      this.logger.log(`🔄 Refreshed access token for user ${decoded.sub}`);
      return newAccessToken;
    } catch (error) {
      this.logger.error('Failed to refresh token:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) return null;
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  /**
   * Generate session-specific token for WebSocket connections
   */
  generateSessionToken(
    userId: string,
    role: 'coach' | 'client',
    sessionId: string,
    appointmentId: string
  ): string {
    try {
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: userId,
        email: `${userId}@session.local`, // Placeholder
        role,
        permissions: this.getSessionPermissions(role),
        sessionId,
        appointmentId,
      };

      return sign(payload, this.jwtSecret, {
        expiresIn: '4h', // Session tokens last 4 hours
        issuer: 'clinic-app',
        audience: 'clinic-sessions',
      });
    } catch (error) {
      this.logger.error('Failed to generate session token:', error);
      throw new Error('Session token generation failed');
    }
  }

  /**
   * Validate session token for WebSocket connections
   */
  validateSessionToken(token: string): DecodedToken {
    try {
      const payload = verify(token, this.jwtSecret, {
        issuer: 'clinic-app',
        audience: 'clinic-sessions',
      }) as JwtPayload;

      if (!payload.sessionId) {
        throw new Error('Session ID missing in token');
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      this.logger.warn(`❌ Session token validation failed: ${error.message}`);
      
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if user has required permission
   */
  hasPermission(payload: JwtPayload, requiredPermission: string): boolean {
    if (!payload.permissions) return false;
    
    // Check for exact permission or wildcard
    return (
      payload.permissions.includes(requiredPermission) ||
      payload.permissions.includes('*') ||
      payload.permissions.some(p => 
        p.endsWith(':*') && requiredPermission.startsWith(p.replace(':*', ':'))
      )
    );
  }

  /**
   * Get permissions based on user role
   */
  private getSessionPermissions(role: 'coach' | 'client'): string[] {
    switch (role) {
      case 'coach':
        return [
          'recordings:read',
          'recordings:write',
          'recordings:delete',
          'websocket:join',
          'websocket:broadcast',
          'ai:generate-summary',
          'ai:generate-transcript',
        ];
      case 'client':
        return [
          'recordings:read',
          'websocket:join',
          'ai:view-summary',
        ];
      default:
        return [];
    }
  }

  /**
   * Generate secure API key for service-to-service communication
   */
  generateApiKey(service: string): string {
    const payload = {
      service,
      type: 'api-key',
      permissions: ['service:*'],
    };

    return sign(payload, this.jwtSecret, {
      issuer: 'clinic-app',
      audience: 'clinic-services',
      // API keys don't expire unless revoked
    });
  }

  /**
   * Validate API key for service authentication
   */
  validateApiKey(token: string): DecodedToken {
    try {
      const payload = verify(token, this.jwtSecret, {
        issuer: 'clinic-app',
        audience: 'clinic-services',
      }) as any;

      if (payload.type !== 'api-key') {
        throw new Error('Invalid API key type');
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a hash for token blacklisting
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Extract user ID from token without full validation (for logging)
   */
  extractUserId(token: string): string | null {
    try {
      const decoded = decode(token) as any;
      return decoded?.sub || null;
    } catch {
      return null;
    }
  }

  /**
   * Generate impersonation token for therapist to view as client
   */
  generateImpersonationToken(
    therapistPayload: JwtPayload,
    clientId: string,
    clientEmail: string
  ): TokenPair {
    try {
      // Verify therapist has permission to impersonate
      if (therapistPayload.role !== 'coach' && therapistPayload.role !== 'admin') {
        throw new Error('Only therapists and admins can switch to client view');
      }

      if (!this.hasPermission(therapistPayload, 'clients:impersonate')) {
        throw new Error('Insufficient permissions for client view switching');
      }

      const impersonationPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: clientId, // Token appears as if it's for the client
        email: clientEmail,
        role: 'client',
        permissions: this.getClientViewPermissions(),
        originalUserId: therapistPayload.sub, // Remember who's really logged in
        viewingAsClientId: clientId,
        isImpersonating: true,
      };

      const tokens = this.generateTokens(impersonationPayload);

      this.logger.log(
        `🎭 Therapist ${therapistPayload.sub} switched to client view for ${clientId}`
      );

      return tokens;
    } catch (error) {
      this.logger.error('Failed to generate impersonation token:', error);
      throw new Error(`Impersonation failed: ${error.message}`);
    }
  }

  /**
   * Return to original therapist view from client impersonation
   */
  async exitImpersonation(impersonationToken: string): Promise<TokenPair> {
    try {
      const decoded = this.validateToken(impersonationToken);
      
      if (!decoded.valid || !decoded.payload) {
        throw new Error('Invalid impersonation token');
      }

      if (!decoded.payload.isImpersonating || !decoded.payload.originalUserId) {
        throw new Error('Token is not an impersonation token');
      }

      // In a real implementation, fetch fresh therapist data from database
      const originalTherapistPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: decoded.payload.originalUserId,
        email: `${decoded.payload.originalUserId}@example.com`, // Should be fetched from DB
        role: 'coach',
        permissions: this.getTherapistPermissions(),
      };

      const tokens = this.generateTokens(originalTherapistPayload);

      this.logger.log(
        `🎭 Therapist ${decoded.payload.originalUserId} exited client view for ${decoded.payload.viewingAsClientId}`
      );

      return tokens;
    } catch (error) {
      this.logger.error('Failed to exit impersonation:', error);
      throw new Error(`Exit impersonation failed: ${error.message}`);
    }
  }

  /**
   * Check if current token is in impersonation mode
   */
  isImpersonating(payload: JwtPayload): boolean {
    return payload.isImpersonating === true && !!payload.originalUserId;
  }

  /**
   * Get the real user ID (therapist) when impersonating
   */
  getRealUserId(payload: JwtPayload): string {
    return payload.originalUserId || payload.sub;
  }

  /**
   * Get permissions for client view (restricted set for therapist viewing as client)
   */
  private getClientViewPermissions(): string[] {
    return [
      'appointments:read',
      'appointments:create',
      'appointments:update',
      'notes:read', // Read-only access to session notes
      'analytics:read:self', // Only their own analytics
      'settings:read',
      'settings:update:self',
      'notifications:read',
      'files:read:self',
      'websocket:join',
    ];
  }

  /**
   * Get full therapist permissions
   */
  private getTherapistPermissions(): string[] {
    return [
      'appointments:*',
      'clients:*',
      'clients:impersonate', // Permission to switch to client view
      'notes:*',
      'analytics:*',
      'settings:*',
      'notifications:*',
      'files:*',
      'websocket:*',
      'recordings:*',
      'ai:*',
    ];
  }

  /**
   * Validate that therapist can access specific client
   */
  canAccessClient(therapistId: string, clientId: string): boolean {
    // In a real implementation, this would check the database
    // for therapist-client relationships
    // For now, we'll assume any therapist can access any client
    this.logger.log(`🔍 Checking if therapist ${therapistId} can access client ${clientId}`);
    return true; // TODO: Implement actual database check
  }
}

export { JwtService };