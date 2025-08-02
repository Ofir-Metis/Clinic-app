/**
 * ClientAchievements - Achievement tracking system with milestone celebrations
 * Gamified progress tracking, badges, streaks, and celebration system for coaching clients
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
  Stack,
  Chip,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  Alert,
  Zoom,
  Fade,
  AvatarGroup,
  TextField,
  MenuItem
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  MilitaryTech as BadgeIcon,
  LocalFireDepartment as StreakIcon,
  TrendingUp as ProgressIcon,
  Star as StarIcon,
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as IncompleteIcon,
  Celebration as CelebrationIcon,
  Timeline as TimelineIcon,
  Psychology as MindsetIcon,
  FitnessCenter as FitnessIcon,
  Work as CareerIcon,
  Favorite as RelationshipIcon,
  AccountBalance as FinanceIcon,
  School as LearningIcon,
  Spa as WellnessIcon,
  Group as SocialIcon,
  Lightbulb as CreativityIcon,
  Explore as AdventureIcon,
  Lock as LockedIcon,
  LockOpen as UnlockedIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'health' | 'career' | 'relationships' | 'finance' | 'learning' | 'mindset';
  type: 'milestone' | 'streak' | 'breakthrough' | 'consistency' | 'growth';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  points: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  requirements: string[];
  relatedGoals: string[];
  celebrationData?: {
    confettiColors: string[];
    celebrationMessage: string;
    shareableImage?: string;
  };
  coaches: string[]; // Coach IDs who contributed to this achievement
  nextLevel?: {
    id: string;
    title: string;
    requirements: string[];
  };
}

interface StreakData {
  id: string;
  title: string;
  description: string;
  category: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  isActive: boolean;
  streakMilestones: {
    days: number;
    reward: string;
    isUnlocked: boolean;
  }[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: Date;
  completedAt?: Date;
  isCompleted: boolean;
  progress: number; // 0-100
  subMilestones: {
    id: string;
    title: string;
    isCompleted: boolean;
    completedAt?: Date;
  }[];
  celebrationTriggered: boolean;
  coachNotified: boolean;
}

interface Level {
  id: string;
  title: string;
  level: number;
  pointsRequired: number;
  pointsToNext: number;
  benefits: string[];
  badgeIcon: string;
  color: string;
}

enum TabValue {
  ACHIEVEMENTS = 0,
  STREAKS = 1,
  MILESTONES = 2,
  LEVEL_PROGRESS = 3
}

const ClientAchievements: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState<TabValue>(TabValue.ACHIEVEMENTS);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streaksData, setStreaksData] = useState<StreakData[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog and animation states
  const [showCelebrationDialog, setShowCelebrationDialog] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Statistics
  const [stats, setStats] = useState({
    totalPoints: 0,
    unlockedAchievements: 0,
    totalAchievements: 0,
    activeStreaks: 0,
    completedMilestones: 0,
    currentLevel: 1,
    nextLevelProgress: 0
  });

  useEffect(() => {
    loadAchievementData();
  }, []);

  const loadAchievementData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API calls
      const mockAchievements: Achievement[] = [
        {
          id: 'ach1',
          title: 'First Steps',
          description: 'Completed your first coaching session and started your journey',
          category: 'personal',
          type: 'milestone',
          difficulty: 'bronze',
          icon: '🌱',
          points: 50,
          unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          isUnlocked: true,
          progress: { current: 1, target: 1, unit: 'sessions' },
          requirements: ['Complete first coaching session'],
          relatedGoals: [],
          coaches: ['coach1'],
          celebrationData: {
            confettiColors: ['#4CAF50', '#8BC34A', '#CDDC39'],
            celebrationMessage: 'Welcome to your growth journey! 🌟'
          }
        },
        {
          id: 'ach2',
          title: 'Consistency Champion',
          description: 'Maintained a 7-day streak of daily activities',
          category: 'mindset',
          type: 'streak',
          difficulty: 'silver',
          icon: '🔥',
          points: 100,
          unlockedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          isUnlocked: true,
          progress: { current: 7, target: 7, unit: 'days' },
          requirements: ['Complete daily activities for 7 consecutive days'],
          relatedGoals: ['goal1'],
          coaches: ['coach2'],
          celebrationData: {
            confettiColors: ['#FF9800', '#FF5722', '#FFC107'],
            celebrationMessage: 'Consistency is the key to transformation! 🔥'
          }
        },
        {
          id: 'ach3',
          title: 'Health Hero',
          description: 'Reached your first major fitness milestone',
          category: 'health',
          type: 'milestone',
          difficulty: 'gold',
          icon: '💪',
          points: 200,
          unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isUnlocked: true,
          progress: { current: 1, target: 1, unit: 'milestone' },
          requirements: ['Complete 5K run', 'Maintain exercise routine for 30 days'],
          relatedGoals: ['goal2'],
          coaches: ['coach1'],
          celebrationData: {
            confettiColors: ['#2196F3', '#03DAC6', '#00BCD4'],
            celebrationMessage: 'Your dedication to health is inspiring! 💪'
          }
        },
        {
          id: 'ach4',
          title: 'Wisdom Seeker',
          description: 'Complete 30 days of mindfulness practice',
          category: 'mindset',
          type: 'consistency',
          difficulty: 'gold',
          icon: '🧘‍♀️',
          points: 150,
          isUnlocked: false,
          progress: { current: 22, target: 30, unit: 'days' },
          requirements: ['Daily meditation for 30 days', 'Complete mindfulness course'],
          relatedGoals: ['goal3'],
          coaches: ['coach2'],
          nextLevel: {
            id: 'ach4_2',
            title: 'Zen Master',
            requirements: ['90 days of consistent practice', 'Guide others in meditation']
          }
        },
        {
          id: 'ach5',
          title: 'Career Catalyst',
          description: 'Achieve a major career breakthrough',
          category: 'career',
          type: 'breakthrough',
          difficulty: 'platinum',
          icon: '🚀',
          points: 300,
          isUnlocked: false,
          progress: { current: 3, target: 5, unit: 'breakthroughs' },
          requirements: ['Complete career assessment', 'Apply to 10 positions', 'Get 2 job offers', 'Negotiate salary increase', 'Start new role'],
          relatedGoals: ['goal4'],
          coaches: ['coach1']
        }
      ];

      const mockStreaks: StreakData[] = [
        {
          id: 'streak1',
          title: 'Daily Reflection',
          description: 'Consistent journaling and self-reflection practice',
          category: 'mindset',
          currentStreak: 15,
          longestStreak: 23,
          lastActivityDate: new Date(),
          isActive: true,
          streakMilestones: [
            { days: 7, reward: '🌟 Reflection Rookie', isUnlocked: true },
            { days: 14, reward: '📝 Journal Journeyer', isUnlocked: true },
            { days: 30, reward: '🏆 Wisdom Writer', isUnlocked: false },
            { days: 60, reward: '🎭 Soul Storyteller', isUnlocked: false },
            { days: 100, reward: '📚 Reflection Master', isUnlocked: false }
          ]
        },
        {
          id: 'streak2',
          title: 'Fitness Routine',
          description: 'Regular exercise and physical activity',
          category: 'health',
          currentStreak: 8,
          longestStreak: 12,
          lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          isActive: false,
          streakMilestones: [
            { days: 7, reward: '💪 Fitness Starter', isUnlocked: true },
            { days: 21, reward: '🏃‍♀️ Exercise Explorer', isUnlocked: false },
            { days: 50, reward: '🏋️‍♂️ Strength Seeker', isUnlocked: false },
            { days: 100, reward: '🏆 Fitness Champion', isUnlocked: false }
          ]
        }
      ];

      const mockMilestones: Milestone[] = [
        {
          id: 'milestone1',
          title: '90-Day Transformation Challenge',
          description: 'Complete a comprehensive 90-day personal development program',
          category: 'personal',
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isCompleted: false,
          progress: 67,
          subMilestones: [
            { id: 'sub1', title: 'Complete coaching intake', isCompleted: true, completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
            { id: 'sub2', title: 'Set 3 SMART goals', isCompleted: true, completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
            { id: 'sub3', title: 'Complete month 1 review', isCompleted: true, completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
            { id: 'sub4', title: 'Achieve first major goal', isCompleted: false },
            { id: 'sub5', title: 'Complete final assessment', isCompleted: false }
          ],
          celebrationTriggered: false,
          coachNotified: true
        }
      ];

      const mockLevel: Level = {
        id: 'level3',
        title: 'Growth Enthusiast',
        level: 3,
        pointsRequired: 500,
        pointsToNext: 150,
        benefits: [
          'Unlock advanced goal templates',
          'Access to exclusive coaching resources',
          'Priority booking for coaching sessions',
          'Progress analytics dashboard'
        ],
        badgeIcon: '🌟',
        color: '#4CAF50'
      };

      const mockStats = {
        totalPoints: 350,
        unlockedAchievements: 3,
        totalAchievements: 5,
        activeStreaks: 1,
        completedMilestones: 0,
        currentLevel: 3,
        nextLevelProgress: 70
      };

      setAchievements(mockAchievements);
      setStreaksData(mockStreaks);
      setMilestones(mockMilestones);
      setCurrentLevel(mockLevel);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load achievement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAchievementClick = (achievement: Achievement) => {
    if (achievement.isUnlocked) {
      setSelectedAchievement(achievement);
      setShowCelebrationDialog(true);
      if (achievement.celebrationData) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getDifficultyColor = (difficulty: Achievement['difficulty']) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF'
    };
    return colors[difficulty];
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    const icons = {
      personal: <MindsetIcon />,
      health: <FitnessIcon />,
      career: <CareerIcon />,
      relationships: <RelationshipIcon />,
      finance: <FinanceIcon />,
      learning: <LearningIcon />,
      mindset: <WellnessIcon />
    };
    return icons[category] || <StarIcon />;
  };

  const renderLevelProgress = () => (
    <Stack spacing={4}>
      {currentLevel && (
        <Card
          sx={{
            background: `linear-gradient(135deg, ${alpha(currentLevel.color, 0.1)} 0%, ${alpha(currentLevel.color, 0.05)} 100%)`,
            border: `2px solid ${alpha(currentLevel.color, 0.3)}`,
            borderRadius: 4
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: '2.5rem',
                bgcolor: currentLevel.color,
                mx: 'auto',
                mb: 2
              }}
            >
              {currentLevel.badgeIcon}
            </Avatar>
            
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Level {currentLevel.level}
            </Typography>
            
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: currentLevel.color }}>
              {currentLevel.title}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress to Next Level
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {stats.totalPoints} / {currentLevel.pointsRequired + currentLevel.pointsToNext} XP
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.nextLevelProgress}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: alpha(currentLevel.color, 0.2),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    background: `linear-gradient(90deg, ${currentLevel.color} 0%, ${alpha(currentLevel.color, 0.7)} 100%)`
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {currentLevel.pointsToNext} XP needed for next level
              </Typography>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Level Benefits:
            </Typography>
            <Stack spacing={1}>
              {currentLevel.benefits.map((benefit, index) => (
                <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: '1rem' }} />
                  {benefit}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Level Statistics */}
      <Grid container spacing={3}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <TrophyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {stats.totalPoints}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total XP
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <BadgeIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {stats.unlockedAchievements}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Achievements
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <StreakIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
              {stats.activeStreaks}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active Streaks
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <CompleteIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {stats.completedMilestones}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Milestones
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );

  const renderAchievements = () => {
    const filteredAchievements = achievements.filter(achievement => {
      const categoryMatch = categoryFilter === 'all' || achievement.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'unlocked' && achievement.isUnlocked) ||
        (statusFilter === 'locked' && !achievement.isUnlocked);
      return categoryMatch && statusMatch;
    });

    const groupedAchievements = filteredAchievements.reduce((groups, achievement) => {
      const category = achievement.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(achievement);
      return groups;
    }, {} as Record<string, Achievement[]>);

    return (
      <Stack spacing={3}>
        {/* Filters */}
        <Card sx={{ background: alpha(theme.palette.background.paper, 0.8), borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FilterIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filter Achievements
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="personal">🧠 Personal</MenuItem>
                  <MenuItem value="health">💪 Health</MenuItem>
                  <MenuItem value="career">💼 Career</MenuItem>
                  <MenuItem value="mindset">🧘 Mindset</MenuItem>
                  <MenuItem value="relationships">❤️ Relationships</MenuItem>
                  <MenuItem value="learning">📚 Learning</MenuItem>
                  <MenuItem value="finance">💰 Finance</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Achievements</MenuItem>
                  <MenuItem value="unlocked">🏆 Unlocked</MenuItem>
                  <MenuItem value="locked">🔒 Locked</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="points">Highest Points</MenuItem>
                  <MenuItem value="difficulty">Difficulty</MenuItem>
                  <MenuItem value="progress">Progress</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Achievement Groups */}
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
          <Card key={category} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.05) }
                }}
                onClick={() => toggleCategoryExpansion(category)}
              >
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {getCategoryIcon(category as Achievement['category'])}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {category} Achievements
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {categoryAchievements.filter(a => a.isUnlocked).length} of {categoryAchievements.length} unlocked
                  </Typography>
                </Box>
                <Badge
                  badgeContent={categoryAchievements.filter(a => a.isUnlocked).length}
                  color="primary"
                  sx={{ mr: 2 }}
                >
                  <TrophyIcon />
                </Badge>
                {expandedCategories.includes(category) ? <CollapseIcon /> : <ExpandIcon />}
              </Box>

              <Collapse in={expandedCategories.includes(category)}>
                <Divider />
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {categoryAchievements.map(achievement => (
                      <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                        <Card
                          sx={{
                            cursor: achievement.isUnlocked ? 'pointer' : 'default',
                            opacity: achievement.isUnlocked ? 1 : 0.6,
                            transition: 'all 0.3s ease',
                            border: `2px solid ${achievement.isUnlocked ? getDifficultyColor(achievement.difficulty) : 'transparent'}`,
                            '&:hover': achievement.isUnlocked ? {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 24px ${alpha(getDifficultyColor(achievement.difficulty), 0.3)}`
                            } : {}
                          }}
                          onClick={() => handleAchievementClick(achievement)}
                        >
                          <CardContent sx={{ p: 3, textAlign: 'center' }}>
                            <Box sx={{ position: 'relative', mb: 2 }}>
                              <Typography variant="h2" sx={{ mb: 1 }}>
                                {achievement.icon}
                              </Typography>
                              {!achievement.isUnlocked && (
                                <LockedIcon
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    color: 'text.disabled'
                                  }}
                                />
                              )}
                            </Box>
                            
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {achievement.title}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {achievement.description}
                            </Typography>

                            <Chip
                              label={achievement.difficulty}
                              size="small"
                              sx={{
                                bgcolor: alpha(getDifficultyColor(achievement.difficulty), 0.2),
                                color: getDifficultyColor(achievement.difficulty),
                                fontWeight: 600,
                                mb: 2
                              }}
                            />

                            {!achievement.isUnlocked && (
                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Progress
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {achievement.progress.current}/{achievement.progress.target} {achievement.progress.unit}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={(achievement.progress.current / achievement.progress.target) * 100}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: alpha(getDifficultyColor(achievement.difficulty), 0.2),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      bgcolor: getDifficultyColor(achievement.difficulty)
                                    }
                                  }}
                                />
                              </Box>
                            )}

                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {achievement.points} XP
                            </Typography>

                            {achievement.isUnlocked && achievement.unlockedAt && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Unlocked {achievement.unlockedAt.toLocaleDateString()}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))}

        {filteredAchievements.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <TrophyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No achievements found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or start working on new goals
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    );
  };

  const renderStreaks = () => (
    <Stack spacing={3}>
      {streaksData.map(streak => (
        <Card
          key={streak.id}
          sx={{
            borderRadius: 3,
            border: streak.isActive ? `2px solid ${theme.palette.error.main}` : `1px solid ${alpha(theme.palette.divider, 0.2)}`
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: streak.isActive ? 'error.main' : 'grey.400',
                  mr: 2,
                  width: 60,
                  height: 60
                }}
              >
                <StreakIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {streak.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {streak.description}
                </Typography>
                <Chip
                  label={streak.isActive ? 'Active' : 'Broken'}
                  color={streak.isActive ? 'error' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: streak.isActive ? 'error.main' : 'text.secondary' }}>
                  {streak.currentStreak}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Current Streak
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {streak.longestStreak}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Longest Streak
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {streak.lastActivityDate.toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last Activity
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Streak Milestones:
            </Typography>
            
            <Grid container spacing={2}>
              {streak.streakMilestones.map((milestone, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: milestone.isUnlocked ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.grey[300], 0.1),
                      border: milestone.isUnlocked ? `1px solid ${theme.palette.success.main}` : `1px solid ${alpha(theme.palette.divider, 0.2)}`
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {milestone.days} Days
                    </Typography>
                    <Typography variant="body2" color={milestone.isUnlocked ? 'success.main' : 'text.secondary'}>
                      {milestone.reward}
                    </Typography>
                    {milestone.isUnlocked ? (
                      <CheckCircle sx={{ color: 'success.main', mt: 1 }} />
                    ) : (
                      <IncompleteIcon sx={{ color: 'text.disabled', mt: 1 }} />
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const renderMilestones = () => (
    <Stack spacing={3}>
      {milestones.map(milestone => (
        <Card key={milestone.id} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: milestone.isCompleted ? 'success.main' : 'primary.main',
                  mr: 2,
                  width: 60,
                  height: 60
                }}
              >
                {milestone.isCompleted ? <CompleteIcon sx={{ fontSize: 30 }} /> : <TimelineIcon sx={{ fontSize: 30 }} />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {milestone.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {milestone.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Target: {milestone.targetDate.toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {milestone.progress}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Complete
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={milestone.progress}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`
                  }
                }}
              />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Progress Steps:
            </Typography>
            
            <Stepper orientation="vertical">
              {milestone.subMilestones.map((subMilestone, index) => (
                <Step key={subMilestone.id} active={!subMilestone.isCompleted} completed={subMilestone.isCompleted}>
                  <StepLabel>
                    <Typography variant="body1" sx={{ fontWeight: subMilestone.isCompleted ? 600 : 400 }}>
                      {subMilestone.title}
                    </Typography>
                    {subMilestone.completedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Completed {subMilestone.completedAt.toLocaleDateString()}
                      </Typography>
                    )}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const renderCelebrationDialog = () => (
    <Dialog
      open={showCelebrationDialog}
      onClose={() => setShowCelebrationDialog(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      {selectedAchievement && (
        <>
          <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                {selectedAchievement.icon}
              </Typography>
              {showConfetti && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
                      animation: 'confetti 2s ease-out'
                    }
                  }}
                />
              )}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {selectedAchievement.title}
            </Typography>
            {selectedAchievement.celebrationData && (
              <Typography
                variant="h6"
                sx={{
                  color: 'primary.main',
                  fontStyle: 'italic'
                }}
              >
                {selectedAchievement.celebrationData.celebrationMessage}
              </Typography>
            )}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={3} sx={{ textAlign: 'center' }}>
              <Typography variant="body1">
                {selectedAchievement.description}
              </Typography>

              <Box>
                <Chip
                  label={`${selectedAchievement.difficulty} Achievement`}
                  sx={{
                    bgcolor: alpha(getDifficultyColor(selectedAchievement.difficulty), 0.2),
                    color: getDifficultyColor(selectedAchievement.difficulty),
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 2,
                    py: 1
                  }}
                />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                +{selectedAchievement.points} XP Earned!
              </Typography>

              {selectedAchievement.unlockedAt && (
                <Typography variant="body2" color="text.secondary">
                  Unlocked on {selectedAchievement.unlockedAt.toLocaleDateString()}
                </Typography>
              )}

              {selectedAchievement.nextLevel && (
                <Alert severity="info" sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Next Level: {selectedAchievement.nextLevel.title}
                  </Typography>
                  <Typography variant="body2">
                    Requirements:
                  </Typography>
                  <List dense>
                    {selectedAchievement.nextLevel.requirements.map((req, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <Typography variant="body2">• {req}</Typography>
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              sx={{ mr: 2 }}
            >
              Share Achievement
            </Button>
            <Button onClick={() => setShowCelebrationDialog(false)}>
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
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
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Your Achievement Journey 🏆
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Track your progress, celebrate milestones, and unlock new achievements
          </Typography>
        </Box>

        {/* Tabs */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            <Tab label="Achievements" icon={<TrophyIcon />} iconPosition="start" />
            <Tab label="Streaks" icon={<StreakIcon />} iconPosition="start" />
            <Tab label="Milestones" icon={<TimelineIcon />} iconPosition="start" />
            <Tab label="Level Progress" icon={<ProgressIcon />} iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab Content */}
        {selectedTab === TabValue.ACHIEVEMENTS && renderAchievements()}
        {selectedTab === TabValue.STREAKS && renderStreaks()}
        {selectedTab === TabValue.MILESTONES && renderMilestones()}
        {selectedTab === TabValue.LEVEL_PROGRESS && renderLevelProgress()}

        {/* Celebration Dialog */}
        {renderCelebrationDialog()}

        {/* CSS for animations */}
        <style>
          {`
            @keyframes confetti {
              0% { 
                transform: scale(0) rotate(0deg);
                opacity: 1;
              }
              50% { 
                transform: scale(1.2) rotate(180deg);
                opacity: 0.8;
              }
              100% { 
                transform: scale(1) rotate(360deg);
                opacity: 0;
              }
            }
          `}
        </style>
      </Box>
    </Box>
  );
};

export default ClientAchievements;