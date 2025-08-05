import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { VulnerabilityScanner } from './vulnerability-scanner.service';
import { SecurityMonitoringService } from './security-monitoring.service';
import { CentralizedLoggerModule } from '../logging/centralized-logger.module';

/**
 * Security Module
 * 
 * Provides comprehensive security scanning, vulnerability management,
 * and continuous security monitoring capabilities for healthcare-grade
 * clinic management platform.
 * 
 * Features:
 * - Advanced vulnerability scanning (dependencies, containers, code, infrastructure)
 * - Continuous security monitoring and threat detection
 * - Healthcare-specific risk assessment and PHI impact analysis
 * - Real-time security alerting and escalation
 * - HIPAA, SOX, PCI, GDPR compliance monitoring
 * - Automated security reporting and metrics
 */
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    CentralizedLoggerModule
  ],
  providers: [
    VulnerabilityScanner,
    SecurityMonitoringService
  ],
  exports: [
    VulnerabilityScanner,
    SecurityMonitoringService
  ]
})
export class SecurityModule {}