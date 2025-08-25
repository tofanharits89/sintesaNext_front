"use client";

import { useState, useCallback } from "react";
import { useInquiryQueryBuilder } from "./use-inquiry-query-builder";
import { apiPath } from "@/lib/base-path";

export interface QueryExecutionResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  totalCount?: number;
  executionTime?: number;
  error?: string;
  query?: string;
}

export interface FilterValue {
  selection: string;
  kondisiCode: string;
  mengandungKata: string;
  jenisTampilan: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
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

        // Send to API (respect basePath)
        const response = await fetch(apiPath("/inquiry-data/query"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            encryptedQuery,
            format: "json",
            page: pagination?.page ?? 1,
            pageSize: pagination?.pageSize ?? 50,
          }),
        });

        const result: QueryExecutionResult = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Query execution failed");
        }

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

        // Send to API for CSV download (respect basePath)
        const response = await fetch(apiPath("/inquiry-data/query"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            encryptedQuery,
            format: "csv",
            limit: 50000, // Higher limit for downloads
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "CSV download failed");
        }

        // Create download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inquiry_data_${reportParams.tipeLaporan}_${
          reportParams.tahun
        }_${Date.now()}.csv`;
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

        const response = await fetch(apiPath("/inquiry-data/query"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ encryptedQuery, format: "excel" }),
        });
        const result: QueryExecutionResult = await response.json();
        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.error || "Failed to get data for Excel export"
          );
        }

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(result.data);
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
      const response = await fetch("/api/inquiry-data/query", {
        method: "GET",
      });

      const result = await response.json();
      return result.success;
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
