import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { randomBytes, randomUUID } from 'crypto';

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappOptIn?: boolean;
  role: string;
  therapistId: number | string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  coachId: string;
  whatsappOptIn?: boolean;
  createdAt: Date;
}

// In-memory storage for development (will be replaced with database)
const patients: Patient[] = [];

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(private readonly httpService: HttpService) {}

  async create(dto: CreatePatientDto) {
    try {
      // Check if patient already exists
      const existing = patients.find(p => p.email.toLowerCase() === dto.email.toLowerCase());
      if (existing) {
        return {
          id: existing.id,
          existing: true,
          message: 'Patient with this email already exists'
        };
      }

      // Try to register user in auth service
      try {
        // Generate a secure random temporary password
        const tempPassword = randomBytes(16).toString('base64url') + '!A1';
        await firstValueFrom(
          this.httpService.post('http://auth-service:3000/auth/register', {
            email: dto.email,
            password: tempPassword,
            name: `${dto.firstName} ${dto.lastName}`,
            roles: [dto.role || 'patient']
          })
        );
        this.logger.log(`User registered in auth service: ${dto.email}`);
      } catch (authError) {
        // If user already exists in auth service, that's okay for our purposes
        if (authError.response?.status === 409 || authError.response?.data?.message?.includes('exists')) {
          this.logger.log(`User already exists in auth service: ${dto.email}`);
        } else {
          this.logger.warn(`Auth service error (continuing anyway): ${authError.message}`);
          // Continue anyway - we'll still create the patient record
        }
      }

      // Create patient record
      const newPatient: Patient = {
        id: randomUUID(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        coachId: String(dto.therapistId),
        whatsappOptIn: dto.whatsappOptIn,
        createdAt: new Date()
      };

      patients.push(newPatient);
      this.logger.log(`Patient created: ${newPatient.id} - ${newPatient.email}`);

      return {
        id: newPatient.id,
        existing: false,
        message: 'Patient created successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to create patient: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to create patient',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findAll(coachId?: string, search?: string) {
    let result = patients;

    if (coachId) {
      result = result.filter(p => p.coachId === coachId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p =>
        p.firstName.toLowerCase().includes(searchLower) ||
        p.lastName.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower)
      );
    }

    return {
      items: result,
      total: result.length
    };
  }

  async findOne(id: string) {
    const patient = patients.find(p => p.id === id);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }
    return patient;
  }
}
