import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotesService } from './notes.service';
import { Note } from './note.entity';

describe('NotesService', () => {
  let service: NotesService;
  const repo = { find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotesService, { provide: getRepositoryToken(Note), useValue: repo }],
    }).compile();
    service = module.get<NotesService>(NotesService);
  });

  it('fetches recent notes', async () => {
    repo.find.mockResolvedValue([]);
    const result = await service.recent(1, 3);
    expect(repo.find).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
