/**
 * OnboardingService - Handles client onboarding flow for life coaching programs
 * Manages intake forms, program selection, goal setting, and initial assessments
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'form' | 'assessment' | 'selection' | 'goal-setting' | 'scheduling' | 'welcome';
  required: boolean;
  order: number;
  estimatedMinutes: number;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  data?: any;
  completedAt?: Date;
}

export interface ClientIntakeForm {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    timezone: string;
    preferredLanguage: string;
  };
  coachingBackground: {
    previousCoaching: boolean;
    previousCoachingDetails?: string;
    currentChallenges: string[];
    motivationLevel: 'low' | 'medium' | 'high';
    commitmentLevel: 'low' | 'medium' | 'high';
  };
  lifestyle: {
    occupation: string;
    workSchedule: 'standard' | 'flexible' | 'shift' | 'remote';
    availableTimeSlots: string[];
    preferredSessionLength: '30min' | '45min' | '60min' | '90min';
    preferredSessionFrequency: 'weekly' | 'biweekly' | 'monthly';
  };
  healthAndWellness: {
    currentStressLevel: number; // 1-10
    sleepQuality: number; // 1-10
    exerciseFrequency: 'never' | 'rarely' | 'sometimes' | 'regularly' | 'daily';
    currentTherapy: boolean;
    currentMedication: boolean;
    mentalHealthConcerns: string[];
  };
  goals: {
    primaryGoals: string[];
    specificOutcomes: string[];
    timeframe: '3months' | '6months' | '1year' | 'ongoing';
    successMetrics: string[];
  };
}

export interface ProgramAssessment {
  personalityType: 'introvert' | 'extrovert' | 'ambivert';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  communicationStyle: 'direct' | 'collaborative' | 'supportive' | 'analytical';
  changeReadiness: number; // 1-10
  supportSystem: number; // 1-10
  selfAwareness: number; // 1-10
  recommendedPrograms: string[];
  recommendedCoaches: string[];
}

export interface OnboardingProgress {
  clientId: string;
  programId?: string;
  coachId?: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: OnboardingStep[];
  percentComplete: number;
  startedAt: Date;
  expectedCompletionDate: Date;
  actualCompletionDate?: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
  intakeForm?: ClientIntakeForm;
  assessment?: ProgramAssessment;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Initialize onboarding process for a new client
   */
  async initializeOnboarding(clientEmail: string): Promise<OnboardingProgress> {
    try {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'welcome',
          title: 'Welcome to Life Coaching',
          description: 'Introduction to our coaching approach and what to expect',
          type: 'welcome',
          required: true,
          order: 1,
          estimatedMinutes: 5,
          status: 'pending',
        },
        {
          id: 'intake-form',
          title: 'Personal Information & Background',
          description: 'Tell us about yourself and your coaching goals',
          type: 'form',
          required: true,
          order: 2,
          estimatedMinutes: 15,
          status: 'pending',
        },
        {
          id: 'lifestyle-assessment',
          title: 'Lifestyle & Wellness Assessment',
          description: 'Help us understand your current lifestyle and wellness status',
          type: 'assessment',
          required: true,
          order: 3,
          estimatedMinutes: 10,
          status: 'pending',
        },
        {
          id: 'goal-setting',
          title: 'Goal Setting & Vision',
          description: 'Define your coaching goals and desired outcomes',
          type: 'goal-setting',
          required: true,
          order: 4,
          estimatedMinutes: 20,
          status: 'pending',
        },
        {
          id: 'program-selection',
          title: 'Choose Your Coaching Program',
          description: 'Select the program that best fits your needs and goals',
          type: 'selection',
          required: true,
          order: 5,
          estimatedMinutes: 10,
          status: 'pending',
        },
        {
          id: 'coach-matching',
          title: 'Coach Matching',
          description: 'We\'ll match you with the perfect coach for your journey',
          type: 'selection',
          required: true,
          order: 6,
          estimatedMinutes: 5,
          status: 'pending',
        },
        {
          id: 'schedule-intro',
          title: 'Schedule Introduction Session',
          description: 'Book your first coaching session with your matched coach',
          type: 'scheduling',
          required: true,
          order: 7,
          estimatedMinutes: 5,
          status: 'pending',
        },
        {
          id: 'preparation',
          title: 'Session Preparation',
          description: 'Prepare for your first coaching session',
          type: 'form',
          required: false,
          order: 8,
          estimatedMinutes: 10,
          status: 'pending',
        },
      ];

      const progress: OnboardingProgress = {
        clientId,
        currentStep: 1,
        totalSteps: onboardingSteps.length,
        completedSteps: [],
        percentComplete: 0,
        startedAt: new Date(),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'not-started',
      };

      this.logger.log(`🎯 Initialized onboarding for client ${clientEmail}`);
      return progress;
    } catch (error) {
      this.logger.error('Failed to initialize onboarding:', error);
      throw new Error(`Onboarding initialization failed: ${error.message}`);
    }
  }

  /**
   * Get available onboarding steps
   */
  getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Life Coaching',
        description: 'Introduction to our coaching approach and what to expect',
        type: 'welcome',
        required: true,
        order: 1,
        estimatedMinutes: 5,
        status: 'pending',
      },
      {
        id: 'intake-form',
        title: 'Personal Information & Background',
        description: 'Tell us about yourself and your coaching goals',
        type: 'form',
        required: true,
        order: 2,
        estimatedMinutes: 15,
        status: 'pending',
      },
      {
        id: 'lifestyle-assessment',
        title: 'Lifestyle & Wellness Assessment',
        description: 'Help us understand your current lifestyle and wellness status',
        type: 'assessment',
        required: true,
        order: 3,
        estimatedMinutes: 10,
        status: 'pending',
      },
      {
        id: 'goal-setting',
        title: 'Goal Setting & Vision',
        description: 'Define your coaching goals and desired outcomes',
        type: 'goal-setting',
        required: true,
        order: 4,
        estimatedMinutes: 20,
        status: 'pending',
      },
      {
        id: 'program-selection',
        title: 'Choose Your Coaching Program',
        description: 'Select the program that best fits your needs and goals',
        type: 'selection',
        required: true,
        order: 5,
        estimatedMinutes: 10,
        status: 'pending',
      },
      {
        id: 'coach-matching',
        title: 'Coach Matching',
        description: 'We\'ll match you with the perfect coach for your journey',
        type: 'selection',
        required: true,
        order: 6,
        estimatedMinutes: 5,
        status: 'pending',
      },
      {
        id: 'schedule-intro',
        title: 'Schedule Introduction Session',
        description: 'Book your first coaching session with your matched coach',
        type: 'scheduling',
        required: true,
        order: 7,
        estimatedMinutes: 5,
        status: 'pending',
      },
      {
        id: 'preparation',
        title: 'Session Preparation',
        description: 'Prepare for your first coaching session',
        type: 'form',
        required: false,
        order: 8,
        estimatedMinutes: 10,
        status: 'pending',
      },
    ];
  }

  /**
   * Complete an onboarding step
   */
  async completeStep(
    clientId: string,
    stepId: string,
    stepData: any,
  ): Promise<OnboardingProgress> {
    try {
      // In a real implementation, you'd fetch progress from database
      // For now, we'll create a mock progress
      const steps = this.getOnboardingSteps();
      const stepIndex = steps.findIndex(s => s.id === stepId);
      
      if (stepIndex === -1) {
        throw new Error(`Step ${stepId} not found`);
      }

      const completedStep: OnboardingStep = {
        ...steps[stepIndex],
        status: 'completed',
        data: stepData,
        completedAt: new Date(),
      };

      // Process specific step data
      let intakeForm: ClientIntakeForm | undefined;
      let assessment: ProgramAssessment | undefined;

      if (stepId === 'intake-form') {
        intakeForm = this.processIntakeForm(stepData);
      } else if (stepId === 'lifestyle-assessment') {
        assessment = this.processAssessment(stepData);
      }

      const progress: OnboardingProgress = {
        clientId,
        currentStep: stepIndex + 2, // Next step
        totalSteps: steps.length,
        completedSteps: [completedStep],
        percentComplete: Math.round(((stepIndex + 1) / steps.length) * 100),
        startedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        expectedCompletionDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days
        status: stepIndex + 1 === steps.length ? 'completed' : 'in-progress',
        intakeForm,
        assessment,
      };

      this.logger.log(`✅ Completed step ${stepId} for client ${clientId}`);
      return progress;
    } catch (error) {
      this.logger.error(`Failed to complete step ${stepId}:`, error);
      throw new Error(`Step completion failed: ${error.message}`);
    }
  }

  /**
   * Get onboarding progress for a client
   */
  async getProgress(clientId: string): Promise<OnboardingProgress | null> {
    try {
      // In a real implementation, you'd fetch from database
      // For now, return a mock progress
      const mockProgress: OnboardingProgress = {
        clientId,
        currentStep: 3,
        totalSteps: 8,
        completedSteps: [
          {
            id: 'welcome',
            title: 'Welcome to Life Coaching',
            description: 'Introduction to our coaching approach and what to expect',
            type: 'welcome',
            required: true,
            order: 1,
            estimatedMinutes: 5,
            status: 'completed',
            completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            id: 'intake-form',
            title: 'Personal Information & Background',
            description: 'Tell us about yourself and your coaching goals',
            type: 'form',
            required: true,
            order: 2,
            estimatedMinutes: 15,
            status: 'completed',
            completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
        ],
        percentComplete: 25,
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        expectedCompletionDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        status: 'in-progress',
      };

      return mockProgress;
    } catch (error) {
      this.logger.error(`Failed to get progress for client ${clientId}:`, error);
      return null;
    }
  }

  /**
   * Process intake form data
   */
  private processIntakeForm(formData: any): ClientIntakeForm {
    // Validate and structure intake form data
    const intakeForm: ClientIntakeForm = {
      personalInfo: {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        dateOfBirth: formData.dateOfBirth || '',
        timezone: formData.timezone || 'UTC',
        preferredLanguage: formData.preferredLanguage || 'en',
      },
      coachingBackground: {
        previousCoaching: formData.previousCoaching || false,
        previousCoachingDetails: formData.previousCoachingDetails,
        currentChallenges: formData.currentChallenges || [],
        motivationLevel: formData.motivationLevel || 'medium',
        commitmentLevel: formData.commitmentLevel || 'medium',
      },
      lifestyle: {
        occupation: formData.occupation || '',
        workSchedule: formData.workSchedule || 'standard',
        availableTimeSlots: formData.availableTimeSlots || [],
        preferredSessionLength: formData.preferredSessionLength || '60min',
        preferredSessionFrequency: formData.preferredSessionFrequency || 'weekly',
      },
      healthAndWellness: {
        currentStressLevel: parseInt(formData.currentStressLevel) || 5,
        sleepQuality: parseInt(formData.sleepQuality) || 5,
        exerciseFrequency: formData.exerciseFrequency || 'sometimes',
        currentTherapy: formData.currentTherapy || false,
        currentMedication: formData.currentMedication || false,
        mentalHealthConcerns: formData.mentalHealthConcerns || [],
      },
      goals: {
        primaryGoals: formData.primaryGoals || [],
        specificOutcomes: formData.specificOutcomes || [],
        timeframe: formData.timeframe || '6months',
        successMetrics: formData.successMetrics || [],
      },
    };

    return intakeForm;
  }

  /**
   * Process assessment data and generate recommendations
   */
  private processAssessment(assessmentData: any): ProgramAssessment {
    // This would typically involve more sophisticated analysis
    // For now, we'll use simple logic to generate recommendations

    const assessment: ProgramAssessment = {
      personalityType: assessmentData.personalityType || 'ambivert',
      learningStyle: assessmentData.learningStyle || 'visual',
      communicationStyle: assessmentData.communicationStyle || 'collaborative',
      changeReadiness: parseInt(assessmentData.changeReadiness) || 7,
      supportSystem: parseInt(assessmentData.supportSystem) || 6,
      selfAwareness: parseInt(assessmentData.selfAwareness) || 6,
      recommendedPrograms: this.generateProgramRecommendations(assessmentData),
      recommendedCoaches: this.generateCoachRecommendations(assessmentData),
    };

    return assessment;
  }

  /**
   * Generate program recommendations based on assessment
   */
  private generateProgramRecommendations(data: any): string[] {
    const recommendations = [];

    // Basic recommendation logic
    if (data.currentStressLevel >= 7) {
      recommendations.push('stress-management');
      recommendations.push('mindfulness-based-coaching');
    }

    if (data.goals?.includes('career')) {
      recommendations.push('career-transition');
      recommendations.push('leadership-development');
    }

    if (data.goals?.includes('relationships')) {
      recommendations.push('relationship-coaching');
      recommendations.push('communication-skills');
    }

    if (data.goals?.includes('health')) {
      recommendations.push('wellness-coaching');
      recommendations.push('lifestyle-change');
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push('life-balance');
      recommendations.push('personal-growth');
    }

    return recommendations;
  }

  /**
   * Generate coach recommendations based on assessment
   */
  private generateCoachRecommendations(data: any): string[] {
    const recommendations = [];

    // Match coaches based on specialties and communication style
    if (data.communicationStyle === 'direct') {
      recommendations.push('coach_direct_style');
    } else if (data.communicationStyle === 'supportive') {
      recommendations.push('coach_supportive_style');
    }

    if (data.goals?.includes('career')) {
      recommendations.push('coach_career_specialist');
    }

    // Default coach recommendations
    if (recommendations.length === 0) {
      recommendations.push('coach_general_1');
      recommendations.push('coach_general_2');
    }

    return recommendations;
  }

  /**
   * Get available coaching programs
   */
  getAvailablePrograms(): any[] {
    return [
      {
        id: 'life-balance',
        name: 'Life Balance Mastery',
        description: 'Find harmony between work, relationships, and personal growth',
        duration: '3 months',
        sessions: 12,
        price: 1200,
        features: ['Weekly 1-on-1 sessions', 'Goal tracking', 'Resource library', 'Email support'],
      },
      {
        id: 'stress-management',
        name: 'Stress & Anxiety Management',
        description: 'Learn practical tools to manage stress and build resilience',
        duration: '2 months',
        sessions: 8,
        price: 800,
        features: ['Bi-weekly sessions', 'Mindfulness training', 'Stress tracking tools', 'Crisis support'],
      },
      {
        id: 'career-transition',
        name: 'Career Transition Coaching',
        description: 'Navigate career changes with confidence and clarity',
        duration: '4 months',
        sessions: 16,
        price: 1600,
        features: ['Weekly sessions', 'Resume review', 'Interview prep', 'Networking guidance'],
      },
      {
        id: 'relationship-coaching',
        name: 'Relationship & Communication',
        description: 'Improve relationships through better communication and understanding',
        duration: '3 months',
        sessions: 12,
        price: 1200,
        features: ['Weekly sessions', 'Communication exercises', 'Conflict resolution', 'Partner sessions available'],
      },
      {
        id: 'wellness-coaching',
        name: 'Holistic Wellness Program',
        description: 'Transform your health and vitality through sustainable lifestyle changes',
        duration: '6 months',
        sessions: 24,
        price: 2400,
        features: ['Bi-weekly sessions', 'Nutrition guidance', 'Exercise planning', 'Sleep optimization'],
      },
    ];
  }

  /**
   * Send onboarding reminders
   */
  async sendOnboardingReminder(clientId: string): Promise<void> {
    try {
      // In a real implementation, you'd send actual emails/notifications
      this.logger.log(`📧 Sending onboarding reminder to client ${clientId}`);
      
      // Mock email sending
      const mockEmailContent = {
        to: 'client@example.com',
        subject: 'Complete Your Life Coaching Onboarding',
        body: `
          Hi there! 
          
          We're excited to have you join our life coaching program. 
          You have a few more steps to complete in your onboarding process.
          
          Complete your onboarding: [LINK]
          
          Questions? Reply to this email or call us at (555) 123-4567.
          
          Best regards,
          Your Coaching Team
        `,
      };

      this.logger.log('📧 Onboarding reminder sent successfully');
    } catch (error) {
      this.logger.error('Failed to send onboarding reminder:', error);
      throw new Error(`Reminder sending failed: ${error.message}`);
    }
  }
}