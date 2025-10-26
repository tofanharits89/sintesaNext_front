/**
 * Test to verify the logout async fix prevents dashboard flash
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthSessionStore } from '@/stores/session-store';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock window.location
const mockLocation = {
  pathname: '/dashboard',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
});

describe('Logout Async Fix - No Dashboard Flash', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockLocation.pathname = '/dashboard';
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should not redirect to dashboard after successful logout', async () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // Set user as authenticated
    act(() => {
      result.current.setAuthenticated(true, {
        id: '1',
        username: 'test',
        name: 'Test User',
        email: 'test@example.com',
        role: 'kppn',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Trigger logout
    act(() => {
      result.current.logout();
    });

    // After logout, user should NOT be authenticated
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLogoutInProgress).toBe(true);

    // Simulate successful logout completion
    act(() => {
      result.current.setLogoutInProgress(false);
    });

    // Now user should be fully logged out
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLogoutInProgress).toBe(false);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress'
    );

    // Verify session storage was cleared
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress'
    );
  });

  it('should clear all auth state on logout', () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // Set full authenticated state
    act(() => {
      result.current.setAuthenticated(true, {
        id: '1',
        username: 'test',
        name: 'Test User',
        email: 'test@example.com',
        role: 'kppn',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      result.current.setSessionExpiry(new Date());
      result.current.setSocketConnected(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).not.toBeNull();
    expect(result.current.socketConnected).toBe(true);

    // Logout should clear everything
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.socketConnected).toBe(false);
    expect(result.current.sessionExpiry).toBeNull();
  });
});
