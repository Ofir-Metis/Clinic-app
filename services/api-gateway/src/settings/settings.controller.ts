import { Controller, Get, Put, Body, Headers } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get(@Headers('authorization') auth: string) {
    return this.service.get(0, auth);
  }

  @Put()
  update(@Body() dto: any[], @Headers('authorization') auth: string) {
    return this.service.update(0, dto, auth);
  }
}
