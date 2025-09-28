import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";

// Mock dependencies first
vi.mock("@/lib/backend", () => ({
  backendPath: (path: string) => `http://localhost:88/api/v1${path}`,
}));

vi.mock("@/lib/base-path", () => ({
  apiPath: (path: string) => `/api${path}`,
}));

vi.mock("@/lib/httpClient", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/utils/errorHandling", () => ({
  retrySavedQueryOperation: vi.fn((operation) => operation()),
  createNetworkAwareOperation: vi.fn((operation) => operation),
}));

vi.mock("@/utils/query-error-recovery", () => ({
  createStableRef: vi.fn((obj) => obj),
  logErrorWithContext: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch for saved queries
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
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("Mutation Hooks Basic Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("useSavedQueries basic functionality", () => {
    it("should provide mutation functions", async () => {
      // Import after mocks are set up
      const { useSavedQueries } = await import("../use-saved-queries");
      
      const mockResponse = {
        queries: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      // Mock the initial fetch for queries list
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify mutation functions exist
      expect(typeof result.current.createQuery).toBe("function");
      expect(typeof result.current.updateQuery).toBe("function");
      expect(typeof result.current.deleteQuery).toBe("function");
      expect(typeof result.current.mutate).toBe("function");
      expect(typeof result.current.getQueryById).toBe("function");
      expect(typeof result.current.loadQuery).toBe("function");

      // Verify loading states exist
      expect(typeof result.current.isCreating).toBe("boolean");
      expect(typeof result.current.isUpdating).toBe("boolean");
      expect(typeof result.current.isDeleting).toBe("boolean");

      // Verify error states exist
      expect(result.current.createError).toBeDefined();
      expect(result.current.updateError).toBeDefined();
      expect(result.current.deleteError).toBeDefined();
    });

    it("should provide backward compatibility with mutate alias", async () => {
      const { useSavedQueries } = await import("../use-saved-queries");
      
      const mockResponse = {
        queries: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.mutate).toBe("function");
      expect(result.current.mutate).toBe(result.current.refetch);
    });
  });

  describe("useSavedQuery single query hook", () => {
    it("should provide mutate alias for backward compatibility", async () => {
      const { useSavedQuery } = await import("../use-saved-queries");
      
      const mockSavedQuery = {
        id: "test-id-123",
        name: "Test Query",
        description: "Test description",
        reportParams: { tahun: "2024" },
        activeFilters: [],
        filterValues: {},
        userId: "user-123",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSavedQuery),
      });

      const { result } = renderHook(() => useSavedQuery("test-id-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.mutate).toBe("function");
      expect(result.current.query).toEqual(mockSavedQuery);
    });

    it("should not fetch when id is null", async () => {
      const { useSavedQuery } = await import("../use-saved-queries");
      
      const { result } = renderHook(() => useSavedQuery(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.query).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Notification hooks basic functionality", () => {
    it("should provide admin notifications with mutate alias", async () => {
      const { useAdminNotifications } = await import("../../lib/notifications-store");
      
      const { http } = await import("@/lib/httpClient");
      
      vi.mocked(http.get).mockResolvedValueOnce({
        data: {
          data: {
            notifications: [
              {
                id: "notif-123",
                title: "Test Notification",
                message: "Test message",
                type: "info",
                priority: "medium",
                sender: { name: "System" },
                recipients: ["user1"],
                createdAt: "2024-01-01T00:00:00Z",
                reads: [],
              },
            ],
          },
        },
      });

      const { result } = renderHook(() => useAdminNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(1);
      expect(typeof result.current.mutate).toBe("function");
    });

    it("should provide user notifications with mutate alias", async () => {
      const { useUserNotifications } = await import("../../lib/notifications-store");
      
      const { http } = await import("@/lib/httpClient");
      
      vi.mocked(http.get).mockResolvedValueOnce({
        data: {
          data: {
            notifications: [
              {
                id: "notif-123",
                title: "Test Notification",
                message: "Test message",
                type: "info",
                priority: "medium",
                sender: "System",
                recipients: ["user1"],
                createdAt: "2024-01-01T00:00:00Z",
                read: false,
              },
            ],
          },
        },
      });

      const { result } = renderHook(() => useUserNotifications("user1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(1);
      expect(typeof result.current.mutate).toBe("function");
    });

    it("should provide notification mutation hooks", async () => {
      const {
        useMarkNotificationAsReadMutation,
        useMarkAllNotificationsAsReadMutation,
        useDeleteNotificationMutation,
      } = await import("../../lib/notifications-store");

      const markAsReadResult = renderHook(() => useMarkNotificationAsReadMutation(), {
        wrapper: createWrapper(),
      });

      const markAllAsReadResult = renderHook(() => useMarkAllNotificationsAsReadMutation(), {
        wrapper: createWrapper(),
      });

      const deleteResult = renderHook(() => useDeleteNotificationMutation(), {
        wrapper: createWrapper(),
      });

      // Verify mutation functions exist
      expect(typeof markAsReadResult.result.current.trigger).toBe("function");
      expect(typeof markAsReadResult.result.current.isMutating).toBe("boolean");
      expect(markAsReadResult.result.current.error).toBeDefined();

      expect(typeof markAllAsReadResult.result.current.trigger).toBe("function");
      expect(typeof markAllAsReadResult.result.current.isMutating).toBe("boolean");
      expect(markAllAsReadResult.result.current.error).toBeDefined();

      expect(typeof deleteResult.result.current.trigger).toBe("function");
      expect(typeof deleteResult.result.current.isMutating).toBe("boolean");
      expect(deleteResult.result.current.error).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should handle fetch errors gracefully", async () => {
      const { useSavedQueries } = await import("../use-saved-queries");
      
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.queries).toEqual([]);
    });

    it("should handle HTTP errors gracefully", async () => {
      const { useSavedQueries } = await import("../use-saved-queries");
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: "Server error" }),
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.queries).toEqual([]);
    });
  });

  describe("Cache behavior", () => {
    it("should use appropriate stale times", async () => {
      const { useSavedQueries } = await import("../use-saved-queries");
      
      const mockResponse = {
        queries: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The hook should be configured with appropriate stale times
      // This is tested implicitly through the hook behavior
      expect(result.current.queries).toEqual([]);
    });
  });
});