import { Module } from '@nestjs/common';
import { SecurityModule } from '@clinic/common/security';
import { CentralizedLoggerModule } from '@clinic/common/logging/centralized-logger.module';
import { SecurityMonitoringController } from './security-monitoring.controller';

/**
 * API Gateway Security Monitoring Module
 * 
 * Exposes comprehensive security monitoring and vulnerability management
 * capabilities through REST API endpoints for administrative use in
 * production healthcare environments.
 */
@Module({
  imports: [
    SecurityModule,
    CentralizedLoggerModule
  ],
  controllers: [SecurityMonitoringController]
})
export class SecurityMonitoringModule {}