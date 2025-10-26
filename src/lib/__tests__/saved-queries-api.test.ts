import { SavedQueriesApiService } from "../api/saved-queries-api";
import type { CreateSavedQueryRequest, SavedQuery } from "@/types/saved-queries";

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe("SavedQueriesApiService", () => {
  let apiService: SavedQueriesApiService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiService = new SavedQueriesApiService();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
  });

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

  describe("createSavedQuery", () => {
    it("should create a saved query successfully", async () => {
      const requestData: CreateSavedQueryRequest = {
        name: "Test Query",
        description: "Test description",
        reportParams: mockSavedQuery.reportParams,
        activeFilters: mockSavedQuery.activeFilters,
        filterValues: mockSavedQuery.filterValues,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockSavedQuery,
      } as Response);

      const result = await apiService.createSavedQuery(requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/saved-queries"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );
      expect(result).toEqual(mockSavedQuery);
    });

    it("should include auth token when available", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");

      const requestData: CreateSavedQueryRequest = {
        name: "Test Query",
        reportParams: mockSavedQuery.reportParams,
        activeFilters: mockSavedQuery.activeFilters,
        filterValues: mockSavedQuery.filterValues,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockSavedQuery,
      } as Response);

      await apiService.createSavedQuery(requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
        })
      );
    });

    it("should handle API errors", async () => {
      const errorResponse = {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => errorResponse,
      } as Response);

      const requestData: CreateSavedQueryRequest = {
        name: "",
        reportParams: mockSavedQuery.reportParams,
        activeFilters: mockSavedQuery.activeFilters,
        filterValues: mockSavedQuery.filterValues,
      };

      await expect(apiService.createSavedQuery(requestData)).rejects.toThrow(
        "Validation failed"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const requestData: CreateSavedQueryRequest = {
        name: "Test Query",
        reportParams: mockSavedQuery.reportParams,
        activeFilters: mockSavedQuery.activeFilters,
        filterValues: mockSavedQuery.filterValues,
      };

      await expect(apiService.createSavedQuery(requestData)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("getSavedQueries", () => {
    it("should fetch saved queries with default parameters", async () => {
      const mockResponse = {
        queries: [mockSavedQuery],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getSavedQueries();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/saved-queries"),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should include query parameters when provided", async () => {
      const mockResponse = {
        queries: [mockSavedQuery],
        pagination: {
          page: 2,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockResponse,
      } as Response);

      await apiService.getSavedQueries({
        page: 2,
        limit: 10,
        search: "test",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("?page=2&limit=10&search=test"),
        expect.any(Object)
      );
    });
  });

  describe("getSavedQuery", () => {
    it("should fetch a single saved query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockSavedQuery,
      } as Response);

      const result = await apiService.getSavedQuery("test-id-123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/saved-queries/test-id-123"),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockSavedQuery);
    });

    it("should handle 404 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ error: "Query not found" }),
      } as Response);

      await expect(apiService.getSavedQuery("nonexistent")).rejects.toThrow(
        "Query not found"
      );
    });
  });

  describe("updateSavedQuery", () => {
    it("should update a saved query", async () => {
      const updatedQuery = { ...mockSavedQuery, name: "Updated Query" };
      const updateData = { name: "Updated Query" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => updatedQuery,
      } as Response);

      const result = await apiService.updateSavedQuery("test-id-123", updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/saved-queries/test-id-123"),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );
      expect(result).toEqual(updatedQuery);
    });
  });

  describe("deleteSavedQuery", () => {
    it("should delete a saved query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: "No Content",
      } as Response);

      await expect(apiService.deleteSavedQuery("test-id-123")).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/saved-queries/test-id-123"),
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should handle delete errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ error: "Access denied" }),
      } as Response);

      await expect(apiService.deleteSavedQuery("test-id-123")).rejects.toThrow(
        "Access denied"
      );
    });
  });

  describe("testConnection", () => {
    it("should return true for successful connection", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await apiService.testConnection();

      expect(result).toBe(true);
    });

    it("should return false for failed connection", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await apiService.testConnection();

      expect(result).toBe(false);
    });

    it("should return false for network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await apiService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle non-JSON responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "content-type": "text/html" }),
      } as Response);

      await expect(
        apiService.getSavedQuery("test-id")
      ).rejects.toThrow("Unexpected response format: 500 Internal Server Error");
    });

    it("should handle JSON parsing errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as Response);

      await expect(
        apiService.getSavedQuery("test-id")
      ).rejects.toThrow("Invalid JSON");
    });
  });
});
