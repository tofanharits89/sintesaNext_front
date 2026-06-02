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
      conditions.push(`main.${col} = '${selection.replace(/'/g, "''")}'`);
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
          conditions.push(`main.${col} LIKE '${code}%'`);
        } else {
          conditions.push(`main.${col} = '${code}'`);
        }
      }
      for (const code of excludeCodes) {
        if (code.length < 6) {
          conditions.push(`main.${col} NOT LIKE '${code}%'`);
        } else {
          conditions.push(`main.${col} != '${code}'`);
        }
      }
    }

    // mengandungKata filter
    if (mengandungKata && mengandungKata.trim() !== "" && nameCol) {
      const kw = mengandungKata.replace(/'/g, "''");
      conditions.push(`LOWER(main.${nameCol}) LIKE LOWER('%${kw}%')`);
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
      const joinColumns: string[] = [];
      const groupByColumns: string[] = [];

      // Dimension columns from active filters
      uniqueFilters.forEach((filterKey) => {
        const col = BANSOS_COLUMN_MAP[filterKey];
        const nameCol = BANSOS_NAME_COLUMN_MAP[filterKey];
        const jenisTampilan = filterValues[filterKey]?.jenisTampilan || "kode";

        if (jenisTampilan === "jangan_tampilkan") return;

        if (jenisTampilan === "kode" || jenisTampilan === "kode_uraian") {
          selectColumns.push(`main.${col} AS ${filterKey}_kode`);
        }
        if (
          (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") &&
          nameCol
        ) {
          // Kementerian
          if (filterKey === "kementerian") {
            selectColumns.push(`ref_kl.${nameCol} AS ${filterKey}_uraian`);
            joinColumns.push(
              `LEFT JOIN dbref.t_dept_${tahun} ref_kl ON main.kddept=ref_kl.kddept`,
            );
          }
          // Eselon I
          else if (filterKey === "eselonI") {
            selectColumns.push(`ref_es1.${nameCol} AS ${filterKey}_uraian`);
            joinColumns.push(
              `LEFT JOIN dbref.t_unit_${tahun} ref_es1 ON main.kddept=ref_es1.kddept AND main.kdunit=ref_es1.kdunit`,
            );
          }
          // Kewenangan
          else if (filterKey === "kewenangan") {
            selectColumns.push(`ref_dekon.${nameCol} AS ${filterKey}_uraian`);
            joinColumns.push(
              `LEFT JOIN dbref.t_dekon_${tahun} ref_dekon ON main.kddekon=ref_dekon.kddekon`,
            );
          }
          // Satker
          else if (filterKey === "satker") {
            selectColumns.push(`ref_satker.${nameCol} AS ${filterKey}_uraian`);
            joinColumns.push(
              `LEFT JOIN dbref.t_satker_${tahun} ref_satker ON main.kdsatker=ref_satker.kdsatker`,
            );
          }
          // Provinsi
          else if (filterKey === "provinsi") {
            selectColumns.push(`ref_prov.${nameCol} AS ${filterKey}_uraian`);
            joinColumns.push(
              `LEFT JOIN dbref.t_provinsi ref_prov ON main.kdprov=ref_prov.kdprov`,
            );
          }
          // Kabkota
          else if (filterKey === "kabkota") {
            selectColumns.push(`ref_kabkota.${nameCol} AS ${filterKey}_uraian`);
            joinColumns.push(
              `LEFT JOIN dbref.t_kabkota_bansos ref_kabkota ON main.kdprov=ref_kabkota.kdprov AND main.kdkabkota=ref_kabkota.kdkabkota`,
            );
          }
          // Kecamatan
          else if (filterKey === "kecamatan") {
            selectColumns.push(`ref_kec.${nameCol} AS ${filterKey}_uraian`);
            joinColumns.push(
              `LEFT JOIN dbref.t_kecamatan ref_kec ON main.kdprov=ref_kec.kdprov AND main.kdkabkota=ref_kec.kdkabkota AND main.kdkec=ref_kec.kdkec`,
            );
          }
          // Kanwil
          else if (filterKey === "kanwil") {
            selectColumns.push(`ref_kanwil.${nameCol} AS ${filterKey}_uraian`);
            joinColumns.push(
              `LEFT JOIN dbref.t_kanwil_${tahun} ref_kanwil ON main.kdkanwil=ref_kanwil.kdkanwil`,
            );
          }
          // Default Fallback
          else {
            selectColumns.push(`main.${nameCol} AS ${filterKey}_uraian`);
          }
        }
      });

      // jenis_transaksi column based on jenisTampilan (only uraian / jangan_tampilkan)
      const bansosJenisTampilan = kdbansosJenisTampilan || "uraian";
      if (bansosJenisTampilan !== "jangan_tampilkan") {
        selectColumns.push("main.jenis_transaksi");
      }
      selectColumns.push("main.tahap");

      // Metric columns
      if (tipeLaporan === "belwil_bansos_all") {
        const allDivisorExpr = divisor !== 1 ? ` / ${divisor}` : "";
        if (akumulatif) {
          for (let m = 1; m <= 12; m++) {
            const realParts = Array.from(
              { length: m },
              (_, i) => `SUM(COALESCE(main.real${i + 1}, 0))`,
            ).join(" + ");
            selectColumns.push(`(${realParts})${allDivisorExpr} AS real${m}`);
            const jmlParts = Array.from(
              { length: m },
              (_, i) => `SUM(COALESCE(main.jml${i + 1}, 0))`,
            ).join(" + ");
            selectColumns.push(`(${jmlParts}) AS jml${m}`);
          }
        } else {
          for (let m = 1; m <= 12; m++) {
            selectColumns.push(
              `SUM(main.real${m})${allDivisorExpr} AS real${m}`,
            );
            selectColumns.push(`SUM(main.jml${m}) AS jml${m}`);
          }
        }
        const totalRealParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.real${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(
          `(${totalRealParts})${allDivisorExpr} AS total_realisasi`,
        );
        const totalJmlParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.jml${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${totalJmlParts}) AS total_penerima`);
      } else if (tipeLaporan === "belwil_bansos_realisasi") {
        if (akumulatif) {
          for (let m = 1; m <= 12; m++) {
            const parts = Array.from(
              { length: m },
              (_, i) => `SUM(COALESCE(main.real${i + 1}, 0))`,
            ).join(" + ");
            selectColumns.push(`(${parts})${divisorExpr} AS real${m}`);
          }
        } else {
          for (let m = 1; m <= 12; m++) {
            selectColumns.push(`SUM(main.real${m})${divisorExpr} AS real${m}`);
          }
        }
        const realParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.real${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${realParts})${divisorExpr} AS total_realisasi`);
      } else if (tipeLaporan === "belwil_bansos_jumlah_penerima") {
        if (akumulatif) {
          for (let m = 1; m <= 12; m++) {
            const parts = Array.from(
              { length: m },
              (_, i) => `SUM(COALESCE(main.jml${i + 1}, 0))`,
            ).join(" + ");
            selectColumns.push(`(${parts}) AS jml${m}`);
          }
        } else {
          for (let m = 1; m <= 12; m++) {
            selectColumns.push(`SUM(main.jml${m}) AS jml${m}`);
          }
        }
        const jmlParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.jml${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${jmlParts}) AS total_penerima`);
      }

      // --- FROM ---
      const tableName = `monev${tahun}.bansos_pkh_bulanan`;
      const fromClause = `FROM ${tableName} AS main`;

      // --- WHERE ---
      const whereConditions: string[] = [`1 = 1`];

      const escapedKdbansos = escapeJenisTransaksi(kdbansos || "");
      if (escapedKdbansos) {
        whereConditions.push(`main.jenis_transaksi = '${escapedKdbansos}'`);
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
            whereConditions.push(`main.jenis_transaksi LIKE '${code}%'`);
          } else {
            whereConditions.push(`main.jenis_transaksi = '${code}'`);
          }
        }
        for (const code of excludeCodes) {
          if (code.length < 6) {
            whereConditions.push(`main.jenis_transaksi NOT LIKE '${code}%'`);
          } else {
            whereConditions.push(`main.jenis_transaksi != '${code}'`);
          }
        }
      }

      if (kdbansosKataKunci && kdbansosKataKunci.trim() !== "") {
        const kw = kdbansosKataKunci.replace(/'/g, "''");
        whereConditions.push(
          `LOWER(main.jenis_transaksi) LIKE LOWER('%${kw}%')`,
        );
      }

      const filterConditions = buildFilterWhereClause(
        activeFilters,
        filterValues,
      );
      whereConditions.push(...filterConditions);

      // --- GROUP BY ---
      uniqueFilters.forEach((filterKey) => {
        const col = BANSOS_COLUMN_MAP[filterKey];
        const nameCol = BANSOS_NAME_COLUMN_MAP[filterKey];
        const jenisTampilan = filterValues[filterKey]?.jenisTampilan || "kode";

        if (jenisTampilan === "jangan_tampilkan") return;

        if (jenisTampilan === "kode" || jenisTampilan === "kode_uraian") {
          groupByColumns.push(`main.${col}`);
        }
        if (
          (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") &&
          nameCol
        ) {
          // Kementerian
          if (filterKey === "kementerian") {
            groupByColumns.push(`ref_kl.${nameCol}`);
          }
          // Eselon I
          else if (filterKey === "eselonI") {
            groupByColumns.push(`ref_es1.${nameCol}`);
          }
          // Kewenangan
          else if (filterKey === "kewenangan") {
            groupByColumns.push(`ref_dekon.${nameCol}`);
          }
          // Satker
          else if (filterKey === "satker") {
            groupByColumns.push(`ref_satker.${nameCol}`);
          }
          // Provinsi
          else if (filterKey === "provinsi") {
            groupByColumns.push(`ref_prov.${nameCol}`);
          }
          // Kabkota
          else if (filterKey === "kabkota") {
            groupByColumns.push(`ref_kabkota.${nameCol}`);
          }
          // Kecamatan
          else if (filterKey === "kecamatan") {
            groupByColumns.push(`ref_kec.${nameCol}`);
          }
          // Kanwil
          else if (filterKey === "kanwil") {
            groupByColumns.push(`ref_kanwil.${nameCol}`);
          } else {
            groupByColumns.push(`main.${nameCol}`);
          }
        }
      });

      // Always GROUP BY jenis_transaksi (if selected) and tahap
      if (bansosJenisTampilan !== "jangan_tampilkan") {
        groupByColumns.push("main.jenis_transaksi");
      }
      groupByColumns.push("main.tahap");

      const selectClause = `SELECT\n  ${selectColumns.join(",\n  ")}`;
      const whereClause =
        whereConditions.length > 0
          ? `WHERE\n  ${whereConditions.join("\n  AND ")}`
          : "";
      const groupByClause =
        groupByColumns.length > 0
          ? `GROUP BY\n  ${groupByColumns.join(",\n  ")}`
          : "";
      const joinClause = joinColumns.length > 0 ? joinColumns.join("\n") : "";

      return [selectClause, fromClause, joinClause, whereClause, groupByClause]
        .filter(Boolean)
        .join("\n");
    },
    [],
  );

  return { buildQuery, encryptQuery };
}
