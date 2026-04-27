"use client";

import { useCallback } from "react";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";

// Column mapping for monev{year}.bansos_pkh_bulanan table
const BANSOS_COLUMN_MAP: Record<string, string> = {
  kementerian: "kddept",
  eselonI: "kdunit",
  kewenangan: "kddekon",
  satker: "kdsatker",
  provinsi: "kdprov",
  kabkota: "kdkabkota",
  kecamatan: "kdkecamatan",
  kanwil: "kdkanwil",
};

// Name columns for uraian/kode_uraian display mode
const BANSOS_NAME_COLUMN_MAP: Record<string, string> = {
  kementerian: "nmdept",
  eselonI: "nmunit",
  kewenangan: "nmdekon",
  satker: "nmsatker",
  provinsi: "nmprov",
  kabkota: "nmkabkota",
  kecamatan: "nmkecamatan",
  kanwil: "nmkanwil",
};

export const BELWIL_BANSOS_SUPPORTED_FILTERS = [
  "kementerian",
  "eselonI",
  "kewenangan",
  "satker",
  "provinsi",
  "kabkota",
  "kecamatan",
  "kanwil",
];

export type BansosTipeLaporan =
  | "belwil_bansos_all"
  | "belwil_bansos_realisasi"
  | "belwil_bansos_jumlah_penerima";

