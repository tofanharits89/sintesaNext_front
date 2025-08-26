import { renderHook, waitFor } from "@testing-library/react";
import { useSavedQueries, useSavedQuery } from "../use-saved-queries";
import type { SavedQuery, CreateSavedQueryRequest } from "@/types/saved-queries";

// Mock SWR
jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("swr/mutation", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn(),
  mutate: jest.fn(),
}));

// Mock dependencies
jest.mock("@/lib/backend", () => ({
  backendPath: (path: string) => `http://localhost:88/api/v1${path}`,
}));

jest.mock("@/utils/auth-utils", () => ({
  getAuthTokenFromCookie: jest.fn(() => "test-token"),
}));

// Mock fetch
global.fetch = jest.fn();

import useSWR, { mutate as swrMutate } from "swr";
import useSWRMutation from "swr/mutation";

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;
const mockUseSWRMutation = useSWRMutation as jest.MockedFunction<typeof useSWRMutation>;
const mockSwrMutate = swrMutate as jest.MockedFunction<typeof swrMutate>;

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useSavedQueries hook", () => {
    it("should fetch saved queries successfully", () => {
      mockUseSWR.mockReturnValue({
        data: mockResponse,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValueOnce({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        })
        .mockReturnValueOnce({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        })
        .mockReturnValueOnce({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      const { result } = renderHook(() => useSavedQueries());

      expect(result.current.queries).toEqual([mockSavedQuery]);
      expect(result.current.pagination).toEqual(mockResponse.pagination);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle loading state", () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        mutate: jest.fn(),
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValue({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      const { result } = renderHook(() => useSavedQueries());

      expect(result.current.queries).toEqual([]);
      expect(result.current.isLoading).toBe(true);
    });

    it("should handle error state", () => {
      const mockError = new Error("Failed to fetch");
      
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        mutate: jest.fn(),
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValue({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      const { result } = renderHook(() => useSavedQueries());

      expect(result.current.queries).toEqual([]);
      expect(result.current.error).toBe(mockError);
    });

    it("should build correct SWR key with parameters", () => {
      mockUseSWR.mockReturnValue({
        data: mockResponse,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValue({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      renderHook(() => useSavedQueries({ page: 2, limit: 10, search: "test" }));

      expect(mockUseSWR).toHaveBeenCalledWith(
        "http://localhost:88/api/v1/saved-queries?page=2&limit=10&search=test",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should provide getQueryById function", () => {
      mockUseSWR.mockReturnValue({
        data: mockResponse,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValue({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      const { result } = renderHook(() => useSavedQueries());

      const foundQuery = result.current.getQueryById("test-id-123");
      const notFoundQuery = result.current.getQueryById("nonexistent");

      expect(foundQuery).toEqual(mockSavedQuery);
      expect(notFoundQuery).toBeUndefined();
    });

    it("should provide loadQuery function", () => {
      mockUseSWR.mockReturnValue({
        data: mockResponse,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValue({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const { result } = renderHook(() => useSavedQueries());

      const loadedQuery = result.current.loadQuery(mockSavedQuery);

      expect(loadedQuery).toEqual(mockSavedQuery);
      expect(consoleSpy).toHaveBeenCalledWith("Loading query:", mockSavedQuery);

      consoleSpy.mockRestore();
    });
  });

  describe("useSavedQuery hook", () => {
    it("should fetch single saved query successfully", () => {
      mockUseSWR.mockReturnValue({
        data: mockSavedQuery,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
        isValidating: false,
      });

      const { result } = renderHook(() => useSavedQuery("test-id-123"));

      expect(result.current.query).toEqual(mockSavedQuery);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should not fetch when id is null", () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
        isValidating: false,
      });

      renderHook(() => useSavedQuery(null));

      expect(mockUseSWR).toHaveBeenCalledWith(
        null,
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should handle loading state for single query", () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        mutate: jest.fn(),
        isValidating: false,
      });

      const { result } = renderHook(() => useSavedQuery("test-id-123"));

      expect(result.current.query).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
    });

    it("should handle error state for single query", () => {
      const mockError = new Error("Query not found");
      
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        mutate: jest.fn(),
        isValidating: false,
      });

      const { result } = renderHook(() => useSavedQuery("test-id-123"));

      expect(result.current.query).toBeUndefined();
      expect(result.current.error).toBe(mockError);
    });
  });

  describe("mutation operations", () => {
    it("should handle create query mutation", async () => {
      const mockMutate = jest.fn();
      const mockTrigger = jest.fn().mockResolvedValue(mockSavedQuery);

      mockUseSWR.mockReturnValue({
        data: mockResponse,
        error: null,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValueOnce({
          trigger: mockTrigger,
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        })
        .mockReturnValue({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      const { result } = renderHook(() => useSavedQueries());

      const createData: CreateSavedQueryRequest = {
        name: "New Query",
        reportParams: mockSavedQuery.reportParams,
        activeFilters: mockSavedQuery.activeFilters,
        filterValues: mockSavedQuery.filterValues,
      };

      await result.current.createQuery(createData);

      expect(mockTrigger).toHaveBeenCalledWith(createData);
    });

    it("should handle update query mutation", async () => {
      const mockMutate = jest.fn();
      const mockTrigger = jest.fn().mockResolvedValue(mockSavedQuery);

      mockUseSWR.mockReturnValue({
        data: mockResponse,
        error: null,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValueOnce({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        })
        .mockReturnValueOnce({
          trigger: mockTrigger,
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        })
        .mockReturnValue({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      const { result } = renderHook(() => useSavedQueries());

      const updateData = { name: "Updated Query" };

      await result.current.updateQuery("test-id-123", updateData);

      expect(mockTrigger).toHaveBeenCalledWith({
        id: "test-id-123",
        updates: updateData,
      });
    });

    it("should handle delete query mutation", async () => {
      const mockMutate = jest.fn();
      const mockTrigger = jest.fn().mockResolvedValue({ id: "test-id-123" });

      mockUseSWR.mockReturnValue({
        data: mockResponse,
        error: null,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      });

      mockUseSWRMutation
        .mockReturnValueOnce({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        })
        .mockReturnValueOnce({
          trigger: jest.fn(),
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        })
        .mockReturnValueOnce({
          trigger: mockTrigger,
          isMutating: false,
          error: null,
          data: undefined,
          reset: jest.fn(),
        });

      const { result } = renderHook(() => useSavedQueries());

      await result.current.deleteQuery("test-id-123");

      expect(mockTrigger).toHaveBeenCalledWith({ id: "test-id-123" });
    });
  });
});