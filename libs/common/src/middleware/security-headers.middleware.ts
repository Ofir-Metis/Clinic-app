import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 * 
 * Implements comprehensive security headers to protect against various web vulnerabilities:
 * - XSS attacks (X-XSS-Protection, Content-Security-Policy)
 * - Clickjacking (X-Frame-Options)
 * - MIME sniffing (X-Content-Type-Options)
 * - Information disclosure (X-Powered-By removal)
 * - HTTPS enforcement (Strict-Transport-Security)
 * - Referrer policy (Referrer-Policy)
 * - Feature policy restrictions (Permissions-Policy)
 * 
 * @example
 * ```typescript
 * // In main.ts
 * app.use(new SecurityHeadersMiddleware(configService).use);
 * ```
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);
  private readonly isProduction: boolean;
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // Remove server identification headers
      this.removeServerHeaders(res);

      // Set security headers
      this.setContentSecurityPolicy(res);
      this.setFrameOptions(res);
      this.setContentTypeOptions(res);
      this.setXSSProtection(res);
      this.setReferrerPolicy(res);
      this.setPermissionsPolicy(res);
      this.setStrictTransportSecurity(res);
      this.setCacheControlHeaders(res);
      this.setCustomSecurityHeaders(res);

      // Log security headers in development
      if (this.isDevelopment) {
        this.logSecurityHeaders(req, res);
      }

      next();
    } catch (error) {
      this.logger.error('Error setting security headers:', error.message);
      next(); // Continue even if header setting fails
    }
  }

  /**
   * Remove server identification headers
   */
  private removeServerHeaders(res: Response): void {
    // Remove X-Powered-By header (prevents server technology disclosure)
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    // Set generic server header if needed
    if (this.configService.get('SET_GENERIC_SERVER_HEADER') === 'true') {
      res.setHeader('Server', 'Web Server');
    }
  }

  /**
   * Set Content Security Policy (CSP) header
   */
  private setContentSecurityPolicy(res: Response): void {
    const customCSP = this.configService.get('CSP_POLICY');
    
    if (customCSP) {
      res.setHeader('Content-Security-Policy', customCSP);
      return;
    }

    // Default CSP policy for clinic application
    const frontendOrigin = this.configService.get('FRONTEND_ORIGIN', 'http://localhost:5173');
    const apiOrigin = this.configService.get('API_ORIGIN', 'http://localhost:4000');
    
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com ${frontendOrigin} ${apiOrigin}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob:",
      `connect-src 'self' https://api.openai.com https://accounts.google.com ${frontendOrigin} ${apiOrigin} ws: wss:`,
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ];

    // More restrictive CSP for production
    if (this.isProduction) {
      cspDirectives.push("block-all-mixed-content");
    } else {
      // Allow localhost connections in development
      const devConnect = cspDirectives.find(d => d.startsWith('connect-src'));
      if (devConnect) {
        const index = cspDirectives.indexOf(devConnect);
        cspDirectives[index] = devConnect + " http://localhost:* ws://localhost:*";
      }
    }

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    
    // Also set CSP Report-Only for testing new policies
    const reportOnlyCSP = this.configService.get('CSP_REPORT_ONLY');
    if (reportOnlyCSP) {
      res.setHeader('Content-Security-Policy-Report-Only', reportOnlyCSP);
    }
  }

  /**
   * Set X-Frame-Options header (Clickjacking protection)
   */
  private setFrameOptions(res: Response): void {
    const frameOptions = this.configService.get('X_FRAME_OPTIONS', 'DENY');
    res.setHeader('X-Frame-Options', frameOptions);
  }

  /**
   * Set X-Content-Type-Options header (MIME sniffing protection)
   */
  private setContentTypeOptions(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }

  /**
   * Set X-XSS-Protection header
   */
  private setXSSProtection(res: Response): void {
    // Modern browsers rely on CSP, but set for older browser compatibility
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }

  /**
   * Set Referrer-Policy header
   */
  private setReferrerPolicy(res: Response): void {
    const referrerPolicy = this.configService.get('REFERRER_POLICY', 'strict-origin-when-cross-origin');
    res.setHeader('Referrer-Policy', referrerPolicy);
  }

  /**
   * Set Permissions-Policy header (Feature Policy)
   */
  private setPermissionsPolicy(res: Response): void {
    const permissions = [
      'accelerometer=()',
      'autoplay=()',
      'camera=(self)',
      'cross-origin-isolated=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=(self)',
      'midi=()',
      'payment=(self)',
      'picture-in-picture=()',
      'publickey-credentials-get=(self)',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=(self)',
      'xr-spatial-tracking=()'
    ];

    res.setHeader('Permissions-Policy', permissions.join(', '));
  }

  /**
   * Set Strict-Transport-Security header (HSTS)
   */
  private setStrictTransportSecurity(res: Response): void {
    if (this.isProduction) {
      const maxAge = this.configService.get('HSTS_MAX_AGE', '31536000'); // 1 year
      const includeSubDomains = this.configService.get('HSTS_INCLUDE_SUBDOMAINS', 'true') === 'true';
      const preload = this.configService.get('HSTS_PRELOAD', 'true') === 'true';

      let hsts = `max-age=${maxAge}`;
      if (includeSubDomains) hsts += '; includeSubDomains';
      if (preload) hsts += '; preload';

      res.setHeader('Strict-Transport-Security', hsts);
    }
  }

  /**
   * Set cache control headers for security
   */
  private setCacheControlHeaders(res: Response): void {
    // Prevent caching of sensitive endpoints
    const sensitiveEndpoints = [
      '/auth/',
      '/admin/',
      '/api/users/',
      '/csrf/',
      '/health'
    ];

    const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
      res.req?.url?.includes(endpoint)
    );

    if (isSensitiveEndpoint) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }

  /**
   * Set custom security headers specific to clinic application
   */
  private setCustomSecurityHeaders(res: Response): void {
    // Custom headers for healthcare compliance
    res.setHeader('X-Content-Security-Policy', res.getHeader('Content-Security-Policy') || '');
    res.setHeader('X-WebKit-CSP', res.getHeader('Content-Security-Policy') || '');
    
    // Privacy headers for healthcare data
    res.setHeader('X-Privacy-Policy', 'https://clinic-platform.com/privacy');
    res.setHeader('X-Terms-Of-Service', 'https://clinic-platform.com/terms');
    
    // API versioning and deprecation headers
    res.setHeader('X-API-Version', this.configService.get('API_VERSION', '1.0'));
    res.setHeader('X-RateLimit-Policy', 'https://clinic-platform.com/api/rate-limits');
    
    // Security contact for responsible disclosure
    res.setHeader('X-Security-Contact', 'security@clinic-platform.com');
    
    // Indicate security features enabled
    const securityFeatures = [];
    if (this.configService.get('ENABLE_CSRF_PROTECTION') === 'true') {
      securityFeatures.push('csrf');
    }
    if (this.configService.get('ENABLE_RATE_LIMITING') === 'true') {
      securityFeatures.push('rate-limit');
    }
    if (this.configService.get('ENABLE_INPUT_SANITIZATION') === 'true') {
      securityFeatures.push('input-sanitization');
    }
    
    if (securityFeatures.length > 0) {
      res.setHeader('X-Security-Features', securityFeatures.join(','));
    }
  }

  /**
   * Log security headers for debugging in development
   */
  private logSecurityHeaders(req: Request, res: Response): void {
    const securityHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy',
      'Strict-Transport-Security'
    ];

    const setHeaders = securityHeaders
      .filter(header => res.getHeader(header))
      .map(header => `${header}: ${res.getHeader(header)}`)
      .join('\n  ');

    if (setHeaders) {
      this.logger.debug(`Security headers set for ${req.method} ${req.url}:\n  ${setHeaders}`);
    }
  }

  /**
   * Get current security headers configuration
   */
  getSecurityConfig(): {
    csp: string | undefined;
    frameOptions: string;
    referrerPolicy: string;
    hstsEnabled: boolean;
    hstsMaxAge: string;
    features: string[];
  } {
    const features = [];
    if (this.configService.get('ENABLE_CSRF_PROTECTION') === 'true') features.push('CSRF Protection');
    if (this.configService.get('ENABLE_RATE_LIMITING') === 'true') features.push('Rate Limiting');
    if (this.configService.get('ENABLE_INPUT_SANITIZATION') === 'true') features.push('Input Sanitization');

    return {
      csp: this.configService.get('CSP_POLICY'),
      frameOptions: this.configService.get('X_FRAME_OPTIONS', 'DENY'),
      referrerPolicy: this.configService.get('REFERRER_POLICY', 'strict-origin-when-cross-origin'),
      hstsEnabled: this.isProduction,
      hstsMaxAge: this.configService.get('HSTS_MAX_AGE', '31536000'),
      features
    };
  }
}