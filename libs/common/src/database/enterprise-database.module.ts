/**
 * Enterprise Database Module - Production-ready TypeORM configuration
 * Provides DataSource and EntityManager for all microservices
 */

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = {
          type: 'postgres' as const,
          host: configService.get<string>('POSTGRES_HOST', 'localhost'),
          port: configService.get<number>('POSTGRES_PORT', 5432),
          username: configService.get<string>('POSTGRES_USER', 'postgres'),
          password: configService.get<string>('POSTGRES_PASSWORD', 'postgres'),
          database: configService.get<string>('POSTGRES_DB', 'clinic'),
        entities: [],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // Only in development
        autoLoadEntities: true,
        logging: ['query', 'error'] as ('query' | 'error')[],
        retryAttempts: 3,
        retryDelay: 3000,
        maxQueryExecutionTime: 30000, // 30 seconds max query time
        extra: {
          // Connection pool settings for production
          max: 20, // Maximum connections in pool
          min: 5,  // Minimum connections in pool
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000, // Increased to 10 seconds for slower startup
        },
          ssl: configService.get<string>('DATABASE_SSL_ENABLED', 'false') === 'true' ? {
            rejectUnauthorized: false
          } : false,
        };
        
        console.log('🔍 Database Configuration:', {
          host: config.host,
          port: config.port,
          username: config.username,
          database: config.database,
          ssl: config.ssl
        });
        
        return config;
      },
      inject: [ConfigService],
    }),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class EnterpriseDatabaseModule {}