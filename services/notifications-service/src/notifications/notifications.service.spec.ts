import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends SMS using TWILIO_FROM', async () => {
    process.env.TWILIO_FROM = '+15550001111';
    const create = jest.fn().mockResolvedValue({});
    (service as any).twilio = { messages: { create } };
    await service.sendSms('+15551234567', 'hello');
    expect(create).toHaveBeenCalledWith({
      to: '+15551234567',
      from: '+15550001111',
      body: 'hello',
    });
  });

  it('propagates errors from Twilio', async () => {
    const error = new Error('fail');
    (service as any).twilio = { messages: { create: jest.fn().mockRejectedValue(error) } };
    await expect(service.sendSms('+1', 'msg')).rejects.toThrow('fail');
  });
});
