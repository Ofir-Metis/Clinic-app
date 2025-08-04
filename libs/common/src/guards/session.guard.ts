import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SessionManagementService } from '../services/session-management.service';

// Extend Request interface to include session
declare global {
  namespace Express {
    interface Request {
      session?: any;
      sessionId?: string;
      sessionData?: any;
    }
  }
}

export const SESSION_EXEMPT_KEY = 'session_exempt';
export const REQUIRE_ELEVATED_KEY = 'require_elevated';
export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

export const SessionExempt = Reflector.createDecorator<boolean>({ key: SESSION_EXEMPT_KEY });
export const RequireElevated = Reflector.createDecorator<boolean>({ key: REQUIRE_ELEVATED_KEY });
export const RequireSessionPermissions = Reflector.createDecorator<string[]>({ key: REQUIRED_PERMISSIONS_KEY });

/**
 * Session Guard
 * 
 * Validates user sessions and enforces security policies:
 * - Session existence and validity
 * - Session expiration and inactivity timeouts
 * - Security level requirements (standard, elevated, admin)
 * - Permission-based access control
 * - Device and IP address validation
 * - Automatic session rotation
 * 
 * @example
 * ```typescript
 * @Controller('api')
 * @UseGuards(SessionGuard)
 * export class ApiController {
 *   @Get('profile')
 *   getProfile() { ... } // Requires valid session
 *   
 *   @Post('admin/users')
 *   @RequireElevated()
 *   createUser() { ... } // Requires elevated session
 *   
 *   @Delete('admin/system')
 *   @RequirePermissions(['system:delete'])
 *   deleteSystem() { ... } // Requires specific permission
 *   
 *   @Get('public/health')
 *   @SessionExempt()
 *   healthCheck() { ... } // Public endpoint
 * }
 * ```
 */
@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);

  constructor(
    private reflector: Reflector,
    private sessionManagementService: SessionManagementService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check if endpoint is exempt from session validation
    const isExempt = this.reflector.getAllAndOverride<boolean>(SESSION_EXEMPT_KEY, [
      handler,
      classRef,
    ]);

    if (isExempt) {
      this.logger.debug(`Session exempt endpoint: ${request.method} ${request.path}`);
      return true;
    }

    // Extract session ID from request
    const sessionId = this.extractSessionId(request);
    if (!sessionId) {
      this.logger.warn(`Session ID missing for ${request.method} ${request.path}`, {
        userAgent: request.get('User-Agent'),
        ip: this.getClientIp(request),
      });
      throw new UnauthorizedException('Session required');
    }

    // Get security requirements from decorators
    const requireElevated = this.reflector.getAllAndOverride<boolean>(REQUIRE_ELEVATED_KEY, [
      handler,
      classRef,
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      handler,
      classRef,
    ]) || [];

    // Validate session
    const validation = await this.sessionManagementService.validateSession(sessionId, request, {
      updateActivity: true,
      requireElevated,
      requiredPermissions,
    });

    if (!validation.isValid) {
      this.logger.warn(`Session validation failed for ${request.method} ${request.path}`, {
        sessionId: sessionId.substring(0, 8) + '...',
        reason: validation.reason,
        securityAlert: validation.securityAlert,
        userAgent: request.get('User-Agent'),
        ip: this.getClientIp(request),
      });

      // Handle security alerts
      if (validation.securityAlert) {
        this.logger.error('Security alert: Suspicious session activity', {
          sessionId: sessionId.substring(0, 8) + '...',
          reason: validation.reason,
          endpoint: `${request.method} ${request.path}`,
          userAgent: request.get('User-Agent'),
          ip: this.getClientIp(request),
        });
      }

      if (validation.requiresReauthentication) {
        throw new UnauthorizedException('Reauthentication required');
      }

      throw new UnauthorizedException(validation.reason || 'Session invalid');
    }

    // Attach session data to request for use in controllers
    request.sessionId = sessionId;
    request.sessionData = validation.session;

    // Log successful session validation
    this.logger.debug(`Session validated for ${request.method} ${request.path}`, {
      sessionId: sessionId.substring(0, 8) + '...',
      userId: validation.session?.userId,
      securityLevel: validation.session?.securityLevel,
    });

    return true;
  }

  /**
   * Extract session ID from request
   * Supports multiple session ID sources in order of preference:
   * 1. Authorization header (Bearer token)
   * 2. X-Session-ID header
   * 3. session cookie
   * 4. sessionId query parameter
   */
  private extractSessionId(request: Request): string | null {
    // 1. Authorization header (Bearer token)
    const authHeader = request.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. X-Session-ID header
    const sessionHeader = request.get('X-Session-ID');
    if (sessionHeader) {
      return sessionHeader;
    }

    // 3. Session cookie
    if (request.cookies && request.cookies.sessionId) {
      return request.cookies.sessionId;
    }

    // 4. Signed session cookie (more secure)
    if (request.signedCookies && request.signedCookies.sessionId) {
      return request.signedCookies.sessionId;
    }

    // 5. Query parameter (least secure, for debugging only)
    if (request.query.sessionId && typeof request.query.sessionId === 'string') {
      return request.query.sessionId;
    }

    return null;
  }

  /**
   * Get client IP address for logging
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
}