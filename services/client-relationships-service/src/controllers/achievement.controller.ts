import { Controller, Get, Param } from '@nestjs/common';
import { AchievementService } from '../services/achievement.service';

@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get()
  findAll() {
    return { message: 'Get all achievements' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: `Get achievement ${id}` };
  }
}
