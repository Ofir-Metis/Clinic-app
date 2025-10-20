import { Module } from '@nestjs/common';
import { CommonModule } from '@clinic/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Enterprise CommonModule provides centralized config, logging, database, and security
    CommonModule,
    AnalyticsModule
  ],
  controllers: [HealthController],
})
export class AppModule {}
