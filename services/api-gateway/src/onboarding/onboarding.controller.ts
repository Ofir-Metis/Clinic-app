/**
 * OnboardingController - Handles client onboarding API endpoints
 * Manages onboarding flow, step completion, and progress tracking
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OnboardingService, OnboardingProgress, OnboardingStep } from './onboarding.service';
import { JwtAuthGuard, RequireRoles, Public } from '@clinic/common';

@Controller('api/onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * Initialize onboarding for a new client (public endpoint for registration)
   */
  @Post('initialize')
  @Public()
  async initializeOnboarding(
    @Body() initData: { email: string; firstName?: string; lastName?: string }
  ) {
    try {
      if (!initData.email) {
        throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
      }

      const progress = await this.onboardingService.initializeOnboarding(initData.email);

      return {
        status: 'success',
        message: 'Onboarding initialized successfully',
        clientId: progress.clientId,
        nextStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        estimatedTime: '45-60 minutes',
      };
    } catch (error) {
      this.logger.error('❌ Failed to initialize onboarding:', error);
      throw new HttpException(
        `Onboarding initialization failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get onboarding progress for a client
   */
  @Get('progress/:clientId')
  @UseGuards(JwtAuthGuard)
  async getProgress(@Param('clientId') clientId: string, @Request() req: any) {
    try {
      // In production, verify that the user can access this client's data
      const progress = await this.onboardingService.getProgress(clientId);

      if (!progress) {
        throw new HttpException('Onboarding not found', HttpStatus.NOT_FOUND);
      }

      return {
        status: 'success',
        progress,
        nextSteps: this.getNextSteps(progress),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get progress for client ${clientId}:`, error);
      throw new HttpException(
        `Failed to get onboarding progress: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all available onboarding steps
   */
  @Get('steps')
  @Public()
  async getOnboardingSteps() {
    try {
      const steps = this.onboardingService.getOnboardingSteps();
      const totalTime = steps.reduce((sum, step) => sum + step.estimatedMinutes, 0);

      return {
        status: 'success',
        steps,
        totalSteps: steps.length,
        estimatedTotalTime: totalTime,
        breakdown: {
          required: steps.filter(s => s.required).length,
          optional: steps.filter(s => !s.required).length,
        },
      };
    } catch (error) {
      this.logger.error('❌ Failed to get onboarding steps:', error);
      throw new HttpException(
        'Failed to get onboarding steps',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Complete an onboarding step
   */
  @Post('steps/:stepId/complete')
  @UseGuards(JwtAuthGuard)
  async completeStep(
    @Param('stepId') stepId: string,
    @Body() stepData: { clientId: string; data: any },
    @Request() req: any
  ) {
    try {
      if (!stepData.clientId) {
        throw new HttpException('Client ID is required', HttpStatus.BAD_REQUEST);
      }

      // Validate step data based on step type
      this.validateStepData(stepId, stepData.data);

      const progress = await this.onboardingService.completeStep(
        stepData.clientId,
        stepId,
        stepData.data
      );

      const response: any = {
        status: 'success',
        message: `Step ${stepId} completed successfully`,
        progress: {
          currentStep: progress.currentStep,
          percentComplete: progress.percentComplete,
          status: progress.status,
        },
      };

      // Add step-specific responses
      if (stepId === 'lifestyle-assessment' && progress.assessment) {
        response.recommendations = {
          programs: progress.assessment.recommendedPrograms,
          coaches: progress.assessment.recommendedCoaches,
        };
      }

      if (progress.status === 'completed') {
        response.message = 'Congratulations! Onboarding completed successfully';
        response.nextActions = [
          'Schedule your first coaching session',
          'Review your personalized program materials',
          'Connect with your assigned coach',
        ];
      }

      return response;
    } catch (error) {
      this.logger.error(`❌ Failed to complete step ${stepId}:`, error);
      throw new HttpException(
        `Step completion failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get available coaching programs
   */
  @Get('programs')
  @Public()
  async getPrograms(@Query('recommended') recommended?: string) {
    try {
      const programs = this.onboardingService.getAvailablePrograms();

      // Filter by recommended programs if specified
      let filteredPrograms = programs;
      if (recommended) {
        const recommendedIds = recommended.split(',');
        filteredPrograms = programs.filter(p => recommendedIds.includes(p.id));
      }

      return {
        status: 'success',
        programs: filteredPrograms,
        totalPrograms: programs.length,
        filteredCount: filteredPrograms.length,
      };
    } catch (error) {
      this.logger.error('❌ Failed to get programs:', error);
      throw new HttpException(
        'Failed to get coaching programs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Submit intake form (specific endpoint for the main form)
   */
  @Post('intake-form')
  @UseGuards(JwtAuthGuard)
  async submitIntakeForm(
    @Body() formData: {
      clientId: string;
      personalInfo: any;
      coachingBackground: any;
      lifestyle: any;
      healthAndWellness: any;
      goals: any;
    },
    @Request() req: any
  ) {
    try {
      if (!formData.clientId) {
        throw new HttpException('Client ID is required', HttpStatus.BAD_REQUEST);
      }

      // Validate required fields
      this.validateIntakeForm(formData);

      const progress = await this.onboardingService.completeStep(
        formData.clientId,
        'intake-form',
        formData
      );

      return {
        status: 'success',
        message: 'Intake form submitted successfully',
        progress: {
          currentStep: progress.currentStep,
          percentComplete: progress.percentComplete,
        },
        nextStep: 'lifestyle-assessment',
      };
    } catch (error) {
      this.logger.error('❌ Failed to submit intake form:', error);
      throw new HttpException(
        `Intake form submission failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Submit lifestyle assessment
   */
  @Post('assessment')
  @UseGuards(JwtAuthGuard)
  async submitAssessment(
    @Body() assessmentData: {
      clientId: string;
      personalityType: string;
      learningStyle: string;
      communicationStyle: string;
      changeReadiness: number;
      supportSystem: number;
      selfAwareness: number;
      additionalInfo?: any;
    },
    @Request() req: any
  ) {
    try {
      if (!assessmentData.clientId) {
        throw new HttpException('Client ID is required', HttpStatus.BAD_REQUEST);
      }

      const progress = await this.onboardingService.completeStep(
        assessmentData.clientId,
        'lifestyle-assessment',
        assessmentData
      );

      return {
        status: 'success',
        message: 'Assessment completed successfully',
        progress: {
          currentStep: progress.currentStep,
          percentComplete: progress.percentComplete,
        },
        recommendations: progress.assessment ? {
          programs: progress.assessment.recommendedPrograms,
          coaches: progress.assessment.recommendedCoaches,
          insights: this.generateAssessmentInsights(progress.assessment),
        } : null,
        nextStep: 'goal-setting',
      };
    } catch (error) {
      this.logger.error('❌ Failed to submit assessment:', error);
      throw new HttpException(
        `Assessment submission failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Send onboarding reminder
   */
  @Post('reminder/:clientId')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('coach', 'admin')
  async sendReminder(@Param('clientId') clientId: string, @Request() req: any) {
    try {
      await this.onboardingService.sendOnboardingReminder(clientId);

      return {
        status: 'success',
        message: 'Onboarding reminder sent successfully',
      };
    } catch (error) {
      this.logger.error(`❌ Failed to send reminder to client ${clientId}:`, error);
      throw new HttpException(
        `Failed to send reminder: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get onboarding statistics (admin endpoint)
   */
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('admin', 'coach')
  async getOnboardingStatistics(@Request() req: any) {
    try {
      // In a real implementation, you'd fetch actual statistics from database
      const mockStats = {
        totalOnboardings: 156,
        completedOnboardings: 142,
        inProgressOnboardings: 12,
        abandonedOnboardings: 2,
        averageCompletionTime: '3.2 days',
        completionRate: 91.0,
        popularPrograms: [
          { name: 'Life Balance Mastery', count: 45 },
          { name: 'Stress & Anxiety Management', count: 38 },
          { name: 'Career Transition Coaching', count: 32 },
        ],
        commonGoals: [
          { goal: 'Work-life balance', frequency: 78 },
          { goal: 'Stress management', frequency: 65 },
          { goal: 'Career growth', frequency: 52 },
          { goal: 'Relationship improvement', frequency: 41 },
        ],
      };

      return {
        status: 'success',
        statistics: mockStats,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Failed to get onboarding statistics:', error);
      throw new HttpException(
        'Failed to get statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Private helper methods

  private getNextSteps(progress: OnboardingProgress) {
    const allSteps = this.onboardingService.getOnboardingSteps();
    const remainingSteps = allSteps.filter(
      step => !progress.completedSteps.some(completed => completed.id === step.id)
    );

    return remainingSteps.slice(0, 3); // Next 3 steps
  }

  private validateStepData(stepId: string, data: any) {
    switch (stepId) {
      case 'intake-form':
        this.validateIntakeForm(data);
        break;
      case 'lifestyle-assessment':
        this.validateAssessment(data);
        break;
      case 'goal-setting':
        this.validateGoalSetting(data);
        break;
      case 'program-selection':
        this.validateProgramSelection(data);
        break;
      // Add more validations as needed
    }
  }

  private validateIntakeForm(data: any) {
    const required = ['personalInfo', 'coachingBackground', 'goals'];
    for (const field of required) {
      if (!data[field]) {
        throw new HttpException(`${field} is required`, HttpStatus.BAD_REQUEST);
      }
    }

    if (!data.personalInfo.firstName || !data.personalInfo.email) {
      throw new HttpException('First name and email are required', HttpStatus.BAD_REQUEST);
    }
  }

  private validateAssessment(data: any) {
    const required = ['personalityType', 'learningStyle', 'communicationStyle'];
    for (const field of required) {
      if (!data[field]) {
        throw new HttpException(`${field} is required`, HttpStatus.BAD_REQUEST);
      }
    }

    const numericFields = ['changeReadiness', 'supportSystem', 'selfAwareness'];
    for (const field of numericFields) {
      const value = parseInt(data[field]);
      if (isNaN(value) || value < 1 || value > 10) {
        throw new HttpException(`${field} must be a number between 1 and 10`, HttpStatus.BAD_REQUEST);
      }
    }
  }

  private validateGoalSetting(data: any) {
    if (!data.primaryGoals || !Array.isArray(data.primaryGoals) || data.primaryGoals.length === 0) {
      throw new HttpException('At least one primary goal is required', HttpStatus.BAD_REQUEST);
    }
  }

  private validateProgramSelection(data: any) {
    if (!data.selectedProgram) {
      throw new HttpException('Program selection is required', HttpStatus.BAD_REQUEST);
    }
  }

  private generateAssessmentInsights(assessment: any) {
    const insights = [];

    if (assessment.changeReadiness >= 8) {
      insights.push('You show high readiness for change, which is a great foundation for coaching success.');
    } else if (assessment.changeReadiness <= 4) {
      insights.push('Building motivation and readiness for change will be an important focus area.');
    }

    if (assessment.supportSystem >= 7) {
      insights.push('Your strong support system will be a valuable asset in your coaching journey.');
    } else if (assessment.supportSystem <= 4) {
      insights.push('Developing a stronger support network could enhance your coaching outcomes.');
    }

    if (assessment.selfAwareness >= 8) {
      insights.push('Your high self-awareness will accelerate your personal growth process.');
    }

    return insights;
  }
}