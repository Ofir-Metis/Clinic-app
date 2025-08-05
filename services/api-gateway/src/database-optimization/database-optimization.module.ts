import { Module } from '@nestjs/common';
import { DatabaseOptimizationModule as CommonDatabaseOptimizationModule } from '@clinic/common/database/database-optimization.module';
import { CentralizedLoggerModule } from '@clinic/common/logging/centralized-logger.module';
import { DatabaseOptimizationController } from './database-optimization.controller';

/**
 * API Gateway Database Optimization Module
 * 
 * Exposes database optimization capabilities through REST API endpoints
 * for administrative use in production healthcare environments.
 */
@Module({
  imports: [
    CommonDatabaseOptimizationModule,
    CentralizedLoggerModule
  ],
  controllers: [DatabaseOptimizationController]
})
export class DatabaseOptimizationModule {}