import { apiClient } from "./httpClient";

import type {
  SavedQuery,
  CreateSavedQueryRequest,
  UpdateSavedQueryRequest,
  SavedQueriesResponse,
  SavedQueryApiError,
  GetSavedQueriesParams,
} from "@/types/saved-queries";

/**
 * API service for saved queries operations
 * Provides HTTP client functions for all CRUD operations with proper error handling
 */
export class SavedQueriesApiService {
  private basePath: string;

  constructor() {
    this.basePath = "/saved-queries";
  }

  /**
   * Get authentication headers for API requests
   */
  // Headers are handled by apiClient (CSRF, cookies). No-op retained for backwards compatibility.
  private getAuthHeaders(): HeadersInit { return { "Content-Type": "application/json" }; }

  /**
   * Handle API response and parse JSON with error handling
   */
  // Response handling now comes from axios; keep helper for type parity when needed
  private async handleResponse<T>(response: any): Promise<T> { return response as T; }

  /**
   * Create a new saved query
   */
  async createSavedQuery(queryData: CreateSavedQueryRequest): Promise<SavedQuery> {
    try {
      const data = await apiClient.post<SavedQuery>(`${this.basePath}`, queryData);
      return data;
    } catch (error) {
      console.error("Error creating saved query:", error);
      throw error instanceof Error 
        ? error 
        : new Error("Failed to create saved query");
    }
  }

  /**
   * Get user's saved queries with optional pagination and search
   */
  async getSavedQueries(params: GetSavedQueriesParams = {}): Promise<SavedQueriesResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.search) searchParams.set("search", params.search);

      const path = `${this.basePath}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const data = await apiClient.get<SavedQueriesResponse>(path);
      return data;
    } catch (error) {
      console.error("Error fetching saved queries:", error);
      throw error instanceof Error 
        ? error 
        : new Error("Failed to fetch saved queries");
    }
  }

  /**
   * Get a single saved query by ID
   */
  async getSavedQuery(id: string): Promise<SavedQuery> {
    try {
      const data = await apiClient.get<SavedQuery>(`${this.basePath}/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching saved query ${id}:`, error);
      throw error instanceof Error 
        ? error 
        : new Error("Failed to fetch saved query");
    }
  }

  /**
   * Update a saved query (name and description only)
   */
  async updateSavedQuery(id: string, updates: UpdateSavedQueryRequest): Promise<SavedQuery> {
    try {
      const data = await apiClient.put<SavedQuery>(`${this.basePath}/${id}`, updates);
      return data;
    } catch (error) {
      console.error(`Error updating saved query ${id}:`, error);
      throw error instanceof Error 
        ? error 
        : new Error("Failed to update saved query");
    }
  }

  /**
   * Delete a saved query
   */
  async deleteSavedQuery(id: string): Promise<void> {
    try {
      await apiClient.delete<void>(`${this.basePath}/${id}`);
      // 204 No Content expected
    } catch (error) {
      console.error(`Error deleting saved query ${id}:`, error);
      throw error instanceof Error 
        ? error 
        : new Error("Failed to delete saved query");
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await apiClient.get(`${this.basePath}`);
      return true;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const savedQueriesApi = new SavedQueriesApiService();
