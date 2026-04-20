"use client";

import { useCallback } from "react";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";

// Column mapping from UI filter keys to belanja_kewilayahan table columns
const BELWIL_COLUMN_MAP: Record<string, string> = {
  kementerian: "kddept",
  eselonI: "kdunit",
  kewenangan: "kddekon",
  provinsi: "kode_lokus_provinsi",
  kabkota: "kode_lokus_kabkota",
  kanwil: "kdkanwil",
  kppn: "kdkppn",
  satker: "kdsatker",
  fungsi: "kdfungsi",
  subFungsi: "kdsfung",
  program: "kdprogram",
  kegiatan: "kdgiat",
  outputKro: "kdkro",
  subOutputRo: "kdro",
  komponen: "kdkomp",
  subKomponen: "kdsubkomp",
  akun: "kode_akun",
  item: "kditem",
  regional: "kdregional",
  lokusAnggaran: "kode_lokus_anggaran",
};

// Name column for display (uraian/kode_uraian mode)
const BELWIL_NAME_COLUMN_MAP: Record<string, string> = {
  kementerian: "desc_dept",
  eselonI: "desc_unit",
  kewenangan: "nmdekon",
  provinsi: "lokus_provinsi",
  kabkota: "lokus_kabkota",
  kanwil: "nmkanwil",
  kppn: "nmkppn",
  satker: "desc_satker",
  fungsi: "nmfungsi",
  subFungsi: "nmsfung",
  program: "desc_program",
  kegiatan: "desc_kegiatan",
  outputKro: "desc_kro",
  subOutputRo: "desc_ro",
  komponen: "desc_komp",
  subKomponen: "desc_subkomponen",
  akun: "desc_akun",
  item: "desc_item",
  regional: "nmregional",
  lokusAnggaran: "lokus_anggaran",
};

// Filters that are supported on the belwil table
export const BELWIL_SUPPORTED_FILTERS = [
  "kementerian",
  "eselonI",
  "kewenangan",
  "provinsi",
  "kabkota",
  "kanwil",
  "kppn",
  "satker",
  "fungsi",
  "subFungsi",
  "program",
  "kegiatan",
  "outputKro",
  "subOutputRo",
  "komponen",
  "subKomponen",
  "akun",
  "item",
  "regional",
  "lokusAnggaran",
];

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

