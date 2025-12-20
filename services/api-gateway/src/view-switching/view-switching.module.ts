/**
 * ViewSwitchingModule - Module for coach-client view switching functionality
 */

import { Module } from '@nestjs/common';
import { ViewSwitchingController } from './view-switching.controller';
import { ViewSwitchingService } from './view-switching.service';
import { JwtService } from '@clinic/common';
import { ViewSwitchingGuard } from '@clinic/common';

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