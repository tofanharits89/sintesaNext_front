import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";

// Import the migrated mutation hooks
import { useSavedQueries, useSavedQuery } from "../use-saved-queries";
import {
  useAdminNotifications,
  useUserNotifications,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from "../../lib/notifications-store";

// Mock dependencies
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

describe("Migrated Mutation Hooks", () => {
  let mockHttp: any;
  let mockApiClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked modules
    const httpClientModule = await import("@/lib/httpClient");
    mockHttp = httpClientModule.http;
    mockApiClient = httpClientModule.apiClient;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("useSavedQueries mutations", () => {
    const mockSavedQuery = {
      id: "test-id-123",
      name: "Test Query",
      description: "Test description",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "REALISASI",
        pembulatan: "RIBUAN",
      },
      activeFilters: ["KDDEPT", "KDUNIT"],
      filterValues: {
        KDDEPT: {
          selection: "001",
          kondisiCode: "SAMA_DENGAN",
          mengandungKata: "",
          jenisTampilan: "kode_uraian",
        },
      },
      userId: "user-123",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const mockResponse = {
      queries: [mockSavedQuery],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };

    it("should create a saved query successfully", async () => {
      // Mock the initial fetch for queries list
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      // Mock the create API call
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: mockSavedQuery,
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const createData = {
        name: "New Query",
        reportParams: mockSavedQuery.reportParams,
        activeFilters: mockSavedQuery.activeFilters,
        filterValues: mockSavedQuery.filterValues,
      };

      let createdQuery;
      await act(async () => {
        createdQuery = await result.current.createQuery(createData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/saved-queries", createData, {
        timeout: 15000,
      });
      expect(createdQuery).toEqual(mockSavedQuery);
      expect(result.current.createError).toBeNull();
    });

    it("should update a saved query successfully", async () => {
      // Mock the initial fetch for queries list
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      const updatedQuery = { ...mockSavedQuery, name: "Updated Query" };
      mockApiClient.put.mockResolvedValueOnce({
        success: true,
        data: updatedQuery,
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updateData = { name: "Updated Query" };

      let updatedResult;
      await act(async () => {
        updatedResult = await result.current.updateQuery("test-id-123", updateData);
      });

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/saved-queries/test-id-123",
        updateData,
        { timeout: 10000 }
      );
      expect(updatedResult).toEqual(updatedQuery);
      expect(result.current.updateError).toBeNull();
    });

    it("should delete a saved query successfully", async () => {
      // Mock the initial fetch for queries list
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      mockApiClient.delete.mockResolvedValueOnce({});

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteQuery("test-id-123");
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith("/saved-queries/test-id-123", {
        timeout: 10000,
      });
      expect(result.current.deleteError).toBeNull();
    });

    it("should handle create query errors", async () => {
      // Mock the initial fetch for queries list
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      const error = new Error("Create failed");
      mockApiClient.post.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const createData = {
        name: "New Query",
        reportParams: mockSavedQuery.reportParams,
        activeFilters: mockSavedQuery.activeFilters,
        filterValues: mockSavedQuery.filterValues,
      };

      await act(async () => {
        try {
          await result.current.createQuery(createData);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(result.current.createError).toBeTruthy();
    });

    it("should provide mutate alias for backward compatibility", async () => {
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

      expect(typeof result.current.mutate).toBe("function");
    });

    it("should provide getQueryById function", async () => {
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

      const foundQuery = result.current.getQueryById("test-id-123");
      const notFoundQuery = result.current.getQueryById("nonexistent");

      expect(foundQuery).toEqual(mockSavedQuery);
      expect(notFoundQuery).toBeUndefined();
    });
  });

  describe("useSavedQuery single query hook", () => {
    const mockSavedQuery = {
      id: "test-id-123",
      name: "Test Query",
      description: "Test description",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "REALISASI",
        pembulatan: "RIBUAN",
      },
      activeFilters: ["KDDEPT"],
      filterValues: {},
      userId: "user-123",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    it("should fetch single saved query successfully", async () => {
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

      expect(result.current.query).toEqual(mockSavedQuery);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.mutate).toBe("function");
    });

    it("should not fetch when id is null", () => {
      const { result } = renderHook(() => useSavedQuery(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.query).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Notification mutations", () => {
    describe("useAdminNotifications", () => {
      it("should fetch admin notifications successfully", async () => {
        mockHttp.get.mockResolvedValueOnce({
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
                  recipients: ["user1", "user2"],
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
        expect(result.current.items[0]).toMatchObject({
          id: "notif-123",
          title: "Test Notification",
          message: "Test message",
          type: "info",
          priority: "medium",
          sender: "System",
          recipients: ["user1", "user2"],
        });
        expect(typeof result.current.mutate).toBe("function");
      });

      it("should handle admin notifications fetch error", async () => {
        const error = new Error("Fetch failed");
        mockHttp.get.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useAdminNotifications(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBeTruthy();
        expect(result.current.items).toEqual([]);
      });
    });

    describe("useUserNotifications", () => {
      it("should fetch user notifications successfully", async () => {
        mockHttp.get.mockResolvedValueOnce({
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
        expect(result.current.items[0]).toMatchObject({
          id: "notif-123",
          title: "Test Notification",
          message: "Test message",
          type: "info",
          priority: "medium",
          sender: "System",
          recipients: ["user1"],
          readBy: [], // read: false means empty readBy array
        });
        expect(typeof result.current.mutate).toBe("function");
      });

      it("should not fetch when username is not provided", () => {
        const { result } = renderHook(() => useUserNotifications(), {
          wrapper: createWrapper(),
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.items).toEqual([]);
        expect(mockHttp.get).not.toHaveBeenCalled();
      });
    });

    describe("useMarkNotificationAsReadMutation", () => {
      it("should mark notification as read successfully", async () => {
        mockHttp.put.mockResolvedValueOnce({ data: {} });

        const { result } = renderHook(() => useMarkNotificationAsReadMutation(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.trigger({
            notificationId: "notif-123",
            username: "user1",
          });
        });

        await waitFor(() => {
          expect(result.current.isMutating).toBe(false);
        });

        expect(mockHttp.put).toHaveBeenCalledWith("/api/notifications/notif-123/read", {});
        expect(result.current.error).toBeNull();
      });

      it("should handle mark as read error", async () => {
        const error = new Error("Mark as read failed");
        mockHttp.put.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useMarkNotificationAsReadMutation(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.trigger({
            notificationId: "notif-123",
            username: "user1",
          });
        });

        await waitFor(() => {
          expect(result.current.isMutating).toBe(false);
        });

        expect(result.current.error).toBeTruthy();
      });
    });

    describe("useMarkAllNotificationsAsReadMutation", () => {
      it("should mark all notifications as read successfully", async () => {
        mockHttp.put.mockResolvedValueOnce({ data: {} });

        const { result } = renderHook(() => useMarkAllNotificationsAsReadMutation(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.trigger("user1");
        });

        await waitFor(() => {
          expect(result.current.isMutating).toBe(false);
        });

        expect(mockHttp.put).toHaveBeenCalledWith("/api/notifications/read/all", {});
        expect(result.current.error).toBeNull();
      });

      it("should handle mark all as read error", async () => {
        const error = new Error("Mark all as read failed");
        mockHttp.put.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useMarkAllNotificationsAsReadMutation(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.trigger("user1");
        });

        await waitFor(() => {
          expect(result.current.isMutating).toBe(false);
        });

        expect(result.current.error).toBeTruthy();
      });
    });

    describe("useDeleteNotificationMutation", () => {
      it("should delete notification successfully", async () => {
        mockHttp.delete.mockResolvedValueOnce({ data: {} });

        const { result } = renderHook(() => useDeleteNotificationMutation(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.trigger("notif-123");
        });

        await waitFor(() => {
          expect(result.current.isMutating).toBe(false);
        });

        expect(mockHttp.delete).toHaveBeenCalledWith("/api/notifications/notif-123");
        expect(result.current.error).toBeNull();
      });

      it("should handle delete notification error", async () => {
        const error = new Error("Delete failed");
        mockHttp.delete.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useDeleteNotificationMutation(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.trigger("notif-123");
        });

        await waitFor(() => {
          expect(result.current.isMutating).toBe(false);
        });

        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe("Cache invalidation behavior", () => {
    it("should invalidate cache after successful mutations", async () => {
      // This test verifies that mutations properly invalidate related queries
      // The actual cache invalidation is tested implicitly through the mutation success callbacks
      
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

      // Mock the initial fetch for queries list
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ queries: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      });

      // Mock the create API call
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: mockSavedQuery,
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Perform create mutation
      await act(async () => {
        await result.current.createQuery({
          name: "New Query",
          reportParams: { tahun: "2024" },
          activeFilters: [],
          filterValues: {},
        });
      });

      // The cache should be updated optimistically
      expect(result.current.queries).toHaveLength(1);
      expect(result.current.queries[0]).toEqual(mockSavedQuery);
    });
  });
});