export function useBelwilQueryBuilder() {
  const buildTableName = useCallback((tahun: string) => {
    return `kewilayahan_${tahun}.belanja_kewilayahan_${tahun}`;
  }, []);

  const buildSelectClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        pembulatan: string;
        tahun: string;
        tipeLaporan: string;
        jenisAkumulasi?: string;
      },
    ) => {
      const selectColumns: string[] = [];
      const divisor = getPembulatanDivisor(reportParams.pembulatan);
      const isDivisorOne = divisor === 1;
      const divisorExpr = isDivisorOne ? "" : ` / ${divisor}`;

      const uniqueFilters = Array.from(new Set(activeFilters)).filter(
        (k) => k !== "cutOff" && BELWIL_COLUMN_MAP[k],
      );

      // Filter dimension columns
      uniqueFilters.forEach((filterKey) => {
        const col = BELWIL_COLUMN_MAP[filterKey];
        const nameCol = BELWIL_NAME_COLUMN_MAP[filterKey];
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

      if (selectColumns.length === 0) {
        // Fallback: include a meaningful grouping column
        selectColumns.push("main.kddept AS kementerian_kode");
      }

      // Always include pagu for tipe laporan that need it
      const includePagu =
        reportParams.tipeLaporan === "pagu_realisasi" ||
        reportParams.tipeLaporan === "pagu_saja" ||
        reportParams.tipeLaporan === "pagu_realisasi_bulanan";

      if (includePagu) {
        selectColumns.push(`SUM(main.pagu)${divisorExpr} AS pagu`);
      }

      // Always include all 12 real columns (except pagu_saja which is pagu only)
      if (reportParams.tipeLaporan !== "pagu_saja") {
        for (let m = 1; m <= 12; m++) {
          selectColumns.push(`SUM(main.real${m})${divisorExpr} AS real${m}`);
        }
        // Each term must be an aggregate (SUM) because the query uses GROUP BY
        const realParts = Array.from(
          { length: 12 },
          (_, i) => `SUM(COALESCE(main.real${i + 1}, 0))`,
        ).join(" + ");
        selectColumns.push(`(${realParts})${divisorExpr} AS total_realisasi`);
      }

      return selectColumns;
    },
    [],
  );

  const buildWhereClause = useCallback(
    (activeFilters: string[], filterValues: Record<string, FilterValue>) => {
      const whereConditions: string[] = [];
      const uniqueFilters = Array.from(new Set(activeFilters)).filter(
        (k) => k !== "cutOff",
      );

      uniqueFilters.forEach((filterKey) => {
        const col = BELWIL_COLUMN_MAP[filterKey];
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
          const nameCol = BELWIL_NAME_COLUMN_MAP[filterKey];
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
    (activeFilters: string[], filterValues: Record<string, FilterValue>) => {
      const groupByColumns: string[] = [];
      const seen = new Set<string>();

      const addGroupBy = (col: string) => {
        if (!seen.has(col)) {
          seen.add(col);
          groupByColumns.push(col);
        }
      };

      const uniqueFilters = Array.from(new Set(activeFilters)).filter(
        (k) => k !== "cutOff" && BELWIL_COLUMN_MAP[k],
      );

      uniqueFilters.forEach((filterKey) => {
        const jenisTampilan = filterValues[filterKey]?.jenisTampilan || "kode";
        if (jenisTampilan === "jangan_tampilkan") return;

        const col = BELWIL_COLUMN_MAP[filterKey];
        const nameCol = BELWIL_NAME_COLUMN_MAP[filterKey];

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

      return groupByColumns;
    },
    [],
  );

  const ALLOWED_JENIS_DATA_LOKASI = ["Kegiatan", "Supplier"] as const;

  const buildQuery = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
        jenisDataLokasi?: string;
      },
    ): string => {
      try {
        const mainTable = buildTableName(reportParams.tahun);
        const selectColumns = buildSelectClause(
          activeFilters,
          filterValues,
          reportParams,
        );
        const whereConditions = buildWhereClause(activeFilters, filterValues);
        // Mandatory jenis_data_lokasi filter (whitelist-validated to prevent SQL injection)
        const jenisDataLokasi = reportParams.jenisDataLokasi;
        if (
          jenisDataLokasi &&
          (ALLOWED_JENIS_DATA_LOKASI as readonly string[]).includes(
            jenisDataLokasi,
          )
        ) {
          whereConditions.push(`main.jenis_data_lokasi = '${jenisDataLokasi}'`);
        }
        const groupByColumns = buildGroupByClause(activeFilters, filterValues);

        let query = `SELECT\n  ${selectColumns.join(",\n  ")}\nFROM ${mainTable} AS main`;

        if (whereConditions.length > 0) {
          query += `\nWHERE\n  ${whereConditions.join("\n  AND ")}`;
        }

        if (groupByColumns.length > 0) {
          query += `\nGROUP BY\n  ${groupByColumns.join(",\n  ")}`;
        }

        return query;
      } catch (err) {
        return `-- Error building belwil query: ${(err as Error).message}`;
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

// ─── Tematik Query Builder ────────────────────────────────────────────────────

export type BelwilTematikTipeLaporan =
  | "belwil_tematik_prioritasPresiden"
  | "belwil_tematik_inflasi";

export interface BelwilTematikReportParams {
  tahun: string;
  tipeLaporan: BelwilTematikTipeLaporan;
  pembulatan: string;
  jenisDataLokasi: string;
  kdpriopres?: string;
  infIntervensi?: string;
  infPengeluaran?: string;
}

/** Same supported filters as belwil belanja — column maps are identical */
export const BELWIL_TEMATIK_SUPPORTED_FILTERS = BELWIL_SUPPORTED_FILTERS;

const ALLOWED_TEMATIK_JENIS_DATA_LOKASI = ["Kegiatan", "Supplier"] as const;

export function useBelwilTematikQueryBuilder() {
  const buildTableName = useCallback(
    (tahun: string, tipeLaporan: BelwilTematikTipeLaporan): string => {
      if (tipeLaporan === "belwil_tematik_prioritasPresiden") {
        return `kewilayahan_${tahun}.smry_prioritas_presiden_${tahun}`;
      }
      return `kewilayahan_${tahun}.smry_inflasi_${tahun}`;
    },
    [],
  );

  const buildSelectClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilTematikReportParams,
    ): string[] => {
      const selectColumns: string[] = [];
      const divisor = getPembulatanDivisor(reportParams.pembulatan);
      const divisorExpr = divisor === 1 ? "" : ` / ${divisor}`;

      const uniqueFilters = Array.from(new Set(activeFilters)).filter(
        (k) => k !== "cutOff" && BELWIL_COLUMN_MAP[k],
      );

      uniqueFilters.forEach((filterKey) => {
        const col = BELWIL_COLUMN_MAP[filterKey];
        const nameCol = BELWIL_NAME_COLUMN_MAP[filterKey];
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

      // Tematik-specific dimension columns
      if (reportParams.tipeLaporan === "belwil_tematik_prioritasPresiden") {
        selectColumns.push("main.kdpriopres AS kdpriopres");
        selectColumns.push("main.nmpriopres AS nmpriopres");
      } else if (reportParams.tipeLaporan === "belwil_tematik_inflasi") {
        selectColumns.push("main.inf_intervensi AS inf_intervensi");
        selectColumns.push("main.ur_inf_intervensi AS ur_inf_intervensi");
        selectColumns.push("main.inf_pengeluaran AS inf_pengeluaran");
        selectColumns.push("main.ur_inf_pengeluaran AS ur_inf_pengeluaran");
      }

      if (selectColumns.length === 0) {
        selectColumns.push("main.kddept AS kementerian_kode");
      }

      //   selectColumns.push(`SUM(main.pagu)${divisorExpr} AS pagu`);

      for (let m = 1; m <= 12; m++) {
        selectColumns.push(`SUM(main.real${m})${divisorExpr} AS real${m}`);
      }
      const realParts = Array.from(
        { length: 12 },
        (_, i) => `SUM(COALESCE(main.real${i + 1}, 0))`,
      ).join(" + ");
      selectColumns.push(`(${realParts})${divisorExpr} AS total_realisasi`);

      return selectColumns;
    },
    [],
  );

  const buildWhereClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilTematikReportParams,
    ): string[] => {
      const whereConditions: string[] = [];

      if (
        reportParams.jenisDataLokasi &&
        (ALLOWED_TEMATIK_JENIS_DATA_LOKASI as readonly string[]).includes(
          reportParams.jenisDataLokasi,
        )
      ) {
        whereConditions.push(
          `main.jenis_data_lokasi = '${reportParams.jenisDataLokasi}'`,
        );
      }

      if (
        reportParams.tipeLaporan === "belwil_tematik_prioritasPresiden" &&
        reportParams.kdpriopres &&
        reportParams.kdpriopres !== "all"
      ) {
        whereConditions.push(`main.kdpriopres = '${reportParams.kdpriopres}'`);
      }
      if (reportParams.tipeLaporan === "belwil_tematik_inflasi") {
        if (
          reportParams.infIntervensi &&
          reportParams.infIntervensi !== "all"
        ) {
          whereConditions.push(
            `main.inf_intervensi = '${reportParams.infIntervensi}'`,
          );
        }
        if (
          reportParams.infPengeluaran &&
          reportParams.infPengeluaran !== "all"
        ) {
          whereConditions.push(
            `main.inf_pengeluaran = '${reportParams.infPengeluaran}'`,
          );
        }
      }

      const uniqueFilters = Array.from(new Set(activeFilters)).filter(
        (k) => k !== "cutOff",
      );

      uniqueFilters.forEach((filterKey) => {
        const col = BELWIL_COLUMN_MAP[filterKey];
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
          const nameCol = BELWIL_NAME_COLUMN_MAP[filterKey];
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
      tipeLaporan: BelwilTematikTipeLaporan,
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
        (k) => k !== "cutOff" && BELWIL_COLUMN_MAP[k],
      );

      uniqueFilters.forEach((filterKey) => {
        const jenisTampilan = filterValues[filterKey]?.jenisTampilan || "kode";
        if (jenisTampilan === "jangan_tampilkan") return;

        const col = BELWIL_COLUMN_MAP[filterKey];
        const nameCol = BELWIL_NAME_COLUMN_MAP[filterKey];

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

      if (tipeLaporan === "belwil_tematik_prioritasPresiden") {
        addGroupBy("main.kdpriopres");
        addGroupBy("main.nmpriopres");
      } else if (tipeLaporan === "belwil_tematik_inflasi") {
        addGroupBy("main.inf_intervensi");
        addGroupBy("main.ur_inf_intervensi");
        addGroupBy("main.inf_pengeluaran");
        addGroupBy("main.ur_inf_pengeluaran");
      }

      return groupByColumns;
    },
    [],
  );

  const buildQuery = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: BelwilTematikReportParams,
    ): string => {
      try {
        const mainTable = buildTableName(
          reportParams.tahun,
          reportParams.tipeLaporan,
        );
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
          reportParams.tipeLaporan,
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
        return `-- Error building tematik query: ${(err as Error).message}`;
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
