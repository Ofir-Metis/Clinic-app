/**
 * Session Summary Component
 * Displays AI-generated session summary with key points, action items, topics, and insights
 * Client-friendly presentation of session analysis
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  Topic as TopicIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';

export interface SessionSummaryData {
  keyPoints: string[];
  actionItems: string[];
  topics: string[];
  insights: string[];
}

interface SessionSummaryProps {
  summary: SessionSummaryData;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ summary }) => {
  const { translations } = useTranslation();

  const t = translations.recording?.summary || {
    title: 'Session Summary',
    keyPoints: 'Key Points',
    actionItems: 'Action Items',
    topicsDiscussed: 'Topics Discussed',
    insights: 'Insights',
    noSummary: 'No summary available yet',
  };

  if (
    !summary ||
    (!summary.keyPoints?.length &&
      !summary.actionItems?.length &&
      !summary.topics?.length &&
      !summary.insights?.length)
  ) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t.noSummary}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Typography variant="h6" gutterBottom>
          {t.title}
        </Typography>

        <Divider />

        {/* Key Points Section */}
        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
              }}
            >
              <LightbulbIcon color="primary" />
              {t.keyPoints}
            </Typography>
            <List dense>
              {summary.keyPoints.map((point, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={point} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Action Items Section */}
        {summary.actionItems && summary.actionItems.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
              }}
            >
              <CheckCircleIcon color="success" />
              {t.actionItems}
            </Typography>
            <List dense>
              {summary.actionItems.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Topics Discussed Section */}
        {summary.topics && summary.topics.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
              }}
            >
              <TopicIcon color="info" />
              {t.topicsDiscussed}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {summary.topics.map((topic, index) => (
                <Chip
                  key={index}
                  label={topic}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Insights Section */}
        {summary.insights && summary.insights.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
              }}
            >
              <PsychologyIcon color="secondary" />
              {t.insights}
            </Typography>
            <List dense>
              {summary.insights.map((insight, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'secondary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={insight}
                    primaryTypographyProps={{
                      fontStyle: 'italic',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
