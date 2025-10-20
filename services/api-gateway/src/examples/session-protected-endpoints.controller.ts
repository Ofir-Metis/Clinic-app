import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Req, 
  UseGuards,
  Logger
} from '@nestjs/common';
import { Request } from 'express';
import { 
  SessionGuard, 
  SessionExempt, 
  RequireElevated, 
  RequireSessionPermissions 
} from '@clinic/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

// Extend Request interface for session data
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      sessionData?: any | {
        userId: string;
        userRole: string;
        securityLevel: string;
        permissions: string[];
      };
    }
  }
}

/**
 * Session Protected Endpoints Controller
 * 
 * Demonstrates various levels of session protection:
 * - Public endpoints (no session required)
 * - Standard protected endpoints
 * - Elevated security endpoints (require 2FA or admin)
 * - Permission-based endpoints
 */
@ApiTags('Session Protection Examples')
@Controller('examples/session-protected')
@UseGuards(SessionGuard) // Apply session protection to all endpoints by default
export class SessionProtectedEndpointsController {
  private readonly logger = new Logger(SessionProtectedEndpointsController.name);

  /**
   * Public endpoint - no session required
   */
  @Get('public/health')
  @SessionExempt()
  @ApiOperation({ 
    summary: 'Public health check (no session required)',
    description: 'Public endpoint that bypasses session validation'
  })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  getPublicHealth() {
    return {
      status: 'ok',
      message: 'This endpoint is publicly accessible without session',
      timestamp: new Date().toISOString(),
      sessionRequired: false
    };
  }

