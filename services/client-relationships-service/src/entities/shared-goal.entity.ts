/**
 * SharedGoal Entity - Goals that are shared between clients and specific coaches
 * Enables collaborative goal setting and tracking across multiple coaching relationships
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
import { ClientCoachRelationship } from './client-coach-relationship.entity';
import { Goal } from './goal.entity';

export enum SharedGoalStatus {
  DRAFT = 'draft',               // Goal is being created/edited
  PENDING_APPROVAL = 'pending_approval', // Waiting for client/coach approval
  ACTIVE = 'active',             // Currently being worked on
  COMPLETED = 'completed',       // Successfully achieved
  PAUSED = 'paused',            // Temporarily paused
  CANCELLED = 'cancelled'        // Cancelled by either party
}

export enum SharedGoalType {
  COLLABORATIVE = 'collaborative', // Both coach and client work together
  COACH_ASSIGNED = 'coach_assigned', // Coach assigns goal to client
  CLIENT_REQUESTED = 'client_requested', // Client requests coach guidance
  CROSS_COACH = 'cross_coach'    // Involves multiple coaches
}

export enum ApprovalStatus {
  NOT_REQUIRED = 'not_required',
  PENDING_CLIENT = 'pending_client',
  PENDING_COACH = 'pending_coach',
  PENDING_BOTH = 'pending_both',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('shared_goals')
@Index(['relationshipId', 'status'])
@Index(['goalId'])
export class SharedGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'relationship_id', type: 'uuid' })
  relationshipId: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @Column({
    type: 'enum',
    enum: SharedGoalStatus,
    default: SharedGoalStatus.DRAFT
  })
  status: SharedGoalStatus;

  @Column({
    type: 'enum',
    enum: SharedGoalType,
    default: SharedGoalType.COLLABORATIVE,
    name: 'goal_type'
  })
  goalType: SharedGoalType;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.NOT_REQUIRED,
    name: 'approval_status'
  })
  approvalStatus: ApprovalStatus;

  // Coach-specific guidance and context
  @Column('text', { nullable: true, name: 'coach_notes' })
  coachNotes: string; // Private notes from coach about this goal

  @Column('text', { nullable: true, name: 'coaching_strategy' })
  coachingStrategy: string; // How the coach plans to help with this goal

  @Column('jsonb', { nullable: true, name: 'coaching_resources' })
  coachingResources: {
    recommendedReading?: string[];
    exercises?: string[];
    tools?: string[];
    assessments?: string[];
    externalLinks?: string[];
  };

  // Collaboration settings
  @Column('jsonb', { nullable: true, name: 'collaboration_settings' })
  collaborationSettings: {
    clientCanModify: boolean;
    coachCanModify: boolean;
    requiresApprovalForChanges: boolean;
    allowProgressUpdates: boolean;
    shareProgressWithOtherCoaches: boolean;
    enableCommenting: boolean;
    notifyOnUpdates: boolean;
    visibilityLevel: 'private' | 'coach_only' | 'all_coaches';
  };

  // Coaching-specific tracking
  @Column('jsonb', { nullable: true, name: 'coaching_milestones' })
  coachingMilestones: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    completedDate?: Date;
    coachingApproach: string;
    successCriteria: string[];
    isCompleted: boolean;
    coachFeedback?: string;
    clientReflection?: string;
  }>;

  // Session integration
  @Column('jsonb', { nullable: true, name: 'session_history' })
  sessionHistory: Array<{
    sessionId: string;
    sessionDate: Date;
    discussionPoints: string[];
    progressMade: string;
    actionItems: string[];
    nextSteps: string[];
    coachObservations: string;
    clientFeedback: string;
  }>;

  // Assignment and ownership
  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy: string; // Coach who assigned this goal

  @Column({ type: 'timestamp', nullable: true, name: 'assigned_date' })
  assignedDate: Date;

  @Column({ name: 'accepted_by', type: 'uuid', nullable: true })
  acceptedBy: string; // Client who accepted the goal

  @Column({ type: 'timestamp', nullable: true, name: 'accepted_date' })
  acceptedDate: Date;

  // Priority and urgency (from coach's perspective)
  @Column({ type: 'integer', nullable: true, name: 'coach_priority' })
  coachPriority: number; // 1-10, coach's assessment of goal importance

  @Column({ type: 'boolean', default: false, name: 'is_urgent' })
  isUrgent: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_foundational' })
  isFoundational: boolean; // This goal is foundational to other goals

  @Column('jsonb', { nullable: true, name: 'prerequisite_goals' })
  prerequisiteGoals: string[]; // Goal IDs that should be completed first

  @Column('jsonb', { nullable: true, name: 'related_goals' })
  relatedGoals: string[]; // Related goal IDs

  // Progress and accountability
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'progress_percentage' })
  progressPercentage: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_progress_update' })
  lastProgressUpdate: Date;

  @Column({ name: 'last_updated_by', type: 'uuid', nullable: true })
  lastUpdatedBy: string;

  @Column('jsonb', { nullable: true, name: 'accountability_settings' })
  accountabilitySettings: {
    checkInFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    reminderEnabled: boolean;
    progressReportingRequired: boolean;
    coachCheckInRequired: boolean;
    autoProgressTracking: boolean;
    escalationRules?: {
      noProgressDays: number;
      notificationTargets: string[];
      escalationActions: string[];
    };
  };

  // Coaching methodology and approach
  @Column('jsonb', { nullable: true, name: 'coaching_approach' })
  coachingApproach: {
    methodology: string; // 'CBT', 'NLP', 'Solution-focused', etc.
    techniques: string[];
    style: 'directive' | 'non-directive' | 'collaborative' | 'challenging';
    frequency: 'every-session' | 'weekly' | 'bi-weekly' | 'monthly' | 'as-needed';
    duration: number; // Expected duration in weeks
    expectedOutcomes: string[];
  };

  // Feedback and evaluation
  @Column('jsonb', { nullable: true, name: 'feedback_history' })
  feedbackHistory: Array<{
    date: Date;
    fromCoach: boolean;
    feedback: string;
    rating?: number; // 1-5 star rating
    category: 'progress' | 'challenge' | 'success' | 'redirect' | 'celebration';
    actionItems?: string[];
    nextReviewDate?: Date;
  }>;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, name: 'coach_confidence_level' })
  coachConfidenceLevel: number; // Coach's confidence in client achieving this goal

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, name: 'client_confidence_level' })
  clientConfidenceLevel: number; // Client's confidence in achieving this goal

  // Completion and outcomes
  @Column({ type: 'timestamp', nullable: true, name: 'target_completion_date' })
  targetCompletionDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_completion_date' })
  actualCompletionDate: Date;

  @Column('text', { nullable: true, name: 'completion_notes' })
  completionNotes: string;

  @Column('jsonb', { nullable: true, name: 'success_metrics' })
  successMetrics: {
    quantitative?: Array<{
      metric: string;
      target: number;
      achieved?: number;
      unit: string;
    }>;
    qualitative?: Array<{
      criterion: string;
      achieved: boolean;
      notes?: string;
    }>;
    overall_success_rating?: number; // 1-10
    lessons_learned?: string[];
    next_steps?: string[];
  };

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => ClientCoachRelationship, (relationship) => relationship.sharedGoals, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'relationship_id' })
  relationship: ClientCoachRelationship;

  @ManyToOne(() => Goal, (goal) => goal.sharedGoals, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'goal_id' })
  goal: Goal;

  // Helper methods
  isActive(): boolean {
    return this.status === SharedGoalStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === SharedGoalStatus.COMPLETED;
  }

  requiresApproval(): boolean {
    return this.approvalStatus !== ApprovalStatus.NOT_REQUIRED && 
           this.approvalStatus !== ApprovalStatus.APPROVED;
  }

  isPendingClientApproval(): boolean {
    return this.approvalStatus === ApprovalStatus.PENDING_CLIENT ||
           this.approvalStatus === ApprovalStatus.PENDING_BOTH;
  }

  isPendingCoachApproval(): boolean {
    return this.approvalStatus === ApprovalStatus.PENDING_COACH ||
           this.approvalStatus === ApprovalStatus.PENDING_BOTH;
  }

  canBeModified(): boolean {
    return this.status !== SharedGoalStatus.COMPLETED && 
           this.status !== SharedGoalStatus.CANCELLED;
  }

  isOverdue(): boolean {
    if (!this.targetCompletionDate || this.isCompleted()) return false;
    return new Date() > this.targetCompletionDate;
  }

  getDaysUntilDue(): number | null {
    if (!this.targetCompletionDate || this.isCompleted()) return null;
    const now = new Date();
    const diffTime = this.targetCompletionDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  updateProgress(percentage: number, updatedBy: string, notes?: string): void {
    this.progressPercentage = Math.max(0, Math.min(100, percentage));
    this.lastProgressUpdate = new Date();
    this.lastUpdatedBy = updatedBy;
    
    // Add to feedback history
    if (notes) {
      if (!this.feedbackHistory) this.feedbackHistory = [];
      this.feedbackHistory.push({
        date: new Date(),
        fromCoach: true, // This would need to be determined based on updatedBy
        feedback: notes,
        category: 'progress'
      });
    }
    
    // Auto-complete if 100%
    if (percentage >= 100 && this.status === SharedGoalStatus.ACTIVE) {
      this.status = SharedGoalStatus.COMPLETED;
      this.actualCompletionDate = new Date();
    }
  }

  addCoachingMilestone(milestone: any): void {
    if (!this.coachingMilestones) this.coachingMilestones = [];
    milestone.id = milestone.id || `milestone_${Date.now()}`;
    this.coachingMilestones.push(milestone);
  }

  getCompletedMilestones(): any[] {
    return this.coachingMilestones?.filter(m => m.isCompleted) || [];
  }

  getPendingMilestones(): any[] {
    return this.coachingMilestones?.filter(m => !m.isCompleted) || [];
  }

  approve(approvedBy: string): void {
    if (this.isPendingClientApproval() && this.isPendingCoachApproval()) {
      // Need to determine who is approving
      this.approvalStatus = ApprovalStatus.APPROVED;
    } else if (this.isPendingClientApproval()) {
      this.approvalStatus = ApprovalStatus.APPROVED;
      this.acceptedBy = approvedBy;
      this.acceptedDate = new Date();
    } else if (this.isPendingCoachApproval()) {
      this.approvalStatus = ApprovalStatus.APPROVED;
    }
    
    if (this.approvalStatus === ApprovalStatus.APPROVED && this.status === SharedGoalStatus.PENDING_APPROVAL) {
      this.status = SharedGoalStatus.ACTIVE;
    }
  }

  reject(): void {
    this.approvalStatus = ApprovalStatus.REJECTED;
    this.status = SharedGoalStatus.CANCELLED;
  }
}