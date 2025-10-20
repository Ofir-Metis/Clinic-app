/**
 * DatabaseModule - TypeORM configuration for admin database operations
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
    // Use the shared database connection from CommonModule
    // Remove duplicate TypeOrmModule.forRootAsync to prevent connection pool conflicts
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