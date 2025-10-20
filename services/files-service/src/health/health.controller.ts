import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'files-service',
      version: '1.0.0'
    };
  }
}
