import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './patient.entity';
import { SessionNote } from './session-note.entity';
import { Invoice } from './invoice.entity';

describe('PatientsService', () => {
  let service: PatientsService;
  const repo = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((d) => Promise.resolve({ id: 1, ...d })),
    update: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: repo },
        { provide: getRepositoryToken(SessionNote), useValue: {} },
        { provide: getRepositoryToken(Invoice), useValue: {} },
      ],
    }).compile();
    service = module.get<PatientsService>(PatientsService);
  });

  it('lists patients', async () => {
    const result = await service.list(1, 1, 10);
    expect(repo.createQueryBuilder).toHaveBeenCalled();
    expect(result).toHaveProperty('items');
  });

  it('gets detail', async () => {
    await service.getDetail(1);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('creates new patient', async () => {
    const dto: any = { firstName: 'a', lastName: 'b', email: 'c@d.com', phone: '1' };
    const result = await service.addOrInvite(dto, 2);
    expect(repo.create).toHaveBeenCalled();
    expect(result.patient).toHaveProperty('id');
    expect(result.existing).toBe(false);
  });

  it('links existing patient', async () => {
    repo.findOne.mockResolvedValueOnce({ id: 1, therapistId: 3 });
    const dto: any = { firstName: 'a', lastName: 'b', email: 'c@d.com', phone: '1' };
    const result = await service.addOrInvite(dto, 2);
    expect(repo.update).toHaveBeenCalled();
    expect(result.existing).toBe(true);
  });
});
