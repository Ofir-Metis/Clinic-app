/**
 * Logging module exports
 */

// Legacy structured logger
export * from './structured-logger.service';
export type { LogContext, LogEntry, LogLevel } from './structured-logger.service';

// New centralized logging system
export { CentralizedLoggerService } from './centralized-logger.service';
export { CentralizedLoggerModule } from './centralized-logger.module';
export { LoggingModule } from './logging.module';
export { LoggingInterceptor } from './logging.interceptor';
export { LoggingMiddleware } from './logging.middleware';

export type {
  LogContext as CentralizedLogContext,
  HealthcareLogContext
} from './centralized-logger.service';