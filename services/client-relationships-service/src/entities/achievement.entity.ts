/**
 * Achievement Entity - Tracks client achievements and milestones
 * Can be tied to specific goals and coaching relationships
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Client } from './client.entity';

export enum AchievementType {
  GOAL_COMPLETION = 'goal_completion',
  MILESTONE = 'milestone',
  STREAK = 'streak',
  BREAKTHROUGH = 'breakthrough',
  SKILL_DEVELOPMENT = 'skill_development',
  HABIT_FORMATION = 'habit_formation',
  PERSONAL_BEST = 'personal_best',
  CHALLENGE_COMPLETION = 'challenge_completion',
  RECOGNITION = 'recognition',
  OTHER = 'other'
}

export enum AchievementCategory {
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

@Entity('achievements')
@Index(['clientId', 'achievedDate'])
@Index(['type', 'category'])
export class Achievement {
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
    enum: AchievementType,
    default: AchievementType.OTHER
  })
  type: AchievementType;

  @Column({
    type: 'enum',
    enum: AchievementCategory,
    default: AchievementCategory.PERSONAL_GROWTH
  })
  category: AchievementCategory;

  @Column({ type: 'timestamp', name: 'achieved_date' })
  achievedDate: Date;

  @Column({ length: 50, nullable: true })
  icon: string; // Emoji or icon identifier

  @Column({ name: 'goal_id', type: 'uuid', nullable: true })
  goalId: string; // Associated goal if applicable

  @Column({ name: 'coach_id', type: 'uuid', nullable: true })
  coachId: string; // Coach who helped achieve this

  @Column({ type: 'integer', nullable: true })
  points: number; // Gamification points

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Client, (client) => client.achievements, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;
}