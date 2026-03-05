import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordingConsentDialog from './RecordingConsentDialog';
import * as consentApi from '../api/consent';

// Mock the consent API
jest.mock('../api/consent');

// Mock the translation context
jest.mock('../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    translations: {
      common: {
        cancel: 'Cancel',
        close: 'Close'
      }
    },
    t: (key: string) => key
  })
}));

describe('RecordingConsentDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConsentGiven: jest.fn(),
    onConsentDenied: jest.fn(),
    appointmentId: 'appt-123',
    participantId: 'user-456',
    participantRole: 'client' as const,
    participantName: 'John Doe',
    recordingType: 'video' as const,
    requireSignature: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the consent dialog with all options', () => {
    render(<RecordingConsentDialog {...defaultProps} />);

    expect(screen.getByText('Recording Consent Required')).toBeInTheDocument();
    expect(screen.getByText(/Audio recording of the session/)).toBeInTheDocument();
    expect(screen.getByText(/Video recording of the session/)).toBeInTheDocument();
    expect(screen.getByText(/Automatic transcription of speech/)).toBeInTheDocument();
    expect(screen.getByText(/AI-powered session analysis/)).toBeInTheDocument();
  });

  it('consent button is disabled until agreement checkbox is checked', () => {
    render(<RecordingConsentDialog {...defaultProps} />);

    const consentButton = screen.getByRole('button', { name: /I Consent/i });
    expect(consentButton).toBeDisabled();

    // Find and click the agreement checkbox
    const agreeCheckbox = screen.getByRole('checkbox', { name: /I understand and consent/i });
    fireEvent.click(agreeCheckbox);

    expect(consentButton).toBeEnabled();
  });

  it('calls onConsentGiven when consent is submitted', async () => {
    const mockConsent = {
      id: 'consent-789',
      appointmentId: 'appt-123',
      participantId: 'user-456',
      participantRole: 'client',
      participantName: 'John Doe',
      consentGivenAt: new Date().toISOString(),
      consentedFeatures: {
        audioRecording: true,
        videoRecording: true,
        aiAnalysis: true,
        transcription: true,
        sharing: false
      }
    };

    (consentApi.createConsent as jest.Mock).mockResolvedValue(mockConsent);

    render(<RecordingConsentDialog {...defaultProps} />);

    // Check the agreement
    const agreeCheckbox = screen.getByRole('checkbox', { name: /I understand and consent/i });
    fireEvent.click(agreeCheckbox);

    // Click consent button
    const consentButton = screen.getByRole('button', { name: /I Consent/i });
    fireEvent.click(consentButton);

    await waitFor(() => {
      expect(consentApi.createConsent).toHaveBeenCalled();
      expect(defaultProps.onConsentGiven).toHaveBeenCalledWith(
        'consent-789',
        expect.objectContaining({
          audioRecording: true,
          videoRecording: true
        })
      );
    });
  });

  it('calls onConsentDenied when decline is clicked', () => {
    render(<RecordingConsentDialog {...defaultProps} />);

    const declineButton = screen.getByRole('button', { name: /Decline/i });
    fireEvent.click(declineButton);

    expect(defaultProps.onConsentDenied).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('allows toggling individual consent features', () => {
    render(<RecordingConsentDialog {...defaultProps} />);

    // Find the AI analysis checkbox and toggle it
    const aiCheckbox = screen.getByRole('checkbox', { name: /AI-powered session analysis/i });
    expect(aiCheckbox).toBeChecked();

    fireEvent.click(aiCheckbox);
    expect(aiCheckbox).not.toBeChecked();
  });

  it('shows expanded privacy details when clicked', () => {
    render(<RecordingConsentDialog {...defaultProps} />);

    const showDetailsButton = screen.getByRole('button', { name: /Show Privacy & Security Details/i });
    fireEvent.click(showDetailsButton);

    expect(screen.getByText(/Recordings are encrypted with AES-256/i)).toBeInTheDocument();
    expect(screen.getByText(/HIPAA regulations/i)).toBeInTheDocument();
  });

  it('handles audio-only recording type', () => {
    render(<RecordingConsentDialog {...defaultProps} recordingType="audio" />);

    // Video recording option should not be present for audio-only
    expect(screen.queryByText(/Video recording of the session/)).not.toBeInTheDocument();
    expect(screen.getByText(/Audio recording of the session/)).toBeInTheDocument();
  });
});
