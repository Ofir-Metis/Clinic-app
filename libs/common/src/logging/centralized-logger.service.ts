import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  userAgent?: string;
  ipAddress?: string;
  method?: string;
  url?: string;
  service?: string;
  module?: string;
  action?: string;
  duration?: number;
  statusCode?: number;
  error?: any;
  metadata?: Record<string, any>;
}

export interface HealthcareLogContext extends LogContext {
  // Healthcare entities
  patientId?: string;
  providerId?: string;
  clientId?: string;
  coachId?: string;
  appointmentId?: string;
  
  // Session context
  sessionType?: 'coaching' | 'therapy' | 'consultation';
  dataType?: 'phi' | 'pii' | 'general' | 'system';
  hipaaCompliant?: boolean;
  hipaaRelevant?: boolean;
  auditRequired?: boolean;
  sensitiveData?: boolean;
  
  // Authentication & security
  userEmail?: string;
  endpoint?: string;
  alertLevel?: 'low' | 'medium' | 'high' | 'critical';
  alertId?: string;
  ruleId?: string;
  ruleCount?: number;
  threatLevel?: string;
  scanId?: string;
  vulnerabilitiesFound?: number;
  
  // MFA context
  backupCodeCount?: number;
  remainingBackupCodes?: number;
  disabledBy?: string;
  expiresAt?: string | Date;
  isValid?: boolean;
  
  // Cache context
  cacheType?: string;
  cacheKey?: string;
  cacheHit?: boolean;
  severity?: string;
  
  // Performance & monitoring
  durationMs?: number;
  outcome?: 'success' | 'failure' | 'timeout';
  success?: boolean;
  responseTime?: number;
  
  // Compliance context
  complianceContext?: {
    regulation: 'HIPAA' | 'GDPR' | 'SOC2';
    dataClassification: 'restricted' | 'confidential' | 'internal' | 'public';
    retentionPeriod?: string;
    encryptionRequired?: boolean;
  };
  
  // Additional metadata
  [key: string]: any;
}

