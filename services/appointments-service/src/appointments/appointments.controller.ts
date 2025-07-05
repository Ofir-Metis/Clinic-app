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
import { JwtAuthGuard } from '../jwt-auth.guard';

/**
 * REST controller for appointments.
 */
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  findAll(@Query() query: GetAppointmentsDto, @Req() req: any) {
    if (req.user?.id !== query.therapistId) {
      throw new ForbiddenException();
    }
    return this.service.findAll(query);
  }

  @Get('history')
  history(@Query() query: GetHistoryDto, @Req() req: any) {
    if (req.user?.id !== query.therapistId) {
      throw new ForbiddenException();
    }
    return this.service.history(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const a = await this.service.findOne(id);
    if (!a || a.therapistId !== req.user?.id) {
      throw new ForbiddenException();
    }
    return a;
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    if (req.user?.id !== dto.therapistId) {
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
    return this.service.update(id, dto, req.user?.id);
  }
}
