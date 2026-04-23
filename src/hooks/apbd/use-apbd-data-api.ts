"use client";

import { useState, useCallback } from "react";
import { directBackendClient } from "@/lib/api/httpClient";
import { useAPBDQueryBuilder } from "./use-apbd-query-builder";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import type {
  QueryExecutionResult,
  QueryPreviewResult,
} from "@/hooks/use-inquiry-data-api";

export type { FilterValue };

export function useAPBDDataApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryExecutionResult | null>(
    null,
  );
  const { buildQuery, encryptQuery } = useAPBDQueryBuilder();

  const executeQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
        jenisDataLokasi?: string;
      },
      pagination?: { page?: number; pageSize?: number },
    ): Promise<QueryExecutionResult> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

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

  const downloadCSV = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
        jenisDataLokasi?: string;
      },
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const blob = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "csv" },
          { responseType: "blob" },
        );

        const blobObj = blob instanceof Blob ? blob : new Blob([blob]);
        const url = window.URL.createObjectURL(blobObj);
        const a = document.createElement("a");
        a.href = url;
        a.download = `apbd_${reportParams.tahun}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
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

  const downloadExcel = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
        jenisDataLokasi?: string;
      },
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const blobResp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "excel" },
          { responseType: "blob" },
        );

        const blob = blobResp instanceof Blob ? blobResp : new Blob([blobResp]);

        let parsed: QueryExecutionResult | null = null;
        try {
          const text = await blob.text();
          if (text && text.trim().startsWith("{")) {
            parsed = JSON.parse(text);
            if (parsed && parsed.success === false) {
              throw new Error(parsed.error || "Failed to get data for Excel");
            }
          }
        } catch (_) {}

        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();

        const MONTH_LABELS = [
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
            c.includes("real") ||
            c.includes("realisasi") ||
            MONTH_LABELS.includes(col.toUpperCase())
          );
        };

        const columns = parsed?.columns?.length
          ? parsed.columns
          : parsed?.data?.length
            ? Object.keys(parsed.data[0])
            : [];

        const aoa: any[][] = [columns];
        const rows = parsed?.data || [];
        for (const row of rows) {
          const arr: any[] = columns.map((col) => {
            const v = (row as any)[col];
            if (v === null || v === undefined || v === "") return null;
            if (isMonetary(col)) {
              const num = Number(v);
              return !Number.isNaN(num) ? num : v;
            }
            return v;
          });
          aoa.push(arr);
        }

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, "Belanja Kewilayahan");
        XLSX.writeFile(wb, `apbd_${reportParams.tahun}_${Date.now()}.xlsx`);
      } catch (error) {
        console.error("Excel download error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [buildQuery, encryptQuery],
  );

  const previewConvertedQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
        jenisDataLokasi?: string;
      },
    ): Promise<QueryPreviewResult> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const result = await directBackendClient.post<QueryPreviewResult>(
          "/inquiry-data/query/preview",
          { encryptedQuery },
        );
        return result;
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [buildQuery, encryptQuery],
  );

  return {
    executeQuery,
    downloadCSV,
    downloadExcel,
    previewConvertedQuery,
    isLoading,
    lastResult,
  };
}
