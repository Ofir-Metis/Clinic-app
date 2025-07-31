/**
 * SessionSummaryCard - Displays AI-generated coaching session summary
 * Shows key insights, progress, action items, and review status
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Lightbulb as InsightIcon,
  TrendingUp as ProgressIcon,
  Assignment as ActionIcon,
  Psychology as ChallengeIcon,
  Schedule as NextSessionIcon,
  Share as ShareIcon,
  RateReview as ReviewIcon,
  Visibility as ViewIcon,
  CheckCircle as CompletedIcon,
  HourglassEmpty as PendingIcon,
  Error as ErrorIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export interface SessionSummary {
  id: string;
  appointmentId: string;
  sessionType: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'requires-review';
  keyInsights: string[];
  progressMade: string[];
  challengesDiscussed: string[];
  actionItems: string[];
  nextSessionFocus: string;
  emotionalTone: 'positive' | 'neutral' | 'challenging' | 'breakthrough';
  clientEngagement: 'high' | 'medium' | 'low';
  coachingTechniques: string[];
  breakthroughMoments?: string[];
  homework?: string[];
  followUpRequired: boolean;
  confidenceLevel: number;
  reviewedByCoach: boolean;
  sharedWithClient: boolean;
  clientViewed?: boolean;
  coachFeedback?: string;
  coachRating?: number;
  createdAt: string;
  sessionDurationMinutes?: number;
}

interface SessionSummaryCardProps {
  summary: SessionSummary;
  isCoachView: boolean;
  onReview?: (summaryId: string, review: { feedback?: string; rating?: number; approved: boolean }) => void;
  onShare?: (summaryId: string) => void;
  onMarkViewed?: (summaryId: string) => void;
  isLoading?: boolean;
}

export const SessionSummaryCard: React.FC<SessionSummaryCardProps> = ({
  summary,
  isCoachView,
  onReview,
  onShare,
  onMarkViewed,
  isLoading = false
}) => {
  const theme = useTheme();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(summary.coachFeedback || '');
  const [reviewRating, setReviewRating] = useState(summary.coachRating || 0);
  const [expandedSections, setExpandedSections] = useState<string[]>(['insights']);

  // Mark as viewed when client opens the card
  React.useEffect(() => {
    if (!isCoachView && !summary.clientViewed && onMarkViewed) {
      onMarkViewed(summary.id);
    }
  }, [isCoachView, summary.clientViewed, summary.id, onMarkViewed]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleReviewSubmit = (approved: boolean) => {
    if (onReview) {
      onReview(summary.id, {
        feedback: reviewFeedback,
        rating: reviewRating,
        approved
      });
    }
    setShowReviewDialog(false);
  };

  const getStatusColor = () => {
    switch (summary.processingStatus) {
      case 'completed': return theme.palette.success.main;
      case 'processing': return theme.palette.info.main;
      case 'failed': return theme.palette.error.main;
      case 'requires-review': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };

  if (summary.processingStatus === 'pending' || summary.processingStatus === 'processing') {
    return (
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            {summary.processingStatus === 'processing' 
              ? 'Analyzing Your Coaching Session...' 
              : 'Session Analysis Pending'
            }
          </Typography>
          <LinearProgress sx={{ borderRadius: 1, mb: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(255, 255, 255, 0.25)`,
        borderRadius: 3,
        boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)',
        mb: 3
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={600} mb={3}>
          Coaching Session Summary
        </Typography>

        {summary.keyInsights.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Key Insights
            </Typography>
            <List>
              {summary.keyInsights.map((insight, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={insight} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {summary.actionItems.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Action Items
            </Typography>
            <List>
              {summary.actionItems.map((action, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {isCoachView && !summary.reviewedByCoach && (
          <Button
            variant="contained"
            onClick={() => setShowReviewDialog(true)}
            sx={{ mt: 2 }}
          >
            Review Summary
          </Button>
        )}
      </CardContent>

      <Dialog
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Review Session Summary</DialogTitle>
        <DialogContent>
          <TextField
            label="Coach Feedback"
            multiline
            rows={4}
            value={reviewFeedback}
            onChange={(e) => setReviewFeedback(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReviewDialog(false)}>Cancel</Button>
          <Button onClick={() => handleReviewSubmit(true)} variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};