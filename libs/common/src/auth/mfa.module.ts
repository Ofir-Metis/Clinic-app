import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MFAService } from './mfa.service';
import { MFAStorageService } from './mfa-storage.service';
import { MFAGuard, RoleBasedMFAGuard } from './mfa.guard';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';

export interface MFAModuleOptions {
  isGlobal?: boolean;
  issuer?: string;
  serviceName?: string;
  window?: number;
  backupCodeCount?: number;
  backupCodeLength?: number;
  encryptionKey?: string;
}

@Global()
@Module({})
export class MFAModule {
  /**
   * Register MFA module synchronously with options
   */
  static register(options: MFAModuleOptions = {}): DynamicModule {
    return {
      module: MFAModule,
      imports: [
        ConfigModule
      ],
      providers: [
        {
          provide: 'MFA_OPTIONS',
          useValue: options
        },
        MFAService,
        MFAStorageService,
        MFAGuard,
        RoleBasedMFAGuard,
        CentralizedLoggerService
      ],
      exports: [
        MFAService,
        MFAStorageService,
        MFAGuard,
        RoleBasedMFAGuard
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * Register MFA module asynchronously with config service
   */
  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => MFAModuleOptions | Promise<MFAModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    return {
      module: MFAModule,
      imports: [
        ConfigModule,
        ...(options.imports || [])
      ],
      providers: [
        {
          provide: 'MFA_OPTIONS',
          useFactory: options.useFactory || ((configService: ConfigService) => ({
            issuer: configService.get<string>('MFA_ISSUER', 'Clinic Management Platform'),
            serviceName: configService.get<string>('MFA_SERVICE_NAME', 'Clinic App'),
            window: configService.get<number>('MFA_WINDOW', 1),
            backupCodeCount: configService.get<number>('MFA_BACKUP_CODE_COUNT', 10),
            backupCodeLength: configService.get<number>('MFA_BACKUP_CODE_LENGTH', 8),
            encryptionKey: configService.get<string>('MFA_ENCRYPTION_KEY')
          })),
          inject: options.inject || [ConfigService]
        },
        MFAService,
        MFAStorageService,
        MFAGuard,
        RoleBasedMFAGuard,
        CentralizedLoggerService
      ],
      exports: [
        MFAService,
        MFAStorageService,
        MFAGuard,
        RoleBasedMFAGuard
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For root application module - includes all dependencies
   */
  static forRoot(options: MFAModuleOptions = {}): DynamicModule {
    return {
      module: MFAModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        })
      ],
      providers: [
        {
          provide: 'MFA_OPTIONS',
          useValue: options
        },
        MFAService,
        MFAStorageService,
        MFAGuard,
        RoleBasedMFAGuard,
        CentralizedLoggerService
      ],
      exports: [
        MFAService,
        MFAStorageService,
        MFAGuard,
        RoleBasedMFAGuard,
        CentralizedLoggerService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For feature modules that need MFA functionality
   */
  static forFeature(): DynamicModule {
    return {
      module: MFAModule,
      providers: [
        MFAGuard,
        RoleBasedMFAGuard
      ],
      exports: [
        MFAService,
        MFAStorageService,
        MFAGuard,
        RoleBasedMFAGuard
      ]
    };
  }
}

/**
 * Healthcare-specific MFA module with enhanced security defaults
 */
@Global()
@Module({})
export class HealthcareMFAModule {
  static forRoot(options: MFAModuleOptions = {}): DynamicModule {
    const healthcareDefaults: MFAModuleOptions = {
      issuer: 'Healthcare Clinic Platform',
      serviceName: 'Clinic MFA',
      window: 1, // Strict time window for healthcare
      backupCodeCount: 10,
      backupCodeLength: 8,
      encryptionKey: process.env.HEALTHCARE_MFA_ENCRYPTION_KEY,
      ...options
    };

    return MFAModule.forRoot(healthcareDefaults);
  }

  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => MFAModuleOptions | Promise<MFAModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    const originalFactory = options.useFactory;
    
    return MFAModule.registerAsync({
      ...options,
      useFactory: originalFactory ? 
        async (...args: any[]) => {
          const config = await originalFactory(...args);
          return {
            issuer: 'Healthcare Clinic Platform',
            serviceName: 'Clinic MFA',
            window: 1,
            backupCodeCount: 10,
            backupCodeLength: 8,
            ...config,
            encryptionKey: config.encryptionKey || process.env.HEALTHCARE_MFA_ENCRYPTION_KEY
          };
        } :
        (configService: ConfigService) => ({
          issuer: configService.get<string>('MFA_ISSUER', 'Healthcare Clinic Platform'),
          serviceName: configService.get<string>('MFA_SERVICE_NAME', 'Clinic MFA'),
          window: configService.get<number>('MFA_WINDOW', 1),
          backupCodeCount: configService.get<number>('MFA_BACKUP_CODE_COUNT', 10),
          backupCodeLength: configService.get<number>('MFA_BACKUP_CODE_LENGTH', 8),
          encryptionKey: configService.get<string>('HEALTHCARE_MFA_ENCRYPTION_KEY') || 
                        configService.get<string>('MFA_ENCRYPTION_KEY')
        })
    });
  }
}