// TypeScript interfaces for saved queries API

export interface FilterValue {
  selection?: string;
  kondisiCode?: string;
  mengandungKata?: string;
  jenisTampilan?: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
}

export interface ReportParams {
  tahun: string;
  tipeLaporan: string;
  pembulatan: string;
  jenisAkumulasi?: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  reportParams: ReportParams;
  activeFilters: string[];
  filterValues: Record<string, FilterValue>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface CreateSavedQueryRequest {
  name: string;
  description?: string;
  reportParams: ReportParams;
  activeFilters: string[];
  filterValues: Record<string, FilterValue>;
}

export interface UpdateSavedQueryRequest {
  name?: string;
  description?: string;
}

export interface SavedQueriesResponse {
  queries: SavedQuery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SavedQueryApiError {
  error: string;
  code?: string;
  details?: Record<string, string>;
}

// Query parameters for listing saved queries
export interface GetSavedQueriesParams {
  page?: number;
  limit?: number;
  search?: string;
}