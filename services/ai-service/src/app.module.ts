import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HealthController } from './health/health.controller';
import { AiGraphqlModule } from './graphql/graphql.module';
import { OpenaiService } from './openai.service';
import { SessionAnalysisService } from './session-analysis/session-analysis.service';
import { SessionAnalysisController } from './session-analysis/session-analysis.controller';
import { SessionSummary } from './entities/session-summary.entity';
import { Transcription } from './entities/transcription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Database connection with new entities
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: +(process.env.POSTGRES_PORT || 5432),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [SessionSummary, Transcription],
      synchronize: process.env.NODE_ENV !== 'production', // Enable for development
      logging: process.env.NODE_ENV === 'development',
    }),

    // Entity repositories
    TypeOrmModule.forFeature([SessionSummary, Transcription]),

    // NATS microservice clients
    ClientsModule.register([
      {
        name: 'FILES_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'files-service-queue',
        },
      },
      {
        name: 'APPOINTMENTS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'appointments-service-queue',
        },
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'notifications-service-queue',
        },
      },
    ]),

    AiGraphqlModule,
  ],
  controllers: [HealthController, SessionAnalysisController],
  providers: [OpenaiService, SessionAnalysisService],
  exports: [OpenaiService, SessionAnalysisService],
})
export class AppModule {}
