/**
 * Cache Usage Examples
 * 
 * This file demonstrates how to use the comprehensive caching system
 * in various scenarios within the clinic management platform.
 */

import { Injectable, Controller, Get, Post, Body, UseInterceptors } from '@nestjs/common';
import { 
  CacheManagerService, 
  Cache, 
  HealthcareCache, 
  SessionCache,
  CacheInvalidate,
  CacheUpdate,
  ConditionalCache,
  CacheWarmup,
  CacheInterceptor,
  CacheConfigs,
  CacheKeyUtils,
  CacheTags
} from '../libs/common/src/caching';

// ============================================================================
// SERVICE EXAMPLES
// ============================================================================

@Injectable()
export class UserService {
  constructor(private readonly cacheManager: CacheManagerService) {}

  /**
   * Basic caching with method decorator
   */
  @Cache(
    (userId: string) => CacheKeyUtils.userKey(userId, 'profile'),
    CacheConfigs.STANDARD
  )
  async getUserProfile(userId: string) {
    // This method result will be cached for 1 hour
    console.log('Fetching user profile from database...');
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      preferences: { theme: 'dark', language: 'en' }
    };
  }

  /**
   * Cache invalidation after update
   */
  @CacheInvalidate(
    (user: any) => [
      CacheKeyUtils.userKey(user.id, 'profile'),
      CacheKeyUtils.userKey(user.id, 'preferences')
    ]
  )
  async updateUserProfile(user: any) {
    console.log('Updating user profile in database...');
    // Simulate database update
    return { ...user, updatedAt: new Date() };
  }

  /**
   * Cache update after modification
   */
  @CacheUpdate(
    (userId: string, preferences: any) => CacheKeyUtils.userKey(userId, 'preferences'),
    { ...CacheConfigs.STANDARD, tags: [CacheTags.USER_PREFERENCES] }
  )
  async updateUserPreferences(userId: string, preferences: any) {
    console.log('Updating user preferences...');
    return preferences;
  }

  /**
   * Session-based caching
   */
  @SessionCache(
    (userId: string, sessionId: string) => CacheKeyUtils.sessionKey(sessionId, 'data'),
    { ttl: 7200, tags: [CacheTags.USER_SESSIONS] }
  )
  async getUserSessionData(userId: string, sessionId: string) {
    console.log('Loading session data...');
    return {
      userId,
      sessionId,
      loginTime: new Date(),
      permissions: ['read', 'write']
    };
  }

  /**
   * Manual cache operations
   */
  async manualCacheExample(userId: string) {
    const key = CacheKeyUtils.userKey(userId, 'manual');
    
    // Check cache first
    let userData = await this.cacheManager.get(key, CacheConfigs.FAST);
    
    if (!userData) {
      console.log('Cache miss - fetching from database');
      userData = { id: userId, data: 'fresh data' };
      
      // Store in cache
      await this.cacheManager.set(key, userData, CacheConfigs.FAST);
    } else {
      console.log('Cache hit - returning cached data');
    }
    
    return userData;
  }
}

// ============================================================================
// HEALTHCARE SERVICE EXAMPLES
// ============================================================================

@Injectable()
export class PatientService {
  constructor(private readonly cacheManager: CacheManagerService) {}

  /**
   * Healthcare data caching with HIPAA compliance
   */
  @HealthcareCache(
    (patientId: string) => CacheKeyUtils.patientKey(patientId, 'profile'),
    { 
      ttl: 1800, // 30 minutes for sensitive data
      encryptionRequired: true,
      hipaaCompliant: true,
      auditAccess: true
    }
  )
  async getPatientData(patientId: string) {
    console.log('Fetching patient data from secure database...');
    return {
      id: patientId,
      name: 'Jane Patient',
      dateOfBirth: '1985-06-15',
      medicalRecordNumber: 'MRN-12345',
      // This data will be encrypted in cache
      sensitiveData: {
        ssn: '***-**-1234',
        diagnoses: ['Diabetes Type 2', 'Hypertension'],
        medications: ['Metformin', 'Lisinopril']
      }
    };
  }

