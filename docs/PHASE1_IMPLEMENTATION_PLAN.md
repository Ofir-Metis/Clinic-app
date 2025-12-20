# Phase 1.1: AI-Powered Session Assistant - Implementation Plan

**Status**: Ready to Implement
**Existing Foundation**: ✅ Solid (OpenAI, Whisper, Session Analysis)
**New Components Required**: 6 major features

---

## Current State Assessment

### ✅ What We Already Have

1. **OpenAI Service** (`services/ai-service/src/openai.service.ts`)
   - GPT-5 integration with intelligent model selection
   - Whisper-1 transcription (batch mode)
   - Session summary generation
   - Multimodal analysis capabilities
   - Healthcare-optimized prompts
   - Fallback chain for reliability

2. **Session Analysis Service** (`services/ai-service/src/session-analysis/session-analysis.service.ts`)
   - End-to-end pipeline (audio → transcription → summary)
   - Coach review and approval workflow
   - Client sharing capabilities
   - Processing statistics and quality metrics

3. **Database Entities**
   - `SessionSummary`: Stores AI-generated summaries
   - `Transcription`: Stores transcriptions with metadata

4. **Infrastructure**
   - GraphQL API ready
   - NATS integration for microservices communication
   - TypeORM with PostgreSQL

### ❌ What We Need to Add for Market Leadership

1. **Real-Time Transcription** during sessions (AssemblyAI/Deepgram)
2. **RAG System** with pgvector for client history recall
3. **GPT-5.2 Function Calling** with advanced features
4. **Action Items Entity & Extraction**
5. **Key Moments Tagging System**
6. **Homework Assignment System**

---

## Implementation Roadmap

### Week 1: Infrastructure Setup

#### Task 1.1: Add Required Dependencies
```bash
# Install new packages
cd services/ai-service
yarn add @assemblyai/core pgvector @langchain/community @langchain/openai
yarn add -D @types/pg
```

**package.json additions:**
```json
{
  "dependencies": {
    "@assemblyai/core": "^4.0.0",
    "deepgram-sdk": "^3.0.0", // Alternative to AssemblyAI
    "pgvector": "^0.1.8",
    "@langchain/community": "^0.0.34",
    "@langchain/openai": "^0.0.18",
    "langchain": "^0.1.0"
  }
}
```

#### Task 1.2: PostgreSQL pgvector Setup
```sql
-- Run migration to enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE client_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  session_id UUID REFERENCES appointments(id),
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX client_embeddings_embedding_idx
  ON client_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Standard indexes
CREATE INDEX client_embeddings_client_id_idx ON client_embeddings(client_id);
CREATE INDEX client_embeddings_session_id_idx ON client_embeddings(session_id);
CREATE INDEX client_embeddings_created_at_idx ON client_embeddings(created_at DESC);
```

#### Task 1.3: Create New Database Entities

**File**: `services/ai-service/src/entities/client-embedding.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('client_embeddings')
@Index(['clientId'])
@Index(['sessionId'])
export class ClientEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  clientId: string;

  @Column('uuid', { nullable: true })
  sessionId?: string;

  @Column('text')
  content: string;

  @Column({
    type: 'vector',
    length: 1536
  })
  embedding: number[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**File**: `services/ai-service/src/entities/action-item.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SessionSummary } from './session-summary.entity';

export type ActionItemCategory = 'homework' | 'goal' | 'exercise' | 'follow-up' | 'other';
export type ActionItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type ActionItemPriority = 'high' | 'medium' | 'low';
export type ActionItemAssignee = 'client' | 'coach';

