import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
  slowCallThreshold: number;
  slowCallRateThreshold: number;
  minimumCalls: number;
}

export interface CircuitBreakerMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  slowCalls: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateTransitions: Array<{
    from: CircuitBreakerState;
    to: CircuitBreakerState;
    timestamp: Date;
    reason: string;
  }>;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuitBreakers = new Map<string, {
    state: CircuitBreakerState;
    config: CircuitBreakerConfig;
    metrics: CircuitBreakerMetrics;
    lastStateChange: Date;
    nextAttemptTime?: Date;
    consecutiveSuccesses: number;
  }>();

  constructor(private configService: ConfigService) {}

  /**
   * Create or get a circuit breaker for a specific service/operation
   */
  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>) {
    if (!this.circuitBreakers.has(name)) {
      this.createCircuitBreaker(name, config);
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    circuitBreakerName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(circuitBreakerName, config);
    
    // Check if circuit breaker allows the call
    if (!this.canExecute(breaker)) {
      this.logger.warn(`Circuit breaker ${circuitBreakerName} is OPEN - calling fallback`);
      if (fallback) {
        return await fallback();
      }
      throw new Error(`Circuit breaker ${circuitBreakerName} is OPEN and no fallback provided`);
    }

    const startTime = Date.now();
    let success = false;
    
    try {
      // Set timeout for the operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), breaker.config.timeout);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      success = true;
      
      const duration = Date.now() - startTime;
      this.recordSuccess(breaker, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(breaker, error as Error, duration);
      
      // If fallback is available and we should use it
      if (fallback && this.shouldUseFallback(breaker, error as Error)) {
        this.logger.warn(`Operation failed, using fallback for ${circuitBreakerName}:`, error);
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Create a new circuit breaker with default configuration
   */
  private createCircuitBreaker(name: string, configOverrides?: Partial<CircuitBreakerConfig>) {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: this.configService.get('CIRCUIT_BREAKER_FAILURE_THRESHOLD', 5),
      recoveryTimeout: this.configService.get('CIRCUIT_BREAKER_RECOVERY_TIMEOUT', 60000), // 1 minute
      successThreshold: this.configService.get('CIRCUIT_BREAKER_SUCCESS_THRESHOLD', 3),
      timeout: this.configService.get('CIRCUIT_BREAKER_TIMEOUT', 30000), // 30 seconds
      monitoringPeriod: this.configService.get('CIRCUIT_BREAKER_MONITORING_PERIOD', 60000), // 1 minute
      slowCallThreshold: this.configService.get('CIRCUIT_BREAKER_SLOW_CALL_THRESHOLD', 5000), // 5 seconds
      slowCallRateThreshold: this.configService.get('CIRCUIT_BREAKER_SLOW_CALL_RATE_THRESHOLD', 0.5), // 50%
      minimumCalls: this.configService.get('CIRCUIT_BREAKER_MINIMUM_CALLS', 10),
    };

    const config = { ...defaultConfig, ...configOverrides };

    const breaker = {
      state: CircuitBreakerState.CLOSED,
      config,
      metrics: {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        slowCalls: 0,
        stateTransitions: [],
      } as CircuitBreakerMetrics,
      lastStateChange: new Date(),
      consecutiveSuccesses: 0,
    };

    this.circuitBreakers.set(name, breaker);
    this.logger.log(`Created circuit breaker: ${name}`, config);
  }

  /**
   * Check if the circuit breaker allows execution
   */
  private canExecute(breaker: any): boolean {
    const now = new Date();
    
    switch (breaker.state) {
      case CircuitBreakerState.CLOSED:
        return true;
        
      case CircuitBreakerState.OPEN:
        // Check if recovery timeout has passed
        if (breaker.nextAttemptTime && now >= breaker.nextAttemptTime) {
          this.transitionTo(breaker, CircuitBreakerState.HALF_OPEN, 'Recovery timeout elapsed');
          return true;
        }
        return false;
        
      case CircuitBreakerState.HALF_OPEN:
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(breaker: any, duration: number) {
    breaker.metrics.totalCalls++;
    breaker.metrics.successfulCalls++;
    breaker.metrics.lastSuccessTime = new Date();
    
    if (duration > breaker.config.slowCallThreshold) {
      breaker.metrics.slowCalls++;
    }

    // Handle state transitions based on success
    if (breaker.state === CircuitBreakerState.HALF_OPEN) {
      breaker.consecutiveSuccesses++;
      if (breaker.consecutiveSuccesses >= breaker.config.successThreshold) {
        this.transitionTo(breaker, CircuitBreakerState.CLOSED, 'Sufficient successful calls in half-open state');
      }
    }

    // Reset consecutive successes if we're in closed state
    if (breaker.state === CircuitBreakerState.CLOSED) {
      breaker.consecutiveSuccesses = 0;
    }

    this.evaluateCircuitState(breaker);
  }

  /**
   * Record a failed operation
   */
  private recordFailure(breaker: any, error: Error, duration: number) {
    breaker.metrics.totalCalls++;
    breaker.metrics.failedCalls++;
    breaker.metrics.lastFailureTime = new Date();
    
    if (duration > breaker.config.slowCallThreshold) {
      breaker.metrics.slowCalls++;
    }

    // Reset consecutive successes on failure
    breaker.consecutiveSuccesses = 0;

    // If we're in half-open state, go back to open on any failure
    if (breaker.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionTo(breaker, CircuitBreakerState.OPEN, `Failure in half-open state: ${error.message}`);
      return;
    }

    this.evaluateCircuitState(breaker);
  }

  /**
   * Evaluate if circuit state should change based on current metrics
   */
  private evaluateCircuitState(breaker: any) {
    const metrics = breaker.metrics;
    const config = breaker.config;
    
    // Only evaluate if we have minimum number of calls
    if (metrics.totalCalls < config.minimumCalls) {
      return;
    }

    // Calculate failure rate within monitoring period
    const now = new Date();
    const monitoringPeriodStart = new Date(now.getTime() - config.monitoringPeriod);
    
    // For simplicity, we'll use overall failure rate
    // In production, you might want to maintain a sliding window
    const failureRate = metrics.failedCalls / metrics.totalCalls;
    const slowCallRate = metrics.slowCalls / metrics.totalCalls;
    
    // Check if we should open the circuit
    if (breaker.state === CircuitBreakerState.CLOSED) {
      const shouldOpen = (
        failureRate >= (config.failureThreshold / 100) ||
        slowCallRate >= config.slowCallRateThreshold
      );
      
      if (shouldOpen) {
        const reason = failureRate >= (config.failureThreshold / 100) 
          ? `High failure rate: ${(failureRate * 100).toFixed(2)}%`
          : `High slow call rate: ${(slowCallRate * 100).toFixed(2)}%`;
        
        this.transitionTo(breaker, CircuitBreakerState.OPEN, reason);
      }
    }
  }

  /**
   * Transition circuit breaker to a new state
   */
  private transitionTo(breaker: any, newState: CircuitBreakerState, reason: string) {
    const oldState = breaker.state;
    breaker.state = newState;
    breaker.lastStateChange = new Date();
    
    // Set next attempt time for open state
    if (newState === CircuitBreakerState.OPEN) {
      breaker.nextAttemptTime = new Date(Date.now() + breaker.config.recoveryTimeout);
    } else {
      breaker.nextAttemptTime = undefined;
    }

    // Record state transition
    breaker.metrics.stateTransitions.push({
      from: oldState,
      to: newState,
      timestamp: new Date(),
      reason,
    });

    // Keep only last 100 transitions
    if (breaker.metrics.stateTransitions.length > 100) {
      breaker.metrics.stateTransitions = breaker.metrics.stateTransitions.slice(-100);
    }

    this.logger.warn(`Circuit breaker state transition: ${oldState} -> ${newState}. Reason: ${reason}`);
  }

  /**
   * Determine if fallback should be used based on error type
   */
  private shouldUseFallback(breaker: any, error: Error): boolean {
    // Use fallback for timeouts and network errors
    const useFallbackErrors = [
      'Operation timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
    ];
    
    return useFallbackErrors.some(errorType => 
      error.message.includes(errorType) || error.name.includes(errorType)
    );
  }

  /**
   * Get circuit breaker status and metrics
   */
  getStatus(name: string) {
    const breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      return null;
    }

    const metrics = breaker.metrics;
    const failureRate = metrics.totalCalls > 0 ? (metrics.failedCalls / metrics.totalCalls) * 100 : 0;
    const successRate = metrics.totalCalls > 0 ? (metrics.successfulCalls / metrics.totalCalls) * 100 : 0;
    const slowCallRate = metrics.totalCalls > 0 ? (metrics.slowCalls / metrics.totalCalls) * 100 : 0;

    return {
      name,
      state: breaker.state,
      config: breaker.config,
      metrics: {
        ...metrics,
        failureRate: Number(failureRate.toFixed(2)),
        successRate: Number(successRate.toFixed(2)),
        slowCallRate: Number(slowCallRate.toFixed(2)),
      },
      lastStateChange: breaker.lastStateChange,
      nextAttemptTime: breaker.nextAttemptTime,
      consecutiveSuccesses: breaker.consecutiveSuccesses,
    };
  }

  /**
   * Get all circuit breakers status
   */
  getAllStatus() {
    const statuses = {};
    for (const [name] of this.circuitBreakers) {
      statuses[name] = this.getStatus(name);
    }
    return statuses;
  }

  /**
   * Reset a circuit breaker (useful for testing or manual intervention)
   */
  reset(name: string) {
    const breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      throw new Error(`Circuit breaker ${name} not found`);
    }

    breaker.state = CircuitBreakerState.CLOSED;
    breaker.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      slowCalls: 0,
      stateTransitions: [],
    };
    breaker.lastStateChange = new Date();
    breaker.nextAttemptTime = undefined;
    breaker.consecutiveSuccesses = 0;

    this.logger.log(`Reset circuit breaker: ${name}`);
  }

  /**
   * Force circuit breaker to open state (useful for maintenance)
   */
  forceOpen(name: string, reason = 'Manual intervention') {
    const breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      throw new Error(`Circuit breaker ${name} not found`);
    }

    this.transitionTo(breaker, CircuitBreakerState.OPEN, reason);
  }

  /**
   * Force circuit breaker to closed state
   */
  forceClosed(name: string, reason = 'Manual intervention') {
    const breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      throw new Error(`Circuit breaker ${name} not found`);
    }

    this.transitionTo(breaker, CircuitBreakerState.CLOSED, reason);
  }
}