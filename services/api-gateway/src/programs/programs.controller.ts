/**
 * ProgramsController - Handles coaching program templates and curriculum management
 * Provides endpoints for program CRUD, enrollment, progress tracking, and certification
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgramTemplatesService, ProgramTemplate, ClientProgramProgress } from './program-templates.service';
import { JwtAuthGuard, RequireRoles, Public } from '@clinic/common';

@Controller('api/programs')
export class ProgramsController {
  private readonly logger = new Logger(ProgramsController.name);

  constructor(private readonly programTemplatesService: ProgramTemplatesService) {}

  /**
   * Get all available program templates (public for browsing)
   */
  @Get('templates')
  @Public()
  async getTemplates(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('minRating') minRating?: string,
  ) {
    try {
      const filters: any = {};
      if (category) filters.category = category;
      if (difficulty) filters.difficulty = difficulty;
      if (minRating) filters.minRating = parseFloat(minRating);

      const templates = await this.programTemplatesService.getAllTemplates(filters);

      return {
        status: 'success',
        templates: templates.map(template => ({
          id: template.id,
          title: template.title,
          description: template.description,
          category: template.category,
          difficulty: template.difficulty,
          duration: template.duration,
          totalSessions: template.totalSessions,
          sessionLength: template.sessionLength,
          priceRange: template.priceRange,
          targetAudience: template.targetAudience,
          outcomes: template.outcomes,
          certificationAvailable: template.certificationAvailable,
          tags: template.tags,
          rating: template.rating,
          enrollmentCount: template.enrollmentCount,
          modulesCount: template.modules.length,
          totalLessons: template.modules.reduce((sum, module) => sum + module.lessons.length, 0),
        })),
        totalCount: templates.length,
        filters: {
          categories: [...new Set(templates.map(t => t.category))],
          difficulties: [...new Set(templates.map(t => t.difficulty))],
          tags: [...new Set(templates.flatMap(t => t.tags))],
        },
      };
    } catch (error) {
      this.logger.error('❌ Failed to get program templates:', error);
      throw new HttpException(
        `Failed to get templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get detailed program template by ID
   */
  @Get('templates/:templateId')
  @Public()
  async getTemplate(@Param('templateId') templateId: string) {
    try {
      const template = await this.programTemplatesService.getTemplate(templateId);

      if (!template) {
        throw new HttpException('Program template not found', HttpStatus.NOT_FOUND);
      }

      return {
        status: 'success',
        template,
        curriculum: await this.programTemplatesService.getCurriculumOutline(templateId),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get template ${templateId}:`, error);
      throw new HttpException(
        `Failed to get template: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create new program template (coach/admin only)
   */
  @Post('templates')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async createTemplate(
    @Body() templateData: Omit<ProgramTemplate, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'enrollmentCount'>,
    @Request() req: any
  ) {
    try {
      // Add creator information
      const dataWithCreator = {
        ...templateData,
        createdBy: req.user.sub,
      };

      const template = await this.programTemplatesService.createTemplate(dataWithCreator);

      return {
        status: 'success',
        message: 'Program template created successfully',
        template: {
          id: template.id,
          title: template.title,
          category: template.category,
          difficulty: template.difficulty,
          duration: template.duration,
        },
      };
    } catch (error) {
      this.logger.error('❌ Failed to create program template:', error);
      throw new HttpException(
        `Template creation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update program template (coach/admin only)
   */
  @Put('templates/:templateId')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() updates: Partial<ProgramTemplate>,
    @Request() req: any
  ) {
    try {
      const template = await this.programTemplatesService.updateTemplate(templateId, updates);

      return {
        status: 'success',
        message: 'Program template updated successfully',
        template: {
          id: template.id,
          title: template.title,
          updatedAt: template.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Failed to update template ${templateId}:`, error);
      throw new HttpException(
        `Template update failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Clone program template (coach/admin only)
   */
  @Post('templates/:templateId/clone')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async cloneTemplate(
    @Param('templateId') templateId: string,
    @Body() cloneData: { title: string; customizations?: Partial<ProgramTemplate> },
    @Request() req: any
  ) {
    try {
      if (!cloneData.title) {
        throw new HttpException('New title is required', HttpStatus.BAD_REQUEST);
      }

      const customizations = {
        ...cloneData.customizations,
        createdBy: req.user.sub,
      };

      const clonedTemplate = await this.programTemplatesService.cloneTemplate(
        templateId,
        cloneData.title,
        customizations
      );

      return {
        status: 'success',
        message: 'Program template cloned successfully',
        template: {
          id: clonedTemplate.id,
          title: clonedTemplate.title,
          originalId: templateId,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Failed to clone template ${templateId}:`, error);
      throw new HttpException(
        `Template cloning failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Enroll client in a program (coach/admin only)
   */
  @Post('enroll')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async enrollClient(
    @Body() enrollmentData: {
      clientId: string;
      programId: string;
      coachId?: string;
    },
    @Request() req: any
  ) {
    try {
      if (!enrollmentData.clientId || !enrollmentData.programId) {
        throw new HttpException('Client ID and Program ID are required', HttpStatus.BAD_REQUEST);
      }

      const coachId = enrollmentData.coachId || req.user.sub;
      const progress = await this.programTemplatesService.enrollClient(
        enrollmentData.clientId,
        enrollmentData.programId,
        coachId
      );

      return {
        status: 'success',
        message: 'Client enrolled successfully',
        enrollment: {
          clientId: progress.clientId,
          programId: progress.programId,
          coachId: progress.coachId,
          enrolledAt: progress.enrolledAt,
          expectedCompletionDate: progress.expectedCompletionDate,
          status: progress.status,
        },
      };
    } catch (error) {
      this.logger.error('❌ Failed to enroll client:', error);
      throw new HttpException(
        `Enrollment failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get client's program progress
   */
  @Get('progress/:clientId/:programId')
  @UseGuards(JwtAuthGuard)
  async getClientProgress(
    @Param('clientId') clientId: string,
    @Param('programId') programId: string,
    @Request() req: any
  ) {
    try {
      // In production, verify that the user can access this client's data
      const progress = await this.programTemplatesService.getClientProgress(clientId, programId);

      if (!progress) {
        throw new HttpException('Program progress not found', HttpStatus.NOT_FOUND);
      }

      return {
        status: 'success',
        progress: {
          ...progress,
          nextSteps: this.getNextSteps(progress),
          milestones: this.getMilestones(progress),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get progress for client ${clientId}:`, error);
      throw new HttpException(
        `Failed to get progress: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Complete a lesson
   */
  @Post('progress/:clientId/:programId/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(
    @Param('clientId') clientId: string,
    @Param('programId') programId: string,
    @Param('lessonId') lessonId: string,
    @Body() lessonData: { notes?: string; timeSpent?: number; rating?: number },
    @Request() req: any
  ) {
    try {
      const progress = await this.programTemplatesService.completeLesson(
        clientId,
        programId,
        lessonId
      );

      const response: any = {
        status: 'success',
        message: 'Lesson completed successfully',
        progress: {
          currentModule: progress.currentModule,
          currentLesson: progress.currentLesson,
          overallProgress: progress.overallProgress,
          completedLessons: progress.completedLessons.length,
        },
      };

      // Check for achievements
      const achievements = this.checkAchievements(progress);
      if (achievements.length > 0) {
        response.achievements = achievements;
      }

      return response;
    } catch (error) {
      this.logger.error(`❌ Failed to complete lesson ${lessonId}:`, error);
      throw new HttpException(
        `Lesson completion failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get curriculum outline for a program
   */
  @Get('curriculum/:programId')
  @UseGuards(JwtAuthGuard)
  async getCurriculum(@Param('programId') programId: string, @Request() req: any) {
    try {
      const curriculum = await this.programTemplatesService.getCurriculumOutline(programId);

      return {
        status: 'success',
        curriculum,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get curriculum for ${programId}:`, error);
      throw new HttpException(
        `Failed to get curriculum: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate completion certificate
   */
  @Post('certificate/:clientId/:programId')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async generateCertificate(
    @Param('clientId') clientId: string,
    @Param('programId') programId: string,
    @Request() req: any
  ) {
    try {
      const certificate = await this.programTemplatesService.generateCertificate(
        clientId,
        programId
      );

      return {
        status: 'success',
        message: 'Certificate generated successfully',
        certificate,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to generate certificate:`, error);
      throw new HttpException(
        `Certificate generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get program statistics (admin only)
   */
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('admin', 'coach')
  async getProgramStatistics(@Request() req: any) {
    try {
      // In a real implementation, fetch actual statistics from database
      const mockStats = {
        totalPrograms: 12,
        activePrograms: 8,
        totalEnrollments: 342,
        activeEnrollments: 156,
        completionRate: 78.5,
        averageRating: 4.6,
        popularPrograms: [
          { id: 'life-balance-mastery', title: 'Life Balance Mastery', enrollments: 156, rating: 4.8 },
          { id: 'stress-resilience-program', title: 'Stress & Resilience Building', enrollments: 234, rating: 4.7 },
          { id: 'career-transition-guide', title: 'Career Transition Success', enrollments: 89, rating: 4.9 },
        ],
        categoryDistribution: [
          { category: 'life-coaching', count: 4 },
          { category: 'career', count: 3 },
          { category: 'wellness', count: 3 },
          { category: 'relationships', count: 2 },
        ],
        monthlyEnrollments: [
          { month: 'Jan', enrollments: 28 },
          { month: 'Feb', enrollments: 35 },
          { month: 'Mar', enrollments: 42 },
          { month: 'Apr', enrollments: 38 },
          { month: 'May', enrollments: 45 },
          { month: 'Jun', enrollments: 52 },
        ],
      };

      return {
        status: 'success',
        statistics: mockStats,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Failed to get program statistics:', error);
      throw new HttpException(
        'Failed to get statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search programs
   */
  @Get('search')
  @Public()
  async searchPrograms(
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('duration') duration?: string,
  ) {
    try {
      // Get all templates and apply search filters
      const templates = await this.programTemplatesService.getAllTemplates();
      let filteredTemplates = templates;

      // Text search
      if (query) {
        const searchTerm = query.toLowerCase();
        filteredTemplates = filteredTemplates.filter(template =>
          template.title.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Category filter
      if (category) {
        filteredTemplates = filteredTemplates.filter(t => t.category === category);
      }

      // Difficulty filter
      if (difficulty) {
        filteredTemplates = filteredTemplates.filter(t => t.difficulty === difficulty);
      }

      // Price filter
      if (maxPrice) {
        const maxPriceValue = parseFloat(maxPrice);
        filteredTemplates = filteredTemplates.filter(t => t.priceRange.min <= maxPriceValue);
      }

      // Duration filter
      if (duration) {
        filteredTemplates = filteredTemplates.filter(t => t.duration.includes(duration));
      }

      return {
        status: 'success',
        results: filteredTemplates.map(template => ({
          id: template.id,
          title: template.title,
          description: template.description,
          category: template.category,
          difficulty: template.difficulty,
          duration: template.duration,
          priceRange: template.priceRange,
          rating: template.rating,
          enrollmentCount: template.enrollmentCount,
          tags: template.tags,
        })),
        totalResults: filteredTemplates.length,
        searchQuery: query,
        appliedFilters: { category, difficulty, maxPrice, duration },
      };
    } catch (error) {
      this.logger.error('❌ Failed to search programs:', error);
      throw new HttpException(
        `Search failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Private helper methods

  private getNextSteps(progress: ClientProgramProgress): string[] {
    const nextSteps = [];

    if (progress.status === 'enrolled') {
      nextSteps.push('Start your first lesson');
      nextSteps.push('Schedule initial coaching session');
    } else if (progress.status === 'in-progress') {
      nextSteps.push(`Continue with Module ${progress.currentModule}`);
      nextSteps.push('Complete assigned homework');
      nextSteps.push('Schedule next coaching session');
    } else if (progress.status === 'completed') {
      nextSteps.push('Request completion certificate');
      nextSteps.push('Explore advanced programs');
      nextSteps.push('Provide program feedback');
    }

    return nextSteps;
  }

  private getMilestones(progress: ClientProgramProgress): any[] {
    const milestones = [];

    // Progress milestones
    if (progress.overallProgress >= 25) {
      milestones.push({
        title: 'Quarter Complete',
        description: '25% of program completed',
        achieved: true,
        date: progress.lastActivity,
      });
    }

    if (progress.overallProgress >= 50) {
      milestones.push({
        title: 'Halfway There',
        description: '50% of program completed',
        achieved: true,
        date: progress.lastActivity,
      });
    }

    if (progress.overallProgress >= 75) {
      milestones.push({
        title: 'Almost Done',
        description: '75% of program completed',
        achieved: true,
        date: progress.lastActivity,
      });
    }

    if (progress.overallProgress === 100) {
      milestones.push({
        title: 'Program Complete',
        description: 'Congratulations on completing the program!',
        achieved: true,
        date: progress.actualCompletionDate,
      });
    }

    return milestones;
  }

  private checkAchievements(progress: ClientProgramProgress): any[] {
    const achievements = [];

    // Lesson completion achievements
    if (progress.completedLessons.length === 5) {
      achievements.push({
        title: 'Learning Streak',
        description: 'Completed 5 lessons',
        icon: '📚',
        points: 50,
      });
    }

    if (progress.completedLessons.length === 10) {
      achievements.push({
        title: 'Dedicated Learner',
        description: 'Completed 10 lessons',
        icon: '🎯',
        points: 100,
      });
    }

    // Progress achievements
    if (progress.overallProgress >= 50 && progress.overallProgress < 51) {
      achievements.push({
        title: 'Halfway Hero',
        description: 'Reached 50% completion',
        icon: '🏆',
        points: 100,
      });
    }

    return achievements;
  }
}