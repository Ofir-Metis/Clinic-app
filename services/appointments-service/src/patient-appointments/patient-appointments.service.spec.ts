import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientAppointmentsService } from './patient-appointments.service';
import { Appointment } from './appointment.entity';

describe('PatientAppointmentsService', () => {
  let service: PatientAppointmentsService;
  const repo = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getMany: jest.fn(),
      getOne: jest.fn(),
    })),
    findOne: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientAppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: repo },
      ],
    }).compile();
    service = module.get(PatientAppointmentsService);
  });

  it('lists appointments', async () => {
    await service.list({ patientId: 1 });
    expect(repo.createQueryBuilder).toHaveBeenCalled();
  });
});
