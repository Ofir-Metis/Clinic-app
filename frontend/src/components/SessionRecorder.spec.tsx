/**
 * SessionRecorder Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import SessionRecorder, { SessionRecorderProps } from './SessionRecorder';
import RecordingService from '../services/RecordingService';

// Mock the RecordingService
jest.mock('../services/RecordingService');

const MockedRecordingService = RecordingService as jest.MockedClass<typeof RecordingService>;

// Mock Material-UI's useMediaQuery
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(() => false), // Default to desktop
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('SessionRecorder', () => {
  let mockRecordingService: jest.Mocked<RecordingService>;
  const defaultProps: SessionRecorderProps = {
    sessionId: 'session-123',
    participantId: 'participant-456'
  };

  beforeEach(() => {
    // Create mock instance
    mockRecordingService = {
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      getStatus: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      cleanup: jest.fn()
    } as any;

    // Default mock implementations
    mockRecordingService.getStatus.mockReturnValue({
      isRecording: false,
      isPaused: false,
      duration: 0,
      chunkCount: 0,
      estimatedFileSize: 0,
      state: 'inactive'
    });

    mockRecordingService.startRecording.mockResolvedValue(undefined);
    mockRecordingService.stopRecording.mockResolvedValue({
      recordingId: 'rec_123',
      fileSize: 1024000
    });

    // Mock the constructor to return our mock instance
    MockedRecordingService.mockImplementation(() => mockRecordingService);

    // Mock checkCompatibility static method
    MockedRecordingService.checkCompatibility = jest.fn().mockReturnValue({
      supported: true,
      features: {
        mediaRecorder: true,
        getUserMedia: true,
        webRTC: true
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with start recording button', () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Session Recording')).toBeInTheDocument();
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });

    it('should show compatibility error when not supported', () => {
      MockedRecordingService.checkCompatibility.mockReturnValue({
        supported: false,
        features: {
          mediaRecorder: false,
          getUserMedia: true,
          webRTC: true
        },
        recommendations: ['Browser does not support media recording']
      });

      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Recording Not Supported')).toBeInTheDocument();
      expect(screen.getByText('Browser does not support media recording')).toBeInTheDocument();
    });

    it('should disable controls when disabled prop is true', () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} disabled={true} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      expect(startButton).toBeDisabled();
    });
  });

  describe('Recording Controls', () => {
    it('should start recording when start button is clicked', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockRecordingService.startRecording).toHaveBeenCalledWith({
          sessionId: 'session-123',
          participantId: 'participant-456',
          startTime: expect.any(Date),
          format: 'video/webm'
        });
      });
    });

    it('should start audio-only recording when audioOnly config is true', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} config={{ audioOnly: true }} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockRecordingService.startRecording).toHaveBeenCalledWith({
          sessionId: 'session-123',
          participantId: 'participant-456',
          startTime: expect.any(Date),
          format: 'audio/webm'
        });
      });
    });

    it('should show recording controls when recording is active', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      // Simulate recording started
      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      act(() => {
        eventListener({
          type: 'started',
          data: { metadata: { sessionId: 'session-123' } },
          timestamp: new Date()
        });
      });

      rerender(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('should stop recording when stop button is clicked', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      // Start recording first
      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      act(() => {
        eventListener({
          type: 'started',
          data: { metadata: { sessionId: 'session-123' } },
          timestamp: new Date()
        });
      });

      const stopButton = screen.getByText('Stop Recording');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(mockRecordingService.stopRecording).toHaveBeenCalled();
      });
    });

    it('should handle pause and resume functionality', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      // Start recording
      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      act(() => {
        eventListener({
          type: 'started',
          data: { metadata: { sessionId: 'session-123' } },
          timestamp: new Date()
        });
      });

      // Find and click pause button
      const pauseButton = screen.getByLabelText('Pause');
      fireEvent.click(pauseButton);

      expect(mockRecordingService.pauseRecording).toHaveBeenCalled();

      // Simulate paused state
      act(() => {
        eventListener({
          type: 'paused',
          timestamp: new Date()
        });
      });

      // Should now show resume button
      const resumeButton = screen.getByLabelText('Resume');
      fireEvent.click(resumeButton);

      expect(mockRecordingService.resumeRecording).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should call onRecordingStart callback when recording starts', async () => {
      const onRecordingStart = jest.fn();
      
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} onRecordingStart={onRecordingStart} />
        </TestWrapper>
      );

      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      act(() => {
        eventListener({
          type: 'started',
          data: { metadata: { sessionId: 'session-123' } },
          timestamp: new Date()
        });
      });

      expect(onRecordingStart).toHaveBeenCalledWith('session-123');
    });

    it('should call onRecordingStop callback when recording stops', async () => {
      const onRecordingStop = jest.fn();
      
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} onRecordingStop={onRecordingStop} />
        </TestWrapper>
      );

      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      act(() => {
        eventListener({
          type: 'stopped',
          data: { recordingId: 'rec_123', fileSize: 1024000 },
          timestamp: new Date()
        });
      });

      expect(onRecordingStop).toHaveBeenCalledWith('rec_123', 1024000);
    });

    it('should call onRecordingError callback when error occurs', async () => {
      const onRecordingError = jest.fn();
      
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} onRecordingError={onRecordingError} />
        </TestWrapper>
      );

      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      act(() => {
        eventListener({
          type: 'error',
          data: { error: 'Permission denied' },
          timestamp: new Date()
        });
      });

      expect(onRecordingError).toHaveBeenCalledWith('Permission denied');
    });

    it('should display error message in UI', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      act(() => {
        eventListener({
          type: 'error',
          data: { error: 'Recording failed' },
          timestamp: new Date()
        });
      });

      expect(screen.getByText('Recording failed')).toBeInTheDocument();
    });
  });

  describe('Recording Statistics', () => {
    it('should display recording duration and file size', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      
      // Start recording
      act(() => {
        eventListener({
          type: 'started',
          data: { metadata: { sessionId: 'session-123' } },
          timestamp: new Date()
        });
      });

      // Mock status update
      mockRecordingService.getStatus.mockReturnValue({
        isRecording: true,
        isPaused: false,
        duration: 60000, // 1 minute
        chunkCount: 5,
        estimatedFileSize: 1024000, // 1MB
        state: 'recording'
      });

      // Simulate chunk ready event
      act(() => {
        eventListener({
          type: 'chunk_ready',
          data: { chunkSize: 204800, chunkIndex: 5 },
          timestamp: new Date()
        });
      });

      expect(screen.getByText(/Duration: 1:00/)).toBeInTheDocument();
      expect(screen.getByText(/Size: 1.0 MB/)).toBeInTheDocument();
    });

    it('should show upload progress', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      
      // Simulate upload progress
      act(() => {
        eventListener({
          type: 'upload_progress',
          data: { progress: 50, chunkIndex: 2, totalChunks: 4 },
          timestamp: new Date()
        });
      });

      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show success message when recording is saved', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      
      act(() => {
        eventListener({
          type: 'stopped',
          data: { recordingId: 'rec_123456789', fileSize: 1024000 },
          timestamp: new Date()
        });
      });

      expect(screen.getByText(/Recording saved successfully!/)).toBeInTheDocument();
      expect(screen.getByText(/ID: 56789/)).toBeInTheDocument(); // Last 8 chars
    });
  });

  describe('Settings Dialog', () => {
    it('should open settings dialog when settings button is clicked', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      const settingsButton = screen.getByLabelText('Recording Settings');
      fireEvent.click(settingsButton);

      expect(screen.getByText('Recording Settings')).toBeInTheDocument();
      expect(screen.getByText('Audio Only Recording')).toBeInTheDocument();
      expect(screen.getByText('High Quality Recording')).toBeInTheDocument();
    });

    it('should update settings when toggles are changed', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      // Open settings dialog
      const settingsButton = screen.getByLabelText('Recording Settings');
      fireEvent.click(settingsButton);

      // Toggle audio only
      const audioOnlySwitch = screen.getByRole('checkbox', { name: /Audio Only Recording/ });
      fireEvent.click(audioOnlySwitch);

      expect(audioOnlySwitch).toBeChecked();

      // Close dialog
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      // Settings should be applied to new RecordingService instance
      expect(MockedRecordingService).toHaveBeenCalledWith(
        expect.objectContaining({
          audioOnly: true
        })
      );
    });

    it('should disable settings button during recording', async () => {
      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      const eventListener = mockRecordingService.addEventListener.mock.calls[0][0];
      
      // Start recording
      act(() => {
        eventListener({
          type: 'started',
          data: { metadata: { sessionId: 'session-123' } },
          timestamp: new Date()
        });
      });

      const settingsButton = screen.getByLabelText('Recording Settings');
      expect(settingsButton).toBeDisabled();
    });
  });

  describe('Permission Handling', () => {
    it('should show permission dialog when permission is denied', async () => {
      mockRecordingService.startRecording.mockRejectedValue(new Error('Permission denied'));

      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Camera/Microphone Permission Required')).toBeInTheDocument();
      });

      expect(screen.getByText(/To record therapy sessions, we need access/)).toBeInTheDocument();
    });

    it('should retry recording when try again is clicked', async () => {
      mockRecordingService.startRecording
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce(undefined);

      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      // First attempt fails
      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Click try again
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Should attempt to start recording again
      await waitFor(() => {
        expect(mockRecordingService.startRecording).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Auto-start Feature', () => {
    it('should auto-start recording when autoStart is true', async () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} autoStart={true} />
        </TestWrapper>
      );

      // Fast-forward past the auto-start delay
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      await waitFor(() => {
        expect(mockRecordingService.startRecording).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should not auto-start when disabled', async () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} autoStart={true} disabled={true} />
        </TestWrapper>
      );

      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(mockRecordingService.startRecording).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup recording service on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <SessionRecorder {...defaultProps} />
        </TestWrapper>
      );

      unmount();

      expect(mockRecordingService.cleanup).toHaveBeenCalled();
    });
  });
});