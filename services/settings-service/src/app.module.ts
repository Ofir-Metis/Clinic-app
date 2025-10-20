import { Module } from '@nestjs/common';
import { CommonModule } from '@clinic/common';
import { SettingsModule } from './settings/settings.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Enterprise CommonModule provides centralized config, logging, database, and security
    CommonModule,
    SettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