  /**
   * Conditional caching for search results
   */
  @ConditionalCache(
    (result: any[]) => result && result.length > 0, // Only cache non-empty results
    (query: string, filters: any) => CacheKeyUtils.searchKey(query, filters),
    { ttl: 900, tags: [CacheTags.SEARCH_RESULTS] }
  )
  async searchPatients(query: string, filters: any = {}) {
    console.log(`Searching patients with query: ${query}`);
    // Simulate database search
    const results = query.length > 2 ? [
      { id: '1', name: 'John Doe', matchScore: 0.95 },
      { id: '2', name: 'Jane Smith', matchScore: 0.87 }
    ] : [];
    
    return results;
  }

  /**
   * Cache warming for frequently accessed data
   */
  @CacheWarmup(
    () => 'popular-diagnoses',
    { ttl: 7200, tags: ['medical-data'] },
    '0 */4 * * *' // Warm every 4 hours
  )
  async getPopularDiagnoses() {
    console.log('Loading popular diagnoses...');
    return [
      'Diabetes Type 2',
      'Hypertension',
      'Anxiety',
      'Depression',
      'Asthma'
    ];
  }
}

// ============================================================================
// APPOINTMENT SERVICE EXAMPLES
// ============================================================================

@Injectable()
export class AppointmentService {
  constructor(private readonly cacheManager: CacheManagerService) {}

  /**
   * Complex cache invalidation with multiple tags
   */
  @CacheInvalidate(
    (appointment: any) => [CacheTags.APPOINTMENTS, CacheTags.PATIENTS, 'calendar-data'],
    true // Invalidate by tags
  )
  async createAppointment(appointment: any) {
    console.log('Creating new appointment...');
    return {
      id: Date.now().toString(),
      ...appointment,
      createdAt: new Date()
    };
  }

  /**
   * Time-based cache with different TTLs
   */
  async getAppointmentsByDate(date: string, useShortCache = false) {
    const key = `appointments:${date}`;
    const config = useShortCache ? CacheConfigs.FAST : CacheConfigs.STANDARD;
    
    let appointments = await this.cacheManager.get(key, config);
    
    if (!appointments) {
      console.log(`Loading appointments for ${date}...`);
      appointments = [
        { id: '1', time: '09:00', patient: 'John Doe' },
        { id: '2', time: '10:30', patient: 'Jane Smith' }
      ];
      
      await this.cacheManager.set(key, appointments, config);
    }
    
    return appointments;
  }
}

// ============================================================================
// CONTROLLER EXAMPLES WITH HTTP INTERCEPTOR
// ============================================================================

@Controller('api/users')
@UseInterceptors(CacheInterceptor) // Apply caching to all endpoints
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET endpoint with automatic HTTP caching
   * The interceptor will cache based on the request URL and parameters
   */
  @Get(':id/profile')
  async getUserProfile(@Param('id') userId: string) {
    return this.userService.getUserProfile(userId);
  }

  /**
   * POST endpoint that invalidates cache
   */
  @Post(':id/profile')
  async updateUserProfile(@Param('id') userId: string, @Body() profileData: any) {
    const result = await this.userService.updateUserProfile({ id: userId, ...profileData });
    
    // Manual cache invalidation if needed
    // The service method decorator will handle this automatically
    
    return result;
  }
}

@Controller('api/patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  /**
   * Healthcare endpoint with specialized caching
   */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  async getPatient(@Param('id') patientId: string) {
    // This will use the healthcare cache configuration
    return this.patientService.getPatientData(patientId);
  }

  /**
   * Search endpoint with conditional caching
   */
  @Get('search')
  @UseInterceptors(CacheInterceptor)
  async searchPatients(@Query('q') query: string, @Query() filters: any) {
    return this.patientService.searchPatients(query, filters);
  }
}

// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

@Injectable()
export class AdvancedCacheService {
  constructor(private readonly cacheManager: CacheManagerService) {}

  /**
   * Multi-level caching strategy
   */
  async getComplexData(id: string) {
    // Level 1: Fast cache (5 minutes)
    const fastKey = `fast:${id}`;
    let data = await this.cacheManager.get(fastKey, CacheConfigs.FAST);
    
    if (data) {
      return data;
    }
    
    // Level 2: Standard cache (1 hour)
    const standardKey = `standard:${id}`;
    data = await this.cacheManager.get(standardKey, CacheConfigs.STANDARD);
    
    if (data) {
      // Refresh fast cache
      await this.cacheManager.set(fastKey, data, CacheConfigs.FAST);
      return data;
    }
    
    // Level 3: Database
    console.log('Fetching from database...');
    data = { id, value: 'complex data', timestamp: new Date() };
    
    // Store in both cache levels
    await this.cacheManager.set(standardKey, data, CacheConfigs.STANDARD);
    await this.cacheManager.set(fastKey, data, CacheConfigs.FAST);
    
    return data;
  }

