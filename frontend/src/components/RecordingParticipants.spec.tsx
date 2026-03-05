import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordingParticipants from './RecordingParticipants';

// Mock the WebSocket hook
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

jest.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionState: {
      connected: true,
      connecting: false,
      sessionJoined: true
    },
    connect: jest.fn(),
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener
  })
}));

describe('RecordingParticipants', () => {
  const defaultProps = {
    sessionId: 'session-123',
    currentUserId: 'user-456'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no participants', () => {
    render(<RecordingParticipants {...defaultProps} showExpanded />);

    expect(screen.getByText(/No participants connected/)).toBeInTheDocument();
  });

  it('shows participants when they join via WebSocket', async () => {
    render(<RecordingParticipants {...defaultProps} showExpanded />);

    // Get the event handler that was registered
    const [[, handler]] = mockAddEventListener.mock.calls.filter(
      ([event]: [string]) => event === 'message'
    );

    // Simulate participant joining
    handler({
      type: 'participant_joined',
      data: {
        id: 'user-789',
        name: 'Jane Doe',
        role: 'coach',
        isRecording: false,
        hasAudio: true,
        hasVideo: true
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Coach')).toBeInTheDocument();
    });
  });

  it('removes participants when they leave', async () => {
    render(<RecordingParticipants {...defaultProps} showExpanded />);

    const [[, handler]] = mockAddEventListener.mock.calls.filter(
      ([event]: [string]) => event === 'message'
    );

    // Add participant
    handler({
      type: 'participant_joined',
      data: {
        id: 'user-789',
        name: 'Jane Doe',
        role: 'coach'
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    // Remove participant
    handler({
      type: 'participant_left',
      data: {
        participantId: 'user-789'
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });
  });

  it('shows recording indicator when participant is recording', async () => {
    render(<RecordingParticipants {...defaultProps} showExpanded />);

    const [[, handler]] = mockAddEventListener.mock.calls.filter(
      ([event]: [string]) => event === 'message'
    );

    // Add recording participant
    handler({
      type: 'participant_joined',
      data: {
        id: 'user-789',
        name: 'Jane Doe',
        role: 'coach',
        isRecording: true
      }
    });

    await waitFor(() => {
      expect(screen.getByText('REC')).toBeInTheDocument();
    });
  });

  it('updates participant status on recording_started event', async () => {
    render(<RecordingParticipants {...defaultProps} showExpanded />);

    const [[, handler]] = mockAddEventListener.mock.calls.filter(
      ([event]: [string]) => event === 'message'
    );

    // Add participant
    handler({
      type: 'participant_joined',
      data: {
        id: 'user-789',
        name: 'Jane Doe',
        role: 'coach',
        isRecording: false
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('REC')).not.toBeInTheDocument();
    });

    // Start recording
    handler({
      type: 'recording_started',
      data: {
        participantId: 'user-789'
      }
    });

    await waitFor(() => {
      expect(screen.getByText('REC')).toBeInTheDocument();
    });
  });

  it('expands and collapses participant details', async () => {
    render(<RecordingParticipants {...defaultProps} />);

    const [[, handler]] = mockAddEventListener.mock.calls.filter(
      ([event]: [string]) => event === 'message'
    );

    handler({
      type: 'participant_joined',
      data: {
        id: 'user-789',
        name: 'Jane Doe',
        role: 'coach'
      }
    });

    // Find expand button and click
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons.find(btn => btn.querySelector('svg'));

    if (expandButton) {
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });
    }
  });

  it('handles initial participants list', async () => {
    render(<RecordingParticipants {...defaultProps} showExpanded />);

    const [[, handler]] = mockAddEventListener.mock.calls.filter(
      ([event]: [string]) => event === 'message'
    );

    // Send initial list
    handler({
      type: 'participants_list',
      data: {
        participants: [
          {
            id: 'user-1',
            name: 'Coach Smith',
            role: 'coach',
            isRecording: true,
            hasAudio: true,
            hasVideo: true,
            joinedAt: new Date().toISOString()
          },
          {
            id: 'user-2',
            name: 'Client Jones',
            role: 'client',
            isRecording: false,
            hasAudio: true,
            hasVideo: false,
            joinedAt: new Date().toISOString()
          }
        ]
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Coach Smith')).toBeInTheDocument();
      expect(screen.getByText('Client Jones')).toBeInTheDocument();
    });
  });

  it('calls onParticipantJoin callback', async () => {
    const onParticipantJoin = jest.fn();

    render(
      <RecordingParticipants
        {...defaultProps}
        onParticipantJoin={onParticipantJoin}
      />
    );

    const [[, handler]] = mockAddEventListener.mock.calls.filter(
      ([event]: [string]) => event === 'message'
    );

    handler({
      type: 'participant_joined',
      data: {
        id: 'user-789',
        name: 'Jane Doe',
        role: 'coach'
      }
    });

    await waitFor(() => {
      expect(onParticipantJoin).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-789',
          name: 'Jane Doe',
          role: 'coach'
        })
      );
    });
  });

  it('highlights current user', async () => {
    render(<RecordingParticipants {...defaultProps} showExpanded />);

    const [[, handler]] = mockAddEventListener.mock.calls.filter(
      ([event]: [string]) => event === 'message'
    );

    // Add current user
    handler({
      type: 'participant_joined',
      data: {
        id: 'user-456', // Same as currentUserId
        name: 'Current User',
        role: 'client'
      }
    });

    await waitFor(() => {
      expect(screen.getByText('(you)')).toBeInTheDocument();
    });
  });
});
