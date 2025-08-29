"use client";

import { useMemo, useCallback } from "react";
import {
  getTematikCategory,
  getTematikCategoryOptions,
  getCategoryMandatoryFilters,
  getCategoryMandatoryColumns,
  getCategoryQueryConfig,
  getCategoryExcludedFilters,
  isCategoryFilterMandatory,
  type CategoryDefinition,
  type CategoryFilter,
  type CategoryColumn,
  type CategoryQueryConfig,
} from "@/components/inquiry-data/categoryRegistry";
import type { FilterValue, ReportParams } from "@/types/saved-queries";

export interface TematikConfigResult {
  category: CategoryDefinition | undefined;
  categoryOptions: { value: string; label: string }[];
  mandatoryFilters: CategoryFilter[];
  mandatoryColumns: CategoryColumn[];
  queryConfig: CategoryQueryConfig | undefined;
  excludedStandardFilters: string[];

  // Helper functions
  isMandatoryFilter: (filterKey: string) => boolean;
  getMandatoryFilterKeys: () => string[];
  getDefaultFilterValues: () => Record<string, FilterValue>;
  validateCategorySelection: () => string[];
  shouldHideStandardFilter: (filterKey: string) => boolean;
  getReportTypeRestriction: () => string | undefined;
  isJenisAkumulasiAllowed: () => boolean;

  // Query building helpers
  buildTableName: (tahun: string) => string;
  getAdditionalWhereConditions: () => string[];
  getMandatorySelectColumns: (divisor: number) => string[];
}

export function useTematikConfig(categoryKey?: string): TematikConfigResult {
  // Get category configuration
  const category = useMemo(() => {
    return categoryKey ? getTematikCategory(categoryKey) : undefined;
  }, [categoryKey]);

  // Get all available category options
  const categoryOptions = useMemo(() => getTematikCategoryOptions(), []);

  // Get category-specific configurations
  const mandatoryFilters = useMemo(() => {
    return categoryKey ? getCategoryMandatoryFilters(categoryKey) : [];
  }, [categoryKey]);

  const mandatoryColumns = useMemo(() => {
    return categoryKey ? getCategoryMandatoryColumns(categoryKey) : [];
  }, [categoryKey]);

  const queryConfig = useMemo(() => {
    return categoryKey ? getCategoryQueryConfig(categoryKey) : undefined;
  }, [categoryKey]);

  const excludedStandardFilters = useMemo(() => {
    return categoryKey ? getCategoryExcludedFilters(categoryKey) : [];
  }, [categoryKey]);

  // Helper function to check if a filter is mandatory for current category
  const isMandatoryFilter = useCallback(
    (filterKey: string): boolean => {
      if (!categoryKey) return false;
      return isCategoryFilterMandatory(categoryKey, filterKey);
    },
    [categoryKey]
  );

  // Get all mandatory filter keys - memoized to prevent recreating array
  const getMandatoryFilterKeys = useCallback((): string[] => {
    return mandatoryFilters.map((filter) => filter.key);
  }, [mandatoryFilters]);

  // Get default values for all mandatory filters - memoized to prevent recreating object
  const getDefaultFilterValues = useCallback((): Record<
    string,
    FilterValue
  > => {
    const defaults: Record<string, FilterValue> = {};

    mandatoryFilters.forEach((filter) => {
      if (filter.defaultValue) {
        defaults[filter.key] = {
          selection: filter.defaultValue.selection || "all",
          kondisiCode: filter.defaultValue.kondisiCode || "",
          mengandungKata: filter.defaultValue.mengandungKata || "",
          jenisTampilan: filter.defaultValue.jenisTampilan || "kode",
        };
      }
    });

    return defaults;
  }, [mandatoryFilters]);

  // Validate current category selection - memoized to prevent recreating function
  const validateCategorySelection = useCallback((): string[] => {
    const errors: string[] = [];

    if (!categoryKey) {
      errors.push("Tidak ada kategori tematik yang dipilih");
      return errors;
    }

    if (!category) {
      errors.push(`Kategori '${categoryKey}' tidak ditemukan`);
      return errors;
    }

    if (mandatoryFilters.length === 0) {
      errors.push(
        `Kategori '${categoryKey}' tidak memiliki filter wajib yang terdefinisi`
      );
    }

    if (!queryConfig?.tableName) {
      errors.push(
        `Kategori '${categoryKey}' tidak memiliki konfigurasi tabel yang valid`
      );
    }

    return errors;
  }, [categoryKey, category, mandatoryFilters, queryConfig]);

  // Check if a standard filter should be hidden
  const shouldHideStandardFilter = useCallback(
    (filterKey: string): boolean => {
      // Always hide cutOff from standard filters (it's handled separately)
      if (filterKey === "cutOff") return true;

      // Hide if it's in the excluded list
      if (excludedStandardFilters.includes(filterKey)) return true;

      // Hide if it's a mandatory filter (shown in mandatory section)
      if (isMandatoryFilter(filterKey)) return true;

      return false;
    },
    [excludedStandardFilters, isMandatoryFilter]
  );

  // Get report type restriction
  const getReportTypeRestriction = useCallback((): string | undefined => {
    return category?.reportTypeRestriction;
  }, [category?.reportTypeRestriction]);

  // Check if jenis akumulasi is allowed
  const isJenisAkumulasiAllowed = useCallback((): boolean => {
    return category?.jenisAkumulasiAllowed ?? false;
  }, [category?.jenisAkumulasiAllowed]);

  // Build table name for query
  const buildTableName = useCallback(
    (tahun: string): string => {
      if (!queryConfig?.tableName) {
        throw new Error(
          `No table configuration found for category: ${categoryKey}`
        );
      }

      const suffix = queryConfig.baseTableSuffix || "";
      return `monev${tahun}.${queryConfig.tableName}_${tahun}${suffix}`;
    },
    [queryConfig?.tableName, queryConfig?.baseTableSuffix, categoryKey]
  );

  // Get additional WHERE conditions
  const getAdditionalWhereConditions = useCallback((): string[] => {
    return queryConfig?.whereConditions || [];
  }, [queryConfig?.whereConditions]);

  // Get mandatory SELECT columns with proper SQL expressions
  const getMandatorySelectColumns = useCallback(
    (divisor: number = 1): string[] => {
      return mandatoryColumns
        .sort((a, b) => a.order - b.order)
        .map((col) => {
          // Replace {divisor} placeholder in SQL expressions
          const sqlExpression = col.sqlExpression.replace(
            /\{divisor\}/g,
            divisor.toString()
          );
          return `${sqlExpression} AS ${col.key}`;
        });
    },
    [mandatoryColumns]
  );

  return {
    category,
    categoryOptions,
    mandatoryFilters,
    mandatoryColumns,
    queryConfig,
    excludedStandardFilters,

    // Helper functions
    isMandatoryFilter,
    getMandatoryFilterKeys,
    getDefaultFilterValues,
    validateCategorySelection,
    shouldHideStandardFilter,
    getReportTypeRestriction,
    isJenisAkumulasiAllowed,

    // Query building helpers
    buildTableName,
    getAdditionalWhereConditions,
    getMandatorySelectColumns,
  };
}
