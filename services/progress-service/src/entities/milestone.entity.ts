/**
 * Milestone Entity - Key achievements and checkpoints in client goals
 * Represents significant progress markers with celebration and reflection
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
import { ClientGoal } from './client-goal.entity';

export type MilestoneType = 'checkpoint' | 'achievement' | 'breakthrough' | 'habit-formed' | 'challenge-overcome' | 'custom';
export type CelebrationStyle = 'private' | 'coach-shared' | 'community-shared' | 'family-shared';

export interface RewardSettings {
  enabled: boolean;
  rewardType: 'self-treat' | 'experience' | 'purchase' | 'break' | 'celebration' | 'custom';
  description?: string;
  estimatedCost?: number;
  plannedDate?: Date;
  completedDate?: Date;
  notes?: string;
}

export interface CelebrationData {
  style: CelebrationStyle;
  message?: string;
  shareWithCoach: boolean;
  shareWithFamily: boolean;
  documentsShared?: string[]; // photo/video IDs
  gratitudeMentions?: string[]; // people to thank
  lessonsToShare?: string[];
}

@Entity('milestones')
@Index(['goalId', 'targetDate'])
@Index(['createdBy'])
@Index(['milestoneType'])
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  @Index()
  goalId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['checkpoint', 'achievement', 'breakthrough', 'habit-formed', 'challenge-overcome', 'custom'],
    default: 'checkpoint'
  })
  milestoneType: MilestoneType;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate?: Date;

  @Column({ name: 'achieved_date', type: 'date', nullable: true })
  achievedDate?: Date;

  @Column({ name: 'progress_threshold', type: 'decimal', precision: 5, scale: 2 })
  progressThreshold: number; // percentage of goal completion (0-100)

  @Column({ name: 'is_achieved', type: 'boolean', default: false })
  isAchieved: boolean;

  @Column({ name: 'is_significant', type: 'boolean', default: false })
  isSignificant: boolean;

  @Column({ type: 'jsonb', name: 'reward_settings' })
  rewardSettings: RewardSettings;

  @Column({ type: 'jsonb', name: 'celebration_data', nullable: true })
  celebrationData?: CelebrationData;

  @Column({ type: 'text', array: true, name: 'success_criteria', default: '{}' })
  successCriteria: string[];

  @Column({ type: 'text', array: true, name: 'evidence_collected', default: '{}' })
  evidenceCollected: string[];

  @Column({ type: 'text', name: 'reflection_notes', nullable: true })
  reflectionNotes?: string;

  @Column({ type: 'text', name: 'coach_feedback', nullable: true })
  coachFeedback?: string;

  @Column({ name: 'coach_rating', type: 'integer', nullable: true })
  coachRating?: number; // 1-5 rating from coach

  @Column({ name: 'celebration_completed', type: 'boolean', default: false })
  celebrationCompleted: boolean;

  @Column({ name: 'reward_claimed', type: 'boolean', default: false })
  rewardClaimed: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ClientGoal, goal => goal.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: ClientGoal;

  // Methods
  checkAchievement(currentProgress: number): boolean {
    if (this.isAchieved) return true;
    
    if (currentProgress >= this.progressThreshold) {
      this.markAsAchieved();
      return true;
    }
    
    return false;
  }

  markAsAchieved(): void {
    this.isAchieved = true;
    this.achievedDate = new Date();
  }

  isOverdue(): boolean {
    if (!this.targetDate || this.isAchieved) return false;
    return new Date() > this.targetDate;
  }

  getDaysUntilTarget(): number | null {
    if (!this.targetDate || this.isAchieved) return null;
    const now = new Date();
    const diffTime = this.targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysSinceAchieved(): number | null {
    if (!this.achievedDate) return null;
    const now = new Date();
    const diffTime = now.getTime() - this.achievedDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  generateCelebrationMessage(): string {
    const messages = {
      checkpoint: "Checkpoint reached! You're making steady progress! 🎯",
      achievement: "Amazing achievement unlocked! You did it! 🏆",
      breakthrough: "What a breakthrough moment! This is huge! ⚡",
      'habit-formed': "New habit formed! You've built something lasting! 🌟",
      'challenge-overcome': "Challenge conquered! Your resilience is inspiring! 💪",
      custom: "Milestone achieved! Every step forward counts! 🌱"
    };
    
    return messages[this.milestoneType] || messages.custom;
  }

  getSuggestedRewards(): string[] {
    const rewardsByType = {
      checkpoint: [
        "Take a relaxing bath",
        "Watch your favorite movie",
        "Buy yourself a small treat",
        "Take a walk in nature"
      ],
      achievement: [
        "Plan a special dinner",
        "Buy something you've wanted",
        "Take a day trip",
        "Share the news with someone special"
      ],
      breakthrough: [
        "Celebrate with friends/family",
        "Plan a weekend getaway",
        "Treat yourself to something meaningful",
        "Create a memory book or photo album"
      ],
      'habit-formed': [
        "Upgrade your equipment/tools",
        "Join a related community or class",
        "Set a new related goal",
        "Teach someone else what you've learned"
      ],
      'challenge-overcome': [
        "Acknowledge your strength publicly",
        "Write about your journey",
        "Help someone facing similar challenges",
        "Celebrate your resilience"
      ]
    };
    
    return rewardsByType[this.milestoneType] || rewardsByType.checkpoint;
  }

  createCelebrationPlan(style: CelebrationStyle): CelebrationData {
    const celebrationData: CelebrationData = {
      style,
      shareWithCoach: style !== 'private',
      shareWithFamily: style === 'family-shared',
      message: this.generateCelebrationMessage()
    };

    return celebrationData;
  }

  getMotivationalQuote(): string {
    const quotes = [
      "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
      "The journey of a thousand miles begins with one step. - Lao Tzu",
      "Progress, not perfection, is the goal. - Unknown",
      "Every accomplishment starts with the decision to try. - John F. Kennedy",
      "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
      "The only impossible journey is the one you never begin. - Tony Robbins",
      "Believe you can and you're halfway there. - Theodore Roosevelt",
      "Your limitation—it's only your imagination. - Unknown"
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  shouldNotifyCoach(): boolean {
    return this.isSignificant || this.milestoneType === 'breakthrough' || this.isOverdue();
  }

  canBeCelebrated(): boolean {
    return this.isAchieved && !this.celebrationCompleted;
  }

  canClaimReward(): boolean {
    return this.isAchieved && this.rewardSettings.enabled && !this.rewardClaimed;
  }

  getProgressTowardsNext(currentProgress: number): number {
    // Calculate how close we are to this milestone
    if (this.isAchieved) return 100;
    return Math.min(100, (currentProgress / this.progressThreshold) * 100);
  }
}