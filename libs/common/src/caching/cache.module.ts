import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheManagerService } from './cache-manager.service';
import { CacheInterceptor } from './cache.interceptor';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';

export interface CacheModuleOptions {
  isGlobal?: boolean;
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
  redisDb?: number;
  clusterNodes?: string;
  defaultTTL?: number;
  maxMemoryUsage?: number;
  compressionThreshold?: number;
  encryptionKey?: string;
  keyPrefix?: string;
}

@Global()
@Module({})
export class CacheModule {
  /**
   * Register cache module synchronously with options
   */
  static register(options: CacheModuleOptions = {}): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ConfigModule,
        HttpModule
      ],
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useValue: options
        },
        CacheManagerService,
        CacheInterceptor,
        CentralizedLoggerService
      ],
      exports: [
        CacheManagerService,
        CacheInterceptor
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * Register cache module asynchronously with config service
   */
  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => CacheModuleOptions | Promise<CacheModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ConfigModule,
        HttpModule,
        ...(options.imports || [])
      ],
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useFactory: options.useFactory || ((configService: ConfigService) => ({
            redisHost: configService.get<string>('REDIS_HOST', 'localhost'),
            redisPort: configService.get<number>('REDIS_PORT', 6379),
            redisPassword: configService.get<string>('REDIS_PASSWORD'),
            redisDb: configService.get<number>('REDIS_DB', 0),
            clusterNodes: configService.get<string>('REDIS_CLUSTER_NODES'),
            defaultTTL: configService.get<number>('CACHE_DEFAULT_TTL', 3600),
            maxMemoryUsage: configService.get<number>('CACHE_MAX_MEMORY', 1024 * 1024 * 100),
            compressionThreshold: configService.get<number>('CACHE_COMPRESSION_THRESHOLD', 1024),
            encryptionKey: configService.get<string>('CACHE_ENCRYPTION_KEY'),
            keyPrefix: configService.get<string>('CACHE_KEY_PREFIX', 'clinic:')
          })),
          inject: options.inject || [ConfigService]
        },
        CacheManagerService,
        CacheInterceptor,
        CentralizedLoggerService
      ],
      exports: [
        CacheManagerService,
        CacheInterceptor
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For root application module - includes all dependencies
   */
  static forRoot(options: CacheModuleOptions = {}): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        HttpModule.register({
          timeout: 5000,
          maxRedirects: 3,
        })
      ],
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useValue: options
        },
        CacheManagerService,
        CacheInterceptor,
        CentralizedLoggerService
      ],
      exports: [
        CacheManagerService,
        CacheInterceptor,
        CentralizedLoggerService
      ],
      global: options.isGlobal !== false
    };
  }

  /**
   * For feature modules that need caching
   */
  static forFeature(): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        CacheInterceptor
      ],
      exports: [
        CacheManagerService,
        CacheInterceptor
      ]
    };
  }
}

/**
 * Healthcare-specific cache module with HIPAA compliance defaults
 */
@Global()
@Module({})
export class HealthcareCacheModule {
  static forRoot(options: CacheModuleOptions = {}): DynamicModule {
    const healthcareDefaults: CacheModuleOptions = {
      defaultTTL: 1800, // 30 minutes for healthcare data
      maxMemoryUsage: 1024 * 1024 * 50, // 50MB for sensitive data
      compressionThreshold: 512, // Compress smaller payloads for security
      encryptionKey: process.env.HEALTHCARE_CACHE_ENCRYPTION_KEY,
      keyPrefix: 'healthcare:',
      ...options
    };

    return CacheModule.forRoot(healthcareDefaults);
  }

  static registerAsync(options: {
    isGlobal?: boolean;
    imports?: any[];
    useFactory?: (...args: any[]) => CacheModuleOptions | Promise<CacheModuleOptions>;
    inject?: any[];
  } = {}): DynamicModule {
    const originalFactory = options.useFactory;
    
    return CacheModule.registerAsync({
      ...options,
      useFactory: originalFactory ? 
        async (...args: any[]) => {
          const config = await originalFactory(...args);
          return {
            defaultTTL: 1800,
            maxMemoryUsage: 1024 * 1024 * 50,
            compressionThreshold: 512,
            keyPrefix: 'healthcare:',
            ...config,
            encryptionKey: config.encryptionKey || process.env.HEALTHCARE_CACHE_ENCRYPTION_KEY
          };
        } :
        (configService: ConfigService) => ({
          redisHost: configService.get<string>('REDIS_HOST', 'localhost'),
          redisPort: configService.get<number>('REDIS_PORT', 6379),
          redisPassword: configService.get<string>('REDIS_PASSWORD'),
          redisDb: configService.get<number>('REDIS_DB', 0),
          clusterNodes: configService.get<string>('REDIS_CLUSTER_NODES'),
          defaultTTL: 1800, // Healthcare default: 30 minutes
          maxMemoryUsage: 1024 * 1024 * 50, // 50MB for healthcare data
          compressionThreshold: 512,
          encryptionKey: configService.get<string>('HEALTHCARE_CACHE_ENCRYPTION_KEY') || 
                        configService.get<string>('CACHE_ENCRYPTION_KEY'),
          keyPrefix: 'healthcare:'
        })
    });
  }
}