/**
 * Meeting Detection Utilities
 * Detect and handle different types of online meetings (Google Meet, Zoom, etc.)
 */

export interface MeetingInfo {
  provider: 'google-meet' | 'zoom' | 'teams' | 'unknown';
  meetingId?: string;
  isOnlineMeeting: boolean;
  meetingUrl?: string;
  recommendedRecordingMode: 'camera' | 'screen' | 'both';
  requiresScreenRecording: boolean;
}

/**
 * Analyze a meeting URL or appointment data to determine meeting type and recording strategy
 */
export function detectMeetingType(meetingUrl?: string, appointmentData?: any): MeetingInfo {
  if (!meetingUrl) {
    return {
      provider: 'unknown',
      isOnlineMeeting: false,
      recommendedRecordingMode: 'camera',
      requiresScreenRecording: false
    };
  }

  const url = meetingUrl.toLowerCase();

  // Google Meet detection
  if (url.includes('meet.google.com')) {
    const meetingId = extractGoogleMeetId(meetingUrl);
    return {
      provider: 'google-meet',
      meetingId,
      isOnlineMeeting: true,
      meetingUrl,
      recommendedRecordingMode: 'screen',
      requiresScreenRecording: true
    };
  }

  // Zoom detection
  if (url.includes('zoom.us') || url.includes('zoom.com')) {
    const meetingId = extractZoomMeetingId(meetingUrl);
    return {
      provider: 'zoom',
      meetingId,
      isOnlineMeeting: true,
      meetingUrl,
      recommendedRecordingMode: 'screen',
      requiresScreenRecording: true
    };
  }

  // Microsoft Teams detection
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
    return {
      provider: 'teams',
      isOnlineMeeting: true,
      meetingUrl,
      recommendedRecordingMode: 'screen',
      requiresScreenRecording: true
    };
  }

  // Unknown online meeting
  if (url.includes('http') || url.includes('www.')) {
    return {
      provider: 'unknown',
      isOnlineMeeting: true,
      meetingUrl,
      recommendedRecordingMode: 'screen',
      requiresScreenRecording: true
    };
  }

  // Not an online meeting
  return {
    provider: 'unknown',
    isOnlineMeeting: false,
    recommendedRecordingMode: 'camera',
    requiresScreenRecording: false
  };
}

/**
 * Extract Google Meet meeting ID from URL
 */
function extractGoogleMeetId(url: string): string | undefined {
  const match = url.match(/meet\.google\.com\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : undefined;
}

/**
 * Extract Zoom meeting ID from URL
 */
function extractZoomMeetingId(url: string): string | undefined {
  const match = url.match(/zoom\.us\/j\/(\d+)/) || url.match(/zoom\.com\/j\/(\d+)/);
  return match ? match[1] : undefined;
}

/**
 * Check if browser supports screen recording for online meetings
 */
export function checkScreenRecordingSupport(): {
  supported: boolean;
  limitations: string[];
  recommendations: string[];
} {
  const navigator = window.navigator as any;
  const limitations: string[] = [];
  const recommendations: string[] = [];

  // Check if getDisplayMedia is available
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

  if (!supported) {
    limitations.push('Browser does not support screen recording');
    recommendations.push('Use Chrome, Firefox, or Edge for screen recording');
    return { supported: false, limitations, recommendations };
  }

  // Check HTTPS requirement
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    limitations.push('HTTPS required for screen recording');
    recommendations.push('Ensure the site is loaded over HTTPS');
  }

  // Browser-specific limitations
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    limitations.push('Safari has limited screen recording support');
    recommendations.push('Use Chrome or Firefox for best screen recording experience');
  }

  if (userAgent.includes('firefox')) {
    limitations.push('Firefox requires user permission for each screen recording session');
  }

  // Mobile limitations
  if (/android|iphone|ipad|mobile/i.test(userAgent)) {
    limitations.push('Mobile browsers have limited screen recording support');
    recommendations.push('Use desktop browser for recording online meetings');
  }

  return { supported, limitations, recommendations };
}

