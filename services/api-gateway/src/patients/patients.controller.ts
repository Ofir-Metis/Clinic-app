import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all patients for therapist' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  async getPatients(@Query('therapistId') therapistId?: string) {
    return this.patientsService.findAll(therapistId ? parseInt(therapistId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  async getPatient(@Param('id') id: string) {
    return this.patientsService.findOne(parseInt(id));
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get appointments for patient' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getPatientAppointments(@Param('id') id: string) {
    return this.patientsService.findAppointments(parseInt(id));
  }
}