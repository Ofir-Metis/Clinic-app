import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DisasterRecoveryService } from './disaster-recovery.service';
import { BusinessContinuityService } from './business-continuity.service';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';

export interface DisasterRecoveryModuleOptions {
  isGlobal?: boolean;
  rpo?: number; // Recovery Point Objective in minutes
  rto?: number; // Recovery Time Objective in minutes
  backupRetentionDays?: number;
  replicationMode?: 'sync' | 'async' | 'semi-sync';
  failoverMode?: 'automatic' | 'manual';
  healthCheckInterval?: number;
  backupSchedule?: string;
  enableCrossRegionReplication?: boolean;
  encryptBackups?: boolean;
  enableBusinessContinuity?: boolean;
  enableAutomatedTesting?: boolean;
}

@Global()
@Module({})
export class DisasterRecoveryModule {
  /**
   * Register disaster recovery module synchronously with options
   */
  static register(options: DisasterRecoveryModuleOptions = {}): DynamicModule {
    return {
      module: DisasterRecoveryModule,
      imports: [
        ConfigModule,
        ScheduleModule.forRoot()
      ],
      providers: [
        {
          provide: 'DR_OPTIONS',
          useValue: options
        },
        DisasterRecoveryService,
        ...(options.enableBusinessContinuity !== false ? [BusinessContinuityService] : []),
        CentralizedLoggerService
      ],
      exports: [
        DisasterRecoveryService,
        ...(options.enableBusinessContinuity !== false ? [BusinessContinuityService] : [])
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * Register disaster recovery module asynchronously with config service
   */
  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => DisasterRecoveryModuleOptions | Promise<DisasterRecoveryModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    return {
      module: DisasterRecoveryModule,
      imports: [
        ConfigModule,
        ScheduleModule.forRoot(),
        ...(options.imports || [])
      ],
      providers: [
        {
          provide: 'DR_OPTIONS',
          useFactory: options.useFactory || ((configService: ConfigService) => ({
            rpo: configService.get<number>('DR_RPO_MINUTES', 15),
            rto: configService.get<number>('DR_RTO_MINUTES', 60),
            backupRetentionDays: configService.get<number>('DR_BACKUP_RETENTION_DAYS', 2555), // 7 years
            replicationMode: configService.get<string>('DR_REPLICATION_MODE', 'async') as any,
            failoverMode: configService.get<string>('DR_FAILOVER_MODE', 'manual') as any,
            healthCheckInterval: configService.get<number>('DR_HEALTH_CHECK_INTERVAL', 60000),
            backupSchedule: configService.get<string>('DR_BACKUP_SCHEDULE', '0 2 * * *'),
            enableCrossRegionReplication: configService.get<boolean>('DR_CROSS_REGION_REPLICATION', true),
            encryptBackups: configService.get<boolean>('DR_ENCRYPT_BACKUPS', true),
            enableBusinessContinuity: configService.get<boolean>('DR_ENABLE_BCP', true),
            enableAutomatedTesting: configService.get<boolean>('DR_ENABLE_AUTOMATED_TESTING', true)
          })),
          inject: options.inject || [ConfigService]
        },
        DisasterRecoveryService,
        BusinessContinuityService,
        CentralizedLoggerService
      ],
      exports: [
        DisasterRecoveryService,
        BusinessContinuityService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For root application module - includes all dependencies
   */
  static forRoot(options: DisasterRecoveryModuleOptions = {}): DynamicModule {
    return {
      module: DisasterRecoveryModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        ScheduleModule.forRoot()
      ],
      providers: [
        {
          provide: 'DR_OPTIONS',
          useValue: options
        },
        DisasterRecoveryService,
        BusinessContinuityService,
        CentralizedLoggerService
      ],
      exports: [
        DisasterRecoveryService,
        BusinessContinuityService,
        CentralizedLoggerService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For feature modules that need disaster recovery features
   */
  static forFeature(): DynamicModule {
    return {
      module: DisasterRecoveryModule,
      providers: [],
      exports: [
        DisasterRecoveryService,
        BusinessContinuityService
      ]
    };
  }
}

/**
 * Healthcare-specific disaster recovery module with HIPAA-compliant defaults
 */
@Global()
@Module({})
export class HealthcareDisasterRecoveryModule {
  static forRoot(options: DisasterRecoveryModuleOptions = {}): DynamicModule {
    const healthcareDefaults: DisasterRecoveryModuleOptions = {
      // Healthcare compliance requirements
      rpo: 15, // 15 minutes for healthcare data
      rto: 60, // 1 hour maximum downtime
      
      // 7-year retention for HIPAA compliance
      backupRetentionDays: 2555,
      
      // Secure replication and failover
      replicationMode: 'async',
      failoverMode: 'manual', // Manual failover for healthcare safety
      
      // Frequent health checks for critical systems
      healthCheckInterval: 30000, // 30 seconds
      
      // Daily backups at 2 AM
      backupSchedule: '0 2 * * *',
      
      // Required security features
      enableCrossRegionReplication: true,
      encryptBackups: true,
      enableBusinessContinuity: true,
      enableAutomatedTesting: true,
      
      ...options
    };

    return DisasterRecoveryModule.forRoot(healthcareDefaults);
  }

  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => DisasterRecoveryModuleOptions | Promise<DisasterRecoveryModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    const originalFactory = options.useFactory;
    
    return DisasterRecoveryModule.registerAsync({
      ...options,
      useFactory: originalFactory ? 
        async (...args: any[]) => {
          const config = await originalFactory(...args);
          return {
            // Healthcare defaults
            rpo: 15,
            rto: 60,
            backupRetentionDays: 2555,
            replicationMode: 'async' as any,
            failoverMode: 'manual' as any,
            healthCheckInterval: 30000,
            backupSchedule: '0 2 * * *',
            enableCrossRegionReplication: true,
            encryptBackups: true,
            enableBusinessContinuity: true,
            enableAutomatedTesting: true,
            // Override with provided config
            ...config
          };
        } :
        (configService: ConfigService) => ({
          rpo: configService.get<number>('HEALTHCARE_DR_RPO_MINUTES', 15),
          rto: configService.get<number>('HEALTHCARE_DR_RTO_MINUTES', 60),
          backupRetentionDays: configService.get<number>('HEALTHCARE_DR_BACKUP_RETENTION_DAYS', 2555),
          replicationMode: configService.get<string>('HEALTHCARE_DR_REPLICATION_MODE', 'async') as any,
          failoverMode: configService.get<string>('HEALTHCARE_DR_FAILOVER_MODE', 'manual') as any,
          healthCheckInterval: configService.get<number>('HEALTHCARE_DR_HEALTH_CHECK_INTERVAL', 30000),
          backupSchedule: configService.get<string>('HEALTHCARE_DR_BACKUP_SCHEDULE', '0 2 * * *'),
          enableCrossRegionReplication: configService.get<boolean>('HEALTHCARE_DR_CROSS_REGION_REPLICATION', true),
          encryptBackups: configService.get<boolean>('HEALTHCARE_DR_ENCRYPT_BACKUPS', true),
          enableBusinessContinuity: configService.get<boolean>('HEALTHCARE_DR_ENABLE_BCP', true),
          enableAutomatedTesting: configService.get<boolean>('HEALTHCARE_DR_ENABLE_AUTOMATED_TESTING', true)
        })
    });
  }
}