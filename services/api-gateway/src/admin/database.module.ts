/**
 * DatabaseModule - TypeORM configuration for admin database operations
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { AdminUser } from './entities/admin-user.entity';
import { ApiKey } from './entities/api-key.entity';
import { AuditEvent } from './entities/audit-event.entity';
import { SystemConfig } from './entities/system-config.entity';
import { SystemAlert } from './entities/system-alert.entity';
import { BackupJob } from './entities/backup-job.entity';
import { PerformanceMetric } from './entities/performance-metric.entity';

// Repositories
import { AdminUserRepository } from './repositories/admin-user.repository';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { AuditEventRepository } from './repositories/audit-event.repository';
import { PerformanceMetricRepository } from './repositories/performance-metric.repository';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'clinic_admin'),
        entities: [
          AdminUser,
          ApiKey,
          AuditEvent,
          SystemConfig,
          SystemAlert,
          BackupJob,
          PerformanceMetric,
        ],
        synchronize: configService.get('NODE_ENV') === 'development', // Only in development
        logging: configService.get('DB_LOGGING', false),
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        migrations: ['dist/admin/migrations/*.js'],
        migrationsRun: true,
        retryAttempts: 3,
        retryDelay: 3000,
        autoLoadEntities: true,
        keepConnectionAlive: true,
        extra: {
          connectionLimit: 10,
          acquireTimeout: 60000,
          timeout: 60000,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      AdminUser,
      ApiKey,
      AuditEvent,
      SystemConfig,
      SystemAlert,
      BackupJob,
      PerformanceMetric,
    ]),
  ],
  providers: [
    AdminUserRepository,
    ApiKeyRepository,
    AuditEventRepository,
    PerformanceMetricRepository,
  ],
  exports: [
    TypeOrmModule,
    AdminUserRepository,
    ApiKeyRepository,
    AuditEventRepository,
    PerformanceMetricRepository,
  ],
})
export class DatabaseModule {}