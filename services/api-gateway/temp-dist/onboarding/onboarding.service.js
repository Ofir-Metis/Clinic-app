"use strict";
/**
 * OnboardingService - Handles client onboarding flow for life coaching programs
 * Manages intake forms, program selection, goal setting, and initial assessments
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
let OnboardingService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OnboardingService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(OnboardingService.name);
        }
        /**
         * Initialize onboarding process for a new client
         */
        async initializeOnboarding(clientEmail) {
            try {
                const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const onboardingSteps = [
                    {
                        id: 'welcome',
                        title: 'Welcome to Life Coaching',
                        description: 'Introduction to our coaching approach and what to expect',
                        type: 'welcome',
                        required: true,
                        order: 1,
                        estimatedMinutes: 5,
                        status: 'pending',
                    },
                    {
                        id: 'intake-form',
                        title: 'Personal Information & Background',
                        description: 'Tell us about yourself and your coaching goals',
                        type: 'form',
                        required: true,
                        order: 2,
                        estimatedMinutes: 15,
                        status: 'pending',
                    },
                    {
                        id: 'lifestyle-assessment',
                        title: 'Lifestyle & Wellness Assessment',
                        description: 'Help us understand your current lifestyle and wellness status',
                        type: 'assessment',
                        required: true,
                        order: 3,
                        estimatedMinutes: 10,
                        status: 'pending',
                    },
                    {
                        id: 'goal-setting',
                        title: 'Goal Setting & Vision',
                        description: 'Define your coaching goals and desired outcomes',
                        type: 'goal-setting',
                        required: true,
                        order: 4,
                        estimatedMinutes: 20,
                        status: 'pending',
                    },
                    {
                        id: 'program-selection',
                        title: 'Choose Your Coaching Program',
                        description: 'Select the program that best fits your needs and goals',
                        type: 'selection',
                        required: true,
                        order: 5,
                        estimatedMinutes: 10,
                        status: 'pending',
                    },
                    {
                        id: 'coach-matching',
                        title: 'Coach Matching',
                        description: 'We\'ll match you with the perfect coach for your journey',
                        type: 'selection',
                        required: true,
                        order: 6,
                        estimatedMinutes: 5,
                        status: 'pending',
                    },
                    {
                        id: 'schedule-intro',
                        title: 'Schedule Introduction Session',
                        description: 'Book your first coaching session with your matched coach',
                        type: 'scheduling',
                        required: true,
                        order: 7,
                        estimatedMinutes: 5,
                        status: 'pending',
                    },
                    {
                        id: 'preparation',
                        title: 'Session Preparation',
                        description: 'Prepare for your first coaching session',
                        type: 'form',
                        required: false,
                        order: 8,
                        estimatedMinutes: 10,
                        status: 'pending',
                    },
                ];
                const progress = {
                    clientId,
                    currentStep: 1,
                    totalSteps: onboardingSteps.length,
                    completedSteps: [],
                    percentComplete: 0,
                    startedAt: new Date(),
                    expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    status: 'not-started',
                };
                this.logger.log(`🎯 Initialized onboarding for client ${clientEmail}`);
                return progress;
            }
            catch (error) {
                this.logger.error('Failed to initialize onboarding:', error);
                throw new Error(`Onboarding initialization failed: ${error.message}`);
            }
        }
        /**
         * Get available onboarding steps
         */
        getOnboardingSteps() {
            return [
                {
                    id: 'welcome',
                    title: 'Welcome to Life Coaching',
                    description: 'Introduction to our coaching approach and what to expect',
                    type: 'welcome',
                    required: true,
                    order: 1,
                    estimatedMinutes: 5,
                    status: 'pending',
                },
                {
                    id: 'intake-form',
                    title: 'Personal Information & Background',
                    description: 'Tell us about yourself and your coaching goals',
                    type: 'form',
                    required: true,
                    order: 2,
                    estimatedMinutes: 15,
                    status: 'pending',
                },
                {
                    id: 'lifestyle-assessment',
                    title: 'Lifestyle & Wellness Assessment',
                    description: 'Help us understand your current lifestyle and wellness status',
                    type: 'assessment',
                    required: true,
                    order: 3,
                    estimatedMinutes: 10,
                    status: 'pending',
                },
                {
                    id: 'goal-setting',
                    title: 'Goal Setting & Vision',
                    description: 'Define your coaching goals and desired outcomes',
                    type: 'goal-setting',
                    required: true,
                    order: 4,
                    estimatedMinutes: 20,
                    status: 'pending',
                },
                {
                    id: 'program-selection',
                    title: 'Choose Your Coaching Program',
                    description: 'Select the program that best fits your needs and goals',
                    type: 'selection',
                    required: true,
                    order: 5,
                    estimatedMinutes: 10,
                    status: 'pending',
                },
                {
                    id: 'coach-matching',
                    title: 'Coach Matching',
                    description: 'We\'ll match you with the perfect coach for your journey',
                    type: 'selection',
                    required: true,
                    order: 6,
                    estimatedMinutes: 5,
                    status: 'pending',
                },
                {
                    id: 'schedule-intro',
                    title: 'Schedule Introduction Session',
                    description: 'Book your first coaching session with your matched coach',
                    type: 'scheduling',
                    required: true,
                    order: 7,
                    estimatedMinutes: 5,
                    status: 'pending',
                },
                {
                    id: 'preparation',
                    title: 'Session Preparation',
                    description: 'Prepare for your first coaching session',
                    type: 'form',
                    required: false,
                    order: 8,
                    estimatedMinutes: 10,
                    status: 'pending',
                },
            ];
        }
        /**
         * Complete an onboarding step
         */
        async completeStep(clientId, stepId, stepData) {
            try {
                // In a real implementation, you'd fetch progress from database
                // For now, we'll create a mock progress
                const steps = this.getOnboardingSteps();
                const stepIndex = steps.findIndex(s => s.id === stepId);
                if (stepIndex === -1) {
                    throw new Error(`Step ${stepId} not found`);
                }
                const completedStep = {
                    ...steps[stepIndex],
                    status: 'completed',
                    data: stepData,
                    completedAt: new Date(),
                };
                // Process specific step data
                let intakeForm;
                let assessment;
                if (stepId === 'intake-form') {
                    intakeForm = this.processIntakeForm(stepData);
                }
                else if (stepId === 'lifestyle-assessment') {
                    assessment = this.processAssessment(stepData);
                }
                const progress = {
                    clientId,
                    currentStep: stepIndex + 2, // Next step
                    totalSteps: steps.length,
                    completedSteps: [completedStep],
                    percentComplete: Math.round(((stepIndex + 1) / steps.length) * 100),
                    startedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                    expectedCompletionDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days
                    status: stepIndex + 1 === steps.length ? 'completed' : 'in-progress',
                    intakeForm,
                    assessment,
                };
                this.logger.log(`✅ Completed step ${stepId} for client ${clientId}`);
                return progress;
            }
            catch (error) {
                this.logger.error(`Failed to complete step ${stepId}:`, error);
                throw new Error(`Step completion failed: ${error.message}`);
            }
        }
        /**
         * Get onboarding progress for a client
         */
        async getProgress(clientId) {
            try {
                // In a real implementation, you'd fetch from database
                // For now, return a mock progress
                const mockProgress = {
                    clientId,
                    currentStep: 3,
                    totalSteps: 8,
                    completedSteps: [
                        {
                            id: 'welcome',
                            title: 'Welcome to Life Coaching',
                            description: 'Introduction to our coaching approach and what to expect',
                            type: 'welcome',
                            required: true,
                            order: 1,
                            estimatedMinutes: 5,
                            status: 'completed',
                            completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                        },
                        {
                            id: 'intake-form',
                            title: 'Personal Information & Background',
                            description: 'Tell us about yourself and your coaching goals',
                            type: 'form',
                            required: true,
                            order: 2,
                            estimatedMinutes: 15,
                            status: 'completed',
                            completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        },
                    ],
                    percentComplete: 25,
                    startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                    expectedCompletionDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
                    status: 'in-progress',
                };
                return mockProgress;
            }
            catch (error) {
                this.logger.error(`Failed to get progress for client ${clientId}:`, error);
                return null;
            }
        }
        /**
         * Process intake form data
         */
        processIntakeForm(formData) {
            // Validate and structure intake form data
            const intakeForm = {
                personalInfo: {
                    firstName: formData.firstName || '',
                    lastName: formData.lastName || '',
                    email: formData.email || '',
                    phone: formData.phone || '',
                    dateOfBirth: formData.dateOfBirth || '',
                    timezone: formData.timezone || 'UTC',
                    preferredLanguage: formData.preferredLanguage || 'en',
                },
                coachingBackground: {
                    previousCoaching: formData.previousCoaching || false,
                    previousCoachingDetails: formData.previousCoachingDetails,
                    currentChallenges: formData.currentChallenges || [],
                    motivationLevel: formData.motivationLevel || 'medium',
                    commitmentLevel: formData.commitmentLevel || 'medium',
                },
                lifestyle: {
                    occupation: formData.occupation || '',
                    workSchedule: formData.workSchedule || 'standard',
                    availableTimeSlots: formData.availableTimeSlots || [],
                    preferredSessionLength: formData.preferredSessionLength || '60min',
                    preferredSessionFrequency: formData.preferredSessionFrequency || 'weekly',
                },
                healthAndWellness: {
                    currentStressLevel: parseInt(formData.currentStressLevel) || 5,
                    sleepQuality: parseInt(formData.sleepQuality) || 5,
                    exerciseFrequency: formData.exerciseFrequency || 'sometimes',
                    currentTherapy: formData.currentTherapy || false,
                    currentMedication: formData.currentMedication || false,
                    mentalHealthConcerns: formData.mentalHealthConcerns || [],
                },
                goals: {
                    primaryGoals: formData.primaryGoals || [],
                    specificOutcomes: formData.specificOutcomes || [],
                    timeframe: formData.timeframe || '6months',
                    successMetrics: formData.successMetrics || [],
                },
            };
            return intakeForm;
        }
        /**
         * Process assessment data and generate recommendations
         */
        processAssessment(assessmentData) {
            // This would typically involve more sophisticated analysis
            // For now, we'll use simple logic to generate recommendations
            const assessment = {
                personalityType: assessmentData.personalityType || 'ambivert',
                learningStyle: assessmentData.learningStyle || 'visual',
                communicationStyle: assessmentData.communicationStyle || 'collaborative',
                changeReadiness: parseInt(assessmentData.changeReadiness) || 7,
                supportSystem: parseInt(assessmentData.supportSystem) || 6,
                selfAwareness: parseInt(assessmentData.selfAwareness) || 6,
                recommendedPrograms: this.generateProgramRecommendations(assessmentData),
                recommendedCoaches: this.generateCoachRecommendations(assessmentData),
            };
            return assessment;
        }
        /**
         * Generate program recommendations based on assessment
         */
        generateProgramRecommendations(data) {
            const recommendations = [];
            // Basic recommendation logic
            if (data.currentStressLevel >= 7) {
                recommendations.push('stress-management');
                recommendations.push('mindfulness-based-coaching');
            }
            if (data.goals?.includes('career')) {
                recommendations.push('career-transition');
                recommendations.push('leadership-development');
            }
            if (data.goals?.includes('relationships')) {
                recommendations.push('relationship-coaching');
                recommendations.push('communication-skills');
            }
            if (data.goals?.includes('health')) {
                recommendations.push('wellness-coaching');
                recommendations.push('lifestyle-change');
            }
            // Default recommendations
            if (recommendations.length === 0) {
                recommendations.push('life-balance');
                recommendations.push('personal-growth');
            }
            return recommendations;
        }
        /**
         * Generate coach recommendations based on assessment
         */
        generateCoachRecommendations(data) {
            const recommendations = [];
            // Match coaches based on specialties and communication style
            if (data.communicationStyle === 'direct') {
                recommendations.push('coach_direct_style');
            }
            else if (data.communicationStyle === 'supportive') {
                recommendations.push('coach_supportive_style');
            }
            if (data.goals?.includes('career')) {
                recommendations.push('coach_career_specialist');
            }
            // Default coach recommendations
            if (recommendations.length === 0) {
                recommendations.push('coach_general_1');
                recommendations.push('coach_general_2');
            }
            return recommendations;
        }
        /**
         * Get available coaching programs
         */
        getAvailablePrograms() {
            return [
                {
                    id: 'life-balance',
                    name: 'Life Balance Mastery',
                    description: 'Find harmony between work, relationships, and personal growth',
                    duration: '3 months',
                    sessions: 12,
                    price: 1200,
                    features: ['Weekly 1-on-1 sessions', 'Goal tracking', 'Resource library', 'Email support'],
                },
                {
                    id: 'stress-management',
                    name: 'Stress & Anxiety Management',
                    description: 'Learn practical tools to manage stress and build resilience',
                    duration: '2 months',
                    sessions: 8,
                    price: 800,
                    features: ['Bi-weekly sessions', 'Mindfulness training', 'Stress tracking tools', 'Crisis support'],
                },
                {
                    id: 'career-transition',
                    name: 'Career Transition Coaching',
                    description: 'Navigate career changes with confidence and clarity',
                    duration: '4 months',
                    sessions: 16,
                    price: 1600,
                    features: ['Weekly sessions', 'Resume review', 'Interview prep', 'Networking guidance'],
                },
                {
                    id: 'relationship-coaching',
                    name: 'Relationship & Communication',
                    description: 'Improve relationships through better communication and understanding',
                    duration: '3 months',
                    sessions: 12,
                    price: 1200,
                    features: ['Weekly sessions', 'Communication exercises', 'Conflict resolution', 'Partner sessions available'],
                },
                {
                    id: 'wellness-coaching',
                    name: 'Holistic Wellness Program',
                    description: 'Transform your health and vitality through sustainable lifestyle changes',
                    duration: '6 months',
                    sessions: 24,
                    price: 2400,
                    features: ['Bi-weekly sessions', 'Nutrition guidance', 'Exercise planning', 'Sleep optimization'],
                },
            ];
        }
        /**
         * Send onboarding reminders
         */
        async sendOnboardingReminder(clientId) {
            try {
                // In a real implementation, you'd send actual emails/notifications
                this.logger.log(`📧 Sending onboarding reminder to client ${clientId}`);
                // Mock email sending
                const mockEmailContent = {
                    to: 'client@example.com',
                    subject: 'Complete Your Life Coaching Onboarding',
                    body: `
          Hi there! 
          
          We're excited to have you join our life coaching program. 
          You have a few more steps to complete in your onboarding process.
          
          Complete your onboarding: [LINK]
          
          Questions? Reply to this email or call us at (555) 123-4567.
          
          Best regards,
          Your Coaching Team
        `,
                };
                this.logger.log('📧 Onboarding reminder sent successfully');
            }
            catch (error) {
                this.logger.error('Failed to send onboarding reminder:', error);
                throw new Error(`Reminder sending failed: ${error.message}`);
            }
        }
    };
    __setFunctionName(_classThis, "OnboardingService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OnboardingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OnboardingService = _classThis;
})();
exports.OnboardingService = OnboardingService;
