import { Controller, Get, Query } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get('recent')
  recent(@Query('coachId') coachId: number, @Query('limit') limit = '3') {
    return this.service.recent(Number(coachId), Number(limit));
  }
}
