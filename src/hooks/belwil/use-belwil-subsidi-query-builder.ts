"use client";

import { useCallback } from "react";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";

// Column mapping for monev{year}.subsidi_bulanan_{year} table
const SUBSIDI_COLUMN_MAP: Record<string, string> = {
  kementerian: "kddept",
  eselonI: "kdunit",
  satker: "kdsatker",
  program: "kdprogram",
  kegiatan: "kdkegiatan",
  output: "kdoutput",
  akun: "kdakun",
  provinsi: "kdprov",
  kabkota: "kdkabkota",
  kecamatan: "kdkec",
  kanwil: "kdkanwil",
};

// Name columns for uraian/kode_uraian display mode
const SUBSIDI_NAME_COLUMN_MAP: Record<string, string> = {
  provinsi: "nmprov",
  kabkota: "nmkabkota",
  kecamatan: "nmkec",
  kanwil: "nmkanwil",
};

export const BELWIL_SUBSIDI_SUPPORTED_FILTERS = [
  "kementerian",
  "eselonI",
  "satker",
  "program",
  "kegiatan",
  "output",
  "akun",
  "provinsi",
  "kabkota",
  "kecamatan",
  "kanwil",
];

export type SubsidiTipeLaporan =
  | "belwil_subsidi_all"
  | "belwil_subsidi_realisasi"
  | "belwil_subsidi_jumlah_penerima"
  | "belwil_subsidi_jumlah_va";

export interface BelwilSubsidiReportParams {
  tahun: string;
  tipeLaporan: SubsidiTipeLaporan;
  pembulatan: string;
  jnsBansos?: string;
  jnsBansosKondisi?: string;
  jnsBansosKataKunci?: string;
  jnsBansosJenisTampilan?: string;
}

const PEMBULATAN_DIVISOR: Record<string, number> = {
  satuan: 1,
  ribuan: 1_000,
  jutaan: 1_000_000,
  miliaran: 1_000_000_000,
  triliunan: 1_000_000_000_000,
};

function getPembulatanDivisor(pembulatan: string): number {
  return PEMBULATAN_DIVISOR[pembulatan] ?? 1;
}

function escapeJnsBansos(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "all") return null;
  return trimmed.replace(/'/g, "''");
}

