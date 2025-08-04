import { 
  Controller, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Get, 
  UseGuards,
  Logger,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { CsrfGuard, CsrfExempt } from '@clinic/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';

/**
 * Example controller demonstrating CSRF protection usage
 * 
 * Shows how to:
 * - Apply CSRF protection to state-changing endpoints
 * - Exempt specific endpoints from CSRF protection
 * - Handle CSRF token validation errors
 */
@ApiTags('CSRF Examples')
@Controller('examples/csrf')
@UseGuards(CsrfGuard) // Apply CSRF protection to all endpoints in this controller
export class CsrfProtectedEndpointsController {
  private readonly logger = new Logger(CsrfProtectedEndpointsController.name);

  /**
   * Safe endpoint - GET requests are exempt from CSRF protection by default
   */
  @Get('users')
  @ApiOperation({ summary: 'Get users (CSRF exempt - GET request)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  getUsers() {
    return {
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ],
      message: 'This GET endpoint is automatically exempt from CSRF protection'
    };
  }

  /**
   * CSRF-protected endpoint - POST request requires valid CSRF token
   */
  @Post('users')
  @ApiOperation({ 
    summary: 'Create user (CSRF protected)',
    description: 'Creates a new user. Requires valid CSRF token in X-CSRF-Token header or _csrf field.'
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF token obtained from /csrf/token endpoint',
    required: true,
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'CSRF token missing or invalid' })
  createUser(@Body() userData: { name: string; email: string }, @Req() req: Request) {
    this.logger.log('User creation request with CSRF protection', {
      userData,
      sessionId: this.getSessionId(req),
    });

    return {
      success: true,
      message: 'User created successfully with CSRF protection',
      user: {
        id: Date.now(),
        ...userData,
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * CSRF-protected endpoint - PUT request
   */
  @Put('users/:id')
  @ApiOperation({ summary: 'Update user (CSRF protected)' })
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'CSRF token missing or invalid' })
  updateUser(
    @Param('id') id: string, 
    @Body() userData: { name?: string; email?: string },
    @Req() req: Request
  ) {
    this.logger.log('User update request with CSRF protection', {
      userId: id,
      userData,
      sessionId: this.getSessionId(req),
    });

    return {
      success: true,
      message: 'User updated successfully with CSRF protection',
      user: {
        id: parseInt(id),
        ...userData,
        updatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * CSRF-protected endpoint - DELETE request
   */
  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (CSRF protected)' })
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'CSRF token missing or invalid' })
  deleteUser(@Param('id') id: string, @Req() req: Request) {
    this.logger.log('User deletion request with CSRF protection', {
      userId: id,
      sessionId: this.getSessionId(req),
    });

    return {
      success: true,
      message: 'User deleted successfully with CSRF protection',
      deletedUserId: parseInt(id),
      deletedAt: new Date().toISOString()
    };
  }

  /**
   * Explicitly CSRF-exempt endpoint - for public APIs or special cases
   */
  @Post('public/feedback')
  @CsrfExempt() // Explicitly exempt this endpoint
  @ApiOperation({ 
    summary: 'Submit feedback (CSRF exempt)',
    description: 'Public feedback endpoint that does not require CSRF protection'
  })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  submitPublicFeedback(@Body() feedback: { message: string; email?: string }, @Req() req: Request) {
    this.logger.log('Public feedback submission (CSRF exempt)', {
      feedback,
      ip: this.getClientIp(req),
    });

    return {
      success: true,
      message: 'Feedback submitted successfully (no CSRF token required)',
      feedback: {
        id: Date.now(),
        ...feedback,
        submittedAt: new Date().toISOString(),
        source: 'public_api'
      }
    };
  }

  /**
   * Form-based endpoint demonstrating _csrf field usage
   */
  @Post('form-submit')
  @ApiOperation({ 
    summary: 'Form submission (supports _csrf field)',
    description: 'Demonstrates form-based CSRF protection using _csrf field in request body'
  })
  @ApiResponse({ status: 200, description: 'Form submitted successfully' })
  submitForm(@Body() formData: { 
    name: string; 
    message: string; 
    _csrf?: string; // CSRF token can be included in form data
  }, @Req() req: Request) {
    this.logger.log('Form submission with CSRF protection', {
      formData: { ...formData, _csrf: formData._csrf ? '[REDACTED]' : undefined },
      sessionId: this.getSessionId(req),
    });

    return {
      success: true,
      message: 'Form submitted successfully with CSRF protection',
      submission: {
        id: Date.now(),
        name: formData.name,
        message: formData.message,
        submittedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Bulk operation with CSRF protection
   */
  @Post('bulk-operations')
  @ApiOperation({ summary: 'Bulk operations (CSRF protected)' })
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiResponse({ status: 200, description: 'Bulk operation completed successfully' })
  performBulkOperation(@Body() operation: {
    type: 'create' | 'update' | 'delete';
    items: any[];
  }, @Req() req: Request) {
    this.logger.log('Bulk operation with CSRF protection', {
      operationType: operation.type,
      itemCount: operation.items.length,
      sessionId: this.getSessionId(req),
    });

    return {
      success: true,
      message: `Bulk ${operation.type} operation completed with CSRF protection`,
      operation: {
        id: Date.now(),
        type: operation.type,
        itemCount: operation.items.length,
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Session-sensitive operation requiring CSRF protection
   */
  @Post('session/logout-all')
  @ApiOperation({ 
    summary: 'Logout from all sessions (CSRF protected)',
    description: 'Security-sensitive operation that requires CSRF protection'
  })
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiResponse({ status: 200, description: 'Logged out from all sessions successfully' })
  logoutAllSessions(@Req() req: Request) {
    this.logger.log('Logout all sessions request with CSRF protection', {
      sessionId: this.getSessionId(req),
      userAgent: req.get('User-Agent'),
      ip: this.getClientIp(req),
    });

    return {
      success: true,
      message: 'Logged out from all sessions successfully with CSRF protection',
      loggedOutAt: new Date().toISOString(),
      sessionId: this.getSessionId(req)
    };
  }

  /**
   * Helper method to get session ID
   */
  private getSessionId(req: Request): string {
    if (req.session && (req.session as any).id) {
      return (req.session as any).id;
    }
    return 'no-session';
  }

  /**
   * Helper method to get client IP
   */
  private getClientIp(req: Request): string {
    return (
      req.get('X-Forwarded-For') ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}