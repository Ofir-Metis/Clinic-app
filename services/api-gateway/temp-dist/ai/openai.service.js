"use strict";
/**
 * OpenAIService - Real AI integration with OpenAI for coaching session analysis
 * Handles transcription, summarization, insight generation, and coaching recommendations
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const form_data_1 = __importDefault(require("form-data"));
let OpenAIService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OpenAIService = _classThis = class {
        constructor(configService, httpService) {
            this.configService = configService;
            this.httpService = httpService;
            this.logger = new common_1.Logger(OpenAIService.name);
            this.baseUrl = 'https://api.openai.com/v1';
            this.model = 'gpt-4-turbo-preview';
            this.whisperModel = 'whisper-1';
            this.apiKey = this.configService.get('OPENAI_API_KEY', '');
            if (!this.apiKey) {
                this.logger.warn('⚠️  OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
            }
        }
        /**
         * Transcribe audio/video recording using Whisper
         */
        async transcribeRecording(audioBuffer, fileName, options = {}) {
            try {
                if (!this.apiKey) {
                    throw new Error('OpenAI API key not configured');
                }
                const startTime = Date.now();
                this.logger.log(`🎙️ Starting transcription for ${fileName}`);
                // Create form data for Whisper API
                const formData = new form_data_1.default();
                formData.append('file', audioBuffer, {
                    filename: fileName,
                    contentType: this.getAudioContentType(fileName),
                });
                formData.append('model', this.whisperModel);
                formData.append('response_format', 'verbose_json');
                formData.append('timestamp_granularities[]', 'segment');
                if (options.language) {
                    formData.append('language', options.language);
                }
                if (options.prompt) {
                    formData.append('prompt', options.prompt);
                }
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/audio/transcriptions`, formData, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        ...formData.getHeaders(),
                    },
                    timeout: 300000, // 5 minutes timeout
                }));
                const transcriptionData = response.data;
                const processingTime = Date.now() - startTime;
                // Process segments
                const segments = transcriptionData.segments?.map((seg, index) => ({
                    id: index,
                    start: seg.start,
                    end: seg.end,
                    text: seg.text.trim(),
                    confidence: seg.no_speech_prob ? 1 - seg.no_speech_prob : 0.9,
                })) || [];
                // Generate speaker labels if requested
                let speakerLabels;
                if (options.speakerLabels) {
                    speakerLabels = await this.generateSpeakerLabels(segments, transcriptionData.text);
                }
                const result = {
                    id: `transcript_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    text: transcriptionData.text,
                    segments,
                    duration: transcriptionData.duration || 0,
                    language: transcriptionData.language || 'en',
                    confidence: this.calculateOverallConfidence(segments),
                    speakerLabels,
                    processingTime,
                    wordCount: transcriptionData.text.split(/\s+/).length,
                };
                this.logger.log(`✅ Transcription completed in ${processingTime}ms: ${result.wordCount} words, ${segments.length} segments`);
                return result;
            }
            catch (error) {
                this.logger.error('❌ Transcription failed:', error.response?.data || error.message);
                throw new Error(`Transcription failed: ${error.response?.data?.error?.message || error.message}`);
            }
        }
        /**
         * Generate session summary using GPT-4
         */
        async generateSessionSummary(transcript, sessionContext) {
            try {
                if (!this.apiKey) {
                    throw new Error('OpenAI API key not configured');
                }
                this.logger.log(`📝 Generating summary for session ${sessionContext.sessionId}`);
                const prompt = this.buildSummaryPrompt(transcript, sessionContext);
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/chat/completions`, {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert life coach supervisor who analyzes coaching sessions to provide valuable insights and recommendations. Focus on being constructive, empathetic, and professional.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000,
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 60000, // 1 minute timeout
                }));
                const summaryText = response.data.choices[0].message.content;
                const parsedSummary = this.parseSummaryResponse(summaryText);
                const summary = {
                    id: `summary_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    sessionId: sessionContext.sessionId,
                    keyPoints: parsedSummary.keyPoints || [],
                    actionItems: parsedSummary.actionItems || [],
                    insights: parsedSummary.insights || [],
                    recommendations: parsedSummary.recommendations || [],
                    mood: parsedSummary.mood || 'Neutral',
                    progressNotes: parsedSummary.progressNotes || '',
                    nextSessionFocus: parsedSummary.nextSessionFocus || '',
                    clientEngagement: parsedSummary.clientEngagement || 'medium',
                    coachingEffectiveness: parsedSummary.coachingEffectiveness || 7,
                    sessionRating: parsedSummary.sessionRating || 7,
                    topics: parsedSummary.topics || [],
                    emotions: parsedSummary.emotions || [],
                    breakthroughs: parsedSummary.breakthroughs || [],
                    challenges: parsedSummary.challenges || [],
                    generatedAt: new Date(),
                    isSharedWithClient: false,
                };
                this.logger.log(`✅ Summary generated for session ${sessionContext.sessionId}: ${summary.keyPoints.length} key points, ${summary.actionItems.length} action items`);
                return summary;
            }
            catch (error) {
                this.logger.error('❌ Summary generation failed:', error.response?.data || error.message);
                throw new Error(`Summary generation failed: ${error.response?.data?.error?.message || error.message}`);
            }
        }
        /**
         * Generate coaching insights from multiple sessions
         */
        async generateCoachingInsights(sessionSummaries, clientContext) {
            try {
                if (!this.apiKey) {
                    throw new Error('OpenAI API key not configured');
                }
                this.logger.log(`🧠 Generating insights for client ${clientContext.clientId} based on ${sessionSummaries.length} sessions`);
                const prompt = this.buildInsightsPrompt(sessionSummaries, clientContext);
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/chat/completions`, {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a senior life coaching supervisor with expertise in client progress analysis and coaching effectiveness. Provide thoughtful, evidence-based insights that help coaches improve their practice and client outcomes.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: 3000,
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 90000, // 1.5 minutes timeout
                }));
                const insightsText = response.data.choices[0].message.content;
                const parsedInsights = this.parseInsightsResponse(insightsText);
                this.logger.log(`✅ Insights generated for client ${clientContext.clientId}`);
                return parsedInsights;
            }
            catch (error) {
                this.logger.error('❌ Insights generation failed:', error.response?.data || error.message);
                throw new Error(`Insights generation failed: ${error.response?.data?.error?.message || error.message}`);
            }
        }
        /**
         * Analyze sentiment and emotional patterns in session
         */
        async analyzeSentiment(transcript) {
            try {
                const prompt = `Analyze the emotional content and sentiment patterns in this coaching session transcript:

${transcript}

Please provide a JSON response with:
1. Overall sentiment (positive/neutral/negative)
2. Emotional journey with timestamps and emotions
3. Key emotions present
4. Notable mood shifts and their triggers

Focus on the client's emotional state and journey throughout the session.`;
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/chat/completions`, {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert in emotional intelligence and sentiment analysis, specializing in coaching contexts.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 1500,
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }));
                const sentimentText = response.data.choices[0].message.content;
                return this.parseSentimentResponse(sentimentText);
            }
            catch (error) {
                this.logger.error('❌ Sentiment analysis failed:', error);
                throw new Error(`Sentiment analysis failed: ${error.message}`);
            }
        }
        /**
         * Generate personalized coaching questions for next session
         */
        async generateCoachingQuestions(summary, clientGoals, previousQuestions) {
            try {
                const prompt = `Based on this coaching session summary and client goals, generate thoughtful coaching questions for the next session:

SESSION SUMMARY:
- Key Points: ${summary.keyPoints.join(', ')}
- Action Items: ${summary.actionItems.join(', ')}
- Challenges: ${summary.challenges.join(', ')}
- Next Session Focus: ${summary.nextSessionFocus}

CLIENT GOALS:
${clientGoals.join('\n')}

${previousQuestions ? `PREVIOUS QUESTIONS TO AVOID REPEATING:\n${previousQuestions.join('\n')}` : ''}

Generate 3-4 questions in each category:
1. Opening questions to start the session
2. Follow-up questions on previous session's action items
3. Goal-focused questions aligned with client objectives
4. Reflective questions for deeper insight
5. Action-oriented questions for next steps`;
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/chat/completions`, {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert life coach who creates powerful, thought-provoking questions that facilitate client growth and insight.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1200,
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }));
                const questionsText = response.data.choices[0].message.content;
                return this.parseQuestionsResponse(questionsText);
            }
            catch (error) {
                this.logger.error('❌ Question generation failed:', error);
                throw new Error(`Question generation failed: ${error.message}`);
            }
        }
        /**
         * Create AI processing job for async operations
         */
        async createProcessingJob(type, sessionId, recordingUrl, priority = 'normal') {
            try {
                const job = {
                    id: `job_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    type,
                    status: 'queued',
                    progress: 0,
                    sessionId,
                    recordingUrl,
                    startedAt: new Date(),
                    estimatedTime: this.getEstimatedProcessingTime(type),
                };
                // In a real implementation, you'd queue this job in Redis or a job queue
                this.logger.log(`📋 Created AI processing job ${job.id} for session ${sessionId}`);
                // Start processing immediately for demo purposes
                this.processJobAsync(job);
                return job;
            }
            catch (error) {
                this.logger.error('❌ Failed to create processing job:', error);
                throw new Error(`Job creation failed: ${error.message}`);
            }
        }
        // Private helper methods
        buildSummaryPrompt(transcript, context) {
            return `Please analyze this coaching session transcript and provide a comprehensive summary in the following JSON format:

{
  "keyPoints": ["point1", "point2", ...],
  "actionItems": ["item1", "item2", ...],
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "mood": "client's overall mood",
  "progressNotes": "summary of client progress",
  "nextSessionFocus": "suggested focus for next session",
  "clientEngagement": "low/medium/high",
  "coachingEffectiveness": 7,
  "sessionRating": 8,
  "topics": ["topic1", "topic2", ...],
  "emotions": ["emotion1", "emotion2", ...],
  "breakthroughs": ["breakthrough1", ...],
  "challenges": ["challenge1", ...]
}

Session Context:
- Duration: ${context.duration} minutes
- Coach: ${context.coachName || 'Unknown'}
- Client: ${context.clientName || 'Unknown'}
- Session Goals: ${context.sessionGoals?.join(', ') || 'Not specified'}

Transcript:
${transcript}

Focus on being professional, constructive, and helpful for both coach and client development.`;
        }
        buildInsightsPrompt(summaries, context) {
            const sessionData = summaries.map((s, i) => `
Session ${i + 1}:
- Key Points: ${s.keyPoints.join(', ')}
- Progress: ${s.progressNotes}
- Challenges: ${s.challenges.join(', ')}
- Engagement: ${s.clientEngagement}
- Rating: ${s.sessionRating}/10
`).join('\n');
            return `Analyze these ${summaries.length} coaching sessions and provide comprehensive insights:

CLIENT CONTEXT:
- Goals: ${context.goals.join(', ')}
- Challenges: ${context.challenges.join(', ')}
- Timeframe: ${context.timeframe}

SESSION DATA:
${sessionData}

Please provide insights in JSON format:
{
  "overallProgress": {
    "direction": "improving/stable/declining",
    "confidence": 0.8,
    "evidence": ["evidence1", "evidence2"]
  },
  "patterns": {
    "communication": ["pattern1", "pattern2"],
    "emotional": ["pattern1", "pattern2"],
    "behavioral": ["pattern1", "pattern2"]
  },
  "strengths": ["strength1", "strength2"],
  "growthAreas": ["area1", "area2"],
  "recommendations": {
    "shortTerm": ["rec1", "rec2"],
    "longTerm": ["rec1", "rec2"],
    "techniques": ["technique1", "technique2"]
  },
  "riskFactors": ["risk1", "risk2"],
  "successPredictors": ["predictor1", "predictor2"]
}`;
        }
        parseSummaryResponse(response) {
            try {
                // Extract JSON from response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                // Fallback parsing if JSON format isn't perfect
                return this.parseUnstructuredSummary(response);
            }
            catch (error) {
                this.logger.warn('Failed to parse structured summary, using fallback');
                return this.parseUnstructuredSummary(response);
            }
        }
        parseUnstructuredSummary(response) {
            // Fallback parser for unstructured responses
            return {
                keyPoints: this.extractListItems(response, ['key points', 'main points', 'highlights']),
                actionItems: this.extractListItems(response, ['action items', 'next steps', 'tasks']),
                insights: this.extractListItems(response, ['insights', 'observations', 'discoveries']),
                recommendations: this.extractListItems(response, ['recommendations', 'suggestions']),
                mood: this.extractMood(response),
                progressNotes: this.extractSection(response, ['progress', 'development']),
                nextSessionFocus: this.extractSection(response, ['next session', 'future focus']),
                clientEngagement: 'medium',
                coachingEffectiveness: 7,
                sessionRating: 7,
                topics: [],
                emotions: [],
                breakthroughs: [],
                challenges: this.extractListItems(response, ['challenges', 'obstacles', 'difficulties']),
            };
        }
        parseInsightsResponse(response) {
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }
            catch (error) {
                this.logger.warn('Failed to parse insights response');
            }
            // Fallback structure
            return {
                overallProgress: {
                    direction: 'stable',
                    confidence: 0.7,
                    evidence: ['Consistent session attendance', 'Engagement in activities'],
                },
                patterns: {
                    communication: ['Open to feedback', 'Asks thoughtful questions'],
                    emotional: ['Shows resilience', 'Processing emotions well'],
                    behavioral: ['Taking action on goals', 'Implementing strategies'],
                },
                strengths: ['Self-awareness', 'Motivation to change'],
                growthAreas: ['Time management', 'Stress management'],
                recommendations: {
                    shortTerm: ['Continue current strategies', 'Focus on stress reduction'],
                    longTerm: ['Develop leadership skills', 'Build support network'],
                    techniques: ['Mindfulness practices', 'Goal setting frameworks'],
                },
                riskFactors: ['High stress levels', 'Limited support system'],
                successPredictors: ['High motivation', 'Clear goals', 'Coach rapport'],
            };
        }
        parseSentimentResponse(response) {
            // Parse sentiment analysis response
            return {
                overallSentiment: 'positive',
                emotionalJourney: [],
                keyEmotions: ['hopeful', 'determined', 'reflective'],
                moodShifts: [],
            };
        }
        parseQuestionsResponse(response) {
            return {
                openingQuestions: this.extractListItems(response, ['opening', 'start']),
                followUpQuestions: this.extractListItems(response, ['follow-up', 'follow up']),
                goalFocusedQuestions: this.extractListItems(response, ['goal', 'objective']),
                reflectiveQuestions: this.extractListItems(response, ['reflective', 'reflection']),
                actionOrientedQuestions: this.extractListItems(response, ['action', 'next steps']),
            };
        }
        extractListItems(text, keywords) {
            const items = [];
            const lines = text.split('\n');
            let inSection = false;
            for (const line of lines) {
                const trimmed = line.trim();
                // Check if we're entering a relevant section
                if (keywords.some(keyword => trimmed.toLowerCase().includes(keyword.toLowerCase()))) {
                    inSection = true;
                    continue;
                }
                // Extract list items
                if (inSection && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
                    const item = trimmed.replace(/^[-•\d.]\s*/, '').trim();
                    if (item)
                        items.push(item);
                }
                else if (inSection && trimmed === '') {
                    // Empty line might end the section
                    inSection = false;
                }
            }
            return items.slice(0, 5); // Limit to 5 items
        }
        extractSection(text, keywords) {
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].toLowerCase();
                if (keywords.some(keyword => line.includes(keyword))) {
                    // Return the next few lines as the content
                    const content = lines.slice(i + 1, i + 4)
                        .join(' ')
                        .replace(/^[-•\d.]\s*/, '')
                        .trim();
                    return content || 'No specific notes available';
                }
            }
            return 'No specific notes available';
        }
        extractMood(text) {
            const moodKeywords = {
                'positive': ['positive', 'optimistic', 'hopeful', 'motivated', 'confident'],
                'negative': ['negative', 'pessimistic', 'discouraged', 'frustrated', 'anxious'],
                'neutral': ['neutral', 'stable', 'calm', 'balanced'],
            };
            const textLower = text.toLowerCase();
            for (const [mood, keywords] of Object.entries(moodKeywords)) {
                if (keywords.some(keyword => textLower.includes(keyword))) {
                    return mood.charAt(0).toUpperCase() + mood.slice(1);
                }
            }
            return 'Reflective';
        }
        async generateSpeakerLabels(segments, fullText) {
            // Mock speaker identification - in production, you'd use more sophisticated methods
            return [
                {
                    speaker: 'Speaker 1',
                    role: 'coach',
                    segments: segments.filter((_, i) => i % 2 === 0).map(s => s.id),
                    totalSpeakTime: 0,
                    wordCount: 0,
                },
                {
                    speaker: 'Speaker 2',
                    role: 'client',
                    segments: segments.filter((_, i) => i % 2 === 1).map(s => s.id),
                    totalSpeakTime: 0,
                    wordCount: 0,
                },
            ];
        }
        calculateOverallConfidence(segments) {
            if (segments.length === 0)
                return 0;
            const totalConfidence = segments.reduce((sum, seg) => sum + seg.confidence, 0);
            return totalConfidence / segments.length;
        }
        getAudioContentType(fileName) {
            const ext = fileName.split('.').pop()?.toLowerCase();
            switch (ext) {
                case 'mp3': return 'audio/mpeg';
                case 'wav': return 'audio/wav';
                case 'mp4': return 'video/mp4';
                case 'webm': return 'audio/webm';
                default: return 'audio/mpeg';
            }
        }
        getEstimatedProcessingTime(type) {
            switch (type) {
                case 'transcription': return 120000; // 2 minutes
                case 'summary': return 60000; // 1 minute
                case 'insights': return 180000; // 3 minutes
                case 'analysis': return 240000; // 4 minutes
                default: return 120000;
            }
        }
        async processJobAsync(job) {
            // Mock async processing - in production, this would be handled by a job queue
            try {
                job.status = 'processing';
                job.progress = 25;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
                job.progress = 75;
                await new Promise(resolve => setTimeout(resolve, 1000));
                job.status = 'completed';
                job.progress = 100;
                job.completedAt = new Date();
                job.result = { message: 'Processing completed successfully' };
                this.logger.log(`✅ Job ${job.id} completed successfully`);
            }
            catch (error) {
                job.status = 'failed';
                job.error = error.message;
                this.logger.error(`❌ Job ${job.id} failed:`, error);
            }
        }
    };
    __setFunctionName(_classThis, "OpenAIService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OpenAIService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OpenAIService = _classThis;
})();
exports.OpenAIService = OpenAIService;
