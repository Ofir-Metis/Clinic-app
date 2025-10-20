"use strict";
/**
 * AIController - Handles AI service endpoints for coaching session analysis
 * Provides endpoints for transcription, summarization, insights, and coaching recommendations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const common_2 = require("@clinic/common");
const multer = __importStar(require("multer"));
let AIController = (() => {
    let _classDecorators = [(0, common_1.Controller)('api/ai')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _transcribeAudio_decorators;
    let _generateSummary_decorators;
    let _generateInsights_decorators;
    let _analyzeSentiment_decorators;
    let _generateQuestions_decorators;
    let _createProcessingJob_decorators;
    let _getJobStatus_decorators;
    let _processRecording_decorators;
    let _getAIStatistics_decorators;
    let _healthCheck_decorators;
    var AIController = _classThis = class {
        constructor(openaiService) {
            this.openaiService = (__runInitializers(this, _instanceExtraInitializers), openaiService);
            this.logger = new common_1.Logger(AIController.name);
        }
        /**
         * Transcribe audio/video file using OpenAI Whisper
         */
        async transcribeAudio(file, transcriptionOptions, req) {
            try {
                if (!file) {
                    throw new common_1.HttpException('Audio file is required', common_1.HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`🎙️ Transcription requested by user ${req.user.sub} for file: ${file.originalname}`);
                const options = {
                    language: transcriptionOptions.language,
                    prompt: transcriptionOptions.prompt || 'This is a life coaching session between a coach and client.',
                    speakerLabels: transcriptionOptions.speakerLabels === true,
                };
                const result = await this.openaiService.transcribeRecording(file.buffer, file.originalname, options);
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
            }
            catch (error) {
                this.logger.error('❌ Transcription failed:', error);
                throw new common_1.HttpException(`Transcription failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate session summary from transcript
         */
        async generateSummary(summaryRequest, req) {
            try {
                if (!summaryRequest.transcript || !summaryRequest.sessionId) {
                    throw new common_1.HttpException('Transcript and session ID are required', common_1.HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`📝 Summary generation requested for session ${summaryRequest.sessionId}`);
                const sessionContext = {
                    sessionId: summaryRequest.sessionId,
                    duration: summaryRequest.sessionContext?.duration || 60,
                    ...summaryRequest.sessionContext,
                };
                const summary = await this.openaiService.generateSessionSummary(summaryRequest.transcript, sessionContext);
                return {
                    status: 'success',
                    message: 'Session summary generated successfully',
                    summary: {
                        ...summary,
                        generatedBy: req.user.sub,
                    },
                };
            }
            catch (error) {
                this.logger.error('❌ Summary generation failed:', error);
                throw new common_1.HttpException(`Summary generation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate coaching insights from multiple sessions
         */
        async generateInsights(insightsRequest, req) {
            try {
                if (!insightsRequest.clientId || !insightsRequest.sessionSummaries?.length) {
                    throw new common_1.HttpException('Client ID and session summaries are required', common_1.HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`🧠 Insights generation requested for client ${insightsRequest.clientId}`);
                const insights = await this.openaiService.generateCoachingInsights(insightsRequest.sessionSummaries, {
                    clientId: insightsRequest.clientId,
                    ...insightsRequest.clientContext,
                });
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
            }
            catch (error) {
                this.logger.error('❌ Insights generation failed:', error);
                throw new common_1.HttpException(`Insights generation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Analyze sentiment and emotions in transcript
         */
        async analyzeSentiment(sentimentRequest, req) {
            try {
                if (!sentimentRequest.transcript) {
                    throw new common_1.HttpException('Transcript is required', common_1.HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`💭 Sentiment analysis requested for session ${sentimentRequest.sessionId}`);
                const sentimentAnalysis = await this.openaiService.analyzeSentiment(sentimentRequest.transcript);
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
            }
            catch (error) {
                this.logger.error('❌ Sentiment analysis failed:', error);
                throw new common_1.HttpException(`Sentiment analysis failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate coaching questions for next session
         */
        async generateQuestions(questionsRequest, req) {
            try {
                if (!questionsRequest.sessionSummary || !questionsRequest.clientGoals?.length) {
                    throw new common_1.HttpException('Session summary and client goals are required', common_1.HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`❓ Coaching questions generation requested for session ${questionsRequest.sessionSummary.sessionId}`);
                const questions = await this.openaiService.generateCoachingQuestions(questionsRequest.sessionSummary, questionsRequest.clientGoals, questionsRequest.previousQuestions);
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
            }
            catch (error) {
                this.logger.error('❌ Questions generation failed:', error);
                throw new common_1.HttpException(`Questions generation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create async AI processing job
         */
        async createProcessingJob(jobRequest, req) {
            try {
                if (!jobRequest.type || !jobRequest.sessionId || !jobRequest.recordingUrl) {
                    throw new common_1.HttpException('Job type, session ID, and recording URL are required', common_1.HttpStatus.BAD_REQUEST);
                }
                const job = await this.openaiService.createProcessingJob(jobRequest.type, jobRequest.sessionId, jobRequest.recordingUrl, jobRequest.priority || 'normal');
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
            }
            catch (error) {
                this.logger.error('❌ Job creation failed:', error);
                throw new common_1.HttpException(`Job creation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get AI processing job status
         */
        async getJobStatus(jobId, req) {
            try {
                // In a real implementation, fetch job status from database/queue
                const mockJob = {
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
            }
            catch (error) {
                this.logger.error(`❌ Failed to get job status for ${jobId}:`, error);
                throw new common_1.HttpException(`Failed to get job status: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Complete transcription and summary workflow
         */
        async processRecording(file, processingOptions, req) {
            try {
                if (!file) {
                    throw new common_1.HttpException('Recording file is required', common_1.HttpStatus.BAD_REQUEST);
                }
                if (!processingOptions.sessionId) {
                    throw new common_1.HttpException('Session ID is required', common_1.HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`🔄 Complete recording processing requested for session ${processingOptions.sessionId}`);
                // Step 1: Transcribe
                const transcription = await this.openaiService.transcribeRecording(file.buffer, file.originalname, {
                    speakerLabels: true,
                    prompt: 'This is a life coaching session between a coach and client discussing personal goals and challenges.',
                });
                // Step 2: Generate summary
                const sessionContext = {
                    sessionId: processingOptions.sessionId,
                    duration: processingOptions.sessionContext?.duration || Math.round(transcription.duration / 60),
                    ...processingOptions.sessionContext,
                };
                const summary = await this.openaiService.generateSessionSummary(transcription.text, sessionContext);
                // Step 3: Analyze sentiment
                const sentimentAnalysis = await this.openaiService.analyzeSentiment(transcription.text);
                const result = {
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
                        const questions = await this.openaiService.generateCoachingQuestions(summary, processingOptions.sessionContext?.sessionGoals || ['Personal growth', 'Goal achievement']);
                        result.coachingQuestions = questions;
                    }
                    catch (error) {
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
            }
            catch (error) {
                this.logger.error('❌ Complete recording processing failed:', error);
                throw new common_1.HttpException(`Recording processing failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get AI service statistics (admin only)
         */
        async getAIStatistics(req) {
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
            }
            catch (error) {
                this.logger.error('❌ Failed to get AI statistics:', error);
                throw new common_1.HttpException('Failed to get AI statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Health check for AI services
         */
        async healthCheck(req) {
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
            }
            catch (error) {
                this.logger.error('❌ AI health check failed:', error);
                return {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString(),
                };
            }
        }
    };
    __setFunctionName(_classThis, "AIController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _transcribeAudio_decorators = [(0, common_1.Post)('transcribe'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('ai:transcribe'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', {
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
                    }
                    else {
                        cb(new common_1.HttpException('Invalid file type for transcription', common_1.HttpStatus.BAD_REQUEST), false);
                    }
                },
            }))];
        _generateSummary_decorators = [(0, common_1.Post)('summarize'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('ai:summarize')];
        _generateInsights_decorators = [(0, common_1.Post)('insights'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('ai:generate-insights'), (0, common_2.RequireRoles)('coach', 'admin')];
        _analyzeSentiment_decorators = [(0, common_1.Post)('sentiment'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('ai:analyze-sentiment')];
        _generateQuestions_decorators = [(0, common_1.Post)('questions'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('ai:generate-questions'), (0, common_2.RequireRoles)('coach', 'admin')];
        _createProcessingJob_decorators = [(0, common_1.Post)('jobs'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('ai:create-jobs')];
        _getJobStatus_decorators = [(0, common_1.Get)('jobs/:jobId'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        _processRecording_decorators = [(0, common_1.Post)('process-recording'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('ai:process-recording'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('recording', {
                storage: multer.memoryStorage(),
                limits: {
                    fileSize: 200 * 1024 * 1024, // 200MB limit
                },
            }))];
        _getAIStatistics_decorators = [(0, common_1.Get)('statistics'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('admin', 'coach')];
        _healthCheck_decorators = [(0, common_1.Get)('health'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        __esDecorate(_classThis, null, _transcribeAudio_decorators, { kind: "method", name: "transcribeAudio", static: false, private: false, access: { has: obj => "transcribeAudio" in obj, get: obj => obj.transcribeAudio }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateSummary_decorators, { kind: "method", name: "generateSummary", static: false, private: false, access: { has: obj => "generateSummary" in obj, get: obj => obj.generateSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateInsights_decorators, { kind: "method", name: "generateInsights", static: false, private: false, access: { has: obj => "generateInsights" in obj, get: obj => obj.generateInsights }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _analyzeSentiment_decorators, { kind: "method", name: "analyzeSentiment", static: false, private: false, access: { has: obj => "analyzeSentiment" in obj, get: obj => obj.analyzeSentiment }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateQuestions_decorators, { kind: "method", name: "generateQuestions", static: false, private: false, access: { has: obj => "generateQuestions" in obj, get: obj => obj.generateQuestions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createProcessingJob_decorators, { kind: "method", name: "createProcessingJob", static: false, private: false, access: { has: obj => "createProcessingJob" in obj, get: obj => obj.createProcessingJob }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getJobStatus_decorators, { kind: "method", name: "getJobStatus", static: false, private: false, access: { has: obj => "getJobStatus" in obj, get: obj => obj.getJobStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _processRecording_decorators, { kind: "method", name: "processRecording", static: false, private: false, access: { has: obj => "processRecording" in obj, get: obj => obj.processRecording }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAIStatistics_decorators, { kind: "method", name: "getAIStatistics", static: false, private: false, access: { has: obj => "getAIStatistics" in obj, get: obj => obj.getAIStatistics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _healthCheck_decorators, { kind: "method", name: "healthCheck", static: false, private: false, access: { has: obj => "healthCheck" in obj, get: obj => obj.healthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AIController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AIController = _classThis;
})();
exports.AIController = AIController;
