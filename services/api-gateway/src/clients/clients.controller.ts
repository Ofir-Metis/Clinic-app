import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientsService } from './clients.service';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clients for coach' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  async getClients(@Query('coachId') coachId?: string) {
    return this.clientsService.findAll(coachId ? parseInt(coachId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  async getClient(@Param('id') id: string) {
    return this.clientsService.findOne(parseInt(id));
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get appointments for client' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getClientAppointments(@Param('id') id: string) {
    return this.clientsService.findAppointments(parseInt(id));
  }
}