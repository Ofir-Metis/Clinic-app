import { Controller, Get, Query, Req, ForbiddenException, Param, ParseIntPipe } from '@nestjs/common';
// import { JwtAuthGuard } from '../jwt-auth.guard'; // Temporarily disabled
import { ClientAppointmentsService } from './client-appointments.service';
import { GetClientAppointmentsDto } from './dto/get-client-appointments.dto';
import { createLogger, transports, format } from 'winston';

@Controller('client/appointments')
// @UseGuards(JwtAuthGuard) // Temporarily disabled
export class ClientAppointmentsController {
  private logger = createLogger({ level: 'info', format: format.json(), transports: [new transports.Console()] });

  constructor(private readonly service: ClientAppointmentsService) {}

  @Get()
  async list(@Query() query: GetClientAppointmentsDto, @Req() req: any) {
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
