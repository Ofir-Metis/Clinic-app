import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './patient.entity';
import { FileRecord } from './file-record.entity';

describe('PatientsService', () => {
  let service: PatientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(FileRecord), useValue: { find: jest.fn() } },
      ],
    }).compile();
    service = module.get(PatientsService);
  });

  it('calls repo on getDetail', async () => {
    await service.getDetail(1);
    const repo = (service as any).repo;
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
