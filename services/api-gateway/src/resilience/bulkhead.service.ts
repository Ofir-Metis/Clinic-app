import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BulkheadConfig {
  maxConcurrentCalls: number;
  maxWaitingCalls: number;
  timeout: number;
  isolateFailures: boolean;
}

export interface BulkheadMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  rejectedCalls: number;
  currentActiveCalls: number;
  currentWaitingCalls: number;
  averageExecutionTime: number;
  maxWaitTime: number;
  rejectionRate: number;
}

export class BulkheadRejectionError extends Error {
  constructor(message: string, public readonly bulkheadName: string) {
    super(message);
    this.name = 'BulkheadRejectionError';
  }
}

interface CallRequest<T> {
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
  timeoutHandle?: NodeJS.Timeout;
}

@Injectable()
export class BulkheadService {
  private readonly logger = new Logger(BulkheadService.name);
  private bulkheads = new Map<string, {
    config: BulkheadConfig;
    metrics: BulkheadMetrics;
    activeCalls: Set<Promise<any>>;
    waitingQueue: CallRequest<any>[];
  }>();

  constructor(private configService: ConfigService) {}

  /**
   * Create or get a bulkhead for a specific resource/operation
   */
  private getBulkhead(name: string, config?: Partial<BulkheadConfig>) {
    if (!this.bulkheads.has(name)) {
      this.createBulkhead(name, config);
    }
    return this.bulkheads.get(name)!;
  }

  /**
   * Execute an operation with bulkhead isolation
   */
  async execute<T>(
    bulkheadName: string,
    operation: () => Promise<T>,
    config?: Partial<BulkheadConfig>
  ): Promise<T> {
    const bulkhead = this.getBulkhead(bulkheadName, config);
    const startTime = Date.now();

    bulkhead.metrics.totalCalls++;

    // Check if we can execute immediately
    if (bulkhead.activeCalls.size < bulkhead.config.maxConcurrentCalls) {
      return this.executeImmediate(bulkhead, operation, startTime);
    }

    // Check if we can queue the request
    if (bulkhead.waitingQueue.length >= bulkhead.config.maxWaitingCalls) {
      bulkhead.metrics.rejectedCalls++;
      this.updateRejectionRate(bulkhead.metrics);
      
      const error = new BulkheadRejectionError(
        `Bulkhead '${bulkheadName}' is full. Active: ${bulkhead.activeCalls.size}, ` +
        `Waiting: ${bulkhead.waitingQueue.length}, Max waiting: ${bulkhead.config.maxWaitingCalls}`,
        bulkheadName
      );
      
      this.logger.warn(error.message);
      throw error;
    }

    // Queue the request
    return this.executeQueued(bulkhead, operation, startTime, bulkheadName);
  }

  /**
   * Execute operation immediately
   */
  private async executeImmediate<T>(
    bulkhead: any,
    operation: () => Promise<T>,
    startTime: number
  ): Promise<T> {
    const promise = this.executeWithTracking(bulkhead, operation, startTime);
    bulkhead.activeCalls.add(promise);
    
    try {
      return await promise;
    } finally {
      bulkhead.activeCalls.delete(promise);
      this.processQueue(bulkhead);
    }
  }

