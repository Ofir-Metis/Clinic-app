import { Controller, Get, Param, ParseIntPipe, Put, Body, Req, Headers } from '@nestjs/common';
import { CoachesService } from './coaches.service';

@Controller('coaches')
export class CoachesController {
  constructor(private readonly service: CoachesService) {}

  @Get(':id/profile')
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProfile(id);
  }

  @Put(':id/profile')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Headers('authorization') auth: string,
  ) {
    return this.service.updateProfile(id, dto, auth);
  }
}
