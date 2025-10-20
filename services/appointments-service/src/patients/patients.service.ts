import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { SessionNote } from './session-note.entity';
import { CreatePatientDto } from "./dto/create-patient.dto";
import { Invoice } from './invoice.entity';
import { validate } from 'class-validator';

/**
 * Enterprise-grade service providing patient operations with UUID support
 * Updated for coaching platform terminology and security best practices
 */
@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(SessionNote)
    private readonly sessionNoteRepo: Repository<SessionNote>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  /**
   * List clients for a specific therapist/coach
   */
  async list(therapistId: number, page: number = 1, limit: number = 10, search?: string) {
    this.logger.log(`Listing clients for therapist: ${therapistId}`);
    
    const qb = this.patientRepo.createQueryBuilder('client')
      .where('client.therapistId = :therapistId', { therapistId })
      .andWhere('client.isActive = :isActive', { isActive: true });
    
    if (search?.trim()) {
      qb.andWhere(
        '(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.email ILIKE :search)',
        { search: `%${search.trim()}%` }
      );
    }
    
    const [items, total] = await qb
      .orderBy('client.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
      
    return { 
      items: items.map(item => ({
        ...item,
        // Remove sensitive information from list view
        gdprConsent: undefined,
        emergencyContact: undefined
      })), 
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get detailed client information
   */
  async getDetail(id: number): Promise<Patient> {
    this.logger.log(`Getting client details: ${id}`);
    
    const patient = await this.patientRepo.findOne({ 
      where: { id, isActive: true } 
    });
    
    if (!patient) {
      throw new NotFoundException(`Client not found: ${id}`);
    }
    
    return patient;
  }

  /**
   * Get coaching sessions for a client
   */
  async sessions(patientId: number, page: number = 1, limit: number = 20) {
    this.logger.log(`Getting sessions for client: ${patientId}`);
    
    const [sessions, total] = await this.sessionNoteRepo.findAndCount({
      where: { patientId },
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get client files (placeholder for future file management)
   */
  async files(patientId: number) {
    this.logger.log(`Getting files for client: ${patientId}`);
    // TODO: Integrate with files-service
    return {
      files: [],
      total: 0,
      message: 'File management integration pending'
    };
  }

  /**
   * Get billing information for a client
   */
  async billing(patientId: number) {
    this.logger.log(`Getting billing for client: ${patientId}`);
    
    const invoices = await this.invoiceRepo.find({ 
      where: { patientId },
      order: { issuedAt: 'DESC' }
    });
    
    return {
      invoices,
      totalAmount: invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      paidAmount: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.amount), 0),
      pendingAmount: invoices
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + Number(inv.amount), 0)
    };
  }

  /**
   * Add new client or invite existing client to therapist/coach
   */
  async addOrInvite(dto: CreatePatientDto, therapistId: number) {
    this.logger.log(`Adding/inviting client: ${dto.email}`);
    
    // Validate DTO
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
    }
    
    let patient = await this.patientRepo.findOne({ 
      where: { email: dto.email.toLowerCase() } 
    });
    
    const existing = !!patient;
    
    if (!existing) {
      // Create new client
      patient = this.patientRepo.create({ 
        ...dto,
        email: dto.email.toLowerCase(),
        therapistId,
        isActive: true,
        preferences: {
          communicationMethod: 'email',
          timezone: 'UTC',
          language: 'en',
          sessionReminders: true,
          marketingConsent: false
        }
      });
      
      await this.patientRepo.save(patient);
      this.logger.log(`Created new client: ${patient.email}`);
    } else {
      if (patient && patient.isActive) {
        await this.linkTherapist(patient, therapistId);
        this.logger.log(`Client ${patient.email} already exists, linked to therapist`);
      } else if (patient && !patient.isActive) {
        // Reactivate soft-deleted client
        await this.patientRepo.update(patient.id, { 
          isActive: true, 
          therapistId,
          deletedAt: null 
        });
        patient = await this.getDetail(patient.id);
        this.logger.log(`Reactivated client: ${patient.email}`);
      }
    }
    
    return { patient, existing };
  }

  /**
   * Soft delete a client (GDPR compliance)
   */
  async softDelete(patientId: number, therapistId: number): Promise<void> {
    this.logger.log(`Soft deleting client: ${patientId}`);
    
    const patient = await this.getDetail(patientId);
    
    if (patient.therapistId !== therapistId) {
      throw new Error('Unauthorized: Client does not belong to this therapist');
    }
    
    await this.patientRepo.update(patientId, {
      isActive: false,
      deletedAt: new Date(),
      // Clear sensitive data for GDPR compliance
      phone: null,
      emergencyContact: null,
      preferences: null
    });
    
    this.logger.log(`Client soft deleted: ${patientId}`);
  }

  /**
   * Link existing client to a therapist/coach
   */
  private async linkTherapist(patient: Patient, therapistId: number): Promise<void> {
    if (patient.therapistId !== therapistId) {
      await this.patientRepo.update(patient.id, { 
        therapistId,
        updatedAt: new Date()
      });
      this.logger.log(`Client ${patient.id} linked to therapist ${therapistId}`);
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; database: boolean }> {
    try {
      await this.patientRepo.count();
      return { status: 'ok', database: true };
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      return { status: 'error', database: false };
    }
  }
}
