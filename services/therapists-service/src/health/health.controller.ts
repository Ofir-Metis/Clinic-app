import { Controller, Get } from '@nestjs/common';

/**
 * Simple health check endpoint.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
