import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { CommonModule } from '@clinic/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClientsModule } from './clients/clients.module';
import { PatientsModule } from './patients/patients.module';
import { CoachesModule } from './coaches/coaches.module';
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
// import { EncryptionModule } from './encryption/encryption.module'; // Temporarily disabled for debugging
// import { DisasterRecoveryModule } from './disaster-recovery/disaster-recovery.module'; // Disabled due to BusinessContinuityService dependency
// import { DatabaseOptimizationModule } from './database-optimization/database-optimization.module'; // Temporarily disabled for import issues
// import { SecurityMonitoringModule } from './security-monitoring/security-monitoring.module'; // Temporarily disabled for import issues
import { MonitoringModule } from './monitoring/monitoring.module';
// import { DataRetentionModule } from './data-retention/data-retention.module'; // Temporarily disabled
import { AuditModule } from './audit/audit.module';
import { ResilienceModule } from './resilience/resilience.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { CommunicationModule } from './communication/communication.module';
import { CsrfModule, SecurityHeadersModule } from '@clinic/common';
import { AppResolver } from './app.resolver';
import { HealthController } from './health/health.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { SettingsService } from './settings/settings.service';
import { CoachesService } from './coaches/coaches.service';
import { AuthController } from './auth.controller';
import { TestController } from './test.controller';
import { VoiceNotesModule } from './voice-notes/voice-notes.module';
import { ProgressModule } from './progress/progress.module';
import { RelationshipsModule } from './relationships/relationships.module';

@Module({
  imports: [
    // Use CommonModule which includes enterprise database configuration
    CommonModule,
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
      cache: 'bounded', // Fix Apollo Server security vulnerability
      persistedQueries: false, // Fix Apollo Server security vulnerability
    }),
    DashboardModule,
    ClientsModule,
    PatientsModule,
    CoachesModule, // Enabled for coach discovery and search
    SettingsModule,
    WebSocketModule, // Enabled - WebSocket support for real-time features
    // RecordingsModule, // Keep disabled - storage dependencies
    GoogleModule, // Enabled for Google Calendar/Meet/Gmail integration
    // OnboardingModule, // Keep disabled
    // ProgramsModule, // Keep disabled
    // AIModule, // Keep disabled
    // AnalyticsModule, // Keep disabled
    // ViewSwitchingModule, // Keep disabled
    AdminModule,
    AppointmentsModule,
    CommunicationModule, // Messaging between coaches and clients
    // ComplianceModule, // Keep disabled - HIPAA dependencies
    // EncryptionModule, // Temporarily disabled for debugging
    // DisasterRecoveryModule, // Temporarily disabled
    // DatabaseOptimizationModule, // Temporarily disabled for import issues
    // SecurityMonitoringModule, // Temporarily disabled for import issues
    MonitoringModule,
    // DataRetentionModule, // Keep disabled - complex dependencies
    AuditModule,
    ResilienceModule,
    VoiceNotesModule, // Voice-to-text note recording
    ProgressModule, // Client progress tracking and goal management
    RelationshipsModule, // Client-coach connection requests and relationship management
    // CsrfModule, // Already included in CommonModule
    // SecurityHeadersModule, // Already included in CommonModule
  ],
  controllers: [AuthController, HealthController, TestController],
  providers: [
    DashboardService,
    SettingsService,
    CoachesService, // Enabled for coach discovery and search
    AppResolver,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
