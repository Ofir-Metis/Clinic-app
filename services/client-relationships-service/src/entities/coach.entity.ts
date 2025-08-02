/**
 * Coach Entity - Represents coaches/therapists in the system
 * Enhanced for multi-client relationships and professional profile management
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

export enum CoachStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DELETED = 'deleted'
}

export enum VerificationStatus {
  NOT_VERIFIED = 'not_verified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

@Entity('coaches')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['specializations'], { using: 'gin' })
export class Coach {
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

  @Column({ length: 100, nullable: true })
  timezone: string;

  @Column({ length: 5, nullable: true, name: 'preferred_language' })
  preferredLanguage: string;

  // Professional Profile
  @Column('text', { nullable: true, name: 'profile_image_url' })
  profileImageUrl: string;

  @Column({ length: 200, name: 'professional_title' })
  professionalTitle: string; // e.g., "Certified Life Coach", "Licensed Therapist"

  @Column('text')
  bio: string; // Professional biography

  @Column('text', { nullable: true, name: 'coaching_philosophy' })
  coachingPhilosophy: string;

  @Column({ type: 'integer', nullable: true, name: 'years_of_experience' })
  yearsOfExperience: number;

  @Column({ length: 100, nullable: true })
  location: string; // City, Country or "Remote"

  // Specializations and Expertise
  @Column('jsonb', { name: 'specializations' })
  specializations: string[]; // ['life_coaching', 'career_coaching', 'wellness', 'relationships']

  @Column('jsonb', { nullable: true, name: 'expertise_areas' })
  expertiseAreas: {
    primary: string[];    // Main areas of expertise
    secondary: string[];  // Secondary areas
    niches: string[];     // Specialized niches
  };

  @Column('jsonb', { nullable: true, name: 'coaching_methods' })
  coachingMethods: string[]; // ['CBT', 'NLP', 'mindfulness', 'solution_focused']

  @Column('jsonb', { nullable: true, name: 'target_demographics' })
  targetDemographics: {
    ageRanges: string[];    // ['20-30', '30-40', '40-50', '50+']
    genders: string[];      // ['male', 'female', 'non-binary', 'all']
    professions: string[];  // Target professional groups
    lifeStages: string[];   // ['students', 'new_parents', 'career_changers', 'retirees']
  };

  // Credentials and Certifications
  @Column('jsonb', { nullable: true })
  credentials: Array<{
    type: 'certification' | 'license' | 'degree' | 'training';
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expirationDate?: Date;
    credentialNumber?: string;
    verificationUrl?: string;
    isVerified: boolean;
  }>;

  @Column('jsonb', { nullable: true })
  education: Array<{
    degree: string;
    institution: string;
    fieldOfStudy: string;
    graduationYear: number;
    isVerified: boolean;
  }>;

  // Status and Verification
  @Column({
    type: 'enum',
    enum: CoachStatus,
    default: CoachStatus.PENDING_VERIFICATION
  })
  status: CoachStatus;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.NOT_VERIFIED,
    name: 'verification_status'
  })
  verificationStatus: VerificationStatus;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'background_check_completed' })
  backgroundCheckCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'verification_completed_date' })
  verificationCompletedDate: Date;

  // Availability and Scheduling
  @Column('jsonb', { nullable: true })
  availability: {
    timezone: string;
    workingHours: {
      [key: string]: { // day of week
        start: string; // HH:MM format
        end: string;
        available: boolean;
      };
    };
    bookingAdvance: {
      minimum: number; // hours
      maximum: number; // days
    };
    sessionTypes: {
      online: boolean;
      inPerson: boolean;
      phone: boolean;
    };
    sessionDurations: number[]; // Available durations in minutes
    maxClientsPerDay?: number;
    maxClientsTotal?: number;
    bufferTime?: number; // minutes between sessions
  };

  // Pricing and Services
  @Column('jsonb', { nullable: true, name: 'pricing_structure' })
  pricingStructure: {
    currency: string;
    sessionRates: {
      individual: number;
      package: number; // per session in package
      group: number;
    };
    packageOptions: Array<{
      name: string;
      sessions: number;
      price: number;
      validityDays: number;
      description: string;
    }>;
    specialRates?: {
      students: number;
      seniors: number;
      nonprofits: number;
    };
    paymentTerms: string;
    cancellationPolicy: string;
  };

  @Column('jsonb', { nullable: true, name: 'service_offerings' })
  serviceOfferings: {
    individualCoaching: boolean;
    groupCoaching: boolean;
    workshops: boolean;
    consultations: boolean;
    assessments: boolean;
    onlinePrograms: boolean;
    customPrograms: boolean;
  };

  // Client Management Preferences
  @Column('jsonb', { nullable: true, name: 'client_preferences' })
  clientPreferences: {
    maxActiveClients: number;
    preferredClientTypes?: string[];
    clientOnboardingProcess?: string;
    sessionStructure?: string;
    followUpApproach?: string;
    progressTrackingMethods?: string[];
    communicationPreferences?: {
      betweenSessions: boolean;
      emergencyContact: boolean;
      progressUpdates: string; // 'weekly', 'monthly', 'as-needed'
    };
  };

  // Professional Development
  @Column('jsonb', { nullable: true, name: 'professional_development' })
  professionalDevelopment: {
    continuingEducation: Array<{
      courseName: string;
      provider: string;
      completionDate: Date;
      credits?: number;
    }>;
    professionalMemberships: Array<{
      organization: string;
      membershipLevel: string;
      joinDate: Date;
      isActive: boolean;
    }>;
    conferences: Array<{
      name: string;
      date: Date;
      role: 'attendee' | 'speaker' | 'organizer';
    }>;
    publications?: Array<{
      title: string;
      type: 'article' | 'book' | 'research' | 'blog';
      publicationDate: Date;
      url?: string;
    }>;
  };

  // Performance and Reviews
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, name: 'average_rating' })
  averageRating: number;

  @Column({ type: 'integer', default: 0, name: 'total_reviews' })
  totalReviews: number;

  @Column({ type: 'integer', default: 0, name: 'total_sessions_conducted' })
  totalSessionsConducted: number;

  @Column({ type: 'integer', default: 0, name: 'total_clients_served' })
  totalClientsServed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'client_retention_rate' })
  clientRetentionRate: number; // Percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'goal_achievement_rate' })
  goalAchievementRate: number; // Percentage

  // Activity Tracking
  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_session_date' })
  lastSessionDate: Date;

  @Column({ type: 'boolean', default: true, name: 'accepting_new_clients' })
  acceptingNewClients: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'profile_completion_date' })
  profileCompletionDate: Date;

  // Business Information (optional for independent coaches)
  @Column('jsonb', { nullable: true, name: 'business_info' })
  businessInfo: {
    businessName?: string;
    businessType?: 'sole_proprietorship' | 'llc' | 'corporation' | 'partnership';
    taxId?: string;
    licenseNumber?: string;
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      expirationDate: Date;
      coverageAmount: number;
    };
    website?: string;
    socialMedia?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
  };

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date;

  // Relationships
  @OneToMany(() => ClientCoachRelationship, (relationship) => relationship.coach, {
    cascade: true
  })
  clientRelationships: ClientCoachRelationship[];

  // Helper methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getDisplayName(): string {
    return `${this.professionalTitle} ${this.getFullName()}`;
  }

  getActiveClientRelationships(): ClientCoachRelationship[] {
    return this.clientRelationships?.filter(rel => rel.isActive()) || [];
  }

  getTotalActiveClients(): number {
    return this.getActiveClientRelationships().length;
  }

  isVerified(): boolean {
    return this.verificationStatus === VerificationStatus.VERIFIED;
  }

  canAcceptNewClients(): boolean {
    return (
      this.status === CoachStatus.ACTIVE &&
      this.acceptingNewClients &&
      this.isVerified() &&
      (!this.clientPreferences?.maxActiveClients || 
       this.getTotalActiveClients() < this.clientPreferences.maxActiveClients)
    );
  }

  hasSpecialization(specialization: string): boolean {
    return this.specializations?.includes(specialization) || false;
  }

  getExperienceLevel(): 'entry' | 'intermediate' | 'senior' | 'expert' {
    if (!this.yearsOfExperience) return 'entry';
    if (this.yearsOfExperience <= 2) return 'entry';
    if (this.yearsOfExperience <= 5) return 'intermediate';
    if (this.yearsOfExperience <= 10) return 'senior';
    return 'expert';
  }

  isAvailableForSessionType(sessionType: 'online' | 'inPerson' | 'phone'): boolean {
    const sessionTypeMap = {
      online: 'online',
      inPerson: 'inPerson',
      phone: 'phone'
    };
    return this.availability?.sessionTypes?.[sessionTypeMap[sessionType]] || false;
  }

  getProfileCompleteness(): number {
    const requiredFields = [
      'bio', 'professionalTitle', 'specializations', 'credentials',
      'availability', 'pricingStructure'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const value = this[field as keyof Coach];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }
}