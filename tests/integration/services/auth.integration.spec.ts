import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BaseIntegrationTest } from '../integration-test-setup';
import { AuthModule } from '../../../services/auth-service/src/auth/auth.module';
import { UsersModule } from '../../../services/auth-service/src/users/users.module';

describe('Auth Service Integration Tests', () => {
  let integrationTest: BaseIntegrationTest;

  beforeAll(async () => {
    integrationTest = new (class extends BaseIntegrationTest {
      protected configureTestApp(): void {
        // Add any auth-specific test configuration
      }
    })();

    await integrationTest.setupTest(async () => {
      const config = integrationTest['testEnv'].getConfig();
      
      return Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                POSTGRES_HOST: config.postgres.host,
                POSTGRES_PORT: config.postgres.port,
                POSTGRES_USER: config.postgres.username,
                POSTGRES_PASSWORD: config.postgres.password,
                POSTGRES_DB: config.postgres.database,
                JWT_SECRET: 'test-jwt-secret-key',
                JWT_EXPIRES_IN: '24h',
                REDIS_HOST: config.redis.host,
                REDIS_PORT: config.redis.port,
                NATS_URL: config.nats.url,
              })
            ]
          }),
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: config.postgres.host,
            port: config.postgres.port,
            username: config.postgres.username,
            password: config.postgres.password,
            database: config.postgres.database,
            entities: ['src/**/*.entity{.ts,.js}'],
            synchronize: true,
            dropSchema: false, // Already handled by test setup
          }),
          JwtModule.register({
            secret: 'test-jwt-secret-key',
            signOptions: { expiresIn: '24h' },
          }),
          AuthModule,
          UsersModule,
        ],
      }).compile();
    });
  });

  afterAll(async () => {
    await integrationTest.teardownTest();
  });

  beforeEach(async () => {
    await integrationTest.cleanDatabase();
  });

  describe('User Registration', () => {
    it('should register a new client user successfully', async () => {
      const userData = {
        email: 'client@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client',
        phoneNumber: '+1234567890'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isEmailVerified: false,
        isActive: true
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should register a new coach user successfully', async () => {
      const userData = {
        email: 'coach@example.com',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'coach',
        specializations: ['life-coaching', 'wellness'],
        bio: 'Experienced life coach with 10 years of practice'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isEmailVerified: false,
        isActive: true
      });
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('email must be an email');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'user@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client'
      };

      // First registration
      await integrationTest['testAgent']
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await integrationTest['testAgent']
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('User Authentication', () => {
    beforeEach(async () => {
      // Create test user
      await integrationTest.createTestUser('client', {
        email: 'login-test@example.com',
        password: 'TestPassword123!'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'TestPassword123!'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: loginData.email,
          role: 'client'
        }
      });

      // Verify JWT token structure
      const tokenParts = response.body.accessToken.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should handle login attempt with inactive user', async () => {
      // Create inactive user
      const inactiveUser = await integrationTest.createTestUser('client', {
        email: 'inactive@example.com',
        password: 'TestPassword123!',
        isActive: false
      });

      const loginData = {
        email: 'inactive@example.com',
        password: 'TestPassword123!'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toContain('Account is deactivated');
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      await integrationTest.createTestUser('client', {
        email: 'refresh-test@example.com',
        password: 'TestPassword123!'
      });

      const loginResponse = await integrationTest['testAgent']
        .post('/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'TestPassword123!'
        });

      refreshToken = loginResponse.body.refreshToken;
      accessToken = loginResponse.body.accessToken;
    });

    it('should refresh token successfully', async () => {
      const response = await integrationTest['testAgent']
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });

      // New tokens should be different from old ones
      expect(response.body.accessToken).not.toBe(accessToken);
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await integrationTest['testAgent']
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toContain('Invalid refresh token');
    });
  });

  describe('Password Reset', () => {
    beforeEach(async () => {
      await integrationTest.createTestUser('client', {
        email: 'reset-test@example.com',
        password: 'TestPassword123!'
      });
    });

    it('should initiate password reset successfully', async () => {
      const response = await integrationTest['testAgent']
        .post('/auth/forgot-password')
        .send({ email: 'reset-test@example.com' })
        .expect(200);

      expect(response.body.message).toContain('Password reset email sent');
    });

    it('should handle password reset for non-existent email gracefully', async () => {
      // Should not reveal whether email exists or not
      const response = await integrationTest['testAgent']
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toContain('Password reset email sent');
    });
  });

  describe('User Profile Management', () => {
    let userToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await integrationTest.createTestUser('client', {
        email: 'profile-test@example.com',
        password: 'TestPassword123!'
      });
      userId = user.id;
      userToken = await integrationTest.authenticateUser('profile-test@example.com', 'TestPassword123!');
    });

    it('should get user profile successfully', async () => {
      const response = await integrationTest['authenticatedRequest'](userToken)
        .get('/auth/profile')
        .expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        email: 'profile-test@example.com',
        role: 'client',
        isActive: true
      });
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        phoneNumber: '+1987654321'
      };

      const response = await integrationTest['authenticatedRequest'](userToken)
        .put('/auth/profile')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phoneNumber: updateData.phoneNumber
      });
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewSecurePassword123!'
      };

      await integrationTest['authenticatedRequest'](userToken)
        .post('/auth/change-password')
        .send(passwordData)
        .expect(200);

      // Verify old password no longer works
      await integrationTest['testAgent']
        .post('/auth/login')
        .send({
          email: 'profile-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      // Verify new password works
      await integrationTest['testAgent']
        .post('/auth/login')
        .send({
          email: 'profile-test@example.com',
          password: 'NewSecurePassword123!'
        })
        .expect(200);
    });

    it('should reject password change with wrong current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePassword123!'
      };

      const response = await integrationTest['authenticatedRequest'](userToken)
        .post('/auth/change-password')
        .send(passwordData)
        .expect(400);

      expect(response.body.message).toContain('Current password is incorrect');
    });
  });

  describe('Role-based Access Control', () => {
    let clientToken: string;
    let coachToken: string;
    let adminToken: string;

    beforeEach(async () => {
      // Create users with different roles
      await integrationTest.createTestUser('client', {
        email: 'client-rbac@example.com',
        password: 'TestPassword123!'
      });

      await integrationTest.createTestUser('coach', {
        email: 'coach-rbac@example.com',
        password: 'TestPassword123!'
      });

      await integrationTest.createTestUser('admin', {
        email: 'admin-rbac@example.com',
        password: 'TestPassword123!'
      });

      // Get tokens
      clientToken = await integrationTest.authenticateUser('client-rbac@example.com', 'TestPassword123!');
      coachToken = await integrationTest.authenticateUser('coach-rbac@example.com', 'TestPassword123!');
      adminToken = await integrationTest.authenticateUser('admin-rbac@example.com', 'TestPassword123!');
    });

    it('should allow client access to client endpoints', async () => {
      await integrationTest['authenticatedRequest'](clientToken)
        .get('/auth/profile')
        .expect(200);
    });

    it('should allow coach access to coach endpoints', async () => {
      await integrationTest['authenticatedRequest'](coachToken)
        .get('/auth/profile')
        .expect(200);
    });

    it('should allow admin access to admin endpoints', async () => {
      await integrationTest['authenticatedRequest'](adminToken)
        .get('/auth/profile')
        .expect(200);
    });

    it('should reject unauthorized access to protected endpoints', async () => {
      // Test without token
      await integrationTest['testAgent']
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject access with invalid token', async () => {
      await integrationTest['testAgent']
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Concurrent User Operations', () => {
    it('should handle concurrent user registrations', async () => {
      const concurrentRegistrations = Array.from({ length: 10 }, (_, i) => ({
        email: `concurrent${i}@example.com`,
        password: 'TestPassword123!',
        firstName: `User${i}`,
        lastName: 'Test',
        role: 'client'
      }));

      const promises = concurrentRegistrations.map(userData =>
        integrationTest['testAgent']
          .post('/auth/register')
          .send(userData)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      expect(successful).toBe(10);
    });

    it('should handle concurrent login attempts', async () => {
      // Create test users
      const users = Array.from({ length: 5 }, (_, i) => ({
        email: `login${i}@example.com`,
        password: 'TestPassword123!'
      }));

      for (const user of users) {
        await integrationTest.createTestUser('client', user);
      }

      // Concurrent logins
      const loginPromises = users.map(user =>
        integrationTest['testAgent']
          .post('/auth/login')
          .send(user)
      );

      const results = await Promise.allSettled(loginPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      expect(successful).toBe(5);
    });
  });

  describe('Security Features', () => {
    it('should implement rate limiting on login attempts', async () => {
      await integrationTest.createTestUser('client', {
        email: 'rate-limit@example.com',
        password: 'TestPassword123!'
      });

      // Make multiple failed login attempts
      const failedAttempts = Array.from({ length: 6 }, () =>
        integrationTest['testAgent']
          .post('/auth/login')
          .send({
            email: 'rate-limit@example.com',
            password: 'WrongPassword123!'
          })
      );

      const results = await Promise.allSettled(failedAttempts);
      
      // Some requests should be rate limited (429 status)
      const rateLimited = results.some(result => 
        result.status === 'fulfilled' && (result.value as any).status === 429
      );

      expect(rateLimited).toBe(true);
    });

    it('should sanitize user input', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        role: 'client'
      };

      const response = await integrationTest['testAgent']
        .post('/auth/register')
        .send(maliciousData)
        .expect(201);

      // Should sanitize malicious input
      expect(response.body.firstName).not.toContain('<script>');
    });
  });
});