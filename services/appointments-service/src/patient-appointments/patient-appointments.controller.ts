import { Controller, Get, Query, UseGuards, Req, ForbiddenException, Param, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { PatientAppointmentsService } from './patient-appointments.service';
import { GetPatientAppointmentsDto } from './dto/get-patient-appointments.dto';
import { createLogger, transports, format } from 'winston';

@Controller('patient/appointments')
@UseGuards(JwtAuthGuard)
export class PatientAppointmentsController {
  private logger = createLogger({ level: 'info', format: format.json(), transports: [new transports.Console()] });

  constructor(private readonly service: PatientAppointmentsService) {}

  @Get()
  async list(@Query() query: GetPatientAppointmentsDto, @Req() req: any) {
    if (req.user.id !== query.patientId) {
      this.logger.warn('forbidden list', { user: req.user.id, patientId: query.patientId });
      throw new ForbiddenException();
    }
    return this.service.list(query);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const appt = await this.service.findOne(id);
    if (!appt || appt.patientId !== req.user.id) {
      this.logger.warn('forbidden get', { user: req.user.id, id });
      throw new ForbiddenException();
    }
    return appt;
  }
}
