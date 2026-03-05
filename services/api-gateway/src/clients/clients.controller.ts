import { Controller, Get, Query, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@clinic/common';
import { ClientsService } from './clients.service';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clients for coach' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  async getClients(@Query('coachId') coachId?: string) {
    const parsed = coachId ? parseInt(coachId, 10) : undefined;
    if (coachId && (parsed === undefined || isNaN(parsed))) return { items: [], total: 0 };
    return this.clientsService.findAll(parsed);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  async getClient(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get appointments for client' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getClientAppointments(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findAppointments(id);
  }
}