/**
 * AIModule - Module for AI services and OpenAI integration
 * Handles transcription, summarization, insights, and coaching analysis
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@clinic/common';
import { OpenAIService } from './openai.service';
import { AIController } from './ai.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 300000, // 5 minutes for long AI operations
      maxRedirects: 5,
    }),
    ConfigModule,
    AuthModule,
  ],
  providers: [OpenAIService],
  controllers: [AIController],
  exports: [OpenAIService],
})
export class AIModule {}