@Entity('action_items')
export class ActionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sessionId: string; // References appointments.id

  @Column('uuid')
  clientId: string;

  @Column('uuid')
  coachId: string;

  @Column('uuid', { nullable: true })
  summaryId?: string;

  @ManyToOne(() => SessionSummary, summary => summary.actionItemsExtracted, { nullable: true })
  @JoinColumn({ name: 'summaryId' })
  summary?: SessionSummary;

  // AI-extracted content
  @Column('text')
  description: string;

  @Column({ type: 'varchar', length: 20 })
  assignedTo: ActionItemAssignee;

  @Column({ type: 'varchar', length: 50 })
  category: ActionItemCategory;

  @Column({ type: 'varchar', length: 20 })
  priority: ActionItemPriority;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  // Tracking
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ActionItemStatus;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column('text', { nullable: true })
  clientNotes?: string;

  @Column('text', { nullable: true })
  coachNotes?: string;

  // Metadata
  @Column('float', { default: 0.8 })
  aiConfidence: number;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**File**: `services/ai-service/src/entities/key-moment.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SessionSummary } from './session-summary.entity';

export type MomentType = 'breakthrough' | 'insight' | 'emotional' | 'decision' | 'commitment' | 'challenge';
export type MomentSignificance = 'high' | 'medium' | 'low';

@Entity('key_moments')
export class KeyMoment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sessionId: string;

  @Column('uuid', { nullable: true })
  summaryId?: string;

  @ManyToOne(() => SessionSummary, summary => summary.keyMoments, { nullable: true })
  @JoinColumn({ name: 'summaryId' })
  summary?: SessionSummary;

  // Timing
  @Column('int')
  timestampSeconds: number; // Seconds into session

  @Column('int', { nullable: true })
  durationSeconds?: number; // Duration of the moment

  // AI-detected information
  @Column({ type: 'varchar', length: 50 })
  type: MomentType;

  @Column('text')
  description: string;

  @Column('text')
  context: string; // Surrounding conversation

  @Column({ type: 'varchar', length: 20 })
  significance: MomentSignificance;

  // Content
  @Column('text')
  transcriptExcerpt: string;

  @Column('int', { nullable: true })
  videoTimestampMs?: number; // For video recordings

  // Coach additions
  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('text', { nullable: true })
  coachNotes?: string;

  // Metadata
  @Column('float', { default: 0.8 })
  aiConfidence: number;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Week 2: Real-Time Transcription

#### Task 2.1: AssemblyAI Service

**File**: `services/ai-service/src/transcription/assemblyai.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AssemblyAI, RealtimeTranscript } from 'assemblyai';

export interface RealtimeTranscriptionOptions {
  sessionId: string;
  sampleRate?: number;
  language?: string;
  speakerLabels?: boolean;
}

export interface TranscriptSegment {
  text: string;
  isFinal: boolean;
  timestamp: number;
  speaker?: string;
}

@Injectable()
export class AssemblyAIService {
  private readonly logger = new Logger(AssemblyAIService.name);
  private readonly client: AssemblyAI;

  constructor() {
    if (!process.env.ASSEMBLYAI_API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY is required for real-time transcription');
    }

    this.client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY
    });
  }

  /**
   * Create real-time transcription session
   */
  async createRealtimeSession(options: RealtimeTranscriptionOptions) {
    this.logger.debug(`Creating real-time transcription for session ${options.sessionId}`);

    const transcriber = this.client.realtime.transcriber({
      sampleRate: options.sampleRate || 16000,
      encoding: 'pcm_s16le',
      // Optimal latency setting for coaching (2000ms)
      wordBoost: [],
      endUtteranceSilenceThreshold: 2000
    });

    // Event handlers
    const transcriptHandler = (transcript: RealtimeTranscript) => {
      if (transcript.message_type === 'PartialTranscript') {
        this.handlePartialTranscript(options.sessionId, transcript);
      } else if (transcript.message_type === 'FinalTranscript') {
        this.handleFinalTranscript(options.sessionId, transcript);
      }
    };

    transcriber.on('transcript', transcriptHandler);
    transcriber.on('error', (error: Error) => {
      this.logger.error(`Real-time transcription error: ${error.message}`);
    });

    await transcriber.connect();

    return {
      transcriber,
      sendAudio: (audioData: Buffer) => transcriber.sendAudio(audioData),
      close: () => transcriber.close()
    };
  }

  private handlePartialTranscript(sessionId: string, transcript: any) {
    // Emit partial transcript via WebSocket to frontend
    this.logger.debug(`Partial: "${transcript.text}"`);
    // TODO: Emit via WebSocket gateway
  }

  private handleFinalTranscript(sessionId: string, transcript: any) {
    // Store final transcript segment
    this.logger.debug(`Final: "${transcript.text}"`);
    // TODO: Store in database and trigger AI analysis
  }

  /**
   * Batch transcription with AssemblyAI (alternative to Whisper)
   */
  async transcribeAudioFile(audioUrl: string): Promise<{
    text: string;
    confidence: number;
    words: Array<{
      text: string;
      start: number;
      end: number;
      confidence: number;
      speaker?: string;
    }>;
  }> {
    const transcript = await this.client.transcripts.transcribe({
      audio_url: audioUrl,
      speaker_labels: true,
      punctuate: true,
      format_text: true
    });

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    return {
      text: transcript.text || '',
      confidence: transcript.confidence || 0,
      words: transcript.words || []
    };
  }
}
```

### Week 3: RAG System Implementation

#### Task 3.1: Vector Store Service

**File**: `services/ai-service/src/rag/vector-store.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientEmbedding } from '../entities/client-embedding.entity';
import { OpenaiService } from '../openai.service';

