"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { mutate as swrMutate } from "swr";
import { useCallback, useMemo } from "react";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import {
  retrySavedQueryOperation,
  createNetworkAwareOperation,
} from "@/utils/errorHandling";
import {
  createStableRef,
  logErrorWithContext,
} from "@/utils/query-error-recovery";
import { toast } from "sonner";
import type {
  SavedQuery,
  CreateSavedQueryRequest,
  UpdateSavedQueryRequest,
  SavedQueriesResponse,
  GetSavedQueriesParams,
} from "@/types/saved-queries";

// Enhanced SWR fetcher with comprehensive error handling
const fetcher = async (url: string) => {
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const resp = await fetch(url, {
      credentials: "include",
      headers,
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const text = await resp.text();

    if (!resp.ok) {
      // Handle specific HTTP status codes
      let errorMessage = `HTTP ${resp.status}`;

      switch (resp.status) {
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
          // For saved queries, 404 might be expected (no queries found)
          // Return empty result instead of throwing error
          if (url.includes("/saved-queries")) {
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
          errorMessage = `Server error: ${resp.status} ${resp.statusText}`;
      }

      // Try to parse error response for more details
      try {
        const errorData = JSON.parse(text);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Use default error message if JSON parsing fails
      }

      const error = new Error(errorMessage);
      (error as any).status = resp.status;
      (error as any).statusText = resp.statusText;
      throw error;
    }

    if (!text.trim()) {
      throw new Error("Empty response from server");
    }

    try {
      const result = JSON.parse(text);

      // Backend returns wrapped response: { success: true, data: actualData }
      if (result.success && result.data) {
        return result.data;
      }

      // Fallback for unwrapped responses
      return result;
    } catch (e) {
      console.error("[useSavedQueries] JSON parse error:", e);
      console.error("[useSavedQueries] Response text:", text);
      throw new Error("Invalid JSON response from server");
    }
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Network connection failed - please check your internet connection"
      );
    }

    // Handle timeout errors
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Request timed out - please try again");
    }

    // Handle abort errors
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request was cancelled");
    }

    // Re-throw other errors as-is
    throw error;
  }
};

/**
 * Custom hook for saved queries management with SWR integration
 * Provides caching, background refetching, and optimistic updates
 */
