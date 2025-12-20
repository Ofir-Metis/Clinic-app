/**
 * GoogleIntegrationModule - Main application module
 * Wire up all Google integration services, controllers, and dependencies
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CommonModule } from '@clinic/common';

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
    // Use CommonModule for consistent database and configuration setup
    CommonModule,

    // JWT Configuration for Google Integration
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'google-integration-fallback-2024',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
          issuer: 'clinic-google-integration',
          audience: 'clinic-users'
        },
      }),
      inject: [ConfigService],
    }),

    // Register Google Integration specific entities via forFeature
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