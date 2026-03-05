# Phase 2 Development Plan: AI Notes & Voice Recording

## Executive Summary

**Target Features:**
1. AI-assisted note generation from session analysis
2. Voice-to-text note recording during/after sessions

**Estimated Effort:** 4-6 weeks (1-2 developers)
**Dependencies:** Phase 1 complete (recording infrastructure ✅)

---

## Part 1: Feature Analysis

### Feature 1: AI-Assisted Note Generation from Session Analysis

**Goal:** Automatically generate structured coaching notes from session recordings, allowing coaches to review, edit, and save AI-generated insights as their official session notes.

**User Flow:**
```
1. Coach records/uploads session → Recording saved
2. AI processes recording (transcription → analysis)
3. Coach views AI-generated draft notes
4. Coach reviews, edits, and approves notes
5. Notes saved with AI attribution & coach modifications
6. Optional: Share selected portions with client
```

**Value Proposition:**
- Saves 15-30 minutes of note-taking per session
- Consistent, structured documentation
- Never miss key insights or action items
- Searchable session history

### Feature 2: Voice-to-Text Note Recording

**Goal:** Enable coaches to dictate notes before, during, or after sessions using voice, with real-time transcription and AI enhancement.

**User Flow:**
```
1. Coach clicks "Voice Note" button
2. Microphone activates, recording begins
3. Real-time transcription displays as coach speaks
4. Coach stops recording
5. AI enhances and structures the transcription
6. Coach reviews and saves note
```

**Value Proposition:**
- Hands-free note taking during sessions
- Faster than typing
- Capture thoughts immediately after sessions
- Natural language input

---

## Part 2: Technical Architecture

### Existing Infrastructure (Can Leverage)

| Component | Location | Status |
|-----------|----------|--------|
| Whisper Transcription | `ai-service/openai.service.ts` | ✅ Production Ready |
| Session Summary Generation | `ai-service/session-analysis.service.ts` | ✅ Production Ready |
| Notes CRUD API | `notes-service/notes.service.ts` | ✅ Production Ready |
| Recording Service | `appointments-service/recording.service.ts` | ✅ Production Ready |
| Frontend Recording UI | `SessionRecorder.tsx` | ✅ Production Ready |
| Frontend Notes UI | `TherapistNotes.tsx` | ✅ Production Ready |

### New Components Required

#### Backend (NestJS)

1. **AI Notes Generation Service** (`ai-service/src/notes-generation/`)
   - `notes-generation.service.ts` - Orchestrates AI → Notes flow
   - `notes-generation.controller.ts` - REST endpoints
   - `dto/generate-notes.dto.ts` - Request/response DTOs
   - `templates/note-templates.ts` - Session type templates

2. **Voice Note Service** (`notes-service/src/voice-notes/`)
   - `voice-notes.service.ts` - Handle voice recording uploads
   - `voice-notes.controller.ts` - REST endpoints
   - `voice-note.entity.ts` - Store voice recordings with transcriptions

3. **Notes Enhancement Service** (`ai-service/src/notes-enhancement/`)
   - `notes-enhancement.service.ts` - Structure/improve transcribed text
   - Formatting, grammar correction, clinical terminology

#### Frontend (React)

1. **AINotesGenerator Component** (`frontend/src/components/AINotesGenerator.tsx`)
   - Display AI-generated draft notes
   - Section-by-section editing
   - Accept/reject individual suggestions
   - Save as official notes

2. **VoiceNoteRecorder Component** (`frontend/src/components/VoiceNoteRecorder.tsx`)
   - Real-time voice capture
   - Live transcription display
   - Recording controls (start/pause/stop)
   - AI enhancement toggle

3. **EnhancedNotesEditor Component** (`frontend/src/components/EnhancedNotesEditor.tsx`)
   - Rich text editor with AI suggestions
   - Voice input integration
   - Template selection
   - Auto-save functionality

4. **NotesHistoryPanel Component** (`frontend/src/components/NotesHistoryPanel.tsx`)
   - View all notes for a client
   - Filter by session/date
   - Link notes to recordings

---

## Part 3: Detailed Implementation Plan

### Sprint 1: AI Notes Generation Backend (Week 1-2)

#### Task 1.1: Create Notes Generation DTO & Types
**Priority:** P0
**Effort:** 0.5 days
**Files:**
- `services/ai-service/src/notes-generation/dto/generate-notes.dto.ts`
- `services/ai-service/src/notes-generation/dto/ai-generated-note.dto.ts`

