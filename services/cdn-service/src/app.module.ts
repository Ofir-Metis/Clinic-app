import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from '@clinic/common';
import { AssetsModule } from './assets/assets.module';
import { OptimizationModule } from './optimization/optimization.module';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    AssetsModule,
    OptimizationModule,
    CacheModule,
    HealthModule,
  ],
})
export class AppModule {}