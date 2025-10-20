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

      // Intelligent model selection based on content complexity
      const modelToUse = this.selectOptimalModel('session_summary', userPrompt.length);

      this.logger.debug(`Using optimal model: ${modelToUse} for content length: ${userPrompt.length}`);

      let completion;
      try {
        completion = await this.openai.chat.completions.create({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: this.getMaxTokensForModel(modelToUse),
          response_format: { type: 'json_object' },
          // GPT-5 specific enhancements
          ...(modelToUse.includes('gpt-5') && {
            verbosity: (process.env.AI_VERBOSITY_LEVEL as any) || 'medium',
            reasoning_effort: (process.env.AI_REASONING_EFFORT as any) || 'standard'
          })
        });
      } catch (modelError: any) {
        // Enhanced fallback chain for maximum reliability
        completion = await this.handleModelFallback(modelError, modelToUse, {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        });
      }

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to generate session summary: ${errorMessage}`, errorStack);
      throw new Error(`Session summary generation failed: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to transcribe audio: ${errorMessage}`, errorStack);
      throw new Error(`Audio transcription failed: ${errorMessage}`);
    }
  }

  /**
   * Generate coaching insights from client progress data with GPT-5 healthcare optimization
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
      const systemPrompt = this.buildHealthcareOptimizedSystemPrompt('progress_analysis');

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

      // Intelligent model selection for progress analysis
      const modelToUse = this.selectOptimalModel('progress_analysis', userPrompt.length);

      const completion = await this.openai.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: this.getMaxTokensForModel(modelToUse),
        response_format: { type: 'json_object' },
        // GPT-5 healthcare optimization
        ...(modelToUse.includes('gpt-5') && {
          verbosity: 'medium' as any,
          reasoning_effort: 'standard' as any
        })
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to generate progress insights: ${errorMessage}`, errorStack);
      throw new Error(`Progress insights generation failed: ${errorMessage}`);
    }
  }

  /**
   * Build healthcare-optimized system prompt for GPT-5
   */
  private buildCoachingSystemPrompt(sessionType: string): string {
    return `You are an expert life coach and session analyst specializing in personal development and wellness coaching.
    You have been healthcare-optimized to provide precise, reliable responses while acting as a proactive thought partner.

    Your role is to analyze coaching session transcripts and generate comprehensive, actionable summaries with:
    - Exceptional accuracy (<1% hallucination rate) for healthcare contexts
    - Empathetic, empowerment-focused language for sustainable growth
    - Proactive insights that go beyond surface-level observations
    - Evidence-based coaching techniques and positive psychology principles

    Focus Areas:
    - Personal growth insights and breakthrough moments
    - Goal progression with measurable achievement patterns
    - Emotional resilience and transformative mindset shifts
    - Action-oriented takeaways with clear implementation steps
    - Client empowerment through self-awareness and confidence building
    - Risk assessment for emotional well-being and safety protocols

    Session Type: ${sessionType}

    Provide your analysis in valid JSON format matching the SessionSummary interface.
    Be specific, encouraging, and laser-focused on the client's holistic growth journey.
    Use evidence-based coaching terminology appropriate for wellness and personal development work.
    Prioritize client safety, empowerment, and sustainable transformation.`;
  }

  /**
   * Build healthcare-optimized system prompt for different AI tasks
   */
  private buildHealthcareOptimizedSystemPrompt(taskType: string): string {
    const basePrompt = `You are an expert life coach specializing in personal development and wellness.
    Your responses must be accurate, empathetic, and focused on empowerment.
    Use your healthcare optimization to provide precise, reliable coaching insights.
    Act as a proactive thought partner for sustainable growth.`;

    switch (taskType) {
      case 'progress_analysis':
        return `${basePrompt}\n\nAnalyze client progress data and provide actionable insights that are encouraging,
        specific, and focused on sustainable growth. Use positive psychology principles
        and growth mindset language with healthcare-grade accuracy.`;

      case 'session_summary':
        return this.buildCoachingSystemPrompt('coaching_session');

      case 'multimodal_analysis':
        return `${basePrompt}\n\nSpecialize in analyzing multimodal content (text, images, audio) for comprehensive
        coaching insights. Focus on identifying patterns across different content types, safety considerations,
        and holistic client assessment for optimal coaching outcomes.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Intelligent model selection based on task complexity and content length
   */
  private selectOptimalModel(taskType: string, contentLength: number): string {
    const primaryModel = process.env.AI_SUMMARY_MODEL || 'gpt-5';
    const miniModel = process.env.AI_MINI_MODEL || 'gpt-5-mini';

    // Use mini model for simple, short tasks
    if (taskType === 'quick_insight' && contentLength < 1000) {
      return miniModel;
    }

    // Use mini model for basic classifications and status updates
    if (taskType === 'classification' || taskType === 'status_update') {
      return miniModel;
    }

    // Use primary model for complex analysis and long content
    if (taskType === 'session_summary' || taskType === 'progress_analysis') {
      return primaryModel;
    }

    // Default to primary model for healthcare applications
    return primaryModel;
  }

  /**
   * Get optimal token limits for different models
   */
  private getMaxTokensForModel(model: string): number {
    if (model.includes('gpt-5')) {
      return parseInt(process.env.AI_MAX_COMPLETION_TOKENS || '20000');
    }
    if (model.includes('gpt-4')) {
      return 4000;
    }
    return 3000; // GPT-3.5 and fallback
  }

  /**
   * Enhanced fallback chain for maximum reliability
   */
  private async handleModelFallback(error: any, primaryModel: string, requestOptions: any) {
    const fallbackChain = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo-0125'];

    this.logger.warn(`Model ${primaryModel} failed: ${error.message}. Trying fallback chain.`);

    for (const fallbackModel of fallbackChain) {
      try {
        this.logger.debug(`Attempting fallback to: ${fallbackModel}`);
        return await this.openai.chat.completions.create({
          ...requestOptions,
          model: fallbackModel,
          max_completion_tokens: this.getMaxTokensForModel(fallbackModel)
        });
      } catch (fallbackError: any) {
        this.logger.warn(`Fallback model ${fallbackModel} also failed: ${fallbackError.message}`);
        continue;
      }
    }

    // If all fallbacks fail, throw the original error
    throw error;
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
   * Generate quick coaching insights using cost-optimized GPT-5-mini
   */
  async generateQuickInsight(prompt: string, category: 'classification' | 'status_update' | 'quick_response' = 'quick_response'): Promise<string> {
    try {
      this.logger.debug(`Generating quick insight for category: ${category}`);

      const modelToUse = this.selectOptimalModel('quick_insight', prompt.length);

      const completion = await this.openai.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful coaching assistant. Provide concise, actionable insights for wellness and personal development.'
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 500, // Limited for quick responses
        // Use GPT-5-mini optimizations
        ...(modelToUse.includes('gpt-5') && {
          verbosity: 'low' as any, // Concise responses for quick insights
          reasoning_effort: 'minimal' as any // Fast processing
        })
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Quick insight generation failed: ${errorMessage}`);
      throw new Error(`Quick insight generation failed: ${errorMessage}`);
    }
  }

  /**
   * Enhanced multimodal analysis for GPT-5 (supports text, images, audio, PDFs)
   */
  async analyzeMultimodalContent(content: {
    text?: string;
    imageUrls?: string[];
    audioTranscript?: string;
    contentType: 'session_analysis' | 'progress_review' | 'goal_assessment';
  }): Promise<{
    insights: string[];
    recommendations: string[];
    riskAssessment: string;
    nextActions: string[];
  }> {
    try {
      this.logger.debug(`Analyzing multimodal content for: ${content.contentType}`);

      const messages: any[] = [
        {
          role: 'system',
          content: this.buildHealthcareOptimizedSystemPrompt('multimodal_analysis')
        },
        {
          role: 'user',
          content: `
          Multimodal Content Analysis:
          Text Content: ${content.text || 'Not provided'}
          Audio Transcript: ${content.audioTranscript || 'Not provided'}
          Images: ${content.imageUrls?.length || 0} images provided
          Analysis Type: ${content.contentType}

          Please provide comprehensive analysis in JSON format with:
          - insights: Key observations and patterns
          - recommendations: Actionable coaching recommendations
          - riskAssessment: Safety and wellness considerations
          - nextActions: Specific next steps for client growth
          `
        }
      ];

      // Add image content if provided (GPT-5 multimodal support)
      if (content.imageUrls?.length) {
        content.imageUrls.forEach((url, index) => {
          messages.push({
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Image ${index + 1} for analysis:`
              },
              {
                type: 'image_url',
                image_url: { url }
              }
            ]
          });
        });
      }

      const modelToUse = process.env.AI_SUMMARY_MODEL || 'gpt-5';

      const completion = await this.openai.chat.completions.create({
        model: modelToUse,
        messages,
        temperature: 0.3,
        max_completion_tokens: parseInt(process.env.AI_MAX_COMPLETION_TOKENS || '20000'),
        response_format: { type: 'json_object' },
        // GPT-5 multimodal optimizations
        ...(modelToUse.includes('gpt-5') && {
          verbosity: 'high', // Detailed analysis for multimodal content
          reasoning_effort: 'high' // Thorough processing for complex content
        })
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from multimodal analysis');
      }

      return JSON.parse(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Multimodal analysis failed: ${errorMessage}`);
      throw new Error(`Multimodal analysis failed: ${errorMessage}`);
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use generateQuickInsight instead
   */
  async complete(prompt: string): Promise<string> {
    this.logger.warn('Using deprecated complete method. Consider using generateQuickInsight or generateSessionSummary instead.');
    
    try {
      // Use environment-configurable model, fallback to cost-effective option for legacy method
      const modelToUse = process.env.AI_LEGACY_MODEL || 'gpt-3.5-turbo-0125';

      const completion = await this.openai.chat.completions.create({
        model: modelToUse,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 1000
      });
      
      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Legacy completion failed: ${errorMessage}`);
      throw error;
    }
  }
}
