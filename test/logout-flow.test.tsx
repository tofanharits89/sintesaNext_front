/**
 * Logout Flow Test
 * Verifies that the logout flow works correctly without dashboard flash
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

describe('Logout Flow', () => {
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

  it('should set logout in progress flag', () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isLogoutInProgress).toBe(true);
    expect(result.current.isLoggingOut).toBe(true);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress',
      expect.any(String)
    );
  });

  it('should persist logout state to sessionStorage', () => {
    const { result } = renderHook(() => useAuthSessionStore(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    act(() => {
      result.current.setLogoutInProgress(true);
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress',
      expect.any(String)
    );

    act(() => {
      result.current.setLogoutInProgress(false);
    });

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress'
    );
  });

  it('should reset logout state', () => {
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

    // Reset should clear it
    act(() => {
      result.current.reset();
    });

    expect(result.current.isLogoutInProgress).toBe(false);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'sintesa_logout_in_progress'
    );
  });
});