/**
 * Get recording instructions for different meeting providers
 */
export function getRecordingInstructions(meetingInfo: MeetingInfo): {
  title: string;
  instructions: string[];
  tips: string[];
} {
  switch (meetingInfo.provider) {
    case 'google-meet':
      return {
        title: 'Recording Google Meet Session',
        instructions: [
          '1. Click "Start Recording" below',
          '2. Select "Share screen" or "Share tab" when prompted',
          '3. Choose the Google Meet tab/window',
          '4. Ensure "Share tab audio" is enabled',
          '5. Join or continue your Google Meet session'
        ],
        tips: [
          'Share the specific tab rather than entire screen for better performance',
          'Make sure system audio is enabled to capture meeting participants',
          'The recording will include both video and audio from the meeting',
          'Your microphone audio will be recorded separately for better quality'
        ]
      };

    case 'zoom':
      return {
        title: 'Recording Zoom Session',
        instructions: [
          '1. Click "Start Recording" below',
          '2. Select "Share screen" when prompted',
          '3. Choose the Zoom window',
          '4. Enable system audio capture',
          '5. Continue with your Zoom meeting'
        ],
        tips: [
          'Zoom has built-in recording, but this provides an additional backup',
          'Screen recording captures the full meeting experience',
          'Audio quality may be better with screen recording + microphone'
        ]
      };

    case 'teams':
      return {
        title: 'Recording Microsoft Teams Session',
        instructions: [
          '1. Click "Start Recording" below',
          '2. Select the Teams window for recording',
          '3. Enable system audio capture',
          '4. Continue with your Teams meeting'
        ],
        tips: [
          'Teams meetings can be recorded within Teams as well',
          'This provides an independent backup recording',
          'Screen recording captures shared content better'
        ]
      };

    default:
      return {
        title: 'Recording Online Meeting',
        instructions: [
          '1. Click "Start Recording" below',
          '2. Select the meeting window/tab when prompted',
          '3. Enable audio capture if available',
          '4. Continue with your online session'
        ],
        tips: [
          'Screen recording is recommended for online meetings',
          'Ensure you capture both video and audio',
          'Test recording setup before important sessions'
        ]
      };
  }
}

/**
 * Check if current page is a Google Meet session
 */
export function checkIfInGoogleMeet(): boolean {
  return window.location.hostname.includes('meet.google.com');
}

/**
 * Monitor for Google Meet recording status (if available)
 */
export function monitorGoogleMeetRecording(): {
  isRecording: boolean;
  recordingIndicator?: Element;
} {
  if (!checkIfInGoogleMeet()) {
    return { isRecording: false };
  }

  // Look for Google Meet's own recording indicator
  const recordingIndicators = [
    '[data-recording-indicator]',
    '[aria-label*="recording"]',
    '.recording-indicator',
    '[title*="recording"]'
  ];

  for (const selector of recordingIndicators) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.toLowerCase().includes('rec')) {
      return { isRecording: true, recordingIndicator: element };
    }
  }

  return { isRecording: false };
}

/**
 * Create Google Meet recording consent banner
 */
export function createRecordingConsentBanner(onAccept: () => void, onDecline: () => void): HTMLElement {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #1565c0;
    color: white;
    padding: 16px;
    text-align: center;
    z-index: 10000;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  `;

  banner.innerHTML = `
    <div>
      <strong>🔴 Session Recording Notice</strong>
      <p style="margin: 8px 0;">This therapy session will be recorded for clinical purposes. All participants consent to recording.</p>
      <button id="accept-recording" style="margin: 0 8px; padding: 8px 16px; background: #43a047; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Accept & Continue
      </button>
      <button id="decline-recording" style="margin: 0 8px; padding: 8px 16px; background: #e53935; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Decline Recording
      </button>
    </div>
  `;

  banner.querySelector('#accept-recording')?.addEventListener('click', () => {
    banner.remove();
    onAccept();
  });

  banner.querySelector('#decline-recording')?.addEventListener('click', () => {
    banner.remove();
    onDecline();
  });

  return banner;
}