import {
  Controller,
  Get,
  Put,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { CoachesService } from './coaches.service';
import { UpdateCoachProfileDto } from './dto/update-coach-profile.dto';
import { SearchCoachesDto } from './dto/search-coaches.dto';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { AuthRequest } from '../common/auth-request.interface';

/**
 * REST controller exposing coach profile endpoints.
 */
@Controller('coaches')
export class CoachesController {
  constructor(private readonly service: CoachesService) {}

  /**
   * Search coaches with filters - MUST be before :id routes
   */
  @Get('search')
  @UseGuards(JwtAuthGuard)
  searchCoaches(@Query() dto: SearchCoachesDto) {
    return this.service.searchCoaches(dto);
  }

  /**
   * List all public coaches with pagination
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  listCoaches(@Query() dto: SearchCoachesDto) {
    return this.service.searchCoaches(dto);
  }

  @Get(':id/profile')
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProfile(id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/profile')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCoachProfileDto,
    @Req() req: AuthRequest,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException();
    }
    return this.service.updateProfile(id.toString(), dto);
  }
}
