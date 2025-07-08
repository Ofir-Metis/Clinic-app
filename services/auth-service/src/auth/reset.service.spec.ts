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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    phone: 'whatsapp:+15551234567' as any,
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
    // mock transports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).mailer = { sendMail: jest.fn().mockResolvedValue({}) } as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).twilio = { messages: { create: jest.fn().mockResolvedValue({}) } } as any;
  });

  it('creates reset token', async () => {
    process.env.EMAIL_USER = 'noreply@test.com';
    process.env.WHATSAPP_FROM = 'whatsapp:+11111111111';
    const token = await service.requestReset('a@test.com');
    expect(token).toBeDefined();
    const mailer = (service as any).mailer;
    expect(mailer.sendMail).toHaveBeenCalled();
    const twilio = (service as any).twilio;
    expect(twilio.messages.create).toHaveBeenCalled();
  });

  it('skips WhatsApp if phone missing', async () => {
    // remove phone number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (users[0] as any).phone = undefined;
    const twilio = (service as any).twilio;
    await service.requestReset('a@test.com');
    expect(twilio.messages.create).not.toHaveBeenCalled();
  });
});
