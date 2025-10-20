import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CoachService } from '../services/coach.service';

@Controller('coaches')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get()
  findAll() {
    return { message: 'Get all coaches' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: `Get coach ${id}` };
  }
}