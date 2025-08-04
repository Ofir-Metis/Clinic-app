import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  Req, 
  Res, 
  Logger, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SessionManagementService, SessionConfig } from '../services/session-management.service';
import { SessionGuard, SessionExempt, RequireElevated, RequireSessionPermissions } from '../guards/session.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiSecurity } from '@nestjs/swagger';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceTrust?: boolean;
  twoFactorCode?: string;
}

interface SessionResponse {
  sessionId: string;
  expiresAt: string;
  securityLevel: string;
  requiresTwoFactor?: boolean;
}

interface SessionListResponse {
  sessions: Array<{
    sessionId: string;
    issuedAt: string;
    lastActivity: string;
    expiresAt: string;
    ipAddress: string;
    userAgent: string;
    securityLevel: string;
    isCurrent: boolean;
  }>;
  totalSessions: number;
}

// Note: Request interface extension is already declared in session.guard.ts

/**
 * Session Management Controller
 * 
 * Provides endpoints for secure session management including:
 * - Session creation (login)
 * - Session validation and refresh
 * - Session termination (logout)
 * - Multi-session management
 * - Session monitoring and analytics
 * 
 * Security features:
 * - Healthcare-grade session security
 * - Device fingerprinting
 * - Concurrent session limits
 * - Automatic session rotation
 * - Security event logging
 */
@ApiTags('Session Management')
@Controller('auth/sessions')
export class SessionManagementController {
  private readonly logger = new Logger(SessionManagementController.name);

  constructor(private readonly sessionManagementService: SessionManagementService) {}

