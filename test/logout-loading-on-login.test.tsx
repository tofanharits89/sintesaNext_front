/**
 * Test to verify logout loading doesn't appear during login
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
  pathname: '/login',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
});

describe('Logout Loading on Login Fix', () => {
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
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should NOT have logout in progress after login (setAuthenticated)', () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // Simulate user logging in
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

    // After login, logout in progress should be false
    expect(result.current.isLogoutInProgress).toBe(false);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress'
    );
  });

  it('should NOT have logout in progress after updateUser', () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // First set logout in progress (simulate user was in logout state)
    act(() => {
      result.current.setLogoutInProgress(true);
    });

    expect(result.current.isLogoutInProgress).toBe(true);

    // Then update user (simulating login while in logout state)
    act(() => {
      result.current.updateUser({
        id: '1',
        username: 'test',
        name: 'Test User',
        email: 'test@example.com',
        role: 'kppn',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    });

    // After user update, logout in progress should be cleared
    expect(result.current.isLogoutInProgress).toBe(false);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress'
    );
  });

  it('should clear stale logout flag after 5 seconds', async () => {
    mockLocation.pathname = '/dashboard';

    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // Simulate stale logout flag (6 seconds old)
    const staleTimestamp = (Date.now() - 6000).toString();
    mockSessionStorage.getItem.mockReturnValue(staleTimestamp);

    // Re-render to trigger onRehydrateStorage effect
    act(() => {
      result.current.setLogoutInProgress(false);
    });

    // The stale flag should be cleared
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress'
    );
  });
});
