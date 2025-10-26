import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSavedQueries, useSavedQuery } from "../use-saved-queries";
import type { SavedQuery, CreateSavedQueryRequest } from "@/types/saved-queries";

// Mock dependencies
jest.mock("@/lib/api/backend", () => ({
  backendPath: (path: string) => `http://localhost:88/api/v1${path}`,
}));

jest.mock("@/utils/auth-utils", () => ({
  getAuthTokenFromCookie: jest.fn(() => "test-token"),
}));

// Mock HTTP client
const mockHttp = {
  get: jest.fn(),
};

const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock("@/lib/api/httpClient", () => ({
  http: mockHttp,
  apiClient: mockApiClient,
}));

// Mock error handling utilities
jest.mock("@/utils/errorHandling", () => ({
  retrySavedQueryOperation: jest.fn((operation) => operation()),
  createNetworkAwareOperation: jest.fn((operation) => operation),
}));

jest.mock("@/utils/query-error-recovery", () => ({
  createStableRef: jest.fn((obj) => obj),
  logErrorWithContext: jest.fn(),
}));

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("useSavedQueries", () => {
  const mockSavedQuery: SavedQuery = {
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

  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
    
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useSavedQueries hook", () => {
    it("should fetch saved queries successfully", async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse,
        },
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.queries).toEqual([mockSavedQuery]);
      expect(result.current.pagination).toEqual(mockResponse.pagination);
      expect(result.current.error).toBeNull();
    });

    it("should handle loading state", () => {
      // Don't mock the HTTP call to simulate loading state
      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      expect(result.current.queries).toEqual([]);
      expect(result.current.isLoading).toBe(true);
    });

    it("should handle error state", async () => {
      const mockError = new Error("Failed to fetch");
      mockHttp.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.queries).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });

    it("should build correct query key with parameters", async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse,
        },
      });

      const { result } = renderHook(() => useSavedQueries({ page: 2, limit: 10, search: "test" }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      expect(mockHttp.get).toHaveBeenCalledWith(
        "http://localhost:88/api/v1/saved-queries?page=2&limit=10&search=test",
        expect.any(Object)
      );
    });

    it("should provide getQueryById function", async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse,
        },
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      const foundQuery = result.current.getQueryById("test-id-123");
      const notFoundQuery = result.current.getQueryById("nonexistent");

      expect(foundQuery).toEqual(mockSavedQuery);
      expect(notFoundQuery).toBeUndefined();
    });

    it("should provide loadQuery function", async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse,
        },
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      const loadedQuery = result.current.loadQuery(mockSavedQuery);

      expect(loadedQuery).toEqual(mockSavedQuery);
      expect(consoleSpy).toHaveBeenCalledWith("Loading query:", mockSavedQuery);

      consoleSpy.mockRestore();
    });
  });

  describe("useSavedQuery hook", () => {
    it("should fetch single saved query successfully", async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          success: true,
          data: mockSavedQuery,
        },
      });

      const { result } = renderHook(() => useSavedQuery("test-id-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.query).toEqual(mockSavedQuery);
      expect(result.current.error).toBeNull();
    });

    it("should handle error state for single query", async () => {
      const mockError = new Error("Query not found");
      mockHttp.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useSavedQuery("test-id-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.query).toBeUndefined();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("mutation operations", () => {
    it("should handle create query mutation", async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse,
        },
      });

      mockApiClient.post.mockResolvedValue({
        success: true,
        data: mockSavedQuery,
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      const createData: CreateSavedQueryRequest = {
        name: "New Query",
        reportParams: mockSavedQuery.reportParams,
        activeFilters: mockSavedQuery.activeFilters,
        filterValues: mockSavedQuery.filterValues,
      };

      await result.current.createQuery(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith("/saved-queries", createData, expect.any(Object));
    });

    it("should handle update query mutation", async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse,
        },
      });

      const updatedQuery = { ...mockSavedQuery, name: "Updated Query" };
      mockApiClient.put.mockResolvedValue({
        success: true,
        data: updatedQuery,
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      const updateData = { name: "Updated Query" };

      await result.current.updateQuery("test-id-123", updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith("/saved-queries/test-id-123", updateData, expect.any(Object));
    });

    it("should handle delete query mutation", async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse,
        },
      });

      mockApiClient.delete.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useSavedQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      await result.current.deleteQuery("test-id-123");

      expect(mockApiClient.delete).toHaveBeenCalledWith("/saved-queries/test-id-123", expect.any(Object));
    });
  });
});
