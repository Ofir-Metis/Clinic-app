/**
 * GoalCategory Entity - Categorization system for organizing client goals
 * Provides structure and templates for different types of self-development goals
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { ClientGoal, GoalType, MeasurementType } from './client-goal.entity';

export interface CategoryTemplate {
  defaultTitle: string;
  descriptionTemplate: string;
  suggestedMeasurementType: MeasurementType;
  defaultDuration: number; // days
  commonMilestones: string[];
  successCriteria: string[];
  typicalObstacles: string[];
  recommendedStrategies: string[];
  motivationalQuotes: string[];
}

export interface CategorySettings {
  color: string;
  icon: string;
  isDefault: boolean;
  sortOrder: number;
  visibleToClients: boolean;
  requiresCoachApproval: boolean;
  allowsCustomMetrics: boolean;
}

@Entity('goal_categories')
@Index(['userId', 'goalType'])
@Index(['isSystemDefault'])
export class GoalCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['habit', 'achievement', 'learning', 'wellness', 'relationship', 'career', 'financial', 'creative', 'spiritual', 'other'],
    name: 'goal_type'
  })
  goalType: GoalType;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId?: string; // null for system defaults

  @Column({ name: 'is_system_default', type: 'boolean', default: false })
  @Index()
  isSystemDefault: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', name: 'category_template' })
  template: CategoryTemplate;

  @Column({ type: 'jsonb', name: 'category_settings' })
  settings: CategorySettings;

  @Column({ type: 'text', array: true, name: 'tags', default: '{}' })
  tags: string[];

  @Column({ name: 'usage_count', type: 'integer', default: 0 })
  usageCount: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => ClientGoal, goal => goal.category)
  goals: ClientGoal[];

  // Methods
  incrementUsage(): void {
    this.usageCount += 1;
  }

  generateGoalFromTemplate(customizations?: {
    title?: string;
    description?: string;
    targetDate?: Date;
    customMilestones?: string[];
  }): Partial<ClientGoal> {
    const goalData: any = {
      title: customizations?.title || this.template.defaultTitle,
      description: customizations?.description || this.template.descriptionTemplate,
      type: this.goalType,
      measurementType: this.template.suggestedMeasurement

,
      categoryId: this.id,
      successCriteria: this.template.successCriteria.join('\n'),
      obstacles: this.template.typicalObstacles,
      strategies: this.template.recommendedStrategies,
      startDate: new Date(),
      targetDate: customizations?.targetDate || this.calculateDefaultTargetDate(),
      progressMetrics: {
        currentValue: 0,
        targetValue: this.template.suggestedMeasurementType === 'percentage' ? 100 : undefined,
        completionPercentage: 0,
        streak: 0,
        bestStreak: 0,
        totalSessions: 0,
        lastUpdated: new Date()
      },
      settings: {
        reminderEnabled: true,
        reminderFrequency: 'daily',
        shareWithCoach: true,
        allowCoachEdits: true,
        visibilityLevel: 'coach-only',
        celebrationEnabled: true,
        motivationalQuotes: true
      }
    };

    return goalData;
  }

  private calculateDefaultTargetDate(): Date {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + this.template.defaultDuration);
    return targetDate;
  }

  generateDefaultMilestones(goalId: string): Array<{
    title: string;
    description: string;
    progressThreshold: number;
    milestoneType: string;
  }> {
    return this.template.commonMilestones.map((milestone, index) => ({
      title: milestone,
      description: `${milestone} - milestone ${index + 1}`,
      progressThreshold: ((index + 1) / this.template.commonMilestones.length) * 100,
      milestoneType: 'checkpoint'
    }));
  }

  getMotivationalQuote(): string {
    const quotes = this.template.motivationalQuotes;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  isAvailableForUser(userId: string, userRole: 'client' | 'coach'): boolean {
    if (this.isSystemDefault) return true;
    if (this.userId === userId) return true;
    if (userRole === 'coach' && this.settings.visibleToClients) return true;
    return false;
  }

  static getSystemDefaultCategories(): GoalCategory[] {
    return [
      GoalCategory.createSystemDefault({
        name: 'Healthy Habits',
        goalType: 'habit',
        description: 'Build sustainable daily habits for better health and wellness',
        template: {
          defaultTitle: 'Build a Healthy Daily Habit',
          descriptionTemplate: 'I want to consistently practice [habit] every day to improve my [area of life]',
          suggestedMeasurementType: 'frequency',
          defaultDuration: 66, // habit formation research suggests 66 days
          commonMilestones: [
            'Complete first week consistently',
            'Reach 21-day streak',
            'Complete first month',
            'Reach 66-day habit formation threshold'
          ],
          successCriteria: [
            'Complete habit for 7 consecutive days',
            'Track habit daily for one month',
            'Identify and overcome at least 3 obstacles',
            'Feel the habit becoming automatic'
          ],
          typicalObstacles: [
            'Forgetting to do the habit',
            'Lack of time',
            'Low motivation on difficult days',
            'Perfectionism',
            'Life disruptions'
          ],
          recommendedStrategies: [
            'Stack habit with existing routine',
            'Start very small (2-minute rule)',
            'Use visual reminders',
            'Track daily progress',
            'Plan for obstacles in advance'
          ],
          motivationalQuotes: [
            'We are what we repeatedly do. Excellence, then, is not an act, but a habit. - Aristotle',
            'Success is the sum of small efforts, repeated day in and day out. - Robert Collier',
            'The secret of getting ahead is getting started. - Mark Twain'
          ]
        },
        settings: {
          color: '#4CAF50',
          icon: 'habit',
          isDefault: true,
          sortOrder: 1,
          visibleToClients: true,
          requiresCoachApproval: false,
          allowsCustomMetrics: true
        }
      }),

      GoalCategory.createSystemDefault({
        name: 'Personal Growth',
        goalType: 'learning',
        description: 'Develop new skills and expand personal awareness',
        template: {
          defaultTitle: 'Develop New Personal Skill',
          descriptionTemplate: 'I want to learn [skill] to [benefit/outcome] within [timeframe]',
          suggestedMeasurementType: 'percentage',
          defaultDuration: 90,
          commonMilestones: [
            'Complete initial learning phase',
            'Practice skill independently',
            'Apply skill in real situation',
            'Teach skill to someone else'
          ],
          successCriteria: [
            'Complete structured learning program',
            'Practice skill for minimum hours weekly',
            'Demonstrate competency in real-world application',
            'Receive positive feedback from others'
          ],
          typicalObstacles: [
            'Information overwhelm',
            'Plateau in learning curve',
            'Lack of practice opportunities',
            'Self-doubt and imposter syndrome',
            'Time management challenges'
          ],
          recommendedStrategies: [
            'Break learning into small chunks',
            'Practice daily, even if briefly',
            'Find accountability partner',
            'Seek feedback regularly',
            'Apply learning immediately'
          ],
          motivationalQuotes: [
            'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice. - Brian Herbert',
            'Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi',
            'An investment in knowledge pays the best interest. - Benjamin Franklin'
          ]
        },
        settings: {
          color: '#2196F3',
          icon: 'school',
          isDefault: true,
          sortOrder: 2,
          visibleToClients: true,
          requiresCoachApproval: false,
          allowsCustomMetrics: true
        }
      }),

      GoalCategory.createSystemDefault({
        name: 'Wellness & Mindfulness',
        goalType: 'wellness',
        description: 'Improve mental, emotional, and physical wellbeing',
        template: {
          defaultTitle: 'Enhance Personal Wellness',
          descriptionTemplate: 'I want to improve my [wellness area] by [specific practice] to feel [desired outcome]',
          suggestedMeasurementType: 'numeric',
          defaultDuration: 60,
          commonMilestones: [
            'Establish consistent practice',
            'Notice first improvements',
            'Overcome initial resistance',
            'Experience significant benefits'
          ],
          successCriteria: [
            'Practice wellness activity consistently',
            'Track mood and energy improvements',
            'Develop sustainable routine',
            'Feel measurable improvement in wellbeing'
          ],
          typicalObstacles: [
            'Busy schedule',
            'Initial discomfort',
            'Slow visible progress',
            'Self-criticism',
            'External stressors'
          ],
          recommendedStrategies: [
            'Start with 5-10 minutes daily',
            'Use guided resources initially',
            'Track subjective improvements',
            'Practice self-compassion',
            'Create supportive environment'
          ],
          motivationalQuotes: [
            'Take care of your body. It\'s the only place you have to live. - Jim Rohn',
            'Wellness is not a \'medical fix\' but a way of living. - Greg Anderson',
            'The greatest wealth is health. - Virgil'
          ]
        },
        settings: {
          color: '#9C27B0',
          icon: 'spa',
          isDefault: true,
          sortOrder: 3,
          visibleToClients: true,
          requiresCoachApproval: false,
          allowsCustomMetrics: true
        }
      })
    ];
  }

  private static createSystemDefault(data: {
    name: string;
    goalType: GoalType;
    description: string;
    template: CategoryTemplate;
    settings: CategorySettings;
  }): GoalCategory {
    const category = new GoalCategory();
    category.name = data.name;
    category.goalType = data.goalType;
    category.description = data.description;
    category.template = data.template;
    category.settings = data.settings;
    category.isSystemDefault = true;
    category.isActive = true;
    category.tags = [];
    category.usageCount = 0;
    category.createdBy = 'system';
    return category;
  }
}