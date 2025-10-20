import { Controller, Get, Param } from '@nestjs/common';
import { GoalService } from '../services/goal.service';

@Controller('goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Get()
  findAll() {
    return { message: 'Get all goals' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: `Get goal ${id}` };
  }
}
