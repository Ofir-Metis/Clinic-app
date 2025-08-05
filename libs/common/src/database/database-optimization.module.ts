import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseOptimizationService } from './database-optimization.service';
import { CentralizedLoggerModule } from '../logging/centralized-logger.module';

/**
 * Database Optimization Module
 * 
 * Provides comprehensive database analysis, optimization, and maintenance
 * capabilities for production environments with healthcare-grade performance.
 */
@Module({
  imports: [
    ConfigModule,
    CentralizedLoggerModule,
    // TypeORM connection will be injected via @InjectDataSource
  ],
  providers: [DatabaseOptimizationService],
  exports: [DatabaseOptimizationService]
})
export class DatabaseOptimizationModule {}