  /**
   * Create a new session (login)
   */
  @Post('login')
  @SessionExempt()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Create new session (login)',
    description: 'Authenticates user and creates a secure session with device tracking'
  })
  @ApiBody({
    description: 'Login credentials and session options',
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        rememberMe: { type: 'boolean', default: false },
        deviceTrust: { type: 'boolean', default: false },
        twoFactorCode: { type: 'string', minLength: 6, maxLength: 6 }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session created successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
        securityLevel: { type: 'string', enum: ['standard', 'elevated', 'admin'] },
        requiresTwoFactor: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(
    @Body() loginData: LoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<SessionResponse> {
    try {
      // TODO: Replace with actual user authentication service
      const mockUser = {
        id: 'user-123',
        role: 'client',
        permissions: ['profile:read', 'appointments:read'],
        twoFactorEnabled: false
      };

      // Validate credentials (mock implementation)
      if (loginData.email !== 'test@example.com' || loginData.password !== 'password123') {
        this.logger.warn('Failed login attempt', {
          email: loginData.email,
          ip: this.getClientIp(request),
          userAgent: request.get('User-Agent')
        });
        throw new Error('Invalid credentials');
      }

      // Create session
      const { sessionId, session } = await this.sessionManagementService.createSession(
        mockUser,
        request,
        {
          rememberMe: loginData.rememberMe,
          deviceTrust: loginData.deviceTrust
        }
      );

      // Set session cookie
      this.setSessionCookie(response, sessionId, session);

      this.logger.log('User logged in successfully', {
        userId: mockUser.id,
        sessionId: sessionId.substring(0, 8) + '...',
        securityLevel: session.securityLevel,
        ip: this.getClientIp(request)
      });

      return {
        sessionId,
        expiresAt: new Date(session.expiresAt).toISOString(),
        securityLevel: session.securityLevel,
        requiresTwoFactor: mockUser.twoFactorEnabled && !session.twoFactorVerified
      };
    } catch (error) {
      this.logger.error('Login failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate current session
   */
  @Get('validate')
  @UseGuards(SessionGuard)
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Validate current session',
    description: 'Validates the current session and returns session information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        sessionId: { type: 'string' },
        userId: { type: 'string' },
        securityLevel: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
        lastActivity: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Session invalid or expired' })
  async validateSession(@Req() request: Request): Promise<{
    valid: boolean;
    sessionId: string;
    userId: string;
    securityLevel: string;
    expiresAt: string;
    lastActivity: string;
    permissions: string[];
  }> {
    const sessionData = request.sessionData!;

    return {
      valid: true,
      sessionId: request.sessionId!,
      userId: sessionData.userId,
      securityLevel: sessionData.securityLevel,
      expiresAt: new Date(sessionData.expiresAt).toISOString(),
      lastActivity: new Date(sessionData.lastActivity).toISOString(),
      permissions: sessionData.permissions
    };
  }

  /**
   * Refresh session (extend expiration)
   */
  @Post('refresh')
  @UseGuards(SessionGuard)
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Refresh session',
    description: 'Extends the current session expiration time'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
        extended: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Session invalid' })
  async refreshSession(@Req() request: Request): Promise<{
    sessionId: string;
    expiresAt: string;
    extended: boolean;
  }> {
    const sessionId = request.sessionId!;
    const extended = await this.sessionManagementService.extendSession(sessionId);

    if (!extended) {
      throw new Error('Failed to extend session');
    }

    // Get updated session data
    const validation = await this.sessionManagementService.validateSession(sessionId, request, {
      updateActivity: false
    });

    this.logger.log('Session refreshed', {
      sessionId: sessionId.substring(0, 8) + '...',
      userId: request.sessionData?.userId
    });

    return {
      sessionId,
      expiresAt: new Date(validation.session!.expiresAt).toISOString(),
      extended: true
    };
  }

  /**
   * Logout (terminate current session)
   */
  @Post('logout')
  @UseGuards(SessionGuard)
  @ApiSecurity('session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Logout (terminate session)',
    description: 'Terminates the current session and clears session cookie'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ success: boolean; message: string }> {
    const sessionId = request.sessionId!;
    const userId = request.sessionData?.userId;

    const invalidated = await this.sessionManagementService.invalidateSession(sessionId);
    
    if (invalidated) {
      // Clear session cookie
      response.clearCookie('sessionId');
      response.clearCookie('sessionId', { signed: true });

      this.logger.log('User logged out', {
        sessionId: sessionId.substring(0, 8) + '...',
        userId
      });
    }

    return {
      success: invalidated,
      message: invalidated ? 'Logged out successfully' : 'Session not found'
    };
  }

  /**
   * Logout from all sessions
   */
  @Post('logout-all')
  @UseGuards(SessionGuard)
  @ApiSecurity('session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Logout from all sessions',
    description: 'Terminates all sessions for the current user except the current one'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'All sessions terminated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        terminatedSessions: { type: 'number' },
        message: { type: 'string' }
      }
    }
  })
  async logoutAll(@Req() request: Request): Promise<{
    success: boolean;
    terminatedSessions: number;
    message: string;
  }> {
    const currentSessionId = request.sessionId!;
    const userId = request.sessionData?.userId!;

    const terminatedCount = await this.sessionManagementService.invalidateAllUserSessions(
      userId,
      currentSessionId
    );

    this.logger.log('All user sessions terminated', {
      userId,
      terminatedCount,
      currentSession: currentSessionId.substring(0, 8) + '...'
    });

    return {
      success: true,
      terminatedSessions: terminatedCount,
      message: `Terminated ${terminatedCount} other sessions`
    };
  }

  /**
   * Get user's all sessions
   */
  @Get('list')
  @UseGuards(SessionGuard)
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'List user sessions',
    description: 'Returns all active sessions for the current user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sessions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              issuedAt: { type: 'string', format: 'date-time' },
              lastActivity: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              ipAddress: { type: 'string' },
              userAgent: { type: 'string' },
              securityLevel: { type: 'string' },
              isCurrent: { type: 'boolean' }
            }
          }
        },
        totalSessions: { type: 'number' }
      }
    }
  })
  async getUserSessions(@Req() request: Request): Promise<SessionListResponse> {
    const currentSessionId = request.sessionId!;
    const userId = request.sessionData?.userId!;

    const sessions = this.sessionManagementService.getUserSessions(userId);

    const sessionList = sessions.map(session => ({
      sessionId: session.sessionId,
      issuedAt: new Date(session.issuedAt).toISOString(),
      lastActivity: new Date(session.lastActivity).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent.substring(0, 100), // Truncate for display
      securityLevel: session.securityLevel,
      isCurrent: session.sessionId === currentSessionId
    }));

    return {
      sessions: sessionList,
      totalSessions: sessions.length
    };
  }

  /**
   * Terminate specific session
   */
  @Delete(':sessionId')
  @UseGuards(SessionGuard)
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Terminate specific session',
    description: 'Terminates a specific session by ID (user can only terminate their own sessions)'
  })
  @ApiParam({ 
    name: 'sessionId', 
    description: 'Session ID to terminate',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session terminated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Cannot terminate other users sessions' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async terminateSession(
    @Param('sessionId') targetSessionId: string,
    @Req() request: Request
  ): Promise<{ success: boolean; message: string }> {
    const currentUserId = request.sessionData?.userId!;
    const userSessions = this.sessionManagementService.getUserSessions(currentUserId);
    
    // Check if the target session belongs to the current user
    const targetSession = userSessions.find(s => s.sessionId === targetSessionId);
    if (!targetSession) {
      throw new Error('Session not found or access denied');
    }

    const invalidated = await this.sessionManagementService.invalidateSession(targetSessionId);

    this.logger.log('Session terminated by user', {
      terminatedSession: targetSessionId.substring(0, 8) + '...',
      userId: currentUserId,
      currentSession: request.sessionId?.substring(0, 8) + '...'
    });

    return {
      success: invalidated,
      message: invalidated ? 'Session terminated successfully' : 'Session not found'
    };
  }

  /**
   * Update session security level (e.g., after 2FA)
   */
  @Post('elevate')
  @UseGuards(SessionGuard)
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Elevate session security',
    description: 'Elevates session security level after additional authentication (e.g., 2FA)'
  })
  @ApiBody({
    description: 'Security elevation request',
    schema: {
      type: 'object',
      properties: {
        twoFactorCode: { type: 'string', minLength: 6, maxLength: 6 },
        targetLevel: { type: 'string', enum: ['elevated', 'admin'] }
      },
      required: ['twoFactorCode']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session security elevated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        newSecurityLevel: { type: 'string' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  async elevateSession(
    @Body() elevationData: { twoFactorCode: string; targetLevel?: string },
    @Req() request: Request
  ): Promise<{
    success: boolean;
    newSecurityLevel: string;
    message: string;
  }> {
    const sessionId = request.sessionId!;
    const currentLevel = request.sessionData?.securityLevel!;

    // TODO: Validate 2FA code with actual 2FA service
    if (elevationData.twoFactorCode !== '123456') {
      throw new Error('Invalid 2FA code');
    }

    // Determine target security level
    const targetLevel = elevationData.targetLevel || 
      (currentLevel === 'standard' ? 'elevated' : 'admin');

    // Update session security
    const updated = await this.sessionManagementService.updateSessionSecurity(sessionId, {
      securityLevel: targetLevel as 'elevated' | 'admin',
      twoFactorVerified: true
    });

    if (!updated) {
      throw new Error('Failed to elevate session security');
    }

    this.logger.log('Session security elevated', {
      sessionId: sessionId.substring(0, 8) + '...',
      userId: request.sessionData?.userId,
      fromLevel: currentLevel,
      toLevel: targetLevel
    });

    return {
      success: true,
      newSecurityLevel: targetLevel,
      message: `Session security elevated to ${targetLevel}`
    };
  }

  /**
   * Get session analytics (admin only)
   */
  @Get('analytics')
  @UseGuards(SessionGuard)
  @RequireElevated()
  @RequireSessionPermissions(['sessions:analytics'])
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Get session analytics',
    description: 'Returns session metrics and analytics (requires elevated permissions)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session analytics retrieved',
    schema: {
      type: 'object',
      properties: {
        totalSessions: { type: 'number' },
        activeSessions: { type: 'number' },
        expiredSessions: { type: 'number' },
        suspiciousSessions: { type: 'number' },
        averageSessionDuration: { type: 'number' },
        concurrentUserSessions: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getSessionAnalytics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    suspiciousSessions: number;
    averageSessionDuration: number;
    averageSessionDurationFormatted: string;
    concurrentUserSessions: Record<string, number>;
    timestamp: string;
  }> {
    const metrics = this.sessionManagementService.getSessionMetrics();

    // Format average duration for readability
    const avgDurationMs = metrics.averageSessionDuration;
    const avgDurationFormatted = this.formatDuration(avgDurationMs);

    // Convert Map to object for JSON serialization
    const concurrentUserSessions = Object.fromEntries(metrics.concurrentUserSessions);

    this.logger.debug('Session analytics requested', {
      totalSessions: metrics.totalSessions,
      activeSessions: metrics.activeSessions
    });

    return {
      totalSessions: metrics.totalSessions,
      activeSessions: metrics.activeSessions,
      expiredSessions: metrics.expiredSessions,
      suspiciousSessions: metrics.suspiciousSessions,
      averageSessionDuration: avgDurationMs,
      averageSessionDurationFormatted: avgDurationFormatted,
      concurrentUserSessions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Set session cookie with security options
   */
  private setSessionCookie(response: Response, sessionId: string, session: SessionConfig): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: session.expiresAt - Date.now(),
      signed: true
    };

    response.cookie('sessionId', sessionId, cookieOptions);
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
   * Format duration in milliseconds to human readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}