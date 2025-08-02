/**
 * ClientOnboardingPage - Welcome flow for new coaching clients
 * Guides clients through initial goal setting and coach matching
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Avatar,
  Stack,
  LinearProgress,
  useTheme,
  alpha,
  Grid,
  Chip,
  TextField,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox,
  Paper
} from '@mui/material';
import {
  AutoAwesome as SparkleIcon,
  Psychology as MindIcon,
  EmojiEvents as GoalIcon,
  Groups as CoachIcon,
  CalendarToday as ScheduleIcon,
  Celebration as CelebrationIcon,
  ArrowForward as NextIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';

interface OnboardingData {
  welcomeComplete: boolean;
  primaryGoal: string;
  secondaryGoals: string[];
  motivationLevel: number;
  timeCommitment: string;
  currentChallenges: string[];
  successDefinition: string;
  coachPreferences: string[];
  sessionSchedule: string;
  readyToStart: boolean;
  // Enhanced profile data
  personalInfo: {
    firstName: string;
    lastName: string;
    timezone: string;
    preferredLanguage: string;
  };
  preferences: {
    communicationStyle: string;
    sessionReminders: boolean;
    progressTracking: boolean;
    shareProgress: boolean;
  };
  initialGoals: {
    shortTerm: string[];
    longTerm: string[];
    priorities: string[];
  };
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const getLifeAreas = (t: any) => [
  t.onboarding.categories.career,
  t.onboarding.categories.relationships,
  t.onboarding.categories.health,
  t.onboarding.categories.financial,
  t.onboarding.categories.personal,
  t.onboarding.categories.balance,
  t.onboarding.categories.goals,
  t.onboarding.categories.stress
];

const getChallenges = (t: any) => [
  t.onboarding.challenges.motivation,
  t.onboarding.challenges.time,
  t.onboarding.challenges.procrastination,
  t.onboarding.challenges.doubt,
  t.onboarding.challenges.direction,
  t.onboarding.challenges.fear,
  t.onboarding.challenges.overwhelm,
  t.onboarding.challenges.perfectionism
];

const getCoachPreferences = (t: any) => [
  t.onboarding.coachStyles.supportive,
  t.onboarding.coachStyles.direct,
  t.onboarding.coachStyles.datadriven,
  t.onboarding.coachStyles.holistic,
  t.onboarding.coachStyles.action,
  t.onboarding.coachStyles.mindfulness
];

const ClientOnboardingPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const LIFE_AREAS = getLifeAreas(t);
  const CHALLENGES = getChallenges(t);
  const COACH_PREFERENCES = getCoachPreferences(t);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    welcomeComplete: false,
    primaryGoal: '',
    secondaryGoals: [],
    motivationLevel: 7,
    timeCommitment: '',
    currentChallenges: [],
    successDefinition: '',
    coachPreferences: [],
    sessionSchedule: '',
    readyToStart: false,
    personalInfo: {
      firstName: '',
      lastName: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferredLanguage: 'en'
    },
    preferences: {
      communicationStyle: 'supportive',
      sessionReminders: true,
      progressTracking: true,
      shareProgress: true
    },
    initialGoals: {
      shortTerm: [],
      longTerm: [],
      priorities: []
    }
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding - save data and create initial goals
      await completeOnboarding();
      navigate('/client/dashboard');
    }
  };
  
  const completeOnboarding = async () => {
    try {
      // Save onboarding data to localStorage for now (replace with API call)
      const onboardingProfile = {
        ...data,
        completedAt: new Date().toISOString(),
        onboardingVersion: '1.0'
      };
      
      localStorage.setItem('client-onboarding-data', JSON.stringify(onboardingProfile));
      
      // Create initial goals based on onboarding responses
      const initialGoals = createInitialGoals();
      localStorage.setItem('client-initial-goals', JSON.stringify(initialGoals));
      
      console.log('Onboarding completed successfully:', onboardingProfile);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };
  
  const createInitialGoals = () => {
    const goals = [];
    
    // Create a primary goal based on the selected focus area
    if (data.primaryGoal) {
      goals.push({
        id: `goal-primary-${Date.now()}`,
        title: `Improve ${data.primaryGoal.replace(/[🎯💼❤️💪💰🧠⚖️😌]/g, '').trim()}`,
        description: data.successDefinition || `Work on developing skills and achieving growth in ${data.primaryGoal}`,
        category: mapGoalToCategory(data.primaryGoal),
        priority: 'high',
        status: 'active',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        createdDate: new Date(),
        progress: 0,
        milestones: [],
        isSharedWithCoaches: true,
        challenges: data.currentChallenges,
        motivationLevel: data.motivationLevel
      });
    }
    
    // Create secondary goals
    data.secondaryGoals.forEach((goal, index) => {
      goals.push({
        id: `goal-secondary-${Date.now()}-${index}`,
        title: `Develop ${goal.replace(/[🎯💼❤️💪💰🧠⚖️😌]/g, '').trim()}`,
        description: `Secondary focus area for personal growth and development`,
        category: mapGoalToCategory(goal),
        priority: 'medium',
        status: 'active',
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        createdDate: new Date(),
        progress: 0,
        milestones: [],
        isSharedWithCoaches: data.preferences.shareProgress
      });
    });
    
    return goals;
  };
  
  const mapGoalToCategory = (goalArea: string) => {
    if (goalArea.includes('Career') || goalArea.includes('Professional')) return 'career';
    if (goalArea.includes('Relationships') || goalArea.includes('Social')) return 'relationships';
    if (goalArea.includes('Health') || goalArea.includes('Fitness')) return 'health';
    if (goalArea.includes('Financial') || goalArea.includes('Money')) return 'finance';
    if (goalArea.includes('Personal Development') || goalArea.includes('Growth')) return 'personal';
    if (goalArea.includes('Work-Life Balance')) return 'lifestyle';
    if (goalArea.includes('Goal Achievement')) return 'personal';
    if (goalArea.includes('Stress Management')) return 'mindset';
    return 'personal';
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: t.onboarding.steps.welcome.title,
      description: t.onboarding.steps.welcome.description,
      icon: <SparkleIcon />,
      component: (
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Avatar
            sx={{
              width: 120,
              height: 120,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              fontSize: '3rem',
              mb: 2
            }}
          >
            <MindIcon sx={{ fontSize: '4rem' }} />
          </Avatar>
          
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            {t.onboarding.steps.welcome.congratulations}
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
            {t.onboarding.steps.welcome.subtitle}
          </Typography>

          <Paper sx={{ p: 3, background: alpha(theme.palette.info.light, 0.1), borderRadius: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
              {t.onboarding.steps.welcome.nextSteps}
            </Typography>
            <Stack spacing={1} alignItems="flex-start">
              <Typography variant="body2">{t.onboarding.steps.welcome.identify}</Typography>
              <Typography variant="body2">{t.onboarding.steps.welcome.understand}</Typography>
              <Typography variant="body2">{t.onboarding.steps.welcome.match}</Typography>
              <Typography variant="body2">{t.onboarding.steps.welcome.setup}</Typography>
            </Stack>
          </Paper>
        </Stack>
      )
    },
    {
      id: 'goals',
      title: t.onboarding.steps.goals.title,
      description: t.onboarding.steps.goals.description,
      icon: <GoalIcon />,
      component: (
        <Stack spacing={4}>
          <Typography variant="h5" textAlign="center" sx={{ fontWeight: 600, mb: 3 }}>
            {t.onboarding.steps.goals.question}
          </Typography>
          
          <Grid container spacing={2}>
            {LIFE_AREAS.map((area) => (
              <Grid item xs={12} sm={6} key={area}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: data.primaryGoal === area 
                      ? `2px solid ${theme.palette.primary.main}` 
                      : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    background: data.primaryGoal === area
                      ? alpha(theme.palette.primary.light, 0.1)
                      : alpha(theme.palette.background.paper, 0.5),
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                    }
                  }}
                  onClick={() => updateData({ primaryGoal: area })}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {area}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t.onboarding.steps.goals.secondary}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {LIFE_AREAS.filter(area => area !== data.primaryGoal).map((area) => (
                <Chip
                  key={area}
                  label={area}
                  clickable
                  color={data.secondaryGoals.includes(area) ? 'primary' : 'default'}
                  onClick={() => {
                    const newGoals = data.secondaryGoals.includes(area)
                      ? data.secondaryGoals.filter(g => g !== area)
                      : [...data.secondaryGoals, area];
                    updateData({ secondaryGoals: newGoals });
                  }}
                  sx={{ borderRadius: 6 }}
                />
              ))}
            </Box>
          </Box>
        </Stack>
      )
    },
    {
      id: 'challenges',
      title: t.onboarding.steps.challenges.title,
      description: t.onboarding.steps.challenges.description,
      icon: <MindIcon />,
      component: (
        <Stack spacing={4}>
          <Typography variant="h5" textAlign="center" sx={{ fontWeight: 600, mb: 3 }}>
            {t.onboarding.steps.challenges.question}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {CHALLENGES.map((challenge) => (
              <Chip
                key={challenge}
                label={challenge}
                clickable
                size="large"
                color={data.currentChallenges.includes(challenge) ? 'primary' : 'default'}
                onClick={() => {
                  const newChallenges = data.currentChallenges.includes(challenge)
                    ? data.currentChallenges.filter(c => c !== challenge)
                    : [...data.currentChallenges, challenge];
                  updateData({ currentChallenges: newChallenges });
                }}
                sx={{ 
                  borderRadius: 6,
                  py: 2,
                  px: 3,
                  '&.MuiChip-colorPrimary': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                  }
                }}
              />
            ))}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
              {t.onboarding.steps.challenges.motivation}
            </Typography>
            <Box sx={{ px: 4 }}>
              <Slider
                value={data.motivationLevel}
                onChange={(_, value) => updateData({ motivationLevel: value as number })}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="on"
                sx={{
                  '& .MuiSlider-thumb': {
                    width: 24,
                    height: 24,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                  },
                  '& .MuiSlider-track': {
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">{t.onboarding.steps.challenges.motivationLow}</Typography>
                <Typography variant="caption" color="text.secondary">{t.onboarding.steps.challenges.motivationHigh}</Typography>
              </Box>
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label={t.onboarding.steps.challenges.success}
            placeholder={t.onboarding.steps.challenges.successPlaceholder}
            value={data.successDefinition}
            onChange={(e) => updateData({ successDefinition: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </Stack>
      )
    },
    {
      id: 'coach-matching',
      title: t.onboarding.steps.coaching.title,
      description: t.onboarding.steps.coaching.description,
      icon: <CoachIcon />,
      component: (
        <Stack spacing={4}>
          <Typography variant="h5" textAlign="center" sx={{ fontWeight: 600, mb: 3 }}>
            {t.onboarding.steps.coaching.style}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {COACH_PREFERENCES.map((preference) => (
              <Chip
                key={preference}
                label={preference}
                clickable
                size="large"
                color={data.coachPreferences.includes(preference) ? 'primary' : 'default'}
                onClick={() => {
                  const newPrefs = data.coachPreferences.includes(preference)
                    ? data.coachPreferences.filter(p => p !== preference)
                    : [...data.coachPreferences, preference];
                  updateData({ coachPreferences: newPrefs });
                }}
                sx={{ 
                  borderRadius: 6,
                  py: 2,
                  px: 3,
                  '&.MuiChip-colorPrimary': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                  }
                }}
              />
            ))}
          </Box>

          <TextField
            select
            fullWidth
            label={t.onboarding.steps.coaching.timeCommitment}
            value={data.timeCommitment}
            onChange={(e) => updateData({ timeCommitment: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          >
            <MenuItem value="1-2 hours">{t.onboarding.timeCommitments.low}</MenuItem>
            <MenuItem value="3-4 hours">{t.onboarding.timeCommitments.medium}</MenuItem>
            <MenuItem value="5+ hours">{t.onboarding.timeCommitments.high}</MenuItem>
            <MenuItem value="flexible">{t.onboarding.timeCommitments.flexible}</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label={t.onboarding.steps.coaching.schedule}
            value={data.sessionSchedule}
            onChange={(e) => updateData({ sessionSchedule: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          >
            <MenuItem value="weekly">{t.onboarding.schedules.weekly}</MenuItem>
            <MenuItem value="biweekly">{t.onboarding.schedules.biweekly}</MenuItem>
            <MenuItem value="monthly">{t.onboarding.schedules.monthly}</MenuItem>
            <MenuItem value="intensive">{t.onboarding.schedules.intensive}</MenuItem>
          </TextField>
        </Stack>
      )
    },
    {
      id: 'ready',
      title: t.onboarding.steps.ready.title,
      description: t.onboarding.steps.ready.description,
      icon: <CelebrationIcon />,
      component: (
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Avatar
            sx={{
              width: 120,
              height: 120,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.warning.main} 100%)`,
              fontSize: '3rem',
              mb: 2
            }}
          >
            <CelebrationIcon sx={{ fontSize: '4rem' }} />
          </Avatar>
          
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            {t.onboarding.steps.ready.amazing}
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
            {t.onboarding.steps.ready.subtitle}
          </Typography>

          <Paper sx={{ p: 4, background: alpha(theme.palette.success.light, 0.1), borderRadius: 3, width: '100%', maxWidth: 500 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              {t.onboarding.steps.ready.summary}
            </Typography>
            <Stack spacing={2} alignItems="flex-start">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StarIcon color="primary" />
                <Typography variant="body2">
                  <strong>{t.onboarding.steps.ready.primaryFocus}</strong> {data.primaryGoal}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="body2">
                  <strong>{t.onboarding.steps.ready.schedule}</strong> {data.sessionSchedule || t.onboarding.schedules.weekly}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MindIcon color="primary" />
                <Typography variant="body2">
                  <strong>{t.onboarding.steps.ready.motivation}</strong> {data.motivationLevel}/10
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <FormControlLabel
            control={
              <Checkbox
                checked={data.readyToStart}
                onChange={(e) => updateData({ readyToStart: e.target.checked })}
              />
            }
            label={t.onboarding.steps.ready.ready}
            sx={{ mt: 3 }}
          />
        </Stack>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 50%, ${theme.palette.background.default} 100%)`,
        p: 2
      }}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
        {/* Progress Header */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.95), borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {currentStepData.icon}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentStepData.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentStepData.description}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {currentStep + 1} of {steps.length}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card sx={{ background: alpha(theme.palette.background.paper, 0.95), borderRadius: 3 }}>
          <CardContent sx={{ p: 6 }}>
            {currentStepData.component}

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !data.primaryGoal) ||
                  (currentStep === 2 && data.currentChallenges.length === 0) ||
                  (currentStep === 3 && (!data.timeCommitment || !data.sessionSchedule)) ||
                  (currentStep === 4 && !data.readyToStart)
                }
                endIcon={<NextIcon />}
                sx={{
                  px: 6,
                  py: 2,
                  borderRadius: 6,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
                  }
                }}
              >
                {currentStep === steps.length - 1 ? t.onboarding.steps.ready.enterDashboard : t.onboarding.steps.ready.continue}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ClientOnboardingPage;