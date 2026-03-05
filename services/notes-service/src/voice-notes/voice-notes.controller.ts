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
  HttpCode,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VoiceNotesService } from './voice-notes.service';
import { CreateVoiceNoteDto } from './dto/create-voice-note.dto';
import { UpdateVoiceNoteDto } from './dto/update-voice-note.dto';
import { ConvertToNoteDto } from './dto/convert-to-note.dto';
import { TranscriptionStatus } from './voice-note.entity';

@Controller('voice-notes')
export class VoiceNotesController {
  private readonly logger = new Logger(VoiceNotesController.name);

  constructor(private readonly service: VoiceNotesService) {}

  @Post()
  async create(
    @Body() dto: CreateVoiceNoteDto,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`POST /voice-notes - coachId: ${coachId}`);
    const effectiveCoachId = coachId || 'default-coach';
    return this.service.create(effectiveCoachId, dto);
  }

  @Get()
  async findAll(
    @Headers('x-coach-id') coachId: string,
    @Query('appointmentId') appointmentId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: TranscriptionStatus,
    @Query('search') search?: string,
    @Query('language') language?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(`GET /voice-notes - coachId: ${coachId}, search: ${search}`);
    const effectiveCoachId = coachId || 'default-coach';

    return this.service.findByCoach({
      coachId: effectiveCoachId,
      appointmentId,
      clientId,
      status,
      searchQuery: search,
      language,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  // Static routes MUST come before parameterized :id routes (NestJS matches in declaration order)

  @Get('analytics/summary')
  async getAnalytics(
    @Headers('x-coach-id') coachId: string,
    @Query('days') days?: string,
  ) {
    this.logger.log(`GET /voice-notes/analytics/summary - coachId: ${coachId}`);
    const effectiveCoachId = coachId || 'default-coach';
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.service.getAnalytics(effectiveCoachId, daysNum);
  }

  @Get('config/languages')
  async getSupportedLanguages() {
    this.logger.log('GET /voice-notes/config/languages');
    return this.service.getSupportedLanguages();
  }

  @Post('batch/transcribe')
  async batchTranscribe(
    @Headers('x-coach-id') coachId: string,
    @Body() body: { voiceNoteIds: string[] },
  ) {
    this.logger.log(`POST /voice-notes/batch/transcribe - ${body.voiceNoteIds?.length} notes`);
    const effectiveCoachId = coachId || 'default-coach';
    return this.service.batchQueueTranscription(effectiveCoachId, body.voiceNoteIds);
  }

  // Parameterized :id routes below

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`GET /voice-notes/${id}`);
    const effectiveCoachId = coachId || 'default-coach';
    return this.service.findOneForCoach(id, effectiveCoachId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVoiceNoteDto,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`PATCH /voice-notes/${id}`);
    const effectiveCoachId = coachId || 'default-coach';
    return this.service.update(id, effectiveCoachId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`DELETE /voice-notes/${id}`);
    const effectiveCoachId = coachId || 'default-coach';
    await this.service.delete(id, effectiveCoachId);
  }

  @Post(':id/convert-to-note')
  async convertToNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertToNoteDto,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`POST /voice-notes/${id}/convert-to-note`);
    const effectiveCoachId = coachId || 'default-coach';
    return this.service.convertToNote(id, effectiveCoachId, dto);
  }

  @Post(':id/retry-transcription')
  async retryTranscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`POST /voice-notes/${id}/retry-transcription`);
    const effectiveCoachId = coachId || 'default-coach';
    return this.service.retryTranscription(id, effectiveCoachId);
  }

  @Post(':id/auto-tag')
  async autoTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`POST /voice-notes/${id}/auto-tag`);
    const effectiveCoachId = coachId || 'default-coach';
    await this.service.findOneForCoach(id, effectiveCoachId);
    return { tags: await this.service.autoGenerateTags(id) };
  }

  // Internal endpoints for transcription service

  @Patch(':id/transcription-status')
  async updateTranscriptionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: TranscriptionStatus; error?: string },
  ) {
    this.logger.log(`PATCH /voice-notes/${id}/transcription-status - status: ${body.status}`);
    return this.service.updateStatus(id, body.status, body.error);
  }

  @Patch(':id/transcription')
  async updateTranscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      transcription: string;
      confidence: number;
      language: string;
      duration: number;
      wordCount?: number;
    },
  ) {
    this.logger.log(`PATCH /voice-notes/${id}/transcription`);
    return this.service.updateTranscription(id, body.transcription, {
      confidence: body.confidence,
      language: body.language,
      duration: body.duration,
      wordCount: body.wordCount,
    });
  }
}
