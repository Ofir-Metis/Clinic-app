# AI Integration with OpenAI

This module provides comprehensive AI-powered features for coaching session analysis using OpenAI's GPT-4 and Whisper models.

## Features

- **Audio Transcription**: Convert coaching session recordings to text using Whisper
- **Session Summarization**: Generate comprehensive session summaries with key points and insights
- **Coaching Insights**: Analyze multiple sessions to identify patterns and progress
- **Sentiment Analysis**: Understand emotional patterns and client mood throughout sessions
- **Coaching Questions**: Generate thoughtful questions for upcoming sessions
- **Speaker Identification**: Distinguish between coach and client speech
- **Async Processing**: Handle long-running AI operations with job queues

## Setup Instructions

### 1. OpenAI API Configuration

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your environment variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_WHISPER_MODEL=whisper-1
```

### 2. Required Permissions

Ensure users have the appropriate permissions in your JWT payload:
- `ai:transcribe` - Transcribe audio files
- `ai:summarize` - Generate session summaries
- `ai:generate-insights` - Create coaching insights (coach/admin only)
- `ai:analyze-sentiment` - Perform sentiment analysis
- `ai:generate-questions` - Generate coaching questions (coach/admin only)
- `ai:process-recording` - Complete recording processing workflow
- `ai:create-jobs` - Create async processing jobs

## API Endpoints

### Audio Transcription

#### `POST /api/ai/transcribe`
Transcribe audio/video files to text with speaker identification.

**Request:**
```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('language', 'en');
formData.append('speakerLabels', 'true');
formData.append('sessionId', 'session_123');

