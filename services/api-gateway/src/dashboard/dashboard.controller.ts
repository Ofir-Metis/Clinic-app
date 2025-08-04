import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
  ApiExtraModels 
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { 
  DashboardQueryDto, 
  DashboardResponseDto, 
  AppointmentSummaryDto, 
  NoteSummaryDto, 
  DashboardStatsDto,
  DashboardAnalyticsDto,
  TimeRange,
  DashboardView
} from './dto/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(
  DashboardQueryDto,
  DashboardResponseDto,
  AppointmentSummaryDto,
  NoteSummaryDto,
  DashboardStatsDto,
  DashboardAnalyticsDto
)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('appointments')
  @ApiOperation({
    summary: 'Get upcoming appointments',
    description: `
      Retrieves a list of upcoming appointments for the authenticated user.
      
      **Features:**
      - Role-based filtering (clients see their appointments, therapists see their schedule)
      - Customizable time range and limit
      - Real-time status updates
      - HIPAA-compliant data filtering
      
      **Use Cases:**
      - Client dashboard showing next appointments
      - Therapist schedule overview
      - Admin appointment monitoring
    `
  })
  @ApiQuery({
    name: 'timeRange',
    enum: TimeRange,
    required: false,
    description: 'Time range for appointments (default: week)'
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Maximum number of appointments to return (1-100, default: 20)'
  })
  @ApiQuery({
    name: 'view',
    enum: DashboardView,
    required: false,
    description: 'Dashboard view type based on user role'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved upcoming appointments',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AppointmentSummaryDto' }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 15 },
            limit: { type: 'number', example: 20 },
            hasMore: { type: 'boolean', example: false }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Access denied' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'Rate limit exceeded' },
        error: { type: 'string', example: 'Too Many Requests' }
      }
    }
  })
  upcoming(@Query() query: DashboardQueryDto, @Request() req: any) {
    return this.service.appointments(query, req.user);
  }

  @Get('notes')
  @ApiOperation({
    summary: 'Get recent notes',
    description: `
      Retrieves recent session notes and patient updates for the authenticated user.
      
      **Features:**
      - Role-based access control (only authorized notes visible)
      - HIPAA-compliant PHI filtering
      - Priority-based sorting
      - Search and filtering capabilities
      
      **Security:**
      - All PHI is properly encrypted
      - Audit logging for all access
      - Role-based data filtering
    `
  })
  @ApiQuery({
    name: 'timeRange',
    enum: TimeRange,
    required: false,
    description: 'Time range for notes (default: week)'
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Maximum number of notes to return (1-100, default: 20)'
  })
  @ApiQuery({
    name: 'priority',
    type: 'string',
    enum: ['low', 'normal', 'high', 'urgent'],
    required: false,
    description: 'Filter by note priority level'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved recent notes',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/NoteSummaryDto' }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 8 },
            limit: { type: 'number', example: 20 },
            hasMore: { type: 'boolean', example: false }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to access notes'
  })
  recent(
    @Query() query: DashboardQueryDto, 
    @Query('priority') priority?: string,
    @Request() req?: any
  ) {
    return this.service.notes({ ...query, priority }, req?.user);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: `
      Retrieves comprehensive dashboard statistics and key performance indicators.
      
      **Metrics Include:**
      - Patient counts and growth
      - Appointment statistics
      - Session completion rates
      - Revenue and billing data
      - Performance indicators
      
      **Features:**
      - Real-time data aggregation
      - Role-based metric filtering
      - Customizable time ranges
      - Trend analysis
    `
  })
  @ApiQuery({
    name: 'timeRange',
    enum: TimeRange,
    required: false,
    description: 'Time range for statistics (default: month)'
  })
  @ApiQuery({
    name: 'includeAnalytics',
    type: 'boolean',
    required: false,
    description: 'Include detailed analytics data (default: false)'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved dashboard statistics',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: { $ref: '#/components/schemas/DashboardStatsDto' },
        analytics: { 
          $ref: '#/components/schemas/DashboardAnalyticsDto',
          description: 'Detailed analytics (only if includeAnalytics=true)'
        },
        timestamp: { type: 'string', format: 'date-time' },
        cacheStatus: { 
          type: 'string', 
          example: 'hit',
          description: 'Cache hit/miss status for performance monitoring'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to view statistics'
  })
  stats(@Query() query: DashboardQueryDto, @Request() req: any) {
    return this.service.stats(query, req.user);
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Get complete dashboard overview',
    description: `
      Retrieves a comprehensive dashboard overview combining appointments, notes, 
      and statistics in a single request for optimal performance.
      
      **Benefits:**
      - Reduced API calls for dashboard loading
      - Consistent data timestamps
      - Optimized for mobile and web dashboards
      - Single cache entry for better performance
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved complete dashboard overview',
    type: DashboardResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  overview(@Query() query: DashboardQueryDto, @Request() req: any): Promise<DashboardResponseDto> {
    return this.service.getCompleteOverview(query, req.user);
  }
}
