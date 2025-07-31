/**
 * useGoogleIntegration - Hook test suite for Google integration state management
 * Tests centralized Google account connection and configuration handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useGoogleIntegration } from './useGoogleIntegration';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useGoogleIntegration', () => {
  const mockUserId = 'test-user-id';
  const mockAuthToken = 'mock-auth-token';

  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(mockAuthToken);
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadAccounts', () => {
    it('should load Google accounts successfully', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          email: 'coach@example.com',
          name: 'John Doe Coach',
          isActive: true,
          calendarSyncEnabled: true,
          emailSyncEnabled: true,
          permissions: { calendar: true, email: true, meet: true },
          stats: { eventsCreated: 15, emailsSent: 30, lastActivity: '2024-01-15' }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accounts: mockAccounts }),
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.accounts).toEqual(mockAccounts);
      expect(result.current.state.hasActiveAccount).toBe(true);
      expect(result.current.state.primaryAccount).toEqual(mockAccounts[0]);
      expect(result.current.state.error).toBeNull();
    });

    it('should handle account loading error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.error).toBe('Failed to load Google accounts');
      expect(result.current.state.accounts).toEqual([]);
      expect(result.current.state.hasActiveAccount).toBe(false);
    });

    it('should not load accounts when userId is missing', async () => {
      const { result } = renderHook(() => useGoogleIntegration(''));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.state.accounts).toEqual([]);
    });
  });

  describe('connectAccount', () => {
    it('should generate OAuth URL successfully', async () => {
      const mockAuthUrl = 'https://accounts.google.com/oauth/authorize?client_id=...';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authUrl: mockAuthUrl }),
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      let authUrl: string;
      await act(async () => {
        authUrl = await result.current.connectAccount();
      });

      expect(authUrl!).toBe(mockAuthUrl);
      expect(mockFetch).toHaveBeenCalledWith('/api/google/auth/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockAuthToken}`,
        },
        body: JSON.stringify({
          userId: mockUserId,
          scopes: ['calendar', 'email', 'meet'],
          redirectUri: `${window.location.origin}/google/callback`
        }),
      });
    });

    it('should handle OAuth URL generation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      await expect(async () => {
        await act(async () => {
          await result.current.connectAccount();
        });
      }).rejects.toThrow('Failed to get OAuth URL');
    });
  });

  describe('disconnectAccount', () => {
    it('should disconnect account successfully', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          email: 'coach1@example.com',
          isActive: true,
        },
        {
          id: 'account-2', 
          email: 'coach2@example.com',
          isActive: false,
        }
      ];

      // Setup initial state with accounts
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accounts: mockAccounts }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.state.accounts).toHaveLength(2);
      });

      // Disconnect account
      await act(async () => {
        await result.current.disconnectAccount('account-1');
      });

      expect(result.current.state.accounts).toHaveLength(1);
      expect(result.current.state.accounts[0].id).toBe('account-2');
      expect(result.current.state.hasActiveAccount).toBe(false);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/google/accounts/account-1/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
        },
      });
    });

    it('should handle disconnect failure', async () => {
      const mockAccounts = [{ id: 'account-1', email: 'test@example.com', isActive: true }];

      // Setup initial state and mock failure
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accounts: mockAccounts }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      await waitFor(() => {
        expect(result.current.state.accounts).toHaveLength(1);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.disconnectAccount('account-1');
        });
      }).rejects.toThrow('Failed to disconnect account');

      expect(result.current.state.error).toBe('Failed to disconnect account');
      expect(result.current.state.accounts).toHaveLength(1); // Should remain unchanged
    });
  });

  describe('updateAccountPermissions', () => {
    it('should update permissions successfully', async () => {
      const mockAccount = {
        id: 'account-1',
        email: 'coach@example.com',
        isActive: true,
        permissions: { calendar: true, email: false, meet: true },
        calendarSyncEnabled: true,
        emailSyncEnabled: false
      };

      // Setup initial state and mock successful update
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accounts: [mockAccount] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      await waitFor(() => {
        expect(result.current.state.accounts).toHaveLength(1);
      });

      // Update email permission
      await act(async () => {
        await result.current.updateAccountPermissions('account-1', { email: true });
      });

      const updatedAccount = result.current.state.accounts[0];
      expect(updatedAccount.permissions.email).toBe(true);
      expect(updatedAccount.emailSyncEnabled).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith('/api/google/accounts/account-1/permissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockAuthToken}`,
        },
        body: JSON.stringify({ email: true }),
      });
    });
  });

  describe('updateConfig', () => {
    it('should update configuration successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      const newConfig = { automaticCalendarSync: false, defaultMeetingDuration: 90 };

      await act(async () => {
        await result.current.updateConfig(newConfig);
      });

      expect(result.current.config.automaticCalendarSync).toBe(false);
      expect(result.current.config.defaultMeetingDuration).toBe(90);

      expect(mockFetch).toHaveBeenCalledWith('/api/google/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockAuthToken}`,
        },
        body: JSON.stringify({
          userId: mockUserId,
          config: expect.objectContaining(newConfig)
        }),
      });
    });
  });

  describe('utility flags', () => {
    it('should compute utility flags correctly with active account', async () => {
      const mockAccount = {
        id: 'account-1',
        email: 'coach@example.com',
        isActive: true,
        permissions: { calendar: true, email: true, meet: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accounts: [mockAccount] }),
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      await waitFor(() => {
        expect(result.current.state.hasActiveAccount).toBe(true);
      });

      expect(result.current.canCreateMeetLinks).toBe(true);
      expect(result.current.canSyncCalendar).toBe(true);
      expect(result.current.canSendEmails).toBe(true);
    });

    it('should compute utility flags correctly without permissions', async () => {
      const mockAccount = {
        id: 'account-1',
        email: 'coach@example.com',
        isActive: true,
        permissions: { calendar: false, email: false, meet: false }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accounts: [mockAccount] }),
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      await waitFor(() => {
        expect(result.current.state.hasActiveAccount).toBe(true);
      });

      expect(result.current.canCreateMeetLinks).toBe(false);
      expect(result.current.canSyncCalendar).toBe(false);
      expect(result.current.canSendEmails).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Connection test passed' }),
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      let testResult: { success: boolean; message: string };
      await act(async () => {
        testResult = await result.current.testConnection('account-1');
      });

      expect(testResult!.success).toBe(true);
      expect(testResult!.message).toBe('Connection test passed');
    });

    it('should handle connection test failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const { result } = renderHook(() => useGoogleIntegration(mockUserId));

      let testResult: { success: boolean; message: string };
      await act(async () => {
        testResult = await result.current.testConnection('account-1');
      });

      expect(testResult!.success).toBe(false);
      expect(testResult!.message).toBe('Connection test failed');
    });
  });
});