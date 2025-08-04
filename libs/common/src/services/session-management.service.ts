import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

export interface SessionConfig {
  sessionId: string;
  userId: string;
  userRole: string;
  issuedAt: number;
  expiresAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  securityLevel: 'standard' | 'elevated' | 'admin';
  twoFactorVerified?: boolean;
  permissions: string[];
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: SessionConfig;
  reason?: string;
  requiresReauthentication?: boolean;
  securityAlert?: boolean;
}

export interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  suspiciousSessions: number;
  averageSessionDuration: number;
  concurrentUserSessions: Map<string, number>;
}

/**
 * Session Management Service
 * 
 * Provides enterprise-grade session management with healthcare-specific security:
 * - Secure session creation and validation
 * - Session timeout and inactivity handling
 * - Device fingerprinting and anomaly detection
 * - Concurrent session management
 * - Security event logging and alerting
 * - HIPAA-compliant session handling
 * 
 * @example
 * ```typescript
 * const sessionService = new SessionManagementService(configService);
 * 
 * // Create secure session
 * const session = await sessionService.createSession(user, request);
 * 
 * // Validate session on each request
 * const validation = await sessionService.validateSession(sessionId, request);
 * ```
 */
@Injectable()
export class SessionManagementService {
  private readonly logger = new Logger(SessionManagementService.name);
  private readonly sessions = new Map<string, SessionConfig>();
  private readonly userSessions = new Map<string, Set<string>>();
  
  // Configuration
  private readonly maxSessionAge: number;
  private readonly maxInactivityTime: number;
  private readonly maxConcurrentSessions: number;
  private readonly sessionSecretKey: string;
  private readonly enableDeviceTracking: boolean;
  private readonly requireSecureTransport: boolean;
  private readonly enableSessionRotation: boolean;

  constructor(private configService: ConfigService) {
    this.maxSessionAge = this.configService.get('SESSION_MAX_AGE', 8 * 60 * 60 * 1000); // 8 hours
    this.maxInactivityTime = this.configService.get('SESSION_INACTIVITY_TIMEOUT', 30 * 60 * 1000); // 30 minutes
    this.maxConcurrentSessions = this.configService.get('MAX_CONCURRENT_SESSIONS', 3);
    this.sessionSecretKey = this.configService.get('SESSION_SECRET_KEY', 'default-secret-change-in-production');
    this.enableDeviceTracking = this.configService.get('ENABLE_DEVICE_TRACKING', 'true') === 'true';
    this.requireSecureTransport = this.configService.get('REQUIRE_SECURE_TRANSPORT', 'true') === 'true';
    this.enableSessionRotation = this.configService.get('ENABLE_SESSION_ROTATION', 'true') === 'true';

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Create a new secure session
   */
  async createSession(
    user: {
      id: string;
      role: string;
      permissions: string[];
      twoFactorEnabled?: boolean;
    },
    request: Request,
    options: {
      securityLevel?: 'standard' | 'elevated' | 'admin';
      rememberMe?: boolean;
      deviceTrust?: boolean;
    } = {}
  ): Promise<{ sessionId: string; session: SessionConfig }> {
    const now = Date.now();
    const sessionId = this.generateSessionId();
    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('User-Agent') || 'unknown';
    const deviceFingerprint = this.enableDeviceTracking ? this.generateDeviceFingerprint(request) : undefined;

    // Determine session duration based on security level and remember me
    const securityLevel = options.securityLevel || this.determineSecurityLevel(user.role);
    const sessionDuration = this.calculateSessionDuration(securityLevel, options.rememberMe);

    // Check for concurrent session limits
    await this.enforceConcurrentSessionLimits(user.id);

    const session: SessionConfig = {
      sessionId,
      userId: user.id,
      userRole: user.role,
      issuedAt: now,
      expiresAt: now + sessionDuration,
      lastActivity: now,
      ipAddress,
      userAgent,
      deviceFingerprint,
      securityLevel,
      twoFactorVerified: false, // Will be set during 2FA verification
      permissions: user.permissions
    };

    // Store session
    this.sessions.set(sessionId, session);
    
    // Track user sessions
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set());
    }
    this.userSessions.get(user.id)!.add(sessionId);

    // Log session creation
    this.logger.log('Session created', {
      sessionId: sessionId.substring(0, 8) + '...',
      userId: user.id,
      role: user.role,
      securityLevel,
      ipAddress,
      userAgent: userAgent.substring(0, 100),
      deviceFingerprint: deviceFingerprint?.substring(0, 16),
      expiresAt: new Date(session.expiresAt).toISOString()
    });

