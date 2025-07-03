import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './patient.entity';

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientsService, { provide: getRepositoryToken(Patient), useValue: repo }],
    }).compile();
    service = module.get<PatientsService>(PatientsService);
  });

  it('lists patients', async () => {
    const result = await service.list(1, 1, 10);
    expect(repo.createQueryBuilder).toHaveBeenCalled();
    expect(result).toHaveProperty('items');
  });
});
