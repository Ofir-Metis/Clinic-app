import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
// Mock NATS client
jest.mock('@nestjs/microservices', () => {
  const actual = jest.requireActual('@nestjs/microservices');
  return {
    ...actual,
    ClientProxyFactory: {
      create: jest.fn(() => ({
        emit: jest.fn(),
        send: jest.fn(() => ({ subscribe: jest.fn() })),
      })),
    },
  };
});
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { Patient } from '../patients/patient.entity';
import { NotificationsService } from './notifications.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  const repo = { save: jest.fn(), create: jest.fn((d) => d) };
  const patientRepo = { findOne: jest.fn() };
  const notif = { sendAppointmentInvite: jest.fn() } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: NotificationsService, useValue: notif },
        { provide: getRepositoryToken(Appointment), useValue: repo },
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
      ],
    }).compile();
    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('throws if patient missing', async () => {
    patientRepo.findOne.mockResolvedValue(undefined);
    await expect(
      service.create({ patientId: 1, datetime: new Date().toISOString(), serviceType: 'consultation' })
    ).rejects.toThrow('Patient not found');
  });
});
