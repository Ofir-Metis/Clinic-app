/**
 * Client Entity - Represents coaching clients in the system
 * Enhanced for multi-coach relationships and comprehensive profile management
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
import { ClientCoachRelationship } from './client-coach-relationship.entity';
import { Goal } from './goal.entity';
import { Achievement } from './achievement.entity';

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

@Entity('clients')
@Index(['email'], { unique: true })
@Index(['status'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic Information
  @Column({ length: 100, name: 'first_name' })
  firstName: string;

  @Column({ length: 100, name: 'last_name' })
  lastName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ length: 10, nullable: true })
  gender: string;

  @Column({ length: 100, nullable: true })
  timezone: string;

  @Column({ length: 5, nullable: true, name: 'preferred_language' })
  preferredLanguage: string; // ISO language code

  // Profile and Preferences
  @Column('text', { nullable: true, name: 'profile_image_url' })
  profileImageUrl: string;

  @Column('text', { nullable: true })
  bio: string;

  @Column('text', { nullable: true })
  occupation: string;

  @Column({ length: 100, nullable: true })
  location: string; // City, Country

  // Account Status
  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.ACTIVE
  })
  status: ClientStatus;

  @Column({
    type: 'enum',
    enum: OnboardingStatus,
    default: OnboardingStatus.NOT_STARTED,
    name: 'onboarding_status'
  })
  onboardingStatus: OnboardingStatus;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  // Personal Development Profile
  @Column('jsonb', { nullable: true, name: 'life_areas_focus' })
  lifeAreasFocus: {
    career: number;        // 1-10 priority level
    relationships: number;
    health: number;
    finance: number;
    personal_growth: number;
    spirituality: number;
    recreation: number;
    family: number;
  };

  @Column('jsonb', { nullable: true, name: 'personality_profile' })
  personalityProfile: {
    mbtiType?: string;
    strengthsFinder?: string[];
    enneagramType?: string;
    discProfile?: string;
    workingStyle?: 'collaborative' | 'independent' | 'structured' | 'flexible';
    communicationStyle?: 'direct' | 'supportive' | 'analytical' | 'expressive';
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    motivationFactors?: string[];
  };

  // Coaching Preferences and History
  @Column('jsonb', { nullable: true, name: 'coaching_preferences' })
  coachingPreferences: {
    preferredSessionType: 'online' | 'in-person' | 'hybrid';
    preferredSessionDuration: number; // minutes
    preferredSessionFrequency: 'weekly' | 'biweekly' | 'monthly' | 'as-needed';
    preferredTimeSlots: string[]; // ['morning', 'afternoon', 'evening']
    preferredDays: string[]; // ['monday', 'tuesday', etc.]
    coachingStyle: 'supportive' | 'challenging' | 'collaborative' | 'directive';
    feedbackFrequency: 'immediate' | 'session-end' | 'weekly' | 'monthly';
    goalSettingApproach: 'structured' | 'flexible' | 'collaborative';
    accountabilityLevel: 'high' | 'medium' | 'low';
  };

  @Column('jsonb', { nullable: true, name: 'past_coaching_experience' })
  pastCoachingExperience: {
    hasPreviousCoaching: boolean;
    previousCoachingTypes?: string[];
    whatWorkedWell?: string;
    whatDidntWork?: string;
    coachingGoalsAchieved?: string[];
    preferredApproaches?: string[];
    avoidedApproaches?: string[];
  };

  // Goals and Progress Tracking
  @Column('jsonb', { nullable: true, name: 'current_life_situation' })
  currentLifeSituation: {
    majorLifeEvents?: string[];
    currentChallenges?: string[];
    stressLevel?: number; // 1-10
    satisfactionLevel?: number; // 1-10
    energyLevel?: number; // 1-10
    supportSystem?: string;
    lifeTransitions?: string[];
  };

  @Column('jsonb', { nullable: true, name: 'success_metrics' })
  successMetrics: {
    preferredMeasurements?: string[]; // ['goal_completion', 'satisfaction_scores', 'habit_tracking']
    trackingFrequency?: 'daily' | 'weekly' | 'monthly';
    celebrationPreferences?: string[];
    milestoneDefinition?: string;
    progressSharingPreferences?: 'private' | 'coaches_only' | 'community';
  };

  // Emergency and Support Information
  @Column('jsonb', { nullable: true, name: 'emergency_contact' })
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };

  @Column('jsonb', { nullable: true, name: 'support_network' })
  supportNetwork: {
    hasTherapist: boolean;
    hasMedicalDoctor: boolean;
    hasPsychiatrist: boolean;
    supportGroups?: string[];
    familySupport?: 'high' | 'medium' | 'low' | 'none';
    friendSupport?: 'high' | 'medium' | 'low' | 'none';
  };

  // Privacy and Consent
  @Column('jsonb', { nullable: true, name: 'privacy_settings' })
  privacySettings: {
    allowDataSharing: boolean;
    allowProgressSharing: boolean;
    allowCoachCollaboration: boolean;
    allowAnonymousDataUsage: boolean;
    marketingConsent: boolean;
    dataRetentionConsent: boolean;
    consentDate: Date;
    consentVersion: string;
  };

  // Onboarding and Assessment Data
  @Column('jsonb', { nullable: true, name: 'onboarding_data' })
  onboardingData: {
    completedSteps?: string[];
    assessmentResults?: Record<string, any>;
    initialGoals?: string[];
    coachMatchingCriteria?: Record<string, any>;
    onboardingNotes?: string;
    completedDate?: Date;
  };

  // Activity and Engagement Tracking
  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_session_date' })
  lastSessionDate: Date;

  @Column({ type: 'integer', default: 0, name: 'total_sessions' })
  totalSessions: number;

  @Column({ type: 'integer', default: 0, name: 'current_streak_days' })
  currentStreakDays: number;

  @Column({ type: 'integer', default: 0, name: 'longest_streak_days' })
  longestStreakDays: number;

  // Subscription and Billing (if applicable)
  @Column('jsonb', { nullable: true, name: 'subscription_info' })
  subscriptionInfo: {
    plan?: string;
    status?: 'active' | 'cancelled' | 'expired' | 'trial';
    nextBillingDate?: Date;
    autoRenewal?: boolean;
    paymentMethod?: string;
  };

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date;

  // Relationships
  @OneToMany(() => ClientCoachRelationship, (relationship) => relationship.client, {
    cascade: true
  })
  coachRelationships: ClientCoachRelationship[];

  @OneToMany(() => Goal, (goal) => goal.client, {
    cascade: true
  })
  goals: Goal[];

  @OneToMany(() => Achievement, (achievement) => achievement.client, {
    cascade: true
  })
  achievements: Achievement[];

  // Helper methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getActiveCoachRelationships(): ClientCoachRelationship[] {
    return this.coachRelationships?.filter(rel => rel.isActive()) || [];
  }

  getPrimaryCoach(): ClientCoachRelationship | undefined {
    return this.coachRelationships?.find(rel => rel.isPrimaryCoach() && rel.isActive());
  }

  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  isOnboardingComplete(): boolean {
    return this.onboardingStatus === OnboardingStatus.COMPLETED;
  }

  canReceiveCoaching(): boolean {
    return this.status === ClientStatus.ACTIVE && this.isOnboardingComplete();
  }

  getTotalActiveCoaches(): number {
    return this.getActiveCoachRelationships().length;
  }

  updateStreak(hasActivity: boolean): void {
    if (hasActivity) {
      this.currentStreakDays++;
      if (this.currentStreakDays > this.longestStreakDays) {
        this.longestStreakDays = this.currentStreakDays;
      }
    } else {
      this.currentStreakDays = 0;
    }
  }
}