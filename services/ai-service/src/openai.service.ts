import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Readable } from 'stream';

export interface SessionSummaryRequest {
  appointmentId: string;
  transcript: string;
  sessionType: 'initial-consultation' | 'follow-up' | 'goal-setting' | 'progress-review' | 'breakthrough' | 'other';
  clientGoals?: string[];
  previousSessions?: string[];
  coachNotes?: string;
}

export interface SessionSummary {
  keyInsights: string[];
  progressMade: string[];
  challengesDiscussed: string[];
  actionItems: string[];
  nextSessionFocus: string;
  emotionalTone: 'positive' | 'neutral' | 'challenging' | 'breakthrough';
  clientEngagement: 'high' | 'medium' | 'low';
  coachingTechniques: string[];
  breakthroughMoments?: string[];
  homework?: string[];
  followUpRequired: boolean;
  confidenceLevel: number; // 1-10 scale
}

export interface TranscriptionRequest {
  audioBuffer: Buffer;
  fileName: string;
  language?: string;
  prompt?: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  confidence: number;
  segments?: {
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }[];
}

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000, // 60 seconds
      maxRetries: 3
    });
  }

  /**
   * Generate coaching session summary from transcript
   */
  async generateSessionSummary(request: SessionSummaryRequest): Promise<SessionSummary> {
    try {
      this.logger.debug(`Generating summary for appointment ${request.appointmentId}`);
      
      const systemPrompt = this.buildCoachingSystemPrompt(request.sessionType);
      const userPrompt = this.buildSessionAnalysisPrompt(request);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const summary = JSON.parse(response) as SessionSummary;
      
      // Validate and enhance the summary
      this.validateSummary(summary);
      
      this.logger.debug(`Generated summary with ${summary.keyInsights.length} insights`);
      return summary;

    } catch (error) {
      this.logger.error(`Failed to generate session summary: ${error.message}`, error.stack);
      throw new Error(`Session summary generation failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio file using Whisper API
   */
  async transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResult> {
    try {
      this.logger.debug(`Transcribing audio file: ${request.fileName}`);
      
      // Create a readable stream from buffer
      const audioStream = new Readable({
        read() {}
      });
      audioStream.push(request.audioBuffer);
      audioStream.push(null);
      
      // Add filename to the stream object for OpenAI
      (audioStream as any).path = request.fileName;

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioStream as any,
        model: 'whisper-1',
        language: request.language || 'en',
        prompt: request.prompt || 'This is a personal development coaching session between a coach and client discussing goals, progress, and growth.',
        response_format: 'verbose_json',
        temperature: 0.2
      });

      const result: TranscriptionResult = {
        text: transcription.text,
        language: transcription.language || 'en',
        duration: transcription.duration || 0,
        confidence: 0.95, // Whisper doesn't provide confidence, using high default
        segments: transcription.segments?.map(segment => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
          speaker: undefined // Speaker diarization not available in basic Whisper
        }))
      };

      this.logger.debug(`Transcription completed: ${result.text.length} characters`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to transcribe audio: ${error.message}`, error.stack);
      throw new Error(`Audio transcription failed: ${error.message}`);
    }
  }

  /**
   * Generate coaching insights from client progress data
   */
  async generateProgressInsights(clientData: {
    goals: string[];
    completedActions: string[];
    challenges: string[];
    sessionHistory: string[];
    timeframe: string;
  }): Promise<{
    progressAssessment: string;
    recommendations: string[];
    motivationalMessage: string;
    nextSteps: string[];
  }> {
    try {
      const systemPrompt = `You are an expert life coach and personal development specialist. 
      Analyze client progress data and provide actionable insights that are encouraging, 
      specific, and focused on sustainable growth. Use positive psychology principles 
      and growth mindset language.`;

      const userPrompt = `
      Client Progress Analysis:
      Goals: ${clientData.goals.join(', ')}
      Completed Actions: ${clientData.completedActions.join(', ')}
      Challenges: ${clientData.challenges.join(', ')}
      Recent Sessions: ${clientData.sessionHistory.join(', ')}
      Timeframe: ${clientData.timeframe}
      
      Please provide insights in JSON format with:
      - progressAssessment: Overall progress evaluation
      - recommendations: 3-5 specific actionable recommendations
      - motivationalMessage: Encouraging message highlighting strengths
      - nextSteps: 3-4 concrete next steps for continued growth
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);

    } catch (error) {
      this.logger.error(`Failed to generate progress insights: ${error.message}`, error.stack);
      throw new Error(`Progress insights generation failed: ${error.message}`);
    }
  }

  /**
   * Build system prompt for coaching session analysis
   */
  private buildCoachingSystemPrompt(sessionType: string): string {
    return `You are an expert life coach and session analyst specializing in personal development. 
    Your role is to analyze coaching session transcripts and generate comprehensive, actionable summaries.
    
    Focus on:
    - Personal growth insights and breakthroughs
    - Goal progression and achievement patterns
    - Emotional resilience and mindset shifts
    - Action-oriented takeaways
    - Client empowerment and self-awareness
    
    Session Type: ${sessionType}
    
    Provide your analysis in valid JSON format matching the SessionSummary interface.
    Be specific, encouraging, and focused on the client's growth journey.
    Use coaching terminology appropriate for personal development work.`;
  }

  /**
   * Build user prompt for session analysis
   */
  private buildSessionAnalysisPrompt(request: SessionSummaryRequest): string {
    let prompt = `Please analyze this coaching session transcript and provide a comprehensive summary:

`;
    prompt += `TRANSCRIPT:
${request.transcript}

`;
    
    if (request.clientGoals?.length) {
      prompt += `CLIENT GOALS:
${request.clientGoals.join('\n')}

`;
    }
    
    if (request.previousSessions?.length) {
      prompt += `PREVIOUS SESSION CONTEXT:
${request.previousSessions.join('\n')}

`;
    }
    
    if (request.coachNotes) {
      prompt += `COACH NOTES:
${request.coachNotes}

`;
    }
    
    prompt += `Please provide a detailed analysis in JSON format with all required fields from the SessionSummary interface.`;
    
    return prompt;
  }

  /**
   * Validate summary structure
   */
  private validateSummary(summary: SessionSummary): void {
    const requiredFields = [
      'keyInsights', 'progressMade', 'challengesDiscussed', 'actionItems',
      'nextSessionFocus', 'emotionalTone', 'clientEngagement', 'coachingTechniques',
      'followUpRequired', 'confidenceLevel'
    ];
    
    for (const field of requiredFields) {
      if (!(field in summary)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate arrays are not empty for key fields
    if (!summary.keyInsights?.length) {
      summary.keyInsights = ['Session analysis in progress'];
    }
    
    if (!summary.actionItems?.length) {
      summary.actionItems = ['Follow up on session discussion'];
    }
    
    // Ensure confidence level is within range
    if (summary.confidenceLevel < 1 || summary.confidenceLevel > 10) {
      summary.confidenceLevel = 8; // Default high confidence
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use generateSessionSummary instead
   */
  async complete(prompt: string): Promise<string> {
    this.logger.warn('Using deprecated complete method. Consider using generateSessionSummary instead.');
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(`Legacy completion failed: ${error.message}`);
      throw error;
    }
  }
}
