import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../jwt-auth.guard';

@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

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