    return { sessionId, session };
  }

  /**
   * Validate session and update last activity
   */
  async validateSession(
    sessionId: string, 
    request: Request,
    options: {
      updateActivity?: boolean;
      requireElevated?: boolean;
      requiredPermissions?: string[];
    } = {}
  ): Promise<SessionValidationResult> {
    const { updateActivity = true, requireElevated = false, requiredPermissions = [] } = options;

    if (!sessionId) {
      return { isValid: false, reason: 'Session ID not provided' };
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { isValid: false, reason: 'Session not found' };
    }

    const now = Date.now();
    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('User-Agent') || 'unknown';

    // Check session expiration
    if (now > session.expiresAt) {
      this.invalidateSession(sessionId);
      return { 
        isValid: false, 
        reason: 'Session expired',
        requiresReauthentication: true
      };
    }

    // Check inactivity timeout
    if (now - session.lastActivity > this.maxInactivityTime) {
      this.invalidateSession(sessionId);
      return { 
        isValid: false, 
        reason: 'Session inactive too long',
        requiresReauthentication: true
      };
    }

    // Security checks
    const securityIssue = await this.performSecurityChecks(session, request);
    if (securityIssue) {
      this.invalidateSession(sessionId);
      return {
        isValid: false,
        reason: securityIssue.reason,
        securityAlert: true
      };
    }

    // Check security level requirements
    if (requireElevated && session.securityLevel === 'standard') {
      return {
        isValid: false,
        reason: 'Elevated access required',
        requiresReauthentication: true
      };
    }

    // Check permissions
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      session.permissions.includes(permission)
    );
    if (!hasRequiredPermissions) {
      return {
        isValid: false,
        reason: 'Insufficient permissions'
      };
    }

    // Update last activity
    if (updateActivity) {
      session.lastActivity = now;
      this.sessions.set(sessionId, session);
    }

    // Check if session rotation is needed
    if (this.shouldRotateSession(session)) {
      const newSession = await this.rotateSession(sessionId, request);
      return {
        isValid: true,
        session: newSession.session,
        reason: 'Session rotated for security'
      };
    }

    return { isValid: true, session };
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Remove from sessions map
    this.sessions.delete(sessionId);

    // Remove from user sessions tracking
    const userSessions = this.userSessions.get(session.userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(session.userId);
      }
    }

    this.logger.log('Session invalidated', {
      sessionId: sessionId.substring(0, 8) + '...',
      userId: session.userId,
      reason: 'Manual invalidation'
    });

    return true;
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) {
      return 0;
    }

    let invalidatedCount = 0;
    const sessionsToInvalidate = Array.from(userSessions);

    for (const sessionId of sessionsToInvalidate) {
      if (exceptSessionId && sessionId === exceptSessionId) {
        continue;
      }

      if (await this.invalidateSession(sessionId)) {
        invalidatedCount++;
      }
    }

    this.logger.log('All user sessions invalidated', {
      userId,
      invalidatedCount,
      exceptSession: exceptSessionId?.substring(0, 8) + '...'
    });

    return invalidatedCount;
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string, additionalTime?: number): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const extension = additionalTime || this.maxSessionAge;
    const newExpiresAt = Math.min(
      session.expiresAt + extension,
      Date.now() + this.maxSessionAge // Don't exceed max session age
    );

    session.expiresAt = newExpiresAt;
    this.sessions.set(sessionId, session);

    this.logger.debug('Session extended', {
      sessionId: sessionId.substring(0, 8) + '...',
      newExpiresAt: new Date(newExpiresAt).toISOString()
    });

    return true;
  }

  /**
   * Rotate session ID for security
   */
  async rotateSession(oldSessionId: string, request: Request): Promise<{ sessionId: string; session: SessionConfig }> {
    const oldSession = this.sessions.get(oldSessionId);
    if (!oldSession) {
      throw new Error('Session not found for rotation');
    }

    // Create new session ID
    const newSessionId = this.generateSessionId();
    const now = Date.now();

    // Create new session with updated information
    const newSession: SessionConfig = {
      ...oldSession,
      sessionId: newSessionId,
      lastActivity: now,
      // Optionally update device fingerprint
      deviceFingerprint: this.enableDeviceTracking ? this.generateDeviceFingerprint(request) : oldSession.deviceFingerprint
    };

    // Store new session
    this.sessions.set(newSessionId, newSession);

    // Update user sessions tracking
    const userSessions = this.userSessions.get(oldSession.userId);
    if (userSessions) {
      userSessions.delete(oldSessionId);
      userSessions.add(newSessionId);
    }

    // Remove old session
    this.sessions.delete(oldSessionId);

    this.logger.log('Session rotated', {
      oldSessionId: oldSessionId.substring(0, 8) + '...',
      newSessionId: newSessionId.substring(0, 8) + '...',
      userId: oldSession.userId
    });

    return { sessionId: newSessionId, session: newSession };
  }

  /**
   * Update session security level (e.g., after 2FA verification)
   */
  async updateSessionSecurity(
    sessionId: string, 
    updates: {
      securityLevel?: 'standard' | 'elevated' | 'admin';
      twoFactorVerified?: boolean;
      permissions?: string[];
    }
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    if (updates.securityLevel) {
      session.securityLevel = updates.securityLevel;
    }
    if (updates.twoFactorVerified !== undefined) {
      session.twoFactorVerified = updates.twoFactorVerified;
    }
    if (updates.permissions) {
      session.permissions = updates.permissions;
    }

    session.lastActivity = Date.now();
    this.sessions.set(sessionId, session);

    this.logger.log('Session security updated', {
      sessionId: sessionId.substring(0, 8) + '...',
      updates,
      userId: session.userId
    });

    return true;
  }

  /**
   * Get session metrics for monitoring
   */
  getSessionMetrics(): SessionMetrics {
    const now = Date.now();
    let activeSessions = 0;
    let expiredSessions = 0;
    let suspiciousSessions = 0;
    let totalSessionDuration = 0;

    for (const session of this.sessions.values()) {
      if (now > session.expiresAt) {
        expiredSessions++;
      } else if (now - session.lastActivity > this.maxInactivityTime) {
        expiredSessions++;
      } else {
        activeSessions++;
        totalSessionDuration += now - session.issuedAt;
      }

      // Check for suspicious activity
      if (this.isSessionSuspicious(session)) {
        suspiciousSessions++;
      }
    }

    const concurrentUserSessions = new Map<string, number>();
    for (const [userId, sessions] of this.userSessions.entries()) {
      concurrentUserSessions.set(userId, sessions.size);
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      expiredSessions,
      suspiciousSessions,
      averageSessionDuration: activeSessions > 0 ? totalSessionDuration / activeSessions : 0,
      concurrentUserSessions
    };
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): SessionConfig[] {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) {
      return [];
    }

    return Array.from(userSessions)
      .map(sessionId => this.sessions.get(sessionId))
      .filter((session): session is SessionConfig => session !== undefined);
  }

  /**
   * Generate cryptographically secure session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHmac('sha256', this.sessionSecretKey)
      .update(timestamp + randomBytes)
      .digest('hex');
    
    return `${timestamp}.${randomBytes}.${hash}`;
  }

  /**
   * Generate device fingerprint for tracking
   */
  private generateDeviceFingerprint(request: Request): string {
    const userAgent = request.get('User-Agent') || '';
    const acceptLanguage = request.get('Accept-Language') || '';
    const acceptEncoding = request.get('Accept-Encoding') || '';
    
    const fingerprint = crypto.createHash('sha256')
      .update(userAgent + acceptLanguage + acceptEncoding)
      .digest('hex');
    
    return fingerprint.substring(0, 32); // First 32 characters
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    return (
      request.get('X-Forwarded-For')?.split(',')[0] ||
      request.get('X-Real-IP') ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Determine security level based on user role
   */
  private determineSecurityLevel(role: string): 'standard' | 'elevated' | 'admin' {
    if (role === 'super_admin' || role === 'admin') {
      return 'admin';
    }
    if (role === 'coach' || role === 'therapist') {
      return 'elevated';
    }
    return 'standard';
  }

  /**
   * Calculate session duration based on security level and remember me
   */
  private calculateSessionDuration(securityLevel: string, rememberMe?: boolean): number {
    let baseDuration = this.maxSessionAge;

    // Adjust duration based on security level
    switch (securityLevel) {
      case 'admin':
        baseDuration = Math.min(baseDuration, 4 * 60 * 60 * 1000); // Max 4 hours for admin
        break;
      case 'elevated':
        baseDuration = Math.min(baseDuration, 6 * 60 * 60 * 1000); // Max 6 hours for elevated
        break;
      default:
        break;
    }

    // Extend for remember me (but not for admin sessions)
    if (rememberMe && securityLevel !== 'admin') {
      baseDuration = Math.min(baseDuration * 7, 30 * 24 * 60 * 60 * 1000); // Max 30 days
    }

    return baseDuration;
  }

  /**
   * Enforce concurrent session limits
   */
  private async enforceConcurrentSessionLimits(userId: string): Promise<void> {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions || userSessions.size < this.maxConcurrentSessions) {
      return;
    }

    // Remove oldest sessions to stay within limit
    const sessions = Array.from(userSessions)
      .map(sessionId => this.sessions.get(sessionId))
      .filter((session): session is SessionConfig => session !== undefined)
      .sort((a, b) => a.lastActivity - b.lastActivity);

    const sessionsToRemove = sessions.slice(0, sessions.length - this.maxConcurrentSessions + 1);
    
    for (const session of sessionsToRemove) {
      await this.invalidateSession(session.sessionId);
    }

    if (sessionsToRemove.length > 0) {
      this.logger.warn('Concurrent session limit enforced', {
        userId,
        removedSessions: sessionsToRemove.length,
        maxAllowed: this.maxConcurrentSessions
      });
    }
  }

  /**
   * Perform security checks on session
   */
  private async performSecurityChecks(
    session: SessionConfig, 
    request: Request
  ): Promise<{ reason: string } | null> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('User-Agent') || 'unknown';

    // Check IP address consistency
    if (session.ipAddress !== ipAddress) {
      this.logger.warn('IP address mismatch detected', {
        sessionId: session.sessionId.substring(0, 8) + '...',
        userId: session.userId,
        originalIP: session.ipAddress,
        currentIP: ipAddress
      });

      // For admin sessions, strict IP checking
      if (session.securityLevel === 'admin') {
        return { reason: 'IP address change detected for admin session' };
      }

      // For other sessions, log but allow (could be mobile users)
      this.logger.warn('IP address change allowed for non-admin session', {
        sessionId: session.sessionId.substring(0, 8) + '...',
        userId: session.userId
      });
    }

    // Check User-Agent consistency (less strict)
    if (session.userAgent !== userAgent) {
      this.logger.debug('User-Agent change detected', {
        sessionId: session.sessionId.substring(0, 8) + '...',
        userId: session.userId,
        originalUA: session.userAgent?.substring(0, 100),
        currentUA: userAgent.substring(0, 100)
      });
    }

    // Check device fingerprint if enabled
    if (this.enableDeviceTracking && session.deviceFingerprint) {
      const currentFingerprint = this.generateDeviceFingerprint(request);
      if (session.deviceFingerprint !== currentFingerprint) {
        this.logger.warn('Device fingerprint mismatch', {
          sessionId: session.sessionId.substring(0, 8) + '...',
          userId: session.userId,
          originalFingerprint: session.deviceFingerprint,
          currentFingerprint
        });

        // For admin sessions with device tracking, this is suspicious
        if (session.securityLevel === 'admin') {
          return { reason: 'Device fingerprint mismatch for admin session' };
        }
      }
    }

    // Check for secure transport in production
    if (this.requireSecureTransport && !request.secure && request.get('X-Forwarded-Proto') !== 'https') {
      return { reason: 'Secure transport required' };
    }

    return null;
  }

  /**
   * Check if session should be rotated
   */
  private shouldRotateSession(session: SessionConfig): boolean {
    if (!this.enableSessionRotation) {
      return false;
    }

    const now = Date.now();
    const sessionAge = now - session.issuedAt;
    const rotationThreshold = this.maxSessionAge / 4; // Rotate after 25% of max age

    return sessionAge > rotationThreshold;
  }

  /**
   * Check if session appears suspicious
   */
  private isSessionSuspicious(session: SessionConfig): boolean {
    const now = Date.now();
    
    // Very long session duration
    if (now - session.issuedAt > 24 * 60 * 60 * 1000) { // 24 hours
      return true;
    }

    // Very short time between creation and last activity (potential automation)
    if (session.lastActivity - session.issuedAt < 1000) { // Less than 1 second
      return true;
    }

    return false;
  }

  /**
   * Start cleanup interval for expired sessions
   */
  private startCleanupInterval(): void {
    const cleanupInterval = this.configService.get('SESSION_CLEANUP_INTERVAL', 5 * 60 * 1000); // 5 minutes
    
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, cleanupInterval);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt || now - session.lastActivity > this.maxInactivityTime) {
        this.invalidateSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }
}