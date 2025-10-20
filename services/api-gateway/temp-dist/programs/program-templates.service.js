"use strict";
/**
 * ProgramTemplatesService - Manages coaching program templates and curriculum
 * Handles program creation, lesson management, progress tracking, and customization
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
exports.ProgramTemplatesService = void 0;
const common_1 = require("@nestjs/common");
let ProgramTemplatesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ProgramTemplatesService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(ProgramTemplatesService.name);
        }
        /**
         * Get all available program templates
         */
        async getAllTemplates(filters) {
            try {
                let templates = this.getDefaultTemplates();
                // Apply filters
                if (filters?.category) {
                    templates = templates.filter(t => t.category === filters.category);
                }
                if (filters?.difficulty) {
                    templates = templates.filter(t => t.difficulty === filters.difficulty);
                }
                if (filters?.minRating) {
                    templates = templates.filter(t => t.rating >= filters.minRating);
                }
                this.logger.log(`📚 Retrieved ${templates.length} program templates`);
                return templates;
            }
            catch (error) {
                this.logger.error('Failed to get program templates:', error);
                throw new Error(`Failed to get templates: ${error.message}`);
            }
        }
        /**
         * Get a specific program template by ID
         */
        async getTemplate(templateId) {
            try {
                const templates = this.getDefaultTemplates();
                const template = templates.find(t => t.id === templateId);
                if (template) {
                    this.logger.log(`📖 Retrieved template: ${template.title}`);
                }
                return template || null;
            }
            catch (error) {
                this.logger.error(`Failed to get template ${templateId}:`, error);
                throw new Error(`Failed to get template: ${error.message}`);
            }
        }
        /**
         * Create a new program template
         */
        async createTemplate(templateData) {
            try {
                const newTemplate = {
                    ...templateData,
                    id: `template_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    rating: 0,
                    enrollmentCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                // In a real implementation, save to database
                this.logger.log(`✅ Created new template: ${newTemplate.title}`);
                return newTemplate;
            }
            catch (error) {
                this.logger.error('Failed to create template:', error);
                throw new Error(`Template creation failed: ${error.message}`);
            }
        }
        /**
         * Update an existing program template
         */
        async updateTemplate(templateId, updates) {
            try {
                const template = await this.getTemplate(templateId);
                if (!template) {
                    throw new Error('Template not found');
                }
                const updatedTemplate = {
                    ...template,
                    ...updates,
                    updatedAt: new Date(),
                };
                this.logger.log(`📝 Updated template: ${updatedTemplate.title}`);
                return updatedTemplate;
            }
            catch (error) {
                this.logger.error(`Failed to update template ${templateId}:`, error);
                throw new Error(`Template update failed: ${error.message}`);
            }
        }
        /**
         * Clone a program template
         */
        async cloneTemplate(templateId, newTitle, customizations) {
            try {
                const originalTemplate = await this.getTemplate(templateId);
                if (!originalTemplate) {
                    throw new Error('Original template not found');
                }
                const clonedTemplate = {
                    ...originalTemplate,
                    ...customizations,
                    id: `template_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    title: newTitle,
                    rating: 0,
                    enrollmentCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.logger.log(`🔄 Cloned template: ${originalTemplate.title} → ${newTitle}`);
                return clonedTemplate;
            }
            catch (error) {
                this.logger.error(`Failed to clone template ${templateId}:`, error);
                throw new Error(`Template cloning failed: ${error.message}`);
            }
        }
        /**
         * Get client's program progress
         */
        async getClientProgress(clientId, programId) {
            try {
                // In a real implementation, fetch from database
                // For now, return mock progress
                const mockProgress = {
                    clientId,
                    programId,
                    coachId: 'coach_123',
                    enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                    startedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
                    expectedCompletionDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
                    status: 'in-progress',
                    currentModule: 2,
                    currentLesson: 3,
                    completedLessons: ['lesson_1_1', 'lesson_1_2', 'lesson_2_1', 'lesson_2_2'],
                    completedAssessments: ['assessment_1'],
                    overallProgress: 35,
                    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    notes: 'Client is making good progress. Showing strong engagement with goal-setting exercises.',
                    customizations: [],
                };
                return mockProgress;
            }
            catch (error) {
                this.logger.error(`Failed to get progress for client ${clientId}:`, error);
                return null;
            }
        }
        /**
         * Enroll client in a program
         */
        async enrollClient(clientId, programId, coachId) {
            try {
                const template = await this.getTemplate(programId);
                if (!template) {
                    throw new Error('Program template not found');
                }
                const enrollment = {
                    clientId,
                    programId,
                    coachId,
                    enrolledAt: new Date(),
                    expectedCompletionDate: new Date(Date.now() + this.parseDuration(template.duration)),
                    status: 'enrolled',
                    currentModule: 1,
                    currentLesson: 1,
                    completedLessons: [],
                    completedAssessments: [],
                    overallProgress: 0,
                    lastActivity: new Date(),
                    notes: '',
                    customizations: [],
                };
                this.logger.log(`🎓 Enrolled client ${clientId} in program ${template.title}`);
                return enrollment;
            }
            catch (error) {
                this.logger.error(`Failed to enroll client ${clientId}:`, error);
                throw new Error(`Enrollment failed: ${error.message}`);
            }
        }
        /**
         * Mark lesson as completed
         */
        async completeLesson(clientId, programId, lessonId) {
            try {
                const progress = await this.getClientProgress(clientId, programId);
                if (!progress) {
                    throw new Error('Client progress not found');
                }
                if (!progress.completedLessons.includes(lessonId)) {
                    progress.completedLessons.push(lessonId);
                    progress.lastActivity = new Date();
                    // Calculate new progress percentage
                    const template = await this.getTemplate(programId);
                    if (template) {
                        const totalLessons = template.modules.reduce((sum, module) => sum + module.lessons.length, 0);
                        progress.overallProgress = Math.round((progress.completedLessons.length / totalLessons) * 100);
                    }
                }
                this.logger.log(`✅ Lesson ${lessonId} completed by client ${clientId}`);
                return progress;
            }
            catch (error) {
                this.logger.error(`Failed to complete lesson ${lessonId}:`, error);
                throw new Error(`Lesson completion failed: ${error.message}`);
            }
        }
        /**
         * Get program curriculum outline
         */
        async getCurriculumOutline(programId) {
            try {
                const template = await this.getTemplate(programId);
                if (!template) {
                    throw new Error('Program template not found');
                }
                const outline = {
                    programTitle: template.title,
                    totalModules: template.modules.length,
                    totalLessons: template.modules.reduce((sum, module) => sum + module.lessons.length, 0),
                    estimatedDuration: template.duration,
                    modules: template.modules.map(module => ({
                        id: module.id,
                        title: module.title,
                        description: module.description,
                        order: module.order,
                        duration: module.estimatedDuration,
                        lessonsCount: module.lessons.length,
                        objectives: module.objectives,
                        lessons: module.lessons.map(lesson => ({
                            id: lesson.id,
                            title: lesson.title,
                            type: lesson.type,
                            duration: lesson.duration,
                            objectives: lesson.objectives,
                            isRequired: lesson.isRequired,
                        })),
                        assessments: module.assessments.map(assessment => ({
                            id: assessment.id,
                            title: assessment.title,
                            type: assessment.type,
                            questionsCount: assessment.questions.length,
                        })),
                    })),
                };
                return outline;
            }
            catch (error) {
                this.logger.error(`Failed to get curriculum outline for ${programId}:`, error);
                throw new Error(`Failed to get curriculum outline: ${error.message}`);
            }
        }
        /**
         * Generate program completion certificate
         */
        async generateCertificate(clientId, programId) {
            try {
                const progress = await this.getClientProgress(clientId, programId);
                const template = await this.getTemplate(programId);
                if (!progress || !template) {
                    throw new Error('Progress or template not found');
                }
                if (progress.status !== 'completed') {
                    throw new Error('Program not completed yet');
                }
                const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const certificate = {
                    certificateId,
                    clientId,
                    programId,
                    programTitle: template.title,
                    completionDate: progress.actualCompletionDate,
                    duration: template.duration,
                    totalHours: template.modules.reduce((sum, module) => sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.duration, 0), 0) / 60, // Convert minutes to hours
                    grade: this.calculateFinalGrade(progress),
                    issuedBy: 'Life Coaching Institute',
                    verificationCode: this.generateVerificationCode(),
                    pdfUrl: `/certificates/${certificateId}.pdf`, // Mock URL
                };
                this.logger.log(`🏆 Generated certificate for client ${clientId}: ${certificate.certificateId}`);
                return certificate;
            }
            catch (error) {
                this.logger.error(`Failed to generate certificate:`, error);
                throw new Error(`Certificate generation failed: ${error.message}`);
            }
        }
        // Private helper methods
        getDefaultTemplates() {
            return [
                {
                    id: 'life-balance-mastery',
                    title: 'Life Balance Mastery',
                    description: 'Comprehensive program to achieve work-life balance and personal fulfillment',
                    category: 'life-coaching',
                    difficulty: 'beginner',
                    duration: '8 weeks',
                    totalSessions: 8,
                    sessionLength: 60,
                    priceRange: { min: 800, max: 1200, currency: 'USD' },
                    modules: this.getLifeBalanceModules(),
                    targetAudience: ['Working professionals', 'Parents', 'Career changers'],
                    prerequisites: ['Commitment to weekly sessions', 'Willingness to do homework'],
                    outcomes: [
                        'Clear priorities and boundaries',
                        'Effective time management skills',
                        'Reduced stress and overwhelm',
                        'Improved relationships',
                        'Increased life satisfaction'
                    ],
                    certificationAvailable: true,
                    tags: ['balance', 'stress-management', 'productivity', 'wellness'],
                    rating: 4.8,
                    enrollmentCount: 156,
                    isActive: true,
                    createdBy: 'system',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date(),
                },
                {
                    id: 'career-transition-guide',
                    title: 'Career Transition Success',
                    description: 'Navigate career changes with confidence and strategic planning',
                    category: 'career',
                    difficulty: 'intermediate',
                    duration: '12 weeks',
                    totalSessions: 12,
                    sessionLength: 75,
                    priceRange: { min: 1200, max: 1800, currency: 'USD' },
                    modules: this.getCareerTransitionModules(),
                    targetAudience: ['Mid-career professionals', 'Recent graduates', 'Career pivoters'],
                    prerequisites: ['Resume and portfolio ready', '2+ years work experience'],
                    outcomes: [
                        'Clear career vision and strategy',
                        'Updated professional brand',
                        'Effective networking skills',
                        'Interview confidence',
                        'Salary negotiation abilities'
                    ],
                    certificationAvailable: true,
                    tags: ['career', 'transition', 'networking', 'interviews'],
                    rating: 4.9,
                    enrollmentCount: 89,
                    isActive: true,
                    createdBy: 'system',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date(),
                },
                {
                    id: 'stress-resilience-program',
                    title: 'Stress & Resilience Building',
                    description: 'Develop emotional resilience and stress management skills',
                    category: 'wellness',
                    difficulty: 'beginner',
                    duration: '6 weeks',
                    totalSessions: 6,
                    sessionLength: 45,
                    priceRange: { min: 600, max: 900, currency: 'USD' },
                    modules: this.getStressResilienceModules(),
                    targetAudience: ['High-stress professionals', 'Students', 'Caregivers'],
                    prerequisites: ['Basic understanding of stress triggers'],
                    outcomes: [
                        'Stress awareness and management',
                        'Emotional regulation skills',
                        'Resilience building techniques',
                        'Mindfulness practices',
                        'Work-life integration'
                    ],
                    certificationAvailable: false,
                    tags: ['stress', 'resilience', 'mindfulness', 'emotional-health'],
                    rating: 4.7,
                    enrollmentCount: 234,
                    isActive: true,
                    createdBy: 'system',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date(),
                },
            ];
        }
        getLifeBalanceModules() {
            return [
                {
                    id: 'module_1',
                    title: 'Foundation: Understanding Life Balance',
                    description: 'Explore what life balance means to you and identify current challenges',
                    order: 1,
                    estimatedDuration: '1 week',
                    objectives: [
                        'Define personal life balance',
                        'Identify current imbalances',
                        'Set program goals'
                    ],
                    lessons: [
                        {
                            id: 'lesson_1_1',
                            title: 'What is Life Balance?',
                            description: 'Explore different perspectives on work-life balance',
                            type: 'video',
                            content: 'Video content about life balance concepts...',
                            duration: 30,
                            order: 1,
                            objectives: ['Understand balance concepts', 'Reflect on personal definition'],
                            materials: ['Notebook', 'Pen'],
                            isRequired: true,
                        },
                        {
                            id: 'lesson_1_2',
                            title: 'Life Balance Assessment',
                            description: 'Evaluate your current life balance across different areas',
                            type: 'worksheet',
                            content: 'Assessment worksheet for life areas...',
                            duration: 45,
                            order: 2,
                            objectives: ['Complete self-assessment', 'Identify priority areas'],
                            materials: ['Life Balance Wheel worksheet'],
                            homework: 'Complete the Life Balance Wheel exercise',
                            isRequired: true,
                        },
                    ],
                    assessments: [
                        {
                            id: 'assessment_1',
                            title: 'Module 1 Reflection',
                            description: 'Reflect on your learning and insights from this module',
                            type: 'reflection',
                            questions: [
                                {
                                    id: 'q1',
                                    question: 'What does life balance mean to you personally?',
                                    type: 'essay',
                                    points: 10,
                                },
                                {
                                    id: 'q2',
                                    question: 'Which area of your life needs the most attention?',
                                    type: 'short-answer',
                                    points: 5,
                                },
                            ],
                            retakesAllowed: 2,
                        },
                    ],
                    resources: [
                        {
                            id: 'resource_1',
                            title: 'Life Balance Wheel Template',
                            description: 'Interactive template for ongoing balance assessment',
                            type: 'template',
                            url: '/resources/life-balance-wheel.pdf',
                            category: 'worksheet',
                            downloadable: true,
                        },
                    ],
                    isRequired: true,
                },
                // Additional modules would be defined here...
            ];
        }
        getCareerTransitionModules() {
            // Mock implementation - in real system, would be comprehensive
            return [
                {
                    id: 'career_module_1',
                    title: 'Career Vision & Strategy',
                    description: 'Develop a clear vision for your career transition',
                    order: 1,
                    estimatedDuration: '2 weeks',
                    objectives: ['Create career vision', 'Develop transition strategy'],
                    lessons: [],
                    assessments: [],
                    resources: [],
                    isRequired: true,
                },
            ];
        }
        getStressResilienceModules() {
            // Mock implementation - in real system, would be comprehensive
            return [
                {
                    id: 'stress_module_1',
                    title: 'Understanding Stress',
                    description: 'Learn about stress, its causes, and effects',
                    order: 1,
                    estimatedDuration: '1 week',
                    objectives: ['Understand stress mechanisms', 'Identify personal stress triggers'],
                    lessons: [],
                    assessments: [],
                    resources: [],
                    isRequired: true,
                },
            ];
        }
        parseDuration(duration) {
            // Convert duration string to milliseconds
            const match = duration.match(/(\d+)\s*(week|month|day)s?/i);
            if (!match)
                return 30 * 24 * 60 * 60 * 1000; // Default 30 days
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            switch (unit) {
                case 'day':
                    return value * 24 * 60 * 60 * 1000;
                case 'week':
                    return value * 7 * 24 * 60 * 60 * 1000;
                case 'month':
                    return value * 30 * 24 * 60 * 60 * 1000;
                default:
                    return 30 * 24 * 60 * 60 * 1000;
            }
        }
        calculateFinalGrade(progress) {
            // Mock grade calculation based on completion and assessment scores
            if (progress.overallProgress === 100) {
                return 'A'; // Excellent
            }
            else if (progress.overallProgress >= 85) {
                return 'B+'; // Very Good
            }
            else if (progress.overallProgress >= 70) {
                return 'B'; // Good
            }
            else {
                return 'C'; // Satisfactory
            }
        }
        generateVerificationCode() {
            return `VER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        }
    };
    __setFunctionName(_classThis, "ProgramTemplatesService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProgramTemplatesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProgramTemplatesService = _classThis;
})();
exports.ProgramTemplatesService = ProgramTemplatesService;
