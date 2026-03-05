/**
 * ClientProgressSharing - Progress sharing and celebration features for coaching clients
 * Allows clients to share achievements, milestones, and progress updates with coaches
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Badge,
  Fab,
  Divider,
  Paper,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  AvatarGroup,
  Alert
} from '@mui/material';
import {
  Share as ShareIcon,
  EmojiEvents as AchievementIcon,
  Celebration as CelebrationIcon,
  PhotoCamera as PhotoIcon,
  VideoCall as VideoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as LikeIcon,
  Comment as CommentIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  CheckCircle as CompleteIcon,
  Timeline as ProgressIcon,
  Star as StarIcon,
  TrendingUp as GrowthIcon,
  Psychology as MindsetIcon,
  Lightbulb as InsightIcon,
  Group as TeamIcon,
  Send as SendIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface Coach {
  id: string;
  name: string;
  profileImage?: string;
  specialization: string;
}

interface ProgressUpdate {
  id: string;
  title: string;
  description: string;
  type: 'achievement' | 'milestone' | 'insight' | 'breakthrough' | 'challenge';
  category: string;
  date: Date;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
  sharedWith: string[]; // Coach IDs
  visibility: 'coaches' | 'selected' | 'private';
  reactions: {
    coachId: string;
    coachName: string;
    type: 'like' | 'celebrate' | 'inspire' | 'proud';
    message?: string;
    date: Date;
  }[];
  comments: {
    id: string;
    authorId: string;
    authorName: string;
    authorType: 'client' | 'coach';
    message: string;
    date: Date;
  }[];
  progress?: {
    current: number;
    target: number;
    unit: string;
  };
  tags: string[];
  isPrivate: boolean;
}

interface CelebrationMoment {
  id: string;
  title: string;
  description: string;
  type: 'goal_completed' | 'streak_milestone' | 'breakthrough' | 'anniversary';
  date: Date;
  relatedGoalId?: string;
  celebrationData: {
    confettiColors: string[];
    celebrationMessage: string;
    shareableImage?: string;
  };
  sharedWithCoaches: boolean;
  coachReactions: {
    coachId: string;
    coachName: string;
    reaction: 'celebrate' | 'proud' | 'inspired';
    message: string;
  }[];
}

enum TabValue {
  PROGRESS_FEED = 0,
  CELEBRATIONS = 1,
  ACHIEVEMENTS = 2,
  ANALYTICS = 3
}

const ClientProgressSharing: React.FC = () => {
  const theme = useTheme();
  const { translations: t } = useTranslation();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState<TabValue>(TabValue.PROGRESS_FEED);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [celebrations, setCelebrations] = useState<CelebrationMoment[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCelebrationDialog, setShowCelebrationDialog] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<ProgressUpdate | null>(null);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // New progress update form
  const [newUpdate, setNewUpdate] = useState<Partial<ProgressUpdate>>({
    title: '',
    description: '',
    type: 'achievement',
    category: 'personal',
    visibility: 'coaches',
    sharedWith: [],
    tags: [],
    isPrivate: false
  });

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API calls
      const mockCoaches: Coach[] = [
        {
          id: 'coach1',
          name: 'Dr. Sarah Johnson',
          specialization: 'Life & Career Coaching',
          profileImage: '/api/placeholder/coach1'
        },
        {
          id: 'coach2',
          name: 'Marcus Rodriguez',
          specialization: 'Mindfulness & Stress Management',
          profileImage: '/api/placeholder/coach2'
        }
      ];

      const mockProgressUpdates: ProgressUpdate[] = [
        {
          id: 'update1',
          title: 'Completed My First 5K Run! 🏃‍♀️',
          description: 'After 8 weeks of training, I finally completed my first 5K run without stopping. Feeling incredible and proud of this milestone!',
          type: 'achievement',
          category: 'health',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          sharedWith: ['coach1'],
          visibility: 'coaches',
          reactions: [
            {
              coachId: 'coach1',
              coachName: 'Dr. Sarah Johnson',
              type: 'celebrate',
              message: 'This is absolutely amazing! Your dedication to training really paid off. I\'m so proud of your consistency and determination!',
              date: new Date(Date.now() - 23 * 60 * 60 * 1000)
            }
          ],
          comments: [
            {
              id: 'comment1',
              authorId: 'coach1',
              authorName: 'Dr. Sarah Johnson',
              authorType: 'coach',
              message: 'What was the most challenging part of the training for you?',
              date: new Date(Date.now() - 22 * 60 * 60 * 1000)
            }
          ],
          progress: {
            current: 5,
            target: 5,
            unit: 'km'
          },
          tags: ['fitness', 'running', 'milestone'],
          isPrivate: false
        },
        {
          id: 'update2',
          title: 'Weekly Meditation Streak - 30 Days! 🧘‍♀️',
          description: 'Reached 30 consecutive days of daily meditation practice. Feeling more centered and peaceful than ever.',
          type: 'milestone',
          category: 'mindfulness',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          sharedWith: ['coach2'],
          visibility: 'selected',
          reactions: [
            {
              coachId: 'coach2',
              coachName: 'Marcus Rodriguez',
              type: 'proud',
              message: 'Your commitment to daily practice is inspiring! The peace you\'re feeling is the fruit of your dedication.',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            }
          ],
          comments: [],
          progress: {
            current: 30,
            target: 30,
            unit: 'days'
          },
          tags: ['meditation', 'mindfulness', 'streak'],
          isPrivate: false
        }
      ];

      const mockCelebrations: CelebrationMoment[] = [
        {
          id: 'celebration1',
          title: '90 Days of Personal Growth! 🎉',
          description: 'Celebrating 3 months of consistent work on personal development with my amazing coaching team.',
          type: 'anniversary',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          celebrationData: {
            confettiColors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'],
            celebrationMessage: 'You\'ve grown so much in these 90 days! Keep shining! ✨',
            shareableImage: '/api/placeholder/celebration1'
          },
          sharedWithCoaches: true,
          coachReactions: [
            {
              coachId: 'coach1',
              coachName: 'Dr. Sarah Johnson',
              reaction: 'celebrate',
              message: 'What an incredible journey these 90 days have been! Your growth is remarkable!'
            },
            {
              coachId: 'coach2',
              coachName: 'Marcus Rodriguez',
              reaction: 'proud',
              message: 'Watching your transformation has been such a privilege. Here\'s to the next 90 days!'
            }
          ]
        }
      ];

      setCoaches(mockCoaches);
      setProgressUpdates(mockProgressUpdates);
      setCelebrations(mockCelebrations);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareUpdate = async () => {
    try {
      // TODO: API call to create progress update
      const update: ProgressUpdate = {
        ...newUpdate as ProgressUpdate,
        id: Date.now().toString(),
        date: new Date(),
        reactions: [],
        comments: []
      };

      setProgressUpdates(prev => [update, ...prev]);
      setShowShareDialog(false);
      setNewUpdate({
        title: '',
        description: '',
        type: 'achievement',
        category: 'personal',
        visibility: 'coaches',
        sharedWith: [],
        tags: [],
        isPrivate: false
      });
    } catch (error) {
      console.error('Failed to share update:', error);
    }
  };

  const handleReaction = async (updateId: string, reactionType: string) => {
    // TODO: API call to add reaction
    console.log('Adding reaction:', reactionType, 'to update:', updateId);
  };

  const filteredUpdates = progressUpdates.filter(update => {
    const typeMatch = typeFilter === 'all' || update.type === typeFilter;
    const coachMatch = coachFilter === 'all' || update.sharedWith.includes(coachFilter);
    const dateMatch = dateFilter === 'all' || 
      (dateFilter === 'week' && update.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && update.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    return typeMatch && coachMatch && dateMatch;
  });

  const renderProgressFeed = () => (
    <Stack spacing={3}>
      {/* Filters */}
      <Card sx={{ background: alpha(theme.palette.background.paper, 0.8), borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FilterIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t.clientPortal?.progressSharing?.filters?.title || 'Filter Updates'}
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>{t.clientPortal?.progressSharing?.filters?.type || 'Type'}</InputLabel>
                <Select
                  value={typeFilter}
                  label={t.clientPortal?.progressSharing?.filters?.type || 'Type'}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">{t.clientPortal?.progressSharing?.filters?.allTypes || 'All Types'}</MenuItem>
                  <MenuItem value="achievement">{t.clientPortal?.progressSharing?.filters?.achievements || '🏆 Achievements'}</MenuItem>
                  <MenuItem value="milestone">{t.clientPortal?.progressSharing?.filters?.milestones || '🎯 Milestones'}</MenuItem>
                  <MenuItem value="insight">{t.clientPortal?.progressSharing?.filters?.insights || '💡 Insights'}</MenuItem>
                  <MenuItem value="breakthrough">{t.clientPortal?.progressSharing?.filters?.breakthroughs || '⚡ Breakthroughs'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>{t.clientPortal?.progressSharing?.filters?.coach || 'Coach'}</InputLabel>
                <Select
                  value={coachFilter}
                  label={t.clientPortal?.progressSharing?.filters?.coach || 'Coach'}
                  onChange={(e) => setCoachFilter(e.target.value)}
                >
                  <MenuItem value="all">{t.clientPortal?.progressSharing?.filters?.allCoaches || 'All Coaches'}</MenuItem>
                  {coaches.map(coach => (
                    <MenuItem key={coach.id} value={coach.id}>
                      {coach.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>{t.clientPortal?.progressSharing?.filters?.timePeriod || 'Time Period'}</InputLabel>
                <Select
                  value={dateFilter}
                  label={t.clientPortal?.progressSharing?.filters?.timePeriod || 'Time Period'}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <MenuItem value="all">{t.clientPortal?.progressSharing?.filters?.allTime || 'All Time'}</MenuItem>
                  <MenuItem value="week">{t.clientPortal?.progressSharing?.filters?.thisWeek || 'This Week'}</MenuItem>
                  <MenuItem value="month">{t.clientPortal?.progressSharing?.filters?.thisMonth || 'This Month'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Progress Updates */}
      {filteredUpdates.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ShareIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {t.clientPortal?.progressSharing?.feed?.noUpdates || 'No progress updates found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t.clientPortal?.progressSharing?.feed?.noUpdatesSubtitle || 'Start sharing your journey with your coaches!'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowShareDialog(true)}
            >
              {t.clientPortal?.progressSharing?.feed?.shareFirst || 'Share First Update'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        filteredUpdates.map(update => (
          <Card
            key={update.id}
            sx={{
              background: alpha(theme.palette.background.paper, 0.9),
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Update Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <AchievementIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {update.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {update.date.toLocaleDateString()} • {update.type}
                  </Typography>
                </Box>
                <Chip
                  label={update.visibility}
                  size="small"
                  color={update.visibility === 'private' ? 'default' : 'primary'}
                />
              </Box>

              {/* Progress Bar (if applicable) */}
              {update.progress && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t.clientPortal?.progressSharing?.feed?.progress || 'Progress'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {update.progress.current}/{update.progress.target} {update.progress.unit}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(update.progress.current / update.progress.target) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              {/* Description */}
              <Typography variant="body1" sx={{ mb: 2 }}>
                {update.description}
              </Typography>

              {/* Tags */}
              {update.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {update.tags.map(tag => (
                      <Chip
                        key={tag}
                        label={`#${tag}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Shared With */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  {t.clientPortal?.progressSharing?.feed?.sharedWith || 'Shared with:'}
                </Typography>
                <AvatarGroup size="small">
                  {update.sharedWith.map(coachId => {
                    const coach = coaches.find(c => c.id === coachId);
                    return coach ? (
                      <Tooltip key={coach.id} title={coach.name}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                          {coach.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </Tooltip>
                    ) : null;
                  })}
                </AvatarGroup>
              </Box>

              {/* Reactions */}
              {update.reactions.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t.clientPortal?.progressSharing?.feed?.coachReactions || 'Coach Reactions:'}
                  </Typography>
                  {update.reactions.map(reaction => (
                    <Paper
                      key={reaction.coachId}
                      sx={{
                        p: 2,
                        mb: 1,
                        background: alpha(theme.palette.success.light, 0.1),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'success.main' }}>
                          {reaction.type === 'celebrate' ? '🎉' : reaction.type === 'proud' ? '👏' : '❤️'}
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {reaction.coachName}
                        </Typography>
                        <Chip
                          label={reaction.type}
                          size="small"
                          color="success"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      {reaction.message && (
                        <Typography variant="body2" sx={{ ml: 4 }}>
                          {reaction.message}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Comments */}
              {update.comments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t.clientPortal?.progressSharing?.feed?.comments || 'Comments:'}
                  </Typography>
                  {update.comments.map(comment => (
                    <Paper
                      key={comment.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        background: alpha(theme.palette.info.light, 0.05),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: 'info.main', fontSize: '0.7rem' }}>
                          {comment.authorName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {comment.authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {comment.date.toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ ml: 3.5 }}>
                        {comment.message}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<LikeIcon />}
                    onClick={() => handleReaction(update.id, 'like')}
                  >
                    {t.clientPortal?.progressSharing?.feed?.react || 'React'}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CommentIcon />}
                  >
                    {t.clientPortal?.progressSharing?.feed?.comment || 'Comment'}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small">
                    <ShareIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );

  const renderCelebrations = () => (
    <Stack spacing={3}>
      {celebrations.map(celebration => (
        <Card
          key={celebration.id}
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.1)} 100%)`,
            border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CelebrationIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {celebration.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              {celebration.description}
            </Typography>
            
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.warning.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {celebration.celebrationData.celebrationMessage}
            </Typography>

            {celebration.coachReactions.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {t.clientPortal?.progressSharing?.celebrations?.coachCelebrations || 'Coach Celebrations 🎊'}
                </Typography>
                {celebration.coachReactions.map(reaction => (
                  <Paper
                    key={reaction.coachId}
                    sx={{
                      p: 2,
                      mb: 2,
                      background: alpha(theme.palette.success.light, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {reaction.coachName} {reaction.reaction === 'celebrate' ? '🎉' : reaction.reaction === 'proud' ? '👏' : '✨'}
                    </Typography>
                    <Typography variant="body2">
                      {reaction.message}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}

            <Button
              variant="contained"
              size="large"
              startIcon={<ShareIcon />}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.warning.main} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.warning.dark} 100%)`
                }
              }}
            >
              {t.clientPortal?.progressSharing?.celebrations?.shareThisCelebration || 'Share This Celebration'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const renderShareDialog = () => (
    <Dialog
      open={showShareDialog}
      onClose={() => setShowShareDialog(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <ShareIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t.clientPortal?.progressSharing?.sharing?.shareProgress || 'Share Your Progress'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.clientPortal?.progressSharing?.sharing?.shareSubtitle || 'Let your coaches celebrate your journey with you'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label={t.clientPortal?.progressSharing?.sharing?.updateTitle || 'Update Title'}
            placeholder={t.clientPortal?.progressSharing?.sharing?.titlePlaceholder || 'What are you celebrating today?'}
            value={newUpdate.title}
            onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label={t.clientPortal?.progressSharing?.sharing?.description || 'Description'}
            placeholder={t.clientPortal?.progressSharing?.sharing?.descriptionPlaceholder || 'Share the details of your progress, insights, or achievements...'}
            value={newUpdate.description}
            onChange={(e) => setNewUpdate(prev => ({ ...prev, description: e.target.value }))}
          />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t.clientPortal?.progressSharing?.sharing?.updateType || 'Update Type'}</InputLabel>
                <Select
                  value={newUpdate.type}
                  label={t.clientPortal?.progressSharing?.sharing?.updateType || 'Update Type'}
                  onChange={(e) => setNewUpdate(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="achievement">🏆 Achievement</MenuItem>
                  <MenuItem value="milestone">🎯 Milestone</MenuItem>
                  <MenuItem value="insight">💡 Insight</MenuItem>
                  <MenuItem value="breakthrough">⚡ Breakthrough</MenuItem>
                  <MenuItem value="challenge">🚧 Challenge</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t.clientPortal?.progressSharing?.sharing?.visibility || 'Visibility'}</InputLabel>
                <Select
                  value={newUpdate.visibility}
                  label={t.clientPortal?.progressSharing?.sharing?.visibility || 'Visibility'}
                  onChange={(e) => setNewUpdate(prev => ({ ...prev, visibility: e.target.value as any }))}
                >
                  <MenuItem value="coaches">{t.clientPortal?.progressSharing?.sharing?.visibilityOptions?.coaches || 'All My Coaches'}</MenuItem>
                  <MenuItem value="selected">{t.clientPortal?.progressSharing?.sharing?.visibilityOptions?.selected || 'Selected Coaches'}</MenuItem>
                  <MenuItem value="private">{t.clientPortal?.progressSharing?.sharing?.visibilityOptions?.private || 'Private (Just Me)'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {newUpdate.visibility === 'selected' && (
            <FormControl fullWidth>
              <InputLabel>{t.clientPortal?.progressSharing?.sharing?.selectCoaches || 'Select Coaches'}</InputLabel>
              <Select
                multiple
                value={newUpdate.sharedWith || []}
                label={t.clientPortal?.progressSharing?.sharing?.selectCoaches || 'Select Coaches'}
                onChange={(e) => setNewUpdate(prev => ({ ...prev, sharedWith: e.target.value as string[] }))}
              >
                {coaches.map(coach => (
                  <MenuItem key={coach.id} value={coach.id}>
                    {coach.name} - {coach.specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label={t.clientPortal?.progressSharing?.sharing?.tags || 'Tags (comma separated)'}
            placeholder={t.clientPortal?.progressSharing?.sharing?.tagsPlaceholder || 'fitness, milestone, breakthrough'}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
              setNewUpdate(prev => ({ ...prev, tags }));
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={() => setShowShareDialog(false)}>
          {t.clientPortal?.progressSharing?.common?.cancel || 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleShareUpdate}
          startIcon={<SendIcon />}
          disabled={!newUpdate.title || !newUpdate.description}
        >
          {t.clientPortal?.progressSharing?.sharing?.shareUpdate || 'Share Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>{t.clientPortal?.progressSharing?.common?.loading || 'Loading your progress...'}</Typography>
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
            {t.clientPortal?.progressSharing?.title || 'Your Progress Journey 🌟'}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            {t.clientPortal?.progressSharing?.subtitle || 'Share your achievements and celebrate with your coaching team'}
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
            <Tab label={t.clientPortal?.progressSharing?.tabs?.progressFeed || 'Progress Feed'} icon={<ProgressIcon />} iconPosition="start" />
            <Tab label={t.clientPortal?.progressSharing?.tabs?.celebrations || 'Celebrations'} icon={<CelebrationIcon />} iconPosition="start" />
            <Tab label={t.clientPortal?.progressSharing?.tabs?.analytics || 'Analytics'} icon={<GrowthIcon />} iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab Content */}
        {selectedTab === TabValue.PROGRESS_FEED && renderProgressFeed()}
        {selectedTab === TabValue.CELEBRATIONS && renderCelebrations()}
        {selectedTab === TabValue.ANALYTICS && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <GrowthIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {t.clientPortal?.progressSharing?.analytics?.comingSoon || 'Analytics Coming Soon'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.clientPortal?.progressSharing?.analytics?.trackProgress || 'Track your progress trends and insights'}
              </Typography>
            </CardContent>
          </Card>
        )}

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
          onClick={() => setShowShareDialog(true)}
        >
          <AddIcon />
        </Fab>

        {/* Share Dialog */}
        {renderShareDialog()}
      </Box>
    </Box>
  );
};

export default ClientProgressSharing;