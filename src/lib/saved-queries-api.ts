import { backendPath } from "./backend";
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
  private baseUrl: string;

  constructor() {
    this.baseUrl = backendPath("/saved-queries");
  }

  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): HeadersInit {
    // In a real implementation, get the JWT token from auth context/storage
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Handle API response and parse JSON with error handling
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");
    
    if (!contentType?.includes("application/json")) {
      throw new Error(`Unexpected response format: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!response.ok) {
      const error: SavedQueryApiError = data;
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  /**
   * Create a new saved query
   */
  async createSavedQuery(queryData: CreateSavedQueryRequest): Promise<SavedQuery> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(queryData),
      });

      return await this.handleResponse<SavedQuery>(response);
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

      const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<SavedQueriesResponse>(response);
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<SavedQuery>(response);
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      return await this.handleResponse<SavedQuery>(response);
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // DELETE returns 204 No Content on success
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
      const response = await fetch(this.baseUrl, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const savedQueriesApi = new SavedQueriesApiService();