"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { backendPath } from "@/lib/backend";
import { apiClient, http } from "@/lib/httpClient";
import { retrySavedQueryOperation, createNetworkAwareOperation } from "@/utils/errorHandling";
import { createStableRef } from "@/utils/query-error-recovery";
import { toast } from "sonner";
import type {
  SavedQuery,
  CreateSavedQueryRequest,
  UpdateSavedQueryRequest,
  SavedQueriesResponse,
  GetSavedQueriesParams,
} from "@/types/saved-queries";

// Enhanced fetcher with Axios + interceptors and comprehensive error handling
// Enhanced fetcher with Axios + interceptors and comprehensive error handling
const fetcher = async (url: string) => {
  try {
    // Using http directly allows passing an absolute URL as key
    const resp = await http.get(url, {
      withCredentials: true,
      timeout: 30000,
    });
    const result = resp.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    return result;
  } catch (err: any) {
    const status = err?.response?.status as number | undefined;
    const statusText = err?.response?.statusText;
    const data = err?.response?.data;

    // Handle specific HTTP status codes
    let errorMessage = `HTTP ${status ?? "Error"}`;
    switch (status) {
      case 400:
        errorMessage = "Invalid request data";
        break;
      case 401:
        errorMessage = "Authentication required";
        break;
      case 403:
        errorMessage = "Access denied";
        break;
      case 404:
        if (typeof url === "string" && url.includes("/saved-queries")) {
          return {
            queries: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          };
        }
        errorMessage = "Resource not found";
        break;
      case 409:
        errorMessage = "Conflict - resource already exists";
        break;
      case 429:
        errorMessage = "Too many requests - please wait";
        break;
      case 500:
        errorMessage = "Server error - please try again";
        break;
      case 502:
      case 503:
      case 504:
        errorMessage = "Service temporarily unavailable";
        break;
      default:
        if (status) errorMessage = `Server error: ${status} ${statusText ?? ""}`.trim();
    }

    // Parse backend error object if present
    if (data && typeof data === "object") {
      // Prefer explicit backend messages
      if (typeof data.message === "string" && data.message.trim()) {
        errorMessage = data.message;
      } else if (typeof (data as any).error === "string" && (data as any).error.trim()) {
        errorMessage = (data as any).error;
      } else if (Array.isArray((data as any).errors) && (data as any).errors.length > 0) {
        // If validation errors exist, summarize the first few
        const firstMessages = (data as any).errors
          .map((e: any) => e?.message)
          .filter(Boolean)
          .slice(0, 3)
          .join(", ");
        if (firstMessages) {
          errorMessage = `Validation failed: ${firstMessages}`;
        }
      }
    }

    const error = new Error(errorMessage) as any;
    error.status = status;
    error.statusText = statusText;
    // Attach useful debugging context
    error.url = typeof url === "string" ? url : undefined;
    if (data && typeof data === "object") {
      error.details = (data as any).errors ?? undefined;
      error.backend = data;
    }
    throw error;
  }
};

/**
 * Custom hook for saved queries management with React Query integration
 * Custom hook for saved queries management with React Query integration
 * Provides caching, background refetching, and optimistic updates
 */
