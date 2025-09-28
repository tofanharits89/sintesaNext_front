import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, setLogger } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSavedQueries, useSavedQuery } from "../use-saved-queries";
import type { SavedQuery, CreateSavedQueryRequest } from "@/types/saved-queries";

// Silence React Query network errors in test output
setLogger({ log: console.log, warn: console.warn, error: () => {} });

// Mock backend path
vi.mock("@/lib/backend", () => ({
  backendPath: (path: string) => `http://localhost:88/api/v1${path}`,
}));

// Mock http and apiClient
const httpGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();
vi.mock("@/lib/httpClient", () => ({
  http: { get: (...args: any[]) => httpGet(...args) },
  apiClient: {
    get: (...args: any[]) => httpGet(...args),
    post: (...args: any[]) => apiPost(...args),
    put: (...args: any[]) => apiPut(...args),
    delete: (...args: any[]) => apiDelete(...args),
  },
}));

function createWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useSavedQueries (React Query)", () => {
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
      } as any,
    } as any,
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
    vi.clearAllMocks();
    httpGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("should fetch saved queries successfully", async () => {
    httpGet.mockResolvedValue({ data: { success: true, data: mockResponse } });

    const { result } = renderHook(() => useSavedQueries(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.queries).toEqual([mockSavedQuery]);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
    expect(result.current.error).toBeUndefined();
  });

  it("should handle loading then success", async () => {
    httpGet.mockResolvedValue({ data: { success: true, data: mockResponse } });
    const { result } = renderHook(() => useSavedQueries(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.queries.length).toBe(1);
  });

  it("should handle error state", async () => {
    const mockError = new Error("Failed to fetch");
    httpGet.mockRejectedValue(mockError);
    const { result } = renderHook(() => useSavedQueries(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.queries).toEqual([]);
    expect(result.current.error).toBe(mockError);
  });

  it("should call list endpoint with correct parameters", async () => {
    httpGet.mockResolvedValue({ data: { success: true, data: mockResponse } });
    const { result } = renderHook(() => useSavedQueries({ page: 2, limit: 10, search: "test" }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(httpGet).toHaveBeenCalledWith("http://localhost:88/api/v1/saved-queries?page=2&limit=10&search=test", expect.any(Object));
  });

  it("should provide getQueryById and loadQuery", async () => {
    httpGet.mockResolvedValue({ data: { success: true, data: mockResponse } });
    const { result } = renderHook(() => useSavedQueries(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const found = result.current.getQueryById("test-id-123");
    const notFound = result.current.getQueryById("zzz");
    expect(found).toEqual(mockSavedQuery);
    expect(notFound).toBeUndefined();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const loaded = result.current.loadQuery(mockSavedQuery);
    expect(loaded).toEqual(mockSavedQuery);
    expect(logSpy).toHaveBeenCalledWith("Loading query:", mockSavedQuery);
    logSpy.mockRestore();
  });

  it("should create query via mutation", async () => {
    httpGet.mockResolvedValue({ data: { success: true, data: mockResponse } });
    apiPost.mockResolvedValue({ success: true, data: mockSavedQuery });
    const { result } = renderHook(() => useSavedQueries(), { wrapper: createWrapper() });

    const createData: CreateSavedQueryRequest = {
      name: "New Query",
      reportParams: mockSavedQuery.reportParams as any,
      activeFilters: mockSavedQuery.activeFilters,
      filterValues: mockSavedQuery.filterValues as any,
    } as any;

    const created = await result.current.createQuery(createData);
    expect(created).toEqual(mockSavedQuery);
    expect(apiPost).toHaveBeenCalledWith("/saved-queries", createData, expect.any(Object));
  });

  it("should update query via mutation", async () => {
    httpGet.mockResolvedValue({ data: { success: true, data: mockResponse } });
    apiPut.mockResolvedValue({ success: true, data: mockSavedQuery });
    const { result } = renderHook(() => useSavedQueries(), { wrapper: createWrapper() });
    const updated = await result.current.updateQuery("test-id-123", { name: "Updated" } as any);
    expect(updated).toEqual(mockSavedQuery);
    expect(apiPut).toHaveBeenCalledWith("/saved-queries/test-id-123", { name: "Updated" }, expect.any(Object));
  });

  it("should delete query via mutation", async () => {
    httpGet.mockResolvedValue({ data: { success: true, data: mockResponse } });
    apiDelete.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useSavedQueries(), { wrapper: createWrapper() });
    await result.current.deleteQuery("test-id-123");
    expect(apiDelete).toHaveBeenCalledWith("/saved-queries/test-id-123", expect.any(Object));
  });
});

describe("useSavedQuery (React Query)", () => {
  const httpGet = vi.mocked((vi as any).importedModules?.["@/lib/httpClient"]?.http?.get || vi.fn());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch single saved query successfully", async () => {
    const one: SavedQuery = {
      id: "q1",
      name: "One",
      description: "",
      reportParams: {} as any,
      activeFilters: [],
      filterValues: {} as any,
      userId: "u1",
      createdAt: "",
      updatedAt: "",
    };
    httpGet.mockResolvedValue({ data: one } as any);
    const { result } = renderHook(() => useSavedQuery("q1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.query).toEqual(one);
    expect(result.current.error).toBeUndefined();
  });

  it("should not fetch when id is null", async () => {
    const { result } = renderHook(() => useSavedQuery(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(httpGet).not.toHaveBeenCalled();
  });

  it("should handle error state for single query", async () => {
    const err = new Error("Query not found");
    httpGet.mockRejectedValue(err);
    const { result } = renderHook(() => useSavedQuery("q9"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.query).toBeUndefined();
    expect(result.current.error).toBe(err);
  });
});
