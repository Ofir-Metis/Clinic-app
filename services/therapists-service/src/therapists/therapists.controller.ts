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
} from '@nestjs/common';
import { TherapistsService } from './therapists.service';
import { UpdateTherapistProfileDto } from './dto/update-therapist-profile.dto';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { AuthRequest } from '../common/auth-request.interface';

/**
 * REST controller exposing therapist profile endpoints.
 */
@Controller('therapists')
export class TherapistsController {
  constructor(private readonly service: TherapistsService) {}

  @Get(':id/profile')
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProfile(id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/profile')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTherapistProfileDto,
    @Req() req: AuthRequest,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException();
    }
    return this.service.updateProfile(id.toString(), dto);
  }
}