export interface BelwilBansosReportParams {
  tahun: string;
  tipeLaporan: BansosTipeLaporan;
  pembulatan: string;
  kdbansos?: string;
  kdbansosKondisi?: string;
  kdbansosKataKunci?: string;
  kdbansosJenisTampilan?: string;
  akumulatif?: boolean;
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

function escapeJenisTransaksi(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "all") return null;
  return trimmed.replace(/'/g, "''");
}

function buildFilterWhereClause(
  activeFilters: string[],
  filterValues: Record<string, FilterValue>,
): string[] {
  const conditions: string[] = [];

  const uniqueFilters = Array.from(new Set(activeFilters)).filter(
    (k) => BANSOS_COLUMN_MAP[k],
  );

  for (const filterKey of uniqueFilters) {
    const col = BANSOS_COLUMN_MAP[filterKey];
    const nameCol = BANSOS_NAME_COLUMN_MAP[filterKey];
    const fv = filterValues[filterKey];
    if (!fv) continue;

    const { selection, kondisiCode, mengandungKata } = fv;

    // selection filter
    if (selection && selection !== "all" && selection !== "") {
      conditions.push(`a.${col} = '${selection.replace(/'/g, "''")}'`);
    }

    // kondisiCode filter
    if (kondisiCode && kondisiCode.trim() !== "") {
      const codes = kondisiCode
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
        if (code.length < 6) {
          conditions.push(`a.${col} LIKE '${code}%'`);
        } else {
          conditions.push(`a.${col} = '${code}'`);
        }
      }
      for (const code of excludeCodes) {
        if (code.length < 6) {
          conditions.push(`a.${col} NOT LIKE '${code}%'`);
        } else {
          conditions.push(`a.${col} != '${code}'`);
        }
      }
    }

    // mengandungKata filter
    if (mengandungKata && mengandungKata.trim() !== "" && nameCol) {
      const kw = mengandungKata.replace(/'/g, "''");
      conditions.push(`LOWER(a.${nameCol}) LIKE LOWER('%${kw}%')`);
    }
  }

  return conditions;
}

export function useBelwilBansosQueryBuilder() {
  const encryptQuery = useCallback((query: string): string => {
    return btoa(encodeURIComponent(query));
  }, []);

  const buildQuery = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilBansosReportParams,
    ): string => {
      const {
        tahun,
        tipeLaporan,
        pembulatan,
        kdbansos,
        kdbansosKondisi,
        kdbansosKataKunci,
        kdbansosJenisTampilan,
        akumulatif,
      } = reportParams;
      const divisor = getPembulatanDivisor(pembulatan);
      const divisorExpr =
        tipeLaporan === "belwil_bansos_realisasi" && divisor !== 1
          ? ` / ${divisor}`
          : "";

      const uniqueFilters = Array.from(new Set(activeFilters)).filter(
        (k) => BANSOS_COLUMN_MAP[k],
      );

      // --- SELECT ---
      const selectColumns: string[] = [];

      // Dimension columns from active filters
      uniqueFilters.forEach((filterKey) => {
        const col = BANSOS_COLUMN_MAP[filterKey];
        const nameCol = BANSOS_NAME_COLUMN_MAP[filterKey];
        const jenisTampilan = filterValues[filterKey]?.jenisTampilan || "kode";

        if (jenisTampilan === "jangan_tampilkan") return;

        if (jenisTampilan === "kode" || jenisTampilan === "kode_uraian") {
          selectColumns.push(`a.${col} AS ${filterKey}_kode`);
        }
        if (
          (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") &&
          nameCol
        ) {
          selectColumns.push(`a.${nameCol} AS ${filterKey}_uraian`);
        }
      });

      // jenis_transaksi column based on jenisTampilan (only uraian / jangan_tampilkan)
      const bansosJenisTampilan = kdbansosJenisTampilan || "uraian";
      if (bansosJenisTampilan !== "jangan_tampilkan") {
        selectColumns.push("a.jenis_transaksi");
      }
      selectColumns.push("a.tahap");

      // Metric columns
      if (tipeLaporan === "belwil_bansos_all") {
        const allDivisorExpr = divisor !== 1 ? ` / ${divisor}` : "";
        if (akumulatif) {
          for (let m = 1; m <= 12; m++) {
            const realParts = Array.from(
              { length: m },
              (_, i) => `SUM(COALESCE(a.real${i + 1}, 0))`,
            ).join(" + ");
            selectColumns.push(`(${realParts})${allDivisorExpr} AS real${m}`);
            const jmlParts = Array.from(
              { length: m },
              (_, i) => `SUM(COALESCE(a.jml${i + 1}, 0))`,
            ).join(" + ");
            selectColumns.push(`(${jmlParts}) AS jml${m}`);
          }
        } else {
          for (let m = 1; m <= 12; m++) {
            selectColumns.push(`SUM(a.real${m})${allDivisorExpr} AS real${m}`);
            selectColumns.push(`SUM(a.jml${m}) AS jml${m}`);
          }
        }
        const totalRealParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(a.real${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(
          `(${totalRealParts})${allDivisorExpr} AS total_realisasi`,
        );
        const totalJmlParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(a.jml${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${totalJmlParts}) AS total_penerima`);
      } else if (tipeLaporan === "belwil_bansos_realisasi") {
        if (akumulatif) {
          for (let m = 1; m <= 12; m++) {
            const parts = Array.from(
              { length: m },
              (_, i) => `SUM(COALESCE(a.real${i + 1}, 0))`,
            ).join(" + ");
            selectColumns.push(`(${parts})${divisorExpr} AS real${m}`);
          }
        } else {
          for (let m = 1; m <= 12; m++) {
            selectColumns.push(`SUM(a.real${m})${divisorExpr} AS real${m}`);
          }
        }
        const realParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(a.real${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${realParts})${divisorExpr} AS total_realisasi`);
      } else if (tipeLaporan === "belwil_bansos_jumlah_penerima") {
        if (akumulatif) {
          for (let m = 1; m <= 12; m++) {
            const parts = Array.from(
              { length: m },
              (_, i) => `SUM(COALESCE(a.jml${i + 1}, 0))`,
            ).join(" + ");
            selectColumns.push(`(${parts}) AS jml${m}`);
          }
        } else {
          for (let m = 1; m <= 12; m++) {
            selectColumns.push(`SUM(a.jml${m}) AS jml${m}`);
          }
        }
        const jmlParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(a.jml${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${jmlParts}) AS total_penerima`);
      }

      // --- FROM ---
      const tableName = `monev${tahun}.bansos_pkh_bulanan`;
      const fromClause = `FROM ${tableName} AS a`;

      // --- WHERE ---
      const whereConditions: string[] = [`1 = 1`];

      const escapedKdbansos = escapeJenisTransaksi(kdbansos || "");
      if (escapedKdbansos) {
        whereConditions.push(`a.jenis_transaksi = '${escapedKdbansos}'`);
      }

      if (kdbansosKondisi && kdbansosKondisi.trim()) {
        const codes = kdbansosKondisi
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
          if (code.length < 6) {
            whereConditions.push(`a.jenis_transaksi LIKE '${code}%'`);
          } else {
            whereConditions.push(`a.jenis_transaksi = '${code}'`);
          }
        }
        for (const code of excludeCodes) {
          if (code.length < 6) {
            whereConditions.push(`a.jenis_transaksi NOT LIKE '${code}%'`);
          } else {
            whereConditions.push(`a.jenis_transaksi != '${code}'`);
          }
        }
      }

      if (kdbansosKataKunci && kdbansosKataKunci.trim() !== "") {
        const kw = kdbansosKataKunci.replace(/'/g, "''");
        whereConditions.push(`LOWER(a.jenis_transaksi) LIKE LOWER('%${kw}%')`);
      }

      const filterConditions = buildFilterWhereClause(
        activeFilters,
        filterValues,
      );
      whereConditions.push(...filterConditions);

      // --- GROUP BY ---
      const groupByColumns: string[] = [];

      uniqueFilters.forEach((filterKey) => {
        const col = BANSOS_COLUMN_MAP[filterKey];
        const nameCol = BANSOS_NAME_COLUMN_MAP[filterKey];
        const jenisTampilan = filterValues[filterKey]?.jenisTampilan || "kode";

        if (jenisTampilan === "jangan_tampilkan") return;

        if (jenisTampilan === "kode" || jenisTampilan === "kode_uraian") {
          groupByColumns.push(`a.${col}`);
        }
        if (
          (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") &&
          nameCol
        ) {
          groupByColumns.push(`a.${nameCol}`);
        }
      });

      // Always GROUP BY jenis_transaksi (if selected) and tahap
      if (bansosJenisTampilan !== "jangan_tampilkan") {
        groupByColumns.push("a.jenis_transaksi");
      }
      groupByColumns.push("a.tahap");

      const selectClause = `SELECT\n  ${selectColumns.join(",\n  ")}`;
      const whereClause =
        whereConditions.length > 0
          ? `WHERE\n  ${whereConditions.join("\n  AND ")}`
          : "";
      const groupByClause =
        groupByColumns.length > 0
          ? `GROUP BY\n  ${groupByColumns.join(",\n  ")}`
          : "";

      return [selectClause, fromClause, whereClause, groupByClause]
        .filter(Boolean)
        .join("\n");
    },
    [],
  );

  return { buildQuery, encryptQuery };
}