@Injectable()
export class CentralizedLoggerService implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly contextStorage = new AsyncLocalStorage<HealthcareLogContext>();
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get<string>('SERVICE_NAME', 'clinic-app');
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
    this.region = this.configService.get<string>('REGION', 'us-east-1');

    this.logger = winston.createLogger({
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      format: this.createLogFormat(),
      defaultMeta: {
        service: this.serviceName,
        environment: this.environment,
        region: this.region,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      },
      transports: this.createTransports(),
      exceptionHandlers: this.createExceptionHandlers(),
      rejectionHandlers: this.createRejectionHandlers()
    });

    // Ensure uncaught exceptions don't crash the process
    this.logger.exitOnError = false;
  }

  private createLogFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.ms(),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'ms']
      }),
      winston.format.json(),
      winston.format.printf((info) => {
        const context = this.contextStorage.getStore() || {};
        const logEntry = {
          ...info,
          ...context,
          '@timestamp': info.timestamp,
          service: this.serviceName,
          environment: this.environment,
          region: this.region,
          level: info.level.toUpperCase(),
          message: info.message,
          ...(info.stack && { stack: info.stack }),
          ...(info.metadata && { metadata: info.metadata })
        };

        // Healthcare-specific log enhancement
        if (context.dataType === 'phi' || context.dataType === 'pii') {
          logEntry.sensitiveData = true;
          logEntry.hipaaCompliant = context.hipaaCompliant ?? true;
          logEntry.auditRequired = true;
        }

        // Add compliance metadata
        if (context.complianceContext) {
          (logEntry as any).compliance = context.complianceContext;
        }

        return JSON.stringify(logEntry);
      })
    );
  }

  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.simple()
        )
      })
    );

    // File transports (production)
    if (this.environment === 'production') {
      // Application logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '100m',
          maxFiles: '30d',
          zippedArchive: true,
          auditFile: 'logs/audit.json'
        })
      );

      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '100m',
          maxFiles: '90d', // Keep error logs longer
          zippedArchive: true,
          auditFile: 'logs/error-audit.json'
        })
      );

      // Healthcare audit logs (separate file)
      transports.push(
        new DailyRotateFile({
          filename: 'logs/healthcare-audit-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '100m',
          maxFiles: '2555d', // 7 years for HIPAA compliance
          zippedArchive: true,
          auditFile: 'logs/healthcare-audit.json',
          format: winston.format.combine(
            winston.format.metadata(),
            winston.format.json(),
            winston.format.printf((info) => {
              const context = this.contextStorage.getStore() || {};
              if (context.auditRequired || context.dataType === 'phi' || context.dataType === 'pii') {
                return JSON.stringify({
                  ...info,
                  auditLog: true,
                  retentionPeriod: '7-years',
                  complianceRequired: true
                });
              }
              return null; // Don't log non-audit entries
            })
          )
        })
      );
    }

    // Elasticsearch transport (if configured)
    const elasticsearchUrl = this.configService.get<string>('ELASTICSEARCH_URL');
    if (elasticsearchUrl) {
      transports.push(
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: elasticsearchUrl,
            auth: {
              username: this.configService.get<string>('ELASTICSEARCH_USERNAME', ''),
              password: this.configService.get<string>('ELASTICSEARCH_PASSWORD', '')
            },
            // SSL configuration handled by Elasticsearch client internally
          },
          index: `clinic-logs-${this.environment}`,
          indexTemplate: {
            name: 'clinic-logs-template',
            pattern: 'clinic-logs-*',
            settings: {
              number_of_shards: 2,
              number_of_replicas: 1,
              'index.lifecycle.name': 'clinic-logs-policy',
              'index.lifecycle.rollover_alias': `clinic-logs-${this.environment}`
            },
            mappings: {
              properties: {
                '@timestamp': { type: 'date' },
                level: { type: 'keyword' },
                message: { type: 'text' },
                service: { type: 'keyword' },
                environment: { type: 'keyword' },
                userId: { type: 'keyword' },
                sessionId: { type: 'keyword' },
                requestId: { type: 'keyword' },
                correlationId: { type: 'keyword' },
                ipAddress: { type: 'ip' },
                userAgent: { type: 'text' },
                method: { type: 'keyword' },
                url: { type: 'keyword' },
                statusCode: { type: 'integer' },
                duration: { type: 'integer' },
                patientId: { type: 'keyword' },
                providerId: { type: 'keyword' },
                dataType: { type: 'keyword' },
                hipaaCompliant: { type: 'boolean' },
                auditRequired: { type: 'boolean' },
                sensitiveData: { type: 'boolean' }
              }
            }
          },
          transformer: (logData) => {
            // Transform log data for Elasticsearch
            return {
              '@timestamp': new Date().toISOString(),
              ...logData.meta,
              message: logData.message,
              level: logData.level
            };
          }
        })
      );
    }

    return transports;
  }

  private createExceptionHandlers(): winston.transport[] {
    const handlers: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];

    if (this.environment === 'production') {
      handlers.push(
        new DailyRotateFile({
          filename: 'logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '100m',
          maxFiles: '90d',
          zippedArchive: true
        })
      );
    }

    return handlers;
  }

  private createRejectionHandlers(): winston.transport[] {
    const handlers: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];

    if (this.environment === 'production') {
      handlers.push(
        new DailyRotateFile({
          filename: 'logs/rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '100m',
          maxFiles: '90d',
          zippedArchive: true
        })
      );
    }

    return handlers;
  }

  // Context management methods
  runWithContext<T>(context: HealthcareLogContext, callback: () => T): T {
    return this.contextStorage.run(context, callback);
  }

  setContext(context: Partial<HealthcareLogContext>): void {
    const currentContext = this.contextStorage.getStore() || {};
    this.contextStorage.enterWith({ ...currentContext, ...context });
  }

  getContext(): HealthcareLogContext | undefined {
    return this.contextStorage.getStore();
  }

  // NestJS LoggerService interface implementation
  log(message: any, context?: string): void {
    this.info(message, { module: context });
  }

  error(message: any, trace?: string, context?: string): void {
    this.logError(message, { stack: trace, module: context });
  }

  warn(message: any, context?: string): void {
    this.warning(message, { module: context });
  }

  debug(message: any, context?: string): void {
    this.logDebug(message, { module: context });
  }

  verbose(message: any, context?: string): void {
    this.info(message, { module: context, verbose: true });
  }

  // Enhanced logging methods
  info(message: string, context?: Partial<HealthcareLogContext>): void {
    const currentContext = this.contextStorage.getStore();
    this.logger.info(message, { ...currentContext, ...context });
  }

  logError(message: string, context?: Partial<HealthcareLogContext>): void {
    const currentContext = this.contextStorage.getStore();
    this.logger.error(message, { ...currentContext, ...context });
  }

  warning(message: string, context?: Partial<HealthcareLogContext>): void {
    const currentContext = this.contextStorage.getStore();
    this.logger.warn(message, { ...currentContext, ...context });
  }

  logDebug(message: string, context?: Partial<HealthcareLogContext>): void {
    const currentContext = this.contextStorage.getStore();
    this.logger.debug(message, { ...currentContext, ...context });
  }

  // Healthcare-specific logging methods
  auditLog(action: string, context: HealthcareLogContext): void {
    this.logger.info(`AUDIT: ${action}`, {
      ...context,
      auditRequired: true,
      auditLog: true,
      complianceContext: context.complianceContext || {
        regulation: 'HIPAA',
        dataClassification: 'restricted',
        retentionPeriod: '7-years',
        encryptionRequired: true
      }
    });
  }

  securityLog(event: string, context: HealthcareLogContext): void {
    this.logger.warn(`SECURITY: ${event}`, {
      ...context,
      securityEvent: true,
      auditRequired: true,
      alertLevel: 'high'
    });
  }

  accessLog(resource: string, action: string, context: HealthcareLogContext): void {
    this.logger.info(`ACCESS: ${action} on ${resource}`, {
      ...context,
      accessLog: true,
      resource,
      action,
      auditRequired: context.dataType === 'phi' || context.dataType === 'pii'
    });
  }

  performanceLog(operation: string, duration: number, context?: Partial<HealthcareLogContext>): void {
    const currentContext = this.contextStorage.getStore();
    this.logger.info(`PERFORMANCE: ${operation} completed in ${duration}ms`, {
      ...currentContext,
      ...context,
      performanceLog: true,
      operation,
      duration,
      performance: {
        operation,
        duration,
        threshold: duration > 5000 ? 'SLOW' : duration > 1000 ? 'MODERATE' : 'FAST'
      }
    });
  }

  businessLog(event: string, context: HealthcareLogContext): void {
    this.logger.info(`BUSINESS: ${event}`, {
      ...context,
      businessEvent: true,
      businessMetrics: true
    });
  }

  // Structured query methods for log analysis
  createLogQuery(filters: {
    level?: string;
    service?: string;
    userId?: string;
    dateRange?: { start: Date; end: Date };
    dataType?: string;
  }): string {
    const query = {
      bool: {
        must: [] as any[]
      }
    };

    if (filters.level) {
      query.bool.must.push({ term: { level: filters.level.toUpperCase() } });
    }

    if (filters.service) {
      query.bool.must.push({ term: { service: filters.service } });
    }

    if (filters.userId) {
      query.bool.must.push({ term: { userId: filters.userId } });
    }

    if (filters.dataType) {
      query.bool.must.push({ term: { dataType: filters.dataType } });
    }

    if (filters.dateRange) {
      query.bool.must.push({
        range: {
          '@timestamp': {
            gte: filters.dateRange.start.toISOString(),
            lte: filters.dateRange.end.toISOString()
          }
        }
      });
    }

    return JSON.stringify(query);
  }

  // Log rotation and cleanup methods
  async cleanupOldLogs(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.info('Starting log cleanup', {
      cutoffDate: cutoffDate.toISOString(),
      retentionDays,
      action: 'log_cleanup'
    });

    // This would integrate with your log management system
    // Implementation depends on your specific setup (filesystem, Elasticsearch, etc.)
  }

  // Health check for logging system
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test logging functionality
      this.logger.info('Health check test log');

      return {
        status: 'healthy',
        details: {
          transports: this.logger.transports.length,
          level: this.logger.level,
          service: this.serviceName,
          environment: this.environment,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}