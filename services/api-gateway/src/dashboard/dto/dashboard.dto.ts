import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDate, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export enum DashboardView {
  CLIENT = 'client',
  THERAPIST = 'coach',
  ADMIN = 'admin'
}

export class DashboardQueryDto {
  @ApiProperty({
    description: 'Time range for dashboard data',
    enum: TimeRange,
    default: TimeRange.WEEK,
    example: TimeRange.WEEK
  })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.WEEK;

  @ApiProperty({
    description: 'Dashboard view type based on user role',
    enum: DashboardView,
    example: DashboardView.CLIENT
  })
  @IsOptional()
  @IsEnum(DashboardView)
  view?: DashboardView;

  @ApiProperty({
    description: 'Start date for custom time range (ISO 8601 format)',
    type: 'string',
    format: 'date-time',
    required: false,
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({
    description: 'End date for custom time range (ISO 8601 format)',
    type: 'string',
    format: 'date-time',
    required: false,
    example: '2024-01-31T23:59:59Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({
    description: 'Maximum number of items to return',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Include detailed analytics data',
    default: false,
    example: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeAnalytics?: boolean = false;
}

export class AppointmentSummaryDto {
  @ApiProperty({
    description: 'Unique appointment identifier',
    example: 'apt_123456789'
  })
  id: string;

  @ApiProperty({
    description: 'Patient full name',
    example: 'John Doe'
  })
  patientName: string;

  @ApiProperty({
    description: 'Coach full name',
    example: 'Dr. Sarah Johnson'
  })
  coachName: string;

  @ApiProperty({
    description: 'Scheduled appointment date and time',
    type: 'string',
    format: 'date-time',
    example: '2024-02-01T15:00:00Z'
  })
  scheduledAt: Date;

  @ApiProperty({
    description: 'Appointment duration in minutes',
    example: 60
  })
  duration: number;

  @ApiProperty({
    description: 'Appointment type',
    example: 'individual_therapy'
  })
  type: string;

  @ApiProperty({
    description: 'Current appointment status',
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    example: 'scheduled'
  })
  status: string;

  @ApiProperty({
    description: 'Meeting location or room',
    example: 'Room 201'
  })
  location?: string;
}

export class NoteSummaryDto {
  @ApiProperty({
    description: 'Unique note identifier',
    example: 'note_987654321'
  })
  id: string;

  @ApiProperty({
    description: 'Associated patient name',
    example: 'John Doe'
  })
  patientName: string;

  @ApiProperty({
    description: 'Note title or subject',
    example: 'Progress Update - Week 4'
  })
  title: string;

  @ApiProperty({
    description: 'Note content preview (first 100 characters)',
    example: 'Patient shows significant improvement in anxiety management techniques...'
  })
  preview: string;

  @ApiProperty({
    description: 'Author of the note',
    example: 'Dr. Sarah Johnson'
  })
  authorName: string;

  @ApiProperty({
    description: 'Note creation date',
    type: 'string',
    format: 'date-time',
    example: '2024-01-30T14:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Note priority level',
    enum: ['low', 'normal', 'high', 'urgent'],
    example: 'normal'
  })
  priority: string;

  @ApiProperty({
    description: 'Note category or type',
    example: 'progress_note'
  })
  category: string;
}

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Total number of active patients',
    example: 152
  })
  totalPatients: number;

  @ApiProperty({
    description: 'Number of appointments today',
    example: 8
  })
  appointmentsToday: number;

  @ApiProperty({
    description: 'Number of appointments this week',
    example: 35
  })
  appointmentsThisWeek: number;

  @ApiProperty({
    description: 'Number of completed sessions this month',
    example: 127
  })
  completedSessionsThisMonth: number;

  @ApiProperty({
    description: 'Average session rating (1-5 scale)',
    example: 4.6
  })
  averageRating: number;

  @ApiProperty({
    description: 'Patient satisfaction score (0-100)',
    example: 92
  })
  satisfactionScore: number;

  @ApiProperty({
    description: 'Number of new patients this month',
    example: 12
  })
  newPatientsThisMonth: number;

  @ApiProperty({
    description: 'Revenue for the current month',
    example: 25650.00
  })
  monthlyRevenue: number;

  @ApiProperty({
    description: 'Pending appointments requiring attention',
    example: 3
  })
  pendingAppointments: number;

  @ApiProperty({
    description: 'Overdue tasks or follow-ups',
    example: 2
  })
  overdueTasks: number;
}

export class DashboardAnalyticsDto {
  @ApiProperty({
    description: 'Patient growth trend over time',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date' },
        count: { type: 'number' }
      }
    }
  })
  patientGrowth: Array<{ date: string; count: number }>;

  @ApiProperty({
    description: 'Session completion rates by week',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        week: { type: 'string' },
        completed: { type: 'number' },
        total: { type: 'number' },
        rate: { type: 'number' }
      }
    }
  })
  sessionCompletionRates: Array<{
    week: string;
    completed: number;
    total: number;
    rate: number;
  }>;

  @ApiProperty({
    description: 'Revenue trends by period',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        revenue: { type: 'number' },
        growth: { type: 'number' }
      }
    }
  })
  revenueTrends: Array<{
    period: string;
    revenue: number;
    growth: number;
  }>;

  @ApiProperty({
    description: 'Most popular appointment types',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        count: { type: 'number' },
        percentage: { type: 'number' }
      }
    }
  })
  popularAppointmentTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export class DashboardResponseDto {
  @ApiProperty({
    description: 'Operation status',
    example: 'success'
  })
  status: string;

  @ApiProperty({
    description: 'Dashboard data',
    type: 'object',
    properties: {
      appointments: {
        type: 'array',
        items: { $ref: '#/components/schemas/AppointmentSummaryDto' }
      },
      notes: {
        type: 'array',
        items: { $ref: '#/components/schemas/NoteSummaryDto' }
      },
      stats: { $ref: '#/components/schemas/DashboardStatsDto' },
      analytics: { $ref: '#/components/schemas/DashboardAnalyticsDto' }
    }
  })
  data: {
    appointments?: AppointmentSummaryDto[];
    notes?: NoteSummaryDto[];
    stats?: DashboardStatsDto;
    analytics?: DashboardAnalyticsDto;
  };

  @ApiProperty({
    description: 'Response timestamp',
    type: 'string',
    format: 'date-time',
    example: '2024-01-31T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Data cache status',
    example: 'hit'
  })
  cacheStatus?: string;
}