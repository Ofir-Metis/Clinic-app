/**
 * Progress Service - Main Application Module
 * Manages client progress tracking, goals, milestones, and achievements
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@clinic/common';
import { ProgressService } from './progress/progress.service';
import { ProgressController } from './progress/progress.controller';
import { HealthController } from './health/health.controller';

// Import entities for progress tracking
import { ClientGoal } from './entities/client-goal.entity';
import { ProgressEntry } from './entities/progress-entry.entity';
import { Milestone } from './entities/milestone.entity';
import { GoalCategory } from './entities/goal-category.entity';

@Module({
  imports: [
    // Enterprise CommonModule provides centralized config, logging, database, and security
    CommonModule,

    // Progress specific entities via forFeature
    TypeOrmModule.forFeature([
      ClientGoal,
      ProgressEntry,
      Milestone,
      GoalCategory,
    ]),
  ],
  controllers: [ProgressController, HealthController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class AppModule {}
