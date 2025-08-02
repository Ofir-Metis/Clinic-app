/**
 * ProgressEntry Entity - Individual progress updates for client goals
 * Tracks daily/regular updates on goal progress with rich metadata
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

export type EntryType = 'progress' | 'setback' | 'milestone' | 'reflection' | 'coaching-note';
export type MoodRating = 1 | 2 | 3 | 4 | 5;
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

export interface EntryMetadata {
  mood?: MoodRating;
  confidence?: ConfidenceLevel;
  effortLevel?: number; // 1-10 scale
  difficultyEncountered?: number; // 1-10 scale
  externalFactors?: string[];
  energyLevel?: number; // 1-10 scale
  timeSpent?: number; // minutes
  location?: string;
  companions?: string[]; // who was involved/supportive
  weatherCondition?: string;
  toolsUsed?: string[];
}

export interface ProgressData {
  value?: number;
  unit?: string;
  deltaFromPrevious?: number;
  percentageComplete?: number;
  streakContinued?: boolean;
  qualityScore?: number; // 1-10 rating of quality of progress
  attachments?: {
    type: 'image' | 'document' | 'audio' | 'video';
    url: string;
    filename: string;
    size: number;
  }[];
}

@Entity('progress_entries')
@Index(['goalId', 'entryDate'])
@Index(['createdBy'])
@Index(['entryType'])
export class ProgressEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  @Index()
  goalId: string;

  @Column({
    type: 'enum',
    enum: ['progress', 'setback', 'milestone', 'reflection', 'coaching-note'],
    default: 'progress'
  })
  entryType: EntryType;

  @Column({ name: 'entry_date', type: 'date' })
  @Index()
  entryDate: Date;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'jsonb', name: 'progress_data' })
  progressData: ProgressData;

  @Column({ type: 'jsonb', name: 'entry_metadata' })
  metadata: EntryMetadata;

  @Column({ type: 'text', array: true, name: 'achievements', default: '{}' })
  achievements: string[];

  @Column({ type: 'text', array: true, name: 'challenges', default: '{}' })
  challenges: string[];

  @Column({ type: 'text', array: true, name: 'lessons_learned', default: '{}' })
  lessonsLearned: string[];

  @Column({ type: 'text', array: true, name: 'next_actions', default: '{}' })
  nextActions: string[];

  @Column({ name: 'is_significant', type: 'boolean', default: false })
  isSignificant: boolean;

  @Column({ name: 'coach_reviewed', type: 'boolean', default: false })
  coachReviewed: boolean;

  @Column({ name: 'coach_feedback', type: 'text', nullable: true })
  coachFeedback?: string;

  @Column({ name: 'coach_rating', type: 'integer', nullable: true })
  coachRating?: number; // 1-5 rating from coach

  @Column({ name: 'shared_with_coach', type: 'boolean', default: true })
  sharedWithCoach: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ClientGoal, goal => goal.progressEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: ClientGoal;

  // Methods
  calculateProgressImpact(): number {
    // Calculate how much this entry contributed to overall goal progress
    const baseImpact = this.progressData.value || 0;
    const qualityMultiplier = (this.progressData.qualityScore || 5) / 5;
    const effortMultiplier = (this.metadata.effortLevel || 5) / 5;
    
    return baseImpact * qualityMultiplier * effortMultiplier;
  }

  getMotivationalInsight(): string {
    const mood = this.metadata.mood || 3;
    const confidence = this.metadata.confidence || 3;
    const effort = this.metadata.effortLevel || 5;

    if (mood >= 4 && confidence >= 4 && effort >= 7) {
      return "Amazing energy and commitment! You're in the zone! 🔥";
    }
    
    if (mood <= 2 && confidence <= 2) {
      return "Tough day, but you still showed up. That's what counts! 🌟";
    }
    
    if (effort >= 8) {
      return "Your dedication is inspiring! Hard work pays off! 💪";
    }
    
    if (this.progressData.streakContinued) {
      return "Consistency is key! Your streak is building momentum! 🚀";
    }
    
    return "Every step forward is progress. Keep going! 🌱";
  }

  identifyPatterns(): {
    bestTimeOfDay?: string;
    optimalMoodRange?: string;
    mostEffectiveStrategies?: string[];
    commonObstacles?: string[];
  } {
    // This would be implemented with historical data analysis
    // For now, return basic insights from current entry
    const insights: any = {};
    
    if (this.metadata.effortLevel && this.metadata.effortLevel >= 8) {
      insights.mostEffectiveStrategies = this.nextActions;
    }
    
    if (this.challenges.length > 0) {
      insights.commonObstacles = this.challenges;
    }
    
    return insights;
  }

  shouldNotifyCoach(): boolean {
    return (
      this.isSignificant ||
      this.entryType === 'setback' ||
      this.entryType === 'milestone' ||
      (this.metadata.mood && this.metadata.mood <= 2) ||
      (this.metadata.confidence && this.metadata.confidence <= 2) ||
      this.challenges.length >= 3
    );
  }

  generateCoachingPrompts(): string[] {
    const prompts: string[] = [];
    
    if (this.metadata.mood && this.metadata.mood <= 2) {
      prompts.push("What support do you need to boost your motivation?");
    }
    
    if (this.metadata.confidence && this.metadata.confidence <= 2) {
      prompts.push("What would help you feel more confident about this goal?");
    }
    
    if (this.challenges.length > 0) {
      prompts.push("Which challenge feels most manageable to tackle first?");
    }
    
    if (this.achievements.length > 0) {
      prompts.push("How can you build on today's success?");
    }
    
    if (this.progressData.streakContinued) {
      prompts.push("What's helping you maintain this positive momentum?");
    }
    
    return prompts;
  }

  canBeEditedBy(userId: string): boolean {
    return this.createdBy === userId;
  }

  canBeViewedBy(userId: string, userRole: 'client' | 'coach'): boolean {
    if (this.createdBy === userId) return true;
    if (userRole === 'coach' && this.sharedWithCoach) return true;
    return false;
  }

  getEmotionalTrend(): 'improving' | 'stable' | 'declining' | 'unknown' {
    // This would compare with recent entries to determine trend
    // For single entry, return based on current mood/confidence
    const mood = this.metadata.mood || 3;
    const confidence = this.metadata.confidence || 3;
    const average = (mood + confidence) / 2;
    
    if (average >= 4) return 'improving';
    if (average <= 2) return 'declining';
    return 'stable';
  }
}