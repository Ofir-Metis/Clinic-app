import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HIPAAComplianceService } from './hipaa-compliance.service';
import { PHIDataHandlerService } from './phi-data-handler.service';
import { ComplianceAuditService } from './compliance-audit.service';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';

export interface ComplianceModuleOptions {
  isGlobal?: boolean;
  auditRetentionDays?: number;
  phiEncryptionKey?: string;
  hipaaEnforcement?: boolean;
  automaticReporting?: boolean;
  complianceFrameworks?: string[];
}

@Global()
@Module({})
export class ComplianceModule {
  /**
   * Register compliance module synchronously with options
   */
  static register(options: ComplianceModuleOptions = {}): DynamicModule {
    return {
      module: ComplianceModule,
      imports: [
        ConfigModule,
        ScheduleModule.forRoot()
      ],
      providers: [
        {
          provide: 'COMPLIANCE_OPTIONS',
          useValue: options
        },
        HIPAAComplianceService,
        PHIDataHandlerService,
        ComplianceAuditService,
        CentralizedLoggerService
      ],
      exports: [
        HIPAAComplianceService,
        PHIDataHandlerService,
        ComplianceAuditService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * Register compliance module asynchronously with config service
   */
  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => ComplianceModuleOptions | Promise<ComplianceModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    return {
      module: ComplianceModule,
      imports: [
        ConfigModule,
        ScheduleModule.forRoot(),
        ...(options.imports || [])
      ],
      providers: [
        {
          provide: 'COMPLIANCE_OPTIONS',
          useFactory: options.useFactory || ((configService: ConfigService) => ({
            auditRetentionDays: configService.get<number>('AUDIT_RETENTION_DAYS', 2555), // 7 years
            phiEncryptionKey: configService.get<string>('PHI_ENCRYPTION_KEY'),
            hipaaEnforcement: configService.get<boolean>('HIPAA_ENFORCEMENT', true),
            automaticReporting: configService.get<boolean>('AUTOMATIC_COMPLIANCE_REPORTING', true),
            complianceFrameworks: configService.get<string>('COMPLIANCE_FRAMEWORKS', 'HIPAA,SOC2').split(',')
          })),
          inject: options.inject || [ConfigService]
        },
        HIPAAComplianceService,
        PHIDataHandlerService,
        ComplianceAuditService,
        CentralizedLoggerService
      ],
      exports: [
        HIPAAComplianceService,
        PHIDataHandlerService,
        ComplianceAuditService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For root application module - includes all dependencies
   */
  static forRoot(options: ComplianceModuleOptions = {}): DynamicModule {
    return {
      module: ComplianceModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        ScheduleModule.forRoot()
      ],
      providers: [
        {
          provide: 'COMPLIANCE_OPTIONS',
          useValue: options
        },
        HIPAAComplianceService,
        PHIDataHandlerService,
        ComplianceAuditService,
        CentralizedLoggerService
      ],
      exports: [
        HIPAAComplianceService,
        PHIDataHandlerService,
        ComplianceAuditService,
        CentralizedLoggerService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For feature modules that need compliance features
   */
  static forFeature(): DynamicModule {
    return {
      module: ComplianceModule,
      providers: [],
      exports: [
        HIPAAComplianceService,
        PHIDataHandlerService,
        ComplianceAuditService
      ]
    };
  }
}

/**
 * Healthcare-specific compliance module with HIPAA defaults
 */
@Global()
@Module({})
export class HealthcareComplianceModule {
  static forRoot(options: ComplianceModuleOptions = {}): DynamicModule {
    const healthcareDefaults: ComplianceModuleOptions = {
      auditRetentionDays: 2555, // 7 years for HIPAA
      phiEncryptionKey: process.env.HEALTHCARE_PHI_ENCRYPTION_KEY,
      hipaaEnforcement: true,
      automaticReporting: true,
      complianceFrameworks: ['HIPAA', 'HITECH', 'SOC2'],
      ...options
    };

    return ComplianceModule.forRoot(healthcareDefaults);
  }

  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => ComplianceModuleOptions | Promise<ComplianceModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    const originalFactory = options.useFactory;
    
    return ComplianceModule.registerAsync({
      ...options,
      useFactory: originalFactory ? 
        async (...args: any[]) => {
          const config = await originalFactory(...args);
          return {
            auditRetentionDays: 2555, // 7 years
            hipaaEnforcement: true,
            automaticReporting: true,
            complianceFrameworks: ['HIPAA', 'HITECH', 'SOC2'],
            ...config,
            phiEncryptionKey: config.phiEncryptionKey || process.env.HEALTHCARE_PHI_ENCRYPTION_KEY
          };
        } :
        (configService: ConfigService) => ({
          auditRetentionDays: configService.get<number>('AUDIT_RETENTION_DAYS', 2555),
          phiEncryptionKey: configService.get<string>('HEALTHCARE_PHI_ENCRYPTION_KEY') || 
                           configService.get<string>('PHI_ENCRYPTION_KEY'),
          hipaaEnforcement: configService.get<boolean>('HIPAA_ENFORCEMENT', true),
          automaticReporting: configService.get<boolean>('AUTOMATIC_COMPLIANCE_REPORTING', true),
          complianceFrameworks: ['HIPAA', 'HITECH', 'SOC2']
        })
    });
  }
}