export interface SearchOptions {
  clientId: string;
  embedding: number[];
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  content: string;
  similarity: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);

  constructor(
    @InjectRepository(ClientEmbedding)
    private readonly embeddingRepository: Repository<ClientEmbedding>,
    private readonly openaiService: OpenaiService
  ) {}

  /**
   * Generate and store embedding for client content
   */
  async storeEmbedding(data: {
    clientId: string;
    sessionId?: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<ClientEmbedding> {
    this.logger.debug(`Generating embedding for client ${data.clientId}`);

    // Generate embedding using OpenAI
    const embedding = await this.generateEmbedding(data.content);

    const embeddingEntity = this.embeddingRepository.create({
      clientId: data.clientId,
      sessionId: data.sessionId,
      content: data.content,
      embedding,
      metadata: data.metadata
    });

    return this.embeddingRepository.save(embeddingEntity);
  }

  /**
   * Search for similar content using vector similarity
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const limit = options.limit || 5;
    const threshold = options.threshold || 0.7;

    // PostgreSQL query with pgvector cosine similarity
    const query = `
      SELECT
        id,
        content,
        session_id as "sessionId",
        metadata,
        1 - (embedding <=> $1::vector) as similarity
      FROM client_embeddings
      WHERE client_id = $2
        AND 1 - (embedding <=> $1::vector) > $3
      ORDER BY embedding <=> $1::vector
      LIMIT $4
    `;

    const results = await this.embeddingRepository.query(query, [
      JSON.stringify(options.embedding),
      options.clientId,
      threshold,
      limit
    ]);

    return results.map((row: any) => ({
      content: row.content,
      similarity: row.similarity,
      sessionId: row.sessionId,
      metadata: row.metadata
    }));
  }

  /**
   * Generate embedding vector for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Use OpenAI text-embedding-3-small model
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Delete embeddings for a client (GDPR compliance)
   */
  async deleteClientEmbeddings(clientId: string): Promise<void> {
    await this.embeddingRepository.delete({ clientId });
    this.logger.log(`Deleted all embeddings for client ${clientId}`);
  }
}
```

#### Task 3.2: RAG Service

**File**: `services/ai-service/src/rag/rag.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { OpenaiService } from '../openai.service';

export interface ClientHistoryContext {
  recentSessions: string[];
  relevantInsights: string[];
  ongoingGoals: string[];
  contextSummary: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly vectorStore: VectorStoreService,
    private readonly openaiService: OpenaiService
  ) {}

  /**
   * Retrieve relevant client history for current session
   */
  async getClientContext(
    clientId: string,
    currentContext: string
  ): Promise<ClientHistoryContext> {
    this.logger.debug(`Retrieving context for client ${clientId}`);

    // Generate embedding for current context
    const embedding = await this.vectorStore['generateEmbedding'](currentContext);

    // Search for similar past content
    const results = await this.vectorStore.search({
      clientId,
      embedding,
      limit: 5,
      threshold: 0.7
    });

    // Extract insights from search results
    const recentSessions = results
      .filter(r => r.sessionId)
      .map(r => r.content)
      .slice(0, 3);

    const relevantInsights = results
      .filter(r => r.metadata?.type === 'insight')
      .map(r => r.content);

    const ongoingGoals = results
      .filter(r => r.metadata?.type === 'goal')
      .map(r => r.content);

    // Generate context summary using AI
    const contextSummary = await this.generateContextSummary({
      recentSessions,
      relevantInsights,
      ongoingGoals
    });

    return {
      recentSessions,
      relevantInsights,
      ongoingGoals,
      contextSummary
    };
  }

  /**
   * Augment session analysis with client history
   */
  async augmentSessionPrompt(
    clientId: string,
    sessionTranscript: string
  ): Promise<string> {
    const context = await this.getClientContext(clientId, sessionTranscript);

    return `
# Client History Context

## Recent Sessions
${context.recentSessions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Key Insights
${context.relevantInsights.map((i, idx) => `- ${i}`).join('\n')}

## Ongoing Goals
${context.ongoingGoals.map((g, idx) => `- ${g}`).join('\n')}

## Context Summary
${context.contextSummary}

---

# Current Session Transcript
${sessionTranscript}
`;
  }

  private async generateContextSummary(data: {
    recentSessions: string[];
    relevantInsights: string[];
    ongoingGoals: string[];
  }): Promise<string> {
    const prompt = `
    Based on this client's history, provide a brief 2-3 sentence summary of their journey:

    Recent Sessions: ${data.recentSessions.join('; ')}
    Key Insights: ${data.relevantInsights.join('; ')}
    Goals: ${data.ongoingGoals.join('; ')}
    `;

    return await this.openaiService['complete'](prompt);
  }

  /**
   * Store session content for future RAG retrieval
   */
  async storeSessionContent(data: {
    clientId: string;
    sessionId: string;
    summary: string;
    insights: string[];
    goals: string[];
  }): Promise<void> {
    // Store session summary
    await this.vectorStore.storeEmbedding({
      clientId: data.clientId,
      sessionId: data.sessionId,
      content: data.summary,
      metadata: { type: 'summary', date: new Date() }
    });

    // Store each insight
    for (const insight of data.insights) {
      await this.vectorStore.storeEmbedding({
        clientId: data.clientId,
        sessionId: data.sessionId,
        content: insight,
        metadata: { type: 'insight' }
      });
    }

    // Store each goal
    for (const goal of data.goals) {
      await this.vectorStore.storeEmbedding({
        clientId: data.clientId,
        sessionId: data.sessionId,
        content: goal,
        metadata: { type: 'goal' }
      });
    }

    this.logger.log(`Stored RAG content for session ${data.sessionId}`);
  }
}
```

### Week 4-5: GPT-5.2 Function Calling Enhancement

**File**: `services/ai-service/src/gpt/function-calling.service.ts`
```typescript
// Implementation for GPT-5.2 function calling with preambles
// Action item extraction
// Key moments detection
// Homework assignment generation
```

*(Detailed implementation to be added)*

---

## Environment Variables Required

```env
# Existing
OPENAI_API_KEY=sk-...
AI_SUMMARY_MODEL=gpt-5
AI_MINI_MODEL=gpt-5-mini

