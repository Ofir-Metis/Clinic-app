import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const users: User[] = [];
  const repo = {
    create: jest.fn((dto) => dto),
    save: jest.fn(async (user) => {
      user.id = 1;
      users.push(user as User);
      return user;
    }),
    findOne: jest.fn(({ where: { email } }) =>
      Promise.resolve(users.find((u) => u.email === email)),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: new JwtService({ secret: 'test' }) },
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a user and returns token', async () => {
    const result = await service.register({ email: 'a@test.com', password: 'pass123' });
    expect(result).toHaveProperty('access_token');
  });

  it('validates user credentials', async () => {
    await service.register({ email: 'b@test.com', password: 'pass123' });
    const user = await service.validateUser('b@test.com', 'pass123');
    expect(user?.email).toBe('b@test.com');
  });
});