```typescript
// generate-notes.dto.ts
export class GenerateNotesRequest {
  appointmentId: string;
  sessionType: SessionType;
  useExistingSummary?: boolean; // Use existing SessionSummary if available
  includeTranscript?: boolean;
  noteTemplate?: 'soap' | 'progress' | 'intake' | 'custom';
  customPrompt?: string;
  previousNotes?: string[]; // Context from previous sessions
}

export interface AIGeneratedNote {
  id: string;
  appointmentId: string;
  generatedAt: Date;
  sections: {
    subjective?: string;      // Client's perspective
    objective?: string;       // Observable behaviors
    assessment?: string;      // Coach's analysis
    plan?: string;            // Next steps
    keyInsights?: string[];   // AI-identified insights
    actionItems?: string[];   // Extracted action items
    quotableQuotes?: string[]; // Notable client statements
    emotionalJourney?: string; // Session emotional arc
    breakthroughs?: string[]; // Breakthrough moments
  };
  metadata: {
    confidenceScore: number;
    tokensUsed: number;
    processingTime: number;
    templateUsed: string;
    aiModel: string;
  };
  status: 'draft' | 'reviewed' | 'approved' | 'rejected';
}
```

#### Task 1.2: Implement Notes Generation Service
**Priority:** P0
**Effort:** 2 days
**Files:**
- `services/ai-service/src/notes-generation/notes-generation.service.ts`
- `services/ai-service/src/notes-generation/templates/note-templates.ts`

**Implementation:**
```typescript
// notes-generation.service.ts
@Injectable()
export class NotesGenerationService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly sessionAnalysisService: SessionAnalysisService,
    @InjectRepository(AIGeneratedNote)
    private readonly noteRepository: Repository<AIGeneratedNote>,
  ) {}

  async generateNotesFromSession(
    request: GenerateNotesRequest
  ): Promise<AIGeneratedNote> {
    // 1. Get existing session summary or generate new one
    let sessionData = await this.getSessionData(request.appointmentId);

    // 2. Select appropriate template
    const template = this.getTemplate(request.noteTemplate, request.sessionType);

    // 3. Build prompt with context
    const prompt = this.buildNotesPrompt(sessionData, template, request);

    // 4. Generate notes via GPT
    const generatedContent = await this.openaiService.generateNotes(prompt);

    // 5. Parse and structure response
    const structuredNote = this.parseGeneratedNotes(generatedContent);

    // 6. Save draft
    return this.saveAsDraft(request.appointmentId, structuredNote);
  }

  async approveAndSaveAsNote(
    generatedNoteId: string,
    coachId: string,
    modifications?: Partial<AIGeneratedNote['sections']>
  ): Promise<Note> {
    // Convert AI-generated note to official Note entity
    // Apply coach modifications
    // Save to notes-service
  }
}
```

**Note Templates (SOAP, Progress, Intake):**
```typescript
// templates/note-templates.ts
export const NOTE_TEMPLATES = {
  soap: {
    name: 'SOAP Note',
    description: 'Subjective, Objective, Assessment, Plan format',
    sections: ['subjective', 'objective', 'assessment', 'plan'],
    prompt: `Generate a SOAP note from this coaching session...`
  },
  progress: {
    name: 'Progress Note',
    description: 'Focus on client progress and goal achievement',
    sections: ['progressSummary', 'goalsReviewed', 'challenges', 'nextSteps'],
    prompt: `Generate a progress note highlighting...`
  },
  intake: {
    name: 'Initial Assessment',
    description: 'Comprehensive first session documentation',
    sections: ['presentingConcerns', 'background', 'goals', 'initialAssessment', 'treatmentPlan'],
    prompt: `Generate an initial assessment note...`
  }
};
```

#### Task 1.3: Create Notes Generation Controller
**Priority:** P0
**Effort:** 1 day
**Files:**
- `services/ai-service/src/notes-generation/notes-generation.controller.ts`
- `services/ai-service/src/notes-generation/notes-generation.module.ts`

