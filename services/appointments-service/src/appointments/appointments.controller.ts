/**
 * AppointmentsController - Enhanced with meeting type management and recording controls
 * Provides RESTful API for appointment scheduling, meeting type changes, and recording orchestration
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
  ForbiddenException,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService, CreateAppointmentData, UpdateAppointmentData} from './appointments.service';
import { MeetingManagerService, MeetingCreationRequest, MeetingUpdateRequest } from '../meetings/meeting-manager.service';
import { RecordingOrchestratorService, RecordingStartRequest } from '../recording/recording-orchestrator.service';
import {
  MeetingType,
  RecordingType,
  RecordingSettings
} from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
// import { JwtAuthGuard } from '../jwt-auth.guard'; // Temporarily disabled

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

interface CreateAppointmentRequest {
  therapistId: string;
  clientId: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  meetingType: MeetingType;
  location?: string;
  recordingSettings?: Partial<RecordingSettings>;
  googleMeetEnabled?: boolean;
  clientPreferences?: {
    preferredNotificationMethod: 'email' | 'sms' | 'both';
    allowRecording: boolean;
    requireConfirmation: boolean;
  };
  reminderTimes?: string[];
  tags?: string[];
}

interface ChangeMeetingTypeRequest {
  meetingType: MeetingType;
  location?: string;
  recordingSettings?: Partial<RecordingSettings>;
  googleMeetEnabled?: boolean;
  generateNewMeetLink?: boolean;
  notifyClient?: boolean;
}

interface UpdateRecordingSettingsRequest {
  enabled: boolean;
  type?: RecordingType;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  autoStart?: boolean;
  includeTranscription?: boolean;
  shareWithClient?: boolean;
  retentionDays?: number;
}

@ApiTags('Appointments')
@Controller('appointments')
// @UseGuards(JwtAuthGuard) // Temporarily disabled
@ApiBearerAuth()
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly meetingManagerService: MeetingManagerService,
    private readonly recordingOrchestratorService: RecordingOrchestratorService
  ) {}

  // Enhanced create appointment endpoint
  @Post('enhanced')
  @ApiOperation({ summary: 'Create a new appointment with meeting configuration' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid appointment data' })
  async createEnhancedAppointment(
    @Body() createData: CreateAppointmentRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Create basic appointment
      const appointmentData: CreateAppointmentData = {
        therapistId: createData.therapistId,
        clientId: createData.clientId,
        startTime: new Date(createData.startTime),
        endTime: new Date(createData.endTime),
        title: createData.title,
        description: createData.description,
        meetingType: createData.meetingType,
        reminderTimes: createData.reminderTimes || ['24h', '1h'],
        clientPreferences: createData.clientPreferences,
        tags: createData.tags,
        createdBy: req.user?.id || 'system'
      };

      const appointment = await this.appointmentsService.create(appointmentData);

      // Configure meeting type and recording
      const meetingRequest: MeetingCreationRequest = {
        appointmentId: appointment.id,
        meetingType: createData.meetingType,
        location: createData.location,
        recordingSettings: createData.recordingSettings,
        googleMeetEnabled: createData.googleMeetEnabled,
        meetingDuration: Math.floor(
          (new Date(createData.endTime).getTime() - new Date(createData.startTime).getTime()) / (1000 * 60)
        )
      };

      const meetingResult = await this.meetingManagerService.createMeetingConfiguration(
        meetingRequest,
        req.user?.id || 'system'
      );

      this.logger.log(`Created appointment ${appointment.id} with ${createData.meetingType} meeting type`);

      return {
        success: true,
        appointment: meetingResult.appointment,
        meetingUrl: meetingResult.meetingUrl,
        changes: meetingResult.changes,
        warnings: meetingResult.warnings
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to create appointment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  @Patch(':id/meeting-type')
  @ApiOperation({ summary: 'Change meeting type (in-person ↔ online)' })
  @ApiResponse({ status: 200, description: 'Meeting type changed successfully' })
  @ApiResponse({ status: 400, description: 'Meeting type change not allowed' })
  async changeMeetingType(
    @Param('id') id: string,
    @Body() changeRequest: ChangeMeetingTypeRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Validate the change is allowed
      const validation = await this.meetingManagerService.validateMeetingTypeChange(
        id,
        changeRequest.meetingType
      );

      if (!validation.valid) {
        throw new BadRequestException(`Meeting type change not allowed: ${validation.reasons.join(', ')}`);
      }

      // Perform the change
      const updateRequest: MeetingUpdateRequest = {
        meetingType: changeRequest.meetingType,
        location: changeRequest.location,
        recordingSettings: changeRequest.recordingSettings,
        googleMeetEnabled: changeRequest.googleMeetEnabled,
        generateNewMeetLink: changeRequest.generateNewMeetLink
      };

      const result = await this.meetingManagerService.changeMeetingType(
        id,
        updateRequest,
        req.user?.id || 'system'
      );

      // Send notifications if requested
      if (changeRequest.notifyClient) {
        // TODO: Integrate with notification service
        this.logger.log(`Client notification requested for appointment ${id} meeting type change`);
      }

      this.logger.log(`Changed meeting type for appointment ${id} to ${changeRequest.meetingType}`);

      return {
        success: result.success,
        appointment: result.appointment,
        meetingUrl: result.meetingUrl,
        changes: result.changes,
        warnings: result.warnings,
        message: `Meeting type changed to ${changeRequest.meetingType} successfully`
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to change meeting type: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  @Patch(':id/recording-settings')
  @ApiOperation({ summary: 'Update recording settings for appointment' })
  @ApiResponse({ status: 200, description: 'Recording settings updated successfully' })
  async updateRecordingSettings(
    @Param('id') id: string,
    @Body() settingsRequest: UpdateRecordingSettingsRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      const result = await this.meetingManagerService.updateRecordingSettings(
        id,
        settingsRequest,
        req.user?.id || 'system'
      );

      this.logger.log(`Updated recording settings for appointment ${id}`);

      return {
        success: result.success,
        appointment: result.appointment,
        changes: result.changes,
        message: 'Recording settings updated successfully'
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to update recording settings: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  @Post(':id/recording/start')
  @ApiOperation({ summary: 'Start recording for appointment' })
  @ApiResponse({ status: 200, description: 'Recording started successfully' })
  @ApiResponse({ status: 400, description: 'Cannot start recording' })
  async startRecording(
    @Param('id') id: string,
    @Body() startRequest: Partial<RecordingStartRequest>,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      const request: RecordingStartRequest = {
        appointmentId: id,
        recordingType: startRequest.recordingType,
        quality: startRequest.quality,
        includeTranscription: startRequest.includeTranscription,
        userId: req.user?.id || 'system'
      };

      const result = await this.recordingOrchestratorService.startRecording(request);

      this.logger.log(`Recording start requested for appointment ${id}`);

      return result;

    } catch (error: unknown) {
      this.logger.error(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  @Post(':id/recording/stop')
  @ApiOperation({ summary: 'Stop recording for appointment' })
  @ApiResponse({ status: 200, description: 'Recording stopped successfully' })
  async stopRecording(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      const result = await this.recordingOrchestratorService.stopRecording(id, req.user?.id || 'system');

      this.logger.log(`Recording stop requested for appointment ${id}`);

      return result;

    } catch (error: unknown) {
      this.logger.error(`Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  @Get(':id/recording/status')
  @ApiOperation({ summary: 'Get recording status for appointment' })
  @ApiResponse({ status: 200, description: 'Recording status retrieved successfully' })
  async getRecordingStatus(@Param('id') id: string) {
    try {
      const status = await this.recordingOrchestratorService.getRecordingStatus(id);

      return {
        success: true,
        appointmentId: id,
        hasActiveSession: status.hasActiveSession,
        session: status.session,
        recordingStatus: status.appointment?.recordingStatus,
        recordingFiles: status.appointment?.recordingFiles
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to get recording status: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Legacy endpoints (backward compatibility)
  @Get()
  findAll(@Query() query: GetAppointmentsDto, @Req() req: any) {
    this.logger.log('GET /appointments (legacy)', { user: req.user?.id });
    if (req.user?.id !== query.therapistId) {
      this.logger.warn('forbidden list', { user: req.user?.id });
      throw new ForbiddenException();
    }
    return this.appointmentsService.findAll(query);
  }

  @Get('history')
  history(@Query('therapistId') therapistId: number, @Req() req: any) {
    this.logger.log('GET /appointments/history (legacy)', { user: req.user?.id });
    if (req.user?.id !== Number(therapistId)) {
      this.logger.warn('forbidden history', { user: req.user?.id });
      throw new ForbiddenException();
    }
    return this.appointmentsService.findHistory(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    this.logger.log('GET /appointments/:id (legacy)', { id, user: req.user?.id });
    const a = await this.appointmentsService.findOne(id);
    if (!a || a.therapistId !== req.user?.id) {
      this.logger.warn('forbidden get', { id, user: req.user?.id });
      throw new ForbiddenException();
    }
    return a;
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    if (req.user?.id !== dto.therapistId) {
      this.logger.warn('forbidden create', { user: req.user?.id });
      throw new ForbiddenException();
    }
    return this.appointmentsService.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime)
    });
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
    @Req() req: any,
  ) {
    this.logger.log('PUT /appointments/:id (legacy)', { id, user: req.user?.id });
    const updateData: UpdateAppointmentData = {
      ...(dto.startTime && { startTime: new Date(dto.startTime) }),
      ...(dto.endTime && { endTime: new Date(dto.endTime) }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      updatedBy: req.user?.id
    };
    return this.appointmentsService.update(id.toString(), updateData);
  }
}
