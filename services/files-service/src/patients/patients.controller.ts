import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../jwt-auth.guard';

@Controller('patients')
export class PatientsController {
  constructor(private readonly service: PatientsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/files')
  getFiles(@Param('id', ParseIntPipe) id: number) {
    return this.service.filesForPatient(id);
  }
}
