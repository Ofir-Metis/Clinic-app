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
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
export class NotesController {
  private readonly logger = new Logger(NotesController.name);

  constructor(private readonly service: NotesService) {}

  @Get()
  async findAll(
    @Query('entityId') entityId: string,
    @Query('entityType') entityType: 'appointment' | 'patient',
    @Headers('x-coach-id') coachId?: string,
  ) {
    this.logger.log(`GET /notes - entityId: ${entityId}, entityType: ${entityType}`);
    return this.service.findByEntity(entityId, entityType, coachId);
  }

  @Get('recent')
  recent(@Query('coachId') coachId: string, @Query('limit') limit = '3') {
    this.logger.log(`GET /notes/recent - coachId: ${coachId}`);
    return this.service.recent(coachId, Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`GET /notes/${id}`);
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateNoteDto,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`POST /notes - coachId: ${coachId}`);
    // In production, coachId would come from JWT token
    // For now, we accept it from header or use a default
    const effectiveCoachId = coachId || 'default-coach';
    return this.service.create(effectiveCoachId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`PATCH /notes/${id}`);
    const effectiveCoachId = coachId || 'default-coach';
    return this.service.update(id, effectiveCoachId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Headers('x-coach-id') coachId: string,
  ) {
    this.logger.log(`DELETE /notes/${id}`);
    const effectiveCoachId = coachId || 'default-coach';
    await this.service.delete(id, effectiveCoachId);
  }
}
