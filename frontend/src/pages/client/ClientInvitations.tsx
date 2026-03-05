/**
 * ClientInvitations - Client interface for viewing and responding to coaching invitations
 * Allows clients to accept, reject, or request modifications to coaching invitations
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Badge,
  CircularProgress,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  Check as AcceptIcon,
  Close as RejectIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Star as StarIcon,
  Psychology as CoachIcon,
  CheckCircle as SuccessIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  VideoCall as OnlineIcon,
  LocationOn as InPersonIcon,
  CalendarToday as CalendarIcon,
  Timeline as DurationIcon,
  School as SpecializationIcon,
  TrendingUp as ExperienceIcon,
  QuestionAnswer as ConsultationIcon,
  Handshake as RelationshipIcon,
  Settings as PreferencesIcon,
  Feedback as FeedbackIcon
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

// Import types from invitation management (in real app, these would be in shared types)
interface CoachInvitation {
  id: string;
  coachId: string;
  coachName: string;
  coachEmail: string;
  coachSpecialization: string;
  coachRating: number;
  coachProfileImage?: string;
  coachExperience: number;
  coachBio: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  invitationType: InvitationType;
  relationshipType: RelationshipType;
  status: InvitationStatus;
  message: string;
  focusAreas: string[];
  sessionPreferences: SessionPreferences;
  proposedSchedule: ProposedSchedule;
  dataAccessLevel: DataAccessLevel;
  invitedAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  responseMessage?: string;
  rejectionReason?: string;
  metadata: InvitationMetadata;
}

interface SessionPreferences {
  sessionTypes: ('online' | 'in-person' | 'phone')[];
  sessionDuration: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'as-needed';
  preferredTimes: TimeSlot[];
  timezone: string;
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface ProposedSchedule {
  startDate: Date;
  duration: number; // weeks
  sessionsPerWeek: number;
  totalSessions: number;
}

interface InvitationMetadata {
  source: 'coach-initiated' | 'client-requested' | 'system-matched' | 'referral';
  matchingScore?: number;
  referredBy?: string;
  programId?: string;
  customFields: Record<string, any>;
}

enum InvitationType {
  COACHING_RELATIONSHIP = 'coaching_relationship',
  PROGRAM_ENROLLMENT = 'program_enrollment',
  CONSULTATION = 'consultation',
  COLLABORATION = 'collaboration'
}

enum RelationshipType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  CONSULTATION = 'consultation',
  MENTORSHIP = 'mentorship',
  GROUP = 'group'
}

enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  UNDER_REVIEW = 'under_review'
}

enum DataAccessLevel {
  FULL = 'full',
  LIMITED = 'limited',
  VIEW_ONLY = 'view_only',
  NONE = 'none'
}

const STATUS_COLORS = {
  [InvitationStatus.PENDING]: { color: '#F39C12', bgColor: alpha('#F39C12', 0.1) },
  [InvitationStatus.ACCEPTED]: { color: '#27AE60', bgColor: alpha('#27AE60', 0.1) },
  [InvitationStatus.REJECTED]: { color: '#E74C3C', bgColor: alpha('#E74C3C', 0.1) },
  [InvitationStatus.EXPIRED]: { color: '#95A5A6', bgColor: alpha('#95A5A6', 0.1) },
  [InvitationStatus.CANCELLED]: { color: '#E67E22', bgColor: alpha('#E67E22', 0.1) },
  [InvitationStatus.UNDER_REVIEW]: { color: '#3498DB', bgColor: alpha('#3498DB', 0.1) }
};

const RELATIONSHIP_TYPE_LABELS = {
  [RelationshipType.PRIMARY]: 'Primary Coach',
  [RelationshipType.SECONDARY]: 'Secondary Coach',
  [RelationshipType.CONSULTATION]: 'Consultation',
  [RelationshipType.MENTORSHIP]: 'Mentorship',
  [RelationshipType.GROUP]: 'Group Coaching'
};

const INVITATION_TYPE_LABELS = {
  [InvitationType.COACHING_RELATIONSHIP]: 'Coaching Relationship',
  [InvitationType.PROGRAM_ENROLLMENT]: 'Program Enrollment',
  [InvitationType.CONSULTATION]: 'Consultation Session',
  [InvitationType.COLLABORATION]: 'Collaboration Opportunity'
};

const ClientInvitations: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [invitations, setInvitations] = useState<CoachInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedInvitation, setSelectedInvitation] = useState<CoachInvitation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState<'accept' | 'reject' | 'modify'>('accept');
  const [responseMessage, setResponseMessage] = useState('');
  const [modificationRequests, setModificationRequests] = useState<string[]>([]);

  const tabLabels = ['All Invitations', 'Pending', 'Accepted', 'Rejected'];

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockInvitations: CoachInvitation[] = [
        {
          id: 'inv-1',
          coachId: 'coach-123',
          coachName: 'Dr. Sarah Johnson',
          coachEmail: 'sarah@clinic.com',
          coachSpecialization: 'Life & Wellness Coaching',
          coachRating: 4.9,
          coachExperience: 8,
          coachBio: 'Passionate life coach with 8+ years helping clients achieve their personal and professional goals through mindfulness and goal-setting strategies.',
          clientId: 'client-456',
          clientName: 'Emma Thompson', 
          clientEmail: 'emma@email.com',
          invitationType: InvitationType.COACHING_RELATIONSHIP,
          relationshipType: RelationshipType.PRIMARY,
          status: InvitationStatus.PENDING,
          message: 'Hi Emma! I would love to work with you on your personal development goals. Based on our initial conversation, I believe we would be a great fit for a coaching relationship focused on career transition and mindfulness practices. I have extensive experience helping professionals navigate career changes while maintaining work-life balance.',
          focusAreas: ['Career Development', 'Mindfulness', 'Goal Setting', 'Work-Life Balance'],
          sessionPreferences: {
            sessionTypes: ['online', 'in-person'],
            sessionDuration: 60,
            frequency: 'weekly',
            preferredTimes: [
              { day: 'Tuesday', startTime: '10:00', endTime: '18:00' },
              { day: 'Thursday', startTime: '10:00', endTime: '18:00' }
            ],
            timezone: 'PST'
          },
          proposedSchedule: {
            startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            duration: 16,
            sessionsPerWeek: 1,
            totalSessions: 16
          },
          dataAccessLevel: DataAccessLevel.LIMITED,
          invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          metadata: {
            source: 'coach-initiated',
            matchingScore: 88,
            customFields: {}
          }
        },
        {
          id: 'inv-2',
          coachId: 'coach-456',
          coachName: 'Marcus Rodriguez',
          coachEmail: 'marcus@clinic.com',
          coachSpecialization: 'Executive & Leadership Coaching',
          coachRating: 4.8,
          coachExperience: 12,
          coachBio: 'Former Fortune 500 executive turned coach, specializing in leadership development and career advancement for ambitious professionals.',
          clientId: 'client-456',
          clientName: 'Emma Thompson',
          clientEmail: 'emma@email.com',
          invitationType: InvitationType.PROGRAM_ENROLLMENT,
          relationshipType: RelationshipType.SECONDARY,
          status: InvitationStatus.ACCEPTED,
          message: 'Welcome to the Executive Leadership Accelerator Program! This 12-week intensive program will help you develop advanced leadership skills and executive presence. The program includes weekly coaching sessions, peer group interactions, and practical leadership challenges.',
          focusAreas: ['Executive Presence', 'Leadership Skills', 'Strategic Thinking', 'Team Management'],
          sessionPreferences: {
            sessionTypes: ['online'],
            sessionDuration: 90,
            frequency: 'weekly',
            preferredTimes: [
              { day: 'Monday', startTime: '19:00', endTime: '21:00' }
            ],
            timezone: 'EST'
          },
          proposedSchedule: {
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            duration: 12,
            sessionsPerWeek: 1,
            totalSessions: 12
          },
          dataAccessLevel: DataAccessLevel.FULL,
          invitedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          respondedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          responseMessage: 'Thank you for this opportunity! I\'m excited to start this leadership journey and develop my executive skills.',
          metadata: {
            source: 'program_enrollment',
            programId: 'prog-leadership-accelerator',
            customFields: {}
          }
        },
        {
          id: 'inv-3',
          coachId: 'coach-789',
          coachName: 'Dr. Aisha Patel',
          coachEmail: 'aisha@clinic.com',
          coachSpecialization: 'Wellness & Mindfulness Coaching',
          coachRating: 4.9,
          coachExperience: 6,
          coachBio: 'Certified wellness coach and mindfulness instructor with expertise in stress management and holistic wellness approaches.',
          clientId: 'client-456',
          clientName: 'Emma Thompson',
          clientEmail: 'emma@email.com',
          invitationType: InvitationType.CONSULTATION,
          relationshipType: RelationshipType.CONSULTATION,
          status: InvitationStatus.REJECTED,
          message: 'I would like to offer you a complimentary consultation session to discuss your wellness goals and explore how mindfulness practices can support your personal development journey.',
          focusAreas: ['Stress Management', 'Mindfulness', 'Wellness Planning'],
          sessionPreferences: {
            sessionTypes: ['phone', 'online'],
            sessionDuration: 45,
            frequency: 'as-needed',
            preferredTimes: [
              { day: 'Friday', startTime: '14:00', endTime: '17:00' }
            ],
            timezone: 'CST'
          },
          proposedSchedule: {
            startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            duration: 1,
            sessionsPerWeek: 1,
            totalSessions: 1
          },
          dataAccessLevel: DataAccessLevel.VIEW_ONLY,
          invitedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          responseMessage: 'Thank you for the offer. While I appreciate the opportunity, I\'m currently focused on my career coaching and don\'t have bandwidth for additional wellness sessions at this time.',
          rejectionReason: 'Time constraints and current focus priorities',
          metadata: {
            source: 'coach-initiated',
            matchingScore: 65,
            customFields: {}
          }
        }
      ];

      setInvitations(mockInvitations);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      setIsLoading(false);
    }
  };

  const getFilteredInvitations = () => {
    switch (currentTab) {
      case 1: // Pending
        return invitations.filter(inv => inv.status === InvitationStatus.PENDING);
      case 2: // Accepted
        return invitations.filter(inv => inv.status === InvitationStatus.ACCEPTED);
      case 3: // Rejected
        return invitations.filter(inv => inv.status === InvitationStatus.REJECTED);
      default: // All
        return invitations;
    }
  };

  const handleInvitationResponse = async () => {
    if (!selectedInvitation) return;

    try {
      // TODO: Send response via API
      console.log('Responding to invitation:', {
        invitationId: selectedInvitation.id,
        response: responseType,
        message: responseMessage,
        modifications: modificationRequests
      });

      // Update local state
      setInvitations(prev => prev.map(inv => 
        inv.id === selectedInvitation.id 
          ? { 
              ...inv, 
              status: responseType === 'accept' ? InvitationStatus.ACCEPTED : 
                     responseType === 'reject' ? InvitationStatus.REJECTED :
                     InvitationStatus.UNDER_REVIEW,
              respondedAt: new Date(),
              responseMessage: responseMessage
            }
          : inv
      ));
      
      setShowResponseDialog(false);
      setResponseMessage('');
      setModificationRequests([]);
      setSelectedInvitation(null);
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    }
  };

  const getTimeUntilExpiry = (expiresAt: Date) => {
    const now = new Date();
    const timeDiff = expiresAt.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'Expired';
    if (daysDiff === 0) return 'Expires today';
    if (daysDiff === 1) return 'Expires tomorrow';
    return `Expires in ${daysDiff} days`;
  };

  const renderInvitationCard = (invitation: CoachInvitation) => (
    <Card
      key={invitation.id}
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
        setSelectedInvitation(invitation);
        setShowDetailDialog(true);
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            src={invitation.coachProfileImage}
            sx={{ 
              width: 56, 
              height: 56, 
              mr: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
            }}
          >
            {invitation.coachName.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {invitation.coachName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {invitation.coachSpecialization}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={invitation.coachRating} readOnly size="small" precision={0.1} />
              <Typography variant="caption" color="text.secondary">
                ({invitation.coachRating}) • {invitation.coachExperience} years exp
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={invitation.status.replace('_', ' ').toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: STATUS_COLORS[invitation.status].bgColor,
                  color: STATUS_COLORS[invitation.status].color,
                  fontWeight: 600
                }}
              />
              <Chip
                label={INVITATION_TYPE_LABELS[invitation.invitationType]}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {invitation.invitedAt.toLocaleDateString()}
            </Typography>
            <Typography 
              variant="caption" 
              color={invitation.status === InvitationStatus.PENDING ? 'warning.main' : 'text.secondary'}
              sx={{ fontWeight: 500 }}
            >
              {getTimeUntilExpiry(invitation.expiresAt)}
            </Typography>
          </Box>
        </Box>

        {/* Message Preview */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontStyle: 'italic'
          }}
        >
          "{invitation.message}"
        </Typography>

        {/* Focus Areas */}
        {invitation.focusAreas.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Focus Areas:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
              {invitation.focusAreas.slice(0, 4).map((area) => (
                <Chip
                  key={area}
                  label={area}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {invitation.focusAreas.length > 4 && (
                <Chip
                  label={`+${invitation.focusAreas.length - 4}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Schedule Summary */}
        <Box sx={{ mb: 2, display: 'flex', justify: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {invitation.proposedSchedule.duration} weeks • {invitation.sessionPreferences.frequency}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DurationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {invitation.sessionPreferences.sessionDuration} min sessions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {invitation.sessionPreferences.sessionTypes.includes('online') && (
              <OnlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
            )}
            {invitation.sessionPreferences.sessionTypes.includes('in-person') && (
              <InPersonIcon sx={{ fontSize: 16, color: 'info.main' }} />
            )}
            {invitation.sessionPreferences.sessionTypes.includes('phone') && (
              <PhoneIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInvitation(invitation);
              setShowDetailDialog(true);
            }}
          >
            View Details
          </Button>
          
          {invitation.status === InvitationStatus.PENDING && (
            <>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInvitation(invitation);
                  setResponseType('reject');
                  setShowResponseDialog(true);
                }}
              >
                Decline
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<AcceptIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInvitation(invitation);
                  setResponseType('accept');
                  setShowResponseDialog(true);
                }}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                }}
              >
                Accept
              </Button>
            </>
          )}
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
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
            Coach Invitations 📨
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Review and respond to coaching invitations from qualified professionals
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <PendingIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {invitations.filter(inv => inv.status === InvitationStatus.PENDING).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <SuccessIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {invitations.filter(inv => inv.status === InvitationStatus.ACCEPTED).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Accepted
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <CoachIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {new Set(invitations.filter(inv => inv.status === InvitationStatus.ACCEPTED).map(inv => inv.coachId)).size}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Coaches
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <GroupIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {invitations.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Invites
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
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {label}
                    {index > 0 && (
                      <Badge
                        badgeContent={
                          index === 1 ? invitations.filter(inv => inv.status === InvitationStatus.PENDING).length :
                          index === 2 ? invitations.filter(inv => inv.status === InvitationStatus.ACCEPTED).length :
                          index === 3 ? invitations.filter(inv => inv.status === InvitationStatus.REJECTED).length : 0
                        }
                        color="primary"
                        max={99}
                      />
                    )}
                  </Box>
                }
                icon={
                  index === 0 ? <GroupIcon /> :
                  index === 1 ? <PendingIcon /> :
                  index === 2 ? <SuccessIcon /> :
                  <CancelIcon />
                }
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Card>

        {/* Invitations Grid */}
        <Box sx={{ position: 'relative', minHeight: 400 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress size={50} />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {getFilteredInvitations().map((invitation) => (
                <Grid item xs={12} lg={6} key={invitation.id}>
                  {renderInvitationCard(invitation)}
                </Grid>
              ))}
              
              {getFilteredInvitations().length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    <MessageIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      No invitations found
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {currentTab === 1 ? 'No pending invitations at the moment' :
                       currentTab === 2 ? 'You haven\'t accepted any invitations yet' :
                       currentTab === 3 ? 'No rejected invitations' :
                       'You don\'t have any coaching invitations yet'}
                    </Typography>
                    {currentTab === 0 && (
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/client/discover')}
                        sx={{ borderRadius: 3 }}
                      >
                        Discover Coaches
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Box>

        {/* Invitation Detail Dialog */}
        <Dialog
          open={showDetailDialog}
          onClose={() => setShowDetailDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          {selectedInvitation && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={selectedInvitation.coachProfileImage}
                    sx={{ 
                      width: 60, 
                      height: 60,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                    }}
                  >
                    {selectedInvitation.coachName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {selectedInvitation.coachName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedInvitation.coachSpecialization}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Rating value={selectedInvitation.coachRating} readOnly size="small" precision={0.1} />
                      <Typography variant="caption" color="text.secondary">
                        ({selectedInvitation.coachRating}) • {selectedInvitation.coachExperience} years
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setShowDetailDialog(false)}>
                    <RejectIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              
              <DialogContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Invitation Message
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                      "{selectedInvitation.message}"
                    </Typography>
                  </Paper>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Coach Background
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedInvitation.coachBio}
                  </Typography>
                </Box>

                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Session Details
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Duration & Frequency
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedInvitation.proposedSchedule.duration} weeks • {selectedInvitation.sessionPreferences.frequency}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedInvitation.sessionPreferences.sessionDuration} minutes per session
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total: {selectedInvitation.proposedSchedule.totalSessions} sessions
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Session Options
                        </Typography>
                        {selectedInvitation.sessionPreferences.sessionTypes.map((type) => (
                          <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {type === 'online' && <OnlineIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                            {type === 'in-person' && <InPersonIcon sx={{ fontSize: 16, color: 'info.main' }} />}
                            {type === 'phone' && <PhoneIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                            <Typography variant="body2" color="text.secondary">
                              {type === 'online' ? 'Video Call' : type === 'in-person' ? 'In-Person' : 'Phone Call'}
                            </Typography>
                          </Box>
                        ))}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Focus Areas & Approach
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {selectedInvitation.focusAreas.map((area) => (
                        <Chip
                          key={area}
                          label={area}
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {selectedInvitation.responseMessage && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Your Response
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        "{selectedInvitation.responseMessage}"
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Responded on {selectedInvitation.respondedAt?.toLocaleDateString()}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </DialogContent>
              
              <DialogActions>
                <Button onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
                {selectedInvitation.status === InvitationStatus.PENDING && (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => {
                        setResponseType('reject');
                        setShowDetailDialog(false);
                        setShowResponseDialog(true);
                      }}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AcceptIcon />}
                      onClick={() => {
                        setResponseType('accept');
                        setShowDetailDialog(false);
                        setShowResponseDialog(true);
                      }}
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                      }}
                    >
                      Accept
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Response Dialog */}
        <Dialog
          open={showResponseDialog}
          onClose={() => setShowResponseDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle>
            {responseType === 'accept' ? 'Accept Invitation' : 
             responseType === 'reject' ? 'Decline Invitation' : 
             'Request Modifications'}
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              {responseType === 'accept' ? 
                'You\'re about to accept this coaching invitation. You can add a message to introduce yourself.' :
                responseType === 'reject' ?
                'Please let the coach know why you\'re declining this invitation.' :
                'What modifications would you like to request?'}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label={responseType === 'accept' ? 'Introduction Message (Optional)' : 
                    responseType === 'reject' ? 'Reason for Declining' : 
                    'Modification Requests'}
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder={
                responseType === 'accept' ? 
                  'Hi! I\'m excited to work with you and start this coaching journey...' :
                responseType === 'reject' ?
                  'Thank you for the invitation, but...' :
                  'I\'d like to discuss adjusting the schedule to...'
              }
              sx={{ mt: 2 }}
            />
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleInvitationResponse}
              color={responseType === 'reject' ? 'error' : responseType === 'accept' ? 'success' : 'primary'}
              startIcon={
                responseType === 'accept' ? <AcceptIcon /> :
                responseType === 'reject' ? <RejectIcon /> :
                <SendIcon />
              }
            >
              {responseType === 'accept' ? 'Accept Invitation' :
               responseType === 'reject' ? 'Decline Invitation' :
               'Send Request'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ClientInvitations;