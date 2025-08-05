import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { DashboardModule } from './dashboard/dashboard.module';
import { TherapistsModule } from './therapists/therapists.module';
import { SettingsModule } from './settings/settings.module';
import { WebSocketModule } from './websocket/websocket.module';
import { RecordingsModule } from './recordings/recordings.module';
import { GoogleModule } from './google/google.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ProgramsModule } from './programs/programs.module';
import { AIModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ViewSwitchingModule } from './view-switching/view-switching.module';
import { AdminModule } from './admin/admin.module';
import { ComplianceModule } from './compliance/compliance.module';
import { EncryptionModule } from './encryption/encryption.module';
import { DisasterRecoveryModule } from './disaster-recovery/disaster-recovery.module';
import { DatabaseOptimizationModule } from './database-optimization/database-optimization.module';
import { SecurityMonitoringModule } from './security-monitoring/security-monitoring.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { DataRetentionModule } from './data-retention/data-retention.module';
import { AuditModule } from './audit/audit.module';
import { ResilienceModule } from './resilience/resilience.module';
import { CsrfModule, SecurityHeadersModule } from '@clinic/common';
import { AppResolver } from './app.resolver';
import { HealthController } from './health/health.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { SettingsService } from './settings/settings.service';
import { TherapistsService } from './therapists/therapists.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: +(process.env.POSTGRES_PORT || 5432),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'clinic',
      autoLoadEntities: true,
      synchronize: false, // Disable auto-sync to prevent JSON index issues
      logging: process.env.NODE_ENV === 'development',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'strict',
        ttl: 900000, // 15 minutes
        limit: 5, // 5 requests per 15 minutes for sensitive endpoints
      },
      {
        name: 'moderate',
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests per minute for API endpoints
      },
      {
        name: 'lenient',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute for read operations
      },
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 60, // Default 60 requests per minute
      },
    ]),
    HttpModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'gateway-schema.gql'),
    }),
    DashboardModule,
    TherapistsModule,
    SettingsModule,
    WebSocketModule,
    RecordingsModule,
    GoogleModule,
    OnboardingModule,
    ProgramsModule,
    AIModule,
    AnalyticsModule,
    ViewSwitchingModule,
    AdminModule,
    ComplianceModule,
    EncryptionModule,
    DisasterRecoveryModule,
    DatabaseOptimizationModule,
    SecurityMonitoringModule,
    MonitoringModule,
    DataRetentionModule,
    AuditModule,
    ResilienceModule,
    CsrfModule,
    SecurityHeadersModule,
  ],
  controllers: [AuthController, HealthController],
  providers: [
    DashboardService,
    SettingsService,
    TherapistsService,
    AppResolver,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
