import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  const repo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((a) => Promise.resolve({ id: 1, ...a })),
    find: jest.fn(() => []),
    findOne: jest.fn(() => null),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: repo },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('creates an appointment', async () => {
    const dto = { therapistId: 1, clientId: 2, startTime: new Date().toISOString(), endTime: new Date().toISOString(), type: 'test', location: 'online' };
    const result = await service.create(dto);
    expect(result).toHaveProperty('id');
  });

  it('gets upcoming appointments', async () => {
    repo.find.mockResolvedValue([]);
    const result = await service.upcoming(5);
    expect(repo.find).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('updates an appointment and emits event', async () => {
    const emit = jest.spyOn<any, any>(service['client'], 'emit').mockImplementation(jest.fn());
    repo.findOne.mockResolvedValue({ id: 1, therapistId: 1 });
    await service.update(1, { status: 'cancelled' }, 1);
    expect(repo.update).toHaveBeenCalledWith(1, expect.any(Object));
    expect(emit).toHaveBeenCalledWith('appointment.cancelled', expect.any(Object));
  });

  it('gets history', async () => {
    repo.find.mockResolvedValueOnce([]);
    const result = await service.history({ therapistId: 1, page: 1, limit: 10 });
    expect(repo.find).toHaveBeenCalledWith({
      where: { therapistId: 1 },
      order: { startTime: 'DESC' },
      skip: 0,
      take: 10,
    });
    expect(result).toEqual([]);
  });
});
