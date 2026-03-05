/**
 * RecordingParticipants - Component showing participant status indicators during recording
 * Features WebSocket-based participant tracking and real-time status updates
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  AvatarGroup,
  Badge,
  Tooltip,
  Typography,
  Paper,
  Chip,
  Collapse,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  FiberManualRecord as RecordingDotIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideoIcon,
  VideocamOff as VideoOffIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Person as PersonIcon,
  Psychology as CoachIcon
} from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';

export interface Participant {
  id: string;
  name: string;
  role: 'coach' | 'client';
  avatar?: string;
  isRecording: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  joinedAt: Date;
}

export interface RecordingParticipantsProps {
  sessionId: string;
  currentUserId: string;
  onParticipantJoin?: (participant: Participant) => void;
  onParticipantLeave?: (participantId: string) => void;
  showExpanded?: boolean;
  maxDisplayed?: number;
}

const RecordingParticipants: React.FC<RecordingParticipantsProps> = ({
  sessionId,
  currentUserId,
  onParticipantJoin,
  onParticipantLeave,
  showExpanded = false,
  maxDisplayed = 4
}) => {
  const theme = useTheme();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expanded, setExpanded] = useState(showExpanded);

  // WebSocket connection for real-time updates
  const {
    connectionState,
    connect,
    addEventListener,
    removeEventListener
  } = useWebSocket({
    autoConnect: true,
    sessionId,
    userId: currentUserId,
    role: 'coach' // Will be determined dynamically in production
  });

  // Handle WebSocket messages
  useEffect(() => {
    const handleParticipantUpdate = (event: { type: string; data: any }) => {
      switch (event.type) {
        case 'participant_joined':
          setParticipants(prev => {
            // Avoid duplicates
            if (prev.find(p => p.id === event.data.id)) {
              return prev;
            }
            const newParticipant: Participant = {
              id: event.data.id,
              name: event.data.name,
              role: event.data.role,
              avatar: event.data.avatar,
              isRecording: event.data.isRecording || false,
              hasAudio: event.data.hasAudio || false,
              hasVideo: event.data.hasVideo || false,
              connectionStatus: 'connected',
              joinedAt: new Date(),
            };
            onParticipantJoin?.(newParticipant);
            return [...prev, newParticipant];
          });
          break;

        case 'participant_left':
          setParticipants(prev => prev.filter(p => p.id !== event.data.participantId));
          onParticipantLeave?.(event.data.participantId);
          break;

        case 'participant_status_update':
          setParticipants(prev =>
            prev.map(p =>
              p.id === event.data.participantId
                ? {
                    ...p,
                    isRecording: event.data.isRecording ?? p.isRecording,
                    hasAudio: event.data.hasAudio ?? p.hasAudio,
                    hasVideo: event.data.hasVideo ?? p.hasVideo,
                    connectionStatus: event.data.connectionStatus ?? p.connectionStatus,
                  }
                : p
            )
          );
          break;

        case 'recording_started':
          setParticipants(prev =>
            prev.map(p =>
              p.id === event.data.participantId
                ? { ...p, isRecording: true }
                : p
            )
          );
          break;

        case 'recording_stopped':
          setParticipants(prev =>
            prev.map(p =>
              p.id === event.data.participantId
                ? { ...p, isRecording: false }
                : p
            )
          );
          break;

        case 'participants_list':
          // Initial list of participants
          setParticipants(event.data.participants.map((p: any) => ({
            ...p,
            connectionStatus: 'connected',
            joinedAt: new Date(p.joinedAt),
          })));
          break;
      }
    };

    addEventListener('message', handleParticipantUpdate);

    return () => {
      removeEventListener('message', handleParticipantUpdate);
    };
  }, [addEventListener, removeEventListener, onParticipantJoin, onParticipantLeave]);

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get color based on role
  const getRoleColor = (role: 'coach' | 'client'): string => {
    return role === 'coach' ? theme.palette.primary.main : theme.palette.secondary.main;
  };

  // Get connection status color
  const getStatusColor = (status: Participant['connectionStatus']): string => {
    switch (status) {
      case 'connected':
        return theme.palette.success.main;
      case 'connecting':
        return theme.palette.warning.main;
      case 'disconnected':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Compact view (avatar group)
  const renderCompactView = () => (
    <Box display="flex" alignItems="center" gap={1}>
      <AvatarGroup max={maxDisplayed} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14 } }}>
        {participants.map(participant => (
          <Tooltip
            key={participant.id}
            title={
              <Box>
                <Typography variant="body2">{participant.name}</Typography>
                <Typography variant="caption" color="inherit">
                  {participant.role === 'coach' ? 'Coach' : 'Client'}
                  {participant.isRecording ? ' - Recording' : ''}
                </Typography>
              </Box>
            }
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                participant.isRecording ? (
                  <RecordingDotIcon
                    sx={{
                      width: 12,
                      height: 12,
                      color: 'error.main',
                      animation: 'pulse 1.5s infinite'
                    }}
                  />
                ) : null
              }
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getStatusColor(participant.connectionStatus),
                      border: '1.5px solid white'
                    }}
                  />
                }
              >
                <Avatar
                  src={participant.avatar}
                  sx={{
                    bgcolor: getRoleColor(participant.role),
                    border: `2px solid ${participant.id === currentUserId ? theme.palette.primary.main : 'transparent'}`
                  }}
                >
                  {getInitials(participant.name)}
                </Avatar>
              </Badge>
            </Badge>
          </Tooltip>
        ))}
      </AvatarGroup>

      {participants.length > 0 && (
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      )}
    </Box>
  );

  // Expanded view (detailed list)
  const renderExpandedView = () => (
    <Collapse in={expanded}>
      <Paper variant="outlined" sx={{ mt: 1, p: 1 }}>
        {participants.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            No participants connected
          </Typography>
        ) : (
          participants.map(participant => (
            <Box
              key={participant.id}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: participant.id === currentUserId
                  ? alpha(theme.palette.primary.main, 0.05)
                  : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.03)
                }
              }}
            >
              {/* Left: Avatar and name */}
              <Box display="flex" alignItems="center" gap={1.5}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: getStatusColor(participant.connectionStatus),
                        border: '2px solid white'
                      }}
                    />
                  }
                >
                  <Avatar
                    src={participant.avatar}
                    sx={{ width: 36, height: 36, bgcolor: getRoleColor(participant.role) }}
                  >
                    {getInitials(participant.name)}
                  </Avatar>
                </Badge>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {participant.name}
                    {participant.id === currentUserId && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (you)
                      </Typography>
                    )}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {participant.role === 'coach' ? (
                      <CoachIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {participant.role === 'coach' ? 'Coach' : 'Client'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Right: Status indicators */}
              <Box display="flex" alignItems="center" gap={0.5}>
                {/* Recording indicator */}
                {participant.isRecording && (
                  <Chip
                    size="small"
                    label="REC"
                    color="error"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      animation: 'pulse 1.5s infinite'
                    }}
                  />
                )}

                {/* Audio indicator */}
                <Tooltip title={participant.hasAudio ? 'Microphone on' : 'Microphone off'}>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    {participant.hasAudio ? (
                      <MicIcon fontSize="small" color="success" />
                    ) : (
                      <MicOffIcon fontSize="small" color="disabled" />
                    )}
                  </IconButton>
                </Tooltip>

                {/* Video indicator */}
                <Tooltip title={participant.hasVideo ? 'Camera on' : 'Camera off'}>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    {participant.hasVideo ? (
                      <VideoIcon fontSize="small" color="success" />
                    ) : (
                      <VideoOffIcon fontSize="small" color="disabled" />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}
      </Paper>
    </Collapse>
  );

  return (
    <Box>
      {/* Connection status indicator */}
      {!connectionState.connected && (
        <Chip
          size="small"
          label={connectionState.connecting ? 'Connecting...' : 'Offline'}
          color={connectionState.connecting ? 'warning' : 'default'}
          sx={{ mb: 1 }}
        />
      )}

      {renderCompactView()}
      {renderExpandedView()}

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default RecordingParticipants;
