import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('appointments')
  upcoming() {
    return this.service.appointments();
  }

  @Get('notes')
  recent() {
    return this.service.notes();
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }
}
