# Phase 1: AI-Powered Session Assistant - Technical Decisions

**Date**: December 19, 2025
**Status**: Research Complete, Ready for Implementation
**Goal**: Build market-leading AI session assistant for coaching platform

---

## 1. GPT-5 Function Calling Implementation

### Selected Technology
- **Model**: GPT-5.2 (Released December 2025)
- **API**: Responses API with persistent reasoning
- **Accuracy**: 98.7% tool-calling accuracy

### Key Capabilities for Our Platform
1. **Multi-step Workflow Automation**
   - Automated action item extraction from transcripts
   - Structured note generation with key moments tagging
   - Client homework documentation
   - Multi-step administrative task automation

2. **Function Calling Features**
   - Parallel tool calling for efficiency
   - Preambles for transparency (AI explains actions before execution)
   - Long-context support for extended workflows
   - Grammar constraints for structured outputs

3. **Best Practices Implementation**
   - Enable preambles to show coaches what AI is doing
   - Prompt for planning and verification before actions
   - Parallelize tool calls for session note generation
   - Use JSON Schema for structured function definitions

### Implementation Plan
```typescript
// Service structure
services/ai-service/
├── src/
│   ├── gpt/
│   │   ├── function-calling.service.ts    // GPT-5.2 function calling
│   │   ├── session-analyzer.service.ts    // Session analysis
│   │   └── action-extractor.service.ts    // Action item extraction
│   ├── transcription/
│   │   ├── realtime.service.ts            // Real-time transcription
│   │   └── batch.service.ts               // Post-session processing
│   └── rag/
│       ├── vector-store.service.ts        // Vector database management
│       └── embedding.service.ts           // OpenAI embeddings
```

---

## 2. RAG (Retrieval Augmented Generation) for Client History

### Selected Architecture
- **Vector Database**: PostgreSQL with pgvector extension
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **ORM**: TypeORM with vector column support
- **Orchestration**: LangChain for RAG workflow

### Architecture Pattern
```
1. Ingest → Session notes, client documents, progress reports
2. Chunk → Break into manageable pieces (500-1000 tokens)
3. Embed → Generate vectors using OpenAI embeddings
4. Store → PostgreSQL with pgvector (cosine similarity)
5. Retrieve → Fetch relevant context during sessions
6. Augment → Enhance GPT responses with client history
```

### Database Schema
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Client history embeddings table
CREATE TABLE client_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  session_id UUID REFERENCES appointments(id),
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Vector similarity index
  CONSTRAINT client_embeddings_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX ON client_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### RAG Service Implementation
```typescript
// services/ai-service/src/rag/rag.service.ts
export class RagService {
  async searchClientHistory(
    clientId: string,
    query: string,
    limit: number = 5
  ): Promise<ClientHistoryResult[]> {
    // 1. Generate query embedding
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    // 2. Vector similarity search
    const results = await this.vectorStoreService.search({
      clientId,
      embedding: queryEmbedding,
      limit,
      threshold: 0.7 // Cosine similarity threshold
    });

    // 3. Return relevant context
    return results;
  }

  async augmentSessionContext(
    clientId: string,
    currentContext: string
  ): Promise<string> {
    // Retrieve relevant client history
    const history = await this.searchClientHistory(clientId, currentContext);

    // Build augmented prompt
    return this.buildPromptWithHistory(currentContext, history);
  }
}
```

### Reference Implementation
- **GitHub**: `ErfanSeidipoor/nestjs-langgraph-pgvector-rag`
- **Stack**: NestJS + TypeORM + PostgreSQL + pgvector + OpenAI

### Benefits for Coaching Platform
- Coaches have instant access to client history during sessions
- AI remembers past conversations, goals, and progress
- Personalized recommendations based on client's journey
- No manual note review needed before sessions

---

## 3. Real-Time Transcription Strategy

### Dual-Mode Approach

#### Mode 1: Real-Time During Sessions
**Selected Provider**: **AssemblyAI Universal-2** OR **Deepgram Nova-3**

