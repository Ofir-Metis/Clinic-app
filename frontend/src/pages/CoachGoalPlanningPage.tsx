/**
 * CoachGoalPlanningPage - Comprehensive goal-setting interface for coaches
 * Create goal templates, coaching programs, and structured methodologies for personal development
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
  Badge,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
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
  Close as CloseIcon,
  Description as TemplateIcon,
  CreateNewFolder as ProgramIcon,
  Assignment as MethodologyIcon,
  PersonAdd as ClientIcon,
  Analytics as AnalyticsIcon,
  Save as SaveIcon,
  Publish as PublishIcon,
  Category as CategoryIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useTranslation } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

// Interfaces for Goal Templates and Programs
interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  framework: GoalFramework;
  duration: number; // weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  milestoneTemplates: MilestoneTemplate[];
  successMetrics: string[];
  commonChallenges: string[];
  coachingTips: string[];
  resources: Resource[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
  rating: number;
  tags: string[];
}

interface MilestoneTemplate {
  id: string;
  title: string;
  description: string;
  suggestedTimeframe: number; // weeks from start
  order: number;
  isRequired: boolean;
  assessmentQuestions: string[];
}

interface CoachingProgram {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  targetAudience: string[];
  duration: number; // weeks
  goalTemplates: string[]; // template IDs
  sessionPlan: SessionPlan[];
  assessments: Assessment[];
  resources: Resource[];
  pricing: ProgramPricing;
  isActive: boolean;
  enrolledClients: number;
  completionRate: number;
  createdBy: string;
  createdAt: Date;
}

interface SessionPlan {
  id: string;
  week: number;
  title: string;
  objectives: string[];
  activities: Activity[];
  homework: string[];
  duration: number; // minutes
}

interface Activity {
  id: string;
  type: 'discussion' | 'exercise' | 'reflection' | 'assessment' | 'goal-setting' | 'review';
  title: string;
  description: string;
  duration: number; // minutes
  materials: string[];
}

interface Assessment {
  id: string;
  title: string;
  type: 'self-reflection' | 'goal-progress' | 'satisfaction' | 'skills-assessment';
  questions: AssessmentQuestion[];
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'milestone-based';
  isRequired: boolean;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multiple-choice' | 'text' | 'yes-no';
  options?: string[];
  required: boolean;
}

interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'book' | 'worksheet' | 'tool' | 'app';
  url?: string;
  description: string;
  category: string;
}

interface ProgramPricing {
  currency: string;
  individualSession: number;
  fullProgram: number;
  packageDiscount: number;
}

interface GoalMethodology {
  id: string;
  name: string;
  description: string;
  steps: MethodologyStep[];
  applicableCategories: GoalCategory[];
  effectiveness: number; // 1-5 rating
  timeRequired: number; // minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  successRate: number; // percentage
}

interface MethodologyStep {
  id: string;
  order: number;
  title: string;
  description: string;
  instructions: string[];
  timeRequired: number; // minutes
  tools: string[];
  expectedOutcome: string;
}

enum GoalCategory {
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

enum GoalFramework {
  SMART = 'SMART',  // Specific, Measurable, Achievable, Relevant, Time-bound
  GROW = 'GROW',    // Goal, Reality, Options, Will
  CLEAR = 'CLEAR',  // Challenging, Legal, Environmentally sound, Appropriate, Recorded
  HARD = 'HARD',    // Heartfelt, Animated, Required, Difficult
  FAST = 'FAST',    // Frequently discussed, Ambitious, Specific, Transparent
  WOOP = 'WOOP'     // Wish, Outcome, Obstacle, Plan
}

const FRAMEWORK_DESCRIPTIONS = {
  [GoalFramework.SMART]: 'Specific, Measurable, Achievable, Relevant, Time-bound framework for clear goal setting',
  [GoalFramework.GROW]: 'Goal, Reality, Options, Will - coaching model for problem-solving and goal achievement',
  [GoalFramework.CLEAR]: 'Challenging, Legal, Environmentally sound, Appropriate, Recorded framework',
  [GoalFramework.HARD]: 'Heartfelt, Animated, Required, Difficult - emotional engagement framework',
  [GoalFramework.FAST]: 'Frequently discussed, Ambitious, Specific, Transparent - performance framework',
  [GoalFramework.WOOP]: 'Wish, Outcome, Obstacle, Plan - mental contrasting with implementation intentions'
};

const CATEGORY_CONFIG = {
  [GoalCategory.Personal]: { icon: GrowthIcon, color: '#8B5A87', label: 'Personal Growth' },
  [GoalCategory.Career]: { icon: CareerIcon, color: '#2E7D6B', label: 'Career & Business' },
  [GoalCategory.Health]: { icon: HealthIcon, color: '#F4A261', label: 'Health & Fitness' },
  [GoalCategory.Relationships]: { icon: RelationshipIcon, color: '#E74C3C', label: 'Relationships' },
  [GoalCategory.Finance]: { icon: MoneyIcon, color: '#27AE60', label: 'Financial Growth' },
  [GoalCategory.Learning]: { icon: EducationIcon, color: '#3498DB', label: 'Learning & Skills' },
  [GoalCategory.Lifestyle]: { icon: LifestyleIcon, color: '#9B59B6', label: 'Lifestyle Design' },
  [GoalCategory.Mindset]: { icon: MindsetIcon, color: '#E67E22', label: 'Mindset & Mental Health' },
  [GoalCategory.Social]: { icon: SocialIcon, color: '#1ABC9C', label: 'Social & Community' },
  [GoalCategory.Adventure]: { icon: AdventureIcon, color: '#F39C12', label: 'Adventure & Experiences' }
};

const CoachGoalPlanningPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [programs, setPrograms] = useState<CoachingProgram[]>([]);
  const [methodologies, setMethodologies] = useState<GoalMethodology[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [createStep, setCreateStep] = useState(0);
  const [dialogType, setDialogType] = useState<'template' | 'program' | 'methodology'>('template');
  
  const [newTemplate, setNewTemplate] = useState<Partial<GoalTemplate>>({
    title: '',
    description: '',
    category: GoalCategory.Personal,
    framework: GoalFramework.SMART,
    duration: 12,
    difficulty: 'beginner',
    milestoneTemplates: [],
    successMetrics: [],
    commonChallenges: [],
    coachingTips: [],
    resources: [],
    isPublic: false,
    tags: []
  });

  const tabLabels = ['Goal Templates', 'Coaching Programs', 'Methodologies', 'Analytics'];
  const createSteps = {
    template: ['Template Details', 'Milestones', 'Resources & Tips'],
    program: ['Program Overview', 'Session Planning', 'Assessments & Pricing'],
    methodology: ['Methodology Details', 'Steps Definition', 'Validation & Testing']
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadTemplates(),
        loadPrograms(),
        loadMethodologies()
      ]);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    // Mock data - replace with actual API call
    const mockTemplates: GoalTemplate[] = [
      {
        id: 'temp-1',
        title: 'Morning Routine Mastery',
        description: 'Develop a powerful morning routine that sets the tone for productive and fulfilling days.',
        category: GoalCategory.Lifestyle,
        framework: GoalFramework.SMART,
        duration: 8,
        difficulty: 'beginner',
        milestoneTemplates: [
          {
            id: 'ms-1',
            title: 'Define Your Ideal Morning',
            description: 'Identify activities that align with your values and goals',
            suggestedTimeframe: 1,
            order: 1,
            isRequired: true,
            assessmentQuestions: ['What activities make you feel most energized?', 'How much time can you realistically dedicate?']
          },
          {
            id: 'ms-2',
            title: 'Week 1 Implementation',
            description: 'Start with 3 core activities for consistency',
            suggestedTimeframe: 2,
            order: 2,
            isRequired: true,
            assessmentQuestions: ['Which activities were easiest to maintain?', 'What obstacles did you encounter?']
          }
        ],
        successMetrics: ['Consistency rate above 80%', 'Improved energy levels', 'Better daily productivity'],
        commonChallenges: ['Waking up earlier', 'Maintaining consistency', 'Time management'],
        coachingTips: ['Start small with 3 activities', 'Focus on consistency over perfection', 'Adjust based on lifestyle'],
        resources: [
          {
            id: 'res-1',
            title: 'The Miracle Morning',
            type: 'book',
            description: 'Hal Elrod\'s guide to transforming your life with morning routines',
            category: 'productivity'
          }
        ],
        isPublic: true,
        createdBy: 'coach-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        usageCount: 45,
        rating: 4.7,
        tags: ['morning-routine', 'productivity', 'habits', 'lifestyle']
      },
      {
        id: 'temp-2',
        title: 'Career Transition Blueprint',
        description: 'Structured approach to transitioning into a new career field with confidence and clarity.',
        category: GoalCategory.Career,
        framework: GoalFramework.GROW,
        duration: 16,
        difficulty: 'intermediate',
        milestoneTemplates: [
          {
            id: 'ms-3',
            title: 'Skills Gap Analysis',
            description: 'Identify required skills and current competencies',
            suggestedTimeframe: 2,
            order: 1,
            isRequired: true,
            assessmentQuestions: ['What skills are required in your target field?', 'Which skills do you already possess?']
          },
          {
            id: 'ms-4',
            title: 'Network Building',
            description: 'Connect with professionals in your target industry',
            suggestedTimeframe: 6,
            order: 2,
            isRequired: true,
            assessmentQuestions: ['How many new connections have you made?', 'What insights have you gained?']
          }
        ],
        successMetrics: ['New skill certifications', 'Industry network size', 'Job interview opportunities'],
        commonChallenges: ['Imposter syndrome', 'Skill development time', 'Financial considerations'],
        coachingTips: ['Leverage transferable skills', 'Build gradually while employed', 'Seek informational interviews'],
        resources: [
          {
            id: 'res-2',
            title: 'What Color Is Your Parachute?',
            type: 'book',
            description: 'Career change and job hunting guide',
            category: 'career'
          }
        ],
        isPublic: true,
        createdBy: 'coach-123',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        usageCount: 32,
        rating: 4.9,
        tags: ['career-change', 'professional-development', 'networking', 'skills']
      }
    ];
    
    setTemplates(mockTemplates);
  };

  const loadPrograms = async () => {
    // Mock data - replace with actual API call
    const mockPrograms: CoachingProgram[] = [
      {
        id: 'prog-1',
        title: 'Life Design Intensive',
        description: '12-week comprehensive program for designing and living your ideal life.',
        objectives: [
          'Clarify personal values and life vision',
          'Develop actionable life goals',
          'Build sustainable habits and routines',
          'Create accountability systems'
        ],
        targetAudience: ['Young professionals', 'Career changers', 'Life transition seekers'],
        duration: 12,
        goalTemplates: ['temp-1', 'temp-2'],
        sessionPlan: [
          {
            id: 'session-1',
            week: 1,
            title: 'Values Discovery & Life Vision',
            objectives: ['Identify core values', 'Create life vision statement'],
            activities: [
              {
                id: 'act-1',
                type: 'exercise',
                title: 'Values Card Sort',
                description: 'Interactive exercise to identify top 5 core values',
                duration: 45,
                materials: ['Values cards', 'Worksheet']
              }
            ],
            homework: ['Complete life wheel assessment', 'Journal daily for a week'],
            duration: 90
          }
        ],
        assessments: [
          {
            id: 'assess-1',
            title: 'Life Satisfaction Assessment',
            type: 'self-reflection',
            questions: [
              {
                id: 'q-1',
                question: 'How satisfied are you with your current life direction?',
                type: 'scale',
                required: true
              }
            ],
            frequency: 'weekly',
            isRequired: true
          }
        ],
        resources: [],
        pricing: {
          currency: 'USD',
          individualSession: 150,
          fullProgram: 1500,
          packageDiscount: 20
        },
        isActive: true,
        enrolledClients: 8,
        completionRate: 85,
        createdBy: 'coach-123',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }
    ];
    
    setPrograms(mockPrograms);
  };

  const loadMethodologies = async () => {
    // Mock data - replace with actual API call
    const mockMethodologies: GoalMethodology[] = [
      {
        id: 'method-1',
        name: 'SMART Goals Framework',
        description: 'The classic goal-setting methodology ensuring goals are Specific, Measurable, Achievable, Relevant, and Time-bound.',
        steps: [
          {
            id: 'step-1',
            order: 1,
            title: 'Make it Specific',
            description: 'Define exactly what you want to accomplish',
            instructions: [
              'Answer the 5 W questions: Who, What, Where, When, Why',
              'Avoid vague or general statements',
              'Include specific actions and outcomes'
            ],
            timeRequired: 15,
            tools: ['Goal clarification worksheet', 'Mind mapping'],
            expectedOutcome: 'Crystal clear goal statement'
          },
          {
            id: 'step-2',
            order: 2,
            title: 'Make it Measurable',
            description: 'Establish concrete criteria for measuring progress',
            instructions: [
              'Define quantitative metrics',
              'Set milestones and checkpoints',
              'Choose tracking methods'
            ],
            timeRequired: 10,
            tools: ['Progress tracking template', 'Measurement criteria checklist'],
            expectedOutcome: 'Clear success metrics and progress indicators'
          }
        ],
        applicableCategories: Object.values(GoalCategory),
        effectiveness: 4.8,
        timeRequired: 60,
        difficultyLevel: 'beginner',
        successRate: 78
      }
    ];
    
    setMethodologies(mockMethodologies);
  };

  const handleCreateTemplate = async () => {
    try {
      // TODO: Create template via API
      const template: GoalTemplate = {
        ...newTemplate as GoalTemplate,
        id: `temp-${Date.now()}`,
        createdBy: 'current-coach-id',
        createdAt: new Date(),
        usageCount: 0,
        rating: 0
      };

      setTemplates(prev => [...prev, template]);
      setShowCreateDialog(false);
      setCreateStep(0);
      resetNewTemplate();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      title: '',
      description: '',
      category: GoalCategory.Personal,
      framework: GoalFramework.SMART,
      duration: 12,
      difficulty: 'beginner',
      milestoneTemplates: [],
      successMetrics: [],
      commonChallenges: [],
      coachingTips: [],
      resources: [],
      isPublic: false,
      tags: []
    });
  };

  const handleAddMilestone = () => {
    const milestone: MilestoneTemplate = {
      id: `ms-${Date.now()}`,
      title: '',
      description: '',
      suggestedTimeframe: 2,
      order: (newTemplate.milestoneTemplates?.length || 0) + 1,
      isRequired: true,
      assessmentQuestions: []
    };

    setNewTemplate(prev => ({
      ...prev,
      milestones: [...(prev.milestoneTemplates || []), milestone]
    }));
  };

  const renderTemplateCard = (template: GoalTemplate) => (
    <Card
      key={template.id}
      sx={{
        background: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`
        }
      }}
      onClick={() => {
        setSelectedTemplate(template);
        setShowCreateDialog(true);
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ mr: 2 }}>
            {React.createElement(CATEGORY_CONFIG[template.category].icon, {
              sx: { 
                fontSize: 24, 
                color: CATEGORY_CONFIG[template.category].color,
                p: 1,
                bgcolor: alpha(CATEGORY_CONFIG[template.category].color, 0.1),
                borderRadius: 2
              }
            })}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {template.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={CATEGORY_CONFIG[template.category].label}
                size="small"
                sx={{ 
                  bgcolor: alpha(CATEGORY_CONFIG[template.category].color, 0.1),
                  color: CATEGORY_CONFIG[template.category].color,
                  fontWeight: 500
                }}
              />
              <Chip
                label={template.framework}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
              <Chip
                label={`${template.duration} weeks`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
              <Chip
                label={template.difficulty}
                size="small"
                color={template.difficulty === 'beginner' ? 'success' : template.difficulty === 'intermediate' ? 'warning' : 'error'}
                variant="outlined"
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {template.rating}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {template.usageCount} uses
            </Typography>
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
          {template.description}
        </Typography>

        {/* Milestones */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Milestones ({template.milestoneTemplates.length})
          </Typography>
          <Stack spacing={0.5}>
            {template.milestoneTemplates.slice(0, 3).map((milestone) => (
              <Box key={milestone.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MilestoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Week {milestone.suggestedTimeframe}: {milestone.title}
                </Typography>
              </Box>
            ))}
            {template.milestoneTemplates.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{template.milestoneTemplates.length - 3} more milestones
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Tags */}
        {template.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
              {template.tags.slice(0, 4).map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {template.tags.length > 4 && (
                <Chip
                  label={`+${template.tags.length - 4}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Created {template.createdAt.toLocaleDateString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {template.isPublic && (
              <Chip
                label="Public"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Share template
              }}
            >
              Share
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
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
            sx={{
              fontWeight: 700,
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Goal Planning & Methodologies 🎯
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Create templates, design programs, and structure your coaching methodology
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <TemplateIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {templates.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Goal Templates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <ProgramIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {programs.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Coaching Programs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <MethodologyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {methodologies.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Methodologies
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <ClientIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {programs.reduce((sum, p) => sum + p.enrolledClients, 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Enrolled Clients
                </Typography>
              </CardContent>
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
                  index === 0 ? <TemplateIcon /> :
                  index === 1 ? <ProgramIcon /> :
                  index === 2 ? <MethodologyIcon /> :
                  <AnalyticsIcon />
                }
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Card>

        {/* Main Content */}
        <Box sx={{ position: 'relative', minHeight: 400 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress size={50} />
            </Box>
          ) : (
            <>
              {/* Goal Templates Tab */}
              {currentTab === 0 && (
                <Grid container spacing={3}>
                  {templates.map((template) => (
                    <Grid item xs={12} lg={6} key={template.id}>
                      {renderTemplateCard(template)}
                    </Grid>
                  ))}
                  
                  {templates.length === 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                        <TemplateIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                          No goal templates yet
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                          Create your first goal template to help clients with structured goal-setting
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setDialogType('template');
                            setShowCreateDialog(true);
                          }}
                          sx={{ borderRadius: 3 }}
                        >
                          Create Goal Template
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}
            </>
          )}
        </Box>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="create new"
          onClick={() => {
            setDialogType('template');
            setShowCreateDialog(true);
          }}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, md: 32 },
            right: { xs: 16, md: 32 },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
          }}
        >
          <AddIcon />
        </Fab>

        {/* Create Dialog */}
        <Dialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, minHeight: '70vh' }
          }}
        >
          <DialogTitle>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Create Goal Template 📋
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Stepper activeStep={createStep} orientation="vertical">
              {createSteps[dialogType].map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {/* Template Creation Steps */}
                    {dialogType === 'template' && index === 0 && (
                      <Box sx={{ py: 2 }}>
                        <TextField
                          fullWidth
                          label="Template Title"
                          value={newTemplate.title}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                          sx={{ mb: 3 }}
                        />
                        
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={newTemplate.description}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                          sx={{ mb: 3 }}
                        />
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Category</InputLabel>
                              <Select
                                value={newTemplate.category}
                                label="Category"
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value as GoalCategory }))}
                              >
                                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                  <MenuItem key={key} value={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {React.createElement(config.icon, { sx: { fontSize: 20, color: config.color } })}
                                      {config.label}
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Framework</InputLabel>
                              <Select
                                value={newTemplate.framework}
                                label="Framework"
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, framework: e.target.value as GoalFramework }))}
                              >
                                {Object.entries(GoalFramework).map(([key, value]) => (
                                  <MenuItem key={key} value={value}>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {value}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {FRAMEWORK_DESCRIPTIONS[value]}
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Duration (weeks)"
                              value={newTemplate.duration}
                              onChange={(e) => setNewTemplate(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                              <InputLabel>Difficulty</InputLabel>
                              <Select
                                value={newTemplate.difficulty}
                                label="Difficulty"
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                              >
                                <MenuItem value="beginner">Beginner</MenuItem>
                                <MenuItem value="intermediate">Intermediate</MenuItem>
                                <MenuItem value="advanced">Advanced</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={newTemplate.isPublic}
                                  onChange={(e) => setNewTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                                />
                              }
                              label="Make Public"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                      {index > 0 && (
                        <Button
                          onClick={() => setCreateStep(index - 1)}
                          variant="outlined"
                        >
                          Back
                        </Button>
                      )}
                      
                      {index < createSteps[dialogType].length - 1 ? (
                        <Button
                          onClick={() => setCreateStep(index + 1)}
                          variant="contained"
                          disabled={
                            index === 0 && (!newTemplate.title || !newTemplate.description)
                          }
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCreateTemplate}
                          variant="contained"
                          startIcon={<SaveIcon />}
                          disabled={!newTemplate.title || !newTemplate.description}
                        >
                          Create Template
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default CoachGoalPlanningPage;