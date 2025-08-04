import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CacheConfig } from './cache-manager.service';

export const CACHE_KEY = 'cache';
export const CACHE_TTL_KEY = 'cache_ttl';
export const CACHE_TAGS_KEY = 'cache_tags';
export const CACHE_NAMESPACE_KEY = 'cache_namespace';
export const CACHE_HEALTHCARE_KEY = 'cache_healthcare';

/**
 * Cache decorator for methods - automatically caches method results
 * 
 * @param keyGenerator Function to generate cache key from method arguments
 * @param config Cache configuration options
 * 
 * @example
 * @Cache((args) => `user:${args[0]}`, { ttl: 3600, tags: ['users'] })
 * async getUser(userId: string): Promise<User> {
 *   return this.userRepository.findById(userId);
 * }
 */
export const Cache = (
  keyGenerator: (...args: any[]) => string,
  config?: CacheConfig
) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheManager = this.cacheManager || this.cacheService;
      
      if (!cacheManager) {
        console.warn('CacheManagerService not found, executing method without caching');
        return originalMethod.apply(this, args);
      }
      
      const cacheKey = keyGenerator(...args);
      const context = this.getContext ? this.getContext() : undefined;
      
      // Try to get from cache first
      let result = await cacheManager.get(cacheKey, config, context);
      
      if (result !== null) {
        return result;
      }
      
      // Execute original method if not in cache
      result = await originalMethod.apply(this, args);
      
      // Store in cache
      if (result !== undefined && result !== null) {
        await cacheManager.set(cacheKey, result, config, context);
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Cache invalidation decorator - invalidates cache after method execution
 * 
 * @param keyGenerator Function to generate cache key(s) to invalidate
 * @param invalidateByTags Whether to invalidate by tags instead of specific keys
 * 
 * @example
 * @CacheInvalidate((args) => `user:${args[0].id}`, false)
 * @CacheInvalidate((args) => ['users', 'profiles'], true) // invalidate by tags
 * async updateUser(user: User): Promise<User> {
 *   return this.userRepository.save(user);
 * }
 */
export const CacheInvalidate = (
  keyGenerator: (...args: any[]) => string | string[],
  invalidateByTags: boolean = false
) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      const cacheManager = this.cacheManager || this.cacheService;
      
      if (cacheManager) {
        const keys = keyGenerator(...args);
        const context = this.getContext ? this.getContext() : undefined;
        
        if (invalidateByTags) {
          const tags = Array.isArray(keys) ? keys : [keys];
          await cacheManager.invalidateByTags(tags, context);
        } else {
          const keysToInvalidate = Array.isArray(keys) ? keys : [keys];
          for (const key of keysToInvalidate) {
            await cacheManager.delete(key, undefined, context);
          }
        }
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Cache update decorator - updates cache after method execution
 * 
 * @param keyGenerator Function to generate cache key
 * @param config Cache configuration options
 * 
 * @example
 * @CacheUpdate((args) => `user:${args[0].id}`, { ttl: 3600, tags: ['users'] })
 * async updateUser(user: User): Promise<User> {
 *   const updated = await this.userRepository.save(user);
 *   return updated;
 * }
 */
export const CacheUpdate = (
  keyGenerator: (...args: any[]) => string,
  config?: CacheConfig
) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      const cacheManager = this.cacheManager || this.cacheService;
      
      if (cacheManager && result !== undefined && result !== null) {
        const cacheKey = keyGenerator(...args);
        const context = this.getContext ? this.getContext() : undefined;
        await cacheManager.set(cacheKey, result, config, context);
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Cache configuration decorator for classes
 * 
 * @param config Default cache configuration for all cached methods in the class
 * 
 * @example
 * @CacheConfig({ ttl: 3600, namespace: 'users', tags: ['user-service'] })
 * export class UserService {
 *   // All cached methods will inherit this configuration
 * }
 */
export const CacheConfig = (config: Partial<CacheConfig>) => {
  return SetMetadata(CACHE_KEY, config);
};

/**
 * Healthcare cache decorator - specifically for healthcare data with compliance
 * 
 * @param keyGenerator Function to generate cache key from method arguments
 * @param config Healthcare-specific cache configuration
 * 
 * @example
 * @HealthcareCache(
 *   (args) => `patient:${args[0]}`, 
 *   { ttl: 1800, encryptionRequired: true, hipaaCompliant: true }
 * )
 * async getPatientData(patientId: string): Promise<PatientData> {
 *   return this.patientRepository.findById(patientId);
 * }
 */
export const HealthcareCache = (
  keyGenerator: (...args: any[]) => string,
  config: CacheConfig & { 
    encryptionRequired?: boolean;
    hipaaCompliant?: boolean;
    auditAccess?: boolean;
  } = {}
) => {
  const healthcareConfig: CacheConfig = {
    ttl: config.ttl || 1800, // Default 30 minutes for healthcare data
    tags: [...(config.tags || []), 'healthcare-data'],
    healthcareData: true,
    hipaaCompliant: true,
    encryptionRequired: config.encryptionRequired !== false, // Default to true
    ...config
  };
  
  return Cache(keyGenerator, healthcareConfig);
};

/**
 * Session cache decorator - for user session data
 * 
 * @param keyGenerator Function to generate session-specific cache key
 * @param config Session cache configuration
 * 
 * @example
 * @SessionCache(
 *   (args, context) => `session:${context.sessionId}:preferences`,
 *   { ttl: 3600, tags: ['sessions'] }
 * )
 * async getUserPreferences(): Promise<UserPreferences> {
 *   return this.preferencesService.getPreferences();
 * }
 */
export const SessionCache = (
  keyGenerator: (...args: any[]) => string,
  config?: Partial<CacheConfig>
) => {
  const sessionConfig: CacheConfig = {
    ttl: 3600, // 1 hour default for session data
    namespace: 'sessions',
    tags: ['session-data'],
    ...config
  };
  
  return Cache(keyGenerator, sessionConfig);
};

/**
 * Parameter decorator to inject cache key into method parameter
 * 
 * @example
 * async someMethod(@CacheKey() key: string, userId: string) {
 *   // key will contain the generated cache key
 * }
 */
export const CacheKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.cacheKey;
  }
);

/**
 * TTL decorator for setting cache TTL
 * 
 * @param ttl Time to live in seconds
 * 
 * @example
 * @CacheTTL(3600) // 1 hour
 * @Cache((args) => `data:${args[0]}`)
 * async getData(id: string) { ... }
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);

/**
 * Cache tags decorator for grouping related cache entries
 * 
 * @param tags Array of tags for cache invalidation
 * 
 * @example
 * @CacheTags(['users', 'profiles'])
 * @Cache((args) => `user:${args[0]}`)
 * async getUser(userId: string) { ... }
 */
export const CacheTags = (tags: string[]) => SetMetadata(CACHE_TAGS_KEY, tags);

/**
 * Cache namespace decorator
 * 
 * @param namespace Namespace for cache keys
 * 
 * @example
 * @CacheNamespace('user-service')
 * @Cache((args) => `user:${args[0]}`)
 * async getUser(userId: string) { ... }
 */
export const CacheNamespace = (namespace: string) => SetMetadata(CACHE_NAMESPACE_KEY, namespace);

/**
 * Healthcare data flag decorator
 * 
 * @example
 * @HealthcareData()
 * @Cache((args) => `patient:${args[0]}`)
 * async getPatient(patientId: string) { ... }
 */
export const HealthcareData = () => SetMetadata(CACHE_HEALTHCARE_KEY, true);

/**
 * Conditional cache decorator - only caches based on condition
 * 
 * @param condition Function that determines whether to cache
 * @param keyGenerator Function to generate cache key
 * @param config Cache configuration
 * 
 * @example
 * @ConditionalCache(
 *   (args, result) => result && result.length > 0,
 *   (args) => `search:${args[0]}`,
 *   { ttl: 300 }
 * )
 * async searchUsers(query: string): Promise<User[]> {
 *   return this.userRepository.search(query);
 * }
 */
export const ConditionalCache = (
  condition: (...args: any[]) => boolean | ((result: any) => boolean),
  keyGenerator: (...args: any[]) => string,
  config?: CacheConfig
) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheManager = this.cacheManager || this.cacheService;
      
      if (!cacheManager) {
        return originalMethod.apply(this, args);
      }
      
      // Check pre-execution condition
      if (typeof condition === 'function' && condition.length === args.length) {
        if (!condition(...args)) {
          return originalMethod.apply(this, args);
        }
      }
      
      const cacheKey = keyGenerator(...args);
      const context = this.getContext ? this.getContext() : undefined;
      
      // Try to get from cache
      let result = await cacheManager.get(cacheKey, config, context);
      
      if (result !== null) {
        return result;
      }
      
      // Execute original method
      result = await originalMethod.apply(this, args);
      
      // Check post-execution condition if it's a result validator
      if (typeof condition === 'function' && condition.length === 1) {
        if (!condition(result)) {
          return result;
        }
      }
      
      // Store in cache
      if (result !== undefined && result !== null) {
        await cacheManager.set(cacheKey, result, config, context);
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Cache warming decorator - pre-loads cache in background
 * 
 * @param keyGenerator Function to generate cache key
 * @param config Cache configuration
 * @param warmupSchedule Cron expression for warming schedule
 * 
 * @example
 * @CacheWarmup(
 *   () => 'popular-items',
 *   { ttl: 7200 },
 *   '0 *\/2 * * *' // Every 2 hours
 * )
 * async getPopularItems(): Promise<Item[]> {
 *   return this.itemService.getPopular();
 * }
 */
export const CacheWarmup = (
  keyGenerator: (...args: any[]) => string,
  config?: CacheConfig,
  warmupSchedule?: string
) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    // Schedule warmup if cron expression provided
    if (warmupSchedule) {
      // This would integrate with a job scheduler like Bull or Agenda
      console.log(`Cache warmup scheduled for ${propertyName}: ${warmupSchedule}`);
    }
    
    descriptor.value = async function (...args: any[]) {
      const cacheManager = this.cacheManager || this.cacheService;
      
      if (!cacheManager) {
        return originalMethod.apply(this, args);
      }
      
      const cacheKey = keyGenerator(...args);
      const context = this.getContext ? this.getContext() : undefined;
      
      // Try to get from cache
      let result = await cacheManager.get(cacheKey, config, context);
      
      if (result !== null) {
        // Schedule background refresh if TTL is close to expiry
        const keyInfo = await cacheManager.getCacheInfo();
        const key = keyInfo.keys.find(k => k.key.includes(cacheKey));
        
        if (key) {
          const timeUntilExpiry = key.ttl * 1000 - (Date.now() - key.createdAt.getTime());
          const refreshThreshold = (key.ttl * 1000) * 0.2; // 20% of TTL
          
          if (timeUntilExpiry < refreshThreshold) {
            // Schedule background refresh
            setTimeout(async () => {
              try {
                const freshResult = await originalMethod.apply(this, args);
                await cacheManager.set(cacheKey, freshResult, config, context);
              } catch (error) {
                console.error('Cache warmup failed:', error);
              }
            }, 0);
          }
        }
        
        return result;
      }
      
      // Execute original method if not in cache
      result = await originalMethod.apply(this, args);
      
      // Store in cache
      if (result !== undefined && result !== null) {
        await cacheManager.set(cacheKey, result, config, context);
      }
      
      return result;
    };
    
    return descriptor;
  };
};

