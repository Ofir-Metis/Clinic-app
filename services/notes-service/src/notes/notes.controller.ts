import { Controller, Get, Query } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get('recent')
  recent(@Query('therapistId') therapistId: number, @Query('limit') limit = '3') {
    return this.service.recent(Number(therapistId), Number(limit));
  }
}
