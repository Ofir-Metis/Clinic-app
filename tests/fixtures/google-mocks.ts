/**
 * Google API Mocks
 * Mock responses for Google Calendar, OAuth, and Gmail APIs
 * Used with Playwright route interception for reliable E2E testing
 */

import { Page } from '@playwright/test';

// ============================================
// Mock Data Types
// ============================================

export interface MockGoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  hangoutLink?: string;
  conferenceData?: {
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
  attendees?: Array<{
    email: string;
    responseStatus: string;
  }>;
  status?: string;
  created?: string;
  updated?: string;
}

export interface MockGoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  accessRole: string;
  primary?: boolean;
}

export interface MockGoogleToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface MockGoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

// ============================================
// Mock Data
// ============================================

export const MOCK_GOOGLE_TOKENS: MockGoogleToken = {
  access_token: 'mock-access-token-ya29.a0AfB_byC123456789',
  refresh_token: 'mock-refresh-token-1//0gXXXXXX',
  expires_in: 3600,
  token_type: 'Bearer',
  scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send'
};

export const MOCK_GOOGLE_USER: MockGoogleUserInfo = {
  id: '123456789012345678901',
  email: 'test-coach@gmail.com',
  verified_email: true,
  name: 'Test Coach',
  given_name: 'Test',
  family_name: 'Coach',
  picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
  locale: 'en'
};

export const MOCK_CALENDARS: MockGoogleCalendar[] = [
  {
    id: 'primary',
    summary: 'Test Coach',
    description: 'Primary calendar',
    timeZone: 'Asia/Jerusalem',
    accessRole: 'owner',
    primary: true
  },
  {
    id: 'coaching@gmail.com',
    summary: 'Coaching Sessions',
    description: 'Calendar for coaching appointments',
    timeZone: 'Asia/Jerusalem',
    accessRole: 'owner'
  }
];

export function generateMockEvents(count: number = 5): MockGoogleEvent[] {
  const events: MockGoogleEvent[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const startDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    startDate.setHours(10 + (i % 6), 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    events.push({
      id: `mock-event-${i + 1}`,
      summary: `Coaching Session ${i + 1}`,
      description: `Mock coaching session for testing`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Jerusalem'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Jerusalem'
      },
      hangoutLink: `https://meet.google.com/mock-meeting-${i + 1}`,
      conferenceData: {
        entryPoints: [
          {
            entryPointType: 'video',
            uri: `https://meet.google.com/mock-meeting-${i + 1}`
          }
        ]
      },
      attendees: [
        { email: 'test-coach@gmail.com', responseStatus: 'accepted' },
        { email: `client${i + 1}@test.com`, responseStatus: 'needsAction' }
      ],
      status: 'confirmed',
      created: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated: now.toISOString()
    });
  }

  return events;
}

export const MOCK_EVENTS: MockGoogleEvent[] = generateMockEvents(5);

// ============================================
// Error Responses
// ============================================

export const MOCK_ERRORS = {
  unauthorized: {
    error: {
      code: 401,
      message: 'Invalid Credentials',
      status: 'UNAUTHENTICATED'
    }
  },
  forbidden: {
    error: {
      code: 403,
      message: 'The caller does not have permission',
      status: 'PERMISSION_DENIED'
    }
  },
  notFound: {
    error: {
      code: 404,
      message: 'Requested entity was not found.',
      status: 'NOT_FOUND'
    }
  },
  rateLimited: {
    error: {
      code: 429,
      message: 'Rate Limit Exceeded',
      status: 'RESOURCE_EXHAUSTED'
    }
  },
  invalidGrant: {
    error: 'invalid_grant',
    error_description: 'Token has been expired or revoked.'
  }
};

// ============================================
// Playwright Route Handlers
// ============================================

/**
 * Setup all Google API mocks for a Playwright page
 */