// Type definitions for better TypeScript support
export interface CacheDecoratorOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
  compress?: boolean;
  serialize?: boolean;
  healthcareData?: boolean;
  encryptionRequired?: boolean;
  hipaaCompliant?: boolean;
}

// Utility type for cache key generators
export type CacheKeyGenerator<T extends any[] = any[]> = (...args: T) => string;

// Cache strategy types
export type CacheDecoratorStrategy = 
  | 'cache-aside'
  | 'write-through' 
  | 'write-behind'
  | 'refresh-ahead';

/**
 * Memoization decorator for pure functions (in-memory cache)
 * 
 * @param maxSize Maximum number of cached results
 * @param ttl Time to live in milliseconds
 * 
 * @example
 * @Memoize(100, 60000) // Cache 100 results for 1 minute
 * calculateExpensiveOperation(input: number): number {
 *   return input * Math.random(); // Example expensive operation
 * }
 */
export const Memoize = (maxSize: number = 100, ttl: number = 60000) => {
  const cache = new Map();
  const timestamps = new Map();
  
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const cacheKey = JSON.stringify(args);
      const now = Date.now();
      
      // Check if cached result exists and is not expired
      if (cache.has(cacheKey)) {
        const timestamp = timestamps.get(cacheKey);
        if (now - timestamp < ttl) {
          return cache.get(cacheKey);
        } else {
          // Remove expired entry
          cache.delete(cacheKey);
          timestamps.delete(cacheKey);
        }
      }
      
      // Execute original method
      const result = originalMethod.apply(this, args);
      
      // Store in cache if not at max capacity
      if (cache.size < maxSize) {
        cache.set(cacheKey, result);
        timestamps.set(cacheKey, now);
      } else {
        // Remove oldest entry (LRU)
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
        timestamps.delete(oldestKey);
        
        cache.set(cacheKey, result);
        timestamps.set(cacheKey, now);
      }
      
      return result;
    };
    
    return descriptor;
  };
};