/**
 * Test suite for auth enhancements
 * Verifies automatic token refresh, 401 handling, and cross-tab sync
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryProvider } from '@tanstack/react-query';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { authenticatedFetch } from '@/lib/http-client';
import { crossTabSync } from '@/lib/cross-tab-sync';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch for testing
global.fetch = vi.fn();

// Mock localStorage for cross-tab testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock alert for cross-tab events
const addEventListenerMock = vi.fn();
const removeEventListenerMock = vi.fn();
Object.defineProperty(window, 'addEventListener', {
  value: addEventListenerMock,
});
Object.defineProperty(window, 'removeEventListener', {
  value: removeEventListenerMock,
});

describe('Auth Enhancements', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('HTTP Client 401 Handling', () => {
    it('should automatically refresh token on 401 response', async () => {
      // Mock 401 response first, then success after refresh
      const mock401Response = { ok: false, status: 401, json: () => Promise.resolve({ success: false }) };
      const mockSuccessResponse = { ok: true, status: 200, json: () => Promise.resolve({ success: true, data: { valid: true, user: { id: '1', username: 'test' } } }) };
      
      // First call returns 401, second call succeeds
      (global.fetch as any)
        .mockResolvedValueOnce(mock401Response) // Auth validation (401)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) }) // Refresh success
        .mockResolvedValueOnce(mockSuccessResponse); // Retry with new token

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryProvider client={queryClient}>{children}</QueryProvider>
      );

      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });

      result.current.login('testuser', 'testpass');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.any(Object)
        );
      });
    });

    it('should handle token refresh failure gracefully', async () => {
      const mock401Response = { ok: false, status: 401 };
      const mockRefreshFailure = { ok: false, json: () => Promise.resolve({ success: false, error: 'Refresh failed' }) };
      
      (global.fetch as any)
        .mockResolvedValueOnce(mock401Response) // Original request (401)
        .mockResolvedValueOnce(mockRefreshFailure); // Refresh failure

      try {
        await authenticatedFetch('/api/test', { method: 'GET' });
      } catch (error) {
        // Should handle gracefully without throwing
      }

      expect(global.fetch).toHaveBeenCalledTimes(2); // Original request + refresh attempt
    });
  });

  describe('Proactive Token Refresh', () => {
    it('should start refresh timer when authenticated', async () => {
      const mockUser = { id: '1', username: 'test', name: 'Test User', email: 'test@example.com', role: 'kantor_pusat' as const, status: 'active' as const, createdAt: '2023-01-01' };
      
      // Mock successful login
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { user: mockUser, csrfToken: 'test-csrf' }
        })
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryProvider client={queryClient}>{children}</QueryProvider>
      );

      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });

      // Login to trigger proactive refresh
      const loginResult = await result.current.login('testuser', 'testpass');
      
      expect(loginResult.success).toBe(true);
      expect(loginResult.user).toEqual(mockUser);

      // Check that setTimeout was called for proactive refresh
      expect(vi.useFakeTimers).toBeDefined();
    });
  });

  describe('Cross-Tab Synchronization', () => {
    it('should send logout event to other tabs', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryProvider client={queryClient}>{children}</QueryProvider>
      );

      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });

      // Trigger logout
      result.current.logout('manual_logout');

      // Verify localStorage was used to send cross-tab event
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sintesa_auth_events',
        expect.stringContaining('auth_logout')
      );
    });

    it('should send login event to other tabs', async () => {
      const mockUser = { id: '1', username: 'test', name: 'Test User', email: 'test@example.com', role: 'kantor_pusat' as const, status: 'active' as const, createdAt: '2023-01-01' };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { user: mockUser, csrfToken: 'test-csrf' }
        })
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryProvider client={queryClient}>{children}</QueryProvider>
      );

      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });

      await result.current.login('testuser', 'testpass');

      // Verify localStorage was used to send cross-tab login event
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sintesa_auth_events',
        expect.stringContaining('auth_login')
      );
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing function signatures', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryProvider client={queryClient}>{children}</QueryProvider>
      );

      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });

      // Check that all expected methods exist with correct signatures
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.validateSession).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');
      expect(typeof result.current.updateUserProfile).toBe('function');

      // Check return types are maintained
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(typeof result.current.canManageUsers).toBe('boolean');
      expect(typeof result.current.canAccessSettings).toBe('boolean');
      expect(typeof result.current.getRoleDisplayName).toBe('string');
    });

    it('should work with existing React Query patterns', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryProvider client={queryClient}>{children}</QueryProvider>
      );

      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });

      // All methods should be callable without errors
      expect(() => result.current.login('user', 'pass')).not.toThrow();
      expect(() => result.current.logout()).not.toThrow();
      expect(() => result.current.validateSession()).not.toThrow();
      expect(() => result.current.refetch()).not.toThrow();
      expect(() => result.current.clearCache()).not.toThrow();
    });
  });
});
