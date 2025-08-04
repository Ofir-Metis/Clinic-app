import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// Extend Request interface to include session
declare global {
  namespace Express {
    interface Request {
      session?: any;
    }
  }
}
import * as crypto from 'crypto';

export const CSRF_EXEMPT_KEY = 'csrf_exempt';
export const CsrfExempt = Reflector.createDecorator<boolean>({ key: CSRF_EXEMPT_KEY });

/**
 * CSRF Protection Guard
 * 
 * Implements CSRF token validation to prevent Cross-Site Request Forgery attacks.
 * Validates CSRF tokens for state-changing HTTP methods (POST, PUT, DELETE, PATCH).
 * 
 * Token Sources (in order of precedence):
 * 1. X-CSRF-Token header
 * 2. _csrf form field
 * 3. csrf query parameter
 * 
 * @example
 * ```typescript
 * @Controller('api')
 * @UseGuards(CsrfGuard)
 * export class ApiController {
 *   @Post('data')
 *   createData() { ... }
 *   
 *   @Get('public')
 *   @CsrfExempt()
 *   getPublicData() { ... }
 * }
 * ```
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  private readonly exemptMethods = ['GET', 'HEAD', 'OPTIONS'];
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check if CSRF protection is disabled globally
    if (process.env.ENABLE_CSRF_PROTECTION !== 'true') {
      this.logger.debug('CSRF protection disabled globally');
      return true;
    }

    // Check if endpoint is exempt from CSRF protection
    const isExempt = this.reflector.getAllAndOverride<boolean>(CSRF_EXEMPT_KEY, [
      handler,
      classRef,
    ]);

    if (isExempt) {
      this.logger.debug(`CSRF exempt endpoint: ${request.method} ${request.path}`);
      return true;
    }

    // Skip CSRF check for safe HTTP methods
    if (this.exemptMethods.includes(request.method)) {
      return true;
    }

    // Extract CSRF token from request
    const providedToken = this.extractCsrfToken(request);
    if (!providedToken) {
      this.logger.warn(`CSRF token missing for ${request.method} ${request.path}`, {
        userAgent: request.get('User-Agent'),
        ip: this.getClientIp(request),
      });
      throw new ForbiddenException('CSRF token required');
    }

    // Get expected token from session/cookie
    const expectedToken = this.getExpectedToken(request);
    if (!expectedToken) {
      this.logger.warn(`CSRF session token missing for ${request.method} ${request.path}`, {
        userAgent: request.get('User-Agent'),
        ip: this.getClientIp(request),
      });
      throw new ForbiddenException('CSRF session not established');
    }

    // Validate CSRF token
    if (!this.validateCsrfToken(providedToken, expectedToken)) {
      this.logger.error(`CSRF token validation failed for ${request.method} ${request.path}`, {
        userAgent: request.get('User-Agent'),
        ip: this.getClientIp(request),
        providedToken: providedToken.substring(0, 8) + '...', // Log partial token for debugging
      });
      throw new ForbiddenException('Invalid CSRF token');
    }

    this.logger.debug(`CSRF token validated for ${request.method} ${request.path}`);
    return true;
  }

  /**
   * Extract CSRF token from request headers, body, or query
   */
  private extractCsrfToken(request: Request): string | null {
    // Check X-CSRF-Token header (preferred method)
    let token = request.get('X-CSRF-Token');
    if (token) return token;

    // Check _csrf field in body (for forms)
    if (request.body && typeof request.body === 'object') {
      token = request.body._csrf;
      if (token) return token;
    }

    // Check csrf query parameter (fallback)
    token = request.query.csrf as string;
    if (token) return token;

    return null;
  }

  /**
   * Get expected CSRF token from session or cookie
   */
  private getExpectedToken(request: Request): string | null {
    // Try to get token from session first (if using express-session)
    if (request.session && (request.session as any).csrfToken) {
      return (request.session as any).csrfToken;
    }

    // Try to get token from signed cookie (if using cookie-based sessions)
    if (request.signedCookies && request.signedCookies._csrf) {
      return request.signedCookies._csrf;
    }

    // Try to get token from regular cookie (less secure)
    if (request.cookies && request.cookies._csrf) {
      return request.cookies._csrf;
    }

    return null;
  }

  /**
   * Validate CSRF token using constant-time comparison
   */
  private validateCsrfToken(providedToken: string, expectedToken: string): boolean {
    if (!providedToken || !expectedToken) {
      return false;
    }

    // Ensure tokens are the same length
    if (providedToken.length !== expectedToken.length) {
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(providedToken, 'utf8'),
      Buffer.from(expectedToken, 'utf8')
    );
  }

  /**
   * Get client IP address for logging
   */
  private getClientIp(request: Request): string {
    return (
      request.get('X-Forwarded-For') ||
      request.get('X-Real-IP') ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}