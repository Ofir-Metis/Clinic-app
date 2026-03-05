/**
 * VoiceNotesController - API Gateway proxy for voice notes service
 * Handles authentication and forwards requests to notes-service
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, validateAudioVideoFile } from '@clinic/common';
import { Request } from 'express';
import { VoiceNotesService } from './voice-notes.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId?: string;
    coachId?: string;
    role?: string;
  };
}

@Controller('voice-notes')
@ApiTags('Voice Notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceNotesController {
  private readonly logger = new Logger(VoiceNotesController.name);

  constructor(private readonly voiceNotesService: VoiceNotesService) {}

  private getCoachId(req: AuthenticatedRequest, header?: string): string {
    return req.user?.coachId || req.user?.userId || header || 'default-coach';
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload audio file and create voice note' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: { type: 'string', format: 'binary' },
        durationSeconds: { type: 'number' },
        appointmentId: { type: 'string', format: 'uuid' },
        clientId: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        sessionTimestamp: { type: 'number' },
      },
      required: ['audio', 'durationSeconds'],
    },
  })
  @ApiResponse({ status: 201, description: 'Voice note created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async uploadVoiceNote(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      durationSeconds: string;
      appointmentId?: string;
      clientId?: string;
      title?: string;
      sessionTimestamp?: string;
      language?: string;
    },
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    // Validate file type and size (100MB max for audio/video)
    validateAudioVideoFile(file);

    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`POST /voice-notes/upload - coachId: ${coachId}, fileSize: ${file.size}`);

    const durationSeconds = parseInt(body.durationSeconds, 10);
    if (isNaN(durationSeconds) || durationSeconds < 1) {
      throw new BadRequestException('durationSeconds must be a positive number');
    }

    return this.voiceNotesService.uploadVoiceNote(coachId, file, {
      durationSeconds,
      appointmentId: body.appointmentId,
      clientId: body.clientId,
      title: body.title,
      sessionTimestamp: body.sessionTimestamp
        ? parseInt(body.sessionTimestamp, 10)
        : undefined,
      language: body.language,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get list of voice notes' })
  @ApiQuery({ name: 'appointmentId', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed'] })
  @ApiQuery({ name: 'search', required: false, description: 'Search in transcription and title' })
  @ApiQuery({ name: 'language', required: false, description: 'Filter by detected language' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: 'List of voice notes' })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
    @Query('appointmentId') appointmentId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('language') language?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`GET /voice-notes - coachId: ${coachId}, search: ${search}`);

    return this.voiceNotesService.findAll(coachId, {
      appointmentId,
      clientId,
      status,
      search,
      language,
      dateFrom,
      dateTo,
      limit,
      offset,
    });
  }

  // Static routes MUST come before parameterized :id routes (NestJS matches in declaration order)

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get voice notes analytics summary' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({ status: 200, description: 'Voice notes analytics data' })
  async getAnalytics(
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
    @Query('days') days?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`GET /voice-notes/analytics/summary - coachId: ${coachId}`);

    const daysNum = days ? parseInt(days, 10) : 30;
    return this.voiceNotesService.getAnalytics(coachId, daysNum);
  }

  @Get('config/languages')
  @ApiOperation({ summary: 'Get list of supported transcription languages' })
  @ApiResponse({ status: 200, description: 'List of supported languages' })
  async getSupportedLanguages() {
    this.logger.log('GET /voice-notes/config/languages');

    return this.voiceNotesService.getSupportedLanguages();
  }

  @Post('batch/transcribe')
  @ApiOperation({ summary: 'Queue multiple voice notes for transcription' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        voiceNoteIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
      required: ['voiceNoteIds'],
    },
  })
  @ApiResponse({ status: 200, description: 'Batch transcription initiated' })
  async batchTranscribe(
    @Body() body: { voiceNoteIds: string[] },
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`POST /voice-notes/batch/transcribe - ${body.voiceNoteIds?.length} notes`);

    return this.voiceNotesService.batchTranscribe(coachId, body.voiceNoteIds);
  }

  // Parameterized :id routes below

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific voice note' })
  @ApiParam({ name: 'id', description: 'Voice note UUID' })
  @ApiResponse({ status: 200, description: 'Voice note details' })
  @ApiResponse({ status: 404, description: 'Voice note not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`GET /voice-notes/${id}`);

    return this.voiceNotesService.findOne(id, coachId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a voice note' })
  @ApiParam({ name: 'id', description: 'Voice note UUID' })
  @ApiResponse({ status: 200, description: 'Voice note updated' })
  @ApiResponse({ status: 404, description: 'Voice note not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      transcription?: string;
      title?: string;
      tags?: string[];
      isPrivate?: boolean;
    },
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`PATCH /voice-notes/${id}`);

    return this.voiceNotesService.update(id, coachId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a voice note' })
  @ApiParam({ name: 'id', description: 'Voice note UUID' })
  @ApiResponse({ status: 204, description: 'Voice note deleted' })
  @ApiResponse({ status: 404, description: 'Voice note not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`DELETE /voice-notes/${id}`);

    await this.voiceNotesService.delete(id, coachId);
  }

  @Post(':id/convert-to-note')
  @ApiOperation({ summary: 'Convert voice note to regular session note' })
  @ApiParam({ name: 'id', description: 'Voice note UUID' })
  @ApiResponse({ status: 200, description: 'Voice note converted to note' })
  @ApiResponse({ status: 400, description: 'Voice note has no transcription' })
  async convertToNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      entityType: 'appointment' | 'client' | 'patient';
      entityId: string;
      additionalContent?: string;
    },
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`POST /voice-notes/${id}/convert-to-note`);

    return this.voiceNotesService.convertToNote(id, coachId, body);
  }

  @Post(':id/retry-transcription')
  @ApiOperation({ summary: 'Retry failed transcription' })
  @ApiParam({ name: 'id', description: 'Voice note UUID' })
  @ApiResponse({ status: 200, description: 'Transcription retry initiated' })
  @ApiResponse({ status: 400, description: 'Transcription not in failed state' })
  async retryTranscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`POST /voice-notes/${id}/retry-transcription`);

    return this.voiceNotesService.retryTranscription(id, coachId);
  }

  @Post(':id/auto-tag')
  @ApiOperation({ summary: 'Auto-generate tags for voice note based on transcription' })
  @ApiParam({ name: 'id', description: 'Voice note UUID' })
  @ApiResponse({ status: 200, description: 'Auto-generated tags' })
  @ApiResponse({ status: 404, description: 'Voice note not found' })
  async autoTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Headers('x-coach-id') headerCoachId?: string,
  ) {
    const coachId = this.getCoachId(req, headerCoachId);
    this.logger.log(`POST /voice-notes/${id}/auto-tag`);

    return this.voiceNotesService.autoTag(id, coachId);
  }
}
