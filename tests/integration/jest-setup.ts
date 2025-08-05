import 'jest-extended';
import { IntegrationTestEnvironment } from './integration-test-setup';

// Increase timeout for integration tests
jest.setTimeout(300000); // 5 minutes

// Global test environment instance
let globalTestEnv: IntegrationTestEnvironment | null = null;

// Custom matchers for integration tests
expect.extend({
  toBeValidId(received) {
    const pass = typeof received === 'string' && received.length > 0;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ID`,
        pass: false,
      };
    }
  },

  toBeValidTimestamp(received) {
    const pass = !isNaN(Date.parse(received));
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    const pass = typeof received === 'string' && jwtRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },

  toHaveValidationError(received, field) {
    const pass = received.body && 
                  received.body.message && 
                  (Array.isArray(received.body.message) 
                    ? received.body.message.some((msg: string) => msg.includes(field))
                    : received.body.message.includes(field));
    
    if (pass) {
      return {
        message: () => `expected response not to have validation error for field ${field}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to have validation error for field ${field}`,
        pass: false,
      };
    }
  },

  toHaveSuccessfulResponse(received) {
    const pass = received.status >= 200 && received.status < 300;
    
    if (pass) {
      return {
        message: () => `expected response not to be successful (status: ${received.status})`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be successful but got status: ${received.status}`,
        pass: false,
      };
    }
  },

  toHaveErrorResponse(received, expectedStatus?) {
    const pass = expectedStatus ? 
                  received.status === expectedStatus :
                  received.status >= 400;
    
    if (pass) {
      return {
        message: () => `expected response not to be an error (status: ${received.status})`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be an error but got status: ${received.status}`,
        pass: false,
      };
    }
  },

  async toEventuallyMatch(received, expected, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const result = typeof received === 'function' ? await received() : received;
        
        if (this.equals(result, expected)) {
          return {
            message: () => `expected value not to eventually match ${this.utils.printExpected(expected)}`,
            pass: true,
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        // Continue trying
      }
    }
    
    return {
      message: () => `expected value to eventually match ${this.utils.printExpected(expected)} within ${timeout}ms`,
      pass: false,
    };
  }
});

// Global setup and teardown helpers
export const setupTestEnvironment = async (): Promise<IntegrationTestEnvironment> => {
  if (!globalTestEnv) {
    globalTestEnv = new IntegrationTestEnvironment();
    await globalTestEnv.setupEnvironment();
  }
  return globalTestEnv;
};

export const teardownTestEnvironment = async (): Promise<void> => {
  if (globalTestEnv) {
    await globalTestEnv.teardownEnvironment();
    globalTestEnv = null;
  }
};

// Test utilities
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxAttempts) {
        await waitFor(delay);
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

export const eventually = async <T>(
  operation: () => Promise<T>,
  predicate: (result: T) => boolean,
  timeout: number = 10000,
  interval: number = 100
): Promise<T> => {
  const startTime = Date.now();
  let lastResult: T;
  
  while (Date.now() - startTime < timeout) {
    try {
      lastResult = await operation();
      
      if (predicate(lastResult)) {
        return lastResult;
      }
      
      await waitFor(interval);
    } catch (error) {
      await waitFor(interval);
    }
  }
  
  throw new Error(`Operation did not satisfy predicate within ${timeout}ms. Last result: ${JSON.stringify(lastResult!)}`);
};

// Database test utilities
export const truncateTable = async (dataSource: any, tableName: string): Promise<void> => {
  await dataSource.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
};

export const seedTestData = async (dataSource: any, data: any): Promise<void> => {
  for (const [tableName, records] of Object.entries(data)) {
    if (Array.isArray(records) && records.length > 0) {
      const repository = dataSource.getRepository(tableName);
      await repository.save(records);
    }
  }
};

// HTTP test utilities
export const createFormData = (fields: Record<string, any>, files?: Record<string, Buffer>): FormData => {
  const formData = new FormData();
  
  // Add regular fields
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  }
  
  // Add files
  if (files) {
    for (const [key, buffer] of Object.entries(files)) {
      formData.append(key, buffer, key);
    }
  }
  
  return formData;
};

export const expectSuccessfulResponse = (response: any): void => {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
};

export const expectErrorResponse = (response: any, expectedStatus?: number): void => {
  if (expectedStatus) {
    expect(response.status).toBe(expectedStatus);
  } else {
    expect(response.status).toBeGreaterThanOrEqual(400);
  }
  expect(response.body).toHaveProperty('message');
};

// Performance testing utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number; memoryUsage: NodeJS.MemoryUsage }> => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  const result = await operation();
  
  const endTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage();
  
  const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
  
  const memoryUsage = {
    rss: endMemory.rss - startMemory.rss,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    external: endMemory.external - startMemory.external,
    arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
  };
  
  return { result, duration, memoryUsage };
};

export const benchmarkOperation = async <T>(
  operation: () => Promise<T>,
  iterations: number = 10
): Promise<{
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  throughput: number;
}> => {
  const durations: number[] = [];
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const { duration } = await measurePerformance(operation);
    durations.push(duration);
  }
  
  const totalDuration = Date.now() - startTime;
  const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const throughput = iterations / (totalDuration / 1000); // operations per second
  
  return {
    averageDuration,
    minDuration,
    maxDuration,
    totalDuration,
    throughput
  };
};

// Logging utilities for tests
export const testLogger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.JEST_VERBOSE === 'true') {
      console.log(`[TEST INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[TEST WARN] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[TEST ERROR] ${message}`, ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.JEST_VERBOSE === 'true' || process.env.DEBUG === 'true') {
      console.debug(`[TEST DEBUG] ${message}`, ...args);
    }
  }
};

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  testLogger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  testLogger.error('Uncaught Exception:', error);
  process.exit(1);
});

// TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidId(): R;
      toBeValidTimestamp(): R;
      toBeValidEmail(): R;
      toBeValidJWT(): R;
      toHaveValidationError(field: string): R;
      toHaveSuccessfulResponse(): R;
      toHaveErrorResponse(expectedStatus?: number): R;
      toEventuallyMatch(expected: any, timeout?: number): Promise<R>;
    }
  }
}