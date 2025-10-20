import { TokenData, User } from '../contexts/AuthContext';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:4000';

// API Response types
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

interface RegisterResponse extends LoginResponse {}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Request helper with error handling
const makeAuthRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new AuthError(
      data.message || 'Authentication request failed',
      response.status,
      data.code
    );
  }

  return data;
};

// Authentication service
export const authService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ tokens: TokenData; user: User }> {
    try {
      const response = await makeAuthRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      return {
        tokens: {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresIn: response.expires_in,
        },
        user: response.user,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Login failed. Please check your connection and try again.', 500);
    }
  },

  /**
   * Register new user
   */
  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    role: 'coach' | 'client';
    phone?: string;
    licenseNumber?: string;
  }): Promise<{ tokens: TokenData; user: User }> {
    try {
      const response = await makeAuthRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      return {
        tokens: {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresIn: response.expires_in,
        },
        user: response.user,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Registration failed. Please check your connection and try again.', 500);
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenData> {
    try {
      const response = await makeAuthRequest<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Token refresh failed. Please log in again.', 401);
    }
  },

  /**
   * Logout user
   */
  async logout(accessToken: string): Promise<void> {
    try {
      await makeAuthRequest('/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      // Log the error but don't throw - local logout should still proceed
      console.warn('Server logout failed:', error);
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await makeAuthRequest('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Password reset request failed. Please try again.', 500);
    }
  },

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<void> {
    try {
      await makeAuthRequest('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword }),
      });
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Password reset failed. Please try again.', 500);
    }
  },

  /**
   * Verify user's current password
   */
  async verifyPassword(
    accessToken: string,
    password: string
  ): Promise<boolean> {
    try {
      await makeAuthRequest('/auth/verify-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
      });
      return true;
    } catch (error) {
      if (error instanceof AuthError && error.statusCode === 401) {
        return false;
      }
      throw error;
    }
  },

  /**
   * Update user password
   */
  async updatePassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await makeAuthRequest('/auth/password-update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Password update failed. Please try again.', 500);
    }
  },
};

export default authService;