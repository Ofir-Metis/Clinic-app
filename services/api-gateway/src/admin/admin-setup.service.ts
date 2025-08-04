/**
 * AdminSetupService - Service for creating and managing admin users
 */

import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@clinic/common';
import * as bcrypt from 'bcrypt';

export interface CreateAdminUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AdminUserResult {
  userId: string;
  email: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

@Injectable()
export class AdminSetupService {
  private readonly logger = new Logger(AdminSetupService.name);

  constructor(private jwtService: JwtService) {}

  /**
   * Create admin user with proper permissions
   */
  async createAdminUser(userData: CreateAdminUserData): Promise<AdminUserResult> {
    try {
      // Generate user ID
      const userId = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Hash password
      const saltRounds = 12; // Higher security for admin accounts
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user data
      const userRecord = {
        id: userId,
        email: userData.email,
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create profile data
      const profileRecord = {
        user_id: userId,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: '+1-555-ADMIN',
        timezone: 'UTC',
        language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Admin permissions
      const adminPermissions = [
        'admin:*',
        'users:*',
        'system:*',
        'analytics:*',
        'maintenance:*',
        'audit:*',
        'clients:impersonate',
        'appointments:*',
        'notes:*',
        'files:*',
        'notifications:*',
        'recordings:*',
        'ai:*',
        'settings:*',
      ];

      // In a real implementation, these would be database operations
      // For now, we'll log the operations and generate tokens
      
      this.logger.log('📝 Creating admin user record...');
      this.logger.log('User:', JSON.stringify(userRecord, null, 2));
      
      this.logger.log('👤 Creating admin profile...');
      this.logger.log('Profile:', JSON.stringify(profileRecord, null, 2));
      
      this.logger.log('🔑 Granting admin permissions...');
      this.logger.log('Permissions:', adminPermissions);

      // Generate JWT tokens for immediate login
      const tokenPayload = {
        sub: userId,
        email: userData.email,
        role: 'admin' as const,
        permissions: adminPermissions,
      };

      const tokens = this.jwtService.generateTokens(tokenPayload);

      // Log admin creation for audit
      await this.logAdminCreation(userId, userData.email);

      // In production, you would save to database here:
      /*
      await this.userRepository.create(userRecord);
      await this.profileRepository.create(profileRecord);
      await this.permissionRepository.createMany(
        adminPermissions.map(permission => ({
          user_id: userId,
          permission,
          granted_at: new Date(),
          granted_by: 'system',
        }))
      );
      */

      this.logger.log(`✅ Admin user created successfully: ${userData.email}`);

      return {
        userId,
        email: userData.email,
        tokens,
      };

    } catch (error) {
      this.logger.error('Failed to create admin user:', error);
      throw error;
    }
  }

  /**
   * Check if any admin users exist
   */
  async checkExistingAdmin(): Promise<boolean> {
    try {
      // Mock implementation - in production, query database
      // SELECT COUNT(*) FROM users WHERE role = 'admin' AND status = 'active'
      
      this.logger.log('🔍 Checking for existing admin users...');
      
      // For demo purposes, we'll return false to allow admin creation
      // In production, implement actual database query
      const mockAdminExists = false;
      
      this.logger.log(`Found existing admin: ${mockAdminExists}`);
      return mockAdminExists;
      
    } catch (error) {
      this.logger.error('Failed to check existing admin:', error);
      return false;
    }
  }

  /**
   * Get count of admin users
   */
  async getAdminCount(): Promise<number> {
    try {
      // Mock implementation - in production, query database
      this.logger.log('📊 Getting admin user count...');
      
      // For demo purposes, return 0
      const mockAdminCount = 0;
      
      this.logger.log(`Admin user count: ${mockAdminCount}`);
      return mockAdminCount;
      
    } catch (error) {
      this.logger.error('Failed to get admin count:', error);
      return 0;
    }
  }

  /**
   * Log admin creation for audit trail
   */
  private async logAdminCreation(userId: string, email: string): Promise<void> {
    try {
      const auditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        user_id: 'system',
        action: 'create_admin_user',
        resource_type: 'user',
        resource_id: userId,
        details: {
          email,
          method: 'admin_setup_service',
          timestamp: new Date().toISOString(),
        },
        ip_address: '127.0.0.1',
        user_agent: 'admin-setup-service',
        created_at: new Date().toISOString(),
      };

      this.logger.log('📝 Logging admin creation...');
      this.logger.log('Audit:', JSON.stringify(auditEntry, null, 2));

      // In production, save to audit_logs table
      // await this.auditRepository.create(auditEntry);

    } catch (error) {
      this.logger.error('Failed to log admin creation:', error);
      // Don't throw error here as it's not critical
    }
  }

  /**
   * Validate admin password strength
   */
  validateAdminPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate secure admin password
   */
  generateSecurePassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}