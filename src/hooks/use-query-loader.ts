"use client";

import { useCallback, useState } from "react";
import type {
  SavedQuery,
  FilterValue,
  ReportParams,
} from "@/types/saved-queries";
import {
  validateFiltersForScope,
  getFilterLabel,
} from "@/components/inquiry-data/filterRegistry";

export interface QueryLoaderState {
  hasUnsavedChanges: boolean;
  originalState: QueryBuilderState | null;
  currentState: QueryBuilderState | null;
}

export interface QueryBuilderState {
  activeFilters: string[];
  filterValues: Record<string, FilterValue>;
  reportParams: ReportParams;
}

export interface UseQueryLoaderProps {
  onStateChange: (state: QueryBuilderState) => void;
  getCurrentState: () => QueryBuilderState;
  scope?:
    | "belanja"
    | "tematik"
    | "general"
    | "rkakl_detail"
    | "kontrak"
    | "up_tup"
    | "penerimaan_pnbp"
    | "sp2d"
    | "revisi_dipa"; // Add scope for compatibility validation
}

/**
 * Custom hook for managing query loading functionality
 * Handles state restoration, change detection, and validation
 */
export function useQueryLoader({
  onStateChange,
  getCurrentState,
  scope = "general", // Default to general scope
}: UseQueryLoaderProps) {
  const [loaderState, setLoaderState] = useState<QueryLoaderState>({
    hasUnsavedChanges: false,
    originalState: null,
    currentState: null,
  });

  /**
   * Validates if a saved query is compatible with the current query builder
   */
  const validateQueryCompatibility = useCallback(
    (query: SavedQuery): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      // Validate report parameters
      const reportParams = query.reportParams || {};
      if (!reportParams || typeof reportParams !== "object") {
        errors.push("Query tidak memiliki parameter laporan yang valid");
      } else {
        if (!reportParams.tahun) {
          errors.push("Parameter tahun tidak ditemukan");
        }
        if (!reportParams.tipeLaporan) {
          errors.push("Parameter tipe laporan tidak ditemukan");
        }
        if (!reportParams.pembulatan) {
          errors.push("Parameter pembulatan tidak ditemukan");
        }
      }

      // Validate active filters
      if (!Array.isArray(query.activeFilters)) {
        errors.push("Daftar filter aktif tidak valid");
      } else if (query.activeFilters.length === 0) {
        errors.push("Query tidak memiliki filter aktif");
      }

      // Validate scope compatibility
      if (scope !== "general") {
        const scopeValidation = validateFiltersForScope(
          query.activeFilters || [],
          scope,
        );
        if (!scopeValidation.isValid) {
          const incompatibleFilterLabels = scopeValidation.incompatibleFilters
            .map((filter) => getFilterLabel(filter))
            .join(", ");

          if (query.scope && query.scope !== scope) {
            errors.push(
              `Query ini dibuat untuk halaman ${query.scope} dan tidak kompatibel dengan halaman ${scope}. ` +
                `Filter yang tidak didukung: ${incompatibleFilterLabels}`,
            );
          } else {
            errors.push(
              `Query menggunakan filter yang tidak tersedia di halaman ${scope}: ${incompatibleFilterLabels}`,
            );
          }
        }
      }

      // Validate filter values
      const filterValues = query.filterValues || {};
      if (!filterValues || typeof filterValues !== "object") {
        errors.push("Nilai filter tidak valid");
      } else {
        // Helper function to check if a filter is configured
        const isFilterConfigured = (
          filterKey: string,
          filterValue: FilterValue,
        ): boolean => {
          if (filterKey === "cutOff") {
            // cutOff filter is configured if it has a kondisiCode
            // For rkakl_detail scope, cutOff is not required
            if (scope === "rkakl_detail") {
              return true; // Skip validation for rkakl_detail
            }
            return !!(
              filterValue.kondisiCode &&
              typeof filterValue.kondisiCode === "string" &&
              filterValue.kondisiCode.trim() !== ""
            );
          }

          // Other filters are configured if they have:
          // 1. A valid selection (including "all" for "Semua"), OR
          // 2. A non-empty kondisiCode, OR
          // 3. A non-empty mengandungKata
          const hasValidSelection = Boolean(
            filterValue.selection &&
            typeof filterValue.selection === "string" &&
            filterValue.selection.trim() !== "",
          );
          const hasValidKondisiCode = Boolean(
            filterValue.kondisiCode &&
            typeof filterValue.kondisiCode === "string" &&
            filterValue.kondisiCode.trim() !== "",
          );
          const hasValidMengandungKata = Boolean(
            filterValue.mengandungKata &&
            typeof filterValue.mengandungKata === "string" &&
            filterValue.mengandungKata.trim() !== "",
          );

          return (
            hasValidSelection || hasValidKondisiCode || hasValidMengandungKata
          );
        };

        // Get only configured filters for validation
        const configuredFilters = Object.entries(filterValues).filter(
          ([filterKey, filterValue]) =>
            filterValue && isFilterConfigured(filterKey, filterValue),
        );

        // Ensure we have at least one configured filter
        if (configuredFilters.length === 0) {
          errors.push("Query tidak memiliki filter yang dikonfigurasi");
        }

        // Validate each configured filter
        for (const [filterKey, filterValue] of configuredFilters) {
          if (typeof filterValue !== "object") {
            errors.push(`Nilai filter "${filterKey}" tidak valid`);
            continue;
          }

          // For cutOff filter, kondisiCode is required (already checked in isFilterConfigured)
          if (filterKey === "cutOff" && !filterValue.kondisiCode) {
            errors.push(
              `Filter "${filterKey}" tidak memiliki kondisi yang valid`,
            );
          }

          // Validate jenisTampilan is present
          if (!filterValue.jenisTampilan) {
            errors.push(
              `Filter "${filterKey}" tidak memiliki jenis tampilan yang valid`,
            );
          }

          // For conditions that require values, ensure they have selection or mengandungKata
          if (
            filterValue.kondisiCode &&
            filterValue.kondisiCode !== "is_null" &&
            filterValue.kondisiCode !== "is_not_null"
          ) {
            if (!filterValue.selection && !filterValue.mengandungKata) {
              errors.push(
                `Filter "${filterKey}" memerlukan nilai atau kata kunci`,
              );
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [scope],
  );

  /**
   * Detects if the current state has unsaved changes compared to the original state
   */
  const detectUnsavedChanges = useCallback(
    (
      currentState: QueryBuilderState,
      originalState: QueryBuilderState | null,
    ): boolean => {
      if (!originalState) return false;

      // Compare report parameters
      const reportParamsChanged =
        JSON.stringify(currentState.reportParams) !==
        JSON.stringify(originalState.reportParams);

      // Compare active filters
      const activeFiltersChanged =
        JSON.stringify(currentState.activeFilters.sort()) !==
        JSON.stringify(originalState.activeFilters.sort());

      // Compare filter values
      const filterValuesChanged =
        JSON.stringify(currentState.filterValues) !==
        JSON.stringify(originalState.filterValues);

      return reportParamsChanged || activeFiltersChanged || filterValuesChanged;
    },
    [],
  );

  /**
   * Updates the change detection state
   */
  const updateChangeDetection = useCallback(() => {
    const currentState = getCurrentState();
    const hasChanges = detectUnsavedChanges(
      currentState,
      loaderState.originalState,
    );

    setLoaderState((prev) => ({
      ...prev,
      currentState,
      hasUnsavedChanges: hasChanges,
    }));
  }, [getCurrentState, detectUnsavedChanges, loaderState.originalState]);

  /**
   * Sets the original state for change detection
   */
  const setOriginalState = useCallback((state: QueryBuilderState) => {
    setLoaderState((prev) => ({
      ...prev,
      originalState: state,
      currentState: state,
      hasUnsavedChanges: false,
    }));
  }, []);

  /**
   * Restores report parameters from a saved query
   */
  const restoreReportParameters = useCallback(
    (query: SavedQuery): ReportParams => {
      // Add safety checks for reportParams
      const reportParams = query.reportParams || {};

      return {
        tahun: reportParams.tahun || "",
        tipeLaporan: reportParams.tipeLaporan || "",
        pembulatan: reportParams.pembulatan || "",
        jenisAkumulasi: reportParams.jenisAkumulasi || "non_akumulatif",
        // Preserve tematik category when present
        tematikKategori: (reportParams as any).tematikKategori,
      };
    },
    [],
  );

  /**
   * Restores active filters and their values from a saved query
   */
  const restoreFiltersAndValues = useCallback(
    (
      query: SavedQuery,
    ): {
      activeFilters: string[];
      filterValues: Record<string, FilterValue>;
    } => {
      // Handle cutOff filter based on scope
      const activeFilters = [...(query.activeFilters || [])];
      const filterValues = { ...(query.filterValues || {}) };

      // For belanja and tematik scopes, ensure cutOff is always included
      if (scope === "belanja" || scope === "tematik") {
        if (!activeFilters.includes("cutOff")) {
          activeFilters.unshift("cutOff");
        }

        // Ensure cutOff has a default value if missing
        if (!filterValues.cutOff) {
          const getCurrentMonth = () => {
            const now = new Date();
            return String(now.getMonth() + 1).padStart(2, "0");
          };

          filterValues.cutOff = {
            selection: getCurrentMonth(),
            kondisiCode: "equals",
            mengandungKata: "",
            jenisTampilan: "kode" as const,
          };
        }
      }
      // For rkakl_detail scope, remove cutOff if present (not needed)
      else if (scope === "rkakl_detail") {
        const cutOffIndex = activeFilters.indexOf("cutOff");
        if (cutOffIndex > -1) {
          activeFilters.splice(cutOffIndex, 1);
        }
        if (filterValues.cutOff) {
          delete filterValues.cutOff;
        }
      }

      return { activeFilters, filterValues };
    },
    [scope],
  );

  /**
   * Loads a saved query into the query builder
   */
  const loadQuery = useCallback(
    async (
      query: SavedQuery,
    ): Promise<{ success: boolean; errors?: string[] }> => {
      try {
        // Validate query compatibility
        const validation = validateQueryCompatibility(query);
        if (!validation.isValid) {
          return { success: false, errors: validation.errors };
        }

        // Restore report parameters
        const reportParams = restoreReportParameters(query);

        // Restore filters and values
        const { activeFilters, filterValues } = restoreFiltersAndValues(query);

        // Create new state
        const newState: QueryBuilderState = {
          reportParams,
          activeFilters,
          filterValues,
        };

        // Apply the new state
        onStateChange(newState);

        // Set as original state for change detection
        setOriginalState(newState);

        return { success: true };
      } catch (error) {
        console.error("Error loading query:", error);
        return {
          success: false,
          errors: ["Terjadi kesalahan saat memuat query. Silakan coba lagi."],
        };
      }
    },
    [
      validateQueryCompatibility,
      restoreReportParameters,
      restoreFiltersAndValues,
      onStateChange,
      setOriginalState,
    ],
  );

  /**
   * Resets the change detection state
   */
  const resetChangeDetection = useCallback(() => {
    setLoaderState({
      hasUnsavedChanges: false,
      originalState: null,
      currentState: null,
    });
  }, []);

  /**
   * Gets the current unsaved changes status
   */
  const getUnsavedChangesStatus = useCallback(() => {
    const currentState = getCurrentState();
    const hasChanges = detectUnsavedChanges(
      currentState,
      loaderState.originalState,
    );
    return {
      hasUnsavedChanges: hasChanges,
      originalState: loaderState.originalState,
      currentState,
    };
  }, [getCurrentState, detectUnsavedChanges, loaderState.originalState]);

  return {
    // State
    hasUnsavedChanges: loaderState.hasUnsavedChanges,
    originalState: loaderState.originalState,
    currentState: loaderState.currentState,

    // Actions
    loadQuery,
    validateQueryCompatibility,
    updateChangeDetection,
    setOriginalState,
    resetChangeDetection,
    getUnsavedChangesStatus,

    // Utility functions
    restoreReportParameters,
    restoreFiltersAndValues,
    detectUnsavedChanges,
  } as const;
}
