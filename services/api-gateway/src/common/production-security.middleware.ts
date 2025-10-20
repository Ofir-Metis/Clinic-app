/**
 * Production Security Middleware
 * Enhanced security headers and request validation for production
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProductionConfigService } from '../config/production.config';

@Injectable()
export class ProductionSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProductionSecurityMiddleware.name);

  constructor(private readonly productionConfig: ProductionConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    this.setSecurityHeaders(res);
    this.validateRequest(req);
    this.addRequestTracking(req);
    
    next();
  }

  private setSecurityHeaders(res: Response): void {
    const securityConfig = this.productionConfig.getSecurityConfig();
    const isProduction = this.productionConfig.isProduction();

    // Comprehensive security headers for production
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Strict Transport Security (HSTS)
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Content Security Policy for healthcare data protection
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Consider removing unsafe-* in production
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com data:",
      "img-src 'self' data: blob: *.gravatar.com",
      "connect-src 'self' *.anthropic.com wss: ws:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ];

    if (isProduction) {
      cspDirectives.push("block-all-mixed-content");
    }

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

    // Feature Policy / Permissions Policy for privacy
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'gyroscope=()',
      'magnetometer=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ];

    res.setHeader('Permissions-Policy', permissionsPolicy.join(', '));

    // Server identification header
    res.setHeader('X-API-Gateway-Version', '2.0.0');
    res.setHeader('X-Request-Time', new Date().toISOString());
  }

  private validateRequest(req: Request): void {
    // Log suspicious requests
    this.detectSuspiciousActivity(req);
    
    // Validate request size (additional check beyond body-parser limits)
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    const maxSize = 50 * 1024 * 1024; // 50MB absolute max
    
    if (contentLength > maxSize) {
      this.logger.warn(`Large request detected: ${contentLength} bytes from ${req.ip}`);
    }

    // Validate critical headers
    this.validateHeaders(req);
  }

  private detectSuspiciousActivity(req: Request): void {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /hack/i,
      /exploit/i,
      /injection/i,
      /sqlmap/i,
      /nmap/i,
      /scanner/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
      this.logger.warn(`Suspicious user agent detected: ${userAgent} from ${req.ip}`);
    }

    // Check for suspicious paths
    const suspiciousPaths = [
      /\.\./,           // Path traversal
      /<script/i,       // XSS attempts
      /union.*select/i,  // SQL injection
      /eval\(/i,        // Code injection
      /system\(/i,      // Command injection
      /etc\/passwd/i,   // File access attempts
      /proc\/version/i,  // System probing
    ];

    const hasSuspiciousPath = suspiciousPaths.some(pattern => pattern.test(req.path));
    
    if (hasSuspiciousPath) {
      this.logger.error(`Suspicious request path detected: ${req.method} ${req.path} from ${req.ip}`);
    }
  }

  private validateHeaders(req: Request): void {
    // Check for required headers in production
    if (this.productionConfig.isProduction()) {
      const requiredHeaders = ['user-agent', 'accept'];
      
      for (const header of requiredHeaders) {
        if (!req.get(header)) {
          this.logger.warn(`Missing required header '${header}' from ${req.ip}`);
        }
      }
    }

    // Validate content-type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('content-type');
      if (contentType && !this.isValidContentType(contentType)) {
        this.logger.warn(`Invalid content-type '${contentType}' for ${req.method} from ${req.ip}`);
      }
    }
  }

  private isValidContentType(contentType: string): boolean {
    const validTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain',
      'application/xml',
      'text/xml'
    ];

    return validTypes.some(type => contentType.toLowerCase().startsWith(type));
  }

  private addRequestTracking(req: Request): void {
    // Add unique request ID for tracking
    (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add start time for performance tracking
    (req as any).startTime = process.hrtime();
    
    // Log request in production (sampling)
    if (this.productionConfig.isProduction() && Math.random() < 0.01) { // 1% sampling
      this.logger.log(`Request: ${req.method} ${req.path} from ${req.ip} [${(req as any).requestId}]`);
    }
  }
}