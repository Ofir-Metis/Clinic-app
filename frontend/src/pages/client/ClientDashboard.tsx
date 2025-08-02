/**
 * ClientDashboard - Main hub for coaching clients
 * Shows progress, upcoming sessions, goals, and motivational content
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  LinearProgress,
  Stack,
  Chip,
  IconButton,
  Fab,
  useTheme,
  alpha,
  Skeleton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  AvatarGroup
} from '@mui/material';
import {
  TrendingUp as ProgressIcon,
  EmojiEvents as AchievementIcon,
  CalendarToday as CalendarIcon,
  Psychology as MindsetIcon,
  Add as AddIcon,
  Bookmark as GoalIcon,
  VideoCall as SessionIcon,
  Star as StarIcon,
  LocalFireDepartment as StreakIcon,
  AutoAwesome as SparkleIcon,
  Message as MessageIcon,
  Notifications as NotificationIcon,
  FilterList as FilterIcon,
  People as PeopleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface Coach {
  id: string;
  name: string;
  specialization: string;
  profileImage?: string;
  isActive: boolean;
  relationshipSince: string;
}

interface Session {
  id: string;
  title: string;
  date: Date;
  type: 'online' | 'in-person';
  coach: Coach;
  meetingUrl?: string;
  location?: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface ClientDashboardData {
  client: {
    name: string;
    joinDate: string;
    profileImage?: string;
  };
  coaches: Coach[];
  progress: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    currentStreak: number;
    overallProgress: number;
    weeklyProgress: number;
    progressByCoach: Record<string, {
      coachId: string;
      coachName: string;
      completedSessions: number;
      activeGoals: number;
      progress: number;
    }>;
  };
  upcomingSessions: Session[];
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    achievedDate: Date;
    icon: string;
    coachId?: string;
    coachName?: string;
  }>;
  motivationalMessage: string;
  quickStats: {
    totalSessions: number;
    goalsAchieved: number;
    daysActive: number;
    currentLevel: string;
    totalCoaches: number;
  };
}

const ClientDashboard: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering state
  const [selectedCoach, setSelectedCoach] = useState<string>('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('upcoming');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call
      const mockCoaches = [
        {
          id: '1',
          name: 'Dr. Emily Chen',
          specialization: 'Life & Wellness Coaching',
          isActive: true,
          relationshipSince: '2024-01-15'
        },
        {
          id: '2', 
          name: 'Marcus Rodriguez',
          specialization: 'Career & Leadership',
          isActive: true,
          relationshipSince: '2024-03-10'
        },
        {
          id: '3',
          name: 'Dr. Aisha Patel',
          specialization: 'Mindfulness & Stress Management',
          isActive: true,
          relationshipSince: '2024-02-20'
        }
      ];

      setTimeout(() => {
        setDashboardData({
          client: {
            name: "Sarah Johnson",
            joinDate: "2024-01-15",
            profileImage: "/api/placeholder/avatar"
          },
          coaches: mockCoaches,
          progress: {
            totalGoals: 12,
            completedGoals: 5,
            activeGoals: 7,
            currentStreak: 12,
            overallProgress: 68,
            weeklyProgress: 85,
            progressByCoach: {
              '1': {
                coachId: '1',
                coachName: 'Dr. Emily Chen',
                completedSessions: 8,
                activeGoals: 3,
                progress: 75
              },
              '2': {
                coachId: '2',
                coachName: 'Marcus Rodriguez',
                completedSessions: 4,
                activeGoals: 2,
                progress: 60
              },
              '3': {
                coachId: '3',
                coachName: 'Dr. Aisha Patel',
                completedSessions: 6,
                activeGoals: 2,
                progress: 70
              }
            }
          },
          upcomingSessions: [
            {
              id: '1',
              title: 'Weekly Check-in & Goal Review',
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              type: 'online',
              coach: mockCoaches[0],
              meetingUrl: 'https://meet.google.com/abc-def-ghi',
              duration: 60,
              status: 'scheduled'
            },
            {
              id: '2', 
              title: 'Career Strategy Session',
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              type: 'in-person',
              coach: mockCoaches[1],
              location: 'Downtown Office - Suite 402',
              duration: 90,
              status: 'scheduled'
            },
            {
              id: '3',
              title: 'Mindfulness Practice',
              date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              type: 'online',
              coach: mockCoaches[2],
              meetingUrl: 'https://meet.google.com/xyz-abc-def',
              duration: 45,
              status: 'scheduled'
            }
          ],
          recentAchievements: [
            {
              id: '1',
              title: '7-Day Meditation Streak',
              description: 'Completed daily meditation for a full week!',
              achievedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              icon: '🧘‍♀️',
              coachId: '3',
              coachName: 'Dr. Aisha Patel'
            },
            {
              id: '2',
              title: 'First Networking Event',
              description: 'Attended your first professional networking event',
              achievedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              icon: '🤝',
              coachId: '2',
              coachName: 'Marcus Rodriguez'
            },
            {
              id: '3',
              title: 'Health Goal Milestone',
              description: 'Reached your fitness target for the month!',
              achievedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              icon: '💪',
              coachId: '1',
              coachName: 'Dr. Emily Chen'
            }
          ],
          motivationalMessage: t.clientPortal.dashboard.motivationalMessages[Math.floor(Math.random() * t.clientPortal.dashboard.motivationalMessages.length)],
          quickStats: {
            totalSessions: 18,
            goalsAchieved: 5,
            daysActive: 75,
            currentLevel: t.clientPortal.dashboard.levels.multiCoachChampion,
            totalCoaches: 3
          }
        });
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError(t.errors.general);
      setIsLoading(false);
    }
  };

  // Filtering functions
  const filteredSessions = dashboardData?.upcomingSessions.filter(session => {
    const coachMatch = selectedCoach === 'all' || session.coach.id === selectedCoach;
    const typeMatch = sessionTypeFilter === 'all' || session.type === sessionTypeFilter;
    const dateMatch = dateFilter === 'upcoming' || 
      (dateFilter === 'this-week' && session.date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'this-month' && session.date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    
    return coachMatch && typeMatch && dateMatch;
  }) || [];

  const filteredAchievements = dashboardData?.recentAchievements.filter(achievement => {
    return selectedCoach === 'all' || achievement.coachId === selectedCoach;
  }) || [];

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
          <Grid container spacing={3}>
            {[...Array(4)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
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
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error || t.errors.general}
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
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Welcome Header */}
        <Card
          sx={{
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    fontSize: '2rem'
                  }}
                >
                  {dashboardData.client.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
              </Grid>
              <Grid item flex={1}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {t.clientPortal.dashboard.welcome.replace('{name}', dashboardData.client.name)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    {t.clientPortal.dashboard.workingWith.replace('{count}', dashboardData.coaches.length.toString())}
                  </Typography>
                  <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.8rem' } }}>
                    {dashboardData.coaches.map((coach) => (
                      <Tooltip key={coach.id} title={`${coach.name} - ${coach.specialization}`}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {coach.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<StreakIcon />}
                    label={t.clientPortal.dashboard.dayStreak.replace('{days}', dashboardData.progress.currentStreak.toString())}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip 
                    icon={<StarIcon />}
                    label={dashboardData.quickStats.currentLevel}
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip 
                    icon={<PeopleIcon />}
                    label={`${dashboardData.quickStats.totalCoaches} ${t.clientPortal.dashboard.coaches}`}
                    color="info"
                    variant="outlined"
                  />
                </Box>
              </Grid>
              <Grid item>
                <Stack direction="row" spacing={1}>
                  <IconButton 
                    color="primary"
                    sx={{ 
                      background: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': { background: alpha(theme.palette.primary.main, 0.2) }
                    }}
                  >
                    <MessageIcon />
                  </IconButton>
                  <IconButton 
                    color="primary"
                    sx={{ 
                      background: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': { background: alpha(theme.palette.primary.main, 0.2) }
                    }}
                  >
                    <NotificationIcon />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Motivational Message */}
        <Card
          sx={{
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.1)} 100%)`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <SparkleIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {dashboardData.motivationalMessage}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keep going - you're building something amazing! 🚀
            </Typography>
          </CardContent>
        </Card>

        {/* Filtering Controls */}
        <Card
          sx={{
            mb: 4,
            background: alpha(theme.palette.background.paper, 0.85),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FilterIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t.clientPortal.dashboard.filterView}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t.clientPortal.dashboard.coach}</InputLabel>
                  <Select
                    value={selectedCoach}
                    label={t.clientPortal.dashboard.coach}
                    onChange={(e) => setSelectedCoach(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">{t.clientPortal.dashboard.allCoaches}</MenuItem>
                    {dashboardData.coaches.map((coach) => (
                      <MenuItem key={coach.id} value={coach.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
                            {coach.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          {coach.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t.clientPortal.dashboard.sessionType}</InputLabel>
                  <Select
                    value={sessionTypeFilter}
                    label={t.clientPortal.dashboard.sessionType}
                    onChange={(e) => setSessionTypeFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">{t.clientPortal.dashboard.allTypes}</MenuItem>
                    <MenuItem value="online">{t.clientPortal.dashboard.onlineSessions}</MenuItem>
                    <MenuItem value="in-person">{t.clientPortal.dashboard.inPersonSessions}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t.clientPortal.dashboard.timePeriod}</InputLabel>
                  <Select
                    value={dateFilter}
                    label={t.clientPortal.dashboard.timePeriod}
                    onChange={(e) => setDateFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="upcoming">{t.clientPortal.dashboard.upcoming}</MenuItem>
                    <MenuItem value="this-week">{t.clientPortal.dashboard.thisWeek}</MenuItem>
                    <MenuItem value="this-month">{t.clientPortal.dashboard.thisMonth}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Chip
                    label={t.clientPortal.dashboard.sessionsFound.replace('{count}', filteredSessions.length.toString())}
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.9rem', py: 2 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2,
              background: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3
            }}>
              <SessionIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {dashboardData.quickStats.totalSessions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.clientPortal.dashboard.totalSessions}
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2,
              background: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3
            }}>
              <AchievementIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {dashboardData.quickStats.goalsAchieved}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.clientPortal.dashboard.goalsAchieved}
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2,
              background: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3
            }}>
              <StreakIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {dashboardData.progress.currentStreak}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.clientPortal.dashboard.dayStreakLabel}
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2,
              background: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3
            }}>
              <PeopleIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {dashboardData.quickStats.totalCoaches}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.clientPortal.dashboard.activeCoaches}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Progress Overview */}
            <Card
              sx={{
                mb: 4,
                background: alpha(theme.palette.background.paper, 0.85),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProgressIcon color="primary" />
                  {t.clientPortal.dashboard.progressJourney}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t.clientPortal.dashboard.overallProgress}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.progress.overallProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.progress.overallProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                      }
                    }}
                  />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {dashboardData.progress.activeGoals}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.clientPortal.dashboard.activeGoals}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {dashboardData.progress.completedGoals}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.clientPortal.dashboard.completed}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                        {dashboardData.progress.weeklyProgress}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.clientPortal.dashboard.thisWeekProgress}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card
              sx={{
                background: alpha(theme.palette.background.paper, 0.85),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AchievementIcon color="secondary" />
                  {t.clientPortal.dashboard.recentAchievements}
                </Typography>
                
                <Stack spacing={2}>
                  {filteredAchievements.length > 0 ? (
                    filteredAchievements.map((achievement) => (
                      <Card
                        key={achievement.id}
                        sx={{
                          background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          borderRadius: 2
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h4">{achievement.icon}</Typography>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {achievement.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {achievement.description}
                              </Typography>
                              {achievement.coachName && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem', bgcolor: 'success.main' }}>
                                    {achievement.coachName.split(' ').map(n => n[0]).join('')}
                                  </Avatar>
                                  <Typography variant="caption" color="text.secondary">
                                    {t.clientPortal.dashboard.with} {achievement.coachName}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {achievement.achievedDate.toLocaleDateString()}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <AchievementIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1">
                        {t.clientPortal.dashboard.noAchievements}
                      </Typography>
                      <Typography variant="body2">
                        {t.clientPortal.dashboard.selectAllCoaches}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            {/* Upcoming Sessions */}
            <Card
              sx={{
                mb: 3,
                background: alpha(theme.palette.background.paper, 0.85),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon color="primary" />
                  {t.clientPortal.dashboard.upcomingSessions}
                </Typography>
                
                <Stack spacing={2}>
                  {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <Card
                        key={session.id}
                        sx={{
                          background: alpha(theme.palette.primary.light, 0.05),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: alpha(theme.palette.primary.light, 0.1),
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'secondary.main' }}>
                              {session.coach.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {session.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={session.type === 'online' ? '🌐 Online' : '🏢 In-Person'}
                              sx={{ ml: 'auto', fontSize: '0.7rem' }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {session.date.toLocaleDateString()} • {session.duration} min
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {t.clientPortal.dashboard.with} {session.coach.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {session.coach.specialization}
                          </Typography>
                          {session.location && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              📍 {session.location}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <CalendarIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1">
                        {t.clientPortal.dashboard.noSessionsMatch}
                      </Typography>
                      <Typography variant="body2">
                        {t.clientPortal.dashboard.tryAdjusting}
                      </Typography>
                    </Box>
                  )}
                </Stack>
                
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2, borderRadius: 2 }}
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/client/appointments')}
                >
                  {t.clientPortal.dashboard.viewAllSessions}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card
              sx={{
                background: alpha(theme.palette.background.paper, 0.85),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  {t.clientPortal.dashboard.quickActions}
                </Typography>
                
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<GoalIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                      }
                    }}
                  >
                    {t.clientPortal.dashboard.setNewGoal}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ProgressIcon />}
                    sx={{ borderRadius: 2, py: 1.5 }}
                  >
                    {t.clientPortal.dashboard.viewProgress}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MessageIcon />}
                    sx={{ borderRadius: 2, py: 1.5 }}
                  >
                    {t.clientPortal.dashboard.messageCoach}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              transform: 'scale(1.1)'
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Box>
  );
};

export default ClientDashboard;