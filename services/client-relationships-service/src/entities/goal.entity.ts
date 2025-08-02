/**
 * Goal Entity - Individual goals for clients
 * Can be private or shared with coaches through SharedGoal relationships
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Client } from './client.entity';
import { SharedGoal } from './shared-goal.entity';

export enum GoalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export enum GoalCategory {
  CAREER = 'career',
  HEALTH = 'health',
  RELATIONSHIPS = 'relationships',
  FINANCIAL = 'financial',
  PERSONAL_GROWTH = 'personal_growth',
  EDUCATION = 'education',
  LIFESTYLE = 'lifestyle',
  SPIRITUAL = 'spiritual',
  CREATIVE = 'creative',
  OTHER = 'other'
}

export enum GoalPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4
}

@Entity('goals')
@Index(['clientId', 'status'])
@Index(['category'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ length: 200 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalCategory,
    default: GoalCategory.PERSONAL_GROWTH
  })
  category: GoalCategory;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.DRAFT
  })
  status: GoalStatus;

  @Column({
    type: 'enum',
    enum: GoalPriority,
    default: GoalPriority.MEDIUM
  })
  priority: GoalPriority;

  // SMART Goal Framework
  @Column({ type: 'boolean', default: false, name: 'is_specific' })
  isSpecific: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_measurable' })
  isMeasurable: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_achievable' })
  isAchievable: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_relevant' })
  isRelevant: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_time_bound' })
  isTimeBound: boolean;

  // Goal Details
  @Column({ type: 'date', nullable: true, name: 'target_date' })
  targetDate: Date;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true, name: 'completion_date' })
  completionDate: Date;

  @Column('jsonb', { nullable: true })
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    completedDate?: Date;
    isCompleted: boolean;
  }>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number; // 0-100 percentage

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Client, (client) => client.goals, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => SharedGoal, (sharedGoal) => sharedGoal.goal, {
    cascade: true
  })
  sharedGoals: SharedGoal[];

  // Helper methods
  isActive(): boolean {
    return this.status === GoalStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === GoalStatus.COMPLETED;
  }

  isOverdue(): boolean {
    if (!this.targetDate || this.isCompleted()) return false;
    return new Date() > this.targetDate;
  }

  isSMART(): boolean {
    return this.isSpecific && this.isMeasurable && this.isAchievable && this.isRelevant && this.isTimeBound;
  }
}