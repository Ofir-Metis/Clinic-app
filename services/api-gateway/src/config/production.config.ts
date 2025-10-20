/**
 * Production Configuration Service
 * Centralized configuration for production-ready API Gateway
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  poolSize: number;
  connectionTimeout: number;
  queryTimeout: number;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpirationTime: string;
  bcryptRounds: number;
  corsOrigins: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
  maxRequestSize: string;
}

export interface ServiceConfig {
  natsUrl: string;
  redisHost: string;
  redisPort: number;
  microserviceTimeout: number;
  circuitBreakerTimeout: number;
  circuitBreakerThreshold: number;
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  logLevel: string;
  healthCheckInterval: number;
  enableApiDocs: boolean;
}

@Injectable()
export class ProductionConfigService {
  private readonly logger = new Logger(ProductionConfigService.name);

  constructor(private readonly configService: ConfigService) {
    this.validateRequiredConfig();
    this.logConfigurationStatus();
  }

  getDatabaseConfig(): DatabaseConfig {
    return {
      host: this.configService.get<string>('POSTGRES_HOST', 'localhost'),
      port: this.configService.get<number>('POSTGRES_PORT', 5432),
      username: this.configService.get<string>('POSTGRES_USER', 'postgres'),
      password: this.configService.get<string>('POSTGRES_PASSWORD', 'postgres'),
      database: this.configService.get<string>('POSTGRES_DB', 'clinic'),
      ssl: this.configService.get<string>('DATABASE_SSL_ENABLED', 'false') === 'true',
      poolSize: this.configService.get<number>('DB_POOL_SIZE', 20),
      connectionTimeout: this.configService.get<number>('DB_CONNECTION_TIMEOUT', 10000),
      queryTimeout: this.configService.get<number>('DB_QUERY_TIMEOUT', 30000),
    };
  }

  getSecurityConfig(): SecurityConfig {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long for production');
    }

    return {
      jwtSecret,
      jwtExpirationTime: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
      bcryptRounds: this.configService.get<number>('BCRYPT_ROUNDS', 12),
      corsOrigins: this.getCorsOrigins(),
      rateLimitWindow: this.configService.get<number>('RATE_LIMIT_WINDOW', 60000), // 1 minute
      rateLimitMax: this.configService.get<number>('RATE_LIMIT_MAX', 100),
      maxRequestSize: this.configService.get<string>('MAX_REQUEST_SIZE', '10mb'),
    };
  }

  getServiceConfig(): ServiceConfig {
    return {
      natsUrl: this.configService.get<string>('NATS_URL', 'nats://localhost:4222'),
      redisHost: this.configService.get<string>('REDIS_HOST', 'localhost'),
      redisPort: this.configService.get<number>('REDIS_PORT', 6379),
      microserviceTimeout: this.configService.get<number>('MICROSERVICE_TIMEOUT', 5000),
      circuitBreakerTimeout: this.configService.get<number>('CIRCUIT_BREAKER_TIMEOUT', 3000),
      circuitBreakerThreshold: this.configService.get<number>('CIRCUIT_BREAKER_THRESHOLD', 5),
    };
  }

  getMonitoringConfig(): MonitoringConfig {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    
    return {
      enableMetrics: this.configService.get<string>('ENABLE_METRICS', 'true') === 'true',
      enableTracing: this.configService.get<string>('ENABLE_TRACING', nodeEnv === 'production' ? 'true' : 'false') === 'true',
      logLevel: this.configService.get<string>('LOG_LEVEL', nodeEnv === 'production' ? 'info' : 'debug'),
      healthCheckInterval: this.configService.get<number>('HEALTH_CHECK_INTERVAL', 30000),
      enableApiDocs: this.configService.get<string>('ENABLE_API_DOCS', nodeEnv !== 'production' ? 'true' : 'false') === 'true',
    };
  }

  getPort(): number {
    const port = this.configService.get<number>('PORT', 3000);
    if (port < 1 || port > 65535) {
      throw new Error('PORT must be a valid port number (1-65535)');
    }
    return port;
  }

  getNodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  private getCorsOrigins(): string[] {
    const corsOrigins = this.configService.get<string>('CORS_ORIGINS');
    
    if (corsOrigins) {
      return corsOrigins.split(',').map(origin => origin.trim());
    }

    // Default development origins
    if (!this.isProduction()) {
      return ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'];
    }

    // Production should always specify CORS origins
    this.logger.warn('CORS_ORIGINS not specified for production environment');
    return [];
  }

  private validateRequiredConfig(): void {
    const requiredVars = [
      'JWT_SECRET',
      'POSTGRES_HOST',
      'POSTGRES_USER',
      'POSTGRES_PASSWORD',
      'POSTGRES_DB'
    ];

    const missing = requiredVars.filter(varName => {
      const value = this.configService.get<string>(varName);
      return !value || value.trim().length === 0;
    });

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Additional validation for production
    if (this.isProduction()) {
      const productionVars = ['CORS_ORIGINS', 'REDIS_HOST'];
      const missingProd = productionVars.filter(varName => !this.configService.get<string>(varName));
      
      if (missingProd.length > 0) {
        this.logger.warn(`Missing recommended production environment variables: ${missingProd.join(', ')}`);
      }
    }
  }

  private logConfigurationStatus(): void {
    const dbConfig = this.getDatabaseConfig();
    const securityConfig = this.getSecurityConfig();
    const serviceConfig = this.getServiceConfig();
    const monitoringConfig = this.getMonitoringConfig();

    this.logger.log('🔧 Production Configuration Status:');
    this.logger.log(`   Environment: ${this.getNodeEnv()}`);
    this.logger.log(`   Port: ${this.getPort()}`);
    this.logger.log(`   Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} (SSL: ${dbConfig.ssl})`);
    this.logger.log(`   NATS: ${serviceConfig.natsUrl}`);
    this.logger.log(`   Redis: ${serviceConfig.redisHost}:${serviceConfig.redisPort}`);
    this.logger.log(`   CORS Origins: ${securityConfig.corsOrigins.length} configured`);
    this.logger.log(`   Rate Limiting: ${securityConfig.rateLimitMax} requests per ${securityConfig.rateLimitWindow}ms`);
    this.logger.log(`   Metrics: ${monitoringConfig.enableMetrics ? 'Enabled' : 'Disabled'}`);
    this.logger.log(`   API Docs: ${monitoringConfig.enableApiDocs ? 'Enabled' : 'Disabled'}`);
    this.logger.log(`   Log Level: ${monitoringConfig.logLevel}`);
  }

  // Health check configuration status
  getHealthStatus() {
    return {
      environment: this.getNodeEnv(),
      configuration: {
        database: this.getDatabaseConfig(),
        security: {
          ...this.getSecurityConfig(),
          jwtSecret: '[REDACTED]' // Don't expose secret in health checks
        },
        services: this.getServiceConfig(),
        monitoring: this.getMonitoringConfig()
      },
      timestamp: new Date().toISOString()
    };
  }
}