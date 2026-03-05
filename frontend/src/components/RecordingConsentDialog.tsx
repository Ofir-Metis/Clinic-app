/**
 * RecordingConsentDialog - Comprehensive consent dialog for session recording
 * Features granular consent checkboxes, digital signature capture, and audit trail
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Divider,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Security as SecurityIcon,
  PrivacyTip as PrivacyTipIcon,
  Mic as MicIcon,
  Videocam as VideoIcon,
  Psychology as AIIcon,
  TextFields as TranscriptIcon,
  Share as ShareIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Brush as SignatureIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { createConsent, ConsentFeatures, CreateConsentRequest } from '../api/consent';
import { useTranslation } from '../contexts/LanguageContext';

export interface RecordingConsentDialogProps {
  open: boolean;
  onClose: () => void;
  onConsentGiven: (consentId: string, features: ConsentFeatures) => void;
  onConsentDenied: () => void;
  appointmentId: string;
  participantId: string;
  participantRole: 'coach' | 'client';
  participantName: string;
  recordingType?: 'audio' | 'video';
  requireSignature?: boolean;
}

const RecordingConsentDialog: React.FC<RecordingConsentDialogProps> = ({
  open,
  onClose,
  onConsentGiven,
  onConsentDenied,
  appointmentId,
  participantId,
  participantRole,
  participantName,
  recordingType = 'video',
  requireSignature = false
}) => {
  const theme = useTheme();
  const { translations } = useTranslation();
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Consent feature checkboxes
  const [consentFeatures, setConsentFeatures] = useState<ConsentFeatures>({
    audioRecording: true,
    videoRecording: recordingType === 'video',
    aiAnalysis: true,
    transcription: true,
    sharing: false
  });

  // Agreement checkbox
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signature state
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Check if consent can be submitted
  const canSubmit = agreedToTerms &&
    (consentFeatures.audioRecording || consentFeatures.videoRecording) &&
    (!requireSignature || hasSignature);

  // Initialize signature canvas
  useEffect(() => {
    if (open && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setAgreedToTerms(false);
      setError(null);
      setHasSignature(false);
      setConsentFeatures({
        audioRecording: true,
        videoRecording: recordingType === 'video',
        aiAnalysis: true,
        transcription: true,
        sharing: false
      });
    }
  }, [open, recordingType]);

  // Signature drawing handlers
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setLastPos(getCanvasPos(e));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !signatureCanvasRef.current) return;

    const ctx = signatureCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      const ctx = signatureCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
      }
    }
    setHasSignature(false);
  };

  const getSignatureData = (): string | undefined => {
    if (!hasSignature || !signatureCanvasRef.current) return undefined;
    return signatureCanvasRef.current.toDataURL('image/png');
  };

  const handleFeatureChange = (feature: keyof ConsentFeatures) => {
    setConsentFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateConsentRequest = {
        appointmentId,
        participantId,
        participantRole,
        participantName,
        consentedFeatures: consentFeatures,
        signatureData: getSignatureData()
      };

      const consent = await createConsent(request);

      // Log consent for audit trail
      console.log(`[Audit] Recording consent created:`, {
        consentId: consent.id,
        appointmentId,
        participantId,
        participantRole,
        features: consentFeatures,
        timestamp: new Date().toISOString()
      });

      onConsentGiven(consent.id, consentFeatures);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record consent';
      setError(errorMessage);
      console.error('Consent submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    console.log(`[Audit] Recording consent declined:`, {
      appointmentId,
      participantId,
      participantRole,
      timestamp: new Date().toISOString()
    });
    onConsentDenied();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">Recording Consent Required</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Introduction */}
        <Alert severity="info" icon={<PrivacyTipIcon />} sx={{ mb: 3 }}>
          This coaching session will be recorded to help track your progress and improve the quality of your experience.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* What will be recorded */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          What will be recorded:
        </Typography>
        <Box
          sx={{
            bgcolor: alpha(theme.palette.background.default, 0.6),
            borderRadius: 2,
            p: 2,
            mb: 3,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consentFeatures.audioRecording}
                  onChange={() => handleFeatureChange('audioRecording')}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <MicIcon fontSize="small" color="action" />
                  <Typography variant="body2">Audio recording of the session</Typography>
                </Box>
              }
            />
            {recordingType === 'video' && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consentFeatures.videoRecording}
                    onChange={() => handleFeatureChange('videoRecording')}
                    color="primary"
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <VideoIcon fontSize="small" color="action" />
                    <Typography variant="body2">Video recording of the session</Typography>
                  </Box>
                }
              />
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={consentFeatures.transcription}
                  onChange={() => handleFeatureChange('transcription')}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <TranscriptIcon fontSize="small" color="action" />
                  <Typography variant="body2">Automatic transcription of speech</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={consentFeatures.aiAnalysis}
                  onChange={() => handleFeatureChange('aiAnalysis')}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <AIIcon fontSize="small" color="action" />
                  <Typography variant="body2">AI-powered session analysis and insights</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={consentFeatures.sharing}
                  onChange={() => handleFeatureChange('sharing')}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <ShareIcon fontSize="small" color="action" />
                  <Typography variant="body2">Allow sharing of recording with authorized team members</Typography>
                </Box>
              }
            />
          </FormGroup>
        </Box>

        {/* Expandable Privacy Details */}
        <Box sx={{ mb: 3 }}>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            endIcon={showDetails ? <CollapseIcon /> : <ExpandIcon />}
            sx={{ textTransform: 'none' }}
          >
            {showDetails ? 'Hide' : 'Show'} Privacy & Security Details
          </Button>
          <Collapse in={showDetails}>
            <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
              <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                <li>Recordings are encrypted with AES-256 encryption at rest</li>
                <li>Data is stored securely in compliance with HIPAA regulations</li>
                <li>Access is limited to authorized participants and your assigned coach</li>
                <li>You can request deletion of your recordings at any time</li>
                <li>Recordings are automatically deleted after 2 years unless otherwise requested</li>
                <li>AI analysis is performed by secure, HIPAA-compliant systems</li>
                <li>Your data is never sold or shared with third parties for marketing</li>
              </Typography>
            </Paper>
          </Collapse>
        </Box>

        {/* Signature Pad (if required) */}
        {requireSignature && (
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <SignatureIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Your Signature
                </Typography>
              </Box>
              <IconButton size="small" onClick={clearSignature} disabled={!hasSignature}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                bgcolor: '#fff',
                cursor: 'crosshair',
                touchAction: 'none'
              }}
            >
              <canvas
                ref={signatureCanvasRef}
                width={400}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ display: 'block', width: '100%', height: 120 }}
              />
            </Paper>
            <Typography variant="caption" color="text.secondary">
              Sign above using your mouse or touch screen
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Final Agreement */}
        <FormControlLabel
          control={
            <Checkbox
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              I understand and consent to having this session recorded with the selected features.
              I have read and agree to the{' '}
              <Typography
                component="a"
                href="/privacy-policy"
                target="_blank"
                color="primary"
                sx={{ textDecoration: 'underline' }}
              >
                Privacy Policy
              </Typography>
              {' '}and{' '}
              <Typography
                component="a"
                href="/terms-of-service"
                target="_blank"
                color="primary"
                sx={{ textDecoration: 'underline' }}
              >
                Terms of Service
              </Typography>.
            </Typography>
          }
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleDecline} disabled={isSubmitting}>
          Decline
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : (recordingType === 'audio' ? <MicIcon /> : <VideoIcon />)}
        >
          {isSubmitting ? 'Processing...' : 'I Consent - Start Recording'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordingConsentDialog;
