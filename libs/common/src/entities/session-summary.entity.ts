/**
 * SessionSummary Entity - AI-generated session summaries
 * Stores comprehensive session analysis and insights from coaching sessions
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Recording } from './recording.entity';
import { Transcription } from './transcription.entity';

export interface KeyPoint {
  topic: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  timestamp?: number; // reference to transcription segment
  speakerId?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo: 'coach' | 'client' | 'both';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface SessionInsight {
  type: 'breakthrough' | 'challenge' | 'pattern' | 'goal_progress' | 'emotional_state';
  title: string;
  description: string;
  confidence: number; // 0.0 to 1.0
  recommendations?: string[];
  relatedTopics?: string[];
}

export interface SessionContext {
  coachName?: string;
  clientName?: string;
  duration: number; // in minutes
  sessionGoals?: string[];
  previousSessionSummary?: string;
  clientCurrentGoals?: string[];
  sessionNumber?: number;
  programId?: string;
}

export interface SentimentAnalysis {
  overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentimentScore: number; // -1.0 to 1.0
  emotions: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
    disgust?: number;
    trust?: number;
    anticipation?: number;
  };
  emotionalProgression: {
    timestamp: number;
    sentiment: number;
    dominantEmotion: string;
  }[];
  clientSentiment: number;
  coachSentiment: number;
}

@Entity('session_summaries')
@Index(['recordingId'])
@Index(['sessionId'])
@Index(['createdAt'])
export class SessionSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recording_id', type: 'uuid', nullable: true })
  recordingId?: string;

  @Column({ name: 'transcription_id', type: 'uuid', nullable: true })
  transcriptionId?: string;

  @Column({ name: 'session_id', length: 255 })
  sessionId: string;

  // Summary content
  @Column({ name: 'key_points', type: 'jsonb' })
  keyPoints: KeyPoint[];

  @Column({ name: 'main_topics', type: 'jsonb', nullable: true })
  mainTopics?: string[];

  @Column({ name: 'action_items', type: 'jsonb', nullable: true })
  actionItems?: ActionItem[];

  @Column({ name: 'insights', type: 'jsonb', nullable: true })
  insights?: SessionInsight[];

  // Session context
  @Column({ name: 'session_context', type: 'jsonb', nullable: true })
  sessionContext?: SessionContext;

  @Column({ name: 'next_session_focus', type: 'text', nullable: true })
  nextSessionFocus?: string;

  @Column({ name: 'challenges_identified', type: 'jsonb', nullable: true })
  challengesIdentified?: string[];

  @Column({ name: 'progress_notes', type: 'text', nullable: true })
  progressNotes?: string;

  // AI Analysis
  @Column({ name: 'sentiment_analysis', type: 'jsonb', nullable: true })
  sentimentAnalysis?: SentimentAnalysis;

  @Column({ name: 'engagement_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  engagementScore?: number; // 0.00 to 10.00

  @Column({ name: 'session_quality_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  sessionQualityScore?: number; // 0.00 to 10.00

  // Processing metadata
  @Column({ name: 'model_used', length: 100, default: 'gpt-4' })
  modelUsed: string;

  @Column({ name: 'processing_time', type: 'int', nullable: true })
  processingTime?: number;

  @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 4, nullable: true })
  cost?: number;

  @Column({ name: 'confidence', type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence?: number;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Recording, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recording_id' })
  recording?: Recording;

  @ManyToOne(() => Transcription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transcription_id' })
  transcription?: Transcription;

  // Helper methods
  getHighPriorityActionItems(): ActionItem[] {
    return this.actionItems?.filter(item => item.priority === 'high') || [];
  }

  getOverdueActionItems(): ActionItem[] {
    if (!this.actionItems) return [];
    
    const today = new Date().toISOString().split('T')[0];
    return this.actionItems.filter(item => 
      item.dueDate && item.dueDate < today && item.status !== 'completed'
    );
  }

  getKeyPointsByImportance(importance: 'high' | 'medium' | 'low'): KeyPoint[] {
    return this.keyPoints?.filter(point => point.importance === importance) || [];
  }

  getInsightsByType(type: SessionInsight['type']): SessionInsight[] {
    return this.insights?.filter(insight => insight.type === type) || [];
  }

  isPositiveSession(): boolean {
    if (!this.sentimentAnalysis) return true; // default to positive if no analysis
    return this.sentimentAnalysis.overallSentiment === 'positive' || 
           this.sentimentAnalysis.sentimentScore > 0.2;
  }

  hasBreakthroughs(): boolean {
    return this.getInsightsByType('breakthrough').length > 0;
  }

  getEmotionalHighlights(): string[] {
    if (!this.sentimentAnalysis?.emotionalProgression) return [];

    // Find significant emotional changes
    const highlights: string[] = [];
    const progression = this.sentimentAnalysis.emotionalProgression;

    for (let i = 1; i < progression.length; i++) {
      const current = progression[i];
      const previous = progression[i - 1];
      
      const sentimentChange = Math.abs(current.sentiment - previous.sentiment);
      
      if (sentimentChange > 0.3) { // Significant emotional shift
        const direction = current.sentiment > previous.sentiment ? 'improved' : 'declined';
        const timestamp = this.formatTimestamp(current.timestamp);
        highlights.push(`Emotional state ${direction} significantly at ${timestamp} (${current.dominantEmotion})`);
      }
    }

    return highlights;
  }

  getSessionDurationMinutes(): number {
    return this.sessionContext?.duration || 0;
  }

  getCompletionRate(): number {
    if (!this.actionItems || this.actionItems.length === 0) return 0;
    
    const completedItems = this.actionItems.filter(item => item.status === 'completed').length;
    return Math.round((completedItems / this.actionItems.length) * 100);
  }

  generateExecutiveSummary(): string {
    const duration = this.getSessionDurationMinutes();
    const keyPointsCount = this.keyPoints?.length || 0;
    const actionItemsCount = this.actionItems?.length || 0;
    const sentiment = this.sentimentAnalysis?.overallSentiment || 'neutral';
    const engagement = this.engagementScore || 0;

    let summary = `${duration}-minute session with ${keyPointsCount} key discussion points. `;
    
    if (actionItemsCount > 0) {
      summary += `${actionItemsCount} action items identified. `;
    }

    summary += `Overall sentiment: ${sentiment}. `;
    summary += `Engagement score: ${engagement}/10. `;

    if (this.hasBreakthroughs()) {
      summary += `Session included significant breakthroughs. `;
    }

    if (this.nextSessionFocus) {
      summary += `Next session focus: ${this.nextSessionFocus}`;
    }

    return summary.trim();
  }

  getTopTopics(limit: number = 5): string[] {
    if (!this.mainTopics) return [];
    return this.mainTopics.slice(0, limit);
  }

  getProgressIndicators(): { positive: string[]; negative: string[] } {
    const positive: string[] = [];
    const negative: string[] = [];

    // Analyze key points for progress indicators
    this.keyPoints?.forEach(point => {
      if (point.description.toLowerCase().includes('progress') || 
          point.description.toLowerCase().includes('improvement') ||
          point.description.toLowerCase().includes('success')) {
        positive.push(point.description);
      } else if (point.description.toLowerCase().includes('challenge') ||
                 point.description.toLowerCase().includes('difficulty') ||
                 point.description.toLowerCase().includes('struggle')) {
        negative.push(point.description);
      }
    });

    // Analyze insights
    this.insights?.forEach(insight => {
      if (insight.type === 'breakthrough' || insight.type === 'goal_progress') {
        positive.push(insight.title);
      } else if (insight.type === 'challenge') {
        negative.push(insight.title);
      }
    });

    return { positive, negative };
  }

  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Export functionality
  exportToPlainText(): string {
    let text = `Session Summary - ${this.sessionId}\n`;
    text += `Date: ${this.createdAt.toLocaleDateString()}\n`;
    text += `Duration: ${this.getSessionDurationMinutes()} minutes\n\n`;

    if (this.sessionContext?.coachName && this.sessionContext?.clientName) {
      text += `Coach: ${this.sessionContext.coachName}\n`;
      text += `Client: ${this.sessionContext.clientName}\n\n`;
    }

    text += `EXECUTIVE SUMMARY:\n${this.generateExecutiveSummary()}\n\n`;

    if (this.keyPoints?.length) {
      text += `KEY POINTS:\n`;
      this.keyPoints.forEach((point, index) => {
        text += `${index + 1}. [${point.importance.toUpperCase()}] ${point.topic}: ${point.description}\n`;
      });
      text += `\n`;
    }

    if (this.actionItems?.length) {
      text += `ACTION ITEMS:\n`;
      this.actionItems.forEach((item, index) => {
        text += `${index + 1}. [${item.priority.toUpperCase()}] ${item.description}`;
        if (item.assignedTo !== 'both') {
          text += ` (${item.assignedTo})`;
        }
        if (item.dueDate) {
          text += ` - Due: ${item.dueDate}`;
        }
        text += `\n`;
      });
      text += `\n`;
    }

    if (this.nextSessionFocus) {
      text += `NEXT SESSION FOCUS:\n${this.nextSessionFocus}\n\n`;
    }

    if (this.progressNotes) {
      text += `PROGRESS NOTES:\n${this.progressNotes}\n\n`;
    }

    return text;
  }
}