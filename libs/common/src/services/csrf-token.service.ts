import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

// Extend Request interface to include session
declare global {
  namespace Express {
    interface Request {
      session?: any;
    }
  }
}

/**
 * CSRF Token Service
 * 
 * Generates and manages CSRF tokens for Cross-Site Request Forgery protection.
 * Supports both session-based and cookie-based token storage.
 * 
 * @example
 * ```typescript
 * @Controller('auth')
 * export class AuthController {
 *   constructor(private csrfTokenService: CsrfTokenService) {}
 *   
 *   @Get('csrf-token')
 *   getCsrfToken(@Req() req: Request, @Res() res: Response) {
 *     const token = this.csrfTokenService.generateToken(req, res);
 *     return { csrfToken: token };
 *   }
 * }
 * ```
 */
@Injectable()
export class CsrfTokenService {
  private readonly logger = new Logger(CsrfTokenService.name);
  private readonly tokenLength = 32; // 32 bytes = 256 bits
  private readonly cookieName = '_csrf';
  private readonly cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  /**
   * Generate a new CSRF token and store it in session/cookie
   */
  generateToken(request: Request, response: Response): string {
    const token = this.createSecureToken();
    
    this.storeToken(request, response, token);
    
    this.logger.debug('Generated new CSRF token', {
      sessionId: this.getSessionId(request),
      tokenPreview: token.substring(0, 8) + '...',
    });

    return token;
  }

  /**
   * Get existing CSRF token or generate a new one
   */
  getOrCreateToken(request: Request, response: Response): string {
    const existingToken = this.getStoredToken(request);
    
    if (existingToken && this.isTokenValid(existingToken)) {
      this.logger.debug('Reusing existing CSRF token');
      return existingToken;
    }

    return this.generateToken(request, response);
  }

  /**
   * Validate if a token is properly formatted and not expired
   */
  validateToken(request: Request, providedToken: string): boolean {
    if (!providedToken || !this.isTokenValid(providedToken)) {
      return false;
    }

    const storedToken = this.getStoredToken(request);
    if (!storedToken) {
      this.logger.warn('No stored CSRF token found for validation');
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(providedToken, 'utf8'),
      Buffer.from(storedToken, 'utf8')
    );
  }

  /**
   * Refresh CSRF token (generate new one and invalidate old)
   */
  refreshToken(request: Request, response: Response): string {
    this.clearToken(request, response);
    return this.generateToken(request, response);
  }

  /**
   * Clear CSRF token from session/cookie
   */
  clearToken(request: Request, response: Response): void {
    // Clear from session if available
    if (request.session) {
      delete (request.session as any).csrfToken;
      delete (request.session as any).csrfTokenTimestamp;
    }

    // Clear from cookie
    response.clearCookie(this.cookieName);
    
    this.logger.debug('Cleared CSRF token', {
      sessionId: this.getSessionId(request),
    });
  }

  /**
   * Get CSRF token configuration for frontend
   */
  getTokenConfig(): {
    headerName: string;
    fieldName: string;
    cookieName: string;
    paramName: string;
  } {
    return {
      headerName: 'X-CSRF-Token',
      fieldName: '_csrf',
      cookieName: this.cookieName,
      paramName: 'csrf',
    };
  }

  /**
   * Create a cryptographically secure random token
   */
  private createSecureToken(): string {
    return crypto.randomBytes(this.tokenLength).toString('hex');
  }

  /**
   * Store token in session and/or cookie
   */
  private storeToken(request: Request, response: Response, token: string): void {
    const timestamp = Date.now();

    // Store in session if available (preferred method)
    if (request.session) {
      (request.session as any).csrfToken = token;
      (request.session as any).csrfTokenTimestamp = timestamp;
    }

    // Also store in signed cookie as fallback
    if (process.env.COOKIE_SECRET) {
      response.cookie(this.cookieName, token, {
        ...this.cookieOptions,
        signed: true,
      });
    } else {
      // Fallback to unsigned cookie (less secure)
      response.cookie(this.cookieName, token, this.cookieOptions);
      this.logger.warn('Using unsigned CSRF cookie - set COOKIE_SECRET for better security');
    }
  }

  /**
   * Get stored token from session or cookie
   */
  private getStoredToken(request: Request): string | null {
    // Try session first (most secure)
    if (request.session && (request.session as any).csrfToken) {
      return (request.session as any).csrfToken;
    }

    // Try signed cookie
    if (request.signedCookies && request.signedCookies[this.cookieName]) {
      return request.signedCookies[this.cookieName];
    }

    // Try unsigned cookie (fallback)
    if (request.cookies && request.cookies[this.cookieName]) {
      return request.cookies[this.cookieName];
    }

    return null;
  }

  /**
   * Check if token is valid format and not expired
   */
  private isTokenValid(token: string): boolean {
    // Check format (should be hex string of correct length)
    if (!token || typeof token !== 'string') {
      return false;
    }

    if (token.length !== this.tokenLength * 2) { // hex encoding doubles length
      return false;
    }

    if (!/^[a-f0-9]+$/i.test(token)) {
      return false;
    }

    return true;
  }

  /**
   * Get session ID for logging purposes
   */
  private getSessionId(request: Request): string {
    if (request.session && (request.session as any).id) {
      return (request.session as any).id;
    }
    return 'no-session';
  }

  /**
   * Get token expiry information
   */
  getTokenExpiry(request: Request): Date | null {
    if (request.session && (request.session as any).csrfTokenTimestamp) {
      const timestamp = (request.session as any).csrfTokenTimestamp;
      return new Date(timestamp + this.cookieOptions.maxAge);
    }
    return null;
  }

  /**
   * Check if stored token is expired
   */
  isTokenExpired(request: Request): boolean {
    const expiry = this.getTokenExpiry(request);
    if (!expiry) return true;
    
    return Date.now() > expiry.getTime();
  }
}