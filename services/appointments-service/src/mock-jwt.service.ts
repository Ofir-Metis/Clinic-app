import { Injectable } from '@nestjs/common';

/**
 * Temporary mock JWT service to resolve dependency injection issues
 * This is a minimal implementation to get services started
 */
@Injectable()
export class MockJwtService {
  async verifyAsync(token: string, options?: any): Promise<any> {
    // Mock implementation - always return a valid user for testing
    return {
      sub: '1',
      roles: ['admin'],
      email: 'test@example.com'
    };
  }

  sign(payload: any, options?: any): string {
    // Mock implementation - return a simple token
    return 'mock-jwt-token';
  }
}