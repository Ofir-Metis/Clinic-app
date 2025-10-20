"use strict";
/**
 * OnboardingController - Handles client onboarding API endpoints
 * Manages onboarding flow, step completion, and progress tracking
 */
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let OnboardingController = (() => {
    let _classDecorators = [(0, common_1.Controller)('api/onboarding')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _initializeOnboarding_decorators;
    let _getProgress_decorators;
    let _getOnboardingSteps_decorators;
    let _completeStep_decorators;
    let _getPrograms_decorators;
    let _submitIntakeForm_decorators;
    let _submitAssessment_decorators;
    let _sendReminder_decorators;
    let _getOnboardingStatistics_decorators;
    var OnboardingController = _classThis = class {
        constructor(onboardingService) {
            this.onboardingService = (__runInitializers(this, _instanceExtraInitializers), onboardingService);
            this.logger = new common_1.Logger(OnboardingController.name);
        }
        /**
         * Initialize onboarding for a new client (public endpoint for registration)
         */
        async initializeOnboarding(initData) {
            try {
                if (!initData.email) {
                    throw new common_1.HttpException('Email is required', common_1.HttpStatus.BAD_REQUEST);
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
            }
            catch (error) {
                this.logger.error('❌ Failed to initialize onboarding:', error);
                throw new common_1.HttpException(`Onboarding initialization failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get onboarding progress for a client
         */
        async getProgress(clientId, req) {
            try {
                // In production, verify that the user can access this client's data
                const progress = await this.onboardingService.getProgress(clientId);
                if (!progress) {
                    throw new common_1.HttpException('Onboarding not found', common_1.HttpStatus.NOT_FOUND);
                }
                return {
                    status: 'success',
                    progress,
                    nextSteps: this.getNextSteps(progress),
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to get progress for client ${clientId}:`, error);
                throw new common_1.HttpException(`Failed to get onboarding progress: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get all available onboarding steps
         */
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
            }
            catch (error) {
                this.logger.error('❌ Failed to get onboarding steps:', error);
                throw new common_1.HttpException('Failed to get onboarding steps', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Complete an onboarding step
         */
        async completeStep(stepId, stepData, req) {
            try {
                if (!stepData.clientId) {
                    throw new common_1.HttpException('Client ID is required', common_1.HttpStatus.BAD_REQUEST);
                }
                // Validate step data based on step type
                this.validateStepData(stepId, stepData.data);
                const progress = await this.onboardingService.completeStep(stepData.clientId, stepId, stepData.data);
                const response = {
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
            }
            catch (error) {
                this.logger.error(`❌ Failed to complete step ${stepId}:`, error);
                throw new common_1.HttpException(`Step completion failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get available coaching programs
         */
        async getPrograms(recommended) {
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
            }
            catch (error) {
                this.logger.error('❌ Failed to get programs:', error);
                throw new common_1.HttpException('Failed to get coaching programs', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Submit intake form (specific endpoint for the main form)
         */
        async submitIntakeForm(formData, req) {
            try {
                if (!formData.clientId) {
                    throw new common_1.HttpException('Client ID is required', common_1.HttpStatus.BAD_REQUEST);
                }
                // Validate required fields
                this.validateIntakeForm(formData);
                const progress = await this.onboardingService.completeStep(formData.clientId, 'intake-form', formData);
                return {
                    status: 'success',
                    message: 'Intake form submitted successfully',
                    progress: {
                        currentStep: progress.currentStep,
                        percentComplete: progress.percentComplete,
                    },
                    nextStep: 'lifestyle-assessment',
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to submit intake form:', error);
                throw new common_1.HttpException(`Intake form submission failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Submit lifestyle assessment
         */
        async submitAssessment(assessmentData, req) {
            try {
                if (!assessmentData.clientId) {
                    throw new common_1.HttpException('Client ID is required', common_1.HttpStatus.BAD_REQUEST);
                }
                const progress = await this.onboardingService.completeStep(assessmentData.clientId, 'lifestyle-assessment', assessmentData);
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
            }
            catch (error) {
                this.logger.error('❌ Failed to submit assessment:', error);
                throw new common_1.HttpException(`Assessment submission failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Send onboarding reminder
         */
        async sendReminder(clientId, req) {
            try {
                await this.onboardingService.sendOnboardingReminder(clientId);
                return {
                    status: 'success',
                    message: 'Onboarding reminder sent successfully',
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to send reminder to client ${clientId}:`, error);
                throw new common_1.HttpException(`Failed to send reminder: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get onboarding statistics (admin endpoint)
         */
        async getOnboardingStatistics(req) {
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
            }
            catch (error) {
                this.logger.error('❌ Failed to get onboarding statistics:', error);
                throw new common_1.HttpException('Failed to get statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Private helper methods
        getNextSteps(progress) {
            const allSteps = this.onboardingService.getOnboardingSteps();
            const remainingSteps = allSteps.filter(step => !progress.completedSteps.some(completed => completed.id === step.id));
            return remainingSteps.slice(0, 3); // Next 3 steps
        }
        validateStepData(stepId, data) {
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
        validateIntakeForm(data) {
            const required = ['personalInfo', 'coachingBackground', 'goals'];
            for (const field of required) {
                if (!data[field]) {
                    throw new common_1.HttpException(`${field} is required`, common_1.HttpStatus.BAD_REQUEST);
                }
            }
            if (!data.personalInfo.firstName || !data.personalInfo.email) {
                throw new common_1.HttpException('First name and email are required', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        validateAssessment(data) {
            const required = ['personalityType', 'learningStyle', 'communicationStyle'];
            for (const field of required) {
                if (!data[field]) {
                    throw new common_1.HttpException(`${field} is required`, common_1.HttpStatus.BAD_REQUEST);
                }
            }
            const numericFields = ['changeReadiness', 'supportSystem', 'selfAwareness'];
            for (const field of numericFields) {
                const value = parseInt(data[field]);
                if (isNaN(value) || value < 1 || value > 10) {
                    throw new common_1.HttpException(`${field} must be a number between 1 and 10`, common_1.HttpStatus.BAD_REQUEST);
                }
            }
        }
        validateGoalSetting(data) {
            if (!data.primaryGoals || !Array.isArray(data.primaryGoals) || data.primaryGoals.length === 0) {
                throw new common_1.HttpException('At least one primary goal is required', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        validateProgramSelection(data) {
            if (!data.selectedProgram) {
                throw new common_1.HttpException('Program selection is required', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        generateAssessmentInsights(assessment) {
            const insights = [];
            if (assessment.changeReadiness >= 8) {
                insights.push('You show high readiness for change, which is a great foundation for coaching success.');
            }
            else if (assessment.changeReadiness <= 4) {
                insights.push('Building motivation and readiness for change will be an important focus area.');
            }
            if (assessment.supportSystem >= 7) {
                insights.push('Your strong support system will be a valuable asset in your coaching journey.');
            }
            else if (assessment.supportSystem <= 4) {
                insights.push('Developing a stronger support network could enhance your coaching outcomes.');
            }
            if (assessment.selfAwareness >= 8) {
                insights.push('Your high self-awareness will accelerate your personal growth process.');
            }
            return insights;
        }
    };
    __setFunctionName(_classThis, "OnboardingController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _initializeOnboarding_decorators = [(0, common_1.Post)('initialize'), (0, common_2.Public)()];
        _getProgress_decorators = [(0, common_1.Get)('progress/:clientId'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        _getOnboardingSteps_decorators = [(0, common_1.Get)('steps'), (0, common_2.Public)()];
        _completeStep_decorators = [(0, common_1.Post)('steps/:stepId/complete'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        _getPrograms_decorators = [(0, common_1.Get)('programs'), (0, common_2.Public)()];
        _submitIntakeForm_decorators = [(0, common_1.Post)('intake-form'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        _submitAssessment_decorators = [(0, common_1.Post)('assessment'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        _sendReminder_decorators = [(0, common_1.Post)('reminder/:clientId'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _getOnboardingStatistics_decorators = [(0, common_1.Get)('statistics'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('admin', 'coach')];
        __esDecorate(_classThis, null, _initializeOnboarding_decorators, { kind: "method", name: "initializeOnboarding", static: false, private: false, access: { has: obj => "initializeOnboarding" in obj, get: obj => obj.initializeOnboarding }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProgress_decorators, { kind: "method", name: "getProgress", static: false, private: false, access: { has: obj => "getProgress" in obj, get: obj => obj.getProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOnboardingSteps_decorators, { kind: "method", name: "getOnboardingSteps", static: false, private: false, access: { has: obj => "getOnboardingSteps" in obj, get: obj => obj.getOnboardingSteps }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _completeStep_decorators, { kind: "method", name: "completeStep", static: false, private: false, access: { has: obj => "completeStep" in obj, get: obj => obj.completeStep }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPrograms_decorators, { kind: "method", name: "getPrograms", static: false, private: false, access: { has: obj => "getPrograms" in obj, get: obj => obj.getPrograms }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitIntakeForm_decorators, { kind: "method", name: "submitIntakeForm", static: false, private: false, access: { has: obj => "submitIntakeForm" in obj, get: obj => obj.submitIntakeForm }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitAssessment_decorators, { kind: "method", name: "submitAssessment", static: false, private: false, access: { has: obj => "submitAssessment" in obj, get: obj => obj.submitAssessment }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendReminder_decorators, { kind: "method", name: "sendReminder", static: false, private: false, access: { has: obj => "sendReminder" in obj, get: obj => obj.sendReminder }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOnboardingStatistics_decorators, { kind: "method", name: "getOnboardingStatistics", static: false, private: false, access: { has: obj => "getOnboardingStatistics" in obj, get: obj => obj.getOnboardingStatistics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OnboardingController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OnboardingController = _classThis;
})();
exports.OnboardingController = OnboardingController;
