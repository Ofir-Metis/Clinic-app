import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResetService } from './reset.service';
import { ResetToken } from '../entities/reset-token.entity';
import { User } from '../entities/user.entity';

describe('ResetService', () => {
  let service: ResetService;
  const tokens: ResetToken[] = [];
  const users: User[] = [{
    id: 1,
    email: 'a@test.com',
    password: 'p',
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User];
  const tokenRepo = {
    save: jest.fn(async (t) => {
      t.id = 1;
      tokens.push(t as ResetToken);
      return t;
    }),
    find: jest.fn(() => Promise.resolve(tokens)),
  };
  const userRepo = {
    findOne: jest.fn(({ where: { email, id } }) =>
      Promise.resolve(users.find((u) => (email ? u.email === email : u.id === id))),
    ),
    save: jest.fn(async (u) => u),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetService,
        { provide: getRepositoryToken(ResetToken), useValue: tokenRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();
    service = module.get<ResetService>(ResetService);
  });

  it('creates reset token', async () => {
    const token = await service.requestReset('a@test.com');
    expect(token).toBeDefined();
  });
});
