import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CentralizedLoggerService } from './centralized-logger.service';
import { User } from '../auth/types';

declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      requestId?: string;
      correlationId?: string;
    }
  }
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: CentralizedLoggerService) {}

  use = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId = uuidv4();
    const correlationId = req.headers['x-correlation-id'] as string || requestId;

    // Attach timing and ID information to request
    req.startTime = startTime;
    req.requestId = requestId;
    req.correlationId = correlationId;

    // Set response headers
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Correlation-ID', correlationId);

    // Override res.end to capture response logging
    const originalEnd = res.end;
    const originalWrite = res.write;
    const chunks: Buffer[] = [];

    res.write = function(chunk: any, ...args: any[]) {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      return originalWrite.apply(res, [chunk, ...args]);
    } as any;

    const self = this;
    res.end = function(chunk?: any): any {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }

      const duration = Date.now() - startTime;
      const responseBody = Buffer.concat(chunks).toString('utf8');
      const responseSize = responseBody.length;

      // Create log context
      const logContext = {
        requestId,
        correlationId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ipAddress: getClientIp(req),
        userId: (req.user as any)?.id || (req.user as any)?.sub,
        sessionId: req.sessionId || req.headers['x-session-id'] as string,
        statusCode: res.statusCode,
        duration,
        requestSize: parseInt(req.get('content-length') || '0'),
        responseSize,
        service: process.env.SERVICE_NAME || 'clinic-app'
      };

      // Log the response
      const level = res.statusCode >= 400 ? 'error' : 'info';
      const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;

      if (level === 'error') {
        self.logger.logError(message, {
          ...logContext,
          error: {
            statusCode: res.statusCode,
            responseBody: responseSize < 1000 ? responseBody : '[LARGE_RESPONSE]'
          }
        });
      } else {
        self.logger.info(message, logContext);
      }

      // Performance logging for slow requests
      if (duration > 1000) {
        self.logger.warning(`Slow request: ${req.method} ${req.url}`, {
          ...logContext,
          duration,
          performance: true
        });
      }

      // Security logging
      if (res.statusCode === 401 || res.statusCode === 403) {
        self.logger.warning(`Unauthorized request: ${req.method} ${req.url}`, {
          ...logContext,
          securityEvent: 'unauthorized_request',
          alertLevel: 'medium'
        });
      }

      if (res.statusCode === 429) {
        self.logger.warning(`Rate limit exceeded: ${req.method} ${req.url}`, {
          ...logContext,
          securityEvent: 'rate_limit_exceeded',
          alertLevel: 'low'
        });
      }

      return originalEnd.apply(res, arguments);
    };

    next();
  }
}

function getClientIp(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}