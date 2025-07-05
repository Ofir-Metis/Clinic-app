import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { createLogger, transports, format } from 'winston';
import { JwtAuthGuard } from '../jwt-auth.guard';

/**
 * REST controller for appointments.
 */
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  private logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [new transports.Console()],
  });

  constructor(private readonly service: AppointmentsService) {}

  @Get()
  findAll(@Query() query: GetAppointmentsDto, @Req() req: any) {
    this.logger.info('GET /appointments', { user: req.user?.id });
    if (req.user?.id !== query.therapistId) {
      this.logger.warn('forbidden list', { user: req.user?.id });
      throw new ForbiddenException();
    }
    return this.service.findAll(query);
  }

  @Get('history')
  history(@Query('therapistId') therapistId: number, @Req() req: any) {
    this.logger.info('GET /appointments/history', { user: req.user?.id });
    if (req.user?.id !== Number(therapistId)) {
      this.logger.warn('forbidden history', { user: req.user?.id });
      throw new ForbiddenException();
    }
    return this.service.findHistory(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    this.logger.info('GET /appointments/:id', { id, user: req.user?.id });
    const a = await this.service.findOne(id);
    if (!a || a.therapistId !== req.user?.id) {
      this.logger.warn('forbidden get', { id, user: req.user?.id });
      throw new ForbiddenException();
    }
    return a;
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    if (req.user?.id !== dto.therapistId) {
      this.logger.warn('forbidden create', { user: req.user?.id });
      throw new ForbiddenException();
    }
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
    @Req() req: any,
  ) {
    this.logger.info('PUT /appointments/:id', { id, user: req.user?.id });
    return this.service.update(id, dto, req.user?.id);
  }
}