export function useBelwilSubsidiQueryBuilder() {
  const buildTableName = useCallback((tahun: string): string => {
    return `monev${tahun}.subsidi_bulanan_${tahun}`;
  }, []);

  const buildSelectClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilSubsidiReportParams,
    ): string[] => {
      const selectColumns: string[] = [];
      const divisor = getPembulatanDivisor(reportParams.pembulatan);
      // Only apply divisor to monetary columns (realisasi)
      const divisorExpr =
        reportParams.tipeLaporan === "belwil_subsidi_realisasi" && divisor !== 1
          ? ` / ${divisor}`
          : "";

      const uniqueFilters = Array.from(new Set(activeFilters)).filter(
        (k) => SUBSIDI_COLUMN_MAP[k],
      );

      // Dimension columns
      uniqueFilters.forEach((filterKey) => {
        const col = SUBSIDI_COLUMN_MAP[filterKey];
        const nameCol = SUBSIDI_NAME_COLUMN_MAP[filterKey];
        const jenisTampilan = filterValues[filterKey]?.jenisTampilan || "kode";

        if (jenisTampilan === "jangan_tampilkan") return;

        if (jenisTampilan === "kode" || jenisTampilan === "kode_uraian") {
          selectColumns.push(`main.${col} AS ${filterKey}_kode`);
        }
        if (
          (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") &&
          nameCol
        ) {
          selectColumns.push(`main.${nameCol} AS ${filterKey}_uraian`);
        }
      });

      // jns_bansos column based on jenisTampilan (only uraian / jangan_tampilkan)
      const jnsBansosJenisTampilan =
        reportParams.jnsBansosJenisTampilan || "uraian";
      if (jnsBansosJenisTampilan !== "jangan_tampilkan") {
        selectColumns.push("main.jns_bansos");
      }

      if (selectColumns.length === 0) {
        // Only metrics — add a fallback dimension
        selectColumns.unshift("main.kddept AS kementerian_kode");
      }

      // Metric columns based on tipeLaporan
      if (reportParams.tipeLaporan === "belwil_subsidi_all") {
        for (let m = 1; m <= 12; m++) {
          selectColumns.push(`SUM(main.real${m})${divisorExpr} AS real${m}`);
        }
        const realParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.real${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${realParts})${divisorExpr} AS total_realisasi`);
        for (let m = 1; m <= 12; m++) {
          selectColumns.push(`SUM(main.jml_penerima${m}) AS jml_penerima${m}`);
        }
        const penerimaParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.jml_penerima${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${penerimaParts}) AS total_penerima`);
        for (let m = 1; m <= 12; m++) {
          selectColumns.push(`SUM(main.jml_va${m}) AS jml_va${m}`);
        }
        const vaParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.jml_va${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${vaParts}) AS total_va`);
      } else if (reportParams.tipeLaporan === "belwil_subsidi_realisasi") {
        for (let m = 1; m <= 12; m++) {
          selectColumns.push(`SUM(main.real${m})${divisorExpr} AS real${m}`);
        }
        const realParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.real${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${realParts})${divisorExpr} AS total_realisasi`);
      } else if (
        reportParams.tipeLaporan === "belwil_subsidi_jumlah_penerima"
      ) {
        for (let m = 1; m <= 12; m++) {
          selectColumns.push(`SUM(main.jml_penerima${m}) AS jml_penerima${m}`);
        }
        const parts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.jml_penerima${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${parts}) AS total_penerima`);
      } else if (reportParams.tipeLaporan === "belwil_subsidi_jumlah_va") {
        for (let m = 1; m <= 12; m++) {
          selectColumns.push(`SUM(main.jml_va${m}) AS jml_va${m}`);
        }
        const parts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.jml_va${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${parts}) AS total_va`);
      }

      return selectColumns;
    },
    [],
  );

  const buildWhereClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilSubsidiReportParams,
    ): string[] => {
      const whereConditions: string[] = [];

      // Filter by tahun (the table has a tahun column)
      whereConditions.push(`main.tahun = '${reportParams.tahun}'`);

      // Filter by jnsBansos (pilihan)
      if (reportParams.jnsBansos && reportParams.jnsBansos !== "all") {
        const safe = escapeJnsBansos(reportParams.jnsBansos);
        if (safe) {
          whereConditions.push(`main.jns_bansos = '${safe}'`);
        }
      }

      // Filter by jnsBansosKondisi (comma-separated include/exclude)
      if (
        reportParams.jnsBansosKondisi &&
        reportParams.jnsBansosKondisi.trim()
      ) {
        const codes = reportParams.jnsBansosKondisi
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        const includeCodes = codes
          .filter((c) => !c.startsWith("!") && !c.startsWith("-"))
          .map((c) => c.replace(/'/g, "''"));
        const excludeCodes = codes
          .filter((c) => c.startsWith("!") || c.startsWith("-"))
          .map((c) => c.slice(1).replace(/'/g, "''"));
        for (const code of includeCodes) {
          whereConditions.push(`main.jns_bansos = '${code}'`);
        }
        for (const code of excludeCodes) {
          whereConditions.push(`main.jns_bansos != '${code}'`);
        }
      }

      // Filter by jnsBansosKataKunci (LIKE search on jns_bansos)
      if (
        reportParams.jnsBansosKataKunci &&
        reportParams.jnsBansosKataKunci.trim()
      ) {
        const kw = reportParams.jnsBansosKataKunci.replace(/'/g, "''");
        whereConditions.push(`LOWER(main.jns_bansos) LIKE LOWER('%${kw}%')`);
      }

      // Active filter conditions
      const uniqueFilters = Array.from(new Set(activeFilters));
      uniqueFilters.forEach((filterKey) => {
        const col = SUBSIDI_COLUMN_MAP[filterKey];
        if (!col) return;

        const filterValue = filterValues[filterKey];
        if (!filterValue) return;

        const { selection, kondisiCode, mengandungKata } = filterValue;

        if (selection && selection !== "all") {
          whereConditions.push(`main.${col} = '${selection}'`);
        }

        if (kondisiCode && kondisiCode.trim()) {
          const isExclude =
            kondisiCode.startsWith("!") || kondisiCode.startsWith("-");
          const cleanKondisi = isExclude
            ? kondisiCode.substring(1)
            : kondisiCode;
          const values = cleanKondisi
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          const conditions = values.map((v) =>
            v.length < col.length
              ? `main.${col} ${isExclude ? "NOT LIKE" : "LIKE"} '${v}%'`
              : `main.${col} ${isExclude ? "<>" : "="} '${v}'`,
          );
          const joinOp = isExclude ? " AND " : " OR ";
          if (conditions.length > 0) {
            whereConditions.push(`(${conditions.join(joinOp)})`);
          }
        }

        if (mengandungKata && mengandungKata.trim()) {
          const nameCol = SUBSIDI_NAME_COLUMN_MAP[filterKey];
          if (nameCol) {
            whereConditions.push(
              `LOWER(main.${nameCol}) LIKE LOWER('%${mengandungKata.trim()}%')`,
            );
          }
        }
      });

      return whereConditions;
    },
    [],
  );

  const buildGroupByClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilSubsidiReportParams,
    ): string[] => {
      const groupByColumns: string[] = [];
      const seen = new Set<string>();

      const addGroupBy = (col: string) => {
        if (!seen.has(col)) {
          seen.add(col);
          groupByColumns.push(col);
        }
      };

      const uniqueFilters = Array.from(new Set(activeFilters)).filter(
        (k) => SUBSIDI_COLUMN_MAP[k],
      );

      uniqueFilters.forEach((filterKey) => {
        const jenisTampilan = filterValues[filterKey]?.jenisTampilan || "kode";
        if (jenisTampilan === "jangan_tampilkan") return;

        const col = SUBSIDI_COLUMN_MAP[filterKey];
        const nameCol = SUBSIDI_NAME_COLUMN_MAP[filterKey];

        if (jenisTampilan === "kode" || jenisTampilan === "kode_uraian") {
          addGroupBy(`main.${col}`);
        }
        if (
          (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") &&
          nameCol
        ) {
          addGroupBy(`main.${nameCol}`);
        }
      });

      // Include jns_bansos in GROUP BY only when it's shown
      const jnsBansosJenisTampilanGb =
        reportParams.jnsBansosJenisTampilan || "uraian";
      if (jnsBansosJenisTampilanGb !== "jangan_tampilkan") {
        addGroupBy("main.jns_bansos");
      }

      return groupByColumns;
    },
    [],
  );

  const buildQuery = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilSubsidiReportParams,
    ): string => {
      try {
        const mainTable = buildTableName(reportParams.tahun);
        const selectColumns = buildSelectClause(
          activeFilters,
          filterValues,
          reportParams,
        );
        const whereConditions = buildWhereClause(
          activeFilters,
          filterValues,
          reportParams,
        );
        const groupByColumns = buildGroupByClause(
          activeFilters,
          filterValues,
          reportParams,
        );

        let query = `SELECT\n  ${selectColumns.join(",\n  ")}\nFROM ${mainTable} AS main`;

        if (whereConditions.length > 0) {
          query += `\nWHERE\n  ${whereConditions.join("\n  AND ")}`;
        }

        if (groupByColumns.length > 0) {
          query += `\nGROUP BY\n  ${groupByColumns.join(",\n  ")}`;
        }

        return query;
      } catch (err) {
        return `-- Error building subsidi query: ${(err as Error).message}`;
      }
    },
    [buildTableName, buildSelectClause, buildWhereClause, buildGroupByClause],
  );

  const encryptQuery = useCallback(
    (query: string): string => btoa(encodeURIComponent(query)),
    [],
  );

  return { buildQuery, encryptQuery, buildTableName };
}
