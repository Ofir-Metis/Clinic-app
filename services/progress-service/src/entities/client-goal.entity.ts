/**
 * ClientGoal Entity - Represents individual development goals for self-improvement
 * Supports various goal types for personal growth and life coaching
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { GoalCategory } from './goal-category.entity';
import { ProgressEntry } from './progress-entry.entity';
import { Milestone } from './milestone.entity';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled' | 'archived';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';
export type GoalType = 'habit' | 'achievement' | 'learning' | 'wellness' | 'relationship' | 'career' | 'financial' | 'creative' | 'spiritual' | 'other';
export type MeasurementType = 'numeric' | 'percentage' | 'boolean' | 'duration' | 'frequency' | 'custom';

export interface ProgressMetrics {
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  completionPercentage: number;
  streak?: number;
  bestStreak?: number;
  totalSessions?: number;
  averageProgress?: number;
  lastUpdated: Date;
}

export interface GoalSettings {
  reminderEnabled: boolean;
  reminderFrequency?: 'daily' | 'weekly' | 'monthly';
  reminderTime?: string;
  shareWithCoach: boolean;
  allowCoachEdits: boolean;
  visibilityLevel: 'private' | 'coach-only' | 'shared';
  celebrationEnabled: boolean;
  motivationalQuotes: boolean;
}

@Entity('client_goals')
@Index(['clientId', 'status'])
@Index(['coachId', 'status'])
@Index(['categoryId'])
export class ClientGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  @Index()
  clientId: string;

  @Column({ name: 'coach_id', type: 'uuid', nullable: true })
  @Index()
  coachId?: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['habit', 'achievement', 'learning', 'wellness', 'relationship', 'career', 'financial', 'creative', 'spiritual', 'other'],
    default: 'other'
  })
  type: GoalType;

  @Column({
    type: 'enum',
    enum: ['active', 'completed', 'paused', 'cancelled', 'archived'],
    default: 'active'
  })
  status: GoalStatus;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  })
  priority: GoalPriority;

  @Column({
    type: 'enum',
    enum: ['numeric', 'percentage', 'boolean', 'duration', 'frequency', 'custom'],
    default: 'boolean'
  })
  measurementType: MeasurementType;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate?: Date;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'completion_date', type: 'date', nullable: true })
  completionDate?: Date;

  @Column({ type: 'jsonb', name: 'progress_metrics' })
  progressMetrics: ProgressMetrics;

  @Column({ type: 'jsonb', name: 'goal_settings' })
  settings: GoalSettings;

  @Column({ type: 'text', array: true, name: 'tags', default: '{}' })
  tags: string[];

  @Column({ type: 'text', name: 'success_criteria', nullable: true })
  successCriteria?: string;

  @Column({ type: 'text', name: 'motivation_statement', nullable: true })
  motivationStatement?: string;

  @Column({ type: 'text', array: true, name: 'obstacles', default: '{}' })
  obstacles: string[];

  @Column({ type: 'text', array: true, name: 'strategies', default: '{}' })
  strategies: string[];

  @Column({ name: 'is_template', type: 'boolean', default: false })
  isTemplate: boolean;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => GoalCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: GoalCategory;

  @OneToMany(() => ProgressEntry, entry => entry.goal, { cascade: true })
  progressEntries: ProgressEntry[];

  @OneToMany(() => Milestone, milestone => milestone.goal, { cascade: true })
  milestones: Milestone[];

  // Methods
  updateProgress(value: number, notes?: string): void {
    const now = new Date();
    
    if (this.measurementType === 'percentage') {
      this.progressMetrics.completionPercentage = Math.min(100, Math.max(0, value));
    } else if (this.measurementType === 'numeric' && this.progressMetrics.targetValue) {
      this.progressMetrics.currentValue = value;
      this.progressMetrics.completionPercentage = 
        Math.min(100, (value / this.progressMetrics.targetValue) * 100);
    } else if (this.measurementType === 'boolean') {
      this.progressMetrics.completionPercentage = value > 0 ? 100 : 0;
    }

    this.progressMetrics.lastUpdated = now;

    // Auto-complete if target reached
    if (this.progressMetrics.completionPercentage >= 100 && this.status === 'active') {
      this.status = 'completed';
      this.completionDate = now;
    }
  }

  calculateStreak(): number {
    // This would be calculated based on progress entries
    // Implementation would query recent progress entries
    return this.progressMetrics.streak || 0;
  }

  isOverdue(): boolean {
    if (!this.targetDate || this.status !== 'active') return false;
    return new Date() > this.targetDate;
  }

  getDaysRemaining(): number | null {
    if (!this.targetDate || this.status !== 'active') return null;
    const now = new Date();
    const diffTime = this.targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getProgressVelocity(): number {
    // Calculate average progress per day since start
    const now = new Date();
    const daysActive = Math.max(1, Math.ceil((now.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    return this.progressMetrics.completionPercentage / daysActive;
  }

  predictCompletionDate(): Date | null {
    if (this.status !== 'active' || this.progressMetrics.completionPercentage >= 100) return null;
    
    const velocity = this.getProgressVelocity();
    if (velocity <= 0) return null;
    
    const remainingProgress = 100 - this.progressMetrics.completionPercentage;
    const daysToComplete = remainingProgress / velocity;
    
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.ceil(daysToComplete));
    return completionDate;
  }

  getMotivationalMessage(): string {
    const progress = this.progressMetrics.completionPercentage;
    
    if (progress >= 90) return "You're so close to achieving your goal! 🌟";
    if (progress >= 75) return "Fantastic progress! Keep pushing forward! 💪";
    if (progress >= 50) return "You're halfway there! Great momentum! 🚀";
    if (progress >= 25) return "Great start! Building momentum every day! 🌱";
    return "Every journey begins with a single step! 🌿";
  }

  canBeEditedBy(userId: string): boolean {
    return this.clientId === userId || 
           this.coachId === userId || 
           (this.settings.allowCoachEdits && this.coachId === userId);
  }

  isVisibleTo(userId: string, userRole: 'client' | 'coach'): boolean {
    if (this.clientId === userId) return true;
    if (this.coachId === userId) return true;
    
    if (userRole === 'coach' && this.settings.visibilityLevel !== 'private') return true;
    
    return this.settings.visibilityLevel === 'shared';
  }
}