import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { SessionNote } from './session-note.entity';
import { CreatePatientDto } from './dto/create-client.dto';
import { Invoice } from './invoice.entity';
import { validate } from 'class-validator';

/**
 * Enterprise-grade service providing client operations with UUID support
 * Updated for coaching platform terminology and security best practices
 *
 * Note: The clients table is owned by client-relationships-service.
 * Coach-client relationships are managed via client_coach_relationships table.
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
  ) { }

  /**
   * List clients (optionally filtered by search)
   */
  async list(_therapistId: string, page: number = 1, limit: number = 10, search?: string) {
    this.logger.log(`Listing clients`);

    const qb = this.patientRepo.createQueryBuilder('client')
      .where('client.deletedAt IS NULL');

    if (search?.trim()) {
      // Escape LIKE special characters to prevent wildcard injection
      const escapedSearch = search.trim().replace(/[%_\\]/g, '\\$&');
      qb.andWhere(
        '(client.firstName ILIKE :search ESCAPE \'\\\' OR client.lastName ILIKE :search ESCAPE \'\\\' OR client.email ILIKE :search ESCAPE \'\\\')',
        { search: `%${escapedSearch}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('client.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get detailed client information
   */
  async getDetail(id: string): Promise<Client> {
    this.logger.log(`Getting client details: ${id}`);

    const client = await this.patientRepo.findOne({
      where: { id },
    });

    if (!client || client.deletedAt) {
      throw new NotFoundException(`Client not found: ${id}`);
    }

    return client;
  }

  /**
   * Get coaching sessions for a client
   */
  async sessions(patientId: string, page: number = 1, limit: number = 20) {
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
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get client files (placeholder for future file management)
   */
  async files(patientId: string) {
    this.logger.log(`Getting files for client: ${patientId}`);
    // TODO: Integrate with files-service
    return {
      files: [],
      total: 0,
      message: 'File management integration pending',
    };
  }

  /**
   * Get billing information for a client
   */
  async billing(patientId: string) {
    this.logger.log(`Getting billing for client: ${patientId}`);

    const invoices = await this.invoiceRepo.find({
      where: { patientId },
      order: { issuedAt: 'DESC' },
    });

    return {
      invoices,
      totalAmount: invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      paidAmount: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.amount), 0),
      pendingAmount: invoices
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + Number(inv.amount), 0),
    };
  }

  /**
   * Add new client or invite existing client
   */
  async addOrInvite(dto: CreatePatientDto, _therapistId: string) {
    this.logger.log(`Adding/inviting client: ${dto.email}`);

    // Validate DTO
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
    }

    let client = await this.patientRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    const existing = !!client;

    if (!existing) {
      // Create new client
      client = this.patientRepo.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
      });

      await this.patientRepo.save(client);
      this.logger.log(`Created new client: ${client.email}`);
    } else {
      this.logger.log(`Client ${client!.email} already exists`);
    }

    return { client, existing };
  }

  /**
   * Soft delete a client (GDPR compliance)
   */
  async softDelete(patientId: string, _therapistId: string): Promise<void> {
    this.logger.log(`Soft deleting client: ${patientId}`);

    await this.getDetail(patientId); // Verify exists

    await this.patientRepo.update(patientId, {
      deletedAt: new Date(),
      // Clear sensitive data for GDPR compliance
      phone: null as any,
      emergencyContact: null as any,
    });

    this.logger.log(`Client soft deleted: ${patientId}`);
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
