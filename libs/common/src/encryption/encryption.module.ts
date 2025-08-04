import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdvancedEncryptionService } from './advanced-encryption.service';
import { TLSSecurityService } from './tls-security.service';

export interface EncryptionModuleOptions {
  isGlobal?: boolean;
  encryptionAlgorithm?: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  keyRotationDays?: number;
  compressionEnabled?: boolean;
  tlsMinVersion?: 'TLSv1.2' | 'TLSv1.3';
  tlsMaxVersion?: 'TLSv1.2' | 'TLSv1.3';
  certificatePath?: string;
  privateKeyPath?: string;
  hstsEnabled?: boolean;
  hstsMaxAge?: number;
  ocspStapling?: boolean;
  perfectForwardSecrecy?: boolean;
}

@Global()
@Module({})
export class EncryptionModule {
  /**
   * Register encryption module synchronously with options
   */
  static register(options: EncryptionModuleOptions = {}): DynamicModule {
    return {
      module: EncryptionModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'ENCRYPTION_OPTIONS',
          useValue: options
        },
        AdvancedEncryptionService,
        TLSSecurityService
      ],
      exports: [
        AdvancedEncryptionService,
        TLSSecurityService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * Register encryption module asynchronously with config service
   */
  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => EncryptionModuleOptions | Promise<EncryptionModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    return {
      module: EncryptionModule,
      imports: [ConfigModule, ...(options.imports || [])],
      providers: [
        {
          provide: 'ENCRYPTION_OPTIONS',
          useFactory: options.useFactory || ((configService: ConfigService) => ({
            encryptionAlgorithm: configService.get<string>('ENCRYPTION_ALGORITHM', 'aes-256-gcm') as any,
            keyRotationDays: configService.get<number>('KEY_ROTATION_DAYS', 90),
            compressionEnabled: configService.get<boolean>('ENCRYPTION_COMPRESSION', true),
            tlsMinVersion: configService.get<string>('TLS_MIN_VERSION', 'TLSv1.3') as any,
            tlsMaxVersion: configService.get<string>('TLS_MAX_VERSION', 'TLSv1.3') as any,
            certificatePath: configService.get<string>('TLS_CERT_PATH', './certs/server.crt'),
            privateKeyPath: configService.get<string>('TLS_KEY_PATH', './certs/server.key'),
            hstsEnabled: configService.get<boolean>('HSTS_ENABLED', true),
            hstsMaxAge: configService.get<number>('HSTS_MAX_AGE', 31536000),
            ocspStapling: configService.get<boolean>('TLS_OCSP_STAPLING', true),
            perfectForwardSecrecy: configService.get<boolean>('PERFECT_FORWARD_SECRECY', true)
          })),
          inject: options.inject || [ConfigService]
        },
        AdvancedEncryptionService,
        TLSSecurityService
      ],
      exports: [
        AdvancedEncryptionService,
        TLSSecurityService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For root application module - includes all dependencies
   */
  static forRoot(options: EncryptionModuleOptions = {}): DynamicModule {
    return {
      module: EncryptionModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        })
      ],
      providers: [
        {
          provide: 'ENCRYPTION_OPTIONS',
          useValue: options
        },
        AdvancedEncryptionService,
        TLSSecurityService
      ],
      exports: [
        AdvancedEncryptionService,
        TLSSecurityService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For feature modules that need encryption features
   */
  static forFeature(): DynamicModule {
    return {
      module: EncryptionModule,
      providers: [],
      exports: [
        AdvancedEncryptionService,
        TLSSecurityService
      ]
    };
  }
}

/**
 * Healthcare-specific encryption module with HIPAA-compliant defaults
 */
@Global()
@Module({})
export class HealthcareEncryptionModule {
  static forRoot(options: EncryptionModuleOptions = {}): DynamicModule {
    const healthcareDefaults: EncryptionModuleOptions = {
      // Use strongest encryption available
      encryptionAlgorithm: 'aes-256-gcm',
      
      // Frequent key rotation for healthcare compliance
      keyRotationDays: 30,
      
      // Enable compression for large healthcare data
      compressionEnabled: true,
      
      // Use only TLS 1.3 for maximum security
      tlsMinVersion: 'TLSv1.3',
      tlsMaxVersion: 'TLSv1.3',
      
      // Healthcare-specific certificate paths
      certificatePath: process.env.HEALTHCARE_TLS_CERT_PATH || './certs/healthcare-server.crt',
      privateKeyPath: process.env.HEALTHCARE_TLS_KEY_PATH || './certs/healthcare-server.key',
      
      // Strict HSTS for healthcare
      hstsEnabled: true,
      hstsMaxAge: 63072000, // 2 years
      
      // Required security features
      ocspStapling: true,
      perfectForwardSecrecy: true,
      
      ...options
    };

    return EncryptionModule.forRoot(healthcareDefaults);
  }

  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => EncryptionModuleOptions | Promise<EncryptionModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    const originalFactory = options.useFactory;
    
    return EncryptionModule.registerAsync({
      ...options,
      useFactory: originalFactory ? 
        async (...args: any[]) => {
          const config = await originalFactory(...args);
          return {
            // Healthcare defaults
            encryptionAlgorithm: 'aes-256-gcm' as any,
            keyRotationDays: 30,
            compressionEnabled: true,
            tlsMinVersion: 'TLSv1.3' as any,
            tlsMaxVersion: 'TLSv1.3' as any,
            hstsEnabled: true,
            hstsMaxAge: 63072000,
            ocspStapling: true,
            perfectForwardSecrecy: true,
            // Override with provided config
            ...config,
            // Ensure healthcare certificate paths
            certificatePath: config.certificatePath || process.env.HEALTHCARE_TLS_CERT_PATH || './certs/healthcare-server.crt',
            privateKeyPath: config.privateKeyPath || process.env.HEALTHCARE_TLS_KEY_PATH || './certs/healthcare-server.key'
          };
        } :
        (configService: ConfigService) => ({
          encryptionAlgorithm: 'aes-256-gcm' as any,
          keyRotationDays: configService.get<number>('HEALTHCARE_KEY_ROTATION_DAYS', 30),
          compressionEnabled: configService.get<boolean>('HEALTHCARE_ENCRYPTION_COMPRESSION', true),
          tlsMinVersion: 'TLSv1.3' as any,
          tlsMaxVersion: 'TLSv1.3' as any,
          certificatePath: configService.get<string>('HEALTHCARE_TLS_CERT_PATH', './certs/healthcare-server.crt'),
          privateKeyPath: configService.get<string>('HEALTHCARE_TLS_KEY_PATH', './certs/healthcare-server.key'),
          hstsEnabled: configService.get<boolean>('HEALTHCARE_HSTS_ENABLED', true),
          hstsMaxAge: configService.get<number>('HEALTHCARE_HSTS_MAX_AGE', 63072000),
          ocspStapling: configService.get<boolean>('HEALTHCARE_OCSP_STAPLING', true),
          perfectForwardSecrecy: configService.get<boolean>('HEALTHCARE_PERFECT_FORWARD_SECRECY', true)
        })
    });
  }
}