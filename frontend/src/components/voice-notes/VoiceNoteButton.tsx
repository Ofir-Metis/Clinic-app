/**
 * VoiceNoteButton Component
 * Floating action button (FAB) for quick voice note recording
 */

import React, { useState, useCallback } from 'react';
import {
  Fab,
  Badge,
  Tooltip,
  Zoom,
  useTheme,
  keyframes,
} from '@mui/material';
import { Mic as MicIcon } from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { VoiceNoteModal } from './VoiceNoteModal';
import { UploadVoiceNoteResponse } from '../../api/voiceNotes';

// Pulsing animation for recording state
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
`;

export interface VoiceNoteButtonProps {
  appointmentId?: string;
  clientId?: string;
  position?: 'bottom-right' | 'bottom-left';
  onNoteCreated?: (result: UploadVoiceNoteResponse) => void;
  pendingCount?: number;
  disabled?: boolean;
  visible?: boolean;
}

export const VoiceNoteButton: React.FC<VoiceNoteButtonProps> = ({
  appointmentId,
  clientId,
  position = 'bottom-right',
  onNoteCreated,
  pendingCount = 0,
  disabled = false,
  visible = true,
}) => {
  const { translations } = useTranslation();
  const theme = useTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleClick = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    setIsRecording(false);
  }, []);

  const handleSaved = useCallback((result: UploadVoiceNoteResponse) => {
    setIsRecording(false);
    onNoteCreated?.(result);
  }, [onNoteCreated]);

  const positionStyles = position === 'bottom-right'
    ? { right: 24, bottom: 24 }
    : { left: 24, bottom: 24 };

  return (
    <>
      <Zoom in={visible}>
        <Tooltip
          title={translations.voiceNotes?.recordNote || 'Record voice note'}
          placement="left"
        >
          <Badge
            badgeContent={pendingCount}
            color="warning"
            overlap="circular"
            sx={{
              position: 'fixed',
              zIndex: theme.zIndex.fab,
              ...positionStyles,
            }}
          >
            <Fab
              color="primary"
              onClick={handleClick}
              disabled={disabled}
              sx={{
                width: 56,
                height: 56,
                ...(isRecording && {
                  bgcolor: theme.palette.error.main,
                  animation: `${pulse} 1.5s infinite`,
                  '&:hover': {
                    bgcolor: theme.palette.error.dark,
                  },
                }),
              }}
              aria-label={translations.voiceNotes?.recordNote || 'Record voice note'}
            >
              <MicIcon sx={{ fontSize: 28 }} />
            </Fab>
          </Badge>
        </Tooltip>
      </Zoom>

      <VoiceNoteModal
        open={modalOpen}
        onClose={handleClose}
        appointmentId={appointmentId}
        clientId={clientId}
        onSaved={handleSaved}
      />
    </>
  );
};

export default VoiceNoteButton;