const response = await fetch('/api/ai/transcribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Response:**
```json
{
  "status": "success",
  "transcription": {
    "id": "transcript_abc123",
    "text": "Coach: How are you feeling today? Client: I'm feeling much better...",
    "duration": 1800,
    "confidence": 0.96,
    "wordCount": 1247,
    "speakerLabels": [
      {
        "speaker": "Speaker 1",
        "role": "coach",
        "segments": [0, 2, 4],
        "totalSpeakTime": 900
      }
    ]
  }
}
```

### Session Summarization

#### `POST /api/ai/summarize`
Generate comprehensive session summaries with insights and recommendations.

**Request:**
```json
{
  "transcript": "Coach: How are you feeling today? Client: Much better...",
  "sessionId": "session_123",
  "sessionContext": {
    "coachName": "Sarah",
    "clientName": "John",
    "duration": 60,
    "sessionGoals": ["Stress management", "Work-life balance"]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "summary": {
    "id": "summary_def456",
    "sessionId": "session_123",
    "keyPoints": [
      "Client reported significant improvement in stress levels",
      "Discussion of new coping strategies for workplace pressure"
    ],
    "actionItems": [
      "Practice daily 10-minute meditation",
      "Implement the \"2-minute rule\" for task management"
    ],
    "insights": [
      "Client shows increased self-awareness",
      "Strong motivation for implementing changes"
    ],
    "mood": "Optimistic",
    "clientEngagement": "high",
    "sessionRating": 8
  }
}
```

### Coaching Insights

#### `POST /api/ai/insights`
Generate comprehensive insights from multiple session summaries (Coach/Admin only).

**Request:**
```json
{
  "clientId": "client_123",
  "sessionSummaries": [
    {
      "sessionId": "session_1",
      "keyPoints": ["Initial stress assessment"],
      "progressNotes": "Client identified main stressors"
    }
  ],
  "clientContext": {
    "goals": ["Reduce stress", "Improve work-life balance"],
    "challenges": ["High workload", "Poor boundaries"],
    "timeframe": "3 months"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "insights": {
    "overallProgress": {
      "direction": "improving",
      "confidence": 0.85,
      "evidence": ["Consistent session attendance", "Implementation of strategies"]
    },
    "patterns": {
      "communication": ["More assertive communication"],
      "emotional": ["Better emotional regulation"],
      "behavioral": ["Increased boundary setting"]
    },
    "recommendations": {
      "shortTerm": ["Continue mindfulness practice"],
      "longTerm": ["Develop leadership skills"],
      "techniques": ["Cognitive reframing", "Time blocking"]
    }
  }
}
```

### Complete Recording Processing

#### `POST /api/ai/process-recording`
Process entire recording: transcription → summary → sentiment analysis → questions.

**Request:**
```javascript
const formData = new FormData();
formData.append('recording', recordingFile);
formData.append('sessionId', 'session_123');
formData.append('generateQuestions', 'true');
formData.append('sessionContext', JSON.stringify({
  coachName: 'Sarah',
  clientName: 'John',
  duration: 60,
  sessionGoals: ['Stress management']
}));
```

**Response:**
```json
{
  "status": "success",
  "sessionId": "session_123",
  "transcription": { "id": "transcript_123", "text": "...", "confidence": 0.96 },
  "summary": { "id": "summary_123", "keyPoints": [...], "actionItems": [...] },
  "sentimentAnalysis": {
    "overallSentiment": "positive",
    "keyEmotions": ["hopeful", "determined"],
    "moodShifts": [...]
  },
  "coachingQuestions": {
    "openingQuestions": ["How did the homework go this week?"],
    "followUpQuestions": ["What challenges did you encounter?"],
    "goalFocusedQuestions": ["How are you feeling about your stress levels now?"]
  }
}
```

### Async Processing Jobs

#### `POST /api/ai/jobs`
Create async processing jobs for long operations.

**Request:**
```json
{
  "type": "transcription",
  "sessionId": "session_123",
  "recordingUrl": "/recordings/session_123.mp3",
  "priority": "high"
}
```

#### `GET /api/ai/jobs/:jobId`
Check job status and get results.

## Usage Examples

### 1. Basic Transcription Workflow

```javascript
// Upload and transcribe a recording
async function transcribeSession(audioFile, sessionId) {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('sessionId', sessionId);
  formData.append('speakerLabels', 'true');
  
  const response = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const result = await response.json();
  return result.transcription;
}
```

### 2. Generate Session Summary

```javascript
async function generateSummary(transcript, sessionId, context) {
  const response = await fetch('/api/ai/summarize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transcript,
      sessionId,
      sessionContext: context
    })
  });
  
  const result = await response.json();
  return result.summary;
}
```

### 3. Complete Processing Pipeline

```javascript
async function processRecordingComplete(recordingFile, sessionId, context) {
  const formData = new FormData();
  formData.append('recording', recordingFile);
  formData.append('sessionId', sessionId);
  formData.append('generateQuestions', 'true');
  formData.append('sessionContext', JSON.stringify(context));
  
  const response = await fetch('/api/ai/process-recording', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  return await response.json();
}
```

### 4. Generate Coaching Insights

```javascript
async function generateInsights(clientId, sessions, clientContext) {
  const response = await fetch('/api/ai/insights', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId,
      sessionSummaries: sessions,
      clientContext
    })
  });
  
  return await response.json();
}
```

## Cost Management

### Token Usage Optimization

1. **Transcript Preprocessing**: Clean transcripts before summarization
2. **Prompt Engineering**: Use efficient prompts to reduce token usage
3. **Batch Processing**: Process multiple items together when possible
4. **Caching**: Cache results for similar requests

### Monitoring Costs

```javascript
// Get AI usage statistics
const stats = await fetch('/api/ai/statistics', {
  headers: { 'Authorization': `Bearer ${token}` }
});

console.log(stats.apiUsage.currentMonth.cost); // Current month cost
```

## Error Handling

### Common Errors

1. **File Too Large**: Max 200MB for processing
2. **Unsupported Format**: Use MP3, WAV, MP4, WebM
3. **API Rate Limits**: Implement retry logic with exponential backoff
4. **Token Limits**: Break large transcripts into chunks

### Retry Strategy

```javascript
async function transcribeWithRetry(audioFile, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await transcribeSession(audioFile);
    } catch (error) {
      if (error.status === 429) { // Rate limit
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

## Security Considerations

### Data Privacy
- All audio files are processed in memory and not stored by OpenAI
- Transcripts are temporarily stored for processing
- Implement data retention policies
- Consider client consent for AI processing

### API Security
- Rotate OpenAI API keys regularly
- Monitor API usage for anomalies
- Implement rate limiting per user
- Log all AI operations for audit

## Performance Optimization

### File Processing
- Compress audio files before upload
- Use appropriate bitrates (128kbps is sufficient for speech)
- Implement client-side file validation

### Response Times
- Use async processing for large files
- Implement progress indicators
- Cache frequent operations
- Use WebSocket updates for long operations

### Monitoring
- Track processing times
- Monitor error rates
- Set up alerts for high costs
- Measure user satisfaction

## Testing

### Unit Tests
```bash
npm test ai
```

### Integration Tests
```bash
npm run test:e2e ai
```

### Load Testing
```bash
# Test with multiple concurrent uploads
npm run test:load ai
```

## Troubleshooting

### Common Issues

1. **Transcription Accuracy Low**
   - Check audio quality
   - Reduce background noise
   - Use appropriate language setting
   - Add context in prompt

2. **High API Costs**
   - Review prompt efficiency
   - Implement caching
   - Use shorter context windows
   - Monitor token usage

3. **Processing Timeouts**
   - Increase timeout limits
   - Use async processing
   - Break into smaller chunks
   - Implement retry logic

### Debug Mode

Enable detailed logging:
```env
LOG_LEVEL=debug
OPENAI_DEBUG=true
```