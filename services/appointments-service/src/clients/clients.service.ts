import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { SessionNote } from './session-note.entity';
import { CreatePatientDto } from "./dto/create-client.dto";
import { Invoice } from './invoice.entity';
import { validate } from 'class-validator';

/**
 * Enterprise-grade service providing client operations with UUID support
 * Updated for coaching platform terminology and security best practices
 */
@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectRepository(Client) private readonly patientRepo: Repository<Client>,
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
  async getDetail(id: number): Promise<Client> {
    this.logger.log(`Getting client details: ${id}`);
    
    const client = await this.patientRepo.findOne({ 
      where: { id, isActive: true } 
    });
    
    if (!client) {
      throw new NotFoundException(`Client not found: ${id}`);
    }
    
    return client;
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
    
    let client = await this.patientRepo.findOne({ 
      where: { email: dto.email.toLowerCase() } 
    });
    
    const existing = !!client;
    
    if (!existing) {
      // Create new client
      client = this.patientRepo.create({ 
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
      
      await this.patientRepo.save(client);
      this.logger.log(`Created new client: ${client.email}`);
    } else {
      if (client && client.isActive) {
        await this.linkTherapist(client, therapistId);
        this.logger.log(`Client ${client.email} already exists, linked to therapist`);
      } else if (client && !client.isActive) {
        // Reactivate soft-deleted client
        await this.patientRepo.update(client.id, {
          isActive: true,
          therapistId,
          deletedAt: () => 'NULL'
        });
        client = await this.getDetail(client.id);
        this.logger.log(`Reactivated client: ${client.email}`);
      }
    }
    
    return { client, existing };
  }

  /**
   * Soft delete a client (GDPR compliance)
   */
  async softDelete(patientId: number, therapistId: number): Promise<void> {
    this.logger.log(`Soft deleting client: ${patientId}`);
    
    const client = await this.getDetail(patientId);
    
    if (client.therapistId !== therapistId) {
      throw new Error('Unauthorized: Client does not belong to this therapist');
    }
    
    await this.patientRepo.update(patientId, {
      isActive: false,
      deletedAt: new Date(),
      // Clear sensitive data for GDPR compliance
      phone: () => 'NULL',
      emergencyContact: () => 'NULL',
      preferences: () => 'NULL'
    });
    
    this.logger.log(`Client soft deleted: ${patientId}`);
  }

  /**
   * Link existing client to a therapist/coach
   */
  private async linkTherapist(client: Client, therapistId: number): Promise<void> {
    if (client.therapistId !== therapistId) {
      await this.patientRepo.update(client.id, { 
        therapistId,
        updatedAt: new Date()
      });
      this.logger.log(`Client ${client.id} linked to therapist ${therapistId}`);
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; database: boolean }> {
    try {
      await this.patientRepo.count();
      return { status: 'ok', database: true };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Health check failed', err.stack);
      return { status: 'error', database: false };
    }
  }
}
