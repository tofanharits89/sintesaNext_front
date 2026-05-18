"use client";

import { useState, useCallback } from "react";
import { useInquiryQueryBuilder } from "./use-inquiry-query-builder";
import { apiClient, http, directBackendClient } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";

const INQUIRY_CLIENT_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_INQUIRY_TIMEOUT_MS || 600_000,
); // 10 minutes

export interface QueryExecutionResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  totalCount?: number;
  executionTime?: number;
  grandTotals?: Record<string, number>;
  error?: string;
  query?: string;
}

export interface QueryPreviewResult {
  success: boolean;
  originalQuery?: string;
  convertedQuery?: string;
  conversions?: {
    hasConvert: boolean;
    hasIfnull: boolean;
    hasDateFormat: boolean;
    hasGroupConcat: boolean;
    hasMysqlLimit: boolean;
  };
  error?: string;
}

export interface FilterValue {
  selection: string;
  kondisiCode: string;
  mengandungKata: string;
  jenisTampilan: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
  akunType?: "kodeAkun" | "kodeBkpk" | "jenisBelanja";
  /** Generic sub-selector; used by levelAPBD to store the chosen level ("1"–"6"). */
  subSelection?: string;
}

export function useInquiryDataApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryExecutionResult | null>(
    null,
  );
  const { buildQuery, encryptQuery } = useInquiryQueryBuilder();

  // Execute query and get JSON data
  const executeQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
      },
      pagination?: { page?: number; pageSize?: number },
    ): Promise<QueryExecutionResult> => {
      setIsLoading(true);

      try {
        // Build the SQL query
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);

        // Encrypt the query
        const encryptedQuery = encryptQuery(sqlQuery);

        // Send to API via direct backend client (bypassing Next.js proxy)
        const result = await directBackendClient.post<QueryExecutionResult>(
          "/inquiry-data/query",
          {
            encryptedQuery,
            format: "json",
            page: pagination?.page ?? 1,
            pageSize: pagination?.pageSize ?? 50,
          },
          { timeout: INQUIRY_CLIENT_TIMEOUT_MS },
        );

        setLastResult(result);
        return result;
      } catch (error) {
        const errorResult: QueryExecutionResult = {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };

        setLastResult(errorResult);
        return errorResult;
      } finally {
        setIsLoading(false);
      }
    },
    [buildQuery, encryptQuery],
  );

  // Download CSV
  const downloadCSV = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
      },
    ): Promise<void> => {
      setIsLoading(true);

      try {
        // Build the SQL query
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);

        // Encrypt the query
        const encryptedQuery = encryptQuery(sqlQuery);

        // Send to API using direct backend client with blob response
        const resp = await directBackendClient.post(
          "/inquiry-data/query",
          {
            encryptedQuery,
            format: "csv",
            limit: 750000, // Higher limit for downloads
          },
          { responseType: "blob", timeout: INQUIRY_CLIENT_TIMEOUT_MS },
        );
        const blob: Blob = resp instanceof Blob ? resp : new Blob([resp]);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inquiry_data_${reportParams.tipeLaporan}_${reportParams.tahun}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("CSV download error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [buildQuery, encryptQuery],
  );

  // Download Excel — the backend now generates the .xlsx server-side,
  // so the browser just downloads the binary file (no client-side SheetJS needed).
  const downloadExcel = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
      },
    ): Promise<void> => {
      setIsLoading(true);

      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const blobResp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "excel", limit: 750000 },
          { responseType: "blob", timeout: INQUIRY_CLIENT_TIMEOUT_MS },
        );

        // Check if the response is a JSON error instead of binary Excel
        const blob: Blob =
          blobResp instanceof Blob ? blobResp : new Blob([blobResp]);

        // If the content type looks like JSON, it's likely an error response
        if (blob.size < 10000) {
          try {
            const text = await blob.text();
            if (text && text.trim().startsWith("{")) {
              const maybe = JSON.parse(text);
              if (maybe && maybe.success === false) {
                throw new Error(
                  maybe.error || "Failed to get data for Excel export",
                );
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("Failed to get data")) {
              throw e;
            }
            // Not JSON — proceed as binary
          }
        }

        // Trigger file download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inquiry_data_${reportParams.tipeLaporan}_${reportParams.tahun}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Excel download error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [buildQuery, encryptQuery],
  );

  // Preview converted query
  const previewConvertedQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
      },
    ): Promise<QueryPreviewResult> => {
      setIsLoading(true);

      try {
        // Build the SQL query
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);

        // Encrypt the query
        const encryptedQuery = encryptQuery(sqlQuery);

        // Send directly to backend endpoint using direct backend client
        const result = await directBackendClient.post<QueryPreviewResult>(
          "/inquiry-data/query/preview",
          { encryptedQuery },
          { timeout: INQUIRY_CLIENT_TIMEOUT_MS },
        );

        // Note: We don't setLastResult for preview as it's a different result type
        return result;
      } catch (error) {
        const errorResult: QueryPreviewResult = {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };

        // Note: We don't setLastResult for preview as it's a different result type
        return errorResult;
      } finally {
        setIsLoading(false);
      }
    },
    [buildQuery, encryptQuery],
  );

  // Test API connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const result = await directBackendClient.get<{ success: boolean }>(
        "/inquiry-data/query",
      );
      return !!result.success;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }, []);

  return {
    executeQuery,
    downloadCSV,
    downloadExcel,
    previewConvertedQuery,
    testConnection,
    isLoading,
    lastResult,
  };
}
