# Phase 6: Recording Consent & Player Components Implementation

## Overview
This implementation provides complete recording consent and playback functionality for client users, following production-ready best practices with full translation support.

## Frontend Components

### 1. RecordingConsentBanner (`frontend/src/components/client/RecordingConsentBanner.tsx`)
- **Purpose**: Displayed within session detail views when recording is enabled
- **Features**:
  - Explanation of recording scope (audio, video, transcription, AI analysis)
  - Granular consent checkboxes:
    - Audio recording (name="audio-consent")
    - Transcription (name="transcription-consent")
    - AI Analysis (name="ai-analysis-consent")
  - Accept button (name="accept-consent")
  - Decline button (name="decline-consent")
  - Error handling with user feedback
  - Loading states during submission
- **Translation**: Uses `useTranslation` from `LanguageContext`
- **Test Coverage**: Matches regex patterns for /audio|video|transcription|ai.*analysis/i

### 2. SessionRecordingPlayer (`frontend/src/components/client/SessionRecordingPlayer.tsx`)
- **Purpose**: HTML5 audio/video player with custom MUI controls
- **Features**:
  - Play/pause button (aria-label="play"/"pause")
  - Seek/progress bar (role="slider")
  - Volume control (aria-label="volume")
  - Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
  - Current time display (format: MM:SS or H:MM:SS)
  - Support for both audio and video types
  - Time update callbacks
- **Props**:
  - `src`: Media URL
  - `type`: 'audio' | 'video'
  - `duration`: Optional duration in seconds
  - `onTimeUpdate`: Optional callback for time updates

### 3. TranscriptViewer (`frontend/src/components/client/TranscriptViewer.tsx`)
- **Purpose**: Display session transcript with search and navigation
- **Features**:
  - Speaker labels ("Coach" and "Client")
  - Search functionality (role="searchbox")
  - Download button (aria-label="download transcript")
  - Timestamp-based navigation
  - Click to seek in recording
  - Visual distinction between speakers using colored chips
- **Props**:
  - `transcript`: Array of {speaker, text, timestamp}
  - `onSeek`: Optional callback for seeking

### 4. SessionSummary (`frontend/src/components/client/SessionSummary.tsx`)
- **Purpose**: Display AI-generated session summary
- **Features**:
  - Key points section (heading matches /key.*point|summary/i)
  - Action items section (heading matches /action.*item|next.*step|to.*do/i)
  - Topics discussed as Chips (heading matches /topic|discussed/i)
  - Client-friendly insights (heading matches /insight/i)
- **Props**:
  - `summary`: Object with keyPoints, actionItems, topics, insights arrays

## Backend Consent Endpoints

### Recording Controller (`services/appointments-service/src/recording/recording.controller.ts`)
Updated with new `RecordingConsentController`:

#### Endpoints (Static routes BEFORE parameterized ones):

1. **POST `/recordings/consent`** - Submit consent
   - Body: `{ sessionId, audioConsent, transcriptionConsent, aiAnalysisConsent, userId }`
   - Returns: Updated recording with consent fields

2. **GET `/recordings/consent/history`** - Get consent history (BEFORE :sessionId)
   - Body: `{ userId }`
   - Returns: Array of recordings with consent data

3. **GET `/recordings/consent/:sessionId`** - Get consent status for session
   - Returns: Consent status object

4. **DELETE `/recordings/consent/:sessionId`** - Revoke consent
   - Body: `{ userId }`
   - Returns: Updated recording with revoked consent

### Recording Service (`services/appointments-service/src/recording/recording.service.ts`)
Added methods:
- `submitConsent()` - Store consent preferences
- `getConsentStatus()` - Retrieve consent status
- `getConsentHistory()` - Get user's consent history
- `revokeConsent()` - Revoke previously given consent

### Recording Entity (`services/appointments-service/src/recording/recording.entity.ts`)
Added fields:
- `audioConsent` (boolean)
- `transcriptionConsent` (boolean)
- `aiAnalysisConsent` (boolean)
- `consentGivenAt` (timestamp, nullable)
- `consentRevokedAt` (timestamp, nullable)

### Recording Module (`services/appointments-service/src/recording/recording.module.ts`)
- New module created to register controllers and services
- Imports TypeORM entities
- Exports RecordingService

## Translations

### English (`frontend/src/i18n/translations/en.ts`)
```typescript
recording: {
  consent: {
    title: 'Session Recording Consent',
    description: 'This session may be recorded for quality and review purposes',
    includes: 'Recording may include audio, video, transcription, and AI analysis',
    audioRecording: 'Audio Recording',
    transcription: 'Transcription',
    aiAnalysis: 'AI Analysis',
    accept: 'Accept Recording',
    decline: 'Decline Recording',
    revoke: 'Revoke Consent',
    history: 'Consent History',
  },
  player: { ... },
  transcript: { ... },
  summary: { ... },
}
```

