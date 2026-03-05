import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoiceNote, TranscriptionStatus } from './voice-note.entity';
import { CreateVoiceNoteDto } from './dto/create-voice-note.dto';
import { UpdateVoiceNoteDto } from './dto/update-voice-note.dto';
import { ConvertToNoteDto } from './dto/convert-to-note.dto';
import { NotesService } from '../notes/notes.service';

export interface TranscriptionMetadata {
  confidence: number;
  language: string;
  duration: number;
  wordCount?: number;
}

export interface VoiceNoteListOptions {
  coachId: string;
  appointmentId?: string;
  clientId?: string;
  status?: TranscriptionStatus;
  searchQuery?: string;
  language?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface VoiceNoteAnalytics {
  totalVoiceNotes: number;
  totalDurationSeconds: number;
  totalWordCount: number;
  transcriptionsByStatus: Record<TranscriptionStatus, number>;
  languageBreakdown: Record<string, number>;
  averageConfidence: number;
  recentActivity: { date: string; count: number }[];
}

@Injectable()
export class VoiceNotesService {
  private readonly logger = new Logger(VoiceNotesService.name);

  constructor(
    @InjectRepository(VoiceNote)
    private readonly repo: Repository<VoiceNote>,
    private readonly notesService: NotesService,
  ) {}

  async create(coachId: string, dto: CreateVoiceNoteDto): Promise<VoiceNote> {
    this.logger.log(`Creating voice note for coach ${coachId}`);

    const voiceNote = this.repo.create({
      coachId,
      audioFileKey: dto.audioFileKey,
      durationSeconds: dto.durationSeconds,
      fileSizeBytes: dto.fileSizeBytes,
      mimeType: dto.mimeType || 'audio/webm',
      appointmentId: dto.appointmentId,
      clientId: dto.clientId,
      title: dto.title,
      tags: dto.tags,
      sessionTimestamp: dto.sessionTimestamp,
      isPrivate: dto.isPrivate ?? true,
      transcriptionStatus: 'pending',
    });

    const saved = await this.repo.save(voiceNote);
    this.logger.log(`Voice note created with id ${saved.id}`);

    return saved;
  }

  async findByCoach(options: VoiceNoteListOptions): Promise<{ items: VoiceNote[]; total: number }> {
    this.logger.log(`Finding voice notes for coach ${options.coachId}`);

    const queryBuilder = this.repo.createQueryBuilder('vn')
      .where('vn.coach_id = :coachId', { coachId: options.coachId });

    if (options.appointmentId) {
      queryBuilder.andWhere('vn.appointment_id = :appointmentId', {
        appointmentId: options.appointmentId,
      });
    }

    if (options.clientId) {
      queryBuilder.andWhere('vn.client_id = :clientId', { clientId: options.clientId });
    }

    if (options.status) {
      queryBuilder.andWhere('vn.transcription_status = :status', { status: options.status });
    }

    // Full-text search on transcription and title
    if (options.searchQuery) {
      // Escape LIKE special characters to prevent wildcard injection
      const escaped = options.searchQuery.toLowerCase().replace(/[%_\\]/g, '\\$&');
      const searchTerm = `%${escaped}%`;
      queryBuilder.andWhere(
        '(LOWER(vn.transcription) LIKE :searchTerm ESCAPE \'\\\' OR LOWER(vn.title) LIKE :searchTerm ESCAPE \'\\\')',
        { searchTerm },
      );
    }

    // Language filter
    if (options.language) {
      queryBuilder.andWhere('vn.language_detected = :language', { language: options.language });
    }

    // Date range filters
    if (options.dateFrom) {
      queryBuilder.andWhere('vn.created_at >= :dateFrom', { dateFrom: options.dateFrom });
    }

    if (options.dateTo) {
      queryBuilder.andWhere('vn.created_at <= :dateTo', { dateTo: options.dateTo });
    }

    queryBuilder.orderBy('vn.created_at', 'DESC');

    const total = await queryBuilder.getCount();

    if (options.limit) {
      queryBuilder.take(options.limit);
    }

    if (options.offset) {
      queryBuilder.skip(options.offset);
    }

    const items = await queryBuilder.getMany();

    return { items, total };
  }

  async findOne(id: string): Promise<VoiceNote> {
    const voiceNote = await this.repo.findOne({ where: { id } });
    if (!voiceNote) {
      throw new NotFoundException(`Voice note with id ${id} not found`);
    }
    return voiceNote;
  }

