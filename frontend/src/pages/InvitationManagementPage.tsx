/**
 * InvitationManagementPage - Comprehensive client-coach invitation and approval workflow
 * Handles invitations, approvals, rejections, and relationship management
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
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Badge,
  Menu,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Check as ApproveIcon,
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
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  NotificationsActive as NotificationIcon,
  CheckCircle as SuccessIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  Psychology as CoachIcon,
  PersonAdd as InviteIcon,
  Handshake as RelationshipIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { useTranslation } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

// Types for invitation system
interface CoachInvitation {
  id: string;
  coachId: string;
  coachName: string;
  coachEmail: string;
  coachSpecialization: string;
  coachRating: number;
  coachProfileImage?: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientProfileImage?: string;
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

const InvitationManagementPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [invitations, setInvitations] = useState<CoachInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedInvitation, setSelectedInvitation] = useState<CoachInvitation | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [createStep, setCreateStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [newInvitation, setNewInvitation] = useState<Partial<CoachInvitation>>({
    invitationType: InvitationType.COACHING_RELATIONSHIP,
    relationshipType: RelationshipType.PRIMARY,
    message: '',
    focusAreas: [],
    dataAccessLevel: DataAccessLevel.LIMITED,
    sessionPreferences: {
      sessionTypes: ['online'],
      sessionDuration: 60,
      frequency: 'weekly',
      preferredTimes: [],
      timezone: 'UTC'
    },
    proposedSchedule: {
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      duration: 12,
      sessionsPerWeek: 1,
      totalSessions: 12
    }
  });

  const tabLabels = ['All Invitations', 'Pending', 'Accepted', 'Rejected', 'Expired'];
  const createSteps = ['Client Selection', 'Relationship Details', 'Schedule & Preferences'];

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
          clientId: 'client-456',
          clientName: 'Emma Thompson',
          clientEmail: 'emma@email.com',
          invitationType: InvitationType.COACHING_RELATIONSHIP,
          relationshipType: RelationshipType.PRIMARY,
          status: InvitationStatus.PENDING,
          message: 'Hi Emma! I would love to work with you on your personal development goals. Based on our initial conversation, I believe we would be a great fit for a coaching relationship focused on career transition and mindfulness practices.',
          focusAreas: ['Career Development', 'Mindfulness', 'Goal Setting'],
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
          coachId: 'coach-123',
          coachName: 'Dr. Sarah Johnson',
          coachEmail: 'sarah@clinic.com',
          coachSpecialization: 'Life & Wellness Coaching',
          coachRating: 4.9,
          clientId: 'client-789',
          clientName: 'Michael Chen',
          clientEmail: 'michael@email.com',
          invitationType: InvitationType.PROGRAM_ENROLLMENT,
          relationshipType: RelationshipType.SECONDARY,
          status: InvitationStatus.ACCEPTED,
          message: 'Welcome to the Executive Leadership Program! This 12-week intensive will help you develop advanced leadership skills.',
          focusAreas: ['Leadership', 'Executive Coaching', 'Team Management'],
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
          responseMessage: 'Thank you! I\'m excited to start this leadership journey.',
          metadata: {
            source: 'program_enrollment',
            programId: 'prog-leadership-intensive',
            customFields: {}
          }
        },
        {
          id: 'inv-3',
          coachId: 'coach-123',
          coachName: 'Dr. Sarah Johnson',
          coachEmail: 'sarah@clinic.com',
          coachSpecialization: 'Life & Wellness Coaching',
          coachRating: 4.9,
          clientId: 'client-101',
          clientName: 'Lisa Rodriguez',
          clientEmail: 'lisa@email.com',
          invitationType: InvitationType.CONSULTATION,
          relationshipType: RelationshipType.CONSULTATION,
          status: InvitationStatus.REJECTED,
          message: 'I would like to offer you a consultation session to discuss your wellness goals.',
          focusAreas: ['Wellness', 'Stress Management'],
          sessionPreferences: {
            sessionTypes: ['phone'],
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
          responseMessage: 'Thank you for the offer, but I\'m not ready for coaching at this time.',
          rejectionReason: 'Not ready for coaching',
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
    let filtered = invitations;

    // Tab filter
    switch (currentTab) {
      case 1: // Pending
        filtered = filtered.filter(inv => inv.status === InvitationStatus.PENDING);
        break;
      case 2: // Accepted
        filtered = filtered.filter(inv => inv.status === InvitationStatus.ACCEPTED);
        break;
      case 3: // Rejected
        filtered = filtered.filter(inv => inv.status === InvitationStatus.REJECTED);
        break;
      case 4: // Expired
        filtered = filtered.filter(inv => inv.status === InvitationStatus.EXPIRED);
        break;
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.clientName.toLowerCase().includes(query) ||
        inv.clientEmail.toLowerCase().includes(query) ||
        inv.focusAreas.some(area => area.toLowerCase().includes(query)) ||
        inv.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const handleInvitationAction = async (invitation: CoachInvitation, action: 'approve' | 'reject' | 'cancel' | 'resend') => {
    try {
      // TODO: Handle invitation action via API
      console.log(`${action} invitation:`, invitation.id);
      
      // Update local state
      setInvitations(prev => prev.map(inv => 
        inv.id === invitation.id 
          ? { 
              ...inv, 
              status: action === 'approve' ? InvitationStatus.ACCEPTED : 
                     action === 'reject' ? InvitationStatus.REJECTED :
                     action === 'cancel' ? InvitationStatus.CANCELLED : inv.status,
              respondedAt: new Date()
            }
          : inv
      ));
      
      setActionMenuAnchor(null);
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error);
    }
  };

  const handleCreateInvitation = async () => {
    try {
      // TODO: Create invitation via API
      const invitation: CoachInvitation = {
        ...newInvitation as CoachInvitation,
        id: `inv-${Date.now()}`,
        coachId: 'current-coach-id',
        coachName: 'Current Coach',
        coachEmail: 'coach@clinic.com',
        coachSpecialization: 'Life Coaching',
        coachRating: 4.8,
        status: InvitationStatus.PENDING,
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        metadata: {
          source: 'coach-initiated',
          customFields: {}
        }
      };

      setInvitations(prev => [...prev, invitation]);
      setShowCreateDialog(false);
      setCreateStep(0);
      // Reset form
      setNewInvitation({
        invitationType: InvitationType.COACHING_RELATIONSHIP,
        relationshipType: RelationshipType.PRIMARY,
        message: '',
        focusAreas: [],
        dataAccessLevel: DataAccessLevel.LIMITED,
        sessionPreferences: {
          sessionTypes: ['online'],
          sessionDuration: 60,
          frequency: 'weekly',
          preferredTimes: [],
          timezone: 'UTC'
        },
        proposedSchedule: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 12,
          sessionsPerWeek: 1,
          totalSessions: 12
        }
      });
    } catch (error) {
      console.error('Failed to create invitation:', error);
    }
  };

  const renderInvitationCard = (invitation: CoachInvitation) => (
    <Card
      key={invitation.id}
      sx={{
        background: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
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
            src={invitation.clientProfileImage}
            sx={{ width: 48, height: 48, mr: 2 }}
          >
            {invitation.clientName.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {invitation.clientName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {invitation.clientEmail}
            </Typography>
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
                label={RELATIONSHIP_TYPE_LABELS[invitation.relationshipType]}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                setSelectedInvitation(invitation);
                setActionMenuAnchor(e.currentTarget);
              }}
            >
              <MoreVertIcon />
            </IconButton>
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
            overflow: 'hidden'
          }}
        >
          {invitation.message}
        </Typography>

        {/* Focus Areas */}
        {invitation.focusAreas.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Focus Areas:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
              {invitation.focusAreas.slice(0, 3).map((area) => (
                <Chip
                  key={area}
                  label={area}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {invitation.focusAreas.length > 3 && (
                <Chip
                  label={`+${invitation.focusAreas.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Schedule Info */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {invitation.proposedSchedule.duration} weeks • {invitation.sessionPreferences.frequency}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {invitation.invitedAt.toLocaleDateString()}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
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
                onClick={() => handleInvitationAction(invitation, 'reject')}
              >
                Reject
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<ApproveIcon />}
                onClick={() => handleInvitationAction(invitation, 'approve')}
              >
                Approve
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
            Client Invitations & Relationships 🤝
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Manage coaching invitations, approvals, and client relationships
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
              <GroupIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {invitations.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Invites
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2, background: alpha(theme.palette.background.paper, 0.85) }}>
              <RelationshipIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {invitations.filter(inv => inv.status === InvitationStatus.ACCEPTED).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Relations
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search invitations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value as InvitationStatus | 'all')}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value={InvitationStatus.PENDING}>Pending</MenuItem>
                    <MenuItem value={InvitationStatus.ACCEPTED}>Accepted</MenuItem>
                    <MenuItem value={InvitationStatus.REJECTED}>Rejected</MenuItem>
                    <MenuItem value={InvitationStatus.EXPIRED}>Expired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<InviteIcon />}
                  onClick={() => setShowCreateDialog(true)}
                  sx={{ 
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                  }}
                >
                  Send Invitation
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

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
                          index === 3 ? invitations.filter(inv => inv.status === InvitationStatus.REJECTED).length :
                          index === 4 ? invitations.filter(inv => inv.status === InvitationStatus.EXPIRED).length : 0
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
                  index === 3 ? <CancelIcon /> :
                  <TimeIcon />
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
              {getFilteredInvitations().slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((invitation) => (
                <Grid item xs={12} lg={6} key={invitation.id}>
                  {renderInvitationCard(invitation)}
                </Grid>
              ))}
              
              {getFilteredInvitations().length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    <InviteIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      No invitations found
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      Start building relationships by sending your first invitation
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<InviteIcon />}
                      onClick={() => setShowCreateDialog(true)}
                      sx={{ borderRadius: 3 }}
                    >
                      Send Invitation
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Box>

        {/* Pagination */}
        {getFilteredInvitations().length > rowsPerPage && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={getFilteredInvitations().length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={() => setActionMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => {
            setShowDetailDialog(true);
            setActionMenuAnchor(null);
          }}>
            <ListItemIcon><ViewIcon /></ListItemIcon>
            View Details
          </MenuItem>
          
          {selectedInvitation?.status === InvitationStatus.PENDING && (
            <>
              <MenuItem onClick={() => handleInvitationAction(selectedInvitation, 'approve')}>
                <ListItemIcon><ApproveIcon color="success" /></ListItemIcon>
                Approve
              </MenuItem>
              <MenuItem onClick={() => handleInvitationAction(selectedInvitation, 'reject')}>
                <ListItemIcon><RejectIcon color="error" /></ListItemIcon>
                Reject
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleInvitationAction(selectedInvitation, 'cancel')}>
                <ListItemIcon><CancelIcon color="warning" /></ListItemIcon>
                Cancel
              </MenuItem>
            </>
          )}
          
          {selectedInvitation?.status === InvitationStatus.REJECTED && (
            <MenuItem onClick={() => handleInvitationAction(selectedInvitation, 'resend')}>
              <ListItemIcon><SendIcon color="primary" /></ListItemIcon>
              Resend
            </MenuItem>
          )}
        </Menu>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="send invitation"
          onClick={() => setShowCreateDialog(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, md: 32 },
            right: { xs: 16, md: 32 },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
          }}
        >
          <InviteIcon />
        </Fab>

        {/* Create Invitation Dialog */}
        <Dialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Send Coaching Invitation 📧
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Stepper activeStep={createStep} orientation="vertical">
              {createSteps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {index === 0 && (
                      <Box sx={{ py: 2 }}>
                        <TextField
                          fullWidth
                          label="Client Email"
                          value={newInvitation.clientEmail || ''}
                          onChange={(e) => setNewInvitation(prev => ({ ...prev, clientEmail: e.target.value }))}
                          sx={{ mb: 3 }}
                        />
                        
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Invitation Type</InputLabel>
                          <Select
                            value={newInvitation.invitationType}
                            label="Invitation Type"
                            onChange={(e) => setNewInvitation(prev => ({ ...prev, invitationType: e.target.value as InvitationType }))}
                          >
                            <MenuItem value={InvitationType.COACHING_RELATIONSHIP}>Coaching Relationship</MenuItem>
                            <MenuItem value={InvitationType.PROGRAM_ENROLLMENT}>Program Enrollment</MenuItem>
                            <MenuItem value={InvitationType.CONSULTATION}>Consultation</MenuItem>
                            <MenuItem value={InvitationType.COLLABORATION}>Collaboration</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <FormControl fullWidth>
                          <InputLabel>Relationship Type</InputLabel>
                          <Select
                            value={newInvitation.relationshipType}
                            label="Relationship Type"
                            onChange={(e) => setNewInvitation(prev => ({ ...prev, relationshipType: e.target.value as RelationshipType }))}
                          >
                            {Object.entries(RELATIONSHIP_TYPE_LABELS).map(([key, label]) => (
                              <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
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
                      
                      {index < createSteps.length - 1 ? (
                        <Button
                          onClick={() => setCreateStep(index + 1)}
                          variant="contained"
                          disabled={
                            index === 0 && (!newInvitation.clientEmail || !newInvitation.invitationType)
                          }
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCreateInvitation}
                          variant="contained"
                          startIcon={<SendIcon />}
                          disabled={!newInvitation.clientEmail || !newInvitation.message}
                        >
                          Send Invitation
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

export default InvitationManagementPage;