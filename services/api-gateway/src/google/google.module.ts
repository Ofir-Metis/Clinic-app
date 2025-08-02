/**
 * GoogleModule - Module for Google Calendar integration
 * Provides OAuth authentication, calendar sync, and webhook handling
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@clinic/common';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleWebhooksController } from './google-webhooks.controller';
import { GoogleAuthController } from './google-auth.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
    AuthModule,
  ],
  providers: [
    GoogleCalendarService,
    GoogleOAuthService,
  ],
  controllers: [
    GoogleWebhooksController,
    GoogleAuthController,
  ],
  exports: [
    GoogleCalendarService,
    GoogleOAuthService,
  ],
})
export class GoogleModule {}