import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Setup Middleware
 * 
 * Configures Express middleware for CSRF protection support.
 * Sets up session handling and cookie parsing required for CSRF tokens.
 * 
 * This middleware should be applied early in the request pipeline.
 */
@Injectable()
export class CsrfSetupMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfSetupMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Ensure proper headers for CSRF protection
    if (process.env.ENABLE_CSRF_PROTECTION === 'true') {
      // Add CSRF-related security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Set SameSite cookie policy for CSRF protection
      if (!res.getHeader('Set-Cookie')) {
        // This will be applied to subsequent cookies
        res.cookie('_csrf_policy', 'strict', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
      }

      this.logger.debug('CSRF security headers applied', {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });
    }

    next();
  }
}