**Rationale**:
- AssemblyAI: 6.68% WER, 30% reduction in hallucinations vs Whisper
- Deepgram Nova-3: 54.3% reduction in WER for streaming (industry-leading)
- Both purpose-built for real-time streaming
- Partial transcripts available in <500ms

**Configuration**:
```typescript
// Real-time transcription settings
{
  provider: 'assemblyai', // or 'deepgram'
  latency: 2000, // 2.0 seconds - optimal for coaching
  partials: true, // Enable partial transcripts
  punctuation: true,
  formatting: true,
  speakerLabels: true, // Identify coach vs client
  languageDetection: 'auto'
}
```

#### Mode 2: Post-Session Batch Processing
**Selected Provider**: **OpenAI Whisper Large-v3**

**Rationale**:
- Best accuracy for clean speech (7.88% WER)
- Excellent for noisy environments
- Cost-effective for batch processing
- Already integrated with OpenAI ecosystem

**Use Cases**:
- Generate final session transcript after call ends
- Create session recordings with accurate captions
- Archive with searchable text

### Latency-Accuracy Trade-offs

| Latency | Use Case | Accuracy | Recommended For |
|---------|----------|----------|-----------------|
| 0.7-1.5s | Ultra-fast | Medium | Voice agents |
| **2.0s** | **Optimal** | **High** | **Coaching (SELECTED)** |
| 4.0s | Maximum accuracy | Very High | Legal/Medical |

### Implementation Architecture
```typescript
// services/ai-service/src/transcription/

// Real-time during session
class RealtimeTranscriptionService {
  private provider: AssemblyAIService | DeepgramService;

  async startStream(sessionId: string): Promise<TranscriptionStream> {
    // Initialize WebSocket connection
    // Set latency to 2000ms
    // Enable partial transcripts
    // Emit transcription events to frontend
  }

  async processPartialTranscript(partial: string): Promise<void> {
    // Display to coach in real-time
    // Update live session notes
  }

  async processFinalTranscript(final: string): Promise<void> {
    // Store in database
    // Trigger AI analysis
  }
}

// Post-session batch processing
class BatchTranscriptionService {
  private whisperClient: OpenAIService;

  async transcribeRecording(audioFile: Buffer): Promise<Transcript> {
    // Use Whisper Large-v3
    // Generate final accurate transcript
    // Store with session record
  }
}
```

### Cost Optimization Strategy
1. **Real-time**: Use AssemblyAI/Deepgram (paid per minute)
2. **Batch**: Use Whisper Large-v3 (cost-effective)
3. **Storage**: Store only final transcripts in database
4. **Caching**: Cache transcription results to avoid re-processing

---

## 4. Session Analysis & Automation Features

### AI-Generated Outputs (GPT-5.2)

#### 1. Session Summary
```typescript
interface SessionSummary {
  sessionId: string;
  clientId: string;
  coachId: string;
  date: Date;
  duration: number;

  // AI-generated content
  summary: string;              // 3-5 paragraph overview
  keyTopics: string[];          // Main discussion topics
  emotionalTone: string;        // Client's emotional state
  progressIndicators: string[]; // Signs of progress/regression

  // Coach can edit
  isReviewed: boolean;
  coachNotes?: string;
}
```

#### 2. Action Items Extraction
```typescript
interface ActionItem {
  id: string;
  sessionId: string;
  clientId: string;

  // AI-extracted
  description: string;          // What needs to be done
  assignedTo: 'client' | 'coach';
  category: 'homework' | 'goal' | 'exercise' | 'follow-up';
  dueDate?: Date;               // If mentioned in session
  priority: 'high' | 'medium' | 'low';

  // Tracking
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: Date;
}
```

