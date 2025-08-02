/**
 * ViewSwitchingModule - Module for therapist-client view switching functionality
 */

import { Module } from '@nestjs/common';
import { ViewSwitchingController } from './view-switching.controller';
import { ViewSwitchingService } from './view-switching.service';
import { JwtService } from '@clinic/common/auth/jwt.service';
import { ViewSwitchingGuard } from '@clinic/common/auth/view-switching.guard';

@Module({
  controllers: [ViewSwitchingController],
  providers: [
    ViewSwitchingService,
    JwtService,
    ViewSwitchingGuard,
  ],
  exports: [ViewSwitchingService, ViewSwitchingGuard],
})
export class ViewSwitchingModule {}