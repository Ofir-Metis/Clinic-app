/**
 * ProgressDashboard - Main dashboard for client progress tracking
 * Displays goals, milestones, trends, and motivational insights
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Button,
  Stack,
  Alert,
  Skeleton,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as StreakIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Celebration as CelebrationIcon,
  Psychology as InsightIcon,
  Target as TargetIcon,
  Star as StarIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';
import { ProgressOverviewCard } from './ProgressOverviewCard';
import { GoalCard } from './GoalCard';
import { MilestoneCard } from './MilestoneCard';
import { ProgressChart } from './ProgressChart';
import { MotivationalInsights } from './MotivationalInsights';

interface ProgressDashboardData {
  overview: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    overallCompletionRate: number;
    currentStreaks: number;
    totalMilestones: number;
    achievedMilestones: number;
  };
  recentProgress: any[];
  upcomingMilestones: any[];
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

interface ProgressDashboardProps {
  onCreateGoal: () => void;
  onGoalClick: (goalId: string) => void;
  onMilestoneClick: (milestoneId: string) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  onCreateGoal,
  onGoalClick,
  onMilestoneClick
}) => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState<ProgressDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Mock API call - replace with actual API
      const response = await fetch('/api/progress/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
        
        // Show celebration if new milestones achieved
        if (result.data.overview.achievedMilestones > 0 && !refresh) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      
      // Mock data for development
      setDashboardData({
        overview: {
          totalGoals: 5,
          activeGoals: 3,
          completedGoals: 2,
          overallCompletionRate: 65,
          currentStreaks: 12,
          totalMilestones: 15,
          achievedMilestones: 8
        },
        recentProgress: [],
        upcomingMilestones: [
          {
            id: '1',
            title: 'Complete 30-day meditation streak',
            daysUntilTarget: 5,
            progressThreshold: 80,
            currentProgress: 75
          },
          {
            id: '2',
            title: 'Finish online course',
            daysUntilTarget: 12,
            progressThreshold: 100,
            currentProgress: 85
          }
        ],
        goalsByCategory: [
          { category: 'Wellness', count: 2, completionRate: 75 },
          { category: 'Learning', count: 2, completionRate: 60 },
          { category: 'Habits', count: 1, completionRate: 50 }
        ],
        motivationalInsights: {
          currentStreak: 7,
          bestStreak: 15,
          totalProgressEntries: 42,
          averageMood: 4.2,
          averageConfidence: 3.8,
          topAchievements: [
            'Completed first week of morning routine',
            'Finished reading chapter 3',
            'Meditated for 20 minutes'
          ],
          encouragementMessage: "You're building incredible momentum! Keep going! 🌟"
        },
        weeklyTrends: [
          { week: '1/15', progressEntries: 5, averageMood: 4.0, completedMilestones: 1 },
          { week: '1/22', progressEntries: 7, averageMood: 4.2, completedMilestones: 2 },
          { week: '1/29', progressEntries: 6, averageMood: 3.8, completedMilestones: 0 },
          { week: '2/5', progressEntries: 8, averageMood: 4.5, completedMilestones: 1 }
        ]
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handleShare = () => {
    // Implement sharing functionality
    console.log('Share progress dashboard');
  };

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
          <Grid container spacing={3}>
            {[...Array(4)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
        </Stack>
      </Box>
    );
  }

  if (error || !dashboardData) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Alert 
          severity="error"
          action={
            <Button onClick={() => loadDashboardData()} size="small">
              Retry
            </Button>
          }
          sx={{
            borderRadius: 3,
            '& .MuiAlert-message': { fontSize: '1rem' }
          }}
        >
          {error || 'Failed to load dashboard data'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      {/* Celebration Animation */}
      <Fade in={showCelebration}>
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            textAlign: 'center',
            animation: 'bounce 1s infinite'
          }}
        >
          <CelebrationIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 2 }} />
          <Typography variant="h4" fontWeight={700} color="primary">
            Milestone Achieved! 🎉
          </Typography>
        </Box>
      </Fade>

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          fontWeight={700} 
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Your Growth Journey
        </Typography>
        
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Track your progress, celebrate milestones, and stay motivated
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateGoal}
            sx={{
              borderRadius: 3,
              px: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
              }
            }}
          >
            New Goal
          </Button>
          
          <IconButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(20px)',
              '&:hover': {
                background: alpha(theme.palette.background.paper, 0.9),
                transform: 'translateY(-1px)'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
          
          <IconButton
            onClick={handleShare}
            sx={{
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(20px)',
              '&:hover': {
                background: alpha(theme.palette.background.paper, 0.9),
                transform: 'translateY(-1px)'
              }
            }}
          >
            <ShareIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Motivational Message */}
      <Card
        sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 3,
          textAlign: 'center'
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <SparkleIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
          <Typography variant="h5" fontWeight={600} color="primary" sx={{ mb: 1 }}>
            {dashboardData.motivationalInsights.encouragementMessage}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You've logged {dashboardData.motivationalInsights.totalProgressEntries} progress entries
            {dashboardData.motivationalInsights.currentStreak > 0 && 
              ` with a ${dashboardData.motivationalInsights.currentStreak}-day streak! 🔥`
            }
          </Typography>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressOverviewCard
            title="Active Goals"
            value={dashboardData.overview.activeGoals}
            total={dashboardData.overview.totalGoals}
            icon={TargetIcon}
            color={theme.palette.primary.main}
            trend="stable"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <ProgressOverviewCard
            title="Completed"
            value={dashboardData.overview.completedGoals}
            total={dashboardData.overview.totalGoals}
            icon={TrophyIcon}
            color={theme.palette.success.main}
            trend="improving"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <ProgressOverviewCard
            title="Current Streak"
            value={dashboardData.motivationalInsights.currentStreak}
            subtitle="days"
            icon={StreakIcon}
            color={theme.palette.warning.main}
            trend="stable"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <ProgressOverviewCard
            title="Milestones"
            value={dashboardData.overview.achievedMilestones}
            total={dashboardData.overview.totalMilestones}
            icon={StarIcon}
            color={theme.palette.secondary.main}
            trend="improving"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Progress Chart */}
          <Card
            sx={{
              mb: 4,
              background: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TimelineIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="h6" fontWeight={600}>
                  Weekly Progress Trends
                </Typography>
              </Box>
              <ProgressChart data={dashboardData.weeklyTrends} />
            </CardContent>
          </Card>

          {/* Goals by Category */}
          <Card
            sx={{
              background: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Goals by Category
              </Typography>
              
              <Grid container spacing={2}>
                {dashboardData.goalsByCategory.map((category, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: alpha(theme.palette.grey[100], 0.5),
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: alpha(theme.palette.primary.light, 0.1),
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} color="primary">
                        {category.count}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {category.category}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={category.completionRate}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: alpha(theme.palette.grey[300], 0.3),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {category.completionRate}% complete
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Motivational Insights */}
          <MotivationalInsights
            data={dashboardData.motivationalInsights}
            sx={{ mb: 3 }}
          />

          {/* Upcoming Milestones */}
          <Card
            sx={{
              background: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Upcoming Milestones
              </Typography>
              
              <Stack spacing={2}>
                {dashboardData.upcomingMilestones.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No upcoming milestones. Create a goal to get started! 🌱
                  </Typography>
                ) : (
                  dashboardData.upcomingMilestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onClick={() => onMilestoneClick(milestone.id)}
                    />
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};