import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TherapistsService } from './therapists.service';
import { TherapistProfile } from './therapist-profile.entity';

describe('TherapistsService', () => {
  let service: TherapistsService;
  const repo: Partial<Repository<TherapistProfile>> = {
    findOne: jest.fn(() => Promise.resolve(undefined)),
    save: jest.fn((p) => Promise.resolve({ ...p, id: 1 })),
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

  it('saves profile', async () => {
    const profile = await service.updateProfile(1, { name: 'Dr', title: 'T', bio: 'bio' });
    expect(profile).toHaveProperty('id');
    expect(repo.save).toHaveBeenCalled();
  });
});
