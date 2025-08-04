/**
 * Structured Logger Service - Production-ready logging with comprehensive features
 * Supports multiple log levels, structured logging, correlation IDs, and external integrations
 */

import { Injectable, LoggerService, ConsoleLogger } from '@nestjs/common';
import * as winston from 'winston';
import { Request } from 'express';

export interface LogContext {
  // Request context
  requestId?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  
  // Service context
  service?: string;
  module?: string;
  function?: string;
  
  // Business context
  appointmentId?: string;
  recordingId?: string;
  clientId?: string;
  coachId?: string;
  
  // Performance metrics
  duration?: number;
  startTime?: number;
  endTime?: number;
  
  // Additional metadata
  metadata?: Record<string, any>;
  tags?: string[];
  audit?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  };
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

@Injectable()
export class StructuredLoggerService extends ConsoleLogger {
  private winstonLogger: winston.Logger;
  private readonly service: string;
  private readonly version: string;
  private readonly environment: string;

  constructor() {
    super();
    
    this.service = process.env.SERVICE_NAME || 'clinic-app';
    this.version = process.env.SERVICE_VERSION || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
    
    this.initializeWinstonLogger();
  }

  private initializeWinstonLogger() {
    const isProduction = this.environment === 'production';
    const isDevelopment = this.environment === 'development';

    // Custom format for structured logging
    const structuredFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
      winston.format.json()
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context, error }) => {
        let logLine = `${timestamp} [${level}] ${message}`;
        
        if (context) {
          const contextStr = Object.entries(context)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${value}`)
            .join(' ');
          if (contextStr) {
            logLine += ` | ${contextStr}`;
          }
        }
        
        if (error && error instanceof Error) {
          logLine += `\n${error.stack}`;
        }
        
        return logLine;
      })
    );

    const transports: winston.transport[] = [];

    // Console transport
    transports.push(
      new winston.transports.Console({
        level: isDevelopment ? 'debug' : 'info',
        format: isDevelopment ? consoleFormat : structuredFormat,
      })
    );

    // File transports for production
    if (isProduction) {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: structuredFormat,
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 10,
          tailable: true,
        })
      );

      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: structuredFormat,
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 20,
          tailable: true,
        })
      );

      // Audit log file for sensitive operations
      transports.push(
        new winston.transports.File({
          filename: 'logs/audit.log',
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format((info) => {
              // Only log entries with audit context
              return (info.context as any)?.audit ? info : false;
            })()
          ),
          maxsize: 50 * 1024 * 1024,
          maxFiles: 50, // Keep audit logs longer
          tailable: true,
        })
      );
    }

    // External log aggregation services
    if (process.env.DATADOG_API_KEY) {
      // Add Datadog transport if configured
      const DatadogWinston = require('@datadog/winston');
      transports.push(
        new DatadogWinston({
          apikey: process.env.DATADOG_API_KEY,
          hostname: process.env.HOSTNAME || 'unknown',
          service: this.service,
          ddsource: 'nodejs',
          ddtags: `env:${this.environment},version:${this.version}`,
        })
      );
    }

    if (process.env.ELASTICSEARCH_URL) {
      // Add Elasticsearch transport if configured
      const { ElasticsearchTransport } = require('winston-elasticsearch');
      transports.push(
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: { node: process.env.ELASTICSEARCH_URL },
          index: `clinic-logs-${this.environment}`,
          indexTemplate: {
            index_patterns: [`clinic-logs-${this.environment}-*`],
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
            },
          },
        })
      );
    }

    this.winstonLogger = winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: structuredFormat,
      defaultMeta: {
        service: this.service,
        version: this.version,
        environment: this.environment,
        hostname: process.env.HOSTNAME || 'unknown',
        pid: process.pid,
      },
      transports,
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
      ],
      rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
      ],
      exitOnError: false,
    });
  }

  /**
   * Log with structured context
   */
  logWithContext(level: LogLevel, message: string, context: LogContext = {}, error?: Error) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        service: context.service || this.service,
      },
    };

    // Add error information if provided
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack || '',
        code: (error as any).code,
      };
    }

    // Add performance metrics
    if (context.startTime && context.endTime) {
      logEntry.performance = {
        duration: context.endTime - context.startTime,
        memoryUsage: process.memoryUsage(),
      };
    }

    this.winstonLogger[level](message, logEntry);
  }

  /**
   * Override NestJS logger methods with structured logging
   */
  error(message: any, trace?: string, context?: string) {
    const logContext: LogContext = {
      module: context,
      function: trace ? 'error_trace' : undefined,
    };

    if (typeof message === 'string') {
      this.logWithContext('error', message, logContext);
    } else if (message instanceof Error) {
      this.logWithContext('error', message.message, logContext, message);
    } else {
      this.logWithContext('error', JSON.stringify(message), logContext);
    }

    if (trace) {
      this.winstonLogger.error('Stack trace', { trace, context });
    }
  }

  warn(message: any, context?: string) {
    const logContext: LogContext = { module: context };
    
    if (typeof message === 'string') {
      this.logWithContext('warn', message, logContext);
    } else {
      this.logWithContext('warn', JSON.stringify(message), logContext);
    }
  }

  log(message: any, context?: string) {
    const logContext: LogContext = { module: context };
    
    if (typeof message === 'string') {
      this.logWithContext('info', message, logContext);
    } else {
      this.logWithContext('info', JSON.stringify(message), logContext);
    }
  }

  debug(message: any, context?: string) {
    const logContext: LogContext = { module: context };
    
    if (typeof message === 'string') {
      this.logWithContext('debug', message, logContext);
    } else {
      this.logWithContext('debug', JSON.stringify(message), logContext);
    }
  }

  verbose(message: any, context?: string) {
    const logContext: LogContext = { module: context };
    
    if (typeof message === 'string') {
      this.logWithContext('verbose', message, logContext);
    } else {
      this.logWithContext('verbose', JSON.stringify(message), logContext);
    }
  }

  /**
   * Business operation logging methods
   */
  
  logRecordingOperation(operation: string, recordingId: string, context: Partial<LogContext> = {}) {
    this.logWithContext('info', `Recording ${operation}`, {
      ...context,
      recordingId,
      function: 'recording_operation',
      tags: ['recording', operation],
    });
  }

  logAIOperation(operation: string, duration: number, cost?: number, context: Partial<LogContext> = {}) {
    this.logWithContext('info', `AI ${operation} completed`, {
      ...context,
      function: 'ai_operation',
      duration,
      metadata: { cost },
      tags: ['ai', operation],
    });
  }

  logAuthOperation(operation: string, userId?: string, success: boolean = true, context: Partial<LogContext> = {}) {
    this.logWithContext(success ? 'info' : 'warn', `Authentication ${operation}`, {
      ...context,
      userId,
      function: 'auth_operation',
      tags: ['auth', operation, success ? 'success' : 'failure'],
      audit: true, // Mark as audit log
    });
  }

  logDatabaseOperation(operation: string, table: string, duration: number, context: Partial<LogContext> = {}) {
    this.logWithContext('debug', `Database ${operation} on ${table}`, {
      ...context,
      function: 'database_operation',
      duration,
      metadata: { table },
      tags: ['database', operation, table],
    });
  }

  logStorageOperation(operation: string, key: string, size?: number, context: Partial<LogContext> = {}) {
    this.logWithContext('info', `Storage ${operation}`, {
      ...context,
      function: 'storage_operation',
      metadata: { key, size },
      tags: ['storage', operation],
    });
  }

  logWebSocketEvent(event: string, clientId: string, context: Partial<LogContext> = {}) {
    this.logWithContext('debug', `WebSocket ${event}`, {
      ...context,
      function: 'websocket_event',
      metadata: { clientId },
      tags: ['websocket', event],
    });
  }

  /**
   * Performance monitoring
   */
  logPerformanceMetric(operation: string, duration: number, context: Partial<LogContext> = {}) {
    this.logWithContext('info', `Performance: ${operation}`, {
      ...context,
      function: 'performance_metric',
      duration,
      tags: ['performance', operation],
    });
  }

  /**
   * Security and audit logging
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context: Partial<LogContext> = {}) {
    this.logWithContext(severity === 'critical' ? 'error' : 'warn', `Security: ${event}`, {
      ...context,
      function: 'security_event',
      metadata: { severity },
      tags: ['security', event, severity],
      audit: true,
    });
  }

  logDataAccess(resource: string, operation: string, userId?: string, success: boolean = true, context: Partial<LogContext> = {}) {
    this.logWithContext('info', `Data access: ${operation} ${resource}`, {
      ...context,
      userId,
      function: 'data_access',
      metadata: { resource, operation, success },
      tags: ['data_access', operation, resource],
      audit: true,
    });
  }

  /**
   * Request/Response logging
   */
  logHttpRequest(req: Request, duration?: number, statusCode?: number) {
    const context: LogContext = {
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.id,
      function: 'http_request',
      duration,
      metadata: {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        statusCode,
      },
      tags: ['http', req.method.toLowerCase()],
    };

    this.logWithContext('info', `${req.method} ${req.url}`, context);
  }

  /**
   * Create child logger with default context
   */
  createChildLogger(defaultContext: Partial<LogContext>): StructuredLoggerService {
    const childLogger = new StructuredLoggerService();
    
    // Override logging methods to include default context
    const originalLogWithContext = childLogger.logWithContext.bind(childLogger);
    childLogger.logWithContext = (level: LogLevel, message: string, context: LogContext = {}, error?: Error) => {
      const mergedContext = { ...defaultContext, ...context };
      return originalLogWithContext(level, message, mergedContext, error);
    };

    return childLogger;
  }

  /**
   * Flush logs (useful for testing and shutdown)
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.winstonLogger.on('finish', resolve);
      this.winstonLogger.end();
    });
  }

  /**
   * Get log statistics
   */
  getLogStats(): any {
    return {
      service: this.service,
      version: this.version,
      environment: this.environment,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      // Add more stats as needed
    };
  }
}