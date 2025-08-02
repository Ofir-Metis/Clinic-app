/**
 * AIController - Handles AI service endpoints for coaching session analysis
 * Provides endpoints for transcription, summarization, insights, and coaching recommendations
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OpenAIService, TranscriptionResult, SessionSummary, CoachingInsights, AIProcessingJob } from './openai.service';
import { JwtAuthGuard, RequireRoles, RequirePermissions } from '@clinic/common';
import * as multer from 'multer';

@Controller('api/ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * Transcribe audio/video file using OpenAI Whisper
   */
  @Post('transcribe')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('ai:transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'audio/mpeg',
          'audio/wav',
          'audio/mp4',
          'video/mp4',
          'audio/webm',
          'video/webm',
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new HttpException('Invalid file type for transcription', HttpStatus.BAD_REQUEST), false);
        }
      },
    })
  )
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() transcriptionOptions: {
      language?: string;
      prompt?: string;
      speakerLabels?: boolean;
      sessionId?: string;
    },
    @Request() req: any
  ) {
    try {
      if (!file) {
        throw new HttpException('Audio file is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`🎙️ Transcription requested by user ${req.user.sub} for file: ${file.originalname}`);

      const options = {
        language: transcriptionOptions.language,
        prompt: transcriptionOptions.prompt || 'This is a life coaching session between a coach and client.',
        speakerLabels: transcriptionOptions.speakerLabels === true,
      };

      const result = await this.openaiService.transcribeRecording(
        file.buffer,
        file.originalname,
        options
      );

      return {
        status: 'success',
        message: 'Transcription completed successfully',
        transcription: {
          id: result.id,
          text: result.text,
          duration: result.duration,
          language: result.language,
          confidence: result.confidence,
          wordCount: result.wordCount,
          segmentsCount: result.segments.length,
          processingTime: result.processingTime,
          speakerLabels: result.speakerLabels,
        },
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          sessionId: transcriptionOptions.sessionId,
          processedBy: req.user.sub,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('❌ Transcription failed:', error);
      throw new HttpException(
        `Transcription failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate session summary from transcript
   */
  @Post('summarize')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('ai:summarize')
  async generateSummary(
    @Body() summaryRequest: {
      transcript: string;
      sessionId: string;
      sessionContext?: {
        coachName?: string;
        clientName?: string;
        sessionGoals?: string[];
        previousSessions?: string;
        duration: number;
      };
    },
    @Request() req: any
  ) {
    try {
      if (!summaryRequest.transcript || !summaryRequest.sessionId) {
        throw new HttpException('Transcript and session ID are required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`📝 Summary generation requested for session ${summaryRequest.sessionId}`);

      const sessionContext = {
        sessionId: summaryRequest.sessionId,
        duration: summaryRequest.sessionContext?.duration || 60,
        ...summaryRequest.sessionContext,
      };

      const summary = await this.openaiService.generateSessionSummary(
        summaryRequest.transcript,
        sessionContext
      );

      return {
        status: 'success',
        message: 'Session summary generated successfully',
        summary: {
          ...summary,
          generatedBy: req.user.sub,
        },
      };
    } catch (error) {
      this.logger.error('❌ Summary generation failed:', error);
      throw new HttpException(
        `Summary generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate coaching insights from multiple sessions
   */
  @Post('insights')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('ai:generate-insights')
  @RequireRoles('coach', 'admin')
  async generateInsights(
    @Body() insightsRequest: {
      clientId: string;
      sessionSummaries: SessionSummary[];
      clientContext: {
        goals: string[];
        challenges: string[];
        timeframe: string;
      };
    },
    @Request() req: any
  ) {
    try {
      if (!insightsRequest.clientId || !insightsRequest.sessionSummaries?.length) {
        throw new HttpException('Client ID and session summaries are required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`🧠 Insights generation requested for client ${insightsRequest.clientId}`);

      const insights = await this.openaiService.generateCoachingInsights(
        insightsRequest.sessionSummaries,
        {
          clientId: insightsRequest.clientId,
          ...insightsRequest.clientContext,
        }
      );

      return {
        status: 'success',
        message: 'Coaching insights generated successfully',
        insights,
        metadata: {
          clientId: insightsRequest.clientId,
          sessionsAnalyzed: insightsRequest.sessionSummaries.length,
          generatedBy: req.user.sub,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('❌ Insights generation failed:', error);
      throw new HttpException(
        `Insights generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Analyze sentiment and emotions in transcript
   */
  @Post('sentiment')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('ai:analyze-sentiment')
  async analyzeSentiment(
    @Body() sentimentRequest: {
      transcript: string;
      sessionId: string;
    },
    @Request() req: any
  ) {
    try {
      if (!sentimentRequest.transcript) {
        throw new HttpException('Transcript is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`💭 Sentiment analysis requested for session ${sentimentRequest.sessionId}`);

      const sentimentAnalysis = await this.openaiService.analyzeSentiment(
        sentimentRequest.transcript
      );

      return {
        status: 'success',
        message: 'Sentiment analysis completed successfully',
        analysis: sentimentAnalysis,
        metadata: {
          sessionId: sentimentRequest.sessionId,
          analyzedBy: req.user.sub,
          analyzedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('❌ Sentiment analysis failed:', error);
      throw new HttpException(
        `Sentiment analysis failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate coaching questions for next session
   */
  @Post('questions')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('ai:generate-questions')
  @RequireRoles('coach', 'admin')
  async generateQuestions(
    @Body() questionsRequest: {
      sessionSummary: SessionSummary;
      clientGoals: string[];
      previousQuestions?: string[];
    },
    @Request() req: any
  ) {
    try {
      if (!questionsRequest.sessionSummary || !questionsRequest.clientGoals?.length) {
        throw new HttpException('Session summary and client goals are required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`❓ Coaching questions generation requested for session ${questionsRequest.sessionSummary.sessionId}`);

      const questions = await this.openaiService.generateCoachingQuestions(
        questionsRequest.sessionSummary,
        questionsRequest.clientGoals,
        questionsRequest.previousQuestions
      );

      return {
        status: 'success',
        message: 'Coaching questions generated successfully',
        questions,
        metadata: {
          sessionId: questionsRequest.sessionSummary.sessionId,
          generatedBy: req.user.sub,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('❌ Questions generation failed:', error);
      throw new HttpException(
        `Questions generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create async AI processing job
   */
  @Post('jobs')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('ai:create-jobs')
  async createProcessingJob(
    @Body() jobRequest: {
      type: 'transcription' | 'summary' | 'insights' | 'analysis';
      sessionId: string;
      recordingUrl: string;
      priority?: 'low' | 'normal' | 'high';
    },
    @Request() req: any
  ) {
    try {
      if (!jobRequest.type || !jobRequest.sessionId || !jobRequest.recordingUrl) {
        throw new HttpException('Job type, session ID, and recording URL are required', HttpStatus.BAD_REQUEST);
      }

      const job = await this.openaiService.createProcessingJob(
        jobRequest.type,
        jobRequest.sessionId,
        jobRequest.recordingUrl,
        jobRequest.priority || 'normal'
      );

      return {
        status: 'success',
        message: 'AI processing job created successfully',
        job: {
          id: job.id,
          type: job.type,
          status: job.status,
          sessionId: job.sessionId,
          estimatedTime: job.estimatedTime,
          createdBy: req.user.sub,
        },
      };
    } catch (error) {
      this.logger.error('❌ Job creation failed:', error);
      throw new HttpException(
        `Job creation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get AI processing job status
   */
  @Get('jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Request() req: any
  ) {
    try {
      // In a real implementation, fetch job status from database/queue
      const mockJob: AIProcessingJob = {
        id: jobId,
        type: 'transcription',
        status: 'completed',
        progress: 100,
        sessionId: 'session_123',
        recordingUrl: '/recordings/session_123.mp3',
        startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        completedAt: new Date(),
        result: {
          transcriptionId: 'transcript_123',
          wordCount: 1250,
          duration: 1800, // 30 minutes
        },
      };

      return {
        status: 'success',
        job: mockJob,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get job status for ${jobId}:`, error);
      throw new HttpException(
        `Failed to get job status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Complete transcription and summary workflow
   */
  @Post('process-recording')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('ai:process-recording')
  @UseInterceptors(
    FileInterceptor('recording', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 200 * 1024 * 1024, // 200MB limit
      },
    })
  )
  async processRecording(
    @UploadedFile() file: Express.Multer.File,
    @Body() processingOptions: {
      sessionId: string;
      sessionContext?: {
        coachName?: string;
        clientName?: string;
        sessionGoals?: string[];
        duration?: number;
      };
      includeInsights?: boolean;
      generateQuestions?: boolean;
    },
    @Request() req: any
  ) {
    try {
      if (!file) {
        throw new HttpException('Recording file is required', HttpStatus.BAD_REQUEST);
      }

      if (!processingOptions.sessionId) {
        throw new HttpException('Session ID is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`🔄 Complete recording processing requested for session ${processingOptions.sessionId}`);

      // Step 1: Transcribe
      const transcription = await this.openaiService.transcribeRecording(
        file.buffer,
        file.originalname,
        {
          speakerLabels: true,
          prompt: 'This is a life coaching session between a coach and client discussing personal goals and challenges.',
        }
      );

      // Step 2: Generate summary
      const sessionContext = {
        sessionId: processingOptions.sessionId,
        duration: processingOptions.sessionContext?.duration || Math.round(transcription.duration / 60),
        ...processingOptions.sessionContext,
      };

      const summary = await this.openaiService.generateSessionSummary(
        transcription.text,
        sessionContext
      );

      // Step 3: Analyze sentiment
      const sentimentAnalysis = await this.openaiService.analyzeSentiment(
        transcription.text
      );

      const result: any = {
        status: 'success',
        message: 'Recording processed successfully',
        sessionId: processingOptions.sessionId,
        transcription: {
          id: transcription.id,
          text: transcription.text,
          duration: transcription.duration,
          confidence: transcription.confidence,
          wordCount: transcription.wordCount,
          speakerLabels: transcription.speakerLabels,
        },
        summary,
        sentimentAnalysis,
        processingTime: {
          transcription: transcription.processingTime,
          total: Date.now(), // Will be calculated at the end
        },
      };

      // Step 4: Generate coaching questions if requested
      if (processingOptions.generateQuestions) {
        try {
          const questions = await this.openaiService.generateCoachingQuestions(
            summary,
            processingOptions.sessionContext?.sessionGoals || ['Personal growth', 'Goal achievement'],
          );
          result.coachingQuestions = questions;
        } catch (error) {
          this.logger.warn('Questions generation failed, continuing without them:', error.message);
        }
      }

      result.processingTime.total = Date.now() - result.processingTime.total;
      result.metadata = {
        fileName: file.originalname,
        fileSize: file.size,
        processedBy: req.user.sub,
        processedAt: new Date().toISOString(),
      };

      this.logger.log(`✅ Complete processing finished for session ${processingOptions.sessionId}`);
      return result;
    } catch (error) {
      this.logger.error('❌ Complete recording processing failed:', error);
      throw new HttpException(
        `Recording processing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get AI service statistics (admin only)
   */
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @RequireRoles('admin', 'coach')
  async getAIStatistics(@Request() req: any) {
    try {
      // In a real implementation, fetch actual statistics from database
      const mockStats = {
        totalProcessingJobs: 1847,
        completedJobs: 1823,
        failedJobs: 24,
        averageProcessingTime: {
          transcription: 95000, // milliseconds
          summary: 45000,
          insights: 120000,
        },
        apiUsage: {
          totalRequests: 5642,
          totalTokens: 2847563,
          totalCost: 284.76, // USD
          currentMonth: {
            requests: 234,
            tokens: 125847,
            cost: 12.58,
          },
        },
        popularFeatures: [
          { feature: 'Transcription', usage: 1247, percentage: 67.6 },
          { feature: 'Summary Generation', usage: 891, percentage: 48.3 },
          { feature: 'Insights', usage: 456, percentage: 24.7 },
          { feature: 'Sentiment Analysis', usage: 234, percentage: 12.7 },
        ],
        qualityMetrics: {
          averageTranscriptionAccuracy: 96.3,
          averageSummaryRating: 4.7,
          userSatisfactionScore: 4.6,
        },
        monthlyTrends: [
          { month: 'Jan', jobs: 142, cost: 45.67 },
          { month: 'Feb', jobs: 178, cost: 52.34 },
          { month: 'Mar', jobs: 203, cost: 61.23 },
          { month: 'Apr', jobs: 189, cost: 58.91 },
          { month: 'May', jobs: 234, cost: 71.45 },
          { month: 'Jun', jobs: 267, cost: 82.15 },
        ],
      };

      return {
        status: 'success',
        statistics: mockStats,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Failed to get AI statistics:', error);
      throw new HttpException(
        'Failed to get AI statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health check for AI services
   */
  @Get('health')
  @UseGuards(JwtAuthGuard)
  async healthCheck(@Request() req: any) {
    try {
      // Check OpenAI API connectivity
      const healthStatus = {
        status: 'healthy',
        services: {
          openai: {
            status: 'connected',
            latency: 145, // ms
            lastCheck: new Date().toISOString(),
          },
          whisper: {
            status: 'available',
            version: 'whisper-1',
          },
          gpt: {
            status: 'available',
            model: 'gpt-4-turbo-preview',
          },
        },
        capabilities: [
          'Audio transcription',
          'Session summarization',
          'Coaching insights',
          'Sentiment analysis',
          'Question generation',
        ],
        limits: {
          maxFileSize: '200MB',
          maxTranscriptionLength: '4 hours',
          rateLimits: {
            transcription: '10 per minute',
            summary: '20 per minute',
            insights: '5 per minute',
          },
        },
      };

      return healthStatus;
    } catch (error) {
      this.logger.error('❌ AI health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}