import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { SessionNote } from './session-note.entity';
import { Invoice } from './invoice.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  const repo = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
    save: jest.fn().mockImplementation((d) => Promise.resolve({ id: 1, ...d })),
    update: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useValue: repo },
        { provide: getRepositoryToken(SessionNote), useValue: {} },
        { provide: getRepositoryToken(Invoice), useValue: {} },
      ],
    }).compile();
    service = module.get<ClientsService>(ClientsService);
  });

  it('lists clients', async () => {
    const result = await service.list(1, 1, 10);
    expect(repo.createQueryBuilder).toHaveBeenCalled();
    expect(result).toHaveProperty('items');
  });

  it('gets detail', async () => {
    await service.getDetail(1);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('creates new client', async () => {
    const dto: any = { firstName: 'a', lastName: 'b', email: 'c@d.com', phone: '1' };
    const result = await service.addOrInvite(dto, 2);
    expect(repo.create).toHaveBeenCalled();
    expect(result.client).toHaveProperty('id');
    expect(result.existing).toBe(false);
  });

  it('links existing client', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 1, therapistId: 3 });
    const dto: any = { firstName: 'a', lastName: 'b', email: 'c@d.com', phone: '1' };
    const result = await service.addOrInvite(dto, 2);
    expect(repo.update).toHaveBeenCalled();
    expect(result.existing).toBe(true);
  });
});
