/**
 * API Client for Integration Testing
 * Provides authenticated HTTP client for each user role
 */

import { TEST_USERS, TEST_CONFIG, TestUser } from './test-users';

interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * API Client class for making authenticated requests
 */
export class ApiClient {
  private baseUrl: string;
  private tokens: AuthTokens | null = null;
  private user: TestUser | null = null;

  constructor(baseUrl: string = TEST_CONFIG.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Login and get authentication tokens
   */
  async login(user: TestUser): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Login failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    this.tokens = {
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt
    };
    this.user = user;

    return this.tokens;
  }

  /**
   * Login as a specific role
   */
  async loginAs(role: 'coach' | 'client' | 'admin' | 'super_admin'): Promise<ApiClient> {
    const user = TEST_USERS[role] || TEST_USERS.coach;
    await this.login(user);
    return this;
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): Record<string, string> {
    if (!this.tokens) {
      throw new Error('Not authenticated. Call login() first.');
    }
    return {
      Authorization: `Bearer ${this.tokens.accessToken}`
    };
  }

  /**
   * Make GET request
   */
  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      }
    });

    const data = await response.json().catch(() => null);
    return {
      status: response.status,
      data: data as T,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  /**
   * Make POST request
   */
  async post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => null);
    return {
      status: response.status,
      data: data as T,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  /**
   * Make PUT request
   */
  async put<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => null);
    return {
      status: response.status,
      data: data as T,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  /**
   * Make PATCH request
   */
  async patch<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => null);
    return {
      status: response.status,
      data: data as T,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  /**
   * Make DELETE request
   */
  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      }
    });

    const data = await response.json().catch(() => null);
    return {
      status: response.status,
      data: data as T,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  /**
   * Upload file with multipart/form-data
   */
  async upload<T = unknown>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader()
        // Note: Don't set Content-Type for multipart, browser will set it
      },
      body: formData
    });

    const data = await response.json().catch(() => null);
    return {
      status: response.status,
      data: data as T,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  /**
   * Get current user
   */
  getCurrentUser(): TestUser | null {
    return this.user;
  }

  /**
   * Get current tokens
   */
  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    this.tokens = null;
    this.user = null;
  }
}

/**
 * Create pre-authenticated API clients for each role
 */
export async function createCoachClient(): Promise<ApiClient> {
  const client = new ApiClient();
  await client.loginAs('coach');
  return client;
}

export async function createClientClient(): Promise<ApiClient> {
  const client = new ApiClient();
  await client.loginAs('client');
  return client;
}

export async function createAdminClient(): Promise<ApiClient> {
  const client = new ApiClient();
  await client.loginAs('admin');
  return client;
}

/**
 * Health check utility
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for API to be ready
 */
export async function waitForApi(maxAttempts = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkApiHealth()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error(`API not ready after ${maxAttempts} attempts`);
}
