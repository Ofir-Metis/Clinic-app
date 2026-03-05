import { Controller, Post, Get, Body, Query, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@clinic/common';
import { PatientsService, Patient, CreatePatientDto } from './patients.service';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient/client' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Patient with this email already exists' })
  async createPatient(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  async getPatients(
    @Query('coachId') coachId?: string,
    @Query('therapistId') therapistId?: string, // Legacy support
    @Query('search') search?: string
  ): Promise<{ items: Patient[]; total: number }> {
    // Use coachId if provided, fall back to therapistId for legacy support
    const filterCoachId = coachId || therapistId;
    return this.patientsService.findAll(filterCoachId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  async getPatient(@Param('id') id: string): Promise<Patient> {
    return this.patientsService.findOne(id);
  }
}
