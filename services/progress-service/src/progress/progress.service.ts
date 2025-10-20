/**
 * ProgressService - Core business logic for client progress tracking
 * Handles goal management, progress updates, and analytics for self-development
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { ClientGoal, GoalStatus, GoalType, MeasurementType } from '../entities/client-goal.entity';
import { ProgressEntry, EntryType } from '../entities/progress-entry.entity';
import { Milestone } from '../entities/milestone.entity';
import { GoalCategory } from '../entities/goal-category.entity';

export interface CreateGoalRequest {
  title: string;
  description?: string;
  type: GoalType;
  categoryId?: string;
  measurementType: MeasurementType;
  targetDate?: Date;
  targetValue?: number;
  unit?: string;
  tags?: string[];
  successCriteria?: string;
  motivationStatement?: string;
  strategies?: string[];
  reminderEnabled?: boolean;
  reminderFrequency?: 'daily' | 'weekly' | 'monthly';
  shareWithCoach?: boolean;
  allowCoachEdits?: boolean;
  visibilityLevel?: 'private' | 'coach-only' | 'shared';
}

export interface UpdateProgressRequest {
  value?: number;
  notes: string;
  entryType?: EntryType;
  mood?: number;
  confidence?: number;
  effortLevel?: number;
  achievements?: string[];
  challenges?: string[];
  lessonsLearned?: string[];
  nextActions?: string[];
  timeSpent?: number;
  isSignificant?: boolean;
}

export interface ProgressDashboardData {
  overview: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    overallCompletionRate: number;
    currentStreaks: number;
    totalMilestones: number;
    achievedMilestones: number;
  };
  recentProgress: ProgressEntry[];
  upcomingMilestones: Milestone[];
  goalsByCategory: Array<{
    category: string;
    count: number;
    completionRate: number;
  }>;
  motivationalInsights: {
    currentStreak: number;
    bestStreak: number;
    totalProgressEntries: number;
    averageMood: number;
    averageConfidence: number;
    topAchievements: string[];
    encouragementMessage: string;
  };
  weeklyTrends: Array<{
    week: string;
    progressEntries: number;
    averageMood: number;
    completedMilestones: number;
  }>;
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @InjectRepository(ClientGoal)
    private readonly goalRepository: Repository<ClientGoal>,
    @InjectRepository(ProgressEntry)
    private readonly progressRepository: Repository<ProgressEntry>,
    @InjectRepository(Milestone)
    private readonly milestoneRepository: Repository<Milestone>,
    @InjectRepository(GoalCategory)
    private readonly categoryRepository: Repository<GoalCategory>
  ) {}

  /**
   * Create a new goal for a client
   */
  async createGoal(
    clientId: string,
    coachId: string | undefined,
    request: CreateGoalRequest
  ): Promise<ClientGoal> {
    try {
      const goal = new ClientGoal();
      goal.clientId = clientId;
      goal.coachId = coachId;
      goal.title = request.title;
      goal.description = request.description;
      goal.type = request.type;
      goal.categoryId = request.categoryId;
      goal.measurementType = request.measurementType;
      goal.targetDate = request.targetDate;
      goal.startDate = new Date();
      goal.tags = request.tags || [];
      goal.successCriteria = request.successCriteria;
      goal.motivationStatement = request.motivationStatement;
      goal.strategies = request.strategies || [];
      goal.createdBy = clientId;

      // Initialize progress metrics
      goal.progressMetrics = {
        currentValue: 0,
        targetValue: request.targetValue,
        unit: request.unit,
        completionPercentage: 0,
        streak: 0,
        bestStreak: 0,
        totalSessions: 0,
        averageProgress: 0,
        lastUpdated: new Date()
      };

      // Initialize settings
      goal.settings = {
        reminderEnabled: request.reminderEnabled ?? true,
        reminderFrequency: request.reminderFrequency ?? 'daily',
        shareWithCoach: request.shareWithCoach ?? true,
        allowCoachEdits: request.allowCoachEdits ?? true,
        visibilityLevel: request.visibilityLevel ?? 'coach-only',
        celebrationEnabled: true,
        motivationalQuotes: true
      };

      const savedGoal = await this.goalRepository.save(goal);

      // Create default milestones if category provides them
      if (request.categoryId) {
        await this.createDefaultMilestones(savedGoal.id, request.categoryId);
      }

      this.logger.log(`Created new goal ${savedGoal.id} for client ${clientId}`);
      return savedGoal;

    } catch (error) {
      this.logger.error(`Failed to create goal for client ${clientId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update progress on a goal
   */
  async updateProgress(
    goalId: string,
    userId: string,
    request: UpdateProgressRequest
  ): Promise<{ goal: ClientGoal; entry: ProgressEntry; milestonesAchieved: Milestone[] }> {
    try {
      const goal = await this.goalRepository.findOne({ 
        where: { id: goalId },
        relations: ['milestones']
      });

      if (!goal) {
        throw new NotFoundException('Goal not found');
      }

      if (!goal.canBeEditedBy(userId)) {
        throw new BadRequestException('User does not have permission to update this goal');
      }

      // Create progress entry
      const entry = new ProgressEntry();
      entry.goalId = goalId;
      entry.entryType = request.entryType || 'progress';
      entry.entryDate = new Date();
      entry.notes = request.notes;
      entry.achievements = request.achievements || [];
      entry.challenges = request.challenges || [];
      entry.lessonsLearned = request.lessonsLearned || [];
      entry.nextActions = request.nextActions || [];
      entry.isSignificant = request.isSignificant || false;
      entry.createdBy = userId;

      // Set progress data
      entry.progressData = {
        value: request.value,
        unit: goal.progressMetrics.unit,
        percentageComplete: 0, // Will be calculated
        streakContinued: false, // Will be calculated
        qualityScore: 5 // Default, could be enhanced
      };

      // Set metadata
      entry.metadata = {
        mood: request.mood as any,
        confidence: request.confidence as any,
        effortLevel: request.effortLevel,
        timeSpent: request.timeSpent
      };

      // Update goal progress
      if (request.value !== undefined) {
        goal.updateProgress(request.value, request.notes);
      }

      // Calculate streak
      const recentEntries = await this.getRecentProgressEntries(goalId, 7);
      const streak = this.calculateStreak(recentEntries);
      goal.progressMetrics.streak = streak;
      if (streak > goal.progressMetrics.bestStreak!) {
        goal.progressMetrics.bestStreak = streak;
      }

      entry.progressData.streakContinued = streak > 0;
      entry.progressData.percentageComplete = goal.progressMetrics.completionPercentage;

      // Save progress entry and updated goal
      const savedEntry = await this.progressRepository.save(entry);
      goal.progressMetrics.totalSessions = (goal.progressMetrics.totalSessions || 0) + 1;
      const savedGoal = await this.goalRepository.save(goal);

      // Check for milestone achievements
      const milestonesAchieved = await this.checkMilestoneAchievements(goal);

      this.logger.log(`Updated progress for goal ${goalId}: ${goal.progressMetrics.completionPercentage}%`);

      return {
        goal: savedGoal,
        entry: savedEntry,
        milestonesAchieved
      };

    } catch (error) {
      this.logger.error(`Failed to update progress for goal ${goalId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data for a client
   */
  async getDashboardData(clientId: string): Promise<ProgressDashboardData> {
    try {
      const goals = await this.goalRepository.find({
        where: { clientId },
        relations: ['category', 'progressEntries', 'milestones']
      });

      const recentProgress = await this.progressRepository.find({
        where: { createdBy: clientId },
        order: { createdAt: 'DESC' },
        take: 10,
        relations: ['goal']
      });

      const upcomingMilestones = await this.milestoneRepository.find({
        where: { 
          createdBy: clientId,
          isAchieved: false
        },
        order: { targetDate: 'ASC' },
        take: 5,
        relations: ['goal']
      });

      // Calculate overview metrics
      const activeGoals = goals.filter(g => g.status === 'active');
      const completedGoals = goals.filter(g => g.status === 'completed');
      const overallCompletionRate = goals.length > 0 
        ? goals.reduce((sum, g) => sum + g.progressMetrics.completionPercentage, 0) / goals.length
        : 0;

      const currentStreaks = activeGoals.reduce((sum, g) => sum + (g.progressMetrics.streak || 0), 0);
      const allMilestones = goals.flatMap(g => g.milestones || []);
      const achievedMilestones = allMilestones.filter(m => m.isAchieved);

      // Calculate motivational insights
      const allEntries = goals.flatMap(g => g.progressEntries || []);
      const recentEntries = allEntries.filter(e => 
        e.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      );

      const averageMood = recentEntries.length > 0
        ? recentEntries.reduce((sum, e) => sum + (e.metadata.mood || 3), 0) / recentEntries.length
        : 3;

      const averageConfidence = recentEntries.length > 0
        ? recentEntries.reduce((sum, e) => sum + (e.metadata.confidence || 3), 0) / recentEntries.length
        : 3;

      const topAchievements = recentEntries
        .flatMap(e => e.achievements)
        .slice(0, 5);

      // Group goals by category
      const goalsByCategory = this.groupGoalsByCategory(goals);

      // Calculate weekly trends
      const weeklyTrends = await this.calculateWeeklyTrends(clientId);

      const dashboardData: ProgressDashboardData = {
        overview: {
          totalGoals: goals.length,
          activeGoals: activeGoals.length,
          completedGoals: completedGoals.length,
          overallCompletionRate: Math.round(overallCompletionRate),
          currentStreaks,
          totalMilestones: allMilestones.length,
          achievedMilestones: achievedMilestones.length
        },
        recentProgress,
        upcomingMilestones,
        goalsByCategory,
        motivationalInsights: {
          currentStreak: Math.max(...activeGoals.map(g => g.progressMetrics.streak || 0), 0),
          bestStreak: Math.max(...goals.map(g => g.progressMetrics.bestStreak || 0), 0),
          totalProgressEntries: allEntries.length,
          averageMood: Math.round(averageMood * 10) / 10,
          averageConfidence: Math.round(averageConfidence * 10) / 10,
          topAchievements,
          encouragementMessage: this.generateEncouragementMessage(overallCompletionRate, currentStreaks)
        },
        weeklyTrends
      };

      this.logger.log(`Generated dashboard data for client ${clientId}`);
      return dashboardData;

    } catch (error) {
      this.logger.error(`Failed to generate dashboard data for client ${clientId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get goals for a client with filtering options
   */
  async getGoals(
    clientId: string,
    filters: {
      status?: GoalStatus;
      type?: GoalType;
      categoryId?: string;
      priority?: string;
      search?: string;
    } = {}
  ): Promise<ClientGoal[]> {
    try {
      const where: FindOptionsWhere<ClientGoal> = { clientId };

      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.categoryId) where.categoryId = filters.categoryId;

      let query = this.goalRepository.createQueryBuilder('goal')
        .leftJoinAndSelect('goal.category', 'category')
        .leftJoinAndSelect('goal.progressEntries', 'entries')
        .leftJoinAndSelect('goal.milestones', 'milestones')
        .where('goal.clientId = :clientId', { clientId });

      if (filters.status) {
        query = query.andWhere('goal.status = :status', { status: filters.status });
      }

      if (filters.type) {
        query = query.andWhere('goal.type = :type', { type: filters.type });
      }

      if (filters.categoryId) {
        query = query.andWhere('goal.categoryId = :categoryId', { categoryId: filters.categoryId });
      }

      if (filters.search) {
        query = query.andWhere(
          '(goal.title ILIKE :search OR goal.description ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      const goals = await query
        .orderBy('goal.updatedAt', 'DESC')
        .getMany();

      return goals;

    } catch (error) {
      this.logger.error(`Failed to get goals for client ${clientId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get detailed analytics for a specific goal
   */
  async getGoalAnalytics(goalId: string, userId: string) {
    try {
      const goal = await this.goalRepository.findOne({
        where: { id: goalId },
        relations: ['progressEntries', 'milestones', 'category']
      });

      if (!goal) {
        throw new NotFoundException('Goal not found');
      }

      if (!goal.isVisibleTo(userId, 'client')) {
        throw new BadRequestException('User does not have permission to view this goal');
      }

      const entries = goal.progressEntries || [];
      const milestones = goal.milestones || [];

      // Calculate trends over time
      const progressOverTime = entries.map(entry => ({
        date: entry.entryDate,
        value: entry.progressData.value || 0,
        percentage: entry.progressData.percentageComplete || 0,
        mood: entry.metadata.mood || 3,
        confidence: entry.metadata.confidence || 3
      }));

      // Calculate patterns
      const patterns = {
        bestDaysOfWeek: this.analyzeDayPatterns(entries),
        moodCorrelation: this.analyzeMoodProgressCorrelation(entries),
        streakAnalysis: this.analyzeStreakPatterns(entries),
        challengeFrequency: this.analyzeChallengePatterns(entries)
      };

      return {
        goal,
        progressOverTime,
        patterns,
        milestones: milestones.map(m => ({
          ...m,
          progressTowards: m.getProgressTowardsNext(goal.progressMetrics.completionPercentage)
        })),
        predictions: {
          completionDate: goal.predictCompletionDate(),
          daysRemaining: goal.getDaysRemaining(),
          currentVelocity: goal.getProgressVelocity()
        }
      };

    } catch (error) {
      this.logger.error(`Failed to get goal analytics for ${goalId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Private helper methods

  private async createDefaultMilestones(goalId: string, categoryId: string): Promise<void> {
    try {
      const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
      if (!category) return;

      const defaultMilestones = category.generateDefaultMilestones(goalId);
      
      for (const milestoneData of defaultMilestones) {
        const milestone = new Milestone();
        milestone.goalId = goalId;
        milestone.title = milestoneData.title;
        milestone.description = milestoneData.description;
        milestone.progressThreshold = milestoneData.progressThreshold;
        milestone.milestoneType = milestoneData.milestoneType as any;
        milestone.rewardSettings = {
          enabled: false,
          rewardType: 'self-treat'
        };
        milestone.createdBy = 'system';

        await this.milestoneRepository.save(milestone);
      }
    } catch (error) {
      this.logger.error(`Failed to create default milestones: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getRecentProgressEntries(goalId: string, days: number): Promise<ProgressEntry[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.progressRepository.find({
      where: {
        goalId,
        entryDate: Between(cutoffDate, new Date())
      },
      order: { entryDate: 'DESC' }
    });
  }

  private calculateStreak(entries: ProgressEntry[]): number {
    if (entries.length === 0) return 0;

    let streak = 0;
    const sortedEntries = entries.sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime());
    
    for (const entry of sortedEntries) {
      if (entry.progressData.value && entry.progressData.value > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async checkMilestoneAchievements(goal: ClientGoal): Promise<Milestone[]> {
    const milestones = await this.milestoneRepository.find({
      where: { goalId: goal.id, isAchieved: false }
    });

    const achieved: Milestone[] = [];

    for (const milestone of milestones) {
      if (milestone.checkAchievement(goal.progressMetrics.completionPercentage)) {
        await this.milestoneRepository.save(milestone);
        achieved.push(milestone);
      }
    }

    return achieved;
  }

  private groupGoalsByCategory(goals: ClientGoal[]) {
    const groups = new Map<string, { goals: ClientGoal[]; total: number; completed: number }>();

    goals.forEach(goal => {
      const categoryName = goal.category?.name || 'Uncategorized';
      
      if (!groups.has(categoryName)) {
        groups.set(categoryName, { goals: [], total: 0, completed: 0 });
      }

      const group = groups.get(categoryName)!;
      group.goals.push(goal);
      group.total++;
      if (goal.status === 'completed') {
        group.completed++;
      }
    });

    return Array.from(groups.entries()).map(([category, data]) => ({
      category,
      count: data.total,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    }));
  }

  private async calculateWeeklyTrends(clientId: string) {
    // Implementation for weekly trend analysis
    // This would aggregate progress entries by week
    const weeks = [];
    const now = new Date();
    
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekEntries = await this.progressRepository.find({
        where: {
          createdBy: clientId,
          entryDate: Between(weekStart, weekEnd)
        }
      });

      const milestonesCompleted = await this.milestoneRepository.count({
        where: {
          createdBy: clientId,
          achievedDate: Between(weekStart, weekEnd)
        }
      });

      weeks.unshift({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        progressEntries: weekEntries.length,
        averageMood: weekEntries.length > 0 
          ? weekEntries.reduce((sum, e) => sum + (e.metadata.mood || 3), 0) / weekEntries.length
          : 3,
        completedMilestones: milestonesCompleted
      });
    }

    return weeks;
  }

  private generateEncouragementMessage(completionRate: number, streaks: number): string {
    if (completionRate >= 80) {
      return "Incredible progress! You're truly dedicated to your growth! 🌟";
    } else if (completionRate >= 60) {
      return "Great momentum! You're building strong habits for success! 🚀";
    } else if (completionRate >= 40) {
      return "Solid foundation! Every step forward is meaningful progress! 💪";
    } else if (streaks > 0) {
      return "Your consistency is paying off! Keep building those positive habits! 🌱";
    } else {
      return "Every journey begins with courage. You've already taken the first step! ✨";
    }
  }

  private analyzeDayPatterns(entries: ProgressEntry[]) {
    // Analyze which days of the week have most progress
    const dayCount = new Array(7).fill(0);
    entries.forEach(entry => {
      dayCount[entry.entryDate.getDay()]++;
    });
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map((day, index) => ({ day, count: dayCount[index] }))
      .sort((a, b) => b.count - a.count);
  }

  private analyzeMoodProgressCorrelation(entries: ProgressEntry[]) {
    // Analyze correlation between mood and progress
    const validEntries = entries.filter(e => e.metadata.mood && e.progressData.value);
    if (validEntries.length < 3) return null;
    
    // Simple correlation calculation
    const n = validEntries.length;
    const sumMood = validEntries.reduce((sum, e) => sum + e.metadata.mood!, 0);
    const sumProgress = validEntries.reduce((sum, e) => sum + e.progressData.value!, 0);
    const sumMoodProgress = validEntries.reduce((sum, e) => sum + (e.metadata.mood! * e.progressData.value!), 0);
    const sumMoodSq = validEntries.reduce((sum, e) => sum + (e.metadata.mood! ** 2), 0);
    const sumProgressSq = validEntries.reduce((sum, e) => sum + (e.progressData.value! ** 2), 0);
    
    const correlation = (n * sumMoodProgress - sumMood * sumProgress) / 
      Math.sqrt((n * sumMoodSq - sumMood ** 2) * (n * sumProgressSq - sumProgress ** 2));
    
    return isNaN(correlation) ? null : Math.round(correlation * 100) / 100;
  }

  private analyzeStreakPatterns(entries: ProgressEntry[]) {
    // Analyze streak patterns
    return {
      longestStreak: entries.reduce((max, entry) => 
        entry.progressData.streakContinued ? max + 1 : 0, 0),
      averageGapBetweenEntries: entries.length > 1 ? 
        (entries[0].entryDate.getTime() - entries[entries.length - 1].entryDate.getTime()) / 
        (1000 * 60 * 60 * 24 * (entries.length - 1)) : 0
    };
  }

  private analyzeChallengePatterns(entries: ProgressEntry[]) {
    // Analyze common challenges
    const challengeCount = new Map<string, number>();
    entries.forEach(entry => {
      entry.challenges.forEach(challenge => {
        challengeCount.set(challenge, (challengeCount.get(challenge) || 0) + 1);
      });
    });
    
    return Array.from(challengeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([challenge, count]) => ({ challenge, count }));
  }
}