export function useSavedQueries(
  params: GetSavedQueriesParams & {
    scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak";
  } = {}
) {
  const queryClient = useQueryClient();
  // Stabilize params to prevent infinite loops
  const stableParams = useMemo(
    () =>
      {
        // sanitize inputs before creating a stable ref
        const allowedScopes = [
          "belanja",
          "tematik",
          "general",
          "rkakl_detail",
          "kontrak",
        ] as const;
        const rawPage = typeof params.page === "number" ? params.page : undefined;
        const rawLimit = typeof params.limit === "number" ? params.limit : undefined;
        const safePage = rawPage && Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
        const safeLimit = rawLimit && Number.isFinite(rawLimit)
          ? Math.min(100, Math.max(1, rawLimit))
          : 10;
        const trimmedSearch = params.search?.trim();
        const safeSearch = trimmedSearch
          ? trimmedSearch.slice(0, 255)
          : undefined;
        const safeScope = params.scope && allowedScopes.includes(params.scope)
          ? params.scope
          : undefined; // omit invalid scopes; backend treats scope as optional

        return createStableRef({
          page: safePage,
          limit: safeLimit,
          search: safeSearch,
          scope: safeScope, // Include scope in stable params only if valid
        });
      },
    [params.page, params.limit, params.search, params.scope]
  );

  // Build query key with query parameters - memoized to prevent infinite loops
  const key = useMemo(() => {
    const searchParams = new URLSearchParams();
    if (stableParams.page)
      searchParams.set("page", stableParams.page.toString());
    if (stableParams.limit)
      searchParams.set("limit", stableParams.limit.toString());
    if (stableParams.search) searchParams.set("search", stableParams.search);
    if (stableParams.scope) searchParams.set("scope", stableParams.scope); // Include scope in API request

    const queryString = searchParams.toString();
    return backendPath(`/saved-queries${queryString ? `?${queryString}` : ""}`);
  }, [
    stableParams.page,
    stableParams.limit,
    stableParams.search,
    stableParams.scope,
  ]);

  // Main React Query hook for fetching saved queries with enhanced error handling
  const { data, error, isLoading, refetch } = useQuery<SavedQueriesResponse>({
    queryKey: ["saved-queries", stableParams],
    queryFn: () => fetcher(key),
    enabled: !!key,
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes for saved queries data
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication or client errors
      if (
        error?.status &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        return false;
      }
      // Don't retry on validation errors
      if (
        error?.message &&
        /validation|invalid|duplicate/i.test(error.message)
      ) {
        return false;
      }
      // Only retry on network/server errors, max 1 retry
      return failureCount < 1 && (error?.status >= 500 || !error?.status);
    },
    retryDelay: (attemptIndex) => {
      return 3000; // 3 second delay between retries
    },
    meta: {
      onError: (error: any) => {
        console.error("useSavedQueries React Query error:", error, {
          key,
          params: stableParams,
          timestamp: new Date().toISOString(),
        });
        // Don't show toast for every error, let components handle it
      },
    },
  });

  const queries = data?.queries ?? [];
  const pagination = data?.pagination;

  // Apply client-side scope filtering as fallback
  const filteredQueries = useMemo(() => {
    if (!stableParams.scope || stableParams.scope === "general") {
      return queries; // No filtering needed for general scope
    }

    // Filter queries by scope
    return queries.filter((query: SavedQuery) => {
      // If query has no scope, assume it's general and show in all pages
      if (!query.scope) return true;
      // Only show queries that match the current scope
      return query.scope === stableParams.scope;
    });
  }, [queries, stableParams.scope]);

  // Create saved query mutation with enhanced error handling
  const createQueryMutation = useMutation<SavedQuery, any, CreateSavedQueryRequest>({
    mutationFn: async (arg: CreateSavedQueryRequest): Promise<SavedQuery> => {
      const res = await retrySavedQueryOperation(
        createNetworkAwareOperation(async () => {
          console.log("[useSavedQueries] Making request to create saved query");
          console.log("[useSavedQueries] Request payload:", arg);

          try {
            const result = await apiClient.post<any>("/saved-queries", arg, {
              timeout: 15000,
            });
            console.log("[useSavedQueries] API response:", result);

            // Backend returns wrapped response: { success: true, data }
            if (result && result.success && result.data) {
              console.log("[useSavedQueries] Returning data:", result.data);
              return result.data as SavedQuery;
            }

            // Some backends may return the resource directly
            if (result && result.id && result.name) {
              console.log("[useSavedQueries] Returning raw resource:", result);
              return result as SavedQuery;
            }

            // Fallback: if no result body, attempt to fetch the newly created query by name/scope
            if (!result) {
              console.warn("[useSavedQueries] Empty response on create; attempting fallback fetch");
              const searchParams = new URLSearchParams();
              searchParams.set("limit", "1");
              if (arg.name) searchParams.set("search", arg.name);
              if (arg.scope) searchParams.set("scope", arg.scope);
              const path = `/saved-queries?${searchParams.toString()}`;
              const lookup = await apiClient.get<any>(path, { timeout: 10000 });
              // Handle wrapped response { success, data }
              const data = lookup?.data ?? lookup;
              const queries = (data?.queries ?? []) as SavedQuery[];
              if (Array.isArray(queries) && queries.length > 0) {
                console.log("[useSavedQueries] Fallback fetch returned:", queries[0]);
                return queries[0];
              }
            }
            console.log("[useSavedQueries] Returning full result:", result);
            return result as SavedQuery;
          } catch (apiError) {
            console.error("[useSavedQueries] API call failed:", apiError);
            throw apiError;
          }
        }),
        "save",
        { showToast: false }
      );
      if (!res) {
        // Fallback fetch by name/scope after retries returned null
        try {
          const searchParams = new URLSearchParams();
          searchParams.set("limit", "1");
          if (arg.name) searchParams.set("search", arg.name);
          if (arg.scope) searchParams.set("scope", arg.scope);
          const path = `/saved-queries?${searchParams.toString()}`;
          const lookup = await apiClient.get<any>(path, { timeout: 10000 });
          const data = lookup?.data ?? lookup;
          const queries = (data?.queries ?? []) as SavedQuery[];
          if (Array.isArray(queries) && queries.length > 0) {
            return queries[0] as SavedQuery;
          }
        } catch (e) {
          console.warn("[useSavedQueries] Fallback fetch after retry failed:", e);
        }
        throw new Error("Failed to create query - no response received");
      }
      return res as SavedQuery;
    },
    onSuccess: (newQuery: SavedQuery) => {
      // Optimistically update the cache - use functional update to prevent stale closures
      queryClient.setQueryData<SavedQueriesResponse>(
        ["saved-queries", stableParams],
        (prev) => {
          if (!prev || !Array.isArray(prev.queries)) {
            return {
              queries: [newQuery],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            };
          }
          return {
            ...prev,
            queries: [newQuery, ...prev.queries],
            pagination: prev.pagination
              ? {
                  ...prev.pagination,
                  total: prev.pagination.total + 1,
                  totalPages: Math.ceil(
                    (prev.pagination.total + 1) / prev.pagination.limit
                  ),
                }
              : {
                  page: 1,
                  limit: 10,
                  total: prev.queries.length + 1,
                  totalPages: 1,
                },
          };
        }
      );

      // Debounce cache invalidation to prevent rapid updates
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["saved-queries"],
        });
      }, 100);
    },
  });

  // Update saved query mutation with enhanced error handling
  const updateQueryMutation = useMutation<SavedQuery, any, { id: string; updates: UpdateSavedQueryRequest }>({
    mutationFn: async (arg: { id: string; updates: UpdateSavedQueryRequest }): Promise<SavedQuery> => {
      const res = await retrySavedQueryOperation(
        createNetworkAwareOperation(async () => {
          const result = await apiClient.put<any>(
            `/saved-queries/${arg.id}`,
            arg.updates,
            { timeout: 10000 }
          );

          if (result && result.success && result.data) {
            return result.data as SavedQuery;
          }
          return result as SavedQuery;
        }),
        "update",
        { showToast: false } // Let the component handle success/error toasts
      );
      return res as SavedQuery;
    },
    onSuccess: (updatedQuery: SavedQuery) => {
      // Optimistically update the cache - use functional update to prevent stale closures
      queryClient.setQueryData<SavedQueriesResponse>(
        ["saved-queries", stableParams],
        (prev) => {
          if (!prev || !Array.isArray(prev.queries)) return prev;
          return {
            ...prev,
            queries: prev.queries.map((q) =>
              q.id === updatedQuery.id ? updatedQuery : q
            ),
          };
        }
      );

      // Debounce cache invalidation to prevent rapid updates
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["saved-queries"],
        });
      }, 100);
    },
  });

  // Delete saved query mutation with enhanced error handling
  const deleteQueryMutation = useMutation<{ id: string }, any, { id: string }>({
    mutationFn: async (arg: { id: string }): Promise<{ id: string }> => {
      const result = await retrySavedQueryOperation(
        createNetworkAwareOperation(async () => {
          try {
            await apiClient.delete(`/saved-queries/${arg.id}`, {
              timeout: 10000,
            });
            return { id: arg.id };
          } catch (e: any) {
            const status = e?.response?.status;
            const data = e?.response?.data;
            const message =
              (data && (data.error || data.message)) || `HTTP ${status}`;
            if (status === 404) {
              console.warn("Query already deleted or not found");
              return { id: arg.id };
            }
            throw new Error(message);
          }
        }),
        "delete",
        { showToast: false } // Let the component handle success/error toasts
      );
      return result as { id: string };
    },
    onSuccess: (param: { id: string }) => {
      const { id } = param;
      
      // Optimistically update the cache - use functional update to prevent stale closures
      queryClient.setQueryData<SavedQueriesResponse>(
        ["saved-queries", stableParams],
        (prev) => {
          if (!prev || !Array.isArray(prev.queries)) return prev;
          return {
            ...prev,
            queries: prev.queries.filter((q) => q.id !== id),
            pagination: prev.pagination
              ? {
                  ...prev.pagination,
                  total: Math.max(0, prev.pagination.total - 1),
                }
              : {
                  page: 1,
                  limit: 10,
                  total: Math.max(0, prev.queries.length - 1),
                  totalPages: 1,
                },
          };
        }
      );

      // Debounce cache invalidation to prevent rapid updates
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["saved-queries"],
        });
      }, 100);
    },
  });

  // Enhanced convenience methods with error handling
  const createQuery = useCallback(
    async (queryData: CreateSavedQueryRequest): Promise<SavedQuery> => {
      try {
        console.log("[useSavedQueries] Creating query with data:", queryData);
        const result = await createQueryMutation.mutateAsync(queryData);
        console.log("[useSavedQueries] Create query result:", result);
        if (!result) {
          console.error("[useSavedQueries] No result received from createQueryMutation.mutateAsync");
          console.error("[useSavedQueries] Mutation error:", createQueryMutation.error);
          throw new Error("Failed to create query - no response received");
        }
        return result;
      } catch (error) {
        console.error("[useSavedQueries] Create query failed:", error);
        console.error("[useSavedQueries] Mutation error:", createQueryMutation.error);
        throw error;
      }
    },
    [createQueryMutation.mutateAsync, createQueryMutation.error]
  );

  const updateQuery = useCallback(
    async (
      id: string,
      updates: UpdateSavedQueryRequest
    ): Promise<SavedQuery> => {
      try {
        const result = await updateQueryMutation.mutateAsync({ id, updates });
        if (!result) {
          throw new Error("Failed to update query - no response received");
        }
        return result;
      } catch (error) {
        console.error("[useSavedQueries] Update query failed:", error);
        throw error;
      }
    },
    [updateQueryMutation.mutateAsync]
  );

  const deleteQuery = useCallback(
    async (id: string): Promise<void> => {
      try {
        const result = await deleteQueryMutation.mutateAsync({ id });
        if (!result) {
          throw new Error("Failed to delete query - no response received");
        }
      } catch (error) {
        console.error("[useSavedQueries] Delete query failed:", error);
        throw error;
      }
    },
    [deleteQueryMutation.mutateAsync]
  );

  // Load query function - this doesn't make API calls but helps with state management
  const loadQuery = useCallback((query: SavedQuery) => {
    // This function would be used by components to load a query
    // The actual loading logic would be handled by the query builder component
    console.log("Loading query:", query);
    return query;
  }, []);

  // Refetch function
  const refetchQueries = useCallback(() => {
    refetch();
  }, [refetch]);

  // Get single query by ID (uses the filtered cached data)
  const getQueryById = useCallback(
    (id: string): SavedQuery | undefined => {
      return filteredQueries.find((q) => q.id === id);
    },
    [filteredQueries]
  );

  // Add mutate alias for backward compatibility
  const mutate = refetch;

  return {
    // Data
    queries: filteredQueries, // Use filtered queries instead of raw queries
    pagination,

    // Loading states
    isLoading,
    isCreating: createQueryMutation.isPending,
    isUpdating: updateQueryMutation.isPending,
    isDeleting: deleteQueryMutation.isPending,

    // Error states
    error,
    createError: createQueryMutation.error,
    updateError: updateQueryMutation.error,
    deleteError: deleteQueryMutation.error,

    // Actions
    createQuery,
    updateQuery,
    deleteQuery,
    loadQuery,
    refetch: refetchQueries,
    getQueryById,

    // Cache mutation for external updates (backward compatibility)
    mutate,
  } as const;
}

/**
 * Hook for fetching a single saved query by ID
 */
export function useSavedQuery(id: string | null) {
  const key = id ? backendPath(`/saved-queries/${id}`) : null;

  const { data, error, isLoading, refetch } = useQuery<SavedQuery>({
    queryKey: ["saved-query", id],
    queryFn: () => fetcher(key!),
    enabled: !!key && !!id,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Add mutate alias for backward compatibility
  const mutate = refetch;

  return {
    query: data,
    error,
    isLoading,
    mutate,
  } as const;
}

/**
 * Hook interface for components that need saved queries functionality
 */
export interface UseSavedQueriesReturn {
  queries: SavedQuery[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: any;
  createError: any;
  updateError: any;
  deleteError: any;
  createQuery: (data: CreateSavedQueryRequest) => Promise<SavedQuery>;
  updateQuery: (
    id: string,
    data: UpdateSavedQueryRequest
  ) => Promise<SavedQuery>;
  deleteQuery: (id: string) => Promise<void>;
  loadQuery: (query: SavedQuery) => SavedQuery;
  refetch: () => void;
  getQueryById: (id: string) => SavedQuery | undefined;
  mutate: any;
}
