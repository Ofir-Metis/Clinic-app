/**
 * ProgressController - REST API endpoints for client progress tracking
 * Handles HTTP requests for goal management and progress updates
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
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { ProgressService, CreateGoalRequest, UpdateProgressRequest } from './progress.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ClientGoal } from '../entities/client-goal.entity';
import { ProgressEntry } from '../entities/progress-entry.entity';
import { Milestone } from '../entities/milestone.entity';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: 'client' | 'coach';
    email: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(private readonly progressService: ProgressService) {}

  /**
   * Get client dashboard with overview and recent activity
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(@Request() req: AuthenticatedRequest): Promise<ApiResponse> {
    try {
      const dashboardData = await this.progressService.getDashboardData(req.user.id);
      
      return {
        success: true,
        data: dashboardData,
        message: 'Dashboard data retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard for user ${req.user.id}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve dashboard data'
      };
    }
  }

  /**
   * Create a new goal
   */
  @Post('goals')
  @HttpCode(HttpStatus.CREATED)
  async createGoal(
    @Request() req: AuthenticatedRequest,
    @Body() createGoalRequest: CreateGoalRequest
  ): Promise<ApiResponse<ClientGoal>> {
    try {
      // For now, assume coachId can be passed in request or derived from context
      const coachId = req.user.role === 'coach' ? req.user.id : undefined;
      
      const goal = await this.progressService.createGoal(
        req.user.id,
        coachId,
        createGoalRequest
      );

      return {
        success: true,
        data: goal,
        message: 'Goal created successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to create goal for user ${req.user.id}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create goal'
      };
    }
  }

  /**
   * Get all goals for the authenticated user
   */
  @Get('goals')
  @HttpCode(HttpStatus.OK)
  async getGoals(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string
  ): Promise<ApiResponse<ClientGoal[]>> {
    try {
      const filters = { status, type, categoryId, search } as any;
      const goals = await this.progressService.getGoals(req.user.id, filters);

      return {
        success: true,
        data: goals,
        message: `Retrieved ${goals.length} goals`
      };
    } catch (error) {
      this.logger.error(`Failed to get goals for user ${req.user.id}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve goals'
      };
    }
  }

  /**
   * Get a specific goal by ID
   */
  @Get('goals/:goalId')
  @HttpCode(HttpStatus.OK)
  async getGoal(
    @Request() req: AuthenticatedRequest,
    @Param('goalId') goalId: string
  ): Promise<ApiResponse<ClientGoal>> {
    try {
      const goals = await this.progressService.getGoals(req.user.id, {});
      const goal = goals.find(g => g.id === goalId);

      if (!goal) {
        return {
          success: false,
          error: 'Goal not found or access denied'
        };
      }

      return {
        success: true,
        data: goal,
        message: 'Goal retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get goal ${goalId} for user ${req.user.id}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve goal'
      };
    }
  }

  /**
   * Update progress on a goal
   */
  @Post('goals/:goalId/progress')
  @HttpCode(HttpStatus.CREATED)
  async updateProgress(
    @Request() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Body() updateRequest: UpdateProgressRequest
  ): Promise<ApiResponse<{
    goal: ClientGoal;
    entry: ProgressEntry;
    milestonesAchieved: Milestone[];
  }>> {
    try {
      if (!updateRequest.notes || updateRequest.notes.trim().length === 0) {
        throw new BadRequestException('Progress notes are required');
      }

      const result = await this.progressService.updateProgress(
        goalId,
        req.user.id,
        updateRequest
      );

      const message = result.milestonesAchieved.length > 0
        ? `Progress updated! ${result.milestonesAchieved.length} milestone(s) achieved! 🎉`
        : 'Progress updated successfully';

      return {
        success: true,
        data: result,
        message
      };
    } catch (error) {
      this.logger.error(`Failed to update progress for goal ${goalId}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress'
      };
    }
  }

  /**
   * Get detailed analytics for a goal
   */
  @Get('goals/:goalId/analytics')
  @HttpCode(HttpStatus.OK)
  async getGoalAnalytics(
    @Request() req: AuthenticatedRequest,
    @Param('goalId') goalId: string
  ): Promise<ApiResponse> {
    try {
      const analytics = await this.progressService.getGoalAnalytics(goalId, req.user.id);

      return {
        success: true,
        data: analytics,
        message: 'Goal analytics retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get analytics for goal ${goalId}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve goal analytics'
      };
    }
  }

  /**
   * Get progress entries for a goal
   */
  @Get('goals/:goalId/entries')
  @HttpCode(HttpStatus.OK)
  async getProgressEntries(
    @Request() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<ApiResponse<ProgressEntry[]>> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 20;
      const parsedOffset = offset ? parseInt(offset, 10) : 0;

      // Validate parsed values
      if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
        throw new BadRequestException('Invalid limit or offset parameter');
      }

      const entries = await this.progressService.getProgressEntries(
        goalId,
        req.user.id,
        parsedLimit,
        parsedOffset
      );

      return {
        success: true,
        data: entries,
        message: 'Progress entries retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get progress entries for goal ${goalId}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve progress entries'
      };
    }
  }

  /**
   * Get milestones for a goal
   */
  @Get('goals/:goalId/milestones')
  @HttpCode(HttpStatus.OK)
  async getMilestones(
    @Request() req: AuthenticatedRequest,
    @Param('goalId') goalId: string
  ): Promise<ApiResponse<Milestone[]>> {
    try {
      const milestones = await this.progressService.getMilestones(goalId, req.user.id);

      return {
        success: true,
        data: milestones,
        message: 'Milestones retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get milestones for goal ${goalId}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve milestones'
      };
    }
  }

  /**
   * Mark a milestone as achieved
   */
  @Put('milestones/:milestoneId/achieve')
  @HttpCode(HttpStatus.OK)
  async achieveMilestone(
    @Request() req: AuthenticatedRequest,
    @Param('milestoneId') milestoneId: string,
    @Body() celebrationData?: any
  ): Promise<ApiResponse<Milestone>> {
    try {
      const milestone = await this.progressService.achieveMilestone(
        milestoneId,
        req.user.id,
        celebrationData
      );

      return {
        success: true,
        data: milestone,
        message: 'Milestone achieved! Congratulations! 🎉'
      };
    } catch (error) {
      this.logger.error(`Failed to achieve milestone ${milestoneId}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to achieve milestone'
      };
    }
  }

  /**
   * Get motivational insights and encouragement
   */
  @Get('insights/motivation')
  @HttpCode(HttpStatus.OK)
  async getMotivationalInsights(
    @Request() req: AuthenticatedRequest
  ): Promise<ApiResponse> {
    try {
      const dashboardData = await this.progressService.getDashboardData(req.user.id);
      
      const insights = {
        encouragementMessage: dashboardData.motivationalInsights.encouragementMessage,
        currentStreak: dashboardData.motivationalInsights.currentStreak,
        bestStreak: dashboardData.motivationalInsights.bestStreak,
        topAchievements: dashboardData.motivationalInsights.topAchievements,
        progressTrend: this.calculateProgressTrend(dashboardData.weeklyTrends),
        celebrationReady: dashboardData.upcomingMilestones.filter(m => !m.isAchieved).length > 0,
        motivationalQuote: this.getRandomMotivationalQuote()
      };

      return {
        success: true,
        data: insights,
        message: 'Motivational insights retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get motivational insights for user ${req.user.id}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve motivational insights'
      };
    }
  }

  /**
   * Get progress summary for sharing
   */
  @Get('share/summary')
  @HttpCode(HttpStatus.OK)
  async getShareableSummary(
    @Request() req: AuthenticatedRequest,
    @Query('period') period: string = '30' // days
  ): Promise<ApiResponse> {
    try {
      const dashboardData = await this.progressService.getDashboardData(req.user.id);
      
      const shareableSummary = {
        period: `${period} days`,
        totalGoals: dashboardData.overview.totalGoals,
        completedGoals: dashboardData.overview.completedGoals,
        overallProgress: dashboardData.overview.overallCompletionRate,
        milestonesAchieved: dashboardData.overview.achievedMilestones,
        currentStreak: dashboardData.motivationalInsights.currentStreak,
        topCategories: dashboardData.goalsByCategory.slice(0, 3),
        encouragementMessage: dashboardData.motivationalInsights.encouragementMessage
      };

      return {
        success: true,
        data: shareableSummary,
        message: 'Shareable summary generated successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to generate shareable summary for user ${req.user.id}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate shareable summary'
      };
    }
  }

  // Helper methods

  private calculateProgressTrend(weeklyTrends: any[]): 'improving' | 'stable' | 'declining' {
    if (weeklyTrends.length < 2) return 'stable';
    
    const recent = weeklyTrends.slice(-2);
    const [older, newer] = recent;
    
    if (newer.progressEntries > older.progressEntries) return 'improving';
    if (newer.progressEntries < older.progressEntries) return 'declining';
    return 'stable';
  }

  private getRandomMotivationalQuote(): string {
    const quotes = [
      "The only way to do great work is to love what you do. - Steve Jobs",
      "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "It is during our darkest moments that we must focus to see the light. - Aristotle",
      "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
      "The only impossible journey is the one you never begin. - Tony Robbins",
      "In the middle of difficulty lies opportunity. - Albert Einstein",
      "Believe you can and you're halfway there. - Theodore Roosevelt"
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
}