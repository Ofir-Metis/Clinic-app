import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TimeoutConfig {
  defaultTimeout: number;
  gracefulShutdownTimeout: number;
  maxConcurrentTimeouts: number;
}

export interface TimeoutMetrics {
  totalOperations: number;
  timedOutOperations: number;
  successfulOperations: number;
  averageExecutionTime: number;
  timeoutRate: number;
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    public readonly operationName?: string
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

@Injectable()
export class TimeoutService {
  private readonly logger = new Logger(TimeoutService.name);
  private timeoutMetrics = new Map<string, TimeoutMetrics>();
  private activeTimeouts = new Set<NodeJS.Timeout>();
  private config: TimeoutConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      defaultTimeout: this.configService.get('TIMEOUT_DEFAULT', 30000), // 30 seconds
      gracefulShutdownTimeout: this.configService.get('TIMEOUT_GRACEFUL_SHUTDOWN', 10000), // 10 seconds
      maxConcurrentTimeouts: this.configService.get('TIMEOUT_MAX_CONCURRENT', 1000),
    };
  }

  /**
   * Execute an operation with timeout
   */
  async execute<T>(
    operationName: string,
    operation: () => Promise<T>,
    timeoutMs?: number,
    onTimeout?: () => void
  ): Promise<T> {
    const timeout = timeoutMs || this.config.defaultTimeout;
    const startTime = Date.now();

    // Initialize metrics if not exists
    if (!this.timeoutMetrics.has(operationName)) {
      this.timeoutMetrics.set(operationName, {
        totalOperations: 0,
        timedOutOperations: 0,
        successfulOperations: 0,
        averageExecutionTime: 0,
        timeoutRate: 0,
      });
    }

    const metrics = this.timeoutMetrics.get(operationName)!;
    metrics.totalOperations++;

    // Check if we've reached max concurrent timeouts
    if (this.activeTimeouts.size >= this.config.maxConcurrentTimeouts) {
      this.logger.warn(
        `Maximum concurrent timeouts reached (${this.config.maxConcurrentTimeouts}), ` +
        `executing operation '${operationName}' without timeout`
      );
      
      try {
        const result = await operation();
        this.updateSuccessMetrics(metrics, Date.now() - startTime);
        return result;
      } catch (error) {
        throw error;
      }
    }

    return new Promise<T>((resolve, reject) => {
      let isCompleted = false;
      
      // Create timeout handler
      const timeoutHandle = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          this.activeTimeouts.delete(timeoutHandle);
          
          // Update timeout metrics
          metrics.timedOutOperations++;
          this.updateTimeoutRate(metrics);
          
          // Call timeout callback if provided
          if (onTimeout) {
            try {
              onTimeout();
            } catch (callbackError) {
              this.logger.error('Error in timeout callback:', callbackError);
            }
          }

          const error = new TimeoutError(
            `Operation '${operationName}' timed out after ${timeout}ms`,
            timeout,
            operationName
          );
          
          this.logger.error(error.message);
          reject(error);
        }
      }, timeout);

      this.activeTimeouts.add(timeoutHandle);

      // Execute the operation
      operation()
        .then(result => {
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutHandle);
            this.activeTimeouts.delete(timeoutHandle);
            
            // Update success metrics
            this.updateSuccessMetrics(metrics, Date.now() - startTime);
            resolve(result);
          }
        })
        .catch(error => {
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutHandle);
            this.activeTimeouts.delete(timeoutHandle);
            reject(error);
          }
        });
    });
  }

  /**
   * Execute with adaptive timeout based on historical performance
   */
  async executeWithAdaptiveTimeout<T>(
    operationName: string,
    operation: () => Promise<T>,
    baseTimeoutMs?: number,
    adaptiveFactor: number = 1.5
  ): Promise<T> {
    const baseTimeout = baseTimeoutMs || this.config.defaultTimeout;
    const metrics = this.timeoutMetrics.get(operationName);
    
    let adaptiveTimeout = baseTimeout;
    
    if (metrics && metrics.averageExecutionTime > 0) {
      // Use average execution time with a multiplier as adaptive timeout
      adaptiveTimeout = Math.max(
        Math.min(metrics.averageExecutionTime * adaptiveFactor, baseTimeout * 2),
        baseTimeout * 0.5
      );
      
      this.logger.debug(
        `Using adaptive timeout for '${operationName}': ${adaptiveTimeout}ms ` +
        `(avg: ${metrics.averageExecutionTime}ms, base: ${baseTimeout}ms)`
      );
    }

    return this.execute(operationName, operation, adaptiveTimeout);
  }

  /**
   * Execute with progressive timeout (starts with short timeout, increases on retries)
   */
  async executeWithProgressiveTimeout<T>(
    operationName: string,
    operation: () => Promise<T>,
    baseTimeoutMs: number = 5000,
    maxTimeoutMs: number = 30000,
    timeoutMultiplier: number = 2,
    maxAttempts: number = 3
  ): Promise<T> {
    let currentTimeout = baseTimeoutMs;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.execute(
          `${operationName}-progressive-${attempt}`,
          operation,
          currentTimeout
        );
      } catch (error) {
        lastError = error as Error;
        
        // If it's not a timeout error or this is the last attempt, throw
        if (!(error instanceof TimeoutError) || attempt === maxAttempts) {
          throw error;
        }

        // Increase timeout for next attempt
        currentTimeout = Math.min(currentTimeout * timeoutMultiplier, maxTimeoutMs);
        
        this.logger.warn(
          `Progressive timeout attempt ${attempt} failed for '${operationName}', ` +
          `increasing timeout to ${currentTimeout}ms`
        );
      }
    }

    throw lastError!;
  }

  /**
   * Execute multiple operations concurrently with timeout
   */
  async executeAll<T>(
    operations: Array<{
      name: string;
      operation: () => Promise<T>;
      timeout?: number;
    }>,
    globalTimeoutMs?: number
  ): Promise<T[]> {
    const promises = operations.map(({ name, operation, timeout }) =>
      this.execute(name, operation, timeout)
    );

    if (globalTimeoutMs) {
      const globalTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(
            `Global timeout of ${globalTimeoutMs}ms exceeded for batch operations`,
            globalTimeoutMs,
            'batch-operations'
          ));
        }, globalTimeoutMs);
      });

      return Promise.race([
        Promise.all(promises),
        globalTimeoutPromise
      ]);
    }

    return Promise.all(promises);
  }

  /**
   * Execute with race condition (first successful result wins)
   */
  async executeRace<T>(
    operations: Array<{
      name: string;
      operation: () => Promise<T>;
      timeout?: number;
    }>,
    globalTimeoutMs?: number
  ): Promise<T> {
    const promises = operations.map(({ name, operation, timeout }) =>
      this.execute(name, operation, timeout)
    );

    if (globalTimeoutMs) {
      const globalTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(
            `Global timeout of ${globalTimeoutMs}ms exceeded for race operations`,
            globalTimeoutMs,
            'race-operations'
          ));
        }, globalTimeoutMs);
      });

      return Promise.race([
        Promise.race(promises),
        globalTimeoutPromise
      ]);
    }

    return Promise.race(promises);
  }

  /**
   * Create a timeout-wrapped function
   */
  wrap<T extends any[], R>(
    operationName: string,
    fn: (...args: T) => Promise<R>,
    timeoutMs?: number
  ): (...args: T) => Promise<R> {
    return (...args: T) => {
      return this.execute(operationName, () => fn(...args), timeoutMs);
    };
  }

  /**
   * Set timeout for a promise
   */
  static promiseTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage?: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new TimeoutError(
          errorMessage || `Promise timed out after ${timeoutMs}ms`,
          timeoutMs
        ));
      }, timeoutMs);

      promise
        .then(result => {
          clearTimeout(timeoutHandle);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutHandle);
          reject(error);
        });
    });
  }

  /**
   * Update success metrics
   */
  private updateSuccessMetrics(metrics: TimeoutMetrics, executionTime: number) {
    metrics.successfulOperations++;
    
    // Update average execution time using exponential moving average
    if (metrics.averageExecutionTime === 0) {
      metrics.averageExecutionTime = executionTime;
    } else {
      const alpha = 0.1; // Smoothing factor
      metrics.averageExecutionTime = 
        alpha * executionTime + (1 - alpha) * metrics.averageExecutionTime;
    }
    
    this.updateTimeoutRate(metrics);
  }

  /**
   * Update timeout rate
   */
  private updateTimeoutRate(metrics: TimeoutMetrics) {
    if (metrics.totalOperations > 0) {
      metrics.timeoutRate = (metrics.timedOutOperations / metrics.totalOperations) * 100;
    }
  }

  /**
   * Get timeout metrics for an operation
   */
  getMetrics(operationName: string): TimeoutMetrics | null {
    return this.timeoutMetrics.get(operationName) || null;
  }

  /**
   * Get all timeout metrics
   */
  getAllMetrics(): Record<string, TimeoutMetrics> {
    const allMetrics: Record<string, TimeoutMetrics> = {};
    for (const [name, metrics] of this.timeoutMetrics) {
      allMetrics[name] = { ...metrics };
    }
    return allMetrics;
  }

  /**
   * Get current timeout configuration
   */
  getConfig(): TimeoutConfig {
    return { ...this.config };
  }

  /**
   * Update timeout configuration
   */
  updateConfig(newConfig: Partial<TimeoutConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.logger.log('Timeout configuration updated', this.config);
  }

  /**
   * Get active timeout count
   */
  getActiveTimeoutCount(): number {
    return this.activeTimeouts.size;
  }

  /**
   * Clear all active timeouts (useful for graceful shutdown)
   */
  clearAllTimeouts() {
    for (const timeout of this.activeTimeouts) {
      clearTimeout(timeout);
    }
    this.activeTimeouts.clear();
    this.logger.log('All active timeouts cleared');
  }

  /**
   * Clear metrics for an operation
   */
  clearMetrics(operationName: string) {
    this.timeoutMetrics.delete(operationName);
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics() {
    this.timeoutMetrics.clear();
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(): Promise<void> {
    this.logger.log('Starting graceful shutdown of timeout service...');
    
    const shutdownPromise = new Promise<void>((resolve) => {
      if (this.activeTimeouts.size === 0) {
        resolve();
        return;
      }

      // Wait for active operations to complete or timeout
      const checkInterval = setInterval(() => {
        if (this.activeTimeouts.size === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    try {
      await TimeoutService.promiseTimeout(
        shutdownPromise,
        this.config.gracefulShutdownTimeout,
        'Graceful shutdown timeout exceeded'
      );
      this.logger.log('Graceful shutdown completed');
    } catch (error) {
      this.logger.warn('Graceful shutdown timeout, forcing cleanup');
      this.clearAllTimeouts();
    }
  }
}