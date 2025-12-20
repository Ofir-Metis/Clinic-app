import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions } from 'typeorm';
import { 
  Appointment, 
  MeetingType, 
  AppointmentStatus, 
} from './appointment.entity';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export interface CreateAppointmentData {
  therapistId: string;
  clientId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  description?: string;
  meetingType: MeetingType;
  reminderTimes?: string[];
  clientPreferences?: {
    preferredNotificationMethod: 'email' | 'sms' | 'both';
    allowRecording: boolean;
    requireConfirmation: boolean;
  };
  tags?: string[];
  createdBy: string;
}

export interface UpdateAppointmentData {
  startTime?: Date;
  endTime?: Date;
  title?: string;
  description?: string;
  status?: AppointmentStatus;
  notes?: string;
  tags?: string[];
  updatedBy?: string;
}

export interface AppointmentFilters {
  therapistId?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AppointmentStatus;
  meetingType?: MeetingType;
  hasRecording?: boolean;
  limit: number;
  offset: number;
}

/**
 * Enhanced service for managing appointments with meeting types and recording
 */
@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  
  private client = ClientProxyFactory.create({
    transport: Transport.NATS,
    options: { url: process.env.NATS_URL || 'nats://localhost:4222' },
  });

  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  /**
   * Create a new appointment with enhanced meeting configuration
   */
  async create(data: CreateAppointmentData): Promise<Appointment> {
    try {
      this.logger.log(`Creating appointment for therapist ${data.therapistId}`);
      
      const appointment = this.repo.create({
        therapistId: data.therapistId,
        clientId: data.clientId,
        startTime: data.startTime,
        endTime: data.endTime,
        title: data.title,
        description: data.description,
        meetingType: data.meetingType,
        status: 'scheduled',
        reminderTimes: data.reminderTimes || ['24h', '1h'],
        clientPreferences: data.clientPreferences,
        tags: data.tags,
        createdBy: data.createdBy,
        // Default meeting config will be set by entity defaults
      });

      const saved = await this.repo.save(appointment);
      
      // Emit event for other services
      this.client.emit('appointment.created', {
        id: saved.id,
        therapistId: saved.therapistId,
        clientId: saved.clientId,
        startTime: saved.startTime,
        endTime: saved.endTime,
        meetingType: saved.meetingType,
        status: saved.status
      });

      this.logger.log(`Created appointment ${saved.id}`);
      return saved;

    } catch (error: unknown) {
      this.logger.error(`Failed to create appointment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Find appointments with comprehensive filtering
   */
  async findWithFilters(filters: AppointmentFilters): Promise<{
    appointments: Appointment[];
    total: number;
  }> {
    try {
      const where: any = {};
      
      if (filters.therapistId) where.therapistId = filters.therapistId;
      if (filters.clientId) where.clientId = filters.clientId;
      if (filters.status) where.status = filters.status;
      if (filters.meetingType) where.meetingType = filters.meetingType;
      
      if (filters.startDate && filters.endDate) {
        where.startTime = Between(filters.startDate, filters.endDate);
      } else if (filters.startDate) {
        where.startTime = { $gte: filters.startDate } as any;
      } else if (filters.endDate) {
        where.startTime = { $lte: filters.endDate } as any;
      }

      const options: FindManyOptions<Appointment> = {
        where,
        order: { startTime: 'ASC' },
        take: filters.limit,
        skip: filters.offset
      };

      const [appointments, total] = await this.repo.findAndCount(options);

      // Filter by recording status if requested
      let filteredAppointments = appointments;
      if (filters.hasRecording !== undefined) {
        filteredAppointments = appointments.filter(apt => {
          const hasRecording = apt.recordingFiles && apt.recordingFiles.length > 0;
          return filters.hasRecording ? hasRecording : !hasRecording;
        });
      }

      return { appointments: filteredAppointments, total };

    } catch (error: unknown) {
      this.logger.error(`Failed to find appointments: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Find appointment by ID
   */
  async findById(id: string): Promise<Appointment | null> {
    try {
      return await this.repo.findOne({ where: { id } });
    } catch (error: unknown) {
      this.logger.error(`Failed to find appointment ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update appointment with enhanced data
   */
  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    try {
      const appointment = await this.findById(id);
      
      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      // Check authorization if needed
      if (data.updatedBy && appointment.therapistId !== data.updatedBy && appointment.clientId !== data.updatedBy) {
        throw new ForbiddenException('Not authorized to update this appointment');
      }

      // Update fields
      Object.assign(appointment, {
        ...data,
        updatedAt: new Date()
      });

      const updated = await this.repo.save(appointment);

      // Emit update event
      this.client.emit('appointment.updated', {
        id: updated.id,
        therapistId: updated.therapistId,
        clientId: updated.clientId,
        startTime: updated.startTime,
        endTime: updated.endTime,
        meetingType: updated.meetingType,
        status: updated.status,
        changes: Object.keys(data)
      });

      this.logger.log(`Updated appointment ${id}`);
      return updated;

    } catch (error: unknown) {
      this.logger.error(`Failed to update appointment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get upcoming appointments
   */
  async getUpcoming(therapistId?: string, limit: number = 10): Promise<Appointment[]> {
    try {
      const where: any = {
        startTime: { $gte: new Date() } as any,
        status: { $in: ['scheduled', 'confirmed'] } as any
      };

      if (therapistId) {
        where.therapistId = therapistId;
      }

      return await this.repo.find({
        where,
        order: { startTime: 'ASC' },
        take: limit
      });

    } catch (error: unknown) {
      this.logger.error(`Failed to get upcoming appointments: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get appointments history
   */
  async getHistory(therapistId: string, page: number = 1, limit: number = 20): Promise<{
    appointments: Appointment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const where = {
        therapistId,
        status: { $in: ['completed', 'cancelled', 'no-show'] } as any
      };

      const [appointments, total] = await this.repo.findAndCount({
        where,
        order: { startTime: 'DESC' },
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        appointments,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error: unknown) {
      this.logger.error(`Failed to get appointment history: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get appointments by date range
   */
  async getByDateRange(
    startDate: Date,
    endDate: Date,
    therapistId?: string,
    clientId?: string
  ): Promise<Appointment[]> {
    try {
      const where: any = {
        startTime: Between(startDate, endDate)
      };

      if (therapistId) where.therapistId = therapistId;
      if (clientId) where.clientId = clientId;

      return await this.repo.find({
        where,
        order: { startTime: 'ASC' }
      });

    } catch (error: unknown) {
      this.logger.error(`Failed to get appointments by date range: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(
    therapistId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<Appointment[]> {
    try {
      const where: any = {
        therapistId,
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] } as any,
        $or: [
          {
            $and: [
              { startTime: { $lte: startTime } as any },
              { endTime: { $gt: startTime } as any }
            ]
          },
          {
            $and: [
              { startTime: { $lt: endTime } as any },
              { endTime: { $gte: endTime } as any }
            ]
          },
          {
            $and: [
              { startTime: { $gte: startTime } as any },
              { endTime: { $lte: endTime } as any }
            ]
          }
        ]
      };

      if (excludeAppointmentId) {
        where.id = { $ne: excludeAppointmentId } as any;
      }

      return await this.repo.find({ where });

    } catch (error: unknown) {
      this.logger.error(`Failed to check conflicts: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get appointments requiring action (reminders, confirmations, etc.)
   */
  async getRequiringAction(): Promise<{
    needReminders: Appointment[];
    needConfirmation: Appointment[];
    overdue: Appointment[];
  }> {
    try {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Appointments needing reminders
      const needReminders = await this.repo.find({
        where: {
          status: { $in: ['scheduled', 'confirmed'] } as any,
          reminderSent: false,
          startTime: { $lte: oneDayFromNow, $gte: now } as any
        }
      });

      // Appointments needing confirmation
      const needConfirmation = await this.repo.find({
        where: {
          status: 'scheduled',
          confirmationSent: false,
          startTime: { $lte: oneHourFromNow, $gte: now } as any
        }
      });

      // Overdue appointments (should be marked as no-show)
      const overdue = await this.repo.find({
        where: {
          status: { $in: ['scheduled', 'confirmed'] } as any,
          endTime: { $lt: now } as any
        }
      });

      return { needReminders, needConfirmation, overdue };

    } catch (error: unknown) {
      this.logger.error(`Failed to get appointments requiring action: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Legacy methods for backward compatibility
   */
  async findAll(filter: GetAppointmentsDto) {
    this.logger.log('findAll (legacy)', { therapistId: filter.therapistId });
    return this.findWithFilters({
      therapistId: filter.therapistId?.toString(),
      limit: 50,
      offset: 0
    });
  }

  async findOne(id: number) {
    this.logger.log('findOne (legacy)', { id });
    return this.findById(id.toString());
  }

  async findHistory(userId: number) {
    this.logger.log('findHistory (legacy)', { userId });
    const result = await this.getHistory(userId.toString());
    return result.appointments;
  }

  async history(query: GetHistoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    this.logger.log('history (legacy)', { therapistId: query.therapistId, page });
    const result = await this.getHistory(query.therapistId.toString(), page, limit);
    return result.appointments;
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
    this.client.emit('appointment.deleted', { id });
  }
}
