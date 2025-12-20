import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { FileRecord } from './file-record.entity';

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(FileRecord), useValue: { find: jest.fn() } },
      ],
    }).compile();
    service = module.get(ClientsService);
  });

  it('calls repo on getDetail', async () => {
    await service.getDetail(1);
    const repo = (service as any).repo;
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
