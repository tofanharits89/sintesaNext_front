"use client";

import { useState, useCallback } from "react";
import { directBackendClient } from "@/lib/api/httpClient";
import {
  useBelwilQueryBuilder,
  useBelwilTematikQueryBuilder,
} from "./use-belwil-query-builder";
import type { BelwilTematikReportParams } from "./use-belwil-query-builder";
import { useBelwilSubsidiQueryBuilder } from "./use-belwil-subsidi-query-builder";
import type { BelwilSubsidiReportParams } from "./use-belwil-subsidi-query-builder";
import { useBelwilBansosQueryBuilder } from "./use-belwil-bansos-query-builder";
import type { BelwilBansosReportParams } from "./use-belwil-bansos-query-builder";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import type {
  QueryExecutionResult,
  QueryPreviewResult,
} from "@/hooks/use-inquiry-data-api";

export type { FilterValue };
export type { BelwilTematikReportParams };
export type { BelwilSubsidiReportParams };
export type { BelwilBansosReportParams };

export function useBelwilDataApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryExecutionResult | null>(
    null,
  );
  const { buildQuery, encryptQuery } = useBelwilQueryBuilder();

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

        const resp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "csv", limit: 750000 },
          { responseType: "blob", timeout: 300000 },
        );

        const blob: Blob = resp instanceof Blob ? resp : new Blob([resp]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `belanja_kewilayahan_${reportParams.tahun}_${Date.now()}.csv`;
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
          { encryptedQuery, format: "excel", limit: 750000 },
          { responseType: "blob", timeout: 300000 },
        );

        const blob: Blob =
          blobResp instanceof Blob ? blobResp : new Blob([blobResp]);

        if (blob.size < 10000) {
          try {
            const text = await blob.text();
            if (text && text.trim().startsWith("{")) {
              const maybe = JSON.parse(text);
              if (maybe && maybe.success === false) {
                throw new Error(maybe.error || "Failed to get data for Excel");
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("Failed to get data")) {
              throw e;
            }
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `belanja_kewilayahan_${reportParams.tahun}_${Date.now()}.xlsx`;
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

// ─── Tematik Data API ─────────────────────────────────────────────────────────

export function useBelwilTematikDataApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryExecutionResult | null>(
    null,
  );
  const { buildQuery, encryptQuery } = useBelwilTematikQueryBuilder();

  const executeQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilTematikReportParams,
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
      reportParams: BelwilTematikReportParams,
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const resp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "csv", limit: 750000 },
          { responseType: "blob", timeout: 300000 },
        );

        const blob: Blob = resp instanceof Blob ? resp : new Blob([resp]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `belwil_tematik_${reportParams.tipeLaporan}_${reportParams.tahun}_${Date.now()}.csv`;
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

  const downloadExcel = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilTematikReportParams,
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const blobResp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "excel", limit: 750000 },
          { responseType: "blob", timeout: 300000 },
        );

        const blob: Blob =
          blobResp instanceof Blob ? blobResp : new Blob([blobResp]);

        if (blob.size < 10000) {
          try {
            const text = await blob.text();
            if (text && text.trim().startsWith("{")) {
              const maybe = JSON.parse(text);
              if (maybe && maybe.success === false) {
                throw new Error(maybe.error || "Failed to get data for Excel");
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("Failed to get data")) {
              throw e;
            }
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `belwil_tematik_${reportParams.tipeLaporan}_${reportParams.tahun}_${Date.now()}.xlsx`;
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

  const previewConvertedQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilTematikReportParams,
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

// ─── Subsidi Data API ─────────────────────────────────────────────────────────

export function useBelwilSubsidiDataApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryExecutionResult | null>(
    null,
  );
  const { buildQuery, encryptQuery } = useBelwilSubsidiQueryBuilder();

  const executeQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilSubsidiReportParams,
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
      reportParams: BelwilSubsidiReportParams,
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const resp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "csv", limit: 750000 },
          { responseType: "blob", timeout: 300000 },
        );

        const blob: Blob = resp instanceof Blob ? resp : new Blob([resp]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `subsidi_kewilayahan_${reportParams.tahun}_${Date.now()}.csv`;
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

  const downloadExcel = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilSubsidiReportParams,
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const blobResp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "excel", limit: 750000 },
          { responseType: "blob", timeout: 300000 },
        );

        const blob: Blob =
          blobResp instanceof Blob ? blobResp : new Blob([blobResp]);

        if (blob.size < 10000) {
          try {
            const text = await blob.text();
            if (text && text.trim().startsWith("{")) {
              const maybe = JSON.parse(text);
              if (maybe && maybe.success === false) {
                throw new Error(maybe.error || "Failed to get data for Excel");
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("Failed to get data")) {
              throw e;
            }
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `subsidi_kewilayahan_${reportParams.tahun}_${Date.now()}.xlsx`;
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

  const previewConvertedQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilSubsidiReportParams,
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

// ─── Bansos Data API ──────────────────────────────────────────────────────────

export function useBelwilBansosDataApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryExecutionResult | null>(
    null,
  );
  const { buildQuery, encryptQuery } = useBelwilBansosQueryBuilder();

  const executeQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilBansosReportParams,
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
      reportParams: BelwilBansosReportParams,
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const resp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "csv", limit: 750000 },
          { responseType: "blob", timeout: 300000 },
        );

        const blob: Blob = resp instanceof Blob ? resp : new Blob([resp]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bansos_kewilayahan_${reportParams.tahun}_${Date.now()}.csv`;
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

  const downloadExcel = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilBansosReportParams,
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const sqlQuery = buildQuery(activeFilters, filterValues, reportParams);
        const encryptedQuery = encryptQuery(sqlQuery);

        const blobResp = await directBackendClient.post(
          "/inquiry-data/query",
          { encryptedQuery, format: "excel", limit: 750000 },
          { responseType: "blob", timeout: 300000 },
        );

        const blob: Blob =
          blobResp instanceof Blob ? blobResp : new Blob([blobResp]);

        if (blob.size < 10000) {
          try {
            const text = await blob.text();
            if (text && text.trim().startsWith("{")) {
              const maybe = JSON.parse(text);
              if (maybe && maybe.success === false) {
                throw new Error(maybe.error || "Failed to get data for Excel");
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("Failed to get data")) {
              throw e;
            }
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bansos_kewilayahan_${reportParams.tahun}_${Date.now()}.xlsx`;
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

  const previewConvertedQuery = useCallback(
    async (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilBansosReportParams,
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
