import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { AuthRequest } from '../common/auth-request.interface';

/**
 * Controller exposing settings endpoints.
 */
@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  get(@Req() req: AuthRequest) {
    return this.service.getSettings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Req() req: AuthRequest, @Body() dto: UpdateSettingDto[]) {
    return this.service.updateSettings(req.user.id, dto);
  }
}
