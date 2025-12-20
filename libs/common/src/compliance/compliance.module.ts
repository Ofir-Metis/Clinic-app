import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
        PHIDataHandlerService,
        ComplianceAuditService,
        CentralizedLoggerService
      ],
      exports: [
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
            automaticReporting: configService.get<boolean>('AUTOMATIC_COMPLIANCE_REPORTING', true),
            complianceFrameworks: configService.get<string>('COMPLIANCE_FRAMEWORKS', 'GDPR,SOC2').split(',')
          })),
          inject: options.inject || [ConfigService]
        },
        PHIDataHandlerService,
        ComplianceAuditService,
        CentralizedLoggerService
      ],
      exports: [
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
        PHIDataHandlerService,
        ComplianceAuditService,
        CentralizedLoggerService
      ],
      exports: [
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
        PHIDataHandlerService,
        ComplianceAuditService
      ]
    };
  }
}

/**
 * Coaching-specific compliance module with GDPR defaults
 */
@Global()
@Module({})
export class CoachingComplianceModule {
  static forRoot(options: ComplianceModuleOptions = {}): DynamicModule {
    const coachingDefaults: ComplianceModuleOptions = {
      auditRetentionDays: 2555, // 7 years for audit compliance
      automaticReporting: true,
      complianceFrameworks: ['GDPR', 'SOC2'],
      ...options
    };

    return ComplianceModule.forRoot(coachingDefaults);
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
            automaticReporting: true,
            complianceFrameworks: ['GDPR', 'SOC2'],
            ...config
          };
        } :
        (configService: ConfigService) => ({
          auditRetentionDays: configService.get<number>('AUDIT_RETENTION_DAYS', 2555),
          automaticReporting: configService.get<boolean>('AUTOMATIC_COMPLIANCE_REPORTING', true),
          complianceFrameworks: ['GDPR', 'SOC2']
        })
    });
  }
}