  /**
   * Cache with compression for large datasets
   */
  async getLargeDataset(category: string) {
    const key = `large-dataset:${category}`;
    const config = {
      ...CacheConfigs.LONG_TERM,
      compress: true, // Enable compression for large data
      serialize: true
    };
    
    let dataset = await this.cacheManager.get(key, config);
    
    if (!dataset) {
      console.log(`Loading large dataset for category: ${category}`);
      // Simulate large dataset
      dataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        category,
        data: `Item ${i} data`.repeat(10)
      }));
      
      await this.cacheManager.set(key, dataset, config);
    }
    
    return dataset;
  }

  /**
   * Cache monitoring and health checks
   */
  async getCacheHealthStatus() {
    const health = await this.cacheManager.healthCheck();
    const stats = this.cacheManager.getStats();
    const cacheInfo = await this.cacheManager.getCacheInfo();
    
    return {
      health,
      stats,
      summary: {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        avgResponseTime: `${stats.avgResponseTime.toFixed(2)}ms`,
        memoryUsage: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        keyCount: stats.keyCount,
        healthcareDataCount: cacheInfo.healthcareDataCount
      }
    };
  }

  /**
   * Bulk cache operations
   */
  async bulkCacheOperations() {
    const operations = [
      { key: 'bulk:1', value: { data: 'value1' } },
      { key: 'bulk:2', value: { data: 'value2' } },
      { key: 'bulk:3', value: { data: 'value3' } }
    ];

    // Bulk set operations
    await Promise.all(
      operations.map(op => 
        this.cacheManager.set(op.key, op.value, CacheConfigs.STANDARD)
      )
    );

    // Bulk get operations
    const results = await Promise.all(
      operations.map(op => 
        this.cacheManager.get(op.key, CacheConfigs.STANDARD)
      )
    );

    return results;
  }

  /**
   * Cache invalidation patterns
   */
  async performCacheInvalidation() {
    // Invalidate by specific keys
    await this.cacheManager.delete('specific-key');
    
    // Invalidate by tags
    await this.cacheManager.invalidateByTags([
      CacheTags.USERS, 
      CacheTags.USER_PREFERENCES
    ]);
    
    // Clear all cache (use with extreme caution)
    // await this.cacheManager.clear();
    
    console.log('Cache invalidation completed');
  }
}

// ============================================================================
// MODULE CONFIGURATION EXAMPLES
// ============================================================================

/*
// Example 1: Basic module configuration in app.module.ts
import { CacheModule } from './libs/common/src/caching';

@Module({
  imports: [
    CacheModule.forRoot({
      isGlobal: true,
      redisHost: 'localhost',
      redisPort: 6379,
      defaultTTL: 3600,
      encryptionKey: process.env.CACHE_ENCRYPTION_KEY
    })
  ],
  // ... other configuration
})
export class AppModule {}

// Example 2: Async configuration with ConfigService
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redisHost: configService.get('REDIS_HOST'),
        redisPort: configService.get('REDIS_PORT'),
        redisPassword: configService.get('REDIS_PASSWORD'),
        defaultTTL: configService.get('CACHE_DEFAULT_TTL', 3600),
        encryptionKey: configService.get('CACHE_ENCRYPTION_KEY')
      }),
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}

// Example 3: Healthcare-specific module
import { HealthcareCacheModule } from './libs/common/src/caching';

@Module({
  imports: [
    HealthcareCacheModule.forRoot({
      isGlobal: true,
      encryptionKey: process.env.HEALTHCARE_CACHE_ENCRYPTION_KEY,
      defaultTTL: 1800, // 30 minutes for healthcare data
      maxMemoryUsage: 1024 * 1024 * 50 // 50MB limit
    })
  ]
})
export class HealthcareModule {}

// Example 4: Feature module with caching
@Module({
  imports: [CacheModule.forFeature()],
  providers: [UserService, PatientService],
  controllers: [UserController, PatientController]
})
export class FeatureModule {}
*/

export {
  UserService,
  PatientService,
  AppointmentService,
  UserController,
  PatientController,
  AdvancedCacheService
};