#### 3. Automated Session Notes
```typescript
interface AutomatedNotes {
  sessionId: string;

  // Structure
  openingReflection: string;    // How client showed up
  mainDiscussion: {
    topic: string;
    keyPoints: string[];
    clientInsights: string[];
  }[];
  breakthroughs: string[];      // Key moments
  challenges: string[];         // Obstacles discussed
  homework: ActionItem[];       // Assigned exercises
  nextStepsPlanning: string;    // Plans for next session

  // Metadata
  generatedAt: Date;
  reviewedBy?: string;          // Coach ID
  isApproved: boolean;
}
```

#### 4. Client Homework Documentation
```typescript
interface HomeworkAssignment {
  id: string;
  sessionId: string;
  clientId: string;

  // AI-extracted from session
  title: string;
  description: string;
  instructions: string[];
  expectedOutcome: string;
  estimatedTime: number;        // Minutes

  // Resources
  attachments?: File[];
  relatedResources?: Resource[];

  // Tracking
  assignedDate: Date;
  dueDate?: Date;
  status: 'assigned' | 'in_progress' | 'completed' | 'skipped';
  clientNotes?: string;
  completionDate?: Date;
}
```

#### 5. Key Moments Tagging
```typescript
interface KeyMoment {
  id: string;
  sessionId: string;
  timestamp: number;            // Seconds into session

  // AI-detected
  type: 'breakthrough' | 'insight' | 'emotional' | 'decision' | 'commitment';
  description: string;
  context: string;              // Surrounding conversation
  significance: 'high' | 'medium' | 'low';

  // Navigation
  videoTimestamp?: number;      // Jump to moment in recording
  transcriptExcerpt: string;    // Exact words

  // Coach can add tags
  tags?: string[];
  coachNotes?: string;
}
```

### GPT-5.2 Function Definitions

```typescript
// Function calling schemas for session analysis
const sessionAnalysisFunctions = [
  {
    name: 'extract_action_items',
    description: 'Extract action items and homework from session transcript',
    parameters: {
      type: 'object',
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              assignedTo: { type: 'string', enum: ['client', 'coach'] },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              dueDate: { type: 'string', format: 'date' }
            }
          }
        }
      }
    }
  },
  {
    name: 'identify_key_moments',
    description: 'Identify breakthrough moments and significant insights',
    parameters: {
      type: 'object',
      properties: {
        moments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'number' },
              type: { type: 'string' },
              description: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        }
      }
    }
  },
  {
    name: 'generate_session_summary',
    description: 'Create comprehensive session summary with key topics',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyTopics: { type: 'array', items: { type: 'string' } },
        emotionalTone: { type: 'string' },
        progressIndicators: { type: 'array', items: { type: 'string' } }
      }
    }
  }
];
```

---

## 5. Implementation Timeline

### Week 1-2: Infrastructure Setup
- [ ] Set up PostgreSQL with pgvector extension
- [ ] Implement vector embedding service with OpenAI
- [ ] Create RAG service architecture
- [ ] Set up AssemblyAI/Deepgram accounts and SDKs

### Week 3-4: Real-Time Transcription
- [ ] Implement real-time transcription service (AssemblyAI)
- [ ] Build WebSocket connection for live streaming
- [ ] Create partial transcript handling
- [ ] Frontend real-time display component

### Week 4-5: Batch Processing
- [ ] Implement Whisper batch transcription
- [ ] Post-session processing pipeline
- [ ] Recording storage and retrieval

### Week 6-7: GPT-5.2 Function Calling
- [ ] Set up GPT-5.2 with Responses API
- [ ] Implement session analysis functions
- [ ] Action item extraction
- [ ] Key moments detection

### Week 7-8: Automated Note Generation
- [ ] Session summary generation
- [ ] Structured notes creation
- [ ] Homework documentation
- [ ] Coach review and approval workflow

### Week 9-10: RAG Integration
- [ ] Client history search implementation
- [ ] Context augmentation for AI responses
- [ ] Coach dashboard with AI insights
- [ ] Testing and optimization

### Week 11-12: Testing & Refinement
- [ ] End-to-end testing with real sessions
- [ ] Accuracy validation (target >95%)
- [ ] Performance optimization
- [ ] Coach feedback and iteration

