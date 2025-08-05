import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to add correlation IDs to requests for audit trail linking
 * Helps track related events across the distributed system
 */
@Injectable()
export class AuditCorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate or use existing correlation ID
    const correlationId = 
      req.headers['x-correlation-id'] as string ||
      req.headers['x-request-id'] as string ||
      uuidv4();

    // Add correlation ID to request headers
    req.headers['x-correlation-id'] = correlationId;

    // Add to response headers for client tracking
    res.setHeader('x-correlation-id', correlationId);

    // Add audit context to request
    (req as any).auditContext = {
      correlationId,
      requestId: uuidv4(),
      timestamp: new Date(),
      traceId: this.generateTraceId(),
    };

    next();
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}