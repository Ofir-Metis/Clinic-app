import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(@InjectRepository(Note) private readonly repo: Repository<Note>) {}

  async create(coachId: string, dto: CreateNoteDto): Promise<Note> {
    this.logger.log(`Creating note for coach ${coachId}, entity ${dto.entityId}`);

    const note = this.repo.create({
      coachId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      content: dto.content,
      isPrivate: dto.isPrivate ?? true,
    });

    return this.repo.save(note);
  }

  async findByEntity(
    entityId: string,
    entityType: 'appointment' | 'patient',
    coachId?: string,
  ): Promise<Note[]> {
    this.logger.log(`Finding notes for entity ${entityId} (${entityType})`);

    const where: Record<string, unknown> = { entityId, entityType };

    // If coachId is provided, filter by it (for private notes)
    // Otherwise return only public notes
    if (coachId) {
      where.coachId = coachId;
    } else {
      where.isPrivate = false;
    }

    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Note> {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }
    return note;
  }

  async update(id: string, coachId: string, dto: UpdateNoteDto): Promise<Note> {
    this.logger.log(`Updating note ${id}`);

    const note = await this.findOne(id);

    // Only the author can update their note
    if (note.coachId !== coachId) {
      throw new ForbiddenException('You can only update your own notes');
    }

    if (dto.content !== undefined) {
      note.content = dto.content;
    }
    if (dto.isPrivate !== undefined) {
      note.isPrivate = dto.isPrivate;
    }

    return this.repo.save(note);
  }

  async delete(id: string, coachId: string): Promise<void> {
    this.logger.log(`Deleting note ${id}`);

    const note = await this.findOne(id);

    // Only the author can delete their note
    if (note.coachId !== coachId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    await this.repo.remove(note);
  }

  async recent(coachId: string, limit: number): Promise<Note[]> {
    return this.repo.find({
      where: { coachId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
