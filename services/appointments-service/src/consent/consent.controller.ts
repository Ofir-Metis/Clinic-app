/**
 * ConsentController - REST API endpoints for recording consent management
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ConsentService, CreateConsentDto, RevokeConsentDto } from './consent.service';
import { JwtAuthGuard } from '../jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('consent')
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  /**
   * Create a new consent record
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConsent(
    @Body() dto: CreateConsentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Extract IP address and user agent from request
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    return this.consentService.createConsent({
      ...dto,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get consent status for an appointment
   */
  @Get('status/:appointmentId')
  async getConsentStatus(@Param('appointmentId') appointmentId: string) {
    return this.consentService.getConsentStatus(appointmentId);
  }

  /**
   * Get a specific consent by ID
   */
  @Get(':consentId')
  async getConsent(@Param('consentId') consentId: string) {
    return this.consentService.getConsent(consentId);
  }

  /**
   * Get all consents for an appointment
   */
  @Get('appointment/:appointmentId')
  async getAppointmentConsents(@Param('appointmentId') appointmentId: string) {
    return this.consentService.getAppointmentConsents(appointmentId);
  }

  /**
   * Revoke a consent
   */
  @Post(':consentId/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeConsent(
    @Param('consentId') consentId: string,
    @Body() dto: RevokeConsentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.consentService.revokeConsent(consentId, {
      ...dto,
      revokedBy: req.user?.id || 'unknown',
    });
  }

  /**
   * Verify consent is still valid
   */
  @Get(':consentId/verify')
  async verifyConsent(@Param('consentId') consentId: string) {
    return this.consentService.verifyConsent(consentId);
  }

  /**
   * Helper to extract client IP address
   */
  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
