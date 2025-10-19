"use client";

import { useState, useCallback } from "react";
import type { FilterValue, QueryBuilderState } from "./inquiry-query";
import {
  buildTableName as buildTableNameCore,
  buildSelectClause as buildSelectCore,
  buildWhereClause as buildWhereCore,
  buildGroupByClause as buildGroupByCore,
} from "./inquiry-query";

export type { FilterConfig, FilterValue, QueryBuilderState } from "./inquiry-query";

export function useInquiryQueryBuilder() {
  const [queryState, setQueryState] = useState<QueryBuilderState>({
    selectColumns: [],
    whereConditions: [],
    joinTables: [],
  });

  const buildTableName = useCallback(
    (reportParams: { tahun: string; tipeLaporan: string; tematikKategori?: string }) =>
      buildTableNameCore(reportParams),
    []
  );
  const buildSelectClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: { pembulatan: string; tahun: string; tipeLaporan: string; jenisAkumulasi?: string }
    ) => buildSelectCore(activeFilters, filterValues, reportParams),
    []
  );

  const buildWhereClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams?: { tahun?: string; tipeLaporan?: string; tematikKategori?: string; pembulatan?: string; jenisAkumulasi?: string }
    ) => buildWhereCore(activeFilters, filterValues, reportParams),
    []
  );

  const buildGroupByClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: { tipeLaporan: string; tematikKategori?: string }
    ) => buildGroupByCore(activeFilters, filterValues, reportParams),
    []
  );
  const buildQuery = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: { tahun: string; tipeLaporan: string; pembulatan: string; jenisAkumulasi?: string }
    ) => {
      try {
        const mainTable = buildTableName(reportParams);
        const { selectColumns, joinTables } = buildSelectClause(activeFilters, filterValues, reportParams);
        const whereConditions = buildWhereClause(activeFilters, filterValues, reportParams);
        const groupByColumns = buildGroupByClause(activeFilters, filterValues, reportParams);

        const hasRegisterFilter = activeFilters.includes("register");
        let query: string;
        if (hasRegisterFilter) {
          query = `SELECT\n  ${selectColumns.join(",\n  ")}\nFROM (\n  SELECT *,\n    COALESCE(NULLIF(register, ''), '-') AS register_normalized\n  FROM ${mainTable}\n) AS main`;
        } else {
          query = `SELECT\n  ${selectColumns.join(",\n  ")}\nFROM ${mainTable} AS main`;
        }
        if (joinTables.length > 0) query += `\n${joinTables.join("\n")}`;
        if (whereConditions.length > 0) query += `\nWHERE\n  ${whereConditions.join("\n  AND ")}`;
        if (groupByColumns.length > 0) query += `\nGROUP BY\n  ${groupByColumns.join(",\n  ")}`;
        return query;
      } catch (error) {
        console.error("Error building query:", error);
        return "-- Error building query: " + (error as Error).message;
      }
    },
    [buildTableName, buildSelectClause, buildWhereClause, buildGroupByClause]
  );

  const encryptQuery = useCallback((query: string): string => btoa(encodeURIComponent(query)), []);
  const decryptQuery = useCallback((encryptedQuery: string): string => {
    try { return decodeURIComponent(atob(encryptedQuery)); } catch { return "-- Error decrypting query"; }
  }, []);

  return { buildQuery, encryptQuery, decryptQuery, queryState, setQueryState };
}
