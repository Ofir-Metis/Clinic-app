/**
 * Transcript Viewer Component
 * Displays session transcript with speaker labels and search functionality
 * Supports seeking to specific timestamps in the recording
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';

export interface TranscriptSegment {
  speaker: 'coach' | 'client' | string;
  text: string;
  timestamp: number; // in seconds
}

interface TranscriptViewerProps {
  transcript: TranscriptSegment[];
  onSeek?: (timestamp: number) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  onSeek,
}) => {
  const { translations } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const t = translations.recording?.transcript || {
    title: 'Session Transcript',
    search: 'Search transcript',
    download: 'Download Transcript',
    coach: 'Coach',
    client: 'Client',
    noTranscript: 'No transcript available',
  };

  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;

    const query = searchQuery.toLowerCase();
    return transcript.filter((segment) =>
      segment.text.toLowerCase().includes(query)
    );
  }, [transcript, searchQuery]);

  const handleDownload = () => {
    const content = transcript
      .map((segment) => {
        const speakerLabel = segment.speaker === 'coach' ? t.coach : t.client;
        const timeStr = formatTimestamp(segment.timestamp);
        return `[${timeStr}] ${speakerLabel}: ${segment.text}`;
      })
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerLabel = (speaker: string): string => {
    if (speaker.toLowerCase().includes('coach')) return t.coach;
    if (speaker.toLowerCase().includes('client')) return t.client;
    return speaker;
  };

  const getSpeakerColor = (speaker: string): 'primary' | 'secondary' => {
    return speaker.toLowerCase().includes('coach') ? 'primary' : 'secondary';
  };

  if (!transcript || transcript.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t.noTranscript}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">{t.title}</Typography>

          <Tooltip title={t.download}>
            <IconButton
              onClick={handleDownload}
              color="primary"
              aria-label="download transcript"
              name="download-transcript"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          role="searchbox"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  aria-label="clear search"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Divider />

        {/* Transcript List */}
        <List sx={{ maxHeight: 500, overflow: 'auto' }}>
          {filteredTranscript.map((segment, index) => (
            <ListItem
              key={index}
              alignItems="flex-start"
              sx={{
                cursor: onSeek ? 'pointer' : 'default',
                '&:hover': onSeek
                  ? {
                      backgroundColor: 'action.hover',
                    }
                  : undefined,
                borderRadius: 1,
                mb: 1,
              }}
              onClick={() => onSeek?.(segment.timestamp)}
            >
              <Stack spacing={1} sx={{ width: '100%' }}>
                {/* Speaker and Timestamp */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Chip
                    label={getSpeakerLabel(segment.speaker)}
                    color={getSpeakerColor(segment.speaker)}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(segment.timestamp)}
                  </Typography>
                </Box>

                {/* Text Content */}
                <ListItemText
                  primary={segment.text}
                  primaryTypographyProps={{
                    variant: 'body2',
                  }}
                />
              </Stack>
            </ListItem>
          ))}
        </List>

        {/* Results Count */}
        {searchQuery && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {filteredTranscript.length} results found
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};
