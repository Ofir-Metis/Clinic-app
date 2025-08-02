import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingService {
  async getMetrics() {
    return {
      service: 'billing-service',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}