  async findOneForCoach(id: string, coachId: string): Promise<VoiceNote> {
    const voiceNote = await this.findOne(id);
    if (voiceNote.coachId !== coachId) {
      throw new ForbiddenException('You can only access your own voice notes');
    }
    return voiceNote;
  }

  async update(id: string, coachId: string, dto: UpdateVoiceNoteDto): Promise<VoiceNote> {
    this.logger.log(`Updating voice note ${id}`);

    const voiceNote = await this.findOneForCoach(id, coachId);

    if (dto.transcription !== undefined) {
      voiceNote.transcription = dto.transcription;
      voiceNote.wordCount = dto.transcription.split(/\s+/).filter(Boolean).length;
    }

    if (dto.title !== undefined) {
      voiceNote.title = dto.title;
    }

    if (dto.tags !== undefined) {
      voiceNote.tags = dto.tags;
    }

    if (dto.isPrivate !== undefined) {
      voiceNote.isPrivate = dto.isPrivate;
    }

    return this.repo.save(voiceNote);
  }

  async delete(id: string, coachId: string): Promise<void> {
    this.logger.log(`Deleting voice note ${id}`);

    const voiceNote = await this.findOneForCoach(id, coachId);
    await this.repo.remove(voiceNote);
  }

  async updateStatus(id: string, status: TranscriptionStatus, error?: string): Promise<VoiceNote> {
    this.logger.log(`Updating voice note ${id} status to ${status}`);

    const voiceNote = await this.findOne(id);
    voiceNote.transcriptionStatus = status;

    if (error) {
      voiceNote.transcriptionError = error;
    } else if (status !== 'failed') {
      // Clear previous error when status changes to a non-error state
      voiceNote.transcriptionError = null as any;
    }

    return this.repo.save(voiceNote);
  }

  async updateTranscription(
    id: string,
    transcription: string,
    metadata: TranscriptionMetadata,
  ): Promise<VoiceNote> {
    this.logger.log(`Updating transcription for voice note ${id}`);

    const voiceNote = await this.findOne(id);

    voiceNote.transcription = transcription;
    voiceNote.transcriptionStatus = 'completed';
    voiceNote.transcriptionConfidence = metadata.confidence;
    voiceNote.languageDetected = metadata.language;
    voiceNote.wordCount = metadata.wordCount || transcription.split(/\s+/).filter(Boolean).length;
    voiceNote.transcribedAt = new Date();
    voiceNote.transcriptionError = null as any;

    // Auto-generate title from first sentence if not set
    if (!voiceNote.title && transcription) {
      const firstSentence = transcription.split(/[.!?]/)[0];
      if (firstSentence) {
        voiceNote.title = firstSentence.substring(0, 100).trim();
        if (firstSentence.length > 100) {
          voiceNote.title += '...';
        }
      }
    }

    return this.repo.save(voiceNote);
  }

  async convertToNote(
    id: string,
    coachId: string,
    dto: ConvertToNoteDto,
  ): Promise<{ noteId: string; voiceNoteId: string }> {
    this.logger.log(`Converting voice note ${id} to regular note`);

    const voiceNote = await this.findOneForCoach(id, coachId);

    if (!voiceNote.transcription) {
      throw new BadRequestException('Cannot convert voice note without transcription');
    }

    // Build note content
    let content = voiceNote.transcription;
    if (dto.additionalContent) {
      content += '\n\n' + dto.additionalContent;
    }
    content += '\n\n---\n_Transcribed from voice note_';

    // Create regular note - map 'client' to 'patient' for DB compatibility
    const dbEntityType: 'appointment' | 'patient' =
      dto.entityType === 'client' ? 'patient' : dto.entityType as 'appointment' | 'patient';

    const note = await this.notesService.create(coachId, {
      entityType: dbEntityType,
      entityId: dto.entityId,
      content,
      isPrivate: voiceNote.isPrivate,
    });

    // Link voice note to created note
    voiceNote.linkedNoteId = note.id;
    await this.repo.save(voiceNote);

    return { noteId: note.id, voiceNoteId: voiceNote.id };
  }

  async retryTranscription(id: string, coachId: string): Promise<VoiceNote> {
    this.logger.log(`Retrying transcription for voice note ${id}`);

    const voiceNote = await this.findOneForCoach(id, coachId);

    if (voiceNote.transcriptionStatus !== 'failed') {
      throw new BadRequestException('Can only retry failed transcriptions');
    }

    voiceNote.transcriptionStatus = 'pending';
    voiceNote.transcriptionError = null as any;

    return this.repo.save(voiceNote);
  }

