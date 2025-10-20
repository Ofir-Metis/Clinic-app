import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { CustomMetricsService } from './custom-metrics.service'; // Temporarily disabled due to dependency issues
// import { DashboardService } from './dashboard.service'; // Temporarily disabled
// import { DashboardController } from './dashboard.controller'; // Temporarily disabled
import { HealthCheckController } from './health-check.controller';
import { CommonModule } from '@clinic/common';

// Production-ready monitoring components
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { CircuitBreakerService } from '../common/circuit-breaker.service';
import { ProductionConfigService } from '../config/production.config';

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
    // DashboardController, // Temporarily disabled
    // HealthCheckController, // Using HealthController from ../health/ instead
    MetricsController
  ],
  providers: [
    // CustomMetricsService, // Temporarily disabled
    // DashboardService // Temporarily disabled
    MetricsService,
    CircuitBreakerService,
    ProductionConfigService
  ],
  exports: [
    // CustomMetricsService, // Temporarily disabled
    // DashboardService // Temporarily disabled
    MetricsService,
    CircuitBreakerService,
    ProductionConfigService
  ]
})
export class MonitoringModule {}