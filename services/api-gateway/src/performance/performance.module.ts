import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { PerformanceProfilerService } from './performance-profiler.service';
import { PerformanceOptimizationService } from './performance-optimization.service';
import { PerformanceAnalyticsService } from './performance-analytics.service';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { PerformanceAlert } from './entities/performance-alert.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PerformanceMetric, PerformanceAlert]),
    ScheduleModule.forRoot(),
  ],
  controllers: [PerformanceController],
  providers: [
    PerformanceService,
    PerformanceProfilerService,
    PerformanceOptimizationService,
    PerformanceAnalyticsService,
  ],
  exports: [
    PerformanceService,
    PerformanceProfilerService,
    PerformanceOptimizationService,
    PerformanceAnalyticsService,
  ],
})
export class PerformanceModule {}