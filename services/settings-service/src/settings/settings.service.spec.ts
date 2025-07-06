import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import { UserSettings } from './user-settings.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  const repo: Partial<Repository<UserSettings>> = {
    find: jest.fn(() => Promise.resolve([])) as any,
    findOne: jest.fn(() => Promise.resolve(undefined)) as any,
    create: jest.fn((e) => e) as any,
    save: jest.fn((e) => Promise.resolve(e)) as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(UserSettings), useValue: repo },
      ],
    }).compile();
    service = module.get<SettingsService>(SettingsService);
  });

  it('returns settings list', async () => {
    const res = await service.getSettings(1);
    expect(repo.find).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('updates settings', async () => {
    const res = await service.updateSettings(1, [{ key: 'lang', value: 'en' }]);
    expect(repo.save).toHaveBeenCalled();
    expect(res[0]).toHaveProperty('key', 'lang');
  });
});