---

## 6. Success Metrics

### Technical Metrics
- **Transcription Accuracy**: >95% word accuracy
- **AI Processing Time**: <2 minutes after session ends
- **Real-Time Latency**: <2 seconds
- **Hallucination Rate**: <3%
- **Action Item Extraction Accuracy**: >90%

### Business Metrics
- **Coach Time Saved**: >10 hours per week
- **Note Generation Automation**: >80% automated
- **Coach Approval Rate**: >90% (AI notes approved without major edits)
- **Client Homework Completion**: +50% increase
- **Session Follow-Through**: +40% improvement

### User Experience Metrics
- **Coach Satisfaction**: NPS >70
- **Feature Adoption**: >80% of coaches using AI features
- **Daily Active Usage**: >90% of sessions with AI enabled

---

## 7. Cost Estimates (Monthly)

### AI Services
| Service | Usage | Cost per Unit | Monthly Cost |
|---------|-------|---------------|--------------|
| GPT-5.2 API | 500 sessions × 50k tokens | $0.02/1k tokens | $500 |
| OpenAI Embeddings | 10k embeddings × 1536 dims | $0.0001/1k tokens | $10 |
| AssemblyAI Real-Time | 500 hours transcription | $0.37/hour | $185 |
| Whisper Batch | 500 hours post-processing | $0.006/min | $180 |
| **Total** | | | **$875/month** |

### Scaling (1000 active coaches × 20 sessions/month)
- 20,000 sessions/month
- $35,000/month in AI costs
- $1.75 per session
- Can charge coaches $5-10 per AI-assisted session
- **Gross margin**: 50-70%

---

## 8. Risk Mitigation

### Risk 1: AI Hallucinations
**Mitigation**:
- Use AssemblyAI with 30% lower hallucination rate
- Implement coach review workflow for all AI-generated content
- Add confidence scores to AI outputs
- Allow coaches to flag and correct errors

### Risk 2: Transcription Accuracy in Noisy Environments
**Mitigation**:
- Encourage coaches to use headsets with noise cancellation
- Use Whisper for final batch processing (best in noisy conditions)
- Implement audio quality detection and warnings

### Risk 3: Privacy and Data Security
**Mitigation**:
- End-to-end encryption for all session recordings
- HIPAA-compliant storage (if applicable)
- Client consent for AI processing
- Option to disable AI features per client

### Risk 4: API Cost Overruns
**Mitigation**:
- Implement rate limiting per coach
- Cache AI responses to avoid re-processing
- Use cost-effective Whisper for batch vs real-time
- Monitor usage and set budget alerts

---

## 9. Next Steps

1. **Create Technical Specification Document** for each component
2. **Set up development environment** with AI service infrastructure
3. **Prototype real-time transcription** with AssemblyAI
4. **Build MVP of session analysis** with GPT-5.2
5. **Pilot with 5-10 coaches** for feedback
6. **Iterate based on real-world usage**
7. **Scale to all coaches**

---

## 10. References

### Documentation
- [OpenAI GPT-5.2 Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [AssemblyAI Real-Time Transcription](https://www.assemblyai.com/docs/speech-to-text/real-time)
- [PostgreSQL pgvector Extension](https://github.com/pgvector/pgvector)
- [NestJS RAG Implementation Example](https://github.com/ErfanSeidipoor/nestjs-langgraph-pgvector-rag)

### Benchmarks
- [2025 Speech-to-Text Benchmark](https://www.assemblyai.com/benchmarks)
- [Whisper vs Competitors Edge Benchmark](https://www.ionio.ai/blog/2025-edge-speech-to-text-model-benchmark-whisper-vs-competitors)
- [GPT-5.2 Tool Calling Performance](https://www.klavis.ai/blog/gpt-5-2-released-why-tool-calling-and-agentic-capabilities-matter-for-production-ai-applications)

---

**Document Version**: 1.0
**Last Updated**: December 19, 2025
**Next Review**: After Phase 1 implementation complete
