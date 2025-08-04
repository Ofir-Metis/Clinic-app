import { Controller, Get, Post, Req, Res, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CsrfTokenService } from '../services/csrf-token.service';
import { CsrfExempt } from '../guards/csrf.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';

// Extend Request interface to include session
declare global {
  namespace Express {
    interface Request {
      session?: any;
    }
  }
}

/**
 * CSRF Token Controller
 * 
 * Provides endpoints for CSRF token management.
 * These endpoints are used by the frontend to obtain and manage CSRF tokens.
 */
@ApiTags('Security')
@Controller('csrf')
export class CsrfController {
  private readonly logger = new Logger(CsrfController.name);

  constructor(private readonly csrfTokenService: CsrfTokenService) {}

  /**
   * Get CSRF token for the current session
   * This endpoint is exempt from CSRF protection since it's used to obtain the token
   */
  @Get('token')
  @CsrfExempt()
  @ApiOperation({ 
    summary: 'Get CSRF token',
    description: 'Obtains a CSRF token for the current session. Use this token in subsequent state-changing requests.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'CSRF token retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        csrfToken: {
          type: 'string',
          description: 'The CSRF token to include in subsequent requests'
        },
        config: {
          type: 'object',
          properties: {
            headerName: { type: 'string', example: 'X-CSRF-Token' },
            fieldName: { type: 'string', example: '_csrf' },
            paramName: { type: 'string', example: 'csrf' }
          }
        },
        expiry: {
          type: 'string',
          format: 'date-time',
          description: 'Token expiry time'
        }
      }
    }
  })
  getCsrfToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      const token = this.csrfTokenService.getOrCreateToken(request, response);
      const config = this.csrfTokenService.getTokenConfig();
      const expiry = this.csrfTokenService.getTokenExpiry(request);

      this.logger.debug('CSRF token requested', {
        sessionId: this.getSessionId(request),
        userAgent: request.get('User-Agent'),
        ip: this.getClientIp(request),
      });

      return {
        csrfToken: token,
        config,
        expiry: expiry?.toISOString() || null,
      };
    } catch (error) {
      this.logger.error('Failed to generate CSRF token', {
        error: error.message,
        sessionId: this.getSessionId(request),
      });
      throw error;
    }
  }

  /**
   * Refresh CSRF token (invalidate old token and create new one)
   */
  @Post('refresh')
  @CsrfExempt() // This endpoint needs to be exempt to allow token refresh
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh CSRF token',
    description: 'Generates a new CSRF token and invalidates the current one'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'CSRF token refreshed successfully'
  })
  refreshCsrfToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      const newToken = this.csrfTokenService.refreshToken(request, response);
      const config = this.csrfTokenService.getTokenConfig();
      const expiry = this.csrfTokenService.getTokenExpiry(request);

      this.logger.debug('CSRF token refreshed', {
        sessionId: this.getSessionId(request),
        userAgent: request.get('User-Agent'),
        ip: this.getClientIp(request),
      });

      return {
        csrfToken: newToken,
        config,
        expiry: expiry?.toISOString() || null,
        message: 'CSRF token refreshed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to refresh CSRF token', {
        error: error.message,
        sessionId: this.getSessionId(request),
      });
      throw error;
    }
  }

  /**
   * Validate CSRF token (for testing purposes)
   */
  @Post('validate')
  @ApiOperation({ 
    summary: 'Validate CSRF token',
    description: 'Validates the provided CSRF token. This endpoint requires a valid CSRF token.'
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF token to validate',
    required: true,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'CSRF token is valid'
  })
  @ApiResponse({ 
    status: 403, 
    description: 'CSRF token is invalid or missing'
  })
  validateCsrfToken(@Req() request: Request) {
    // If we reach this point, the CSRF guard has already validated the token
    this.logger.debug('CSRF token validation test passed', {
      sessionId: this.getSessionId(request),
      userAgent: request.get('User-Agent'),
      ip: this.getClientIp(request),
    });

    return {
      valid: true,
      message: 'CSRF token is valid',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear CSRF token from session
   */
  @Post('clear')
  @CsrfExempt() // Allow clearing without token
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Clear CSRF token',
    description: 'Clears the CSRF token from the current session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'CSRF token cleared successfully'
  })
  clearCsrfToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      this.csrfTokenService.clearToken(request, response);

      this.logger.debug('CSRF token cleared', {
        sessionId: this.getSessionId(request),
        userAgent: request.get('User-Agent'),
        ip: this.getClientIp(request),
      });

      return {
        message: 'CSRF token cleared successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to clear CSRF token', {
        error: error.message,
        sessionId: this.getSessionId(request),
      });
      throw error;
    }
  }

  /**
   * Get CSRF token status and configuration
   */
  @Get('status')
  @CsrfExempt()
  @ApiOperation({ 
    summary: 'Get CSRF status',
    description: 'Returns CSRF protection status and configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'CSRF status retrieved successfully'
  })
  getCsrfStatus(@Req() request: Request) {
    const hasToken = !!this.csrfTokenService.getOrCreateToken(request, null as any);
    const isExpired = this.csrfTokenService.isTokenExpired(request);
    const expiry = this.csrfTokenService.getTokenExpiry(request);
    const config = this.csrfTokenService.getTokenConfig();

    return {
      enabled: process.env.ENABLE_CSRF_PROTECTION === 'true',
      hasToken,
      isExpired,
      expiry: expiry?.toISOString() || null,
      config,
      recommendations: {
        shouldRefresh: isExpired,
        nextAction: hasToken && !isExpired ? 'ready' : 'obtain_token',
      },
    };
  }

  /**
   * Helper method to get session ID
   */
  private getSessionId(request: Request): string {
    if (request.session && (request.session as any).id) {
      return (request.session as any).id;
    }
    return 'no-session';
  }

  /**
   * Helper method to get client IP
   */
  private getClientIp(request: Request): string {
    return (
      request.get('X-Forwarded-For') ||
      request.get('X-Real-IP') ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}