**API Endpoints:**
```typescript
@Controller('notes-generation')
@UseGuards(JwtAuthGuard)
export class NotesGenerationController {
  // POST /notes-generation/generate
  // Generate AI notes from session recording/summary
  @Post('generate')
  async generateNotes(@Body() request: GenerateNotesRequest): Promise<AIGeneratedNote>

  // GET /notes-generation/:appointmentId
  // Get generated notes for an appointment
  @Get(':appointmentId')
  async getGeneratedNotes(@Param('appointmentId') id: string): Promise<AIGeneratedNote[]>

  // POST /notes-generation/:id/approve
  // Approve and save as official note
  @Post(':id/approve')
  async approveNote(
    @Param('id') id: string,
    @Body() modifications: Partial<AIGeneratedNote['sections']>
  ): Promise<Note>

  // POST /notes-generation/:id/regenerate
  // Regenerate with different parameters
  @Post(':id/regenerate')
  async regenerateNote(
    @Param('id') id: string,
    @Body() options: RegenerateOptions
  ): Promise<AIGeneratedNote>

  // GET /notes-generation/templates
  // List available note templates
  @Get('templates')
  async getTemplates(): Promise<NoteTemplate[]>
}
```

#### Task 1.4: Add GPT Notes Generation to OpenAI Service
**Priority:** P0
**Effort:** 1 day
**Files:**
- `services/ai-service/src/openai.service.ts` (extend)

**New Method:**
```typescript
async generateNotes(
  transcript: string,
  template: NoteTemplate,
  context: {
    sessionType: string;
    clientGoals?: string[];
    previousNotes?: string;
    customInstructions?: string;
  }
): Promise<GeneratedNotesContent> {
  const systemPrompt = `You are an expert coaching documentation assistant.
Generate professional session notes following the ${template.name} format.
Focus on actionable insights, client progress, and clinical accuracy.
Use professional coaching terminology appropriate for documentation.`;

  const response = await this.openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: this.buildNotesPrompt(transcript, template, context) }
    ],
    temperature: 0.3, // Lower for more consistent output
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

### Sprint 2: Voice-to-Text Backend (Week 2-3)

#### Task 2.1: Create Voice Note Entity & DTOs
**Priority:** P0
**Effort:** 0.5 days
**Files:**
- `services/notes-service/src/voice-notes/voice-note.entity.ts`
- `services/notes-service/src/voice-notes/dto/`

```typescript
// voice-note.entity.ts
@Entity('voice_notes')
export class VoiceNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coach_id' })
  coachId: string;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId?: string;

  @Column({ name: 'client_id', nullable: true })
  clientId?: string;

  @Column({ name: 'audio_file_path' })
  audioFilePath: string;

  @Column({ type: 'integer' })
  duration: number; // seconds

  @Column({ type: 'text', nullable: true })
  rawTranscription?: string;

  @Column({ type: 'text', nullable: true })
  enhancedTranscription?: string;

  @Column({ name: 'converted_note_id', nullable: true })
  convertedNoteId?: string; // If saved as official note

  @Column({
    type: 'enum',
    enum: ['recording', 'transcribing', 'enhancing', 'ready', 'converted', 'failed'],
    default: 'recording'
  })
  status: VoiceNoteStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    mimeType: string;
    fileSize: number;
    transcriptionConfidence: number;
    enhancementApplied: boolean;
    language: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### Task 2.2: Implement Voice Notes Service
**Priority:** P0
**Effort:** 2 days
**Files:**
- `services/notes-service/src/voice-notes/voice-notes.service.ts`

