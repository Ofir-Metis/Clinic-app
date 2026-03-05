/**
 * SessionAnalysisController - REST API for coaching session AI analysis
 * Handles transcription, summary generation, and coach review workflows
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  HttpException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@clinic/common';
import { SessionAnalysisService, AnalysisRequest } from './session-analysis.service';
import { CurrentUser } from '../decorators/current-user.decorator';

interface UserContext {
  userId: string;
  role: string;
  email: string;
}

@Controller('session-analysis')
@ApiTags('Session Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SessionAnalysisController {
  private readonly logger = new Logger(SessionAnalysisController.name);

  constructor(private readonly sessionAnalysisService: SessionAnalysisService) {}

  @Post('process')
  @ApiOperation({ summary: 'Process a coaching session recording for AI analysis' })
  @ApiResponse({ status: 202, description: 'Analysis started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  async processSessionRecording(
    @Body() request: AnalysisRequest,
    @CurrentUser() user: UserContext
  ) {
    try {
      this.logger.debug(`Processing session analysis request for appointment ${request.appointmentId}`);

      // Validate coach access
      if (request.coachId !== user.userId && user.role !== 'admin') {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const result = await this.sessionAnalysisService.processSessionRecording(request);

      if (!result.success) {
        throw new HttpException(
          {
            message: 'Analysis processing failed',
            errors: result.errors,
            processingTimeMs: result.processingTimeMs
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }

      return {
        message: 'Session analysis completed successfully',
        transcriptionId: result.transcriptionId,
        summaryId: result.summaryId,
        processingTimeMs: result.processingTimeMs,
        warnings: result.warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Session analysis failed: ${errorMessage}`, errorStack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error during analysis',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('summary/:appointmentId')
  @ApiOperation({ summary: 'Get session summary by appointment ID' })
  @ApiParam({ name: 'appointmentId', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Session summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Summary not found' })
  async getSessionSummary(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: UserContext
  ) {
    const summary = await this.sessionAnalysisService.getSessionSummary(appointmentId);
    
    if (!summary) {
      throw new HttpException('Session summary not found', HttpStatus.NOT_FOUND);
    }

    // Check access permissions
    const hasAccess = summary.coachId === user.userId || 
                     (summary.clientId === user.userId && summary.sharedWithClient) ||
                     user.role === 'admin';

    if (!hasAccess) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    // Return appropriate data based on user role
    if (summary.clientId === user.userId) {
      // Client view - limited data
      return {
        id: summary.id,
        appointmentId: summary.appointmentId,
        sessionType: summary.sessionType,
        keyInsights: summary.keyInsights,
        progressMade: summary.progressMade,
        actionItems: summary.actionItems,
        nextSessionFocus: summary.nextSessionFocus,
        emotionalTone: summary.emotionalTone,
        homework: summary.homework,
        createdAt: summary.createdAt,
        sharedWithClient: summary.sharedWithClient,
        clientViewed: summary.clientViewed
      };
    }

    // Coach/admin view - full data
    return summary;
  }

  @Get('transcription/:appointmentId')
  @ApiOperation({ summary: 'Get transcription by appointment ID' })
  @ApiParam({ name: 'appointmentId', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Transcription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transcription not found' })
  async getTranscription(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: UserContext,
    @Query('include-segments') includeSegments?: boolean
  ) {
    const transcription = await this.sessionAnalysisService.getTranscription(appointmentId);
    
    if (!transcription) {
      throw new HttpException('Transcription not found', HttpStatus.NOT_FOUND);
    }

    // Check access permissions
    const hasAccess = transcription.coachId === user.userId || 
                     (transcription.clientId === user.userId && transcription.clientAccessAllowed) ||
                     user.role === 'admin';

    if (!hasAccess) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    // Return appropriate data
    const response = {
      id: transcription.id,
      appointmentId: transcription.appointmentId,
      status: transcription.status,
      fullText: transcription.fullText,
      characterCount: transcription.characterCount,
      wordCount: transcription.wordCount,
      durationSeconds: transcription.durationSeconds,
      audioQuality: transcription.audioQuality,
      confidenceScore: transcription.confidenceScore,
      languageDetected: transcription.languageDetected,
      createdAt: transcription.createdAt,
      segments: includeSegments ? transcription.segments : undefined
    };

    return response;
  }

  @Put('summary/:summaryId/review')
  @ApiOperation({ summary: 'Update coach review for session summary' })
  @ApiParam({ name: 'summaryId', description: 'Summary UUID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 404, description: 'Summary not found' })
  async updateCoachReview(
    @Param('summaryId', ParseUUIDPipe) summaryId: string,
    @Body() review: {
      feedback?: string;
      rating?: number;
      approved: boolean;
    },
    @CurrentUser() user: UserContext
  ) {
    try {
      await this.sessionAnalysisService.updateCoachReview(
        summaryId,
        user.userId,
        review
      );

      return {
        message: 'Coach review updated successfully',
        summaryId,
        approved: review.approved
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
        throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  @Post('summary/:summaryId/share')
  @ApiOperation({ summary: 'Share session summary with client' })
  @ApiParam({ name: 'summaryId', description: 'Summary UUID' })
  @ApiResponse({ status: 200, description: 'Summary shared successfully' })
  @ApiResponse({ status: 400, description: 'Summary cannot be shared' })
  async shareWithClient(
    @Param('summaryId', ParseUUIDPipe) summaryId: string,
    @CurrentUser() user: UserContext
  ) {
    try {
      await this.sessionAnalysisService.shareWithClient(summaryId, user.userId);

      return {
        message: 'Summary shared with client successfully',
        summaryId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Cannot share')) {
        throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
      }
      if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
        throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get processing statistics' })
  @ApiQuery({ name: 'coach-id', required: false, description: 'Filter by coach ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getProcessingStats(
    @CurrentUser() user: UserContext,
    @Query('coach-id') coachId?: string
  ) {
    // If user is not admin, they can only see their own stats
    const targetCoachId = user.role === 'admin' ? coachId : user.userId;
    
    const stats = await this.sessionAnalysisService.getProcessingStats(targetCoachId);
    
    return {
      coachId: targetCoachId,
      ...stats
    };
  }

  @Post('summary/:summaryId/client-viewed')
  @ApiOperation({ summary: 'Mark summary as viewed by client' })
  @ApiParam({ name: 'summaryId', description: 'Summary UUID' })
  @ApiResponse({ status: 200, description: 'Summary marked as viewed' })
  async markClientViewed(
    @Param('summaryId', ParseUUIDPipe) summaryId: string,
    @CurrentUser() user: UserContext
  ) {
    // This endpoint is called when client views the summary
    // Implementation would update the clientViewed and clientViewedAt fields
    
    return {
      message: 'Summary marked as viewed',
      summaryId,
      viewedAt: new Date()
    };
  }

  // NATS Microservice Message Handlers

  @MessagePattern('session.analyze')
  async handleAnalysisRequest(@Payload() data: AnalysisRequest) {
    try {
      this.logger.debug(`Received analysis request for appointment ${data.appointmentId}`);
      
      const result = await this.sessionAnalysisService.processSessionRecording(data);
      
      return {
        success: result.success,
        transcriptionId: result.transcriptionId,
        summaryId: result.summaryId,
        processingTimeMs: result.processingTimeMs,
        errors: result.errors,
        warnings: result.warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`NATS analysis request failed: ${errorMessage}`, errorStack);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  @MessagePattern('session.get_summary')
  async handleGetSummaryRequest(@Payload() data: { appointmentId: string }) {
    try {
      const summary = await this.sessionAnalysisService.getSessionSummary(data.appointmentId);
      
      return {
        success: true,
        summary
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Get summary request failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  @MessagePattern('session.get_transcription')
  async handleGetTranscriptionRequest(@Payload() data: { appointmentId: string }) {
    try {
      const transcription = await this.sessionAnalysisService.getTranscription(data.appointmentId);
      
      return {
        success: true,
        transcription
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Get transcription request failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  @MessagePattern('session.processing_stats')
  async handleStatsRequest(@Payload() data: { coachId?: string }) {
    try {
      const stats = await this.sessionAnalysisService.getProcessingStats(data.coachId);
      
      return {
        success: true,
        stats
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Stats request failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}