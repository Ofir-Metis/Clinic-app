/**
 * ConsentService - Manages recording consent records with audit trail
 */

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordingConsent, ConsentedFeatures } from './consent.entity';

export interface CreateConsentDto {
  appointmentId: string;
  participantId: string;
  participantRole: 'coach' | 'client';
  participantName: string;
  consentedFeatures: ConsentedFeatures;
  signatureData?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RevokeConsentDto {
  reason: string;
  revokedBy: string;
}

export interface ConsentStatusDto {
  hasConsent: boolean;
  consent?: RecordingConsent;
  canRecord: boolean;
  missingConsents: string[];
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    @InjectRepository(RecordingConsent)
    private readonly consentRepository: Repository<RecordingConsent>,
  ) {}

  /**
   * Create a new consent record with audit trail
   */
  async createConsent(dto: CreateConsentDto): Promise<RecordingConsent> {
    // Check if consent already exists for this appointment/participant
    const existingConsent = await this.consentRepository.findOne({
      where: {
        appointmentId: dto.appointmentId,
        participantId: dto.participantId,
      },
    });

    if (existingConsent && existingConsent.isValid()) {
      throw new ConflictException('Consent already exists for this participant');
    }

    // If previous consent was revoked, create a new one
    const consent = this.consentRepository.create({
      appointmentId: dto.appointmentId,
      participantId: dto.participantId,
      participantRole: dto.participantRole,
      participantName: dto.participantName,
      consentGivenAt: new Date(),
      consentedFeatures: dto.consentedFeatures,
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
      signatureData: dto.signatureData || null,
    });

    const savedConsent = await this.consentRepository.save(consent);

    this.logger.log(`[AUDIT] Consent created: ${savedConsent.id} for appointment ${dto.appointmentId} by ${dto.participantRole} ${dto.participantId}`);
    this.logger.log(`[AUDIT] Consented features: ${JSON.stringify(dto.consentedFeatures)}`);
    this.logger.log(`[AUDIT] IP: ${dto.ipAddress || 'unknown'}, UserAgent: ${dto.userAgent?.substring(0, 50) || 'unknown'}`);

    return savedConsent;
  }

  /**
   * Get consent status for an appointment
   */
  async getConsentStatus(appointmentId: string): Promise<ConsentStatusDto> {
    const consents = await this.consentRepository.find({
      where: { appointmentId },
    });

    const validConsents = consents.filter(c => c.isValid());
    const hasCoachConsent = validConsents.some(c => c.participantRole === 'coach');
    const hasClientConsent = validConsents.some(c => c.participantRole === 'client');

    const missingConsents: string[] = [];
    if (!hasCoachConsent) missingConsents.push('coach');
    if (!hasClientConsent) missingConsents.push('client');

    return {
      hasConsent: validConsents.length > 0,
      consent: validConsents[0], // Return the most recent valid consent
      canRecord: hasCoachConsent && hasClientConsent,
      missingConsents,
    };
  }

  /**
   * Get a specific consent by ID
   */
  async getConsent(consentId: string): Promise<RecordingConsent> {
    const consent = await this.consentRepository.findOne({
      where: { id: consentId },
    });

    if (!consent) {
      throw new NotFoundException(`Consent with ID ${consentId} not found`);
    }

    return consent;
  }

  /**
   * Get all consents for an appointment
   */
  async getAppointmentConsents(appointmentId: string): Promise<RecordingConsent[]> {
    return this.consentRepository.find({
      where: { appointmentId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Revoke a consent
   */
  async revokeConsent(consentId: string, dto: RevokeConsentDto): Promise<RecordingConsent> {
    const consent = await this.getConsent(consentId);

    if (!consent.isValid()) {
      throw new ConflictException('Consent has already been revoked');
    }

    consent.revokedAt = new Date();
    consent.revokeReason = dto.reason;
    consent.revokedBy = dto.revokedBy;

    const savedConsent = await this.consentRepository.save(consent);

    this.logger.log(`[AUDIT] Consent revoked: ${consentId} by ${dto.revokedBy}`);
    this.logger.log(`[AUDIT] Revocation reason: ${dto.reason}`);

    return savedConsent;
  }

  /**
   * Verify consent is still valid
   */
  async verifyConsent(consentId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const consent = await this.getConsent(consentId);

      if (!consent.isValid()) {
        return {
          valid: false,
          reason: consent.revokeReason || 'Consent has been revoked',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: 'Consent not found',
      };
    }
  }

  /**
   * Get consent by participant for an appointment
   */
  async getConsentByParticipant(
    appointmentId: string,
    participantId: string,
  ): Promise<RecordingConsent | null> {
    return this.consentRepository.findOne({
      where: {
        appointmentId,
        participantId,
      },
    });
  }

  /**
   * Check if recording is allowed for an appointment
   */
  async canRecord(appointmentId: string): Promise<boolean> {
    const status = await this.getConsentStatus(appointmentId);
    return status.canRecord;
  }
}