**Implementation:**
```typescript
@Injectable()
export class VoiceNotesService {
  constructor(
    @InjectRepository(VoiceNote)
    private readonly voiceNoteRepository: Repository<VoiceNote>,
    private readonly fileStorageService: FileStorageService,
    @Inject('AI_SERVICE') private readonly aiServiceClient: ClientProxy,
  ) {}

  async createVoiceNote(
    coachId: string,
    audioFile: Express.Multer.File,
    context: { appointmentId?: string; clientId?: string }
  ): Promise<VoiceNote> {
    // 1. Save audio file
    const filePath = await this.fileStorageService.saveAudio(audioFile);

    // 2. Create voice note record
    const voiceNote = await this.voiceNoteRepository.save({
      coachId,
      audioFilePath: filePath,
      duration: this.getAudioDuration(audioFile),
      status: 'recording',
      ...context,
      metadata: {
        mimeType: audioFile.mimetype,
        fileSize: audioFile.size,
      }
    });

    // 3. Trigger async transcription
    this.aiServiceClient.emit('transcribe_voice_note', {
      voiceNoteId: voiceNote.id,
      audioPath: filePath
    });

    return voiceNote;
  }

  async processTranscription(
    voiceNoteId: string,
    transcription: string,
    confidence: number
  ): Promise<VoiceNote> {
    const voiceNote = await this.voiceNoteRepository.findOne({
      where: { id: voiceNoteId }
    });

    voiceNote.rawTranscription = transcription;
    voiceNote.metadata.transcriptionConfidence = confidence;
    voiceNote.status = 'transcribing';

    await this.voiceNoteRepository.save(voiceNote);

    // Trigger enhancement
    this.aiServiceClient.emit('enhance_voice_note', {
      voiceNoteId: voiceNote.id,
      rawText: transcription
    });

    return voiceNote;
  }

  async applyEnhancement(
    voiceNoteId: string,
    enhancedText: string
  ): Promise<VoiceNote> {
    const voiceNote = await this.voiceNoteRepository.findOne({
      where: { id: voiceNoteId }
    });

    voiceNote.enhancedTranscription = enhancedText;
    voiceNote.metadata.enhancementApplied = true;
    voiceNote.status = 'ready';

    return this.voiceNoteRepository.save(voiceNote);
  }

  async convertToNote(
    voiceNoteId: string,
    coachId: string,
    options: { useEnhanced?: boolean; additionalContent?: string }
  ): Promise<Note> {
    const voiceNote = await this.voiceNoteRepository.findOne({
      where: { id: voiceNoteId }
    });

    const content = options.useEnhanced
      ? voiceNote.enhancedTranscription
      : voiceNote.rawTranscription;

    // Create official note via notes service
    const note = await this.notesService.create({
      coachId,
      entityId: voiceNote.appointmentId || voiceNote.clientId,
      entityType: voiceNote.appointmentId ? 'appointment' : 'patient',
      content: options.additionalContent
        ? `${content}\n\n${options.additionalContent}`
        : content,
      isPrivate: true,
      metadata: {
        source: 'voice_note',
        voiceNoteId: voiceNote.id,
        transcriptionConfidence: voiceNote.metadata.transcriptionConfidence
      }
    });

    // Update voice note with converted note ID
    voiceNote.convertedNoteId = note.id;
    voiceNote.status = 'converted';
    await this.voiceNoteRepository.save(voiceNote);

    return note;
  }
}
```

#### Task 2.3: Create Notes Enhancement Service
**Priority:** P1
**Effort:** 1.5 days
**Files:**
- `services/ai-service/src/notes-enhancement/notes-enhancement.service.ts`

**Implementation:**
```typescript
@Injectable()
export class NotesEnhancementService {
  constructor(private readonly openaiService: OpenaiService) {}

  async enhanceVoiceTranscription(
    rawTranscription: string,
    options: {
      fixGrammar?: boolean;
      structureAsParagraphs?: boolean;
      addPunctuation?: boolean;
      professionalizeTerminology?: boolean;
      summarize?: boolean;
    } = {}
  ): Promise<EnhancedTranscription> {
    const prompt = this.buildEnhancementPrompt(rawTranscription, options);

    const response = await this.openaiService.chat({
      model: 'gpt-5-mini', // Use smaller model for speed
      messages: [
        {
          role: 'system',
          content: `You are a professional coaching documentation assistant.
Enhance the following voice transcription to be clear, professional, and well-structured.
Maintain the original meaning while improving readability.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    });

    return {
      enhanced: response.content,
      changes: this.detectChanges(rawTranscription, response.content),
      confidence: this.calculateConfidence(rawTranscription, response.content)
    };
  }

  async structureAsNote(
    transcription: string,
    noteType: 'quick' | 'detailed' | 'session-summary'
  ): Promise<StructuredNote> {
    // Convert unstructured voice input into formatted note
  }
}
```

#### Task 2.4: Create Voice Notes Controller
**Priority:** P0
**Effort:** 1 day
**Files:**
- `services/notes-service/src/voice-notes/voice-notes.controller.ts`
- `services/notes-service/src/voice-notes/voice-notes.module.ts`

**API Endpoints:**
```typescript
@Controller('voice-notes')
@UseGuards(JwtAuthGuard)
export class VoiceNotesController {
  // POST /voice-notes/upload
  // Upload voice recording for transcription
  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadVoiceNote(
    @UploadedFile() file: Express.Multer.File,
    @Body() context: { appointmentId?: string; clientId?: string }
  ): Promise<VoiceNote>

  // GET /voice-notes/:id
  // Get voice note with transcription status
  @Get(':id')
  async getVoiceNote(@Param('id') id: string): Promise<VoiceNote>

