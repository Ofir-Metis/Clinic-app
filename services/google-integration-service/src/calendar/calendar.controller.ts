/**
 * CalendarController - Handle Google Calendar API endpoints
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { GoogleCalendarService, CalendarEvent } from './google-calendar.service';
import { GoogleOAuthService } from '../auth/google-oauth.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

interface CreateEventRequest {
  googleAccountId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: Array<{
    email: string;
    name?: string;
  }>;
  location?: string;
  isOnlineMeeting?: boolean;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

interface UpdateEventRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  attendees?: Array<{
    email: string;
    name?: string;
  }>;
  location?: string;
  isOnlineMeeting?: boolean;
}

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly calendarService: GoogleCalendarService,
    private readonly googleOAuthService: GoogleOAuthService
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'Create a new calendar event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createEvent(
    @Body() createEventData: CreateEventRequest,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(createEventData.googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      // Convert request to CalendarEvent
      const event: CalendarEvent = {
        title: createEventData.title,
        description: createEventData.description,
        startTime: new Date(createEventData.startTime),
        endTime: new Date(createEventData.endTime),
        attendees: createEventData.attendees,
        location: createEventData.location,
        isOnlineMeeting: createEventData.isOnlineMeeting,
        reminders: createEventData.reminders,
      };

      const result = await this.calendarService.createEvent(createEventData.googleAccountId, event);

      this.logger.log(`Created calendar event for account ${account.email}`);

      return {
        success: result.success,
        message: result.success ? 'Event created successfully' : 'Failed to create event',
        event: {
          googleEventId: result.googleEventId,
          action: result.action,
        },
        error: result.error,
      };

    } catch (error) {
      this.logger.error(`Failed to create calendar event: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to create calendar event');
    }
  }

  @Put('events/:eventId')
  @ApiOperation({ summary: 'Update an existing calendar event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  async updateEvent(
    @Param('eventId') eventId: string,
    @Body() updateData: UpdateEventRequest & { googleAccountId: string },
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(updateData.googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      // Convert request to partial CalendarEvent
      const updatedEvent: Partial<CalendarEvent> = {
        title: updateData.title,
        description: updateData.description,
        startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
        endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
        attendees: updateData.attendees,
        location: updateData.location,
        isOnlineMeeting: updateData.isOnlineMeeting,
      };

      const result = await this.calendarService.updateEvent(
        updateData.googleAccountId,
        eventId,
        updatedEvent
      );

      this.logger.log(`Updated calendar event ${eventId} for account ${account.email}`);

      return {
        success: result.success,
        message: result.success ? 'Event updated successfully' : 'Failed to update event',
        event: {
          googleEventId: result.googleEventId,
          action: result.action,
        },
        error: result.error,
      };

    } catch (error) {
      this.logger.error(`Failed to update calendar event: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to update calendar event');
    }
  }

  @Delete('events/:eventId')
  @ApiOperation({ summary: 'Delete a calendar event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  async deleteEvent(
    @Param('eventId') eventId: string,
    @Query('googleAccountId') googleAccountId: string,
    @Req() req: AuthenticatedRequest
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

      const result = await this.calendarService.deleteEvent(googleAccountId, eventId);

      this.logger.log(`Deleted calendar event ${eventId} for account ${account.email}`);

      return {
        success: result.success,
        message: result.success ? 'Event deleted successfully' : 'Failed to delete event',
        event: {
          googleEventId: result.googleEventId,
          action: result.action,
        },
        error: result.error,
      };

    } catch (error) {
      this.logger.error(`Failed to delete calendar event: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to delete calendar event');
    }
  }

  @Get('events')
  @ApiOperation({ summary: 'Get calendar events from Google Calendar' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEvents(
    @Query('googleAccountId') googleAccountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      if (!googleAccountId || !startDate || !endDate) {
        throw new BadRequestException('googleAccountId, startDate, and endDate query parameters are required');
      }

      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const events = await this.calendarService.getCalendarEvents(
        googleAccountId,
        new Date(startDate),
        new Date(endDate)
      );

      return {
        success: true,
        events,
        count: events.length,
        account: {
          email: account.email,
          displayName: account.displayName,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get calendar events: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to get calendar events');
    }
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Check for calendar conflicts' })
  @ApiResponse({ status: 200, description: 'Conflict check completed' })
  async checkConflicts(
    @Query('googleAccountId') googleAccountId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('excludeEventId') excludeEventId?: string,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      if (!googleAccountId || !startTime || !endTime) {
        throw new BadRequestException('googleAccountId, startTime, and endTime query parameters are required');
      }

      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const conflicts = await this.calendarService.checkForConflicts(
        googleAccountId,
        new Date(startTime),
        new Date(endTime),
        excludeEventId
      );

      return {
        success: true,
        hasConflicts: conflicts.length > 0,
        conflicts,
        conflictCount: conflicts.length,
      };

    } catch (error) {
      this.logger.error(`Failed to check conflicts: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to check conflicts');
    }
  }

  @Get('sync-logs')
  @ApiOperation({ summary: 'Get calendar sync logs' })
  @ApiResponse({ status: 200, description: 'Sync logs retrieved successfully' })
  async getSyncLogs(
    @Query('googleAccountId') googleAccountId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req: AuthenticatedRequest
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

      const result = await this.calendarService.getSyncLogs(googleAccountId, limitNum, offsetNum);

      return {
        success: true,
        logs: result.logs,
        total: result.total,
        limit: limitNum,
        offset: offsetNum,
      };

    } catch (error) {
      this.logger.error(`Failed to get sync logs: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to get sync logs');
    }
  }

  @Post('retry-failed-syncs')
  @ApiOperation({ summary: 'Retry failed sync operations' })
  @ApiResponse({ status: 200, description: 'Failed syncs retried' })
  async retryFailedSyncs(
    @Body() body: { googleAccountId: string },
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Verify account belongs to user
      const account = await this.googleOAuthService.getGoogleAccount(body.googleAccountId);
      if (!account || account.userId !== req.user.id) {
        throw new UnauthorizedException('Google account not found or access denied');
      }

      const retriedCount = await this.calendarService.retryFailedSyncs(body.googleAccountId);

      this.logger.log(`Retried ${retriedCount} failed sync operations for account ${account.email}`);

      return {
        success: true,
        message: `Retried ${retriedCount} failed sync operations`,
        retriedCount,
      };

    } catch (error) {
      this.logger.error(`Failed to retry sync operations: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to retry sync operations');
    }
  }
}