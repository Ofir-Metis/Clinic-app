import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomMetricsService } from './custom-metrics.service';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { HealthCheckController } from './health-check.controller';
import { CommonModule } from '@clinic/common';

/**
 * Monitoring Module
 * 
 * Provides comprehensive monitoring capabilities including:
 * - Custom healthcare metrics collection
 * - Real-time dashboards with configurable widgets
 * - System health monitoring and alerting
 * - Performance metrics and business KPIs
 * - HIPAA compliance monitoring
 */

@Module({
  imports: [
    CommonModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      // Add any entities needed for metrics collection
    ])
  ],
  controllers: [
    DashboardController,
    HealthCheckController
  ],
  providers: [
    CustomMetricsService,
    DashboardService
  ],
  exports: [
    CustomMetricsService,
    DashboardService
  ]
})
export class MonitoringModule {}