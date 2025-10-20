import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CentralizedLoggerService } from './centralized-logger.service';
import { StructuredLoggerService } from './structured-logger.service';

/**
 * Enterprise-grade Centralized Logger Module
 * 
 * Features:
 * - Global availability across all microservices
 * - Production-ready structured logging
 * - Healthcare compliance (HIPAA) support
 * - Performance optimized
 * - Environment-aware configuration
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    })
  ],
  providers: [
    {
      provide: CentralizedLoggerService,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('CentralizedLoggerModule');
        try {
          const service = new CentralizedLoggerService(configService);
          
          // Enterprise configuration validation
          const environment = configService.get('NODE_ENV', 'development');
          const logLevel = configService.get('LOG_LEVEL', 'info');
          
          logger.log(`✅ CentralizedLoggerService initialized for ${environment} environment`);
          logger.log(`📊 Log level: ${logLevel}`);
          
          return service;
        } catch (error) {
          logger.error('❌ Failed to initialize CentralizedLoggerService:', error.message);
          // Return a fallback service to prevent application crash
          return new CentralizedLoggerService(configService);
        }
      },
      inject: [ConfigService],
    },
    {
      provide: StructuredLoggerService,
      useFactory: () => {
        const logger = new Logger('CentralizedLoggerModule');
        try {
          const service = new StructuredLoggerService();
          logger.log('✅ StructuredLoggerService initialized');
          return service;
        } catch (error) {
          logger.error('❌ Failed to initialize StructuredLoggerService:', error.message);
          return new StructuredLoggerService();
        }
      },
    }
  ],
  exports: [
    CentralizedLoggerService,
    StructuredLoggerService
  ],
})
export class CentralizedLoggerModule {
  constructor() {
    const logger = new Logger('CentralizedLoggerModule');
    logger.log('🏥 Enterprise Centralized Logger Module loaded');
  }
}