export function useSavedQueries(params: GetSavedQueriesParams = {}) {
  // Stabilize params to prevent infinite loops
  const stableParams = useMemo(
    () =>
      createStableRef({
        page: params.page,
        limit: params.limit,
        search: params.search?.trim() || undefined,
      }),
    [params.page, params.limit, params.search]
  );

  // Build SWR key with query parameters - memoized to prevent infinite loops
  const key = useMemo(() => {
    const searchParams = new URLSearchParams();
    if (stableParams.page)
      searchParams.set("page", stableParams.page.toString());
    if (stableParams.limit)
      searchParams.set("limit", stableParams.limit.toString());
    if (stableParams.search) searchParams.set("search", stableParams.search);

    const queryString = searchParams.toString();
    return backendPath(`/saved-queries${queryString ? `?${queryString}` : ""}`);
  }, [stableParams.page, stableParams.limit, stableParams.search]);

  // Main SWR hook for fetching saved queries with enhanced error handling
  const { data, error, isLoading, mutate } = useSWR<SavedQueriesResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: false, // Prevent excessive refetching
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Increase deduping interval to prevent rapid requests
      errorRetryCount: 1, // Further reduce retry count to prevent loops
      errorRetryInterval: 3000, // Increase retry interval
      shouldRetryOnError: (error) => {
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
        // Only retry on network/server errors
        return error?.status >= 500 || !error?.status;
      },
      onError: (error) => {
        logErrorWithContext(error, "useSavedQueries SWR", {
          key,
          params: stableParams,
          timestamp: new Date().toISOString(),
        });
        // Don't show toast for every error, let components handle it
      },
      onErrorRetry: (error, _key, _config, _revalidate, { retryCount }) => {
        console.log(
          `[useSavedQueries] Retrying request (attempt ${retryCount + 1}):`,
          error.message
        );

        // Only show toast on first retry and for retryable errors
        if (retryCount === 0 && error?.status >= 500) {
          toast.info("Mencoba memuat ulang data...", {
            duration: 2000,
          });
        }
      },
    }
  );

  const queries = data?.queries ?? [];
  const pagination = data?.pagination;

  // Create saved query mutation with enhanced error handling
  const createQueryMutation = useSWRMutation(
    backendPath("/saved-queries"),
    async (url: string, { arg }: { arg: CreateSavedQueryRequest }) => {
      return await retrySavedQueryOperation(
        createNetworkAwareOperation(async () => {
          const token = getAuthTokenFromCookie();
          const headers: HeadersInit = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;

          console.log("[useSavedQueries] Making request to:", url);
          console.log("[useSavedQueries] Request payload:", arg);
          console.log("[useSavedQueries] Auth token present:", !!token);

          const resp = await fetch(url, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(arg),
            signal: AbortSignal.timeout(15000), // 15 second timeout for create operations
          });

          console.log("[useSavedQueries] Response status:", resp.status);
          console.log(
            "[useSavedQueries] Response headers:",
            Object.fromEntries(resp.headers.entries())
          );

          const responseText = await resp.text();
          console.log("[useSavedQueries] Response text:", responseText);

          if (!resp.ok) {
            let errorMessage = `HTTP ${resp.status}`;
            try {
              const errorData = JSON.parse(responseText);
              errorMessage =
                errorData.message || errorData.error || errorMessage;
            } catch {
              // Use default error message if JSON parsing fails
            }

            // Add specific error context
            if (
              resp.status === 409 ||
              errorMessage.toLowerCase().includes("duplicate")
            ) {
              throw new Error(
                `Query name "${arg.name}" already exists. Please choose a different name.`
              );
            }

            throw new Error(errorMessage);
          }

          if (!responseText.trim()) {
            throw new Error("Empty response from server");
          }

          try {
            const result = JSON.parse(responseText);
            console.log("[useSavedQueries] Parsed response:", result);

            // Backend returns wrapped response: { success: true, data: savedQuery }
            if (result.success && result.data) {
              return result.data;
            }

            // Fallback for unwrapped responses
            return result;
          } catch (e) {
            console.error("[useSavedQueries] JSON parse error:", e);
            throw new Error("Invalid JSON response from server");
          }
        }),
        "save",
        { showToast: false } // Let the component handle success/error toasts
      );
    },
    {
      onSuccess: (newQuery: SavedQuery) => {
        // Optimistically update the cache - use functional update to prevent stale closures
        mutate(
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
          },
          { revalidate: false }
        );

        // Debounce cache invalidation to prevent rapid updates
        setTimeout(() => {
          swrMutate(
            (key) => typeof key === "string" && key.includes("/saved-queries"),
            undefined,
            { revalidate: true }
          );
        }, 100);
      },
    }
  );

  // Update saved query mutation with enhanced error handling
  const updateQueryMutation = useSWRMutation(
    backendPath("/saved-queries/update"),
    async (
      _url: string,
      { arg }: { arg: { id: string; updates: UpdateSavedQueryRequest } }
    ) => {
      const url = backendPath(`/saved-queries/${arg.id}`);
      return await retrySavedQueryOperation(
        createNetworkAwareOperation(async () => {
          const token = getAuthTokenFromCookie();
          const headers: HeadersInit = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;

          const resp = await fetch(url, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(arg.updates),
            signal: AbortSignal.timeout(10000), // 10 second timeout for updates
          });

          if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${resp.status}`;

            // Add specific error context
            if (resp.status === 404) {
              throw new Error("Query not found - it may have been deleted");
            }

            if (
              resp.status === 409 ||
              errorMessage.toLowerCase().includes("duplicate")
            ) {
              throw new Error(
                `Query name "${arg.updates.name}" already exists. Please choose a different name.`
              );
            }

            throw new Error(errorMessage);
          }

          const result = await resp.json();

          // Backend returns wrapped response: { success: true, data: updatedQuery }
          if (result.success && result.data) {
            return result.data;
          }

          // Fallback for unwrapped responses
          return result;
        }),
        "update",
        { showToast: false } // Let the component handle success/error toasts
      );
    },
    {
      onSuccess: (updatedQuery: SavedQuery) => {
        // Optimistically update the cache - use functional update to prevent stale closures
        mutate(
          (prev) => {
            if (!prev || !Array.isArray(prev.queries)) return prev;
            return {
              ...prev,
              queries: prev.queries.map((q) =>
                q.id === updatedQuery.id ? updatedQuery : q
              ),
            };
          },
          { revalidate: false }
        );

        // Debounce cache invalidation to prevent rapid updates
        setTimeout(() => {
          swrMutate(
            (key) => typeof key === "string" && key.includes("/saved-queries"),
            undefined,
            { revalidate: true }
          );
        }, 100);
      },
    }
  );

  // Delete saved query mutation with enhanced error handling
  const deleteQueryMutation = useSWRMutation(
    backendPath("/saved-queries/delete"),
    async (
      _url: string,
      { arg }: { arg: { id: string } }
    ): Promise<{ id: string }> => {
      const url = backendPath(`/saved-queries/${arg.id}`);
      const result = await retrySavedQueryOperation(
        createNetworkAwareOperation(async () => {
          const token = getAuthTokenFromCookie();
          const headers: HeadersInit = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;

          const resp = await fetch(url, {
            method: "DELETE",
            headers,
            credentials: "include",
            signal: AbortSignal.timeout(10000), // 10 second timeout for deletes
          });

          if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${resp.status}`;

            // Add specific error context
            if (resp.status === 404) {
              // For delete operations, 404 might be acceptable (already deleted)
              console.warn("Query already deleted or not found");
              return { id: arg.id };
            }

            throw new Error(errorMessage);
          }

          // Always return the ID for successful deletes
          return { id: arg.id };
        }),
        "delete",
        { showToast: false } // Let the component handle success/error toasts
      );
      return result as { id: string };
    },
    {
      onSuccess: ({ id }: { id: string }) => {
        // Optimistically update the cache - use functional update to prevent stale closures
        mutate(
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
          },
          { revalidate: false }
        );

        // Debounce cache invalidation to prevent rapid updates
        setTimeout(() => {
          swrMutate(
            (key) => typeof key === "string" && key.includes("/saved-queries"),
            undefined,
            { revalidate: true }
          );
        }, 100);
      },
    }
  );

  // Enhanced convenience methods with error handling
  const createQuery = useCallback(
    async (queryData: CreateSavedQueryRequest): Promise<SavedQuery> => {
      try {
        const result = await createQueryMutation.trigger(queryData);
        if (!result) {
          throw new Error("Failed to create query - no response received");
        }
        return result;
      } catch (error) {
        console.error("[useSavedQueries] Create query failed:", error);
        throw error;
      }
    },
    [createQueryMutation.trigger]
  );

  const updateQuery = useCallback(
    async (
      id: string,
      updates: UpdateSavedQueryRequest
    ): Promise<SavedQuery> => {
      try {
        const result = await updateQueryMutation.trigger({ id, updates });
        if (!result) {
          throw new Error("Failed to update query - no response received");
        }
        return result;
      } catch (error) {
        console.error("[useSavedQueries] Update query failed:", error);
        throw error;
      }
    },
    [updateQueryMutation.trigger]
  );

  const deleteQuery = useCallback(
    async (id: string): Promise<void> => {
      try {
        const result = await deleteQueryMutation.trigger({ id });
        if (!result) {
          throw new Error("Failed to delete query - no response received");
        }
      } catch (error) {
        console.error("[useSavedQueries] Delete query failed:", error);
        throw error;
      }
    },
    [deleteQueryMutation.trigger]
  );

  // Load query function - this doesn't make API calls but helps with state management
  const loadQuery = useCallback((query: SavedQuery) => {
    // This function would be used by components to load a query
    // The actual loading logic would be handled by the query builder component
    console.log("Loading query:", query);
    return query;
  }, []);

  // Refetch function
  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  // Get single query by ID (uses the cached data)
  const getQueryById = useCallback(
    (id: string): SavedQuery | undefined => {
      return queries.find((q) => q.id === id);
    },
    [queries]
  );

  return {
    // Data
    queries,
    pagination,

    // Loading states
    isLoading,
    isCreating: createQueryMutation.isMutating,
    isUpdating: updateQueryMutation.isMutating,
    isDeleting: deleteQueryMutation.isMutating,

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
    refetch,
    getQueryById,

    // Cache mutation for external updates
    mutate,
  } as const;
}

/**
 * Hook for fetching a single saved query by ID
 */
export function useSavedQuery(id: string | null) {
  const key = id ? backendPath(`/saved-queries/${id}`) : null;

  const { data, error, isLoading, mutate } = useSWR<SavedQuery>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000,
  });

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
