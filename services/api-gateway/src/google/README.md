# Google Calendar Integration

This module provides comprehensive Google Calendar integration for the clinic management system, including OAuth 2.0 authentication, real-time webhook notifications, and bi-directional calendar synchronization.

## Features

- **OAuth 2.0 Authentication**: Secure Google account authorization
- **Real-time Webhooks**: Instant notifications when calendar events change
- **Calendar Synchronization**: Bi-directional sync between Google Calendar and appointments
- **Event Management**: Create, update, and delete calendar events
- **Multi-calendar Support**: Support for multiple calendars per user
- **Token Management**: Automatic token refresh and validation

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure:
   - **Name**: `Clinic Management System`
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)

### 3. Environment Variables

Add these to your `.env` file:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_WEBHOOK_URL=https://your-domain.com/api/webhooks/google-calendar
GOOGLE_WEBHOOK_SECRET=your_webhook_secret_here

# For production, use HTTPS URLs:
# GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
# GOOGLE_WEBHOOK_URL=https://your-domain.com/api/webhooks/google-calendar
```

### 4. Webhook Domain Verification

For webhooks to work in production:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain as a property
3. Verify domain ownership
4. This is required for Google to send webhook notifications to your domain

## API Endpoints

### Authentication Endpoints

#### `GET /api/auth/google/authorize`
Initiate Google OAuth flow
- **Auth**: JWT required (coach/admin)
- **Response**: Authorization URL

#### `GET /api/auth/google/callback`
Handle OAuth callback
- **Params**: `code`, `state`, `error`
- **Response**: User info and calendar list

#### `POST /api/auth/google/refresh`
Refresh access token
- **Body**: `{ refreshToken: string }`
- **Auth**: JWT required

#### `POST /api/auth/google/revoke`
Revoke Google access
- **Body**: `{ accessToken: string }`
- **Auth**: JWT required

#### `POST /api/auth/google/setup-integration`
Complete integration setup (OAuth + Webhook + Sync)
- **Body**: `{ accessToken: string, calendarId?: string, enableWebhook?: boolean }`
- **Auth**: JWT required

### Webhook Endpoints

#### `POST /api/webhooks/google-calendar`
Receive calendar change notifications
- **Public endpoint** (Google calls this)
- **Headers**: Google webhook headers

#### `POST /api/webhooks/google-calendar/setup`
Setup webhook subscription
- **Body**: `{ accessToken: string, calendarId?: string }`
- **Auth**: JWT required

#### `POST /api/webhooks/google-calendar/sync`
Manual calendar sync
- **Body**: `{ accessToken: string, calendarId?: string, startDate?: string, endDate?: string }`
- **Auth**: JWT required

#### `GET /api/webhooks/google-calendar/events`
Get calendar events
- **Query**: `accessToken`, `calendarId`, `timeMin`, `timeMax`, `maxResults`
- **Auth**: JWT required

## Usage Flow

### 1. Initial Setup (Coach/Admin)

```javascript
// 1. Get authorization URL
const authResponse = await fetch('/api/auth/google/authorize', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
const { authUrl } = await authResponse.json();

// 2. Redirect user to authUrl
window.location.href = authUrl;

// 3. User grants permissions, Google redirects to callback
// 4. Callback endpoint processes the authorization
```

### 2. Complete Integration

```javascript
// After OAuth callback, complete the integration
const integrationResponse = await fetch('/api/auth/google/setup-integration', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    accessToken: googleAccessToken,
    calendarId: 'primary', // or specific calendar ID
    enableWebhook: true
  })
});

const result = await integrationResponse.json();
// Result includes webhook status and initial sync results
```

### 3. Handle Webhook Notifications

Webhooks are handled automatically. When calendar events change:

1. Google sends notification to `/api/webhooks/google-calendar`
2. System processes the notification
3. Relevant appointments are created/updated/deleted
4. Real-time notifications sent to affected users (via WebSocket)

### 4. Manual Sync (if needed)

```javascript
const syncResponse = await fetch('/api/webhooks/google-calendar/sync', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    accessToken: googleAccessToken,
    calendarId: 'primary',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-02-01T00:00:00Z'
  })
});

const { eventsProcessed, appointmentsCreated, appointmentsUpdated } = await syncResponse.json();
```

## Security Considerations

### Token Storage
- Store refresh tokens encrypted in database
- Never expose refresh tokens to frontend
- Implement token rotation

### Webhook Security
- Verify webhook authenticity using tokens
- Implement rate limiting
- Log all webhook requests for monitoring

### Permissions
- Request minimal required scopes
- Regularly audit connected accounts
- Provide easy revocation mechanism

## Event Mapping

### Google Calendar Event → Appointment

```javascript
{
  id: `google_${event.id}`,
  title: event.summary,
  description: event.description,
  startTime: new Date(event.start.dateTime),
  endTime: new Date(event.end.dateTime),
  timezone: event.start.timeZone,
  location: event.location,
  status: event.status === 'confirmed' ? 'scheduled' : event.status,
  attendees: event.attendees?.map(attendee => ({
    email: attendee.email,
    name: attendee.displayName,
    status: attendee.responseStatus
  })),
  source: 'google_calendar',
  externalId: event.id
}
```

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure redirect URI in Google Console matches exactly
   - Check for trailing slashes, http vs https

2. **"Webhook not receiving notifications"**
   - Verify domain ownership in Google Search Console
   - Check webhook URL is publicly accessible
   - Ensure HTTPS in production

3. **"Token expired" errors**
   - Implement automatic token refresh
   - Store refresh tokens securely
   - Handle token refresh in error scenarios

4. **"Calendar not found"**
   - User may have deleted calendar
   - Check calendar permissions
   - Verify calendar ID format

### Debugging

Enable debug logging:
```env
LOG_LEVEL=debug
```

Check logs for:
- OAuth flow steps
- Webhook notifications
- API call responses
- Token refresh attempts

## Rate Limits

Google Calendar API limits:
- **Queries per day**: 1,000,000
- **Queries per 100 seconds per user**: 1,000
- **Queries per 100 seconds**: 100,000

Implement proper error handling and retry logic for rate limit errors.

## Testing

### Unit Tests
```bash
npm test google
```

### Integration Tests
```bash
npm run test:e2e google
```

### Manual Testing
1. Set up test Google account
2. Create test calendar events
3. Verify webhook notifications
4. Test OAuth flow
5. Check appointment synchronization