/**
 * Circuit Breaker Service
 * Implements circuit breaker pattern for resilient microservice communication
 */

import { Injectable, Logger } from '@nestjs/common';
import { ProductionConfigService } from '../config/production.config';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  timeout: number;
  errorThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  requests: number;
  errorRate: number;
  lastFailureTime?: Date;
  nextAttempt?: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerInstance>();
  private readonly options: CircuitBreakerOptions;

  constructor(private readonly configService: ProductionConfigService) {
    const serviceConfig = this.configService.getServiceConfig();
    
    this.options = {
      timeout: serviceConfig.circuitBreakerTimeout,
      errorThreshold: serviceConfig.circuitBreakerThreshold,
      resetTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
    };

    // Start monitoring circuit breakers
    this.startMonitoring();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string, 
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(serviceName);
    
    // Check if circuit is open
    if (circuit.state === CircuitState.OPEN) {
      if (Date.now() - circuit.lastFailureTime < this.options.resetTimeout) {
        const error = new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
        this.logger.warn(`Circuit breaker blocked request to ${serviceName}`);
        
        if (fallback) {
          this.logger.log(`Executing fallback for ${serviceName}`);
          return await fallback();
        }
        
        throw error;
      } else {
        // Try to close the circuit
        circuit.state = CircuitState.HALF_OPEN;
        this.logger.log(`Circuit breaker for ${serviceName} moved to HALF_OPEN state`);
      }
    }

    const startTime = Date.now();
    
    try {
      // Execute the operation with timeout
      const result = await this.executeWithTimeout(operation, this.options.timeout);
      
      // Record success
      circuit.successes++;
      circuit.requests++;
      
      if (circuit.state === CircuitState.HALF_OPEN) {
        circuit.state = CircuitState.CLOSED;
        circuit.failures = 0;
        this.logger.log(`Circuit breaker for ${serviceName} moved to CLOSED state`);
      }

      const duration = Date.now() - startTime;
      this.logger.debug(`Service call to ${serviceName} succeeded in ${duration}ms`);
      
      return result;
    } catch (error) {
      // Record failure
      circuit.failures++;
      circuit.requests++;
      circuit.lastFailureTime = Date.now();

      const errorRate = circuit.failures / circuit.requests;
      
      // Check if we should open the circuit
      if (circuit.failures >= this.options.errorThreshold && errorRate >= 0.5) {
        circuit.state = CircuitState.OPEN;
        this.logger.error(`Circuit breaker for ${serviceName} moved to OPEN state. Failures: ${circuit.failures}, Error rate: ${(errorRate * 100).toFixed(1)}%`);
      }

      const duration = Date.now() - startTime;
      this.logger.error(`Service call to ${serviceName} failed after ${duration}ms:`, error.message);

      if (fallback) {
        this.logger.log(`Executing fallback for ${serviceName}`);
        try {
          return await fallback();
        } catch (fallbackError) {
          this.logger.error(`Fallback for ${serviceName} also failed:`, fallbackError.message);
          throw error; // Throw original error
        }
      }

      throw error;
    }
  }

  /**
   * Get circuit breaker statistics for a service
   */
  getStats(serviceName: string): CircuitBreakerStats | null {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return null;

    const errorRate = circuit.requests > 0 ? circuit.failures / circuit.requests : 0;
    
    return {
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
      requests: circuit.requests,
      errorRate: Math.round(errorRate * 100) / 100,
      lastFailureTime: circuit.lastFailureTime ? new Date(circuit.lastFailureTime) : undefined,
      nextAttempt: circuit.state === CircuitState.OPEN && circuit.lastFailureTime 
        ? new Date(circuit.lastFailureTime + this.options.resetTimeout)
        : undefined,
    };
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [serviceName] of this.circuits) {
      const serviceStats = this.getStats(serviceName);
      if (serviceStats) {
        stats[serviceName] = serviceStats;
      }
    }
    
    return stats;
  }

  /**
   * Reset circuit breaker for a service
   */
  reset(serviceName: string): void {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.requests = 0;
      circuit.lastFailureTime = 0;
      this.logger.log(`Circuit breaker for ${serviceName} has been reset`);
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const [serviceName] of this.circuits) {
      this.reset(serviceName);
    }
    this.logger.log('All circuit breakers have been reset');
  }

  private getOrCreateCircuit(serviceName: string): CircuitBreakerInstance {
    if (!this.circuits.has(serviceName)) {
      this.circuits.set(serviceName, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        requests: 0,
        lastFailureTime: 0,
      });
      
      this.logger.log(`Created new circuit breaker for service: ${serviceName}`);
    }

    return this.circuits.get(serviceName)!;
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>, 
    timeout: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.resetStatistics();
      this.logCircuitBreakerStats();
    }, this.options.monitoringPeriod);
  }

  private resetStatistics(): void {
    // Reset statistics every monitoring period to prevent memory growth
    // and provide rolling window statistics
    for (const [serviceName, circuit] of this.circuits) {
      if (circuit.state === CircuitState.CLOSED && circuit.requests > 100) {
        // Keep some history but prevent unbounded growth
        circuit.failures = Math.floor(circuit.failures * 0.9);
        circuit.successes = Math.floor(circuit.successes * 0.9);
        circuit.requests = circuit.failures + circuit.successes;
      }
    }
  }

  private logCircuitBreakerStats(): void {
    const stats = this.getAllStats();
    const activeCircuits = Object.keys(stats).length;
    
    if (activeCircuits > 0) {
      this.logger.debug(`Circuit Breaker Status - ${activeCircuits} active circuits`);
      
      for (const [serviceName, stat] of Object.entries(stats)) {
        if (stat.state !== CircuitState.CLOSED || stat.failures > 0) {
          this.logger.debug(`  ${serviceName}: ${stat.state} - Requests: ${stat.requests}, Failures: ${stat.failures}, Error Rate: ${(stat.errorRate * 100).toFixed(1)}%`);
        }
      }
    }
  }
}

interface CircuitBreakerInstance {
  state: CircuitState;
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime: number;
}