  /**
   * Execute operation from queue
   */
  private executeQueued<T>(
    bulkhead: any,
    operation: () => Promise<T>,
    startTime: number,
    bulkheadName: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const callRequest: CallRequest<T> = {
        operation,
        resolve,
        reject,
        timestamp: startTime,
      };

      // Set timeout for waiting in queue
      if (bulkhead.config.timeout > 0) {
        callRequest.timeoutHandle = setTimeout(() => {
          // Remove from queue if still there
          const index = bulkhead.waitingQueue.indexOf(callRequest);
          if (index !== -1) {
            bulkhead.waitingQueue.splice(index, 1);
            bulkhead.metrics.rejectedCalls++;
            this.updateRejectionRate(bulkhead.metrics);
            
            reject(new BulkheadRejectionError(
              `Bulkhead '${bulkheadName}' queue timeout after ${bulkhead.config.timeout}ms`,
              bulkheadName
            ));
          }
        }, bulkhead.config.timeout);
      }

      bulkhead.waitingQueue.push(callRequest);
      bulkhead.metrics.currentWaitingCalls = bulkhead.waitingQueue.length;
    });
  }

  /**
   * Execute operation with performance tracking
   */
  private async executeWithTracking<T>(
    bulkhead: any,
    operation: () => Promise<T>,
    startTime: number
  ): Promise<T> {
    bulkhead.metrics.currentActiveCalls = bulkhead.activeCalls.size;
    
    try {
      const result = await operation();
      
      const executionTime = Date.now() - startTime;
      bulkhead.metrics.successfulCalls++;
      this.updateAverageExecutionTime(bulkhead.metrics, executionTime);
      
      return result;
    } catch (error) {
      bulkhead.metrics.failedCalls++;
      
      // If isolate failures is enabled, we might want to temporarily reduce capacity
      if (bulkhead.config.isolateFailures) {
        this.handleFailureIsolation(bulkhead, error as Error);
      }
      
      throw error;
    } finally {
      bulkhead.metrics.currentActiveCalls = bulkhead.activeCalls.size - 1;
    }
  }

  /**
   * Process the waiting queue
   */
  private processQueue(bulkhead: any) {
    while (
      bulkhead.waitingQueue.length > 0 &&
      bulkhead.activeCalls.size < bulkhead.config.maxConcurrentCalls
    ) {
      const callRequest = bulkhead.waitingQueue.shift()!;
      bulkhead.metrics.currentWaitingCalls = bulkhead.waitingQueue.length;
      
      // Clear timeout if set
      if (callRequest.timeoutHandle) {
        clearTimeout(callRequest.timeoutHandle);
      }

      // Calculate wait time
      const waitTime = Date.now() - callRequest.timestamp;
      bulkhead.metrics.maxWaitTime = Math.max(bulkhead.metrics.maxWaitTime, waitTime);

      // Execute the operation
      const promise = this.executeWithTracking(
        bulkhead,
        callRequest.operation,
        callRequest.timestamp
      );
      
      bulkhead.activeCalls.add(promise);
      
      promise
        .then(result => {
          callRequest.resolve(result);
        })
        .catch(error => {
          callRequest.reject(error);
        })
        .finally(() => {
          bulkhead.activeCalls.delete(promise);
          this.processQueue(bulkhead);
        });
    }
  }

  /**
   * Handle failure isolation
   */
  private handleFailureIsolation(bulkhead: any, error: Error) {
    // Log failure for monitoring
    this.logger.warn(`Bulkhead failure isolation triggered:`, error.message);
    
    // Could implement more sophisticated failure isolation here:
    // - Temporarily reduce max concurrent calls
    // - Increase timeouts
    // - Apply exponential backoff
  }

  /**
   * Create a new bulkhead with configuration
   */
  private createBulkhead(name: string, configOverrides?: Partial<BulkheadConfig>) {
    const defaultConfig: BulkheadConfig = {
      maxConcurrentCalls: this.configService.get('BULKHEAD_MAX_CONCURRENT_CALLS', 10),
      maxWaitingCalls: this.configService.get('BULKHEAD_MAX_WAITING_CALLS', 20),
      timeout: this.configService.get('BULKHEAD_TIMEOUT', 30000), // 30 seconds
      isolateFailures: this.configService.get('BULKHEAD_ISOLATE_FAILURES', true),
    };

    const config = { ...defaultConfig, ...configOverrides };

    const bulkhead = {
      config,
      metrics: {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        rejectedCalls: 0,
        currentActiveCalls: 0,
        currentWaitingCalls: 0,
        averageExecutionTime: 0,
        maxWaitTime: 0,
        rejectionRate: 0,
      } as BulkheadMetrics,
      activeCalls: new Set<Promise<any>>(),
      waitingQueue: [] as CallRequest<any>[],
    };

    this.bulkheads.set(name, bulkhead);
    this.logger.log(`Created bulkhead: ${name}`, config);
  }

  /**
   * Update average execution time using exponential moving average
   */
  private updateAverageExecutionTime(metrics: BulkheadMetrics, executionTime: number) {
    if (metrics.averageExecutionTime === 0) {
      metrics.averageExecutionTime = executionTime;
    } else {
      const alpha = 0.1; // Smoothing factor
      metrics.averageExecutionTime = 
        alpha * executionTime + (1 - alpha) * metrics.averageExecutionTime;
    }
  }

  /**
   * Update rejection rate
   */
  private updateRejectionRate(metrics: BulkheadMetrics) {
    if (metrics.totalCalls > 0) {
      metrics.rejectionRate = (metrics.rejectedCalls / metrics.totalCalls) * 100;
    }
  }

  /**
   * Get bulkhead status and metrics
   */
  getStatus(name: string) {
    const bulkhead = this.bulkheads.get(name);
    if (!bulkhead) {
      return null;
    }

    return {
      name,
      config: bulkhead.config,
      metrics: { ...bulkhead.metrics },
      activeCallsCount: bulkhead.activeCalls.size,
      waitingQueueLength: bulkhead.waitingQueue.length,
      utilizationRate: (bulkhead.activeCalls.size / bulkhead.config.maxConcurrentCalls) * 100,
    };
  }

  /**
   * Get all bulkheads status
   */
  getAllStatus() {
    const statuses = {};
    for (const [name] of this.bulkheads) {
      statuses[name] = this.getStatus(name);
    }
    return statuses;
  }

  /**
   * Update bulkhead configuration
   */
  updateConfig(name: string, newConfig: Partial<BulkheadConfig>) {
    const bulkhead = this.bulkheads.get(name);
    if (!bulkhead) {
      throw new Error(`Bulkhead ${name} not found`);
    }

    bulkhead.config = { ...bulkhead.config, ...newConfig };
    this.logger.log(`Updated bulkhead configuration: ${name}`, bulkhead.config);
  }

  /**
   * Clear bulkhead metrics
   */
  clearMetrics(name: string) {
    const bulkhead = this.bulkheads.get(name);
    if (!bulkhead) {
      throw new Error(`Bulkhead ${name} not found`);
    }

    bulkhead.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      currentActiveCalls: bulkhead.activeCalls.size,
      currentWaitingCalls: bulkhead.waitingQueue.length,
      averageExecutionTime: 0,
      maxWaitTime: 0,
      rejectionRate: 0,
    };

    this.logger.log(`Cleared metrics for bulkhead: ${name}`);
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics() {
    for (const [name, bulkhead] of this.bulkheads) {
      bulkhead.metrics = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        rejectedCalls: 0,
        currentActiveCalls: bulkhead.activeCalls.size,
        currentWaitingCalls: bulkhead.waitingQueue.length,
        averageExecutionTime: 0,
        maxWaitTime: 0,
        rejectionRate: 0,
      };
    }
    this.logger.log('Cleared all bulkhead metrics');
  }

  /**
   * Force clear all waiting queues (useful for shutdown)
   */
  clearAllQueues() {
    for (const [name, bulkhead] of this.bulkheads) {
      bulkhead.waitingQueue.forEach(request => {
        if (request.timeoutHandle) {
          clearTimeout(request.timeoutHandle);
        }
        request.reject(new BulkheadRejectionError(
          `Bulkhead '${name}' is being shut down`,
          name
        ));
      });
      bulkhead.waitingQueue.length = 0;
      bulkhead.metrics.currentWaitingCalls = 0;
    }
    this.logger.log('Cleared all bulkhead queues');
  }

  /**
   * Get overall system status
   */
  getSystemStatus() {
    let totalActiveCalls = 0;
    let totalWaitingCalls = 0;
    let totalBulkheads = 0;
    let healthyBulkheads = 0;

    for (const [name, bulkhead] of this.bulkheads) {
      totalBulkheads++;
      totalActiveCalls += bulkhead.activeCalls.size;
      totalWaitingCalls += bulkhead.waitingQueue.length;
      
      // Consider bulkhead healthy if rejection rate is below 10%
      if (bulkhead.metrics.rejectionRate < 10) {
        healthyBulkheads++;
      }
    }

    return {
      totalBulkheads,
      healthyBulkheads,
      healthyBulkheadPercentage: totalBulkheads > 0 ? (healthyBulkheads / totalBulkheads) * 100 : 100,
      totalActiveCalls,
      totalWaitingCalls,
      systemHealth: healthyBulkheads === totalBulkheads ? 'healthy' : 
                   healthyBulkheads > totalBulkheads * 0.8 ? 'degraded' : 'unhealthy',
    };
  }

  /**
   * Create a bulkhead-protected function wrapper
   */
  protect<T extends any[], R>(
    bulkheadName: string,
    fn: (...args: T) => Promise<R>,
    config?: Partial<BulkheadConfig>
  ): (...args: T) => Promise<R> {
    return (...args: T) => {
      return this.execute(bulkheadName, () => fn(...args), config);
    };
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(timeoutMs: number = 30000): Promise<void> {
    this.logger.log('Starting graceful shutdown of bulkhead service...');
    
    // Clear all waiting queues
    this.clearAllQueues();
    
    // Wait for active calls to complete
    const shutdownPromise = new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        let totalActiveCalls = 0;
        for (const [, bulkhead] of this.bulkheads) {
          totalActiveCalls += bulkhead.activeCalls.size;
        }
        
        if (totalActiveCalls === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    try {
      await Promise.race([
        shutdownPromise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Graceful shutdown timeout')), timeoutMs);
        })
      ]);
      this.logger.log('Graceful shutdown completed');
    } catch (error) {
      this.logger.warn('Graceful shutdown timeout, some operations may be interrupted');
    }
  }
}