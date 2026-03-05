import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

/**
 * API client for progress tracking and goal management
 * Follows existing pattern from appointments.ts
 */

export interface Goal {
  id: string;
  clientId: string;
  coachId?: string;
  title: string;
  description?: string;
  type: 'personal' | 'professional' | 'health' | 'relationship' | 'financial' | 'spiritual' | 'learning' | 'custom';
  categoryId?: string;
  measurementType: 'numeric' | 'boolean' | 'percentage' | 'checklist';
  targetDate?: Date | string;
  startDate: Date | string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  progressMetrics: {
    currentValue: number;
    targetValue?: number;
    unit?: string;
    completionPercentage: number;
    streak: number;
    bestStreak?: number;
    totalSessions?: number;
    averageProgress?: number;
    lastUpdated: Date | string;
  };
  tags?: string[];
  successCriteria?: string;
  motivationStatement?: string;
  strategies?: string[];
  settings: {
    reminderEnabled: boolean;
    reminderFrequency: 'daily' | 'weekly' | 'monthly';
    shareWithCoach: boolean;
    allowCoachEdits: boolean;
    visibilityLevel: 'private' | 'coach-only' | 'shared';
    celebrationEnabled?: boolean;
    motivationalQuotes?: boolean;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  type: Goal['type'];
  categoryId?: string;
  measurementType: Goal['measurementType'];
  targetDate?: Date | string;
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
  entryType?: 'progress' | 'setback' | 'milestone' | 'reflection' | 'coaching-note';
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

export interface ProgressEntry {
  id: string;
  goalId: string;
  entryType: 'progress' | 'setback' | 'milestone' | 'reflection' | 'coaching-note';
  entryDate: Date | string;
  notes: string;
  progressData: {
    value?: number;
    unit?: string;
    deltaFromPrevious?: number;
    percentageComplete?: number;
    streakContinued?: boolean;
    qualityScore?: number;
  };
  metadata: {
    mood?: number;
    confidence?: number;
    effortLevel?: number;
    timeSpent?: number;
  };
  achievements: string[];
  challenges: string[];
  lessonsLearned: string[];
  nextActions: string[];
  isSignificant: boolean;
  createdAt: Date | string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  milestoneType: 'checkpoint' | 'achievement' | 'breakthrough' | 'habit-formed' | 'challenge-overcome' | 'custom';
  targetDate?: Date | string;
  achievedDate?: Date | string;
  progressThreshold: number;
  isAchieved: boolean;
  isSignificant: boolean;
  celebrationData?: {
    style: 'private' | 'coach-shared' | 'community-shared' | 'family-shared';
    message?: string;
    shareWithCoach: boolean;
    shareWithFamily: boolean;
  };
  createdAt: Date | string;
}

export interface DashboardData {
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

export interface GoalAnalytics {
  goal: Goal;
  progressOverTime: Array<{
    date: Date | string;
    value: number;
    percentage: number;
    mood: number;
    confidence: number;
  }>;
  patterns: {
    bestDaysOfWeek: Array<{ day: string; count: number }>;
    moodCorrelation: number | null;
    streakAnalysis: {
      longestStreak: number;
      averageGapBetweenEntries: number;
    };
    challengeFrequency: Array<{ challenge: string; count: number }>;
  };
  milestones: Array<Milestone & { progressTowards: number }>;
  predictions: {
    completionDate: Date | string | null;
    daysRemaining: number | null;
    currentVelocity: number;
  };
}

export interface GetGoalsFilters {
  status?: Goal['status'];
  type?: Goal['type'];
  categoryId?: string;
  search?: string;
}

/**
 * Get all goals for the authenticated user
 */
export const getGoals = async (filters?: GetGoalsFilters): Promise<Goal[]> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getGoals', payload: filters });

  const params: any = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.type) params.type = filters.type;
  if (filters?.categoryId) params.categoryId = filters.categoryId;
  if (filters?.search) params.search = filters.search;

  const { data } = await apiClient.get<{ success: boolean; data: Goal[] }>('/progress/goals', {
    params,
    headers: { 'X-Trace-Id': traceId },
  });

  return data.data || [];
};

/**
 * Create a new goal
 */
export const createGoal = async (request: CreateGoalRequest): Promise<Goal> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'createGoal', payload: request });

  const { data } = await apiClient.post<{ success: boolean; data: Goal }>(
    '/progress/goals',
    request,
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data;
};

/**
 * Get a specific goal by ID
 */
export const getGoal = async (goalId: string): Promise<Goal> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getGoal', payload: { goalId } });

  const { data } = await apiClient.get<{ success: boolean; data: Goal }>(
    `/progress/goals/${goalId}`,
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data;
};

/**
 * Update progress on a goal
 */
export const updateProgress = async (
  goalId: string,
  request: UpdateProgressRequest
): Promise<{
  goal: Goal;
  entry: ProgressEntry;
  milestonesAchieved: Milestone[];
}> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'updateProgress', payload: { goalId, ...request } });

  const { data } = await apiClient.post<{
    success: boolean;
    data: {
      goal: Goal;
      entry: ProgressEntry;
      milestonesAchieved: Milestone[];
    };
  }>(`/progress/goals/${goalId}/progress`, request, {
    headers: { 'X-Trace-Id': traceId },
  });

  return data.data;
};

/**
 * Get detailed analytics for a goal
 */
export const getGoalAnalytics = async (goalId: string): Promise<GoalAnalytics> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getGoalAnalytics', payload: { goalId } });

  const { data } = await apiClient.get<{ success: boolean; data: GoalAnalytics }>(
    `/progress/goals/${goalId}/analytics`,
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data;
};

/**
 * Get progress entries for a goal
 */
export const getProgressEntries = async (
  goalId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ProgressEntry[]> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getProgressEntries', payload: { goalId, limit, offset } });

  const { data } = await apiClient.get<{ success: boolean; data: ProgressEntry[] }>(
    `/progress/goals/${goalId}/entries`,
    {
      params: { limit, offset },
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data || [];
};

/**
 * Get milestones for a goal
 */
export const getMilestones = async (goalId: string): Promise<Milestone[]> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getMilestones', payload: { goalId } });

  const { data } = await apiClient.get<{ success: boolean; data: Milestone[] }>(
    `/progress/goals/${goalId}/milestones`,
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data || [];
};

/**
 * Mark a milestone as achieved
 */
export const achieveMilestone = async (
  milestoneId: string,
  celebrationData?: any
): Promise<Milestone> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'achieveMilestone', payload: { milestoneId, celebrationData } });

  const { data } = await apiClient.put<{ success: boolean; data: Milestone }>(
    `/progress/milestones/${milestoneId}/achieve`,
    celebrationData || {},
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data;
};

/**
 * Get comprehensive dashboard data
 */
export const getDashboard = async (): Promise<DashboardData> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getDashboard' });

  const { data } = await apiClient.get<{ success: boolean; data: DashboardData }>(
    '/progress/dashboard',
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data;
};

/**
 * Get motivational insights
 */
export const getMotivationalInsights = async (): Promise<any> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getMotivationalInsights' });

  const { data } = await apiClient.get<{ success: boolean; data: any }>(
    '/progress/insights/motivation',
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data;
};

/**
 * Get shareable progress summary
 */
export const getShareableSummary = async (period: number = 30): Promise<any> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getShareableSummary', payload: { period } });

  const { data } = await apiClient.get<{ success: boolean; data: any }>(
    '/progress/share/summary',
    {
      params: { period: String(period) },
      headers: { 'X-Trace-Id': traceId },
    }
  );

  return data.data;
};
