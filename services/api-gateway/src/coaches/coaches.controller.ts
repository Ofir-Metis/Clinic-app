import { Controller, Get, Param, ParseIntPipe, Put, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@clinic/common';
import { CoachesService } from './coaches.service';

@Controller('coaches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoachesController {
  constructor(private readonly service: CoachesService) {}

  /**
   * Search coaches - MUST be before :id routes
   */
  @Get('search')
  searchCoaches(@Query() query: any) {
    return this.service.searchCoaches(query);
  }

  /**
   * List all coaches with pagination
   */
  @Get()
  listCoaches(@Query() query: any) {
    return this.service.searchCoaches(query);
  }

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
