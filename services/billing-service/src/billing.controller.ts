import { Controller, Get } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'billing-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  async getMetrics() {
    return this.billingService.getMetrics();
  }
}