  /**
   * Standard protected endpoint - requires valid session
   */
  @Get('user/profile')
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Get user profile (session required)',
    description: 'Standard protected endpoint requiring valid session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        profile: { type: 'object' },
        sessionInfo: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Session required or invalid' })
  getUserProfile(@Req() req: Request) {
    const sessionInfo = {
      sessionId: req.sessionId?.substring(0, 8) + '...',
      userId: req.sessionData?.userId,
      role: req.sessionData?.userRole,
      securityLevel: req.sessionData?.securityLevel,
      permissions: req.sessionData?.permissions
    };

    this.logger.debug('User profile accessed', {
      userId: req.sessionData?.userId,
      sessionId: req.sessionId?.substring(0, 8) + '...'
    });

    return {
      userId: req.sessionData?.userId,
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        role: req.sessionData?.userRole,
        lastLogin: new Date().toISOString()
      },
      sessionInfo,
      message: 'Profile accessed with valid session'
    };
  }

  /**
   * Standard protected endpoint for updating profile
   */
  @Put('user/profile')
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Update user profile (session required)',
    description: 'Update user profile with session validation'
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Session required or invalid' })
  updateUserProfile(
    @Body() profileData: { name?: string; email?: string },
    @Req() req: Request
  ) {
    this.logger.log('User profile updated', {
      userId: req.sessionData?.userId,
      sessionId: req.sessionId?.substring(0, 8) + '...',
      updates: Object.keys(profileData)
    });

    return {
      success: true,
      message: 'Profile updated successfully with session validation',
      userId: req.sessionData?.userId,
      updatedFields: Object.keys(profileData),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Elevated security endpoint - requires elevated session
   */
  @Get('admin/users')
  @RequireElevated()
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Get all users (elevated session required)',
    description: 'Admin endpoint requiring elevated security session (2FA verified or admin role)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        users: { type: 'array' },
        adminInfo: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Elevated session required' })
  @ApiResponse({ status: 403, description: 'Insufficient security level' })
  getAllUsers(@Req() req: Request) {
    this.logger.log('Admin users list accessed', {
      adminUserId: req.sessionData?.userId,
      securityLevel: req.sessionData?.securityLevel,
      sessionId: req.sessionId?.substring(0, 8) + '...'
    });

    return {
      users: [
        { id: '1', name: 'John Doe', role: 'client' },
        { id: '2', name: 'Jane Smith', role: 'coach' },
        { id: '3', name: 'Admin User', role: 'admin' }
      ],
      adminInfo: {
        accessedBy: req.sessionData?.userId,
        securityLevel: req.sessionData?.securityLevel,
        accessTime: new Date().toISOString()
      },
      message: 'Admin data accessed with elevated session'
    };
  }

  /**
   * Permission-based endpoint - requires specific permission
   */
  @Post('admin/users')
  @RequireSessionPermissions(['users:create'])
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Create user (requires users:create permission)',
    description: 'Endpoint requiring specific permission in addition to valid session'
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 401, description: 'Session required' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  createUser(
    @Body() userData: { name: string; email: string; role: string },
    @Req() req: Request
  ) {
    this.logger.log('User creation attempted', {
      createdBy: req.sessionData?.userId,
      newUserData: userData,
      permissions: req.sessionData?.permissions,
      sessionId: req.sessionId?.substring(0, 8) + '...'
    });

    return {
      success: true,
      message: 'User created successfully with permission validation',
      newUser: {
        id: 'new-user-' + Date.now(),
        ...userData,
        createdBy: req.sessionData?.userId,
        createdAt: new Date().toISOString()
      },
      creatorInfo: {
        userId: req.sessionData?.userId,
        role: req.sessionData?.userRole,
        permissions: req.sessionData?.permissions
      }
    };
  }

  /**
   * High-security endpoint - requires both elevated session and specific permissions
   */
  @Delete('admin/system/reset')
  @RequireElevated()
  @RequireSessionPermissions(['system:reset', 'admin:super'])
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'System reset (requires elevated session + super admin permissions)',
    description: 'Critical operation requiring both elevated session and multiple permissions'
  })
  @ApiResponse({ status: 200, description: 'System reset initiated' })
  @ApiResponse({ status: 401, description: 'Elevated session required' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  systemReset(@Req() req: Request) {
    this.logger.error('CRITICAL: System reset initiated', {
      initiatedBy: req.sessionData?.userId,
      securityLevel: req.sessionData?.securityLevel,
      permissions: req.sessionData?.permissions,
      sessionId: req.sessionId?.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return {
      success: true,
      message: 'System reset initiated with maximum security validation',
      operation: 'system_reset',
      initiatedBy: req.sessionData?.userId,
      securityValidation: {
        sessionValid: true,
        elevatedSession: true,
        requiredPermissions: ['system:reset', 'admin:super'],
        userPermissions: req.sessionData?.permissions
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Session info endpoint - shows current session details
   */
  @Get('session/info')
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Get current session information',
    description: 'Returns detailed information about the current session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session information retrieved',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        userId: { type: 'string' },
        userRole: { type: 'string' },
        securityLevel: { type: 'string' },
        permissions: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  getSessionInfo(@Req() req: Request) {
    return {
      sessionId: req.sessionId?.substring(0, 8) + '...',
      userId: req.sessionData?.userId,
      userRole: req.sessionData?.userRole,
      securityLevel: req.sessionData?.securityLevel,
      permissions: req.sessionData?.permissions,
      sessionValid: true,
      message: 'Session information retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Client-specific endpoint - accessible to clients only
   */
  @Get('client/appointments')
  @RequireSessionPermissions(['appointments:read'])
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Get client appointments (requires appointments:read permission)',
    description: 'Client-specific endpoint with permission checking'
  })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  getClientAppointments(@Req() req: Request) {
    this.logger.debug('Client appointments accessed', {
      clientId: req.sessionData?.userId,
      sessionId: req.sessionId?.substring(0, 8) + '...'
    });

    return {
      appointments: [
        {
          id: 'apt-1',
          date: '2024-02-15T10:00:00Z',
          coach: 'Dr. Smith',
          status: 'confirmed'
        },
        {
          id: 'apt-2',
          date: '2024-02-22T14:00:00Z',
          coach: 'Dr. Johnson',
          status: 'pending'
        }
      ],
      clientInfo: {
        userId: req.sessionData?.userId,
        role: req.sessionData?.userRole,
        permissions: req.sessionData?.permissions
      },
      message: 'Appointments accessed with proper permissions'
    };
  }

  /**
   * Coach-specific endpoint - elevated access for healthcare providers
   */
  @Get('coach/clients')
  @RequireElevated()
  @RequireSessionPermissions(['clients:read'])
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Get coach clients (requires elevated session + clients:read permission)',
    description: 'Coach-specific endpoint requiring elevated security for healthcare data access'
  })
  @ApiResponse({ status: 200, description: 'Client list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Elevated session required' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  getCoachClients(@Req() req: Request) {
    this.logger.log('Coach client list accessed', {
      coachId: req.sessionData?.userId,
      securityLevel: req.sessionData?.securityLevel,
      sessionId: req.sessionId?.substring(0, 8) + '...'
    });

    return {
      clients: [
        {
          id: 'client-1',
          name: 'John D.',
          lastSession: '2024-02-10T15:00:00Z',
          status: 'active'
        },
        {
          id: 'client-2',
          name: 'Jane S.',
          lastSession: '2024-02-12T11:00:00Z',
          status: 'active'
        }
      ],
      coachInfo: {
        userId: req.sessionData?.userId,
        role: req.sessionData?.userRole,
        securityLevel: req.sessionData?.securityLevel,
        permissions: req.sessionData?.permissions
      },
      message: 'Healthcare data accessed with elevated session security',
      hipaaCompliant: true
    };
  }

  /**
   * Multi-level security demonstration
   */
  @Post('security-levels/test')
  @ApiSecurity('session')
  @ApiOperation({ 
    summary: 'Test endpoint showing security level handling',
    description: 'Demonstrates how different security levels are handled in the same endpoint'
  })
  @ApiResponse({ status: 200, description: 'Security level test completed' })
  testSecurityLevels(@Req() req: Request) {
    const securityLevel = req.sessionData?.securityLevel;
    const permissions = req.sessionData?.permissions || [];

    const capabilities = {
      canViewProfile: true, // All authenticated users
      canViewReports: securityLevel === 'elevated' || securityLevel === 'admin',
      canManageUsers: securityLevel === 'admin' && permissions.includes('users:manage'),
      canAccessSystem: securityLevel === 'admin' && permissions.includes('system:access')
    };

    this.logger.debug('Security levels tested', {
      userId: req.sessionData?.userId,
      securityLevel,
      permissions,
      capabilities
    });

    return {
      securityInfo: {
        userId: req.sessionData?.userId,
        securityLevel,
        permissions
      },
      capabilities,
      recommendations: {
        forElevatedAccess: 'Complete 2FA verification',
        forAdminAccess: 'Require admin role assignment',
        forSpecificPermissions: 'Contact system administrator'
      },
      message: 'Security level capabilities evaluated successfully'
    };
  }
}