/**
 * Recording Consent Banner Component
 * Displayed within session detail views when recording is enabled
 * Provides granular consent options for audio, transcription, and AI analysis
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Mic as MicIcon,
  Article as ArticleIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';

interface RecordingConsentBannerProps {
  sessionId: string;
  onConsentSubmit: (consent: ConsentData) => Promise<void>;
  onDecline: () => void;
  existingConsent?: ConsentData | null;
}

export interface ConsentData {
  audioConsent: boolean;
  transcriptionConsent: boolean;
  aiAnalysisConsent: boolean;
}

export const RecordingConsentBanner: React.FC<RecordingConsentBannerProps> = ({
  sessionId,
  onConsentSubmit,
  onDecline,
  existingConsent,
}) => {
  const { translations } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [consent, setConsent] = useState<ConsentData>({
    audioConsent: existingConsent?.audioConsent ?? false,
    transcriptionConsent: existingConsent?.transcriptionConsent ?? false,
    aiAnalysisConsent: existingConsent?.aiAnalysisConsent ?? false,
  });

  const handleCheckboxChange = (field: keyof ConsentData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConsent((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConsentSubmit(consent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit consent');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    onDecline();
  };

  const t = translations.recording?.consent || {
    title: 'Session Recording Consent',
    description: 'This session may be recorded for quality and review purposes',
    includes: 'Recording may include audio, video, transcription, and AI analysis',
    audioRecording: 'Audio Recording',
    transcription: 'Transcription',
    aiAnalysis: 'AI Analysis',
    accept: 'Accept Recording',
    decline: 'Decline Recording',
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        backgroundColor: 'background.paper',
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box>
          <Typography variant="h6" gutterBottom>
            {t.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.description}
          </Typography>
        </Box>

        <Divider />

        {/* Explanation */}
        <Alert severity="info" sx={{ mb: 2 }}>
          {t.includes}
        </Alert>

        {/* Consent Checkboxes */}
        <Stack spacing={1.5}>
          <FormControlLabel
            control={
              <Checkbox
                checked={consent.audioConsent}
                onChange={handleCheckboxChange('audioConsent')}
                name="audio-consent"
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MicIcon fontSize="small" color="action" />
                <Typography variant="body1">{t.audioRecording}</Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={consent.transcriptionConsent}
                onChange={handleCheckboxChange('transcriptionConsent')}
                name="transcription-consent"
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArticleIcon fontSize="small" color="action" />
                <Typography variant="body1">{t.transcription}</Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={consent.aiAnalysisConsent}
                onChange={handleCheckboxChange('aiAnalysisConsent')}
                name="ai-analysis-consent"
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon fontSize="small" color="action" />
                <Typography variant="body1">{t.aiAnalysis}</Typography>
              </Box>
            }
          />
        </Stack>

        {/* Error Message */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAccept}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            name="accept-consent"
            sx={{ minWidth: 150 }}
          >
            {t.accept}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleDecline}
            disabled={loading}
            startIcon={<CancelIcon />}
            name="decline-consent"
          >
            {t.decline}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
