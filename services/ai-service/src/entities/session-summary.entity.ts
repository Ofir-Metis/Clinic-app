/**
 * SessionSummary Entity - Stores AI-generated coaching session summaries
 * Links to appointments and provides comprehensive session analysis
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type EmotionalTone = 'positive' | 'neutral' | 'challenging' | 'breakthrough';
export type ClientEngagement = 'high' | 'medium' | 'low';
export type SessionType = 'initial-consultation' | 'follow-up' | 'goal-setting' | 'progress-review' | 'breakthrough' | 'other';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'requires-review';

@Entity('session_summaries')
@Index(['appointmentId'])
@Index(['coachId'])
@Index(['createdAt'])
@Index(['processingStatus'])
export class SessionSummary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'appointment_id' })
  appointmentId!: string;

  @Column({ name: 'coach_id' })
  coachId!: string;

  @Column({ name: 'client_id' })
  clientId!: string;

  @Column({
    type: 'enum',
    enum: ['initial-consultation', 'follow-up', 'goal-setting', 'progress-review', 'breakthrough', 'other'],
    name: 'session_type'
  })
  sessionType!: SessionType;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'requires-review'],
    default: 'pending',
    name: 'processing_status'
  })
  processingStatus!: ProcessingStatus;

  // Core Summary Data
  @Column('text', { array: true, name: 'key_insights' })
  keyInsights!: string[];

  @Column('text', { array: true, name: 'progress_made' })
  progressMade!: string[];

  @Column('text', { array: true, name: 'challenges_discussed' })
  challengesDiscussed!: string[];

  @Column('text', { array: true, name: 'action_items' })
  actionItems!: string[];

  @Column('text', { name: 'next_session_focus' })
  nextSessionFocus!: string;

  @Column({
    type: 'enum',
    enum: ['positive', 'neutral', 'challenging', 'breakthrough'],
    name: 'emotional_tone'
  })
  emotionalTone!: EmotionalTone;

  @Column({
    type: 'enum',
    enum: ['high', 'medium', 'low'],
    name: 'client_engagement'
  })
  clientEngagement!: ClientEngagement;

  @Column('text', { array: true, name: 'coaching_techniques' })
  coachingTechniques!: string[];

  // Optional Fields
  @Column('text', { array: true, nullable: true, name: 'breakthrough_moments' })
  breakthroughMoments?: string[];

  @Column('text', { array: true, nullable: true })
  homework?: string[];

  @Column({ name: 'follow_up_required', default: false })
  followUpRequired!: boolean;

  @Column({ name: 'confidence_level', type: 'decimal', precision: 3, scale: 1 })
  confidenceLevel!: number;

  // Metadata
  @Column('text', { nullable: true, name: 'raw_transcript' })
  rawTranscript?: string;

  @Column({ name: 'transcript_length', nullable: true })
  transcriptLength?: number;

  @Column({ name: 'session_duration_minutes', nullable: true })
  sessionDurationMinutes?: number;

  @Column({ name: 'processing_time_ms', nullable: true })
  processingTimeMs?: number;

  @Column('text', { nullable: true, name: 'processing_error' })
  processingError?: string;

  @Column('jsonb', { nullable: true, name: 'ai_metadata' })
  aiMetadata?: {
    model: string;
    temperature: number;
    tokens_used: number;
    processing_version: string;
    custom_prompts?: string[];
  };

  // Coach Review
  @Column({ name: 'reviewed_by_coach', default: false })
  reviewedByCoach!: boolean;

  @Column('text', { nullable: true, name: 'coach_feedback' })
  coachFeedback?: string;

  @Column({ name: 'coach_rating', nullable: true })
  coachRating?: number; // 1-5 rating of summary accuracy

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt?: Date;

  // Client Access
  @Column({ name: 'shared_with_client', default: false })
  sharedWithClient!: boolean;

  @Column({ name: 'client_viewed', default: false })
  clientViewed!: boolean;

  @Column({ name: 'client_viewed_at', nullable: true })
  clientViewedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Computed Properties
  get isComplete(): boolean {
    return this.processingStatus === 'completed' && this.keyInsights?.length > 0;
  }

  get needsReview(): boolean {
    return this.processingStatus === 'requires-review' || 
           this.confidenceLevel < 7 || 
           this.processingError !== null;
  }

  get canShareWithClient(): boolean {
    return this.isComplete && this.reviewedByCoach;
  }

  // Helper Methods
  getProgressSummary(): string {
    if (!this.progressMade?.length) return 'No specific progress noted';
    return this.progressMade.slice(0, 2).join('; ') + (this.progressMade.length > 2 ? '...' : '');
  }

  getPrimaryInsight(): string {
    return this.keyInsights?.[0] || 'Session insights are being processed';
  }

  getActionItemsCount(): number {
    return this.actionItems?.length || 0;
  }

  getDurationText(): string {
    if (!this.sessionDurationMinutes) return 'Duration unknown';
    
    const hours = Math.floor(this.sessionDurationMinutes / 60);
    const minutes = this.sessionDurationMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Validation
  validateForSharing(): string[] {
    const errors: string[] = [];
    
    if (!this.isComplete) {
      errors.push('Summary processing is not complete');
    }
    
    if (!this.reviewedByCoach) {
      errors.push('Summary has not been reviewed by coach');
    }
    
    if (this.confidenceLevel < 6) {
      errors.push('Summary confidence level is too low for sharing');
    }
    
    if (!this.keyInsights?.length) {
      errors.push('No key insights available');
    }
    
    if (!this.actionItems?.length) {
      errors.push('No action items identified');
    }
    
    return errors;
  }
}