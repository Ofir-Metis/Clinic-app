# Voice-to-Text Note Recording Implementation Plan

## Executive Summary

This document outlines the implementation plan for **Voice-to-text note recording during/after coaching sessions** - a Phase 2 feature for the wellness coaching platform. The feature enables coaches to dictate notes using voice instead of typing, with automatic transcription and smart integration with session context.

---

## 1. Research Findings & Best Practices

### 1.1 Speech-to-Text Technology Landscape (2025-2026)

| Provider | Accuracy (WER) | Latency | Cost/minute | Real-time | HIPAA BAA |
|----------|---------------|---------|-------------|-----------|-----------|
| **OpenAI Whisper API** | 8.06% | Batch only | $0.006 | No | Yes |
| **AssemblyAI Universal-2** | 14.5% | Streaming | $0.0037-0.012 | Yes | Yes |
| **Deepgram Nova-3** | ~18% | <300ms | $0.0043 | Yes | Yes |
| **Google Cloud STT** | 16-21% | Streaming | $0.024 | Yes | Yes |
| **AWS Transcribe** | 18-22% | Streaming | $0.024 | Yes | Yes |
| **Browser Web Speech API** | Variable | Real-time | Free | Yes | No |

**Sources**: [Gladia Comparison](https://www.gladia.io/blog/openai-whisper-vs-google-speech-to-text-vs-amazon-transcribe), [AssemblyAI](https://www.assemblyai.com/blog/google-cloud-speech-to-text-alternatives), [VocaFuse Pricing](https://vocafuse.com/blog/best-speech-to-text-api-comparison-2025/)

### 1.2 Key Recommendations

1. **Accuracy First**: OpenAI Whisper has the best accuracy (8.06% WER) at the lowest cost ($0.006/min)
2. **Real-time for UX**: Use browser-based recognition for immediate feedback, server-side for final transcription
3. **HIPAA Compliance**: Requires encryption in transit/at rest, access controls, audit logs, and BAA
4. **Hybrid Approach**: Combine local preview with cloud processing for optimal UX and accuracy

### 1.3 UX Design Principles (Voice Interfaces)

- **Visual Feedback**: Waveform visualization during recording confirms audio capture
- **Multimodal**: Support both voice and keyboard input simultaneously
- **Error Recovery**: Clear indication when speech isn't recognized, easy retry
- **Confidence Display**: Show transcription confidence to guide manual corrections
- **Progressive Enhancement**: Work without voice, enhanced with voice

**Sources**: [Designlab VUI Best Practices](https://designlab.com/blog/voice-user-interface-design-best-practices), [Smashing Magazine Audio Visualization](https://www.smashingmagazine.com/2022/03/audio-visualization-javascript-gsap-part1/)

---

## 2. Current System Analysis

### 2.1 Existing Infrastructure (Strengths)

| Component | Location | Capability |
|-----------|----------|------------|
| **RecordingService** | `frontend/src/services/RecordingService.ts` | WebRTC recording, chunked upload, waveform |
| **SessionRecorder** | `frontend/src/components/SessionRecorder.tsx` | Full recording UI with consent flow |
| **Notes Service** | `services/notes-service/` | CRUD for coach notes, entity linking |
| **AI Service** | `services/ai-service/` | OpenAI integration, transcription entities |
| **Transcription Entity** | `services/ai-service/src/entities/transcription.entity.ts` | Full schema with segments, speakers, confidence |
| **Consent Tracking** | `services/appointments-service/src/consent/` | Recording consent with audit trail |
| **Storage** | MinIO/S3 | Encrypted file storage with signed URLs |

### 2.2 Gaps to Fill

1. **Voice Note UI Component**: No dedicated quick-dictation interface
2. **Real-time Transcription**: Current flow is batch-only (upload → process)
3. **OpenAI Whisper Integration**: Entities exist but service is mocked
4. **Note-Transcription Linking**: No connection between voice recordings and notes
5. **Mobile Optimization**: Current recording UI is desktop-focused
6. **Offline Support**: No local storage fallback for voice notes

---

## 3. Architecture Design

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  VoiceNoteButton │  │  VoiceNoteModal  │  │  TranscriptionEditor │   │
│  │  (Floating FAB)  │→ │  (Recording UI)  │→ │  (Edit & Save)       │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘   │
│           │                    │                        │               │
│           │         ┌─────────┴─────────┐               │               │
│           │         ▼                   ▼               │               │
│  ┌────────┴─────────────┐  ┌──────────────────┐        │               │
│  │  VoiceRecordingService│  │  Web Speech API  │        │               │
│  │  (Audio capture)      │  │  (Live preview)  │        │               │
│  └──────────────────────┘  └──────────────────┘        │               │
│           │                                             │               │
└───────────┼─────────────────────────────────────────────┼───────────────┘
            │ WebSocket/REST                              │ REST
            ▼                                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐    ┌──────────────────────┐                   │
│  │  /voice-notes/upload │    │  /voice-notes/       │                   │
│  │  (Audio + metadata)  │    │  transcribe          │                   │
│  └──────────────────────┘    └──────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────┐    ┌─────────────────────────────────────────────┐
│    FILES SERVICE    │    │              AI SERVICE                      │
│  ┌───────────────┐  │    │  ┌─────────────────────────────────────┐    │
│  │ MinIO Storage │  │───▶│  │  TranscriptionService               │    │
│  │ (Encrypted)   │  │    │  │  ┌─────────────────────────────┐    │    │
│  └───────────────┘  │    │  │  │ OpenAI Whisper API          │    │    │
└─────────────────────┘    │  │  │ - Audio download from MinIO │    │    │
                           │  │  │ - Transcription processing  │    │    │
                           │  │  │ - Segment extraction        │    │    │
                           │  │  └─────────────────────────────┘    │    │
                           │  └─────────────────────────────────────┘    │
                           └─────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NOTES SERVICE                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  VoiceNote Entity                                                 │   │
│  │  - audioFileId (links to storage)                                 │   │
│  │  - transcription (final text)                                     │   │
│  │  - linkedNoteId (optional - if converted to regular note)         │   │
│  │  - sessionContext (appointmentId, timestamp in session)           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow Scenarios

#### Scenario A: Quick Voice Note (During Session)
```
1. Coach taps floating mic button → VoiceNoteModal opens
2. Modal shows waveform + Web Speech API live preview (optional)
3. Coach speaks → Audio captured via MediaRecorder
4. Coach stops → Audio blob created
5. User reviews live preview, makes quick edits
6. "Save" → Audio uploaded to MinIO, transcription queued
7. Background: Whisper processes → Updates note with final transcription
8. Note appears in session notes sidebar
```

#### Scenario B: Post-Session Dictation
```
1. Session ends → Prompt: "Add voice notes about this session?"
2. Coach opens dedicated dictation mode
3. Full-screen recording with pause/resume
4. Timestamp markers can be added manually
5. On completion → Same upload/transcribe flow
6. Transcription saved with appointment linkage
```

### 3.3 Technology Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Primary STT** | OpenAI Whisper API | Best accuracy (8%), lowest cost ($0.006/min), HIPAA BAA available |
| **Live Preview** | Browser Web Speech API | Free, instant feedback, no server round-trip |
| **Audio Format** | WebM Opus → converted to MP3 | Whisper works best with MP3, WebM for browser recording |
| **Storage** | MinIO (existing) | Already configured, encrypted, signed URLs |
| **Real-time Streaming** | NOT in Phase 1 | Adds complexity, Whisper batch is fast enough (<30s/hour) |
| **Mobile Support** | PWA with touch-optimized UI | Existing React app, responsive design |

---

## 4. Database Schema

### 4.1 New Entity: VoiceNote

```typescript
// services/notes-service/src/voice-notes/voice-note.entity.ts

@Entity('voice_notes')
export class VoiceNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coach_id', type: 'uuid' })
  @Index()
  coachId: string;

  // Context linking
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  @Index()
  appointmentId?: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  @Index()
  clientId?: string;

  @Column({ name: 'linked_note_id', type: 'uuid', nullable: true })
  linkedNoteId?: string; // If converted to regular note

  // Audio file reference
  @Column({ name: 'audio_file_id', type: 'uuid' })
  audioFileId: string;

  @Column({ name: 'audio_url', type: 'text', nullable: true })
  audioUrl?: string; // Signed URL (temporary)

  @Column({ name: 'duration_seconds', type: 'integer' })
  durationSeconds: number;

  @Column({ name: 'file_size_bytes', type: 'integer' })
  fileSizeBytes: number;

  // Transcription
  @Column({ name: 'transcription_status', type: 'varchar', length: 20, default: 'pending' })
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'transcription', type: 'text', nullable: true })
  transcription?: string;

  @Column({ name: 'transcription_confidence', type: 'decimal', precision: 3, scale: 2, nullable: true })
  transcriptionConfidence?: number;

  @Column({ name: 'language_detected', type: 'varchar', length: 10, nullable: true })
  languageDetected?: string;

  @Column({ name: 'word_count', type: 'integer', nullable: true })
  wordCount?: number;

  // Metadata
  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title?: string; // Auto-generated or user-provided

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ name: 'session_timestamp', type: 'integer', nullable: true })
  sessionTimestamp?: number; // Seconds into the session when recorded

  @Column({ name: 'is_private', type: 'boolean', default: true })
  isPrivate: boolean;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'transcribed_at', type: 'timestamp', nullable: true })
  transcribedAt?: Date;
}
```

### 4.2 Migration

```sql
-- Migration: 001-create-voice-notes.sql

CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL,
  appointment_id UUID,
  client_id UUID,
  linked_note_id UUID,

  audio_file_id UUID NOT NULL,
  audio_url TEXT,
  duration_seconds INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,

  transcription_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  transcription TEXT,
  transcription_confidence DECIMAL(3,2),
  language_detected VARCHAR(10),
  word_count INTEGER,

  title VARCHAR(255),
  tags JSONB,
  session_timestamp INTEGER,
  is_private BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  transcribed_at TIMESTAMP,

  CONSTRAINT fk_coach FOREIGN KEY (coach_id) REFERENCES coaches(id),
  CONSTRAINT fk_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX idx_voice_notes_coach_id ON voice_notes(coach_id);
CREATE INDEX idx_voice_notes_appointment_id ON voice_notes(appointment_id);
CREATE INDEX idx_voice_notes_client_id ON voice_notes(client_id);
CREATE INDEX idx_voice_notes_created_at ON voice_notes(created_at DESC);
```

---

## 5. API Design

### 5.1 Voice Notes Endpoints

```typescript
// POST /api/voice-notes/upload
// Upload audio file and create voice note record
Request:
  - multipart/form-data
  - file: audio blob (WebM/MP3, max 25MB ≈ 30min)
  - appointmentId?: string
  - clientId?: string
  - sessionTimestamp?: number
  - title?: string
Response:
  {
    id: "uuid",
    transcriptionStatus: "pending",
    audioUrl: "signed-url",
    estimatedTranscriptionTime: 15 // seconds
  }

// GET /api/voice-notes
// List voice notes for coach
Query: ?appointmentId=X&clientId=Y&limit=20&offset=0
Response:
  {
    items: VoiceNote[],
    total: number
  }

// GET /api/voice-notes/:id
// Get single voice note with fresh audio URL
Response: VoiceNote (with signed audioUrl)

// PATCH /api/voice-notes/:id
// Update transcription or metadata (after manual edit)
Request:
  {
    transcription?: string,
    title?: string,
    tags?: string[]
  }

// POST /api/voice-notes/:id/convert-to-note
// Convert voice note to regular session note
Request:
  {
    entityType: "appointment" | "patient",
    entityId: string,
    additionalContent?: string
  }
Response:
  {
    noteId: "uuid",
    voiceNoteId: "uuid"
  }

// DELETE /api/voice-notes/:id
// Delete voice note and associated audio file

// POST /api/voice-notes/:id/retry-transcription
// Retry failed transcription
```

### 5.2 WebSocket Events (Optional - for real-time status)

```typescript
// Client subscribes to: voice-note:{voiceNoteId}
// Server emits:
{
  event: "transcription-progress",
  data: {
    status: "processing" | "completed" | "failed",
    progress: 0.75, // 0-1
    transcription?: string, // partial or final
    error?: string
  }
}
```

---

## 6. Frontend Components

### 6.1 Component Hierarchy

```
src/components/voice-notes/
├── VoiceNoteButton.tsx          # Floating action button (FAB)
├── VoiceNoteModal.tsx           # Recording modal with controls
├── VoiceNoteWaveform.tsx        # Real-time waveform visualization
├── VoiceNoteLivePreview.tsx     # Web Speech API live transcription
├── VoiceNoteEditor.tsx          # Edit transcription before/after saving
├── VoiceNoteList.tsx            # List of voice notes for session
├── VoiceNotePlayer.tsx          # Audio playback with transcript sync
└── hooks/
    ├── useVoiceRecording.ts     # MediaRecorder + waveform hook
    ├── useWebSpeechAPI.ts       # Browser speech recognition hook
    └── useVoiceNoteTranscription.ts  # Polling/WebSocket for status
```

### 6.2 VoiceNoteButton (FAB)

```tsx
// Floating microphone button - appears on session pages
interface VoiceNoteButtonProps {
  appointmentId?: string;
  clientId?: string;
  position?: 'bottom-right' | 'bottom-left';
  onNoteCreated?: (voiceNote: VoiceNote) => void;
}

// Features:
// - Pulsing animation when recording
// - Badge showing pending transcriptions
// - Long-press for quick voice note (no modal)
// - Regular tap opens VoiceNoteModal
```

### 6.3 VoiceNoteModal

```tsx
// Full recording interface
// States: idle → recording → preview → uploading → done

interface VoiceNoteModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId?: string;
  clientId?: string;
  initialTimestamp?: number; // For session-linked notes
}

// UI Layout:
// ┌─────────────────────────────────────┐
// │  ✕                    Voice Note    │
// ├─────────────────────────────────────┤
// │                                     │
// │      ┌───────────────────────┐      │
// │      │    WAVEFORM DISPLAY   │      │
// │      │   ▁▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁  │      │
// │      └───────────────────────┘      │
// │              02:34                  │
// │                                     │
// │  ┌─────────────────────────────┐    │
// │  │ Live preview text appears   │    │
// │  │ here as you speak...        │    │
// │  └─────────────────────────────┘    │
// │                                     │
// │         ┌─────┐  ┌─────┐            │
// │         │ ⏸️  │  │ ⏹️  │            │
// │         └─────┘  └─────┘            │
// │                                     │
// │  [ Cancel ]           [ Save Note ] │
// └─────────────────────────────────────┘
```

### 6.4 Key Hook: useVoiceRecording

```typescript
// frontend/src/components/voice-notes/hooks/useVoiceRecording.ts

interface UseVoiceRecordingOptions {
  onAudioData?: (data: Float32Array) => void; // For waveform
  maxDuration?: number; // Auto-stop after N seconds
  audioConstraints?: MediaTrackConstraints;
}

interface UseVoiceRecordingReturn {
  // State
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // seconds
  audioBlob: Blob | null;
  audioUrl: string | null; // For playback preview
  error: Error | null;

  // Waveform data
  waveformData: Float32Array;
  volumeLevel: number; // 0-1 for VU meter

  // Actions
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob>;
  resetRecording: () => void;
}
```

---

## 7. Backend Services

### 7.1 VoiceNotesService (Notes Service)

```typescript
// services/notes-service/src/voice-notes/voice-notes.service.ts

@Injectable()
export class VoiceNotesService {
  constructor(
    @InjectRepository(VoiceNote)
    private readonly repo: Repository<VoiceNote>,
    private readonly filesClient: ClientProxy, // NATS
    private readonly aiClient: ClientProxy,    // NATS
  ) {}

  async create(coachId: string, file: Express.Multer.File, dto: CreateVoiceNoteDto): Promise<VoiceNote> {
    // 1. Upload audio to MinIO via files-service
    const uploadResult = await this.filesClient.send('files.upload', {
      buffer: file.buffer,
      filename: `voice-notes/${coachId}/${Date.now()}.webm`,
      contentType: file.mimetype,
      metadata: { coachId, type: 'voice-note' }
    }).toPromise();

    // 2. Create voice note record
    const voiceNote = this.repo.create({
      coachId,
      audioFileId: uploadResult.fileId,
      durationSeconds: dto.durationSeconds,
      fileSizeBytes: file.size,
      appointmentId: dto.appointmentId,
      clientId: dto.clientId,
      sessionTimestamp: dto.sessionTimestamp,
      title: dto.title,
      transcriptionStatus: 'pending',
    });

    await this.repo.save(voiceNote);

    // 3. Queue transcription job
    this.aiClient.emit('voice-note.transcribe', {
      voiceNoteId: voiceNote.id,
      audioFileId: uploadResult.fileId,
      language: dto.language || 'auto',
    });

    return voiceNote;
  }

  async updateTranscription(id: string, transcription: string, metadata: TranscriptionMetadata): Promise<VoiceNote> {
    await this.repo.update(id, {
      transcription,
      transcriptionStatus: 'completed',
      transcriptionConfidence: metadata.confidence,
      languageDetected: metadata.language,
      wordCount: transcription.split(/\s+/).length,
      transcribedAt: new Date(),
    });
    return this.repo.findOneBy({ id });
  }

  async convertToNote(id: string, dto: ConvertToNoteDto): Promise<{ noteId: string }> {
    const voiceNote = await this.repo.findOneByOrFail({ id });

    // Create regular note with transcription content
    const note = await this.notesService.create({
      coachId: voiceNote.coachId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      content: `${voiceNote.transcription}\n\n---\n_Transcribed from voice note_`,
      isPrivate: voiceNote.isPrivate,
    });

    // Link voice note to created note
    await this.repo.update(id, { linkedNoteId: note.id });

    return { noteId: note.id };
  }
}
```

### 7.2 Whisper Transcription Service (AI Service)

```typescript
// services/ai-service/src/transcription/whisper-transcription.service.ts

@Injectable()
export class WhisperTranscriptionService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(WhisperTranscriptionService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('FILES_SERVICE') private readonly filesClient: ClientProxy,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async transcribeVoiceNote(audioFileId: string, options?: TranscriptionOptions): Promise<TranscriptionResult> {
    // 1. Download audio from MinIO
    const audioBuffer = await this.filesClient.send('files.download', {
      fileId: audioFileId,
    }).toPromise();

    // 2. Convert to format Whisper expects (if needed)
    // WebM Opus → MP3 conversion using ffmpeg if necessary
    const audioFile = await this.prepareAudioFile(audioBuffer);

    // 3. Call Whisper API
    const response = await this.openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: options?.language !== 'auto' ? options?.language : undefined,
      response_format: 'verbose_json', // Get timestamps and confidence
      timestamp_granularities: ['word', 'segment'],
    });

    this.logger.log(`Transcription completed: ${response.text.length} chars`);

    return {
      text: response.text,
      language: response.language,
      duration: response.duration,
      confidence: this.calculateConfidence(response),
      segments: response.segments?.map(s => ({
        start: s.start,
        end: s.end,
        text: s.text,
      })),
    };
  }

  private async prepareAudioFile(buffer: Buffer): Promise<File> {
    // Implementation using node File API or form-data
    return new File([buffer], 'audio.webm', { type: 'audio/webm' });
  }

  private calculateConfidence(response: any): number {
    // Whisper doesn't provide explicit confidence, estimate from segments
    if (!response.segments?.length) return 0.9;
    const avgLogProb = response.segments.reduce((sum, s) => sum + (s.avg_logprob || 0), 0) / response.segments.length;
    // Convert log probability to 0-1 confidence
    return Math.min(1, Math.max(0, 1 + avgLogProb / 5));
  }
}
```

### 7.3 Event Handler for Transcription Queue

```typescript
// services/ai-service/src/transcription/voice-note-transcription.handler.ts

@Controller()
export class VoiceNoteTranscriptionHandler {
  constructor(
    private readonly whisperService: WhisperTranscriptionService,
    @Inject('NOTES_SERVICE') private readonly notesClient: ClientProxy,
  ) {}

  @EventPattern('voice-note.transcribe')
  async handleTranscription(data: { voiceNoteId: string; audioFileId: string; language?: string }) {
    try {
      // Update status to processing
      await this.notesClient.send('voice-notes.update-status', {
        id: data.voiceNoteId,
        status: 'processing',
      }).toPromise();

      // Perform transcription
      const result = await this.whisperService.transcribeVoiceNote(data.audioFileId, {
        language: data.language,
      });

      // Update with result
      await this.notesClient.send('voice-notes.update-transcription', {
        id: data.voiceNoteId,
        transcription: result.text,
        metadata: {
          confidence: result.confidence,
          language: result.language,
          duration: result.duration,
        },
      }).toPromise();

    } catch (error) {
      this.logger.error(`Transcription failed for ${data.voiceNoteId}:`, error);
      await this.notesClient.send('voice-notes.update-status', {
        id: data.voiceNoteId,
        status: 'failed',
        error: error.message,
      }).toPromise();
    }
  }
}
```

---

## 8. Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2) ✅ COMPLETED

| Task | Estimate | Dependencies | Status |
|------|----------|--------------|--------|
| Create VoiceNote entity and migration | 2h | - | ✅ Done |
| Implement VoiceNotesService CRUD | 4h | Entity | ✅ Done |
| Create VoiceNotesController with upload endpoint | 3h | Service | ✅ Done |
| Implement Whisper transcription service | 4h | OpenAI API key | ✅ Done |
| Set up NATS event handlers for transcription queue | 3h | AI Service | ✅ Done |
| Add voice notes endpoints to API Gateway | 3h | Notes Service | ✅ Done |
| Write unit tests for services | 4h | All services | ✅ Done |

### Phase 2: Frontend Recording (Week 2-3) ✅ COMPLETED

| Task | Estimate | Dependencies | Status |
|------|----------|--------------|--------|
| Create useVoiceRecording hook | 4h | - | ✅ Done |
| Implement VoiceNoteWaveform component | 3h | Hook | ✅ Done |
| Create VoiceNoteModal component | 6h | Hook, Waveform | ✅ Done |
| Add VoiceNoteButton (FAB) to layouts | 2h | Modal | ✅ Done |
| Implement voice notes API client | 2h | - | ✅ Done |
| Create VoiceNoteList component | 3h | API client | ✅ Done |
| Add voice notes section to AppointmentPage | 3h | List component | ✅ Done |

### Phase 3: Transcription & Editing (Week 3-4) ✅ COMPLETED

| Task | Estimate | Dependencies | Status |
|------|----------|--------------|--------|
| Implement Web Speech API live preview | 4h | VoiceNoteModal | ⏭️ Deferred (using server transcription) |
| Create VoiceNoteEditor component | 4h | - | ✅ Done |
| Add transcription status polling/WebSocket | 3h | Backend events | ✅ Done (polling) |
| Implement convert-to-note functionality | 3h | Notes integration | ✅ Done |
| Create VoiceNotePlayer with transcript sync | 4h | - | ✅ Done |
| Add voice notes to session summary | 2h | SessionSummary | ⏭️ Deferred (future enhancement) |

### Phase 4: Polish & Mobile (Week 4-5) ✅ COMPLETED

| Task | Estimate | Dependencies | Status |
|------|----------|--------------|--------|
| Mobile-optimized recording UI | 4h | VoiceNoteModal | ✅ Done |
| Touch-friendly waveform visualization | 3h | VoiceNoteWaveform | ✅ Done |
| Error handling and retry UI | 3h | All components | ✅ Done |
| Offline recording with sync | 6h | IndexedDB | ⏭️ Deferred (future enhancement) |
| Performance optimization | 3h | - | ✅ Done |
| E2E tests for voice notes flow | 4h | All features | ✅ Done |

### Phase 5: Advanced Features (Week 5-6) ✅ COMPLETED

| Task | Estimate | Dependencies | Status |
|------|----------|--------------|--------|
| Voice note search (full-text) | 4h | Transcription | ✅ Done |
| Auto-tagging from transcription (AI) | 4h | AI Service | ✅ Done |
| Batch transcription for older recordings | 3h | Whisper service | ✅ Done |
| Voice note analytics dashboard | 4h | - | ✅ Done |
| Multi-language support | 3h | Whisper | ✅ Done |

---

## 9. Security & Compliance

### 9.1 HIPAA Compliance Checklist

- [x] **Encryption at rest**: MinIO server-side encryption enabled
- [x] **Encryption in transit**: HTTPS/TLS for all API calls
- [ ] **BAA with OpenAI**: Required before production (available)
- [x] **Access controls**: Coach can only access own voice notes
- [x] **Audit logging**: Existing audit service can log voice note access
- [ ] **Data retention policy**: Implement configurable retention period
- [ ] **Right to deletion**: Support GDPR/HIPAA deletion requests

### 9.2 Privacy Considerations

```typescript
// Voice note privacy settings
interface VoiceNotePrivacySettings {
  allowAIProcessing: boolean;     // Can use cloud transcription
  retentionDays: number;          // Auto-delete after N days
  shareWithClient: boolean;       // Client can see transcription
  includeInExport: boolean;       // Include in data export
}
```

---

## 10. Cost Estimation

### 10.1 OpenAI Whisper API Costs

| Usage Scenario | Audio/month | Cost/month |
|----------------|-------------|------------|
| Light (5 coaches, 10 notes/day, 2min avg) | 50 hours | $18 |
| Medium (20 coaches, 15 notes/day, 2min avg) | 300 hours | $108 |
| Heavy (50 coaches, 20 notes/day, 3min avg) | 1,500 hours | $540 |

**Formula**: Hours × 60 minutes × $0.006/minute

### 10.2 Storage Costs (MinIO/S3)

| Usage | Storage/month | Cost/month (S3 Standard) |
|-------|---------------|--------------------------|
| Light | 50 GB | $1.15 |
| Medium | 200 GB | $4.60 |
| Heavy | 1 TB | $23.00 |

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// Voice recording hook tests
describe('useVoiceRecording', () => {
  it('should start recording and capture audio');
  it('should pause and resume recording');
  it('should generate waveform data during recording');
  it('should stop and return audio blob');
  it('should handle microphone permission denied');
  it('should enforce max duration limit');
});

// Transcription service tests
describe('WhisperTranscriptionService', () => {
  it('should transcribe audio file successfully');
  it('should handle language auto-detection');
  it('should return confidence scores');
  it('should handle API errors gracefully');
});
```

### 11.2 E2E Tests

```typescript
// tests/e2e/voice-notes/voice-notes.spec.ts
describe('Voice Notes', () => {
  it('should record voice note during session');
  it('should display live waveform during recording');
  it('should show transcription after processing');
  it('should allow editing transcription');
  it('should convert voice note to session note');
  it('should list voice notes in chronological order');
  it('should play back voice note with synced transcript');
});
```

---

## 12. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Transcription accuracy | >95% | Manual review sample |
| Transcription latency | <30 seconds | API response time |
| Recording success rate | >99% | Error rate tracking |
| Adoption rate | 60% of coaches | Usage analytics |
| Time saved per session | 5-10 minutes | User surveys |
| User satisfaction | >4.5/5 | In-app feedback |

---

## 13. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenAI API outage | High | Low | Queue failed transcriptions, retry with exponential backoff |
| Poor audio quality | Medium | Medium | Show audio level indicator, warn if too quiet |
| Browser compatibility | Medium | Low | Feature detection, graceful degradation |
| Large file uploads | Medium | Medium | Chunked upload, progress indicator |
| HIPAA violation | High | Low | Strict access controls, audit logging, BAA |
| Cost overrun | Medium | Low | Usage monitoring, rate limiting, alerts |

---

## 14. Future Enhancements (Post-MVP)

1. **Real-time streaming transcription** - AssemblyAI/Deepgram for instant results
2. **Speaker diarization** - Separate coach and client voices
3. **Sentiment analysis** - Detect emotional tone in recordings
4. **Action item extraction** - AI-powered task detection from notes
5. **Voice commands** - "Add note about [topic]" during session
6. **Template-based notes** - Voice-fillable note templates
7. **Integration with session recordings** - Link voice notes to specific moments

---

## Appendix A: File Locations Summary

### New Files to Create

```
services/notes-service/src/
├── voice-notes/
│   ├── voice-note.entity.ts
│   ├── voice-notes.module.ts
│   ├── voice-notes.service.ts
│   ├── voice-notes.controller.ts
│   └── dto/
│       ├── create-voice-note.dto.ts
│       ├── update-voice-note.dto.ts
│       └── convert-to-note.dto.ts

services/ai-service/src/
├── transcription/
│   ├── whisper-transcription.service.ts
│   └── voice-note-transcription.handler.ts

frontend/src/
├── components/voice-notes/
│   ├── VoiceNoteButton.tsx
│   ├── VoiceNoteModal.tsx
│   ├── VoiceNoteWaveform.tsx
│   ├── VoiceNoteLivePreview.tsx
│   ├── VoiceNoteEditor.tsx
│   ├── VoiceNoteList.tsx
│   ├── VoiceNotePlayer.tsx
│   └── hooks/
│       ├── useVoiceRecording.ts
│       ├── useWebSpeechAPI.ts
│       └── useVoiceNoteTranscription.ts
├── api/
│   └── voiceNotes.ts
```

### Files to Modify

```
services/notes-service/src/
├── app.module.ts              # Add VoiceNotesModule
├── notes/notes.service.ts     # Add linkage support

services/api-gateway/src/
├── app.module.ts              # Add voice notes routes
├── voice-notes/               # New controller proxying to notes-service

frontend/src/
├── pages/AppointmentPage.tsx  # Add voice notes section
├── layouts/MainLayout.tsx     # Add VoiceNoteButton FAB
├── i18n/translations/         # Add voice note translations
```

---

## Appendix B: References

- [OpenAI Whisper API Documentation](https://platform.openai.com/docs/guides/speech-to-text)
- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder API MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [HIPAA Compliant Transcription](https://www.mentalyc.com/blog/hipaa-compliant-transcription-software)
- [NestJS WebSocket Gateway](https://docs.nestjs.com/websockets/gateways)
- [Audio Visualization with JavaScript](https://www.smashingmagazine.com/2022/03/audio-visualization-javascript-gsap-part1/)
