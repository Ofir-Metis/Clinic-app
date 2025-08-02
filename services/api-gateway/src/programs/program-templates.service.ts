/**
 * ProgramTemplatesService - Manages coaching program templates and curriculum
 * Handles program creation, lesson management, progress tracking, and customization
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProgramModule {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedDuration: string; // e.g., "2 weeks", "1 month"
  lessons: ProgramLesson[];
  objectives: string[];
  prerequisites?: string[];
  assessments: ProgramAssessment[];
  resources: ProgramResource[];
  isRequired: boolean;
}

export interface ProgramLesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'reading' | 'exercise' | 'worksheet' | 'discussion' | 'practice';
  content: string | LessonContent;
  duration: number; // minutes
  order: number;
  objectives: string[];
  materials: string[];
  homework?: string;
  reflection?: string[];
  isRequired: boolean;
}

export interface LessonContent {
  text?: string;
  videoUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
  worksheetUrl?: string;
  exercises?: Exercise[];
  discussion?: DiscussionPrompt[];
}

export interface Exercise {
  id: string;
  title: string;
  instructions: string;
  type: 'reflection' | 'goal-setting' | 'action-plan' | 'assessment' | 'practice';
  timeRequired: number;
  materials?: string[];
  template?: string;
}

export interface DiscussionPrompt {
  id: string;
  question: string;
  type: 'open' | 'reflection' | 'goal-related' | 'feedback';
  followUp?: string[];
}

export interface ProgramAssessment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'reflection' | 'goal-review' | 'progress-check' | 'final-evaluation';
  questions: AssessmentQuestion[];
  passingScore?: number;
  retakesAllowed: number;
  timeLimit?: number; // minutes
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'scale' | 'checklist';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  explanation?: string;
}

export interface ProgramResource {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'audio' | 'link' | 'tool' | 'template';
  url: string;
  category: 'reference' | 'worksheet' | 'tool' | 'bonus' | 'external';
  downloadable: boolean;
}

export interface ProgramTemplate {
  id: string;
  title: string;
  description: string;
  category: 'life-coaching' | 'career' | 'wellness' | 'relationships' | 'leadership' | 'personal-growth';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string; // e.g., "8 weeks", "3 months"
  totalSessions: number;
  sessionLength: number; // minutes
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  modules: ProgramModule[];
  targetAudience: string[];
  prerequisites: string[];
  outcomes: string[];
  certificationAvailable: boolean;
  tags: string[];
  rating: number;
  enrollmentCount: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProgramProgress {
  clientId: string;
  programId: string;
  coachId: string;
  enrolledAt: Date;
  startedAt?: Date;
  expectedCompletionDate: Date;
  actualCompletionDate?: Date;
  status: 'enrolled' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  currentModule: number;
  currentLesson: number;
  completedLessons: string[];
  completedAssessments: string[];
  overallProgress: number; // percentage
  lastActivity: Date;
  notes: string;
  customizations: ProgramCustomization[];
}

export interface ProgramCustomization {
  type: 'module-order' | 'lesson-modification' | 'additional-content' | 'schedule-adjustment';
  description: string;
  appliedBy: string;
  appliedAt: Date;
  data: any;
}

@Injectable()
export class ProgramTemplatesService {
  private readonly logger = new Logger(ProgramTemplatesService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Get all available program templates
   */
  async getAllTemplates(filters?: {
    category?: string;
    difficulty?: string;
    minRating?: number;
  }): Promise<ProgramTemplate[]> {
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
    } catch (error) {
      this.logger.error('Failed to get program templates:', error);
      throw new Error(`Failed to get templates: ${error.message}`);
    }
  }

  /**
   * Get a specific program template by ID
   */
  async getTemplate(templateId: string): Promise<ProgramTemplate | null> {
    try {
      const templates = this.getDefaultTemplates();
      const template = templates.find(t => t.id === templateId);

      if (template) {
        this.logger.log(`📖 Retrieved template: ${template.title}`);
      }

      return template || null;
    } catch (error) {
      this.logger.error(`Failed to get template ${templateId}:`, error);
      throw new Error(`Failed to get template: ${error.message}`);
    }
  }

  /**
   * Create a new program template
   */
  async createTemplate(templateData: Omit<ProgramTemplate, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'enrollmentCount'>): Promise<ProgramTemplate> {
    try {
      const newTemplate: ProgramTemplate = {
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
    } catch (error) {
      this.logger.error('Failed to create template:', error);
      throw new Error(`Template creation failed: ${error.message}`);
    }
  }

  /**
   * Update an existing program template
   */
  async updateTemplate(templateId: string, updates: Partial<ProgramTemplate>): Promise<ProgramTemplate> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const updatedTemplate: ProgramTemplate = {
        ...template,
        ...updates,
        updatedAt: new Date(),
      };

      this.logger.log(`📝 Updated template: ${updatedTemplate.title}`);
      return updatedTemplate;
    } catch (error) {
      this.logger.error(`Failed to update template ${templateId}:`, error);
      throw new Error(`Template update failed: ${error.message}`);
    }
  }

  /**
   * Clone a program template
   */
  async cloneTemplate(templateId: string, newTitle: string, customizations?: Partial<ProgramTemplate>): Promise<ProgramTemplate> {
    try {
      const originalTemplate = await this.getTemplate(templateId);
      if (!originalTemplate) {
        throw new Error('Original template not found');
      }

      const clonedTemplate: ProgramTemplate = {
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
    } catch (error) {
      this.logger.error(`Failed to clone template ${templateId}:`, error);
      throw new Error(`Template cloning failed: ${error.message}`);
    }
  }

  /**
   * Get client's program progress
   */
  async getClientProgress(clientId: string, programId: string): Promise<ClientProgramProgress | null> {
    try {
      // In a real implementation, fetch from database
      // For now, return mock progress
      const mockProgress: ClientProgramProgress = {
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
    } catch (error) {
      this.logger.error(`Failed to get progress for client ${clientId}:`, error);
      return null;
    }
  }

  /**
   * Enroll client in a program
   */
  async enrollClient(clientId: string, programId: string, coachId: string): Promise<ClientProgramProgress> {
    try {
      const template = await this.getTemplate(programId);
      if (!template) {
        throw new Error('Program template not found');
      }

      const enrollment: ClientProgramProgress = {
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
    } catch (error) {
      this.logger.error(`Failed to enroll client ${clientId}:`, error);
      throw new Error(`Enrollment failed: ${error.message}`);
    }
  }

  /**
   * Mark lesson as completed
   */
  async completeLesson(clientId: string, programId: string, lessonId: string): Promise<ClientProgramProgress> {
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
    } catch (error) {
      this.logger.error(`Failed to complete lesson ${lessonId}:`, error);
      throw new Error(`Lesson completion failed: ${error.message}`);
    }
  }

  /**
   * Get program curriculum outline
   */
  async getCurriculumOutline(programId: string): Promise<any> {
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
    } catch (error) {
      this.logger.error(`Failed to get curriculum outline for ${programId}:`, error);
      throw new Error(`Failed to get curriculum outline: ${error.message}`);
    }
  }

  /**
   * Generate program completion certificate
   */
  async generateCertificate(clientId: string, programId: string): Promise<any> {
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
        totalHours: template.modules.reduce((sum, module) => 
          sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.duration, 0), 0
        ) / 60, // Convert minutes to hours
        grade: this.calculateFinalGrade(progress),
        issuedBy: 'Life Coaching Institute',
        verificationCode: this.generateVerificationCode(),
        pdfUrl: `/certificates/${certificateId}.pdf`, // Mock URL
      };

      this.logger.log(`🏆 Generated certificate for client ${clientId}: ${certificate.certificateId}`);
      return certificate;
    } catch (error) {
      this.logger.error(`Failed to generate certificate:`, error);
      throw new Error(`Certificate generation failed: ${error.message}`);
    }
  }

  // Private helper methods

  private getDefaultTemplates(): ProgramTemplate[] {
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

  private getLifeBalanceModules(): ProgramModule[] {
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

  private getCareerTransitionModules(): ProgramModule[] {
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

  private getStressResilienceModules(): ProgramModule[] {
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

  private parseDuration(duration: string): number {
    // Convert duration string to milliseconds
    const match = duration.match(/(\d+)\s*(week|month|day)s?/i);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // Default 30 days

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

  private calculateFinalGrade(progress: ClientProgramProgress): string {
    // Mock grade calculation based on completion and assessment scores
    if (progress.overallProgress === 100) {
      return 'A'; // Excellent
    } else if (progress.overallProgress >= 85) {
      return 'B+'; // Very Good
    } else if (progress.overallProgress >= 70) {
      return 'B'; // Good
    } else {
      return 'C'; // Satisfactory
    }
  }

  private generateVerificationCode(): string {
    return `VER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}