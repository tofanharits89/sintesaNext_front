"use client";

import { useState, useCallback } from "react";
import { useInquiryQueryBuilder } from "./use-inquiry-query-builder";
import { apiClient, http } from "@/lib/httpClient";
import { apiPath } from "@/lib/base-path";

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
    null
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
      pagination?: { page?: number; pageSize?: number }
    ): Promise<QueryExecutionResult> => {
      setIsLoading(true);

      try {
        // Build the SQL query
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);

        // Encrypt the query
        const encryptedQuery = encryptQuery(sqlQuery);

        // Send to API via centralized client
        const result = await apiClient.post<QueryExecutionResult>(
          "/inquiry-data/query",
          {
            encryptedQuery,
            format: "json",
            page: pagination?.page ?? 1,
            pageSize: pagination?.pageSize ?? 50,
          }
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
    [buildQuery, encryptQuery]
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
      }
    ): Promise<void> => {
      setIsLoading(true);

      try {
        // Build the SQL query
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);

        // Encrypt the query
        const encryptedQuery = encryptQuery(sqlQuery);

        // Send to API using axios with blob response
        const { data: blob } = await http.post(
apiPath("/inquiry-data/query"),
          {
            encryptedQuery,
            format: "csv",
            limit: 50000, // Higher limit for downloads
          },
          { responseType: "blob" }
        );

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
    [buildQuery, encryptQuery]
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
      }
    ): Promise<void> => {
      setIsLoading(true);

      try {
        // Build the SQL query and request full dataset for Excel (server caps)
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const { data: result } = await http.post<QueryExecutionResult>(
apiPath("/inquiry-data/query"),
          { encryptedQuery, format: "excel" }
        );
        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to get data for Excel export");
        }

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

        const columns =
          result.columns && result.columns.length > 0
            ? result.columns
            : result.data?.length
            ? Object.keys(result.data[0])
            : [];

        // Build AOA with header first, then rows; coerce monetary cells to numbers
        const aoa: any[][] = [];
        aoa.push(columns);
        for (const row of result.data || []) {
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
          ws["!ref"] ||
            `A1:${XLSX.utils.encode_col(columns.length - 1)}${aoa.length}`
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
    [executeQuery]
  );

  // Test API connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const result = await apiClient.get<{ success: boolean }>(
        "/inquiry-data/query"
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
    testConnection,
    isLoading,
    lastResult,
  };
}
