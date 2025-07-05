import { Controller, Get, Param, ParseIntPipe, Put, Body, Req, Headers } from '@nestjs/common';
import { TherapistsService } from './therapists.service';

@Controller('therapists')
export class TherapistsController {
  constructor(private readonly service: TherapistsService) {}

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
