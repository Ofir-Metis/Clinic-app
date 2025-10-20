/**
 * Health Service - Enterprise-grade service health monitoring
 * Monitors backend microservices health and availability
 */

import { Injectable, Logger } from '@nestjs/common';
// import { CentralizedLoggerService } from '@clinic/common'; // Temporarily disabled

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  
  // Backend service configuration
  private readonly services = {
    'auth-service': { port: 3001, critical: true },
    'appointments-service': { port: 3002, critical: false },
    'files-service': { port: 3003, critical: true },
    'notifications-service': { port: 3004, critical: false },
    'ai-service': { port: 3005, critical: false },
    'notes-service': { port: 3006, critical: false },
    'analytics-service': { port: 3007, critical: false },
    'settings-service': { port: 3008, critical: false },
    'billing-service': { port: 3009, critical: false },
  };

  // constructor(private readonly centralizedLogger: CentralizedLoggerService) {} // Temporarily disabled

  /**
   * Check health of all configured services
   */
  async checkAllServices(): Promise<Record<string, ServiceHealth>> {
    const serviceNames = Object.keys(this.services);
    return this.checkServices(serviceNames);
  }

  /**
   * Check health of specific services
   */
  async checkServices(serviceNames: string[]): Promise<Record<string, ServiceHealth>> {
    const healthChecks = serviceNames.map(async (serviceName) => {
      const health = await this.checkService(serviceName);
      return { serviceName, health };
    });

    const results = await Promise.allSettled(healthChecks);
    
    const serviceHealths: Record<string, ServiceHealth> = {};
    
    results.forEach((result, index) => {
      const serviceName = serviceNames[index];
      
      if (result.status === 'fulfilled') {
        serviceHealths[serviceName] = result.value.health;
      } else {
        serviceHealths[serviceName] = {
          status: 'unhealthy',
          error: result.reason?.message || 'Health check failed'
        };
        
        this.logger.error(`Health check failed for ${serviceName}`, result.reason?.stack);
      }
    });

    return serviceHealths;
  }

  /**
   * Check health of a single service
   */
  async checkService(serviceName: string): Promise<ServiceHealth> {
    const serviceConfig = this.services[serviceName];
    
    if (!serviceConfig) {
      return {
        status: 'unhealthy',
        error: 'Service not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      const response = await this.makeHealthRequest(serviceConfig.port);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.logger.log(`Health check successful for ${serviceName}`);

        return {
          status: 'healthy',
          responseTime
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          error: `HTTP ${response.status}`
        };
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.warn(`Health check failed for ${serviceName}`);

      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
    }
  }

  /**
   * Make HTTP request to service health endpoint
   */
  private async makeHealthRequest(port: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'api-gateway-health-check',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get critical services status
   */
  async getCriticalServicesHealth(): Promise<Record<string, ServiceHealth>> {
    const criticalServices = Object.entries(this.services)
      .filter(([, config]) => config.critical)
      .map(([name]) => name);
      
    return this.checkServices(criticalServices);
  }

  /**
   * Check if system is ready to serve requests
   */
  async isSystemReady(): Promise<boolean> {
    const criticalHealth = await this.getCriticalServicesHealth();
    
    return Object.values(criticalHealth)
      .every(health => health.status === 'healthy');
  }

  /**
   * Get service configuration
   */
  getServiceConfig(serviceName: string) {
    return this.services[serviceName];
  }

  /**
   * Get all configured services
   */
  getConfiguredServices() {
    return Object.keys(this.services);
  }
}