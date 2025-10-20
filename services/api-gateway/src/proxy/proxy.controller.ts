/**
 * Proxy Controller - Enterprise-grade microservice routing
 * Handles requests and routes them to appropriate backend services
 */

import { 
  Controller, 
  All, 
  Req, 
  Res, 
  Param, 
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { CentralizedLoggerService } from '@clinic/common';

@ApiTags('Proxy')
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(
    private readonly proxyService: ProxyService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {}

  @All('auth/*')
  @ApiOperation({ summary: 'Proxy requests to Authentication Service' })
  @ApiParam({ name: 'path', type: 'string', description: 'Service path' })
  @ApiResponse({ status: 200, description: 'Request successfully proxied' })
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('auth-service', 3001, req, res);
  }

  @All('appointments/*')
  @ApiOperation({ summary: 'Proxy requests to Appointments Service' })
  async proxyAppointments(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('appointments-service', 3002, req, res);
  }

  @All('files/*')
  @ApiOperation({ summary: 'Proxy requests to Files Service' })
  async proxyFiles(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('files-service', 3003, req, res);
  }

  @All('notifications/*')
  @ApiOperation({ summary: 'Proxy requests to Notifications Service' })
  async proxyNotifications(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('notifications-service', 3004, req, res);
  }

  @All('ai/*')
  @ApiOperation({ summary: 'Proxy requests to AI Service' })
  async proxyAI(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('ai-service', 3005, req, res);
  }

  @All('notes/*')
  @ApiOperation({ summary: 'Proxy requests to Notes Service' })
  async proxyNotes(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('notes-service', 3006, req, res);
  }

  private async proxyToService(
    serviceName: string, 
    port: number, 
    req: Request, 
    res: Response
  ) {
    const startTime = Date.now();
    
    try {
      this.centralizedLogger.log(`Proxying request to ${serviceName}`, ProxyController.name);

      await this.proxyService.forwardRequest(serviceName, port, req, res);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Proxy to ${serviceName} completed in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.centralizedLogger.error(`Proxy error for ${serviceName}`, error.stack, ProxyController.name);

      if (!res.headersSent) {
        throw new HttpException(
          `Service ${serviceName} temporarily unavailable`,
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }
    }
  }
}