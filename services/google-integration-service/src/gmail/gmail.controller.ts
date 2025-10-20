/**
 * GmailController - Handle Gmail API endpoints
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
  UnauthorizedException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GmailService, EmailOptions } from './gmail.service';
import { EmailTemplatesService } from './email-templates.service';
import { GoogleOAuthService } from '../auth/google-oauth.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

interface SendEmailRequest {
  googleAccountId: string;
  to: string;
  toName?: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    contentType?: string;
  }>;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  scheduledAt?: string;
}

interface SendAppointmentEmailRequest {
  googleAccountId: string;
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  therapistName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  location?: string;
  meetingUrl?: string;
  notes?: string;
  hoursUntil?: number;
  cancellationReason?: string;
  rescheduleUrl?: string;
}

@ApiTags('Gmail')
@Controller('gmail')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GmailController {
  private readonly logger = new Logger(GmailController.name);

  constructor(
    private readonly gmailService: GmailService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly googleOAuthService: GoogleOAuthService
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a custom email via Gmail' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async sendEmail(
    @Body() emailData: SendEmailRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(emailData.googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      // Convert attachments from base64
      const attachments = emailData.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
      }));

      const emailOptions: EmailOptions = {
        to: emailData.to,
        toName: emailData.toName,
        subject: emailData.subject,
        htmlBody: emailData.htmlBody,
        textBody: emailData.textBody,
        templateId: emailData.templateId,
        templateData: emailData.templateData,
        attachments,
        replyTo: emailData.replyTo,
        cc: emailData.cc,
        bcc: emailData.bcc,
        scheduledAt: emailData.scheduledAt ? new Date(emailData.scheduledAt) : undefined,
      };

      const result = await this.gmailService.sendEmail(
        emailData.googleAccountId,
        emailOptions,
        'custom'
      );

      this.logger.log(`Sent custom email to ${emailData.to} from account ${account.email}`);

      return {
        success: result.success,
        message: result.success ? 'Email sent successfully' : 'Failed to send email',
        messageId: result.messageId,
        threadId: result.threadId,
        error: result.error,
      };

    } catch (error) {
      this.logger.error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to send email');
    }
  }

  @Post('send-appointment-confirmation')
  @ApiOperation({ summary: 'Send appointment confirmation email' })
  @ApiResponse({ status: 200, description: 'Confirmation email sent successfully' })
  async sendAppointmentConfirmation(
    @Body() appointmentData: SendAppointmentEmailRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(appointmentData.googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const result = await this.gmailService.sendAppointmentConfirmation(
        appointmentData.googleAccountId,
        {
          id: appointmentData.appointmentId,
          patientEmail: appointmentData.patientEmail,
          patientName: appointmentData.patientName,
          therapistName: appointmentData.therapistName,
          appointmentDate: new Date(appointmentData.appointmentDate),
          appointmentTime: appointmentData.appointmentTime,
          duration: appointmentData.duration || 60,
          location: appointmentData.location,
          meetingUrl: appointmentData.meetingUrl,
          notes: appointmentData.notes,
        }
      );

      this.logger.log(`Sent appointment confirmation to ${appointmentData.patientEmail}`);

      return {
        success: result.success,
        message: result.success ? 'Confirmation email sent successfully' : 'Failed to send confirmation email',
        messageId: result.messageId,
        threadId: result.threadId,
        error: result.error,
      };

    } catch (error) {
      this.logger.error(`Failed to send appointment confirmation: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to send appointment confirmation');
    }
  }

  @Post('send-appointment-reminder')
  @ApiOperation({ summary: 'Send appointment reminder email' })
  @ApiResponse({ status: 200, description: 'Reminder email sent successfully' })
  async sendAppointmentReminder(
    @Body() appointmentData: SendAppointmentEmailRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(appointmentData.googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const result = await this.gmailService.sendAppointmentReminder(
        appointmentData.googleAccountId,
        {
          id: appointmentData.appointmentId,
          patientEmail: appointmentData.patientEmail,
          patientName: appointmentData.patientName,
          therapistName: appointmentData.therapistName,
          appointmentDate: new Date(appointmentData.appointmentDate),
          appointmentTime: appointmentData.appointmentTime,
          location: appointmentData.location,
          meetingUrl: appointmentData.meetingUrl,
          hoursUntil: appointmentData.hoursUntil || 24,
        }
      );

      this.logger.log(`Sent appointment reminder to ${appointmentData.patientEmail}`);

      return {
        success: result.success,
        message: result.success ? 'Reminder email sent successfully' : 'Failed to send reminder email',
        messageId: result.messageId,
        threadId: result.threadId,
        error: result.error,
      };

    } catch (error) {
      this.logger.error(`Failed to send appointment reminder: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to send appointment reminder');
    }
  }

  @Post('send-appointment-cancellation')
  @ApiOperation({ summary: 'Send appointment cancellation email' })
  @ApiResponse({ status: 200, description: 'Cancellation email sent successfully' })
  async sendAppointmentCancellation(
    @Body() appointmentData: SendAppointmentEmailRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(appointmentData.googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const result = await this.gmailService.sendAppointmentCancellation(
        appointmentData.googleAccountId,
        {
          id: appointmentData.appointmentId,
          patientEmail: appointmentData.patientEmail,
          patientName: appointmentData.patientName,
          therapistName: appointmentData.therapistName,
          appointmentDate: new Date(appointmentData.appointmentDate),
          appointmentTime: appointmentData.appointmentTime,
          cancellationReason: appointmentData.cancellationReason,
          rescheduleUrl: appointmentData.rescheduleUrl,
        }
      );

      this.logger.log(`Sent appointment cancellation to ${appointmentData.patientEmail}`);

      return {
        success: result.success,
        message: result.success ? 'Cancellation email sent successfully' : 'Failed to send cancellation email',
        messageId: result.messageId,
        threadId: result.threadId,
        error: result.error,
      };

    } catch (error) {
      this.logger.error(`Failed to send appointment cancellation: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to send appointment cancellation');
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available email templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getAvailableTemplates() {
    try {
      const templates = this.emailTemplatesService.getAvailableTemplates();

      return {
        success: true,
        templates,
        count: templates.length,
      };

    } catch (error) {
      this.logger.error(`Failed to get templates: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Failed to get email templates');
    }
  }

  @Get('templates/:templateId/preview')
  @ApiOperation({ summary: 'Preview an email template with sample data' })
  @ApiResponse({ status: 200, description: 'Template preview generated successfully' })
  async previewTemplate(@Param('templateId') templateId: string) {
    try {
      const preview = await this.emailTemplatesService.previewTemplate(templateId);

      return {
        success: true,
        templateId,
        preview,
      };

    } catch (error) {
      this.logger.error(`Failed to preview template: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to preview template');
    }
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get email logs for a Google account' })
  @ApiResponse({ status: 200, description: 'Email logs retrieved successfully' })
  async getEmailLogs(
    @Query('googleAccountId') googleAccountId: string,
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    try {
      if (!googleAccountId) {
        throw new BadRequestException('googleAccountId query parameter is required');
      }

      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const result = await this.gmailService.getEmailLogs(googleAccountId, limitNum, offsetNum);

      return {
        success: true,
        logs: result.logs,
        total: result.total,
        limit: limitNum,
        offset: offsetNum,
      };

    } catch (error) {
      this.logger.error(`Failed to get email logs: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to get email logs');
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get email delivery statistics' })
  @ApiResponse({ status: 200, description: 'Email statistics retrieved successfully' })
  async getEmailStats(
    @Query('googleAccountId') googleAccountId: string,
    @Req() req: AuthenticatedRequest,
    @Query('days') days?: string
  ) {
    try {
      if (!googleAccountId) {
        throw new BadRequestException('googleAccountId query parameter is required');
      }

      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const daysNum = days ? parseInt(days, 10) : 30;
      const stats = await this.gmailService.getEmailStats(googleAccountId, daysNum);

      return {
        success: true,
        stats,
        period: `Last ${daysNum} days`,
        account: {
          email: account.email,
          displayName: account.displayName,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get email stats: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to get email stats');
    }
  }

  @Post('retry-failed-emails')
  @ApiOperation({ summary: 'Retry failed email sends' })
  @ApiResponse({ status: 200, description: 'Failed emails retried' })
  async retryFailedEmails(
    @Body() body: { googleAccountId: string },
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(body.googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const retriedCount = await this.gmailService.retryFailedEmails(body.googleAccountId);

      this.logger.log(`Retried ${retriedCount} failed emails for account ${account.email}`);

      return {
        success: true,
        message: `Retried ${retriedCount} failed emails`,
        retriedCount,
      };

    } catch (error) {
      this.logger.error(`Failed to retry failed emails: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to retry failed emails');
    }
  }
}