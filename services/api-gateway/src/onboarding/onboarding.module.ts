/**
 * OnboardingModule - Module for client onboarding functionality
 * Handles intake forms, assessments, program selection, and progress tracking
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@clinic/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
  ],
  providers: [OnboardingService],
  controllers: [OnboardingController],
  exports: [OnboardingService],
})
export class OnboardingModule {}