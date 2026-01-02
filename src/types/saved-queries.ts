// TypeScript interfaces for saved queries API

export interface FilterValue {
  selection?: string;
  kondisiCode?: string;
  mengandungKata?: string;
  jenisTampilan?: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
  akunType?: "kodeAkun" | "kodeBkpk" | "jenisBelanja";
}

export interface ReportParams {
  tahun: string;
  tipeLaporan: string;
  pembulatan: string;
  jenisAkumulasi?: string;
  // For tematik pages: selected category (e.g., "prioritas_nasional", "sdgs", etc.)
  tematikKategori?: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  reportParams: ReportParams;
  activeFilters: string[];
  filterValues: Record<string, FilterValue>;
  userId: string;
  scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak" | "up_tup" | "penerimaan_pnbp" | "sp2d"; // New field to identify query scope
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
  scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak" | "up_tup" | "penerimaan_pnbp" | "sp2d"; // New field for creating scoped queries
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
  scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak" | "up_tup" | "penerimaan_pnbp" | "sp2d"; // Add scope for filtering queries
}