export async function setupGoogleMocks(page: Page, options: {
  failAuth?: boolean;
  failCalendar?: boolean;
  customEvents?: MockGoogleEvent[];
} = {}): Promise<void> {

  // Mock Google OAuth token endpoint
  await page.route('**/oauth2/v4/token', async (route) => {
    if (options.failAuth) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ERRORS.invalidGrant)
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GOOGLE_TOKENS)
      });
    }
  });

  // Mock Google OAuth2 token endpoint (alternative URL)
  await page.route('**/token', async (route) => {
    const url = route.request().url();
    if (url.includes('oauth2.googleapis.com') || url.includes('accounts.google.com')) {
      if (options.failAuth) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ERRORS.invalidGrant)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GOOGLE_TOKENS)
        });
      }
    } else {
      await route.continue();
    }
  });

  // Mock Google userinfo endpoint
  await page.route('**/oauth2/v2/userinfo**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_GOOGLE_USER)
    });
  });

  // Mock Google Calendar list endpoint
  await page.route('**/calendar/v3/users/me/calendarList**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'calendar#calendarList',
        etag: '"mock-etag"',
        items: MOCK_CALENDARS
      })
    });
  });

  // Mock Google Calendar events endpoint
  await page.route('**/calendar/v3/calendars/*/events**', async (route) => {
    if (options.failCalendar) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ERRORS.forbidden)
      });
    } else {
      const method = route.request().method();
      const events = options.customEvents || MOCK_EVENTS;

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            kind: 'calendar#events',
            etag: '"mock-etag"',
            summary: 'Mock Calendar',
            updated: new Date().toISOString(),
            timeZone: 'Asia/Jerusalem',
            items: events
          })
        });
      } else if (method === 'POST') {
        // Creating a new event
        const requestBody = route.request().postDataJSON();
        const newEvent: MockGoogleEvent = {
          id: `new-event-${Date.now()}`,
          summary: requestBody?.summary || 'New Event',
          description: requestBody?.description,
          start: requestBody?.start || { dateTime: new Date().toISOString() },
          end: requestBody?.end || { dateTime: new Date(Date.now() + 3600000).toISOString() },
          hangoutLink: `https://meet.google.com/new-${Date.now()}`,
          status: 'confirmed',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newEvent)
        });
      } else if (method === 'PUT' || method === 'PATCH') {
        // Updating an event
        const requestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...events[0],
            ...requestBody,
            updated: new Date().toISOString()
          })
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 204,
          body: ''
        });
      } else {
        await route.continue();
      }
    }
  });

  // Mock Google Meet creation
  await page.route('**/calendar/v3/calendars/*/events/quickAdd**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...MOCK_EVENTS[0],
        id: `quick-add-${Date.now()}`,
        hangoutLink: `https://meet.google.com/quick-${Date.now()}`
      })
    });
  });

  // Mock Gmail API send endpoint
  await page.route('**/gmail/v1/users/me/messages/send**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `mock-message-${Date.now()}`,
        threadId: `mock-thread-${Date.now()}`,
        labelIds: ['SENT']
      })
    });
  });
}

/**
 * Clear all Google API mocks
 */
export async function clearGoogleMocks(page: Page): Promise<void> {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
}

/**
 * Setup mock for specific scenario: OAuth callback
 */
export async function mockGoogleOAuthCallback(page: Page, success: boolean = true): Promise<void> {
  await page.route('**/api/google/callback**', async (route) => {
    if (success) {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/settings?google_connected=true'
        }
      });
    } else {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/settings?google_error=access_denied'
        }
      });
    }
  });
}

/**
 * Setup mock for calendar sync status
 */
export async function mockCalendarSyncStatus(page: Page, synced: boolean = true): Promise<void> {
  await page.route('**/api/google/sync/status**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        connected: synced,
        lastSync: synced ? new Date().toISOString() : null,
        calendarId: synced ? 'primary' : null,
        syncEnabled: synced
      })
    });
  });
}

// ============================================
// Test Helpers
// ============================================

/**
 * Generate a mock Google Meet link
 */
export function generateMockMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = () => Array.from({ length: 3 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  return `https://meet.google.com/${segment()}-${segment()}-${segment()}`;
}

/**
 * Create a mock event for a specific date and time
 */
export function createMockEvent(
  date: Date,
  durationMinutes: number = 60,
  overrides: Partial<MockGoogleEvent> = {}
): MockGoogleEvent {
  const endDate = new Date(date.getTime() + durationMinutes * 60 * 1000);

  return {
    id: `mock-event-${Date.now()}`,
    summary: 'Coaching Session',
    start: {
      dateTime: date.toISOString(),
      timeZone: 'Asia/Jerusalem'
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'Asia/Jerusalem'
    },
    hangoutLink: generateMockMeetLink(),
    status: 'confirmed',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    ...overrides
  };
}
