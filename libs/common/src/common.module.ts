/**
 * Common Module - Enterprise-grade shared module for microservices
 * Provides essential services, guards, interceptors, and utilities
 */

import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Core services
import { CentralizedLoggerService } from './logging/centralized-logger.service';
import { StructuredLoggerService } from './logging/structured-logger.service';
import { EnterpriseDatabaseModule } from './database/enterprise-database.module';

// Authentication and security
import { JwtService } from './auth/jwt.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Enhanced security components
import { EnhancedThrottlerGuard } from './guards/enhanced-throttler.guard';
import { PayloadSizeGuard } from './guards/payload-size.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { SessionGuard } from './guards/session.guard';

// Middleware
import { RequestSizeLimitMiddleware } from './middleware/request-size-limit.middleware';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { CsrfSetupMiddleware } from './middleware/csrf-setup.middleware';

// Services
import { SecurityHeadersService } from './services/security-headers.service';
import { CsrfTokenService } from './services/csrf-token.service';
import { SessionManagementService } from './services/session-management.service';
import { SafeQueryService } from './database/safe-query.service';
import { BackupService } from './backup/backup.service';
import { APMService } from './monitoring/apm.service';

// Pipes
import { SanitizationPipe } from './pipes/sanitization.pipe';

// Exception filters
import { AllExceptionsFilter } from './http-exception.filter';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EnterpriseDatabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      }
    ]),
  ],
  providers: [
    // Core logging services with factory providers for enterprise configuration
    {
      provide: CentralizedLoggerService,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('CommonModule');
        try {
          const service = new CentralizedLoggerService(configService);
          const environment = configService.get('NODE_ENV', 'development');
          logger.log(`✅ CentralizedLoggerService initialized for ${environment} environment`);
          return service;
        } catch (error) {
          logger.error('❌ Failed to initialize CentralizedLoggerService:', error.message);
          return new CentralizedLoggerService(configService);
        }
      },
      inject: [ConfigService],
    },
    {
      provide: StructuredLoggerService,
      useFactory: () => {
        const logger = new Logger('CommonModule');
        try {
          const service = new StructuredLoggerService();
          logger.log('✅ StructuredLoggerService initialized');
          return service;
        } catch (error) {
          logger.error('❌ Failed to initialize StructuredLoggerService:', error.message);
          return new StructuredLoggerService();
        }
      },
    },
    
    // Other core services
    JwtService,
    
    // Guards
    JwtAuthGuard,
    EnhancedThrottlerGuard,
    PayloadSizeGuard,
    CsrfGuard,
    SessionGuard,
    
    // Middleware
    RequestSizeLimitMiddleware,
    SecurityHeadersMiddleware,
    CsrfSetupMiddleware,
    
    // Business services
    SecurityHeadersService,
    CsrfTokenService,
    SessionManagementService,
    SafeQueryService,
    BackupService,
    APMService,
    
    // Pipes
    SanitizationPipe,
    
    // Exception filters
    AllExceptionsFilter,
  ],
  exports: [
    // Core database module
    EnterpriseDatabaseModule,
    
    // Core services - now properly provided and exported
    CentralizedLoggerService,
    StructuredLoggerService,
    JwtService,
    
    // Guards
    JwtAuthGuard,
    EnhancedThrottlerGuard,
    PayloadSizeGuard,
    CsrfGuard,
    SessionGuard,
    
    // Middleware
    RequestSizeLimitMiddleware,
    SecurityHeadersMiddleware,
    CsrfSetupMiddleware,
    
    // Business services
    SecurityHeadersService,
    CsrfTokenService,
    SessionManagementService,
    SafeQueryService,
    BackupService,
    APMService,
    
    // Pipes
    SanitizationPipe,
    
    // Exception filters
    AllExceptionsFilter,
  ],
})
export class CommonModule {}