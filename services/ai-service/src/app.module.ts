import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@clinic/common';
import { HealthController } from './health/health.controller';
import { AiGraphqlModule } from './graphql/graphql.module';
import { OpenaiService } from './openai.service';
import { SessionAnalysisService } from './session-analysis/session-analysis.service';
import { SessionAnalysisController } from './session-analysis/session-analysis.controller';
import { SessionSummary } from './entities/session-summary.entity';
import { Transcription } from './entities/transcription.entity';

@Module({
  imports: [
    // Enterprise CommonModule provides centralized config, logging, database, and security
    CommonModule,

    // Entity repositories for AI-specific entities
    TypeOrmModule.forFeature([SessionSummary, Transcription]),

    // NATS microservice clients for AI service communication
    ClientsModule.register([
      {
        name: 'FILES_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'files-service-queue',
          maxReconnectAttempts: 10,
          reconnectTimeWait: 2000,
        },
      },
      {
        name: 'APPOINTMENTS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'appointments-service-queue',
          maxReconnectAttempts: 10,
          reconnectTimeWait: 2000,
        },
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'notifications-service-queue',
          maxReconnectAttempts: 10,
          reconnectTimeWait: 2000,
        },
      },
    ]),

    // JWT and Authentication - CommonModule provides JwtService, but we need module-specific config
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'clinic-ai-service-fallback-2024',
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: process.env.JWT_ISSUER || 'clinic-ai-service',
        audience: process.env.JWT_AUDIENCE || 'clinic-users'
      },
    }),

    AiGraphqlModule,
  ],
  controllers: [HealthController, SessionAnalysisController],
  providers: [OpenaiService, SessionAnalysisService],
  exports: [OpenaiService, SessionAnalysisService],
})
export class AppModule {}
