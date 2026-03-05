/**
 * ClientGoals - Comprehensive SMART goal-setting interface for personal development
 * Multi-coach collaboration, milestone tracking, and achievement system
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Fab,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Timeline as ProgressIcon,
  Flag as GoalIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduleIcon,
  Group as CollaborateIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as AchievementIcon,
  Lightbulb as IdeaIcon,
  Psychology as MindsetIcon,
  FitnessCenter as HealthIcon,
  Work as CareerIcon,
  Favorite as RelationshipIcon,
  AttachMoney as MoneyIcon,
  School as EducationIcon,
  SelfImprovement as GrowthIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  PlayArrow as StartIcon,
  Star as StarIcon,
  Flag as MilestoneIcon,
  Celebration as CelebrationIcon,
  Home as LifestyleIcon,
  Explore as AdventureIcon,
  Groups as SocialIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export enum GoalCategory {
  Personal = 'personal',
  Career = 'career', 
  Health = 'health',
  Relationships = 'relationships',
  Finance = 'finance',
  Learning = 'learning',
  Lifestyle = 'lifestyle',
  Mindset = 'mindset',
  Social = 'social',
  Adventure = 'adventure'
}

export enum GoalStatus {
  Draft = 'draft',
  Active = 'active',
  InProgress = 'in_progress',
  Completed = 'completed',
  Paused = 'paused',
  Cancelled = 'cancelled'
}

export enum GoalPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  isCompleted: boolean;
  order: number;
  reward?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedDate: Date;
  type: 'milestone' | 'streak' | 'progress' | 'completion';
  icon: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: GoalPriority;
  targetDate: Date;
  createdDate: Date;
  completedDate?: Date;
  progress: number;
  milestones: Milestone[];
  isSharedWithCoaches: boolean;
  sharedWithCoaches: string[];
  createdBy: string;
  lastUpdated: Date;
  tags: string[];
  notes: string;
  smartCriteria: {
    specific: boolean;
    measurable: boolean;
    achievable: boolean;
    relevant: boolean;
    timeBound: boolean;
  };
  coachCollaboration: {
    allowCoachEdit: boolean;
    requestCoachFeedback: boolean;
    sharedProgress: boolean;
  };
  achievements: Achievement[];
}

interface Coach {
  id: string;
  name: string;
  specialization: string;
  profileImage?: string;
}

const getCategoryConfig = (t: any) => ({
  [GoalCategory.Personal]: { icon: GrowthIcon, color: '#8B5A87', label: t.goals.client.categories.personal },
  [GoalCategory.Career]: { icon: CareerIcon, color: '#2E7D6B', label: t.goals.client.categories.career },
  [GoalCategory.Health]: { icon: HealthIcon, color: '#F4A261', label: t.goals.client.categories.health },
  [GoalCategory.Relationships]: { icon: RelationshipIcon, color: '#E74C3C', label: t.goals.client.categories.relationships },
  [GoalCategory.Finance]: { icon: MoneyIcon, color: '#27AE60', label: t.goals.client.categories.finance },
  [GoalCategory.Learning]: { icon: EducationIcon, color: '#3498DB', label: t.goals.client.categories.learning },
  [GoalCategory.Lifestyle]: { icon: LifestyleIcon, color: '#9B59B6', label: t.goals.client.categories.lifestyle },
  [GoalCategory.Mindset]: { icon: MindsetIcon, color: '#E67E22', label: t.goals.client.categories.mindset },
  [GoalCategory.Social]: { icon: SocialIcon, color: '#1ABC9C', label: t.goals.client.categories.social },
  [GoalCategory.Adventure]: { icon: AdventureIcon, color: '#F39C12', label: t.goals.client.categories.adventure }
});

const PRIORITY_COLORS = {
  [GoalPriority.Low]: '#95A5A6',
  [GoalPriority.Medium]: '#3498DB', 
  [GoalPriority.High]: '#F39C12',
  [GoalPriority.Critical]: '#E74C3C'
};

const STATUS_COLORS = {
  [GoalStatus.Draft]: '#95A5A6',
  [GoalStatus.Active]: '#3498DB',
  [GoalStatus.InProgress]: '#F39C12',
  [GoalStatus.Completed]: '#27AE60',
  [GoalStatus.Paused]: '#E67E22',
  [GoalStatus.Cancelled]: '#E74C3C'
};

const ClientGoals: React.FC = () => {
  const theme = useTheme();
  const { translations: t } = useTranslation();
  const navigate = useNavigate();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showGoalDetails, setShowGoalDetails] = useState(false);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [createStep, setCreateStep] = useState(0);
  const [progressUpdate, setProgressUpdate] = useState({ progress: 0, notes: '' });
  
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    category: GoalCategory.Personal,
    priority: GoalPriority.Medium,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
    milestones: [],
    isSharedWithCoaches: false,
    sharedWithCoaches: [],
    tags: [],
    notes: '',
    smartCriteria: {
      specific: false,
      measurable: false,
      achievable: false,
      relevant: false,
      timeBound: false
    },
    coachCollaboration: {
      allowCoachEdit: false,
      requestCoachFeedback: false,
      sharedProgress: true
    }
  });

  const tabLabels = [
    t.goals.client.tabs.all,
    t.goals.client.tabs.active,
    t.goals.client.tabs.inProgress,
    t.goals.client.tabs.completed
  ];
  const createGoalSteps = t.goals.client.create.steps;

  useEffect(() => {
    loadGoals();
    loadCoaches();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Build a Morning Meditation Practice',
          description: 'Establish a consistent 20-minute meditation practice every morning to improve focus and reduce stress.',
          category: GoalCategory.Mindset,
          status: GoalStatus.InProgress,
          priority: GoalPriority.High,
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          progress: 65,
          milestones: [
            {
              id: '1-1',
              title: 'Complete Week 1',
              description: '7 consecutive days of 20-minute meditation',
              targetDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
              completedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
              isCompleted: true,
              order: 1,
              reward: 'Treat yourself to a new meditation cushion'
            },
            {
              id: '1-2', 
              title: 'Complete Month 1',
              description: '30 days of consistent practice',
              targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              isCompleted: false,
              order: 2,
              reward: 'Book a meditation retreat day'
            }
          ],
          isSharedWithCoaches: true,
          sharedWithCoaches: ['coach-1', 'coach-2'],
          createdBy: 'client-123',
          lastUpdated: new Date(),
          tags: ['mindfulness', 'daily-practice', 'stress-reduction'],
          notes: 'Using Headspace app for guided sessions. Best time seems to be 6:30 AM.',
          smartCriteria: {
            specific: true,
            measurable: true,
            achievable: true,
            relevant: true,
            timeBound: true
          },
          coachCollaboration: {
            allowCoachEdit: false,
            requestCoachFeedback: true,
            sharedProgress: true
          },
          achievements: [
            {
              id: 'ach-1',
              title: 'First Week Warrior',
              description: 'Completed your first week of meditation',
              earnedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
              type: 'milestone',
              icon: '🧘‍♀️'
            }
          ]
        },
        {
          id: '2',
          title: 'Learn Spanish Conversational Skills',
          description: 'Achieve intermediate conversational Spanish fluency for upcoming South America trip.',
          category: GoalCategory.Learning,
          status: GoalStatus.Active,
          priority: GoalPriority.Medium,
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          createdDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          progress: 25,
          milestones: [
            {
              id: '2-1',
              title: 'Complete Duolingo Spanish Tree',
              description: 'Finish the entire Spanish course on Duolingo',
              targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              isCompleted: false,
              order: 1
            },
            {
              id: '2-2',
              title: 'Have First Conversation',
              description: '30-minute conversation with native speaker',
              targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
              isCompleted: false,
              order: 2
            }
          ],
          isSharedWithCoaches: false,
          sharedWithCoaches: [],
          createdBy: 'client-123',
          lastUpdated: new Date(),
          tags: ['language', 'travel', 'skill-building'],
          notes: 'Planning 30 minutes daily study. Found great conversation exchange partner online.',
          smartCriteria: {
            specific: true,
            measurable: true,
            achievable: true,
            relevant: true,
            timeBound: true
          },
          coachCollaboration: {
            allowCoachEdit: false,
            requestCoachFeedback: false,
            sharedProgress: false
          },
          achievements: []
        },
        {
          id: '3',
          title: 'Complete Leadership Development Program',
          description: 'Enroll in and complete a comprehensive leadership program to enhance management skills.',
          category: GoalCategory.Career,
          status: GoalStatus.Completed,
          priority: GoalPriority.High,
          targetDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          createdDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          completedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          progress: 100,
          milestones: [
            {
              id: '3-1',
              title: 'Research Programs',
              description: 'Research and shortlist 3 leadership programs',
              targetDate: new Date(Date.now() - 270 * 24 * 60 * 60 * 1000),
              completedDate: new Date(Date.now() - 265 * 24 * 60 * 60 * 1000),
              isCompleted: true,
              order: 1
            },
            {
              id: '3-2',
              title: 'Complete Program',
              description: 'Finish all modules and receive certification',
              targetDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
              completedDate: new Date(Date.now() - 175 * 24 * 60 * 60 * 1000),
              isCompleted: true,
              order: 2
            }
          ],
          isSharedWithCoaches: true,
          sharedWithCoaches: ['coach-2'],
          createdBy: 'client-123',
          lastUpdated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          tags: ['career', 'leadership', 'professional-development'],
          notes: 'Completed ahead of schedule! Ready for next challenge.',
          smartCriteria: {
            specific: true,
            measurable: true,
            achievable: true,
            relevant: true,
            timeBound: true
          },
          coachCollaboration: {
            allowCoachEdit: false,
            requestCoachFeedback: true,
            sharedProgress: true
          },
          achievements: [
            {
              id: 'ach-2',
              title: 'Leadership Graduate',
              description: 'Successfully completed leadership program',
              earnedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
              type: 'completion',
              icon: '🏆'
            }
          ]
        }
      ];

      setGoals(mockGoals);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load goals:', error);
      setIsLoading(false);
    }
  };

  const loadCoaches = async () => {
    try {
      // Mock data - replace with actual API call
      const mockCoaches: Coach[] = [
        { id: 'coach1', name: 'Dr. Emily Chen', specialization: 'Life & Wellness Coaching' },
        { id: 'coach2', name: 'Marcus Rodriguez', specialization: 'Career & Leadership' },
        { id: 'coach3', name: 'Dr. Aisha Patel', specialization: 'Mindfulness & Stress Management' }
      ];

      setCoaches(mockCoaches);
    } catch (error) {
      console.error('Failed to load coaches:', error);
    }
  };

  const filteredGoals = goals.filter(goal => {
    switch (currentTab) {
      case 1: return goal.status === GoalStatus.Active;
      case 2: return goal.status === GoalStatus.InProgress;
      case 3: return goal.status === GoalStatus.Completed;
      default: return true;
    }
  });

  const categoryConfig = getCategoryConfig(t);
  
  const getCategoryIcon = (category: GoalCategory) => {
    const categoryInfo = categoryConfig[category];
    return categoryInfo?.icon ? React.createElement(categoryInfo.icon) : <GoalIcon />;
  };

  const getCategoryColor = (category: GoalCategory) => {
    const categoryInfo = categoryConfig[category];
    return categoryInfo?.color || theme.palette.primary.main;
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case GoalPriority.Critical: return theme.palette.error.main;
      case GoalPriority.High: return theme.palette.warning.main;
      case GoalPriority.Medium: return theme.palette.info.main;
      case GoalPriority.Low: return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.Completed: return 'success';
      case GoalStatus.Active: return 'primary';
      case GoalStatus.InProgress: return 'info';
      case GoalStatus.Paused: return 'warning';
      case GoalStatus.Cancelled: return 'error';
      default: return 'default';
    }
  };

  const handleCreateGoal = () => {
    setShowCreateDialog(true);
    setCreateStep(0);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      targetDate: goal.targetDate,
      milestones: goal.milestones,
      isSharedWithCoaches: goal.isSharedWithCoaches,
      sharedWithCoaches: goal.sharedWithCoaches,
      tags: goal.tags,
      notes: goal.notes
    });
    setCreateStep(0);
    setShowEditDialog(true);
  };

  const handleSaveGoal = async () => {
    try {
      // TODO: Save goal via API
      console.log('Saving goal:', newGoal);
      
      // Close dialog and refresh
      setShowCreateDialog(false);
      setShowEditDialog(false);
      setSelectedGoal(null);
      await loadGoals();
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      // TODO: Delete goal via API
      console.log('Deleting goal:', goalId);
      await loadGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleViewGoalDetails = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowGoalDetails(true);
  };

  const handleUpdateProgress = () => {
    setShowUpdateProgress(true);
  };

  const handleSaveProgressUpdate = async () => {
    try {
      // TODO: Save progress update via API
      console.log('Saving progress update:', progressUpdate);
      setShowUpdateProgress(false);
      setProgressUpdate({ progress: 0, notes: '' });
      await loadGoals();
    } catch (error) {
      console.error('Failed to save progress update:', error);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      // TODO: Complete goal via API
      console.log('Completing goal:', goalId);
      await loadGoals();
    } catch (error) {
      console.error('Failed to complete goal:', error);
    }
  };

  const renderGoalCard = (goal: Goal) => (
    <Card
      key={goal.id}
      data-testid={`goal-card-${goal.id}`}
      onClick={() => handleViewGoalDetails(goal)}
      sx={{
        background: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              bgcolor: getCategoryColor(goal.category),
              color: 'white'
            }}
          >
            {getCategoryIcon(goal.category)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {goal.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={categoryConfig[goal.category]?.label || goal.category}
                size="small"
                data-testid="goal-category"
                sx={{
                  borderColor: getCategoryColor(goal.category),
                  color: getCategoryColor(goal.category)
                }}
                variant="outlined"
              />
              <Chip
                label={goal.status}
                size="small"
                color={getStatusColor(goal.status) as any}
                variant="outlined"
              />
              <Chip
                label={`Priority: ${GoalPriority[goal.priority]}`}
                size="small"
                sx={{
                  borderColor: getPriorityColor(goal.priority),
                  color: getPriorityColor(goal.priority)
                }}
                variant="outlined"
              />
              {goal.smartCriteria && Object.values(goal.smartCriteria).every(Boolean) && (
                <Chip
                  label="SMART"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditGoal(goal);
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGoal(goal.id);
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {goal.description}
        </Typography>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t.goals.client.labels.progress || 'Progress'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {goal.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={goal.progress}
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

        {/* Milestones */}
        {goal.milestones.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {t.goals.client.labels.milestones || 'Milestones'} ({goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length})
            </Typography>
            <Stack spacing={1}>
              {goal.milestones.slice(0, 3).map((milestone) => (
                <Box key={milestone.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={milestone.isCompleted}
                    size="small"
                    disabled
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      textDecoration: milestone.isCompleted ? 'line-through' : 'none',
                      opacity: milestone.isCompleted ? 0.7 : 1
                    }}
                  >
                    {milestone.title}
                  </Typography>
                </Box>
              ))}
              {goal.milestones.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{goal.milestones.length - 3} {t.goals.client.labels.moreMilestones || 'more milestones'}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {t.goals.client.labels.due || 'Due'}: {goal.targetDate.toLocaleDateString()}
            </Typography>
          </Box>
          
          {goal.isSharedWithCoaches && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CollaborateIcon sx={{ fontSize: 16, color: 'info.main' }} />
              <Typography variant="caption" color="info.main">
                {t.goals.client.labels.sharedWith || 'Shared with'} {goal.sharedWithCoaches.length} {goal.sharedWithCoaches.length !== 1 ? (t.goals.client.labels.coaches || 'coaches') : (t.goals.client.labels.coach || 'coach')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Tags */}
        {goal.tags.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {goal.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 24 }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderCreateGoalDialog = () => (
    <Dialog
      open={showCreateDialog || showEditDialog}
      onClose={() => {
        setShowCreateDialog(false);
        setShowEditDialog(false);
        setSelectedGoal(null);
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <GoalIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {showEditDialog ? 'Edit Goal' : t.goals.client.create.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {showEditDialog ? 'Update your goal details' : t.goals.client.create.subtitle || 'Set up a new personal development goal'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stepper activeStep={createStep} sx={{ mb: 4 }}>
          {createGoalSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Goal Details */}
        {createStep === 0 && (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label={t.goals.client.create.goalTitle}
              value={newGoal.title || ''}
              onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t.goals.client.create.goalPlaceholder || 'What do you want to achieve?'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label={t.goals.client.create.description}
              value={newGoal.description || ''}
              onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t.goals.client.create.descriptionPlaceholder || 'Describe your goal in detail...'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t.goals.client.create.category}</InputLabel>
                  <Select
                    value={newGoal.category}
                    label={t.goals.client.create.category}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value as GoalCategory }))}
                    sx={{ borderRadius: 2 }}
                  >
                    {Object.entries(categoryConfig).map(([key, cat]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {React.createElement(cat.icon)}
                          {cat.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t.goals.client.create.priority}</InputLabel>
                  <Select
                    value={newGoal.priority}
                    label={t.goals.client.create.priority}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as GoalPriority }))}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value={GoalPriority.Low}>{t.goals.client.priorities.low}</MenuItem>
                    <MenuItem value={GoalPriority.Medium}>{t.goals.client.priorities.medium}</MenuItem>
                    <MenuItem value={GoalPriority.High}>{t.goals.client.priorities.high}</MenuItem>
                    <MenuItem value={GoalPriority.Critical}>{t.goals.client.priorities.critical}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              type="date"
              label={t.goals.client.create.targetDate}
              value={newGoal.targetDate ? new Date(newGoal.targetDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        )}

        {/* Step 2: Milestones */}
        {createStep === 1 && (
          <Stack spacing={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t.goals.client.create.milestonesTitle || 'Break down your goal into milestones'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              {t.goals.client.create.milestonesSubtitle || 'Milestones help you track progress and maintain motivation. Add 2-5 key checkpoints.'}
            </Typography>

            {(newGoal.milestones || []).map((milestone, index) => {
              // Ensure targetDate is a Date object
              const targetDate = milestone.targetDate instanceof Date
                ? milestone.targetDate
                : new Date(milestone.targetDate);

              return (
                <Card key={milestone.id} sx={{ p: 2, bgcolor: alpha(theme.palette.primary.light, 0.05) }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t.goals.client.create.milestoneTitle || 'Milestone Title'}
                        value={milestone.title}
                        onChange={(e) => {
                          const newMilestones = [...(newGoal.milestones || [])];
                          newMilestones[index].title = e.target.value;
                          setNewGoal(prev => ({ ...prev, milestones: newMilestones }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t.goals.client.create.description}
                        value={milestone.description}
                        onChange={(e) => {
                          const newMilestones = [...(newGoal.milestones || [])];
                          newMilestones[index].description = e.target.value;
                          setNewGoal(prev => ({ ...prev, milestones: newMilestones }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label={t.goals.client.create.targetDate}
                        value={targetDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newMilestones = [...(newGoal.milestones || [])];
                          newMilestones[index].targetDate = new Date(e.target.value);
                          setNewGoal(prev => ({ ...prev, milestones: newMilestones }));
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        color="error"
                        onClick={() => {
                          const newMilestones = (newGoal.milestones || []).filter((_, i) => i !== index);
                          setNewGoal(prev => ({ ...prev, milestones: newMilestones }));
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Card>
              );
            })}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                const newMilestone: Milestone = {
                  id: `milestone_${Date.now()}`,
                  title: '',
                  description: '',
                  targetDate: newGoal.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  isCompleted: false,
                  order: (newGoal.milestones || []).length + 1
                };
                setNewGoal(prev => ({ ...prev, milestones: [...(prev.milestones || []), newMilestone] }));
              }}
            >
              {t.goals.client.create.addMilestone || 'Add Milestone'}
            </Button>
          </Stack>
        )}

        {/* Step 3: Sharing & Notes */}
        {createStep === 2 && (
          <Stack spacing={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t.goals.client.create.collaborationTitle || 'Collaboration & Notes'}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={newGoal.isSharedWithCoaches || false}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, isSharedWithCoaches: e.target.checked }))}
                />
              }
              label={t.goals.client.create.shareWithCoaches || 'Share this goal with my coaches for guidance and accountability'}
            />

            {newGoal.isSharedWithCoaches && (
              <Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {t.goals.client.create.selectCoaches || 'Select coaches to share this goal with:'}
                </Typography>
                <Stack spacing={1}>
                  {coaches.map((coach) => (
                    <FormControlLabel
                      key={coach.id}
                      control={
                        <Checkbox
                          checked={(newGoal.sharedWithCoaches || []).includes(coach.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewGoal(prev => ({ ...prev, sharedWithCoaches: [...(prev.sharedWithCoaches || []), coach.id] }));
                            } else {
                              setNewGoal(prev => ({ 
                                ...prev, 
                                sharedWithCoaches: (prev.sharedWithCoaches || []).filter(id => id !== coach.id) 
                              }));
                            }
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                            {coach.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{coach.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {coach.specialization}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label={t.goals.client.create.additionalNotes || 'Additional Notes'}
              value={newGoal.notes || ''}
              onChange={(e) => setNewGoal(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t.goals.client.create.notesPlaceholder || 'Any additional thoughts, context, or reminders about this goal...'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={() => {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedGoal(null);
        }}>
          {t.actions.cancel}
        </Button>
        
        {createStep > 0 && (
          <Button onClick={() => setCreateStep(prev => prev - 1)} startIcon={<EditIcon />}>
            {t.actions.back}
          </Button>
        )}
        
        {createStep < createGoalSteps.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setCreateStep(prev => prev + 1)}
            endIcon={<AddIcon />}
            disabled={!newGoal.title || !newGoal.description}
          >
            {t.actions.next}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSaveGoal}
            startIcon={<GoalIcon />}
            disabled={!newGoal.title || !newGoal.description}
          >
            {showEditDialog ? t.goals.client.create.updateGoal || 'Update Goal' : t.goals.client.create.createGoal || 'Create Goal'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  const renderGoalDetailsDialog = () => {
    if (!selectedGoal) return null;

    return (
      <Dialog
        open={showGoalDetails}
        onClose={() => {
          setShowGoalDetails(false);
          setSelectedGoal(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: getCategoryColor(selectedGoal.category) }}>
                {getCategoryIcon(selectedGoal.category)}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {selectedGoal.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {categoryConfig[selectedGoal.category]?.label || selectedGoal.category}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => {
                setShowGoalDetails(false);
                setSelectedGoal(null);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Status and Progress */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                  label={selectedGoal.status}
                  size="small"
                  color={getStatusColor(selectedGoal.status) as any}
                />
                <Chip
                  label={`Priority: ${GoalPriority[selectedGoal.priority]}`}
                  size="small"
                  sx={{
                    borderColor: getPriorityColor(selectedGoal.priority),
                    color: getPriorityColor(selectedGoal.priority)
                  }}
                  variant="outlined"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t.goals.client.labels.progress || 'Progress'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedGoal.progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedGoal.progress}
                  role="progressbar"
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.grey[300], 0.3),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {t.goals.client.details.description || 'Description'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedGoal.description}
              </Typography>
            </Box>

            {/* Target Date */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {t.goals.client.details.target || 'Target Date'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DateIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {selectedGoal.targetDate.toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            {/* Milestones */}
            {selectedGoal.milestones.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {t.goals.client.labels.milestones || 'Milestones'} (
                  {selectedGoal.milestones.filter((m) => m.isCompleted).length}/
                  {selectedGoal.milestones.length})
                </Typography>
                <List data-testid="milestone-list" sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2 }}>
                  {selectedGoal.milestones.map((milestone, index) => (
                    <React.Fragment key={milestone.id}>
                      <ListItem data-testid={`milestone-${milestone.id}`}>
                        <ListItemIcon>
                          <Checkbox
                            checked={milestone.isCompleted}
                            disabled
                            icon={<MilestoneIcon />}
                            checkedIcon={<CompletedIcon />}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={milestone.title}
                          secondary={
                            <>
                              {milestone.description}
                              <br />
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <DateIcon sx={{ fontSize: 14 }} />
                                Target: {milestone.targetDate.toLocaleDateString()}
                                {milestone.completedDate && (
                                  <> • Completed: {milestone.completedDate.toLocaleDateString()}</>
                                )}
                              </Typography>
                            </>
                          }
                          primaryTypographyProps={{
                            sx: {
                              textDecoration: milestone.isCompleted ? 'line-through' : 'none',
                              fontWeight: 600,
                            },
                          }}
                        />
                      </ListItem>
                      {index < selectedGoal.milestones.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}

            {/* Progress History */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {t.goals.client.details.progressHistory || 'Progress History'}
              </Typography>
              <Box
                data-testid="progress-history"
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t.goals.client.details.noProgressUpdates || 'No progress updates yet. Click "Update Progress" to log your first entry.'}
                </Typography>
              </Box>
            </Box>

            {/* Notes */}
            {selectedGoal.notes && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t.goals.client.details.notes || 'Notes'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedGoal.notes}
                </Typography>
              </Box>
            )}

            {/* Tags */}
            {selectedGoal.tags.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t.goals.client.details.tags || 'Tags'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedGoal.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Achievements */}
            {selectedGoal.achievements && selectedGoal.achievements.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {t.goals.client.details.achievements || 'Achievements'}
                </Typography>
                <Stack spacing={1}>
                  {selectedGoal.achievements.map((achievement) => (
                    <Box
                      key={achievement.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        bgcolor: alpha(theme.palette.success.light, 0.1),
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="h4">{achievement.icon}</Typography>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {achievement.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {achievement.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setShowGoalDetails(false);
              setSelectedGoal(null);
            }}
          >
            {t.actions.close || 'Close'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={() => {
              // TODO: Implement share functionality
            }}
          >
            {t.goals.client.actions.share || 'Share'}
          </Button>
          {selectedGoal.status !== GoalStatus.Completed && (
            <>
              <Button
                variant="contained"
                startIcon={<ProgressIcon />}
                onClick={handleUpdateProgress}
              >
                {t.goals.client.actions.updateProgress || 'Update Progress'}
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CompletedIcon />}
                onClick={() => handleCompleteGoal(selectedGoal.id)}
              >
                {t.goals.client.actions.complete || 'Mark as Complete'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  const renderUpdateProgressDialog = () => (
    <Dialog
      open={showUpdateProgress}
      onClose={() => {
        setShowUpdateProgress(false);
        setProgressUpdate({ progress: 0, notes: '' });
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <ProgressIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t.goals.client.updateProgress.title || 'Update Progress'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedGoal?.title}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            type="number"
            label={t.goals.client.updateProgress.percentage || 'Progress Percentage'}
            value={progressUpdate.progress}
            onChange={(e) =>
              setProgressUpdate((prev) => ({ ...prev, progress: parseInt(e.target.value) || 0 }))
            }
            InputProps={{
              endAdornment: <Typography>%</Typography>,
            }}
            inputProps={{ min: 0, max: 100 }}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label={t.goals.client.updateProgress.notes || 'Progress Notes'}
            value={progressUpdate.notes}
            onChange={(e) => setProgressUpdate((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={t.goals.client.updateProgress.notesPlaceholder || 'What progress have you made? Any challenges or wins?'}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={() => {
            setShowUpdateProgress(false);
            setProgressUpdate({ progress: 0, notes: '' });
          }}
        >
          {t.actions.cancel}
        </Button>
        <Button
          variant="contained"
          startIcon={<ProgressIcon />}
          onClick={handleSaveProgressUpdate}
          disabled={progressUpdate.progress < 0 || progressUpdate.progress > 100}
        >
          {t.goals.client.updateProgress.submit || 'Log Progress'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Page Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            data-testid="goals-page-heading"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {t.goals.client.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            {t.goals.client.subtitle}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card data-testid="stat-card-total-goals" sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <GoalIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" data-testid="total-goals-count" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {goals.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.goals.client.stats.total}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card data-testid="stat-card-active" sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <TrendingIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" data-testid="active-goals-count" sx={{ fontWeight: 700, color: 'info.main' }}>
                {goals.filter(g => g.status === GoalStatus.Active).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.goals.client.tabs.active}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card data-testid="stat-card-completed" sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <CompletedIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" data-testid="completed-goals-count" sx={{ fontWeight: 700, color: 'success.main' }}>
                {goals.filter(g => g.status === GoalStatus.Completed).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.goals.client.stats.completed}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card data-testid="stat-card-shared" sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <CollaborateIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" data-testid="shared-goals-count" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {goals.filter(g => g.isSharedWithCoaches).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.goals.client.stats.shared || 'Shared Goals'}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            {tabLabels.map((label, index) => (
              <Tab
                key={index}
                label={label}
                icon={
                  index === 0 ? <GoalIcon /> :
                  index === 1 ? <TrendingIcon /> :
                  index === 2 ? <CompletedIcon /> :
                  <ProgressIcon />
                }
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Card>

        {/* Goals Grid */}
        {currentTab === 3 ? (
          // By Category View
          <Stack spacing={4}>
            {Object.entries(categoryConfig).map(([key, category]) => {
              const categoryGoals = goals.filter(goal => goal.category === key as GoalCategory);
              if (categoryGoals.length === 0) return null;

              return (
                <Box key={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ bgcolor: category.color }}>
                      {React.createElement(category.icon)}
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {category.label} ({categoryGoals.length})
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    {categoryGoals.map((goal) => (
                      <Grid item xs={12} md={6} lg={4} key={goal.id}>
                        {renderGoalCard(goal)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })}
          </Stack>
        ) : (
          // Regular Grid View
          <Grid container spacing={3}>
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => (
                <Grid item xs={12} md={6} lg={4} key={goal.id}>
                  {renderGoalCard(goal)}
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <GoalIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      {t.goals.client.empty.title}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    {t.goals.client.empty.subtitle}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateGoal}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                    }}
                  >
                    {t.goals.client.empty.button}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          onClick={handleCreateGoal}
          data-testid="create-goal-fab"
          aria-label="Create new goal"
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

        {/* Create/Edit Goal Dialog */}
        {renderCreateGoalDialog()}

        {/* Goal Details Dialog */}
        {renderGoalDetailsDialog()}

        {/* Update Progress Dialog */}
        {renderUpdateProgressDialog()}
      </Box>
    </Box>
  );
};

export default ClientGoals;