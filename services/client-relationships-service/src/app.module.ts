/**
 * Client Relationships Service - Main Application Module
 * Manages multi-coach client relationships, permissions, and goal sharing
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Entity imports
import { Client } from './entities/client.entity';
import { Coach } from './entities/coach.entity';
import { ClientCoachRelationship } from './entities/client-coach-relationship.entity';
import { RelationshipPermission } from './entities/relationship-permission.entity';
import { SharedGoal } from './entities/shared-goal.entity';
import { Goal } from './entities/goal.entity';
import { Achievement } from './entities/achievement.entity';

// Service imports
import { ClientService } from './services/client.service';
import { CoachService } from './services/coach.service';
import { RelationshipService } from './services/relationship.service';
import { PermissionService } from './services/permission.service';
import { GoalService } from './services/goal.service';
import { AchievementService } from './services/achievement.service';

// Controller imports
import { ClientController } from './controllers/client.controller';
import { CoachController } from './controllers/coach.controller';
import { RelationshipController } from './controllers/relationship.controller';
import { PermissionController } from './controllers/permission.controller';
import { GoalController } from './controllers/goal.controller';
import { AchievementController } from './controllers/achievement.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database Configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'clinic'),
        entities: [
          Client,
          Coach,
          ClientCoachRelationship,
          RelationshipPermission,
          SharedGoal,
          Goal,
          Achievement
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? {
          rejectUnauthorized: false
        } : false,
      }),
      inject: [ConfigService],
    }),

    // TypeORM Feature Modules
    TypeOrmModule.forFeature([
      Client,
      Coach,
      ClientCoachRelationship,
      RelationshipPermission,
      SharedGoal,
      Goal,
      Achievement
    ]),

    // NATS Microservice Configuration
    ClientsModule.registerAsync([
      {
        name: 'NATS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.get('NATS_URL', 'nats://localhost:4222')],
            queue: 'client-relationships-service',
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // External Service Connections
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.get('NATS_URL', 'nats://localhost:4222')],
            queue: 'auth-service',
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.get('NATS_URL', 'nats://localhost:4222')],
            queue: 'notifications-service',
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'APPOINTMENTS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.get('NATS_URL', 'nats://localhost:4222')],
            queue: 'appointments-service',
          },
        }),
        inject: [ConfigService],
      }
    ]),
  ],

  controllers: [
    ClientController,
    CoachController,
    RelationshipController,
    PermissionController,
    GoalController,
    AchievementController,
  ],

  providers: [
    ClientService,
    CoachService,
    RelationshipService,
    PermissionService,
    GoalService,
    AchievementService,
  ],

  exports: [
    ClientService,
    CoachService,
    RelationshipService,
    PermissionService,
    GoalService,
    AchievementService,
  ],
})
export class AppModule {}