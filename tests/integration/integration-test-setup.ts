import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import * as Docker from 'dockerode';

export interface IntegrationTestConfig {
  postgres: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
  };
  nats: {
    url: string;
  };
  minio: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
  };
}

export class IntegrationTestEnvironment {
  private docker: Docker;
  private containers: Map<string, Docker.Container> = new Map();
  private networks: Map<string, Docker.Network> = new Map();
  private config: IntegrationTestConfig;
  private dataSource: DataSource;
  
  constructor() {
    this.docker = new Docker();
    this.config = this.generateTestConfig();
  }

  /**
   * Setup complete test environment with all services
   */
  async setupEnvironment(): Promise<void> {
    console.log('🚀 Setting up integration test environment...');
    
    try {
      // Create test network
      await this.createTestNetwork();
      
      // Start infrastructure services
      await this.startPostgreSQL();
      await this.startRedis();
      await this.startNATS();
      await this.startMinIO();
      
      // Wait for services to be ready
      await this.waitForServices();
      
      // Setup test database
      await this.setupTestDatabase();
      
      console.log('✅ Integration test environment ready!');
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error);
      await this.teardownEnvironment();
      throw error;
    }
  }

  /**
   * Teardown test environment and cleanup resources
   */
  async teardownEnvironment(): Promise<void> {
    console.log('🧹 Tearing down integration test environment...');
    
    try {
      // Close database connections
      if (this.dataSource?.isInitialized) {
        await this.dataSource.destroy();
      }

      // Stop and remove containers
      for (const [name, container] of this.containers) {
        try {
          await container.kill();
          await container.remove();
          console.log(`✅ Removed container: ${name}`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove container ${name}:`, error.message);
        }
      }

      // Remove networks
      for (const [name, network] of this.networks) {
        try {
          await network.remove();
          console.log(`✅ Removed network: ${name}`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove network ${name}:`, error.message);
        }
      }

      this.containers.clear();
      this.networks.clear();
      
      console.log('✅ Test environment cleaned up');
    } catch (error) {
      console.error('❌ Error during teardown:', error);
    }
  }

  /**
   * Create isolated test network
   */
  private async createTestNetwork(): Promise<void> {
    const networkName = `clinic-test-${Date.now()}`;
    const network = await this.docker.createNetwork({
      Name: networkName,
      Driver: 'bridge',
      Options: {
        'com.docker.network.bridge.enable_icc': 'true'
      }
    });
    
    this.networks.set(networkName, network);
    console.log(`✅ Created test network: ${networkName}`);
  }

  /**
   * Start PostgreSQL container
   */
  private async startPostgreSQL(): Promise<void> {
    const networkName = Array.from(this.networks.keys())[0];
    
    const container = await this.docker.createContainer({
      Image: 'postgres:15-alpine',
      name: `postgres-test-${Date.now()}`,
      Env: [
        `POSTGRES_USER=${this.config.postgres.username}`,
        `POSTGRES_PASSWORD=${this.config.postgres.password}`,
        `POSTGRES_DB=${this.config.postgres.database}`,
        'POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256'
      ],
      ExposedPorts: {
        '5432/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '5432/tcp': [{ HostPort: this.config.postgres.port.toString() }]
        },
        NetworkMode: networkName,
        Memory: 512 * 1024 * 1024, // 512MB
        AutoRemove: false
      },
      Healthcheck: {
        Test: ['CMD-SHELL', `pg_isready -U ${this.config.postgres.username}`],
        Interval: 10000000000, // 10s in nanoseconds
        Timeout: 5000000000,   // 5s in nanoseconds
        Retries: 5
      }
    });

    await container.start();
    this.containers.set('postgres', container);
    console.log('✅ Started PostgreSQL container');
  }

  /**
   * Start Redis container
   */
  private async startRedis(): Promise<void> {
    const networkName = Array.from(this.networks.keys())[0];
    
    const container = await this.docker.createContainer({
      Image: 'redis:7-alpine',
      name: `redis-test-${Date.now()}`,
      ExposedPorts: {
        '6379/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '6379/tcp': [{ HostPort: this.config.redis.port.toString() }]
        },
        NetworkMode: networkName,
        Memory: 256 * 1024 * 1024, // 256MB
        AutoRemove: false
      },
      Cmd: ['redis-server', '--appendonly', 'yes', '--maxmemory', '128mb']
    });

    await container.start();
    this.containers.set('redis', container);
    console.log('✅ Started Redis container');
  }

  /**
   * Start NATS container
   */
  private async startNATS(): Promise<void> {
    const networkName = Array.from(this.networks.keys())[0];
    
    const container = await this.docker.createContainer({
      Image: 'nats:2-alpine',
      name: `nats-test-${Date.now()}`,
      ExposedPorts: {
        '4222/tcp': {},
        '8222/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '4222/tcp': [{ HostPort: '4222' }],
          '8222/tcp': [{ HostPort: '8222' }]
        },
        NetworkMode: networkName,
        Memory: 128 * 1024 * 1024, // 128MB
        AutoRemove: false
      },
      Cmd: ['--jetstream', '--http_port=8222']
    });

    await container.start();
    this.containers.set('nats', container);
    console.log('✅ Started NATS container');
  }

  /**
   * Start MinIO container
   */
  private async startMinIO(): Promise<void> {
    const networkName = Array.from(this.networks.keys())[0];
    
    const container = await this.docker.createContainer({
      Image: 'minio/minio:latest',
      name: `minio-test-${Date.now()}`,
      Env: [
        `MINIO_ROOT_USER=${this.config.minio.accessKey}`,
        `MINIO_ROOT_PASSWORD=${this.config.minio.secretKey}`
      ],
      ExposedPorts: {
        '9000/tcp': {},
        '9001/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '9000/tcp': [{ HostPort: this.config.minio.port.toString() }],
          '9001/tcp': [{ HostPort: '9001' }]
        },
        NetworkMode: networkName,
        Memory: 256 * 1024 * 1024, // 256MB
        AutoRemove: false
      },
      Cmd: ['server', '/data', '--console-address', ':9001']
    });

    await container.start();
    this.containers.set('minio', container);
    console.log('✅ Started MinIO container');
  }

  /**
   * Wait for all services to be ready
   */
  private async waitForServices(): Promise<void> {
    console.log('⏳ Waiting for services to be ready...');
    
    const services = [
      { name: 'PostgreSQL', check: () => this.checkPostgreSQL() },
      { name: 'Redis', check: () => this.checkRedis() },
      { name: 'NATS', check: () => this.checkNATS() },
      { name: 'MinIO', check: () => this.checkMinIO() }
    ];

    const maxRetries = 30;
    const retryDelay = 2000; // 2 seconds

    for (const service of services) {
      let retries = 0;
      let ready = false;

      while (retries < maxRetries && !ready) {
        try {
          await service.check();
          ready = true;
          console.log(`✅ ${service.name} is ready`);
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            throw new Error(`${service.name} failed to start after ${maxRetries} attempts`);
          }
          await this.sleep(retryDelay);
        }
      }
    }
  }

  /**
   * Check PostgreSQL connectivity
   */
  private async checkPostgreSQL(): Promise<void> {
    const { Client } = await import('pg');
    const client = new Client({
      host: this.config.postgres.host,
      port: this.config.postgres.port,
      user: this.config.postgres.username,
      password: this.config.postgres.password,
      database: this.config.postgres.database,
      connectTimeoutMillis: 5000
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
    } catch (error) {
      throw new Error(`PostgreSQL check failed: ${error.message}`);
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<void> {
    const { createClient } = await import('redis');
    const client = createClient({
      socket: {
        host: this.config.redis.host,
        port: this.config.redis.port,
        connectTimeout: 5000
      }
    });

    try {
      await client.connect();
      await client.ping();
      await client.disconnect();
    } catch (error) {
      throw new Error(`Redis check failed: ${error.message}`);
    }
  }

  /**
   * Check NATS connectivity
   */
  private async checkNATS(): Promise<void> {
    const response = await fetch(`http://localhost:8222/healthz`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`NATS health check failed: ${response.status}`);
    }
  }

  /**
   * Check MinIO connectivity
   */
  private async checkMinIO(): Promise<void> {
    const response = await fetch(`http://localhost:${this.config.minio.port}/minio/health/live`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`MinIO health check failed: ${response.status}`);
    }
  }

  /**
   * Setup test database with schema
   */
  private async setupTestDatabase(): Promise<void> {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: this.config.postgres.host,
      port: this.config.postgres.port,
      username: this.config.postgres.username,
      password: this.config.postgres.password,
      database: this.config.postgres.database,
      entities: ['services/*/src/**/*.entity{.ts,.js}'],
      synchronize: true, // Only for tests
      dropSchema: true,  // Clean slate for each test run
      logging: false
    });

    await this.dataSource.initialize();
    console.log('✅ Test database initialized');
  }

  /**
   * Get test configuration
   */
  getConfig(): IntegrationTestConfig {
    return { ...this.config };
  }

  /**
   * Get database connection
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * Create request agent for testing
   */
  createTestAgent(app: INestApplication) {
    return request(app.getHttpServer());
  }

  /**
   * Generate random test configuration
   */
  private generateTestConfig(): IntegrationTestConfig {
    const basePort = 15000 + Math.floor(Math.random() * 10000);
    
    return {
      postgres: {
        host: 'localhost',
        port: basePort,
        username: 'test_user',
        password: 'test_password',
        database: 'test_clinic'
      },
      redis: {
        host: 'localhost',
        port: basePort + 1
      },
      nats: {
        url: `nats://localhost:${basePort + 2}`
      },
      minio: {
        endpoint: 'localhost',
        port: basePort + 3,
        accessKey: 'test_access_key',
        secretKey: 'test_secret_key'
      }
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Base integration test class
 */
export abstract class BaseIntegrationTest {
  protected testEnv: IntegrationTestEnvironment;
  protected app: INestApplication;
  protected testAgent: request.SuperTest<request.Test>;

  /**
   * Setup test environment and application
   */
  async setupTest(moduleFactory: () => Promise<TestingModule>): Promise<void> {
    this.testEnv = new IntegrationTestEnvironment();
    await this.testEnv.setupEnvironment();

    const module = await moduleFactory();
    this.app = module.createNestApplication();
    
    // Configure test application
    this.configureTestApp();
    
    await this.app.init();
    this.testAgent = this.testEnv.createTestAgent(this.app);
  }

  /**
   * Teardown test environment
   */
  async teardownTest(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
    if (this.testEnv) {
      await this.testEnv.teardownEnvironment();
    }
  }

  /**
   * Configure test application - override in subclasses
   */
  protected configureTestApp(): void {
    // Default configuration - can be overridden
  }

  /**
   * Create test user with specific role
   */
  protected async createTestUser(role: string = 'client', additionalData: any = {}): Promise<any> {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role,
      isEmailVerified: true,
      ...additionalData
    };

    const response = await this.testAgent
      .post('/auth/register')
      .send(userData)
      .expect(201);

    return response.body;
  }

  /**
   * Authenticate test user and get token
   */
  protected async authenticateUser(email: string, password: string): Promise<string> {
    const response = await this.testAgent
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return response.body.accessToken;
  }

  /**
   * Create authenticated request with token
   */
  protected authenticatedRequest(token: string) {
    return {
      get: (path: string) => this.testAgent.get(path).set('Authorization', `Bearer ${token}`),
      post: (path: string) => this.testAgent.post(path).set('Authorization', `Bearer ${token}`),
      put: (path: string) => this.testAgent.put(path).set('Authorization', `Bearer ${token}`),
      delete: (path: string) => this.testAgent.delete(path).set('Authorization', `Bearer ${token}`),
      patch: (path: string) => this.testAgent.patch(path).set('Authorization', `Bearer ${token}`)
    };
  }

  /**
   * Clean database between tests
   */
  protected async cleanDatabase(): Promise<void> {
    const dataSource = this.testEnv.getDataSource();
    const entities = dataSource.entityMetadatas;

    // Disable foreign key checks
    await dataSource.query('SET session_replication_role = replica;');

    // Truncate all tables
    for (const entity of entities) {
      await dataSource.query(`TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
    }

    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }

  /**
   * Seed test data
   */
  protected async seedTestData(): Promise<any> {
    // Override in subclasses to provide test-specific data
    return {};
  }
}