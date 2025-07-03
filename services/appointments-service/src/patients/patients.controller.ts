import { Controller, Get, Query, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { PatientsService } from './patients.service';
import { GetPatientsDto } from './dto/get-patients.dto';

/**
 * Controller exposing patient list endpoints.
 */
@Controller('patients')
export class PatientsController {
  constructor(private readonly service: PatientsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query() query: GetPatientsDto, @Req() req: any) {
    if (req.user?.id !== query.therapistId) {
      throw new ForbiddenException();
    }
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.service.list(query.therapistId, page, limit, query.search);
  }
}
