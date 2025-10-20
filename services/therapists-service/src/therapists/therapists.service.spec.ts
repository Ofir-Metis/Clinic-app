import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TherapistsService } from './therapists.service';
import { TherapistProfile } from './therapist-profile.entity';

describe('TherapistsService', () => {
  let service: TherapistsService;
  const repo: Partial<Repository<TherapistProfile>> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findOne: jest.fn(async () => undefined) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: jest.fn((p: any) => p) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    save: jest.fn(async (p: any) => ({ ...(p as any), id: 1 })) as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TherapistsService,
        { provide: getRepositoryToken(TherapistProfile), useValue: repo },
      ],
    }).compile();
    service = module.get<TherapistsService>(TherapistsService);
  });

  it('returns null when profile missing', async () => {
    const res = await service.getProfile('1');
    expect(res).toBeUndefined();
    expect(repo.findOne).toHaveBeenCalled();
  });

  it('saves profile', async () => {
    const profile = await service.updateProfile('1', { name: 'Dr', title: 'T', bio: 'bio' });
    expect(profile).toHaveProperty('id');
    expect(repo.save).toHaveBeenCalled();
  });
});