  async getPendingTranscriptions(limit: number = 10): Promise<VoiceNote[]> {
    return this.repo.find({
      where: { transcriptionStatus: 'pending' },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Get analytics for a coach's voice notes
   */
  async getAnalytics(coachId: string, days: number = 30): Promise<VoiceNoteAnalytics> {
    this.logger.log(`Getting analytics for coach ${coachId}`);

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get voice notes for this coach within the date range
    const voiceNotes = await this.repo.createQueryBuilder('vn')
      .where('vn.coach_id = :coachId', { coachId })
      .andWhere('vn.created_at >= :dateThreshold', { dateThreshold })
      .getMany();

    // Calculate totals
    const totalVoiceNotes = voiceNotes.length;
    const totalDurationSeconds = voiceNotes.reduce((sum, vn) => sum + (vn.durationSeconds || 0), 0);
    const totalWordCount = voiceNotes.reduce((sum, vn) => sum + (vn.wordCount || 0), 0);

    // Status breakdown
    const transcriptionsByStatus: Record<TranscriptionStatus, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
    voiceNotes.forEach(vn => {
      transcriptionsByStatus[vn.transcriptionStatus]++;
    });

    // Language breakdown
    const languageBreakdown: Record<string, number> = {};
    voiceNotes.forEach(vn => {
      if (vn.languageDetected) {
        languageBreakdown[vn.languageDetected] = (languageBreakdown[vn.languageDetected] || 0) + 1;
      }
    });

    // Average confidence
    const completedNotes = voiceNotes.filter(vn => vn.transcriptionConfidence !== null);
    const averageConfidence = completedNotes.length > 0
      ? completedNotes.reduce((sum, vn) => sum + (vn.transcriptionConfidence || 0), 0) / completedNotes.length
      : 0;

    // Recent activity (last N days)
    const recentActivity: { date: string; count: number }[] = [];
    for (let i = 0; i < Math.min(days, 14); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = voiceNotes.filter(vn => {
        const vnDate = new Date(vn.createdAt).toISOString().split('T')[0];
        return vnDate === dateStr;
      }).length;
      recentActivity.push({ date: dateStr, count });
    }
    recentActivity.reverse();

    return {
      totalVoiceNotes,
      totalDurationSeconds,
      totalWordCount,
      transcriptionsByStatus,
      languageBreakdown,
      averageConfidence,
      recentActivity,
    };
  }

  /**
   * Batch transcription - queue multiple voice notes for transcription
   */
  async batchQueueTranscription(coachId: string, voiceNoteIds: string[]): Promise<{ queued: number; failed: string[] }> {
    this.logger.log(`Batch queuing ${voiceNoteIds.length} voice notes for transcription`);

    const failed: string[] = [];
    let queued = 0;

    for (const id of voiceNoteIds) {
      try {
        const voiceNote = await this.findOneForCoach(id, coachId);

        // Only queue if not already completed or processing
        if (voiceNote.transcriptionStatus === 'completed' || voiceNote.transcriptionStatus === 'processing') {
          continue;
        }

        voiceNote.transcriptionStatus = 'pending';
        voiceNote.transcriptionError = null as any;
        await this.repo.save(voiceNote);
        queued++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to queue voice note ${id}: ${errorMessage}`);
        failed.push(id);
      }
    }

    return { queued, failed };
  }

  /**
   * Auto-generate tags from transcription using keyword extraction
   */
  async autoGenerateTags(id: string): Promise<string[]> {
    const voiceNote = await this.findOne(id);

    if (!voiceNote.transcription) {
      return [];
    }

    // Simple keyword extraction - common coaching/therapy terms
    const coachingKeywords = [
      'goal', 'progress', 'challenge', 'achievement', 'mindset', 'habit',
      'emotion', 'feeling', 'relationship', 'family', 'work', 'career',
      'stress', 'anxiety', 'confidence', 'motivation', 'action', 'plan',
      'session', 'homework', 'exercise', 'practice', 'improvement', 'growth',
    ];

    const transcriptionLower = voiceNote.transcription.toLowerCase();
    const foundTags = coachingKeywords.filter(keyword =>
      transcriptionLower.includes(keyword),
    );

    // Update voice note with auto-generated tags
    if (foundTags.length > 0) {
      const existingTags = voiceNote.tags || [];
      const uniqueTags = [...new Set([...existingTags, ...foundTags])];
      voiceNote.tags = uniqueTags.slice(0, 10); // Limit to 10 tags
      await this.repo.save(voiceNote);
    }

    return foundTags;
  }

  /**
   * Get supported languages for transcription
   */
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'he', name: 'Hebrew' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' },
    ];
  }
}
