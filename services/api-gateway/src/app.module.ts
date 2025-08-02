import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
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
import { AppResolver } from './app.resolver';
import { DashboardService } from './dashboard/dashboard.service';
import { SettingsService } from './settings/settings.service';
import { TherapistsService } from './therapists/therapists.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AuthController],
  providers: [
    DashboardService,
    SettingsService,
    TherapistsService,
    AppResolver,
  ],
})
export class AppModule {}