  // GET /voice-notes/:id/status
  // Poll for transcription status
  @Get(':id/status')
  async getStatus(@Param('id') id: string): Promise<VoiceNoteStatus>

  // POST /voice-notes/:id/enhance
  // Apply AI enhancement to transcription
  @Post(':id/enhance')
  async enhanceTranscription(
    @Param('id') id: string,
    @Body() options: EnhancementOptions
  ): Promise<VoiceNote>

  // POST /voice-notes/:id/convert
  // Convert voice note to official note
  @Post(':id/convert')
  async convertToNote(
    @Param('id') id: string,
    @Body() options: ConvertOptions
  ): Promise<Note>

  // GET /voice-notes
  // List coach's voice notes
  @Get()
  async listVoiceNotes(
    @Query() filters: VoiceNoteFilters
  ): Promise<VoiceNote[]>

  // DELETE /voice-notes/:id
  // Delete voice note and audio file
  @Delete(':id')
  async deleteVoiceNote(@Param('id') id: string): Promise<void>
}
```

---

### Sprint 3: Frontend - AI Notes Generator (Week 3-4)

#### Task 3.1: Create AI Notes Generator Component
**Priority:** P0
**Effort:** 3 days
**Files:**
- `frontend/src/components/AINotesGenerator.tsx`
- `frontend/src/components/AINotesGenerator.spec.tsx`

**Implementation:**
```typescript
interface AINotesGeneratorProps {
  appointmentId: string;
  sessionType: SessionType;
  onNoteSaved: (noteId: string) => void;
  onClose: () => void;
}

