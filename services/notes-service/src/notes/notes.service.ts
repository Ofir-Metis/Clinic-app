import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';

@Injectable()
export class NotesService {
  constructor(@InjectRepository(Note) private readonly repo: Repository<Note>) {}

  recent(therapistId: number, limit: number) {
    return this.repo.find({
      where: { therapistId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
