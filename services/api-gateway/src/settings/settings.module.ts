import { Module, HttpModule } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [HttpModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
