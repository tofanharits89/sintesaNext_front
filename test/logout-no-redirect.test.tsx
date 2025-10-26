/**
 * Test to verify logout prevents redirect to dashboard
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

describe('Logout No Redirect Fix', () => {
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

  it('should not show authenticated state after logout', async () => {
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
    expect(result.current.user).not.toBeNull();

    // Logout
    act(() => {
      result.current.logout();
    });

    // Verify user is not authenticated
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLogoutInProgress).toBe(true);
  });

  it('should set logout in progress flag during logout', () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // Initial state
    expect(result.current.isLogoutInProgress).toBe(false);

    // Start logout
    act(() => {
      result.current.logout();
    });

    // Should be in logout progress
    expect(result.current.isLogoutInProgress).toBe(true);
    expect(result.current.isLoggingOut).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should clear logout in progress flag when set to false', () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // Set logout in progress
    act(() => {
      result.current.setLogoutInProgress(true);
    });

    expect(result.current.isLogoutInProgress).toBe(true);

    // Clear it
    act(() => {
      result.current.setLogoutInProgress(false);
    });

    expect(result.current.isLogoutInProgress).toBe(false);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress'
    );
  });

  it('should reset all auth state on reset', () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // Set full state
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
      result.current.setLogoutInProgress(true);
      result.current.setLoggingOut(true);
      result.current.setSocketConnected(true);
    });

    // Reset should clear everything
    act(() => {
      result.current.reset();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLogoutInProgress).toBe(false);
    expect(result.current.isLoggingOut).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.socketConnected).toBe(false);
  });
});