const AINotesGenerator: React.FC<AINotesGeneratorProps> = ({
  appointmentId,
  sessionType,
  onNoteSaved,
  onClose
}) => {
  const [generatedNote, setGeneratedNote] = useState<AIGeneratedNote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('soap');
  const [editedSections, setEditedSections] = useState<Record<string, string>>({});

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const note = await notesApi.generateAINotes({
        appointmentId,
        sessionType,
        noteTemplate: selectedTemplate
      });
      setGeneratedNote(note);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    const savedNote = await notesApi.approveAINote(
      generatedNote.id,
      editedSections
    );
    onNoteSaved(savedNote.id);
  };

  return (
    <Dialog open fullWidth maxWidth="lg">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesomeIcon color="primary" />
          AI Notes Generator
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Template Selector */}
        <TemplateSelector
          value={selectedTemplate}
          onChange={setSelectedTemplate}
          disabled={isGenerating}
        />

        {/* Generation Status */}
        {isGenerating && <GenerationProgress />}

        {/* Generated Notes Display */}
        {generatedNote && (
          <AINoteSections
            note={generatedNote}
            editedSections={editedSections}
            onEdit={(section, content) =>
              setEditedSections(prev => ({ ...prev, [section]: content }))
            }
          />
        )}

        {/* Confidence Indicator */}
        {generatedNote && (
          <ConfidenceIndicator score={generatedNote.metadata.confidenceScore} />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {!generatedNote && (
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isGenerating}
            startIcon={<AutoAwesomeIcon />}
          >
            Generate Notes
          </Button>
        )}
        {generatedNote && (
          <>
            <Button onClick={() => handleGenerate()}>Regenerate</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              startIcon={<CheckIcon />}
            >
              Approve & Save
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
```

#### Task 3.2: Create AI Note Sections Editor
**Priority:** P0
**Effort:** 2 days
**Files:**
- `frontend/src/components/AINoteSections.tsx`

**Features:**
- Accordion-based section display
- Inline editing for each section
- Accept/reject individual AI suggestions
- Diff view showing AI changes
- Copy individual sections

#### Task 3.3: Create Notes API Functions
**Priority:** P0
**Effort:** 1 day
**Files:**
- `frontend/src/api/aiNotes.ts`

```typescript
// AI Notes API
export const generateAINotes = async (
  request: GenerateNotesRequest
): Promise<AIGeneratedNote> => {
  const response = await api.post('/notes-generation/generate', request);
  return response.data;
};

export const getGeneratedNotes = async (
  appointmentId: string
): Promise<AIGeneratedNote[]> => {
  const response = await api.get(`/notes-generation/${appointmentId}`);
  return response.data;
};

export const approveAINote = async (
  noteId: string,
  modifications?: Partial<AIGeneratedNote['sections']>
): Promise<Note> => {
  const response = await api.post(`/notes-generation/${noteId}/approve`, modifications);
  return response.data;
};

export const regenerateNote = async (
  noteId: string,
  options: RegenerateOptions
): Promise<AIGeneratedNote> => {
  const response = await api.post(`/notes-generation/${noteId}/regenerate`, options);
  return response.data;
};

export const getTemplates = async (): Promise<NoteTemplate[]> => {
  const response = await api.get('/notes-generation/templates');
  return response.data;
};
```

---

### Sprint 4: Frontend - Voice Note Recorder (Week 4-5)

#### Task 4.1: Create Voice Note Recorder Component
**Priority:** P0
**Effort:** 3 days
**Files:**
- `frontend/src/components/VoiceNoteRecorder.tsx`
- `frontend/src/components/VoiceNoteRecorder.spec.tsx`

**Implementation:**
```typescript
interface VoiceNoteRecorderProps {
  appointmentId?: string;
  clientId?: string;
  onNoteCreated: (noteId: string) => void;
  onClose: () => void;
  mode: 'quick' | 'detailed' | 'during-session';
}

const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  appointmentId,
  clientId,
  onNoteCreated,
  onClose,
  mode
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState<VoiceNoteStatus>('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await uploadAndTranscribe(audioBlob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // 1 second chunks
    setIsRecording(true);
  };

  const uploadAndTranscribe = async (audioBlob: Blob) => {
    setTranscriptionStatus('uploading');

    const formData = new FormData();
    formData.append('audio', audioBlob);
    if (appointmentId) formData.append('appointmentId', appointmentId);
    if (clientId) formData.append('clientId', clientId);

    const note = await voiceNotesApi.upload(formData);
    setVoiceNote(note);

    // Poll for transcription completion
    pollTranscriptionStatus(note.id);
  };

  const pollTranscriptionStatus = async (noteId: string) => {
    const poll = setInterval(async () => {
      const status = await voiceNotesApi.getStatus(noteId);
      setTranscriptionStatus(status);

      if (status === 'ready' || status === 'failed') {
        clearInterval(poll);
        if (status === 'ready') {
          const updatedNote = await voiceNotesApi.get(noteId);
          setVoiceNote(updatedNote);
        }
      }
    }, 1000);
  };

  return (
    <Dialog open fullWidth maxWidth="md">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <MicIcon color={isRecording ? 'error' : 'primary'} />
          Voice Note
          {isRecording && <RecordingIndicator duration={duration} />}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Recording Controls */}
        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          onStart={startRecording}
          onPause={() => { /* ... */ }}
          onStop={() => { /* ... */ }}
          onResume={() => { /* ... */ }}
        />

        {/* Audio Waveform */}
        {isRecording && (
          <AudioWaveform
            stream={mediaRecorderRef.current?.stream}
            isRecording={isRecording}
          />
        )}

        {/* Transcription Status */}
        {transcriptionStatus !== 'idle' && (
          <TranscriptionProgress status={transcriptionStatus} />
        )}

        {/* Transcription Result */}
        {voiceNote?.enhancedTranscription && (
          <TranscriptionEditor
            rawText={voiceNote.rawTranscription}
            enhancedText={voiceNote.enhancedTranscription}
            onUseRaw={() => { /* ... */ }}
            onUseEnhanced={() => { /* ... */ }}
            onEdit={(text) => { /* ... */ }}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {voiceNote?.status === 'ready' && (
          <Button
            variant="contained"
            onClick={handleSaveAsNote}
            startIcon={<SaveIcon />}
          >
            Save as Note
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
```

#### Task 4.2: Create Transcription Editor Component
**Priority:** P1
**Effort:** 2 days
**Files:**
- `frontend/src/components/TranscriptionEditor.tsx`

**Features:**
- Side-by-side raw vs enhanced view
- Diff highlighting
- Manual editing
- Confidence indicators
- Copy to clipboard

#### Task 4.3: Create Voice Notes API Functions
**Priority:** P0
**Effort:** 0.5 days
**Files:**
- `frontend/src/api/voiceNotes.ts`

```typescript
export const uploadVoiceNote = async (formData: FormData): Promise<VoiceNote> => {
  const response = await api.post('/voice-notes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getVoiceNote = async (id: string): Promise<VoiceNote> => {
  const response = await api.get(`/voice-notes/${id}`);
  return response.data;
};

export const getVoiceNoteStatus = async (id: string): Promise<VoiceNoteStatus> => {
  const response = await api.get(`/voice-notes/${id}/status`);
  return response.data.status;
};

export const enhanceVoiceNote = async (
  id: string,
  options: EnhancementOptions
): Promise<VoiceNote> => {
  const response = await api.post(`/voice-notes/${id}/enhance`, options);
  return response.data;
};

export const convertToNote = async (
  id: string,
  options: ConvertOptions
): Promise<Note> => {
  const response = await api.post(`/voice-notes/${id}/convert`, options);
  return response.data;
};
```

---

### Sprint 5: Integration & Polish (Week 5-6)

#### Task 5.1: Integrate AI Notes into AppointmentPage
**Priority:** P0
**Effort:** 1 day
**Files:**
- `frontend/src/pages/AppointmentPage.tsx` (modify)

**Changes:**
- Add "Generate AI Notes" button next to recording
- Show AI note generation status
- Link generated notes to TherapistNotes component

#### Task 5.2: Integrate Voice Recording into Notes UI
**Priority:** P0
**Effort:** 1 day
**Files:**
- `frontend/src/components/TherapistNotes.tsx` (modify)

**Changes:**
- Add microphone button for voice input
- Support voice-to-text inline
- Quick voice note option

#### Task 5.3: Create NotesHistoryPanel Component
**Priority:** P1
**Effort:** 2 days
**Files:**
- `frontend/src/components/NotesHistoryPanel.tsx`

**Features:**
- Timeline view of all notes for client
- Filter by source (manual, AI, voice)
- Link to related recordings
- Search within notes

#### Task 5.4: Add Real-Time Transcription (Stretch Goal)
**Priority:** P2
**Effort:** 3 days
**Files:**
- `frontend/src/hooks/useRealtimeTranscription.ts`
- `services/ai-service/src/realtime/realtime-transcription.service.ts`

**Note:** This is optional and depends on Whisper API capabilities or alternative real-time STT service.

---

## Part 4: Database Migrations

### Migration 1: AI Generated Notes Table
```sql
CREATE TABLE ai_generated_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  coach_id UUID NOT NULL,
  template_used VARCHAR(50) NOT NULL,
  sections JSONB NOT NULL,
  metadata JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  converted_note_id UUID REFERENCES notes(id)
);

CREATE INDEX idx_ai_notes_appointment ON ai_generated_notes(appointment_id);
CREATE INDEX idx_ai_notes_coach ON ai_generated_notes(coach_id);
CREATE INDEX idx_ai_notes_status ON ai_generated_notes(status);
```

### Migration 2: Voice Notes Table
```sql
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  client_id UUID,
  audio_file_path VARCHAR(500) NOT NULL,
  duration INTEGER NOT NULL,
  raw_transcription TEXT,
  enhanced_transcription TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'recording',
  metadata JSONB,
  converted_note_id UUID REFERENCES notes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_voice_notes_coach ON voice_notes(coach_id);
CREATE INDEX idx_voice_notes_appointment ON voice_notes(appointment_id);
CREATE INDEX idx_voice_notes_status ON voice_notes(status);
```

### Migration 3: Extend Notes Table
```sql
ALTER TABLE notes ADD COLUMN source VARCHAR(20) DEFAULT 'manual';
ALTER TABLE notes ADD COLUMN source_metadata JSONB;

-- source values: 'manual', 'ai_generated', 'voice', 'ai_voice'
```

---

## Part 5: Testing Strategy

### Unit Tests Required

| Component | Test File | Test Count |
|-----------|-----------|------------|
| NotesGenerationService | `notes-generation.service.spec.ts` | 10+ |
| VoiceNotesService | `voice-notes.service.spec.ts` | 12+ |
| NotesEnhancementService | `notes-enhancement.service.spec.ts` | 8+ |
| AINotesGenerator | `AINotesGenerator.spec.tsx` | 10+ |
| VoiceNoteRecorder | `VoiceNoteRecorder.spec.tsx` | 12+ |
| TranscriptionEditor | `TranscriptionEditor.spec.tsx` | 6+ |

### E2E Tests Required

1. **AI Notes Generation Flow**
   - Record session → Generate notes → Review → Approve → Verify saved

2. **Voice Note Flow**
   - Record voice → Transcribe → Enhance → Save as note

3. **Integration Flow**
   - Session with both recording and voice notes → Unified notes view

---

## Part 6: Environment Variables

```bash
# AI Service
OPENAI_API_KEY=sk-...
GPT_MODEL_PRIMARY=gpt-5
GPT_MODEL_SECONDARY=gpt-4-turbo
WHISPER_MODEL=whisper-1

# Voice Notes Storage
VOICE_NOTES_STORAGE_PATH=/uploads/voice-notes
VOICE_NOTES_MAX_DURATION=600  # 10 minutes max

# Feature Flags
ENABLE_AI_NOTES_GENERATION=true
ENABLE_VOICE_NOTES=true
ENABLE_REALTIME_TRANSCRIPTION=false  # Stretch goal
```

---

## Part 7: Priority Matrix

| Priority | Task | Sprint | Effort | Impact |
|----------|------|--------|--------|--------|
| P0 | Notes Generation Service | 1 | 3d | High - Core feature |
| P0 | Notes Generation Controller | 1 | 1d | High - API access |
| P0 | Voice Notes Service | 2 | 2.5d | High - Core feature |
| P0 | Voice Notes Controller | 2 | 1d | High - API access |
| P0 | AINotesGenerator Component | 3 | 3d | High - User-facing |
| P0 | VoiceNoteRecorder Component | 4 | 3d | High - User-facing |
| P1 | Notes Enhancement Service | 2 | 1.5d | Medium - Quality |
| P1 | AI Note Sections Editor | 3 | 2d | Medium - UX |
| P1 | Transcription Editor | 4 | 2d | Medium - UX |
| P1 | NotesHistoryPanel | 5 | 2d | Medium - Organization |
| P2 | Real-time Transcription | 5 | 3d | Low - Nice to have |

---

## Part 8: Success Criteria

### Functional Requirements
- [ ] Coach can generate AI notes from any recorded session
- [ ] AI notes include all standard sections (SOAP, etc.)
- [ ] Coach can edit AI-generated content before saving
- [ ] Coach can record voice notes up to 10 minutes
- [ ] Voice recordings transcribe within 30 seconds
- [ ] AI enhancement improves transcription quality
- [ ] Notes saved with proper attribution (AI/voice/manual)
- [ ] Notes history shows all sources in unified view

### Non-Functional Requirements
- [ ] AI note generation completes in < 60 seconds
- [ ] Voice transcription accuracy > 90%
- [ ] Voice note upload handles files up to 50MB
- [ ] UI remains responsive during processing
- [ ] All features work on mobile devices

---

## Part 9: Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| GPT API rate limits | Medium | High | Implement queue, caching |
| Transcription quality issues | Medium | Medium | Offer enhancement, manual edit |
| Large audio file handling | Low | Medium | Chunked upload, compression |
| Mobile microphone issues | Medium | Medium | Fallback to file upload |
| AI generating inappropriate content | Low | High | Coach review required before save |

---

## Appendix: File Structure

```
services/
├── ai-service/src/
│   ├── notes-generation/
│   │   ├── notes-generation.module.ts
│   │   ├── notes-generation.service.ts
│   │   ├── notes-generation.controller.ts
│   │   ├── notes-generation.service.spec.ts
│   │   ├── dto/
│   │   │   ├── generate-notes.dto.ts
│   │   │   └── ai-generated-note.dto.ts
│   │   ├── entities/
│   │   │   └── ai-generated-note.entity.ts
│   │   └── templates/
│   │       └── note-templates.ts
│   └── notes-enhancement/
│       ├── notes-enhancement.module.ts
│       ├── notes-enhancement.service.ts
│       └── notes-enhancement.service.spec.ts
│
├── notes-service/src/
│   └── voice-notes/
│       ├── voice-notes.module.ts
│       ├── voice-notes.service.ts
│       ├── voice-notes.controller.ts
│       ├── voice-notes.service.spec.ts
│       ├── dto/
│       │   └── voice-note.dto.ts
│       └── entities/
│           └── voice-note.entity.ts
│
frontend/src/
├── components/
│   ├── AINotesGenerator.tsx
│   ├── AINotesGenerator.spec.tsx
│   ├── AINoteSections.tsx
│   ├── VoiceNoteRecorder.tsx
│   ├── VoiceNoteRecorder.spec.tsx
│   ├── TranscriptionEditor.tsx
│   ├── TranscriptionEditor.spec.tsx
│   └── NotesHistoryPanel.tsx
├── api/
│   ├── aiNotes.ts
│   └── voiceNotes.ts
└── hooks/
    ├── useAINotesGeneration.ts
    └── useVoiceRecording.ts
```

---

*Generated: January 31, 2026*
*Estimated Effort: 4-6 weeks (1-2 developers)*
*Phase 2 Target Completion: March 2026*
