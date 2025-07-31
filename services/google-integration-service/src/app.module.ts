/**
 * GoogleIntegrationModule - Main application module
 * Wire up all Google integration services, controllers, and dependencies
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { GoogleAccount } from './entities/google-account.entity';
import { CalendarSyncLog } from './entities/calendar-sync-log.entity';
import { EmailLog } from './entities/email-log.entity';

// Services
import { GoogleOAuthService } from './auth/google-oauth.service';
import { TokenManagerService } from './auth/token-manager.service';
import { GoogleCalendarService } from './calendar/google-calendar.service';
import { GmailService } from './gmail/gmail.service';
import { EmailTemplatesService } from './gmail/email-templates.service';
import { WebhookService } from './webhook/webhook.service';

// Controllers
import { OAuthController } from './auth/oauth.controller';
import { CalendarController } from './calendar/calendar.controller';
import { GoogleCalendarController } from './calendar/google-calendar.controller';
import { GmailController } from './gmail/gmail.controller';
import { WebhookController } from './webhook/webhook.controller';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // JWT Configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),

    // Database Configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME', 'clinic_db'),
        entities: [GoogleAccount, CalendarSyncLog, EmailLog],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl: configService.get<string>('NODE_ENV') === 'production' ? {
          rejectUnauthorized: false,
        } : false,
      }),
      inject: [ConfigService],
    }),

    // TypeORM Feature Modules
    TypeOrmModule.forFeature([
      GoogleAccount,
      CalendarSyncLog,
      EmailLog,
    ]),
  ],

  controllers: [
    OAuthController,
    CalendarController,
    GoogleCalendarController,
    GmailController,
    WebhookController,
  ],

  providers: [
    // Core Services
    GoogleOAuthService,
    TokenManagerService,
    GoogleCalendarService,
    GmailService,
    EmailTemplatesService,
    WebhookService,

    // Guards
    JwtAuthGuard,
  ],

  exports: [
    // Export services for use in other modules/microservices
    GoogleOAuthService,
    GoogleCalendarService,
    GmailService,
    EmailTemplatesService,
    WebhookService,
    TokenManagerService,
  ],
})
export class AppModule {}