"use client";

import { useState, useCallback } from "react";
import { useInquiryQueryBuilder } from "./use-inquiry-query-builder";
import { apiClient, http, directBackendClient } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";

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
            limit: 50000, // Higher limit for downloads
          },
          { responseType: "blob" },
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

  // Download Excel
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
        // Build the SQL query and request full dataset for Excel (server caps)
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const blobResp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "excel" },
          { responseType: "blob" },
        );

        // Try to parse JSON error if backend replied with JSON
        let isJson = false;
        try {
          const text = await (async () => {
            if (blobResp instanceof Blob) return await blobResp.text();
            if (blobResp && (blobResp as any).text) return await (blobResp as any).text();
            return "";
          })();
          if (text && text.trim().startsWith("{")) {
            const maybe = JSON.parse(text);
            if (maybe && maybe.success === false) {
              throw new Error(maybe.error || "Failed to get data for Excel export");
            }
          }
        } catch (_) {
          // not JSON, proceed as binary
        }

        const blob: Blob = blobResp instanceof Blob ? blobResp : new Blob([blobResp]);

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();

        // Determine columns order
        const monthlyCols = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MEI",
          "JUN",
          "JUL",
          "AGS",
          "SEP",
          "OKT",
          "NOV",
          "DES",
        ];
        const isMonetary = (col: string) => {
          const c = col.toLowerCase();
          return (
            c.includes("pagu") ||
            c.includes("realisasi") ||
            c.includes("blokir") ||
            c.includes("anggaran") ||
            monthlyCols.includes(col.toUpperCase())
          );
        };

        // Attempt to read JSON structure from the blob (columns + data); fallback to CSV parsing
        let parsed: QueryExecutionResult | null = null;
        try {
          const text = await blob.text();
          if (text && text.trim().startsWith("{")) {
            parsed = JSON.parse(text);
          }
        } catch {}

        const columns = parsed?.columns?.length
          ? parsed.columns
          : parsed?.data?.length
            ? Object.keys(parsed.data[0])
            : [];

        // Build AOA with header first, then rows; coerce monetary cells to numbers
        const aoa: any[][] = [];
        aoa.push(columns);
        const rows = parsed?.data || [] as any[];
        for (const row of rows) {
          const arr: any[] = [];
          for (const col of columns) {
            const v = (row as any)[col];
            if (v === null || v === undefined || v === "") {
              arr.push(null);
              continue;
            }
            if (isMonetary(col)) {
              const num = Number(v);
              arr.push(!Number.isNaN(num) ? num : v);
            } else {
              arr.push(v);
            }
          }
          aoa.push(arr);
        }

        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Apply number format to monetary columns (thousands separator)
        const range = XLSX.utils.decode_range(
          ws["!ref"] || (columns.length ? `A1:${XLSX.utils.encode_col(columns.length - 1)}${aoa.length}` : "A1:A1"),
        );
        columns.forEach((col, cIdx) => {
          if (!isMonetary(col)) return;
          for (let r = range.s.r + 1; r <= range.e.r; r++) {
            // skip header row
            const cellAddr = XLSX.utils.encode_cell({ r, c: cIdx });
            const cell = (ws as any)[cellAddr];
            if (cell && typeof cell.v === "number") {
              cell.z = "#,##0"; // basic number format
            }
          }
        });

        XLSX.utils.book_append_sheet(wb, ws, "Inquiry Data");
        const filename = `inquiry_data_${reportParams.tipeLaporan}_${
          reportParams.tahun
        }_${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);
      } catch (error) {
        console.error("Excel download error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [executeQuery],
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