### Hebrew (`frontend/src/i18n/translations/he.ts`)
Full RTL-compatible translations for all recording features.

### Spanish (`frontend/src/i18n/translations/es.ts`)
Complete Spanish translations for recording consent and playback.

## Usage Example

```typescript
import {
  RecordingConsentBanner,
  SessionRecordingPlayer,
  TranscriptViewer,
  SessionSummary,
  type ConsentData,
  type TranscriptSegment,
  type SessionSummaryData,
} from '../components/client';

// In your session detail page:
<RecordingConsentBanner
  sessionId={sessionId}
  onConsentSubmit={handleConsentSubmit}
  onDecline={handleDecline}
  existingConsent={existingConsent}
/>

<SessionRecordingPlayer
  src="/api/recordings/session-123/stream"
  type="video"
  duration={3600}
  onTimeUpdate={(time) => console.log('Current time:', time)}
/>

<TranscriptViewer
  transcript={transcriptSegments}
  onSeek={(timestamp) => playerRef.current.seekTo(timestamp)}
/>

<SessionSummary
  summary={{
    keyPoints: [...],
    actionItems: [...],
    topics: [...],
    insights: [...]
  }}
/>
```

## API Integration

```typescript
// Submit consent
const response = await fetch('/api/recordings/consent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-uuid',
    audioConsent: true,
    transcriptionConsent: true,
    aiAnalysisConsent: true,
    userId: 'user-uuid'
  })
});

// Get consent status
const consent = await fetch(`/api/recordings/consent/${sessionId}`);

// Revoke consent
await fetch(`/api/recordings/consent/${sessionId}`, {
  method: 'DELETE',
  body: JSON.stringify({ userId })
});
```

## Testing

All components match the test patterns specified:
- Recording explanation: `/audio|video|transcription|ai.*analysis/i`
- Consent checkboxes: `/audio/i`, `/transcription|transcript/i`, `/ai|analysis/i`
- Action buttons: `/accept|agree|consent/i`, `/decline|deny|refuse/i`
- Player controls: `/play|pause/i`, `role="slider"`, `/volume/i`, `/speed|1x|1.5x|2x/i`
- Time display: `/\d{1,2}:\d{2}/i`
- Transcript search: `role="searchbox"` or `/search/i`
- Download: `/download/i`
- Summary sections: `/key.*point|summary/i`, `/action.*item|next.*step|to.*do/i`, `/topic|discussed/i`, `/insight/i`

## Files Created/Modified

### Created:
- `frontend/src/components/client/RecordingConsentBanner.tsx`
- `frontend/src/components/client/SessionRecordingPlayer.tsx`
- `frontend/src/components/client/TranscriptViewer.tsx`
- `frontend/src/components/client/SessionSummary.tsx`
- `frontend/src/components/client/index.ts`
- `services/appointments-service/src/recording/recording.module.ts`

### Modified:
- `services/appointments-service/src/recording/recording.entity.ts` - Added consent fields
- `services/appointments-service/src/recording/recording.controller.ts` - Added RecordingConsentController
- `services/appointments-service/src/recording/recording.service.ts` - Added consent methods
- `services/appointments-service/src/app.module.ts` - Imported RecordingModule
- `frontend/src/i18n/translations/en.ts` - Added recording translations
- `frontend/src/i18n/translations/he.ts` - Added Hebrew translations
- `frontend/src/i18n/translations/es.ts` - Added Spanish translations

## Important Notes

### NestJS Route Ordering
Following CLAUDE.md rules, static routes are declared BEFORE parameterized routes:
```typescript
@Get('history')  // Static - declared FIRST
async getConsentHistory() { ... }

@Get(':sessionId')  // Parameterized - declared AFTER
async getConsentStatus() { ... }
```

### Translation System
All components use the mandatory translation system:
```typescript
import { useTranslation } from '../../contexts/LanguageContext';
const { translations } = useTranslation();
```

Fallback pattern for safety:
```typescript
const t = translations.recording?.consent || {
  title: 'Session Recording Consent',
  // ... fallbacks
};
```

### Terminology
- "Client" not "Patient"
- "Coach" not "Therapist"
- "Coaching Sessions" not "Appointments" (in user-facing text)
- Database still uses `patient`/`therapist` internally - mapping at service layer

## Next Steps

To complete integration:
1. Add RecordingConsentBanner to session detail pages
2. Wire up player components to actual recording URLs
3. Implement transcript generation service integration
4. Connect AI summary generation to GPT-5 service
5. Add database migration for new consent fields
6. Add E2E tests for consent flow
