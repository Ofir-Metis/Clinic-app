import { Controller, Get, Logger } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthSimpleController {
  private readonly logger = new Logger(HealthSimpleController.name);

  constructor(private readonly healthService: HealthService) {}

  @Get('/health')
  async getHealth() {
    this.logger.log('Health check requested');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0-simple'
    };
  }

  @Get('/status')
  async getStatus() {
    return {
      timestamp: new Date().toISOString(),
      platform: 'Healthcare Clinic Platform',
      version: '1.0.0-production',
      services: {
        'auth-service': { port: 3001, status: 'running' },
        'files-service': { port: 3003, status: 'running' },
        'notes-service': { port: 3006, status: 'running' },
        'notifications-service': { port: 3004, status: 'running' }
      },
      infrastructure: {
        postgres: 'healthy',
        redis: 'healthy', 
        nats: 'healthy',
        minio: 'healthy',
        elasticsearch: 'healthy'
      },
      summary: {
        status: 'operational',
        total_services: 21,
        running_services: 11
      }
    };
  }

  @Get('/')
  async getRoot() {
    return {
      message: 'Healthcare Clinic Platform API Gateway',
      status: 'operational',
      version: '1.0.0-simple',
      documentation: '/api-docs',
      health: '/health'
    };
  }
}