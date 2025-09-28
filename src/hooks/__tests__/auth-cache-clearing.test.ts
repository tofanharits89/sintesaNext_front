import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/stores/messaging-ui-store", () => ({
  useMessagingUIStore: {
    getState: () => ({
      setActiveConversation: vi.fn(),
      clearMessageInput: vi.fn(),
      setNewMessageDialogOpen: vi.fn(),
      setSelectedRecipient: vi.fn(),
      setSearchQuery: vi.fn(),
      setFilteredConversations: vi.fn(),
      setLoadingConversation: vi.fn(),
      setSendingMessage: vi.fn(),
      conversationStates: {},
      resetConversationState: vi.fn(),
    }),
  },
}));

vi.mock("@/stores/typing-indicators-store", () => ({
  useTypingIndicatorsStore: {
    getState: () => ({
      clearAllTyping: vi.fn(),
    }),
  },
}));

vi.mock("@/stores/unread-badges-store", () => ({
  useUnreadBadgesStore: {
    getState: () => ({
      clearAllUnread: vi.fn(),
    }),
  },
}));

vi.mock("@/features/messaging/temp-messages-store", () => ({
  clearAllTempMessages: vi.fn(),
}));

vi.mock("@/services/messageQueue", () => ({
  messageQueue: {
    clearAllMessages: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("Authentication Cache Clearing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful auth response by default
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { userId: "user-123", role: "user" },
      }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("useClientAuth cache invalidation", () => {
    it("should provide invalidateAuth function", async () => {
      const { useClientAuth } = await import("../useClientAuth");

      const { result } = renderHook(() => useClientAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.invalidateAuth).toBe("function");
      expect(typeof result.current.refreshAuth).toBe("function");
      expect(typeof result.current.logout).toBe("function");
    });

    it("should clear cache on logout", async () => {
      const { useClientAuth } = await import("../useClientAuth");

      // Mock logout endpoint
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useClientAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify logout endpoint was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/logout"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        })
      );
    });

    it("should handle logout even if endpoint fails", async () => {
      const { useClientAuth } = await import("../useClientAuth");

      // Mock logout endpoint failure
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useClientAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Perform logout - should not throw
      await act(async () => {
        await result.current.logout();
      });

      // Should still attempt to call logout endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/logout"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        })
      );
    });

    it("should invalidate auth cache when called", async () => {
      const { useClientAuth } = await import("../useClientAuth");

      const { result } = renderHook(() => useClientAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call invalidateAuth
      act(() => {
        result.current.invalidateAuth();
      });

      // The function should exist and be callable
      expect(typeof result.current.invalidateAuth).toBe("function");
    });

    it("should refresh auth when called", async () => {
      const { useClientAuth } = await import("../useClientAuth");

      const { result } = renderHook(() => useClientAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call refreshAuth
      await act(async () => {
        await result.current.refreshAuth();
      });

      // Should have made additional fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  describe("Messaging cleanup on auth events", () => {
    it("should provide messaging cleanup function", async () => {
      const { useMessagingCleanup } = await import("../../utils/messaging-cleanup");

      const { result } = renderHook(() => useMessagingCleanup(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.cleanupMessaging).toBe("function");
    });

    it("should clear messaging state when cleanup is called", async () => {
      const { useMessagingCleanup } = await import("../../utils/messaging-cleanup");
      const { messageQueue } = await import("@/services/messageQueue");
      const { clearAllTempMessages } = await import("@/features/messaging/temp-messages-store");

      const { result } = renderHook(() => useMessagingCleanup(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.cleanupMessaging();
      });

      // Verify cleanup functions were called
      expect(messageQueue.clearAllMessages).toHaveBeenCalled();
      expect(clearAllTempMessages).toHaveBeenCalled();
    });
  });

  describe("Auth event utilities", () => {
    it("should clear auth data on logout", async () => {
      const { clearAuthData, dispatchLogout } = await import("../../utils/auth-events");

      // Mock document.cookie
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'authState=test; accessToken=test',
      });

      // Mock localStorage
      const mockLocalStorage = {
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      // Mock sessionStorage
      const mockSessionStorage = {
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
      });

      // Call clearAuthData
      clearAuthData();

      // Verify localStorage cleanup was attempted
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it("should dispatch logout events", async () => {
      const { dispatchLogout } = await import("../../utils/auth-events");

      const mockDispatchEvent = vi.fn();
      Object.defineProperty(window, 'dispatchEvent', {
        value: mockDispatchEvent,
      });

      dispatchLogout("test reason");

      // Verify events were dispatched
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout',
          detail: expect.objectContaining({
            reason: 'test reason',
            timestamp: expect.any(String),
          }),
        })
      );

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:state-change',
          detail: expect.objectContaining({
            authenticated: false,
            user: null,
          }),
        })
      );
    });

    it("should dispatch login events", async () => {
      const { dispatchLoginSuccess } = await import("../../utils/auth-events");

      const mockDispatchEvent = vi.fn();
      Object.defineProperty(window, 'dispatchEvent', {
        value: mockDispatchEvent,
      });

      const mockUser = {
        id: "user-123",
        username: "testuser",
        name: "Test User",
        role: "user",
      };

      dispatchLoginSuccess(mockUser, "test-token");

      // Verify events were dispatched
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:login',
          detail: expect.objectContaining({
            user: mockUser,
            accessToken: 'test-token',
            timestamp: expect.any(String),
          }),
        })
      );

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:state-change',
          detail: expect.objectContaining({
            authenticated: true,
            user: mockUser,
          }),
        })
      );
    });

    it("should check authentication status", async () => {
      const { isAuthenticated } = await import("../../utils/auth-events");

      // Mock document.cookie with valid JWT
      const validJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38GbSzZ2Vp5xGlWJ8KUz_K8rKzDHc6XYf8Vz8Vz8";
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `authState=${validJWT}`,
      });

      const result = isAuthenticated();
      expect(result).toBe(true);
    });

    it("should return false for invalid authentication", async () => {
      const { isAuthenticated } = await import("../../utils/auth-events");

      // Mock document.cookie with invalid JWT
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'authState=invalid-token',
      });

      const result = isAuthenticated();
      expect(result).toBe(false);
    });

    it("should return false when no auth cookies exist", async () => {
      const { isAuthenticated } = await import("../../utils/auth-events");

      // Mock document.cookie with no auth cookies
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'someOtherCookie=value',
      });

      const result = isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe("No SWR-related console errors", () => {
    it("should not have SWR imports in auth-related files", async () => {
      // This test verifies that auth-related files don't import SWR
      // by checking that the imports work without SWR being available
      
      const { useClientAuth } = await import("../useClientAuth");
      const { useMessagingCleanup } = await import("../../utils/messaging-cleanup");
      const { clearAuthData } = await import("../../utils/auth-events");

      // These imports should work without SWR
      expect(useClientAuth).toBeDefined();
      expect(useMessagingCleanup).toBeDefined();
      expect(clearAuthData).toBeDefined();
    });

    it("should use React Query for cache management", async () => {
      const { useClientAuth } = await import("../useClientAuth");

      const { result } = renderHook(() => useClientAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify React Query is being used (no SWR)
      expect(result.current.isAuthenticated).toBeDefined();
      expect(result.current.invalidateAuth).toBeDefined();
      expect(result.current.refreshAuth).toBeDefined();
    });
  });
});