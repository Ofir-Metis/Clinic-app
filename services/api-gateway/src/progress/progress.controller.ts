import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@clinic/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const PROGRESS_SERVICE_URL = process.env.PROGRESS_SERVICE_URL || 'http://progress-service:3015';

@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get client dashboard with overview and recent activity
   * Static route - must be before parameterized routes
   */
  @Get('dashboard')
  async getDashboard(
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /progress/dashboard, traceId: ${traceId}`);

    const { data } = await firstValueFrom(
      this.httpService.get(`${PROGRESS_SERVICE_URL}/progress/dashboard`, {
        headers: {
          Authorization: auth,
          'X-Trace-Id': traceId || '',
        },
      }),
    );
    return data;
  }

  /**
   * Get motivational insights and encouragement
   * Static route - must be before parameterized routes
   */
  @Get('insights/motivation')
  async getMotivationalInsights(
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /progress/insights/motivation, traceId: ${traceId}`);

    const { data } = await firstValueFrom(
      this.httpService.get(`${PROGRESS_SERVICE_URL}/progress/insights/motivation`, {
        headers: {
          Authorization: auth,
          'X-Trace-Id': traceId || '',
        },
      }),
    );
    return data;
  }

  /**
   * Get progress summary for sharing
   * Static route - must be before parameterized routes
   */
  @Get('share/summary')
  async getShareableSummary(
    @Query('period') period: string,
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /progress/share/summary?period=${period}, traceId: ${traceId}`);

    const params = new URLSearchParams();
    if (period) params.append('period', period);

    const { data } = await firstValueFrom(
      this.httpService.get(`${PROGRESS_SERVICE_URL}/progress/share/summary?${params.toString()}`, {
        headers: {
          Authorization: auth,
          'X-Trace-Id': traceId || '',
        },
      }),
    );
    return data;
  }

  /**
   * Create a new goal
   */
  @Post('goals')
  @HttpCode(HttpStatus.CREATED)
  async createGoal(
    @Body() createGoalRequest: any,
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`POST /progress/goals, traceId: ${traceId}`);

    const { data } = await firstValueFrom(
      this.httpService.post(`${PROGRESS_SERVICE_URL}/progress/goals`, createGoalRequest, {
        headers: {
          Authorization: auth,
          'X-Trace-Id': traceId || '',
        },
      }),
    );
    return data;
  }

  /**
   * Get all goals for the authenticated user
   */
  @Get('goals')
  async getGoals(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Headers('authorization') auth?: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /progress/goals, traceId: ${traceId}`);

    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    if (categoryId) params.append('categoryId', categoryId);
    if (search) params.append('search', search);

    const { data } = await firstValueFrom(
      this.httpService.get(`${PROGRESS_SERVICE_URL}/progress/goals?${params.toString()}`, {
        headers: {
          Authorization: auth || '',
          'X-Trace-Id': traceId || '',
        },
      }),
    );
    return data;
  }

  /**
   * Get detailed analytics for a goal
   * Static route - must be before /goals/:goalId
   */
  @Get('goals/:goalId/analytics')
  async getGoalAnalytics(
    @Param('goalId') goalId: string,
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /progress/goals/${goalId}/analytics, traceId: ${traceId}`);

    const { data } = await firstValueFrom(
      this.httpService.get(`${PROGRESS_SERVICE_URL}/progress/goals/${goalId}/analytics`, {
        headers: {
          Authorization: auth,
          'X-Trace-Id': traceId || '',
        },
      }),
    );
    return data;
  }

  /**
   * Get progress entries for a goal
   * Static route - must be before /goals/:goalId
   */
  @Get('goals/:goalId/entries')
  async getProgressEntries(
    @Param('goalId') goalId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Headers('authorization') auth?: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /progress/goals/${goalId}/entries, traceId: ${traceId}`);

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const { data } = await firstValueFrom(
      this.httpService.get(
        `${PROGRESS_SERVICE_URL}/progress/goals/${goalId}/entries?${params.toString()}`,
        {
          headers: {
            Authorization: auth || '',
            'X-Trace-Id': traceId || '',
          },
        },
      ),
    );
    return data;
  }

  /**
   * Get milestones for a goal
   * Static route - must be before /goals/:goalId
   */
  @Get('goals/:goalId/milestones')
  async getMilestones(
    @Param('goalId') goalId: string,
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /progress/goals/${goalId}/milestones, traceId: ${traceId}`);

    const { data } = await firstValueFrom(
      this.httpService.get(`${PROGRESS_SERVICE_URL}/progress/goals/${goalId}/milestones`, {
        headers: {
          Authorization: auth,
          'X-Trace-Id': traceId || '',
        },
      }),
    );
    return data;
  }

  /**
   * Get a specific goal by ID
   * Parameterized route - must be after static routes
   */
  @Get('goals/:goalId')
  async getGoal(
    @Param('goalId') goalId: string,
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /progress/goals/${goalId}, traceId: ${traceId}`);

    const { data } = await firstValueFrom(
      this.httpService.get(`${PROGRESS_SERVICE_URL}/progress/goals/${goalId}`, {
        headers: {
          Authorization: auth,
          'X-Trace-Id': traceId || '',
        },
      }),
    );
    return data;
  }

  /**
   * Update progress on a goal
   */
  @Post('goals/:goalId/progress')
  @HttpCode(HttpStatus.CREATED)
  async updateProgress(
    @Param('goalId') goalId: string,
    @Body() updateRequest: any,
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`POST /progress/goals/${goalId}/progress, traceId: ${traceId}`);

    const { data } = await firstValueFrom(
      this.httpService.post(
        `${PROGRESS_SERVICE_URL}/progress/goals/${goalId}/progress`,
        updateRequest,
        {
          headers: {
            Authorization: auth,
            'X-Trace-Id': traceId || '',
          },
        },
      ),
    );
    return data;
  }

  /**
   * Mark a milestone as achieved
   */
  @Put('milestones/:milestoneId/achieve')
  async achieveMilestone(
    @Param('milestoneId') milestoneId: string,
    @Body() celebrationData: any,
    @Headers('authorization') auth: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`PUT /progress/milestones/${milestoneId}/achieve, traceId: ${traceId}`);

    const { data } = await firstValueFrom(
      this.httpService.put(
        `${PROGRESS_SERVICE_URL}/progress/milestones/${milestoneId}/achieve`,
        celebrationData,
        {
          headers: {
            Authorization: auth,
            'X-Trace-Id': traceId || '',
          },
        },
      ),
    );
    return data;
  }
}
