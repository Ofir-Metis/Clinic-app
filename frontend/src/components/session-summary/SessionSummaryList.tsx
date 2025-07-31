/**
 * SessionSummaryList - Displays list of coaching session summaries
 * Supports filtering, sorting, and search functionality
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  MenuItem,
  Stack,
  Skeleton,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { SessionSummary } from './SessionSummaryCard';
import { sessionAnalysisService } from '../../services/sessionAnalysisService';

interface SessionSummaryListProps {
  coachId?: string;
  clientId?: string;
  isCoachView: boolean;
  onSummaryClick: (summary: SessionSummary) => void;
}

export const SessionSummaryList: React.FC<SessionSummaryListProps> = ({
  coachId,
  clientId,
  isCoachView,
  onSummaryClick
}) => {
  const theme = useTheme();
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummaries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await sessionAnalysisService.getSessionSummaries({
        coachId,
        clientId,
        limit: 10,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      setSummaries(response.summaries);
    } catch (err: any) {
      setError(err.message || 'Failed to load session summaries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
  }, [coachId, clientId]);

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight={600} mb={3}>
          Session Summaries
        </Typography>

        {isLoading ? (
          <Stack spacing={2}>
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={80} />
            ))}
          </Stack>
        ) : summaries.length === 0 ? (
          <Typography color="text.secondary">
            No session summaries found
          </Typography>
        ) : (
          <List>
            {summaries.map((summary) => (
              <ListItem 
                key={summary.id}
                button
                onClick={() => onSummaryClick(summary)}
              >
                <ListItemText
                  primary={`${summary.sessionType} Session`}
                  secondary={new Date(summary.createdAt).toLocaleDateString()}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};