# New additions
ASSEMBLYAI_API_KEY=...
DEEPGRAM_API_KEY=...  # Alternative to AssemblyAI

# RAG Configuration
RAG_EMBEDDING_MODEL=text-embedding-3-small
RAG_SIMILARITY_THRESHOLD=0.7
RAG_MAX_HISTORY_ITEMS=5

# Real-Time Transcription
REALTIME_LATENCY_MS=2000  # Optimal for coaching
REALTIME_ENABLE_PARTIALS=true
REALTIME_SPEAKER_LABELS=true
```

---

## Testing Strategy

### Unit Tests
- [ ] Vector store service: embedding generation and search
- [ ] RAG service: context retrieval and augmentation
- [ ] AssemblyAI service: real-time session management
- [ ] Function calling service: action item extraction

### Integration Tests
- [ ] End-to-end session with real-time transcription
- [ ] RAG context retrieval with actual client data
- [ ] GPT-5.2 function calls with validation
- [ ] Database operations with pgvector

### E2E Tests
- [ ] Complete coaching session flow
- [ ] Real-time transcription accuracy
- [ ] AI summary generation with RAG context
- [ ] Action items and homework extraction

---

## Success Criteria

**Phase 1.1 Complete When:**
- ✅ Real-time transcription working with <2s latency
- ✅ RAG system retrieving relevant client history
- ✅ GPT-5.2 function calling extracting structured data
- ✅ Action items automatically extracted and stored
- ✅ Key moments detected with timestamps
- ✅ Homework assignments documented
- ✅ 95%+ transcription accuracy
- ✅ <2 minutes post-session processing time
- ✅ All tests passing

---

## Next Steps

1. **Start with Infrastructure**: Enable pgvector, add dependencies
2. **Build RAG System**: Most impactful feature for coaches
3. **Add Real-Time Transcription**: Competitive differentiator
4. **Enhance Function Calling**: Better structured outputs
5. **Comprehensive Testing**: Ensure production quality

**Ready to begin implementation?** 🚀
