"use strict";
/**
 * ProgramsController - Handles coaching program templates and curriculum management
 * Provides endpoints for program CRUD, enrollment, progress tracking, and certification
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
exports.ProgramsController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let ProgramsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('api/programs')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getTemplates_decorators;
    let _getTemplate_decorators;
    let _createTemplate_decorators;
    let _updateTemplate_decorators;
    let _cloneTemplate_decorators;
    let _enrollClient_decorators;
    let _getClientProgress_decorators;
    let _completeLesson_decorators;
    let _getCurriculum_decorators;
    let _generateCertificate_decorators;
    let _getProgramStatistics_decorators;
    let _searchPrograms_decorators;
    var ProgramsController = _classThis = class {
        constructor(programTemplatesService) {
            this.programTemplatesService = (__runInitializers(this, _instanceExtraInitializers), programTemplatesService);
            this.logger = new common_1.Logger(ProgramsController.name);
        }
        /**
         * Get all available program templates (public for browsing)
         */
        async getTemplates(category, difficulty, minRating) {
            try {
                const filters = {};
                if (category)
                    filters.category = category;
                if (difficulty)
                    filters.difficulty = difficulty;
                if (minRating)
                    filters.minRating = parseFloat(minRating);
                const templates = await this.programTemplatesService.getAllTemplates(filters);
                return {
                    status: 'success',
                    templates: templates.map(template => ({
                        id: template.id,
                        title: template.title,
                        description: template.description,
                        category: template.category,
                        difficulty: template.difficulty,
                        duration: template.duration,
                        totalSessions: template.totalSessions,
                        sessionLength: template.sessionLength,
                        priceRange: template.priceRange,
                        targetAudience: template.targetAudience,
                        outcomes: template.outcomes,
                        certificationAvailable: template.certificationAvailable,
                        tags: template.tags,
                        rating: template.rating,
                        enrollmentCount: template.enrollmentCount,
                        modulesCount: template.modules.length,
                        totalLessons: template.modules.reduce((sum, module) => sum + module.lessons.length, 0),
                    })),
                    totalCount: templates.length,
                    filters: {
                        categories: [...new Set(templates.map(t => t.category))],
                        difficulties: [...new Set(templates.map(t => t.difficulty))],
                        tags: [...new Set(templates.flatMap(t => t.tags))],
                    },
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get program templates:', error);
                throw new common_1.HttpException(`Failed to get templates: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get detailed program template by ID
         */
        async getTemplate(templateId) {
            try {
                const template = await this.programTemplatesService.getTemplate(templateId);
                if (!template) {
                    throw new common_1.HttpException('Program template not found', common_1.HttpStatus.NOT_FOUND);
                }
                return {
                    status: 'success',
                    template,
                    curriculum: await this.programTemplatesService.getCurriculumOutline(templateId),
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to get template ${templateId}:`, error);
                throw new common_1.HttpException(`Failed to get template: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create new program template (coach/admin only)
         */
        async createTemplate(templateData, req) {
            try {
                // Add creator information
                const dataWithCreator = {
                    ...templateData,
                    createdBy: req.user.sub,
                };
                const template = await this.programTemplatesService.createTemplate(dataWithCreator);
                return {
                    status: 'success',
                    message: 'Program template created successfully',
                    template: {
                        id: template.id,
                        title: template.title,
                        category: template.category,
                        difficulty: template.difficulty,
                        duration: template.duration,
                    },
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to create program template:', error);
                throw new common_1.HttpException(`Template creation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update program template (coach/admin only)
         */
        async updateTemplate(templateId, updates, req) {
            try {
                const template = await this.programTemplatesService.updateTemplate(templateId, updates);
                return {
                    status: 'success',
                    message: 'Program template updated successfully',
                    template: {
                        id: template.id,
                        title: template.title,
                        updatedAt: template.updatedAt,
                    },
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to update template ${templateId}:`, error);
                throw new common_1.HttpException(`Template update failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Clone program template (coach/admin only)
         */
        async cloneTemplate(templateId, cloneData, req) {
            try {
                if (!cloneData.title) {
                    throw new common_1.HttpException('New title is required', common_1.HttpStatus.BAD_REQUEST);
                }
                const customizations = {
                    ...cloneData.customizations,
                    createdBy: req.user.sub,
                };
                const clonedTemplate = await this.programTemplatesService.cloneTemplate(templateId, cloneData.title, customizations);
                return {
                    status: 'success',
                    message: 'Program template cloned successfully',
                    template: {
                        id: clonedTemplate.id,
                        title: clonedTemplate.title,
                        originalId: templateId,
                    },
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to clone template ${templateId}:`, error);
                throw new common_1.HttpException(`Template cloning failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Enroll client in a program (coach/admin only)
         */
        async enrollClient(enrollmentData, req) {
            try {
                if (!enrollmentData.clientId || !enrollmentData.programId) {
                    throw new common_1.HttpException('Client ID and Program ID are required', common_1.HttpStatus.BAD_REQUEST);
                }
                const coachId = enrollmentData.coachId || req.user.sub;
                const progress = await this.programTemplatesService.enrollClient(enrollmentData.clientId, enrollmentData.programId, coachId);
                return {
                    status: 'success',
                    message: 'Client enrolled successfully',
                    enrollment: {
                        clientId: progress.clientId,
                        programId: progress.programId,
                        coachId: progress.coachId,
                        enrolledAt: progress.enrolledAt,
                        expectedCompletionDate: progress.expectedCompletionDate,
                        status: progress.status,
                    },
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to enroll client:', error);
                throw new common_1.HttpException(`Enrollment failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get client's program progress
         */
        async getClientProgress(clientId, programId, req) {
            try {
                // In production, verify that the user can access this client's data
                const progress = await this.programTemplatesService.getClientProgress(clientId, programId);
                if (!progress) {
                    throw new common_1.HttpException('Program progress not found', common_1.HttpStatus.NOT_FOUND);
                }
                return {
                    status: 'success',
                    progress: {
                        ...progress,
                        nextSteps: this.getNextSteps(progress),
                        milestones: this.getMilestones(progress),
                    },
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to get progress for client ${clientId}:`, error);
                throw new common_1.HttpException(`Failed to get progress: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Complete a lesson
         */
        async completeLesson(clientId, programId, lessonId, lessonData, req) {
            try {
                const progress = await this.programTemplatesService.completeLesson(clientId, programId, lessonId);
                const response = {
                    status: 'success',
                    message: 'Lesson completed successfully',
                    progress: {
                        currentModule: progress.currentModule,
                        currentLesson: progress.currentLesson,
                        overallProgress: progress.overallProgress,
                        completedLessons: progress.completedLessons.length,
                    },
                };
                // Check for achievements
                const achievements = this.checkAchievements(progress);
                if (achievements.length > 0) {
                    response.achievements = achievements;
                }
                return response;
            }
            catch (error) {
                this.logger.error(`❌ Failed to complete lesson ${lessonId}:`, error);
                throw new common_1.HttpException(`Lesson completion failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get curriculum outline for a program
         */
        async getCurriculum(programId, req) {
            try {
                const curriculum = await this.programTemplatesService.getCurriculumOutline(programId);
                return {
                    status: 'success',
                    curriculum,
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to get curriculum for ${programId}:`, error);
                throw new common_1.HttpException(`Failed to get curriculum: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate completion certificate
         */
        async generateCertificate(clientId, programId, req) {
            try {
                const certificate = await this.programTemplatesService.generateCertificate(clientId, programId);
                return {
                    status: 'success',
                    message: 'Certificate generated successfully',
                    certificate,
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to generate certificate:`, error);
                throw new common_1.HttpException(`Certificate generation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get program statistics (admin only)
         */
        async getProgramStatistics(req) {
            try {
                // In a real implementation, fetch actual statistics from database
                const mockStats = {
                    totalPrograms: 12,
                    activePrograms: 8,
                    totalEnrollments: 342,
                    activeEnrollments: 156,
                    completionRate: 78.5,
                    averageRating: 4.6,
                    popularPrograms: [
                        { id: 'life-balance-mastery', title: 'Life Balance Mastery', enrollments: 156, rating: 4.8 },
                        { id: 'stress-resilience-program', title: 'Stress & Resilience Building', enrollments: 234, rating: 4.7 },
                        { id: 'career-transition-guide', title: 'Career Transition Success', enrollments: 89, rating: 4.9 },
                    ],
                    categoryDistribution: [
                        { category: 'life-coaching', count: 4 },
                        { category: 'career', count: 3 },
                        { category: 'wellness', count: 3 },
                        { category: 'relationships', count: 2 },
                    ],
                    monthlyEnrollments: [
                        { month: 'Jan', enrollments: 28 },
                        { month: 'Feb', enrollments: 35 },
                        { month: 'Mar', enrollments: 42 },
                        { month: 'Apr', enrollments: 38 },
                        { month: 'May', enrollments: 45 },
                        { month: 'Jun', enrollments: 52 },
                    ],
                };
                return {
                    status: 'success',
                    statistics: mockStats,
                    generatedAt: new Date().toISOString(),
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get program statistics:', error);
                throw new common_1.HttpException('Failed to get statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Search programs
         */
        async searchPrograms(query, category, difficulty, maxPrice, duration) {
            try {
                // Get all templates and apply search filters
                const templates = await this.programTemplatesService.getAllTemplates();
                let filteredTemplates = templates;
                // Text search
                if (query) {
                    const searchTerm = query.toLowerCase();
                    filteredTemplates = filteredTemplates.filter(template => template.title.toLowerCase().includes(searchTerm) ||
                        template.description.toLowerCase().includes(searchTerm) ||
                        template.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
                }
                // Category filter
                if (category) {
                    filteredTemplates = filteredTemplates.filter(t => t.category === category);
                }
                // Difficulty filter
                if (difficulty) {
                    filteredTemplates = filteredTemplates.filter(t => t.difficulty === difficulty);
                }
                // Price filter
                if (maxPrice) {
                    const maxPriceValue = parseFloat(maxPrice);
                    filteredTemplates = filteredTemplates.filter(t => t.priceRange.min <= maxPriceValue);
                }
                // Duration filter
                if (duration) {
                    filteredTemplates = filteredTemplates.filter(t => t.duration.includes(duration));
                }
                return {
                    status: 'success',
                    results: filteredTemplates.map(template => ({
                        id: template.id,
                        title: template.title,
                        description: template.description,
                        category: template.category,
                        difficulty: template.difficulty,
                        duration: template.duration,
                        priceRange: template.priceRange,
                        rating: template.rating,
                        enrollmentCount: template.enrollmentCount,
                        tags: template.tags,
                    })),
                    totalResults: filteredTemplates.length,
                    searchQuery: query,
                    appliedFilters: { category, difficulty, maxPrice, duration },
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to search programs:', error);
                throw new common_1.HttpException(`Search failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Private helper methods
        getNextSteps(progress) {
            const nextSteps = [];
            if (progress.status === 'enrolled') {
                nextSteps.push('Start your first lesson');
                nextSteps.push('Schedule initial coaching session');
            }
            else if (progress.status === 'in-progress') {
                nextSteps.push(`Continue with Module ${progress.currentModule}`);
                nextSteps.push('Complete assigned homework');
                nextSteps.push('Schedule next coaching session');
            }
            else if (progress.status === 'completed') {
                nextSteps.push('Request completion certificate');
                nextSteps.push('Explore advanced programs');
                nextSteps.push('Provide program feedback');
            }
            return nextSteps;
        }
        getMilestones(progress) {
            const milestones = [];
            // Progress milestones
            if (progress.overallProgress >= 25) {
                milestones.push({
                    title: 'Quarter Complete',
                    description: '25% of program completed',
                    achieved: true,
                    date: progress.lastActivity,
                });
            }
            if (progress.overallProgress >= 50) {
                milestones.push({
                    title: 'Halfway There',
                    description: '50% of program completed',
                    achieved: true,
                    date: progress.lastActivity,
                });
            }
            if (progress.overallProgress >= 75) {
                milestones.push({
                    title: 'Almost Done',
                    description: '75% of program completed',
                    achieved: true,
                    date: progress.lastActivity,
                });
            }
            if (progress.overallProgress === 100) {
                milestones.push({
                    title: 'Program Complete',
                    description: 'Congratulations on completing the program!',
                    achieved: true,
                    date: progress.actualCompletionDate,
                });
            }
            return milestones;
        }
        checkAchievements(progress) {
            const achievements = [];
            // Lesson completion achievements
            if (progress.completedLessons.length === 5) {
                achievements.push({
                    title: 'Learning Streak',
                    description: 'Completed 5 lessons',
                    icon: '📚',
                    points: 50,
                });
            }
            if (progress.completedLessons.length === 10) {
                achievements.push({
                    title: 'Dedicated Learner',
                    description: 'Completed 10 lessons',
                    icon: '🎯',
                    points: 100,
                });
            }
            // Progress achievements
            if (progress.overallProgress >= 50 && progress.overallProgress < 51) {
                achievements.push({
                    title: 'Halfway Hero',
                    description: 'Reached 50% completion',
                    icon: '🏆',
                    points: 100,
                });
            }
            return achievements;
        }
    };
    __setFunctionName(_classThis, "ProgramsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getTemplates_decorators = [(0, common_1.Get)('templates'), (0, common_2.Public)()];
        _getTemplate_decorators = [(0, common_1.Get)('templates/:templateId'), (0, common_2.Public)()];
        _createTemplate_decorators = [(0, common_1.Post)('templates'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _updateTemplate_decorators = [(0, common_1.Put)('templates/:templateId'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _cloneTemplate_decorators = [(0, common_1.Post)('templates/:templateId/clone'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _enrollClient_decorators = [(0, common_1.Post)('enroll'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _getClientProgress_decorators = [(0, common_1.Get)('progress/:clientId/:programId'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        _completeLesson_decorators = [(0, common_1.Post)('progress/:clientId/:programId/lessons/:lessonId/complete'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        _getCurriculum_decorators = [(0, common_1.Get)('curriculum/:programId'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
        _generateCertificate_decorators = [(0, common_1.Post)('certificate/:clientId/:programId'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _getProgramStatistics_decorators = [(0, common_1.Get)('statistics'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('admin', 'coach')];
        _searchPrograms_decorators = [(0, common_1.Get)('search'), (0, common_2.Public)()];
        __esDecorate(_classThis, null, _getTemplates_decorators, { kind: "method", name: "getTemplates", static: false, private: false, access: { has: obj => "getTemplates" in obj, get: obj => obj.getTemplates }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTemplate_decorators, { kind: "method", name: "getTemplate", static: false, private: false, access: { has: obj => "getTemplate" in obj, get: obj => obj.getTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createTemplate_decorators, { kind: "method", name: "createTemplate", static: false, private: false, access: { has: obj => "createTemplate" in obj, get: obj => obj.createTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateTemplate_decorators, { kind: "method", name: "updateTemplate", static: false, private: false, access: { has: obj => "updateTemplate" in obj, get: obj => obj.updateTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cloneTemplate_decorators, { kind: "method", name: "cloneTemplate", static: false, private: false, access: { has: obj => "cloneTemplate" in obj, get: obj => obj.cloneTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _enrollClient_decorators, { kind: "method", name: "enrollClient", static: false, private: false, access: { has: obj => "enrollClient" in obj, get: obj => obj.enrollClient }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getClientProgress_decorators, { kind: "method", name: "getClientProgress", static: false, private: false, access: { has: obj => "getClientProgress" in obj, get: obj => obj.getClientProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _completeLesson_decorators, { kind: "method", name: "completeLesson", static: false, private: false, access: { has: obj => "completeLesson" in obj, get: obj => obj.completeLesson }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCurriculum_decorators, { kind: "method", name: "getCurriculum", static: false, private: false, access: { has: obj => "getCurriculum" in obj, get: obj => obj.getCurriculum }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateCertificate_decorators, { kind: "method", name: "generateCertificate", static: false, private: false, access: { has: obj => "generateCertificate" in obj, get: obj => obj.generateCertificate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProgramStatistics_decorators, { kind: "method", name: "getProgramStatistics", static: false, private: false, access: { has: obj => "getProgramStatistics" in obj, get: obj => obj.getProgramStatistics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _searchPrograms_decorators, { kind: "method", name: "searchPrograms", static: false, private: false, access: { has: obj => "searchPrograms" in obj, get: obj => obj.searchPrograms }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProgramsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProgramsController = _classThis;
})();
exports.ProgramsController = ProgramsController;
