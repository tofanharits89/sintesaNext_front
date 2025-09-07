"use client";

import { useState, useCallback } from "react";

// Types for the query builder
export interface FilterConfig {
  key: string;
  columnName: string;
  referenceTable?: string;
  referenceDatabase?: string;
  joinKey?: string;
  nameColumn?: string;
}

export interface QueryBuilderState {
  selectColumns: string[];
  whereConditions: string[];
  joinTables: string[];
}

export interface FilterValue {
  selection: string;
  kondisiCode: string;
  mengandungKata: string;
  jenisTampilan: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
  akunType?: "kodeAkun" | "kodeBkpk" | "jenisBelanja"; // For akun filter type switching
}

// Table mapping based on report type
const TABLE_MAPPING = {
  pagu_apbn: "pagu_real_detail_harian_dipa_apbn",
  pagu_realisasi: "pagu_real_detail_harian",
  pagu_realisasi_bulanan: "pagu_real_detail_harian",
  pergerakan_pagu_bulanan: "pagu_real_detail_bulan",
  pergerakan_blokir_bulanan: "pagu_real_detail_bulan",
  pergerakan_blokir_bulanan_per_jenis: "pa_pagu_blokir_akun_bulanan",
  volume_output_kegiatan: "pagu_output", // special-case suffix order handled in buildTableName
};

import { getFilterConfigMap } from "@/components/inquiry-data/filterRegistry";
import {
  getTematikCategory,
  getCategoryQueryConfig,
  getCategoryMandatoryColumns,
} from "@/components/inquiry-data/categoryRegistry";

// Report type behavior configuration for modularity & scalability
const REPORTS_EXCLUDE_PAGU_DIPA = new Set([
  "pergerakan_pagu_bulanan",
  "pergerakan_blokir_bulanan",
  "pergerakan_blokir_bulanan_per_jenis",
]);

const REPORTS_ADD_BLOKIR_AFTER_REAL = new Set(["pagu_apbn", "pagu_realisasi"]);

const REPORTS_MANDATORY_GROUPBY_BLOKIR_JENIS = new Set([
  "pergerakan_blokir_bulanan_per_jenis",
]);

const REPORTS_VOLUME_OUTPUT = new Set(["volume_output_kegiatan"]);

const MONTH_NAMES = [
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
] as const;

const SPECIAL_TABLE_NAME_BUILDERS: Record<
  string,
  (thang: string, baseTable: string) => string
> = {
  pergerakan_blokir_bulanan_per_jenis: (thang) =>
    `monev${thang}.pa_pagu_blokir_akun_${thang}_bulanan`,
  volume_output_kegiatan: (thang, baseTable) =>
    `monev${thang}.${baseTable}_${thang}_new`,
};

// Central registry for report-type behavior (Phase 2)
// This registry can be extended to describe each tipeLaporan’s behavior declaratively.
// The defaults still come from the Sets above to preserve behavior even if a type is missing here.
interface ReportTypeConfig {
  includePaguDipa?: boolean; // defaults: !REPORTS_EXCLUDE_PAGU_DIPA
  addBlokirAfterReal?: boolean; // defaults: REPORTS_ADD_BLOKIR_AFTER_REAL
  requiresGroupByBlokirJenis?: boolean; // defaults: REPORTS_MANDATORY_GROUPBY_BLOKIR_JENIS
  isVolumeOutput?: boolean; // defaults: REPORTS_VOLUME_OUTPUT
  tableNameBuilder?: (thang: string, baseTable: string) => string; // defaults: SPECIAL_TABLE_NAME_BUILDERS
}

const REPORT_TYPE_REGISTRY: Record<string, ReportTypeConfig> = {
  pagu_apbn: {
    includePaguDipa: true,
    addBlokirAfterReal: true,
  },
  pagu_realisasi: {
    includePaguDipa: true,
    addBlokirAfterReal: true,
  },
  pagu_realisasi_bulanan: {
    includePaguDipa: true,
  },
  pergerakan_pagu_bulanan: {
    includePaguDipa: false,
  },
  pergerakan_blokir_bulanan: {
    includePaguDipa: false,
  },
  pergerakan_blokir_bulanan_per_jenis: {
    includePaguDipa: false,
    requiresGroupByBlokirJenis: true,
    tableNameBuilder: (thang) =>
      `monev${thang}.pa_pagu_blokir_akun_${thang}_bulanan`,
  },
  volume_output_kegiatan: {
    includePaguDipa: true,
    isVolumeOutput: true,
    tableNameBuilder: (thang, baseTable) =>
      `monev${thang}.${baseTable}_${thang}_new`,
  },
};

function getReportTypeConfig(tipeLaporan: string): Required<ReportTypeConfig> {
  const base: Required<ReportTypeConfig> = {
    includePaguDipa: !REPORTS_EXCLUDE_PAGU_DIPA.has(tipeLaporan),
    addBlokirAfterReal: REPORTS_ADD_BLOKIR_AFTER_REAL.has(tipeLaporan),
    requiresGroupByBlokirJenis:
      REPORTS_MANDATORY_GROUPBY_BLOKIR_JENIS.has(tipeLaporan),
    isVolumeOutput: REPORTS_VOLUME_OUTPUT.has(tipeLaporan),
    tableNameBuilder:
      SPECIAL_TABLE_NAME_BUILDERS[tipeLaporan] ||
      ((thang: string, baseTable: string) =>
        `monev${thang}.${baseTable}_${thang}`),
  };
  const override = REPORT_TYPE_REGISTRY[tipeLaporan] || {};
  return {
    ...base,
    ...override,
    tableNameBuilder: override.tableNameBuilder || base.tableNameBuilder,
  } as Required<ReportTypeConfig>;
}

// Filter configuration mapping (derived from central registry)
const FILTER_CONFIG: Record<string, FilterConfig> =
  getFilterConfigMap() as Record<string, FilterConfig>;
// Note: cutOff is handled specially in the query builder
// - It's not included in FILTER_CONFIG as it's not a regular filter
// - It only affects which real{month} columns are summed in REALISASI
// - It doesn't appear in SELECT, WHERE, or GROUP BY clauses

export function useInquiryQueryBuilder() {
  const [queryState, setQueryState] = useState<QueryBuilderState>({
    selectColumns: [],
    whereConditions: [],
    joinTables: [],
  });

  // Build the main table name based on report parameters
  const buildTableName = useCallback(
    (reportParams: {
      tahun: string;
      tipeLaporan: string;
      tematikKategori?: string;
    }) => {
      const thang = reportParams.tahun;

      // Tematik-specific table mapping based on selected category
      const tematikKategori = reportParams.tematikKategori;
      if (tematikKategori) {
        const categoryConfig = getCategoryQueryConfig(tematikKategori);
        if (categoryConfig) {
          const suffix = categoryConfig.baseTableSuffix || "";
          return `monev${thang}.${categoryConfig.tableName}_${thang}${suffix}`;
        }

        // Fallback to legacy logic if category not found in registry
        if (tematikKategori === "bantuan_pemerintah") {
          return `monev${thang}.pagu_real_detail_harian_${thang}`;
        }
        if (tematikKategori === "program_strategis") {
          return `monev${thang}.smry_program_strategis_${thang}`;
        }
        // Default for all other tematik categories
        return `monev${thang}.a_pagu_real_bkpk_dja_${thang}`;
      }

      const baseTable =
        TABLE_MAPPING[reportParams.tipeLaporan as keyof typeof TABLE_MAPPING];
      if (!baseTable) {
        throw new Error(`Unknown report type: ${reportParams.tipeLaporan}`);
      }

      const cfg = getReportTypeConfig(reportParams.tipeLaporan);
      return cfg.tableNameBuilder(thang, baseTable);
    },
    []
  );

  // Build SELECT clause
  const buildSelectClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        pembulatan: string;
        tahun: string;
        tipeLaporan: string;
        jenisAkumulasi?: string;
      }
    ) => {
      const selectColumns: string[] = [];
      const joinTables: string[] = [];
      const joinedTables = new Set<string>(); // Track which tables we've already joined
      const cfg = getReportTypeConfig(reportParams.tipeLaporan);

      // Deduplicate activeFilters to prevent duplicate SELECT columns
      const uniqueActiveFilters = Array.from(new Set(activeFilters));

      // Process regular filters (excluding cutOff which is handled specially)
      uniqueActiveFilters.forEach((filterKey) => {
        // Skip cutOff - it's not a SELECT column, only affects realization calculation
        if (filterKey === "cutOff") return;

        const config = FILTER_CONFIG[filterKey];
        if (!config) return;

        // Special-case: kemiskinanEkstrim and belanjaPemilu are boolean flags without uraian.
        // When active, always select the raw column even if no filter value object exists
        if (
          filterKey === "kemiskinanEkstrim" ||
          filterKey === "belanjaPemilu" ||
          filterKey === "ibuKotaNusantara" ||
          filterKey === "ketahananPangan"
        ) {
          // Push as a simple code column (no reference/join and no tampilan switching)
          // Keep alias stable to align with export/SQL preview expectations
          selectColumns.push(`main.${config.columnName} AS ${filterKey}`);
          // Continue to next filter (skip the generic SELECT logic below)
          return;
        }

        const filterValue = filterValues[filterKey];
        const jenisTampilan = filterValue?.jenisTampilan || "kode";
        const mengandungKata = filterValue?.mengandungKata;

        const alias = `${filterKey}_ref`;
        const needsJoinForSelect =
          config.referenceTable &&
          config.referenceDatabase &&
          (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian");
        const needsJoinForWhere =
          config.referenceTable &&
          config.referenceDatabase &&
          mengandungKata &&
          mengandungKata.trim();

        // Add JOIN if needed for SELECT or WHERE and not already added
        if (
          (needsJoinForSelect || needsJoinForWhere) &&
          !joinedTables.has(alias)
        ) {
          // Determine the correct reference table and join condition based on filter type
          let referenceTable = config.referenceTable;
          let joinKey = config.joinKey;
          let joinCondition = `main.${config.columnName} = ${alias}.${joinKey}`;

          // PN hierarchy: include parent keys in JOINs
          if (filterKey === "programPrioritas") {
            // A.KDPN=PP.KDPN AND A.KDPP=PP.KDPP
            joinCondition = `main.kdpn = ${alias}.kdpn AND main.${config.columnName} = ${alias}.${joinKey}`;
          } else if (filterKey === "kegiatanPrioritas") {
            // A.KDPN=KP.KDPN AND A.KDPP=KP.KDPP AND A.KDKP=KP.KDKP
            joinCondition = `main.kdpn = ${alias}.kdpn AND main.kdpp = ${alias}.kdpp AND main.${config.columnName} = ${alias}.${joinKey}`;
          } else if (filterKey === "proyekPrioritas") {
            // A.KDPN=PR.KDPN AND A.KDPP=PR.KDPP AND A.KDKP=PR.KDKP AND A.KDPROY=PR.KDPROY
            joinCondition = `main.kdpn = ${alias}.kdpn AND main.kdpp = ${alias}.kdpp AND main.kdkp = ${alias}.kdkp AND main.${config.columnName} = ${alias}.${joinKey}`;
          }

          // Special handling for akun filter with different types
          if (filterKey === "akun" && filterValue?.akunType) {
            if (filterValue.akunType === "kodeBkpk") {
              referenceTable = "t_bkpk";
              joinKey = "kdbkpk";
              joinCondition = `LEFT(main.${config.columnName}, 4) = ${alias}.${joinKey}`;
            } else if (filterValue.akunType === "jenisBelanja") {
              referenceTable = "t_gbkpk";
              joinKey = "kdgbkpk";
              joinCondition = `LEFT(main.${config.columnName}, 2) = ${alias}.${joinKey}`;
            }
          }
          // Special handling for dedicated kodeBkpk and jenisBelanja filters
          else if (filterKey === "kodeBkpk") {
            joinCondition = `LEFT(main.${config.columnName}, 4) = ${alias}.${config.joinKey}`;
          } else if (filterKey === "jenisBelanja") {
            joinCondition = `LEFT(main.${config.columnName}, 2) = ${alias}.${config.joinKey}`;
          }

          // Build full join table name with year suffix
          const year = reportParams.tahun || new Date().getFullYear();
          const joinTable = `${config.referenceDatabase}.${referenceTable}_${year}`;

          joinTables.push(
            `LEFT JOIN ${joinTable} AS ${alias} ON ${joinCondition}`
          );
          joinedTables.add(alias);
        }

        // Add SELECT columns based on jenisTampilan (skip if jangan_tampilkan)
        if (jenisTampilan !== "jangan_tampilkan") {
          if (config.referenceTable && config.referenceDatabase) {
            // Determine the correct name column based on filter type
            let nameColumn = config.nameColumn;
            if (filterKey === "akun" && filterValue?.akunType) {
              if (filterValue.akunType === "kodeBkpk") {
                nameColumn = "nmbkpk";
              } else if (filterValue.akunType === "jenisBelanja") {
                nameColumn = "nmgbkpk";
              }
            }

            // Special handling for register filter - add additional columns when reference table is used
            if (
              filterKey === "register" &&
              (needsJoinForSelect || needsJoinForWhere)
            ) {
              // Add the additional columns from register reference table
              selectColumns.push(`${alias}.register AS register_kode`);
              selectColumns.push(`${alias}.nonpln AS nonpln`);
              selectColumns.push(`${alias}.kdvalas AS kdvalas`);
              selectColumns.push(`${alias}.tglnpln AS tglnpln`);
              selectColumns.push(`${alias}.kddonor AS kddonor`);
              selectColumns.push(`${alias}.kdkreditor AS kdkreditor`);
              selectColumns.push(`${alias}.nmdonor AS nmdonor`);
              selectColumns.push(`${alias}.jmlpnrk AS jmlpnrk`);
              selectColumns.push(`${alias}.closingdate AS closingdate`);
            } else {
              switch (jenisTampilan) {
                case "kode":
                  // Special handling for akun filter with different types
                  if (
                    filterKey === "akun" &&
                    filterValue?.akunType === "kodeBkpk"
                  ) {
                    selectColumns.push(
                      `LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`
                    );
                  } else if (
                    filterKey === "akun" &&
                    filterValue?.akunType === "jenisBelanja"
                  ) {
                    selectColumns.push(
                      `LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`
                    );
                  }
                  // Special handling for dedicated kodeBkpk and jenisBelanja filters
                  else if (filterKey === "kodeBkpk") {
                    selectColumns.push(
                      `LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`
                    );
                  } else if (filterKey === "jenisBelanja") {
                    selectColumns.push(
                      `LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`
                    );
                  } else {
                    // Only use main table column, no JOIN needed for SELECT
                    selectColumns.push(
                      `main.${config.columnName} AS ${filterKey}_kode`
                    );
                  }
                  break;
                case "uraian":
                  // Use description from joined table
                  selectColumns.push(
                    `${alias}.${nameColumn} AS ${filterKey}_uraian`
                  );
                  break;
                case "kode_uraian":
                  // Use both code and description
                  if (
                    filterKey === "akun" &&
                    filterValue?.akunType === "kodeBkpk"
                  ) {
                    selectColumns.push(
                      `LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`
                    );
                  } else if (
                    filterKey === "akun" &&
                    filterValue?.akunType === "jenisBelanja"
                  ) {
                    selectColumns.push(
                      `LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`
                    );
                  } else if (filterKey === "kodeBkpk") {
                    selectColumns.push(
                      `LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`
                    );
                  } else if (filterKey === "jenisBelanja") {
                    selectColumns.push(
                      `LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`
                    );
                  } else {
                    selectColumns.push(
                      `main.${config.columnName} AS ${filterKey}_kode`
                    );
                  }
                  selectColumns.push(
                    `${alias}.${nameColumn} AS ${filterKey}_uraian`
                  );
                  break;
              }
            }
          } else {
            // No reference table, just use main column
            selectColumns.push(`main.${config.columnName} AS ${filterKey}`);
          }
        }
      });

      // Get pembulatan divisor from reportParams
      const pembulatan = reportParams.pembulatan || "satuan";
      const divisor = getPembulatanDivisor(pembulatan);

      // Add category-specific mandatory columns for tematik queries
      const tematikKategori = (reportParams as { tematikKategori?: string })
        .tematikKategori;
      if (tematikKategori) {
        const mandatoryColumns = getCategoryMandatoryColumns(tematikKategori);
        const categoryMandatoryColumns = mandatoryColumns
          .sort((a, b) => a.order - b.order)
          .map((col) => {
            // Replace {divisor} placeholder in SQL expressions
            const sqlExpression = col.sqlExpression.replace(
              /\{divisor\}/g,
              divisor.toString()
            );
            return `${sqlExpression} AS ${col.key}`;
          });

        // Insert mandatory columns after filter columns but before standard monetary columns
        selectColumns.push(...categoryMandatoryColumns);
      }

      // Get cut-off month from filterValues (default to 12 if not specified)
      const cutOffMonth = filterValues.cutOff?.selection || "12";
      const cutOffNum = parseInt(cutOffMonth);

      // Build realization sum based on cut-off month
      const realizationColumns = [];
      for (let month = 1; month <= cutOffNum; month++) {
        realizationColumns.push(`real${month}`);
      }
      const realizationSum = realizationColumns.join(" + ");

      // Add mandatory columns based on report type
      if (reportParams.tipeLaporan === "pagu_apbn") {
        // For Pagu APBN report (tipe laporan 1), add PAGU_APBN before PAGU_DIPA
        selectColumns.push(
          `ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / ${divisor}, 0) AS PAGU_APBN`
        );
        selectColumns.push(
          `ROUND(SUM(main.pagu_dipa) / ${divisor}, 0) AS PAGU_DIPA`
        );
      } else if (!REPORTS_EXCLUDE_PAGU_DIPA.has(reportParams.tipeLaporan)) {
        // For other report types (except excluded), keep the original PAGU_DIPA column
        // Special handling for volume_output_kegiatan columns
        if (REPORTS_VOLUME_OUTPUT.has(reportParams.tipeLaporan)) {
          // sat and SUM(vol) before PAGU
          // Insert before PAGU_DIPA so they appear right before it in the output
          selectColumns.push(`main.sat AS sat`);
          selectColumns.push(`SUM(main.vol) AS sum_vol`);
        }

        selectColumns.push(
          `ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU_DIPA`
        );
      }

      // Handle realization columns based on report type
      if (reportParams.tipeLaporan === "pagu_realisasi_bulanan") {
        // For Tematik and tipe laporan 3 (Pagu Realisasi Bulanan): always include PAGU and monthly REALISASI columns
        const jenisAkumulasi = reportParams.jenisAkumulasi || "non_akumulatif";

        // Generate monthly columns up to cutOff month
        for (let month = 1; month <= cutOffNum; month++) {
          const monthName = MONTH_NAMES[month - 1];

          if (jenisAkumulasi === "akumulatif") {
            // Akumulatif: each month sums from January until that month
            const cumulativeRealColumns = [];
            for (let i = 1; i <= month; i++) {
              cumulativeRealColumns.push(`real${i}`);
            }
            const cumulativeSum = cumulativeRealColumns.join(" + ");
            selectColumns.push(
              `ROUND(SUM(${cumulativeSum}) / ${divisor}, 0) AS ${monthName}`
            );
          } else {
            // Non-akumulatif (default): each month shows only that month's realization
            selectColumns.push(
              `ROUND(SUM(real${month}) / ${divisor}, 0) AS ${monthName}`
            );
          }
        }

        // Add mandatory BLOKIR column for tipe laporan 3
        selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
      } else if (reportParams.tipeLaporan === "pergerakan_pagu_bulanan") {
        // For tipe laporan 4 (Pergerakan Pagu Bulanan), show monthly pagu columns up to cutOff
        for (let month = 1; month <= cutOffNum; month++) {
          const monthName = MONTH_NAMES[month - 1];
          selectColumns.push(
            `ROUND(SUM(pagu${month}) / ${divisor}, 0) AS ${monthName}`
          );
        }
        // No REALISASI column for pergerakan_pagu_bulanan as it only fetches pagu data
      } else if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan") {
        // For tipe laporan 5 (Pergerakan Blokir Bulanan), show monthly blokir columns up to cutOff
        for (let month = 1; month <= cutOffNum; month++) {
          const monthName = MONTH_NAMES[month - 1];
          selectColumns.push(
            `ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`
          );
        }
        // No REALISASI column for pergerakan_blokir_bulanan as it only fetches blokir data
      } else if (
        reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis"
      ) {
        // For tipe laporan 6 (Pergerakan Blokir Bulanan Per Jenis), add mandatory kdblokir and nmblokir columns
        // Add mandatory kdblokir and nmblokir columns first
        selectColumns.push(`main.kdblokir AS kdblokir_kode`);
        selectColumns.push(`main.nmblokir AS nmblokir_uraian`);

        // Generate monthly blokir columns up to cutOff month
        for (let month = 1; month <= cutOffNum; month++) {
          const monthName = MONTH_NAMES[month - 1];
          selectColumns.push(
            `ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`
          );
        }
        // No REALISASI column for pergerakan_blokir_bulanan_per_jenis as it only fetches blokir data
      } else {
        // For other report types
        // For volume_output_kegiatan, append monthly columns and OS/KET
        if (REPORTS_VOLUME_OUTPUT.has(reportParams.tipeLaporan)) {
          const monthly: Array<[string, string]> = [];
          for (let m = 1; m <= cutOffNum; m++) {
            const mnames = [
              "jan",
              "feb",
              "mar",
              "apr",
              "mei",
              "jun",
              "jul",
              "ags",
              "sep",
              "okt",
              "nov",
              "des",
            ];
            const aliasR = `r${mnames[m - 1]}`;
            const aliasP = `p${mnames[m - 1]}`;
            const aliasRP = `rp${mnames[m - 1]}`;
            monthly.push([`real${m}`, aliasR]);
            monthly.push([`persen${m}`, aliasP]);
            monthly.push([`realfisik${m}`, aliasRP]);
          }
          monthly.forEach(([col, alias]) => {
            const isRMonthly =
              /^r(jan|feb|mar|apr|mei|jun|jul|ags|sep|okt|nov|des)$/i.test(
                alias
              );
            if (isRMonthly) {
              selectColumns.push(
                `ROUND(SUM(main.${col}) / ${divisor}, 0) AS ${alias}`
              );
            } else {
              selectColumns.push(`SUM(main.${col}) AS ${alias}`);
            }
          });
          selectColumns.push(`main.os AS os`);
          selectColumns.push(`main.ket AS ket`);
        } else {
          // Default: single REALISASI + optional BLOKIR after REALISASI
          selectColumns.push(
            `ROUND(SUM(${realizationSum}) / ${divisor}, 0) AS REALISASI`
          );
          if (cfg.addBlokirAfterReal) {
            selectColumns.push(
              `ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`
            );
          }
        }
      }

      return { selectColumns, joinTables };
    },
    []
  );

  // Build WHERE clause
  const buildWhereClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams?: {
        tahun?: string;
        tipeLaporan?: string;
        tematikKategori?: string;
        pembulatan?: string;
        jenisAkumulasi?: string;
      }
    ) => {
      const whereConditions: string[] = [];

      // Add category-specific WHERE conditions for tematik queries
      const tematikKategori = reportParams?.tematikKategori;
      if (tematikKategori) {
        const categoryConfig = getCategoryQueryConfig(tematikKategori);
        if (categoryConfig?.whereConditions) {
          whereConditions.push(...categoryConfig.whereConditions);
        }
      }

      // Global switches: enforce IS NOT NULL conditions when switches are active
      // Applies to all scopes (e.g., belanja and tematik) that use the shared filter switches
      if (activeFilters.includes("kemiskinanEkstrim")) {
        whereConditions.push("main.kemiskinan_ekstrim IS NOT NULL");
      }
      if (activeFilters.includes("belanjaPemilu")) {
        whereConditions.push("main.pemilu IS NOT NULL");
      }
      if (activeFilters.includes("ibuKotaNusantara")) {
        whereConditions.push("main.ikn IS NOT NULL");
      }
      if (activeFilters.includes("ketahananPangan")) {
        whereConditions.push("main.pangan IS NOT NULL");
      }

      // Note: Category-specific WHERE conditions (like kdpn <> '00' for prioritas_nasional)
      // are now handled above via categoryConfig.whereConditions to avoid duplication

      // Use the same deduplicated filters for WHERE conditions
      const uniqueActiveFilters = Array.from(new Set(activeFilters));

      uniqueActiveFilters.forEach((filterKey) => {
        // Skip cutOff - it doesn't create WHERE conditions, only affects SELECT
        if (filterKey === "cutOff") return;

        const config = FILTER_CONFIG[filterKey];
        const filterValue = filterValues[filterKey];

        if (!config || !filterValue) return;

        const { selection, kondisiCode, mengandungKata } = filterValue;

        // Handle main selection
        if (selection && selection !== "all") {
          // Special handling for akun filter with different types
          if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
            whereConditions.push(
              `LEFT(main.${config.columnName}, 4) = '${selection}'`
            );
          } else if (
            filterKey === "akun" &&
            filterValue?.akunType === "jenisBelanja"
          ) {
            whereConditions.push(
              `LEFT(main.${config.columnName}, 2) = '${selection}'`
            );
          }
          // Special handling for dedicated kodeBkpk and jenisBelanja filters
          else if (filterKey === "kodeBkpk") {
            whereConditions.push(
              `LEFT(main.${config.columnName}, 4) = '${selection}'`
            );
          } else if (filterKey === "jenisBelanja") {
            whereConditions.push(
              `LEFT(main.${config.columnName}, 2) = '${selection}'`
            );
          } else {
            whereConditions.push(`main.${config.columnName} = '${selection}'`);
          }
        }

        // Handle kondisi (multiple values)
        if (kondisiCode && kondisiCode.trim()) {
          const values = kondisiCode
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v);
          if (values.length > 0) {
            const valuesList = values.map((v) => `'${v}'`).join(", ");
            // Special handling for akun filter with different types
            if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
              whereConditions.push(
                `LEFT(main.${config.columnName}, 4) IN (${valuesList})`
              );
            } else if (
              filterKey === "akun" &&
              filterValue?.akunType === "jenisBelanja"
            ) {
              whereConditions.push(
                `LEFT(main.${config.columnName}, 2) IN (${valuesList})`
              );
            }
            // Special handling for dedicated kodeBkpk and jenisBelanja filters
            else if (filterKey === "kodeBkpk") {
              whereConditions.push(
                `LEFT(main.${config.columnName}, 4) IN (${valuesList})`
              );
            } else if (filterKey === "jenisBelanja") {
              whereConditions.push(
                `LEFT(main.${config.columnName}, 2) IN (${valuesList})`
              );
            } else {
              whereConditions.push(
                `main.${config.columnName} IN (${valuesList})`
              );
            }
          }
        }

        // Handle mengandung kata (LIKE search)
        if (mengandungKata && mengandungKata.trim() && config.referenceTable) {
          const alias = `${filterKey}_ref`;

          // Special handling for register filter - search in register column
          if (filterKey === "register") {
            whereConditions.push(
              `${alias}.register LIKE '%${mengandungKata.trim()}%'`
            );
          } else {
            // Determine proper name column for keyword search
            let nameCol = config.nameColumn;
            if (filterKey === "akun" && filterValue?.akunType) {
              if (filterValue.akunType === "kodeBkpk") {
                nameCol = "nmbkpk"; // 4-digit BKPK
              } else if (filterValue.akunType === "jenisBelanja") {
                nameCol = "nmgbkpk"; // 2-digit GBKPK
              }
            }
            whereConditions.push(
              `${alias}.${nameCol} LIKE '%${mengandungKata.trim()}%'`
            );
          }
        }
      });

      return whereConditions;
    },
    []
  );

  // Build GROUP BY clause
  const buildGroupByClause = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: { tipeLaporan: string; tematikKategori?: string }
    ) => {
      const groupByColumns: string[] = [];

      // Helper to avoid duplicate GROUP BY columns
      const addGroupBy = (col: string) => {
        if (!groupByColumns.includes(col)) {
          groupByColumns.push(col);
        }
      };

      // For tipe laporan 6, add mandatory GROUP BY kdblokir and nmblokir
      if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis") {
        addGroupBy("main.kdblokir");
        addGroupBy("main.nmblokir");
      }

      // Use deduplicated filters for GROUP BY consistency
      const uniqueActiveFilters = Array.from(new Set(activeFilters));

      // Ensure GROUP BY for switch filters regardless of tampilan/selection
      if (uniqueActiveFilters.includes("kemiskinanEkstrim")) {
        addGroupBy("main.kemiskinan_ekstrim");
      }
      if (uniqueActiveFilters.includes("belanjaPemilu")) {
        addGroupBy("main.pemilu");
      }
      if (uniqueActiveFilters.includes("ibuKotaNusantara")) {
        addGroupBy("main.ikn");
      }
      if (uniqueActiveFilters.includes("ketahananPangan")) {
        addGroupBy("main.pangan");
      }

      uniqueActiveFilters.forEach((filterKey) => {
        // Skip cutOff - it's not a SELECT column, so not in GROUP BY
        if (filterKey === "cutOff") return;

        const config = FILTER_CONFIG[filterKey];
        const filterValue = filterValues[filterKey];

        if (!config || !filterValue) return;

        const jenisTampilan = filterValue.jenisTampilan || "kode";

        if (jenisTampilan === "jangan_tampilkan") return;

        // Add main column to GROUP BY (uniquely)
        // Special handling for akun filter with different types
        if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
          addGroupBy(`LEFT(main.${config.columnName}, 4)`);
        } else if (
          filterKey === "akun" &&
          filterValue?.akunType === "jenisBelanja"
        ) {
          addGroupBy(`LEFT(main.${config.columnName}, 2)`);
        }
        // Special handling for dedicated kodeBkpk and jenisBelanja filters
        else if (filterKey === "kodeBkpk") {
          addGroupBy(`LEFT(main.${config.columnName}, 4)`);
        } else if (filterKey === "jenisBelanja") {
          addGroupBy(`LEFT(main.${config.columnName}, 2)`);
        } else {
          addGroupBy(`main.${config.columnName}`);
        }

        // Add mandatory GROUP BY for volume_output_kegiatan
        if (reportParams.tipeLaporan === "volume_output_kegiatan") {
          addGroupBy("main.sat");
          addGroupBy("main.os");
          addGroupBy("main.ket");
        }

        // Add reference columns if needed
        if (config.referenceTable) {
          const alias = `${filterKey}_ref`;

          // Special handling for register filter - add all additional columns to GROUP BY
          if (filterKey === "register") {
            // Check if we need to join (either for SELECT or WHERE with mengandung kata)
            const mengandungKata = filterValue?.mengandungKata;
            const needsJoinForWhere = mengandungKata && mengandungKata.trim();
            const needsJoinForSelect =
              jenisTampilan === "uraian" || jenisTampilan === "kode_uraian";

            if (needsJoinForSelect || needsJoinForWhere) {
              addGroupBy(`${alias}.register`);
              addGroupBy(`${alias}.nonpln`);
              addGroupBy(`${alias}.kdvalas`);
              addGroupBy(`${alias}.tglnpln`);
              addGroupBy(`${alias}.kddonor`);
              addGroupBy(`${alias}.kdkreditor`);
              addGroupBy(`${alias}.nmdonor`);
              addGroupBy(`${alias}.jmlpnrk`);
              addGroupBy(`${alias}.closingdate`);
            }
          }
          // Note: We don't add uraian columns to GROUP BY to avoid duplicate rows
          // when multiple uraian values exist for the same kode (e.g., unit eselon 1)
          // The LEFT JOIN will still provide the uraian values in SELECT, but we only group by kode
        }
      });

      // Append category-specific GROUP BY columns (from tematik registry)
      const tematikKategori = reportParams?.tematikKategori;
      if (tematikKategori) {
        const categoryConfig = getCategoryQueryConfig(tematikKategori);
        if (categoryConfig?.groupByColumns?.length) {
          for (const col of categoryConfig.groupByColumns) {
            if (!groupByColumns.includes(col)) {
              groupByColumns.push(col);
            }
          }
        }
      }

      return groupByColumns;
    },
    []
  );

  // Main query builder function
  const buildQuery = useCallback(
    (
      activeFilters: string[],
      filterValues: Record<string, FilterValue>,
      reportParams: {
        tahun: string;
        tipeLaporan: string;
        pembulatan: string;
        jenisAkumulasi?: string;
      }
    ) => {
      try {
        const mainTable = buildTableName(reportParams);
        const { selectColumns, joinTables } = buildSelectClause(
          activeFilters,
          filterValues,
          reportParams
        );
        const whereConditions = buildWhereClause(
          activeFilters,
          filterValues,
          reportParams
        );
        const groupByColumns = buildGroupByClause(
          activeFilters,
          filterValues,
          reportParams
        );

        // Build the complete query
        let query = `SELECT\n  ${selectColumns.join(
          ",\n  "
        )}\nFROM ${mainTable} AS main`;

        // Add JOINs
        if (joinTables.length > 0) {
          query += `\n${joinTables.join("\n")}`;
        }

        // Add WHERE clause
        if (whereConditions.length > 0) {
          query += `\nWHERE\n  ${whereConditions.join("\n  AND ")}`;
        }

        // Add GROUP BY clause
        if (groupByColumns.length > 0) {
          query += `\nGROUP BY\n  ${groupByColumns.join(",\n  ")}`;
        }

        // ORDER BY and LIMIT removed - pagination handled on backend (50 per page)

        return query;
      } catch (error) {
        console.error("Error building query:", error);
        return "-- Error building query: " + (error as Error).message;
      }
    },
    [buildTableName, buildSelectClause, buildWhereClause, buildGroupByClause]
  );

  // Helper function to get pembulatan divisor
  const getPembulatanDivisor = (pembulatan: string): number => {
    switch (pembulatan) {
      case "ribuan":
        return 1000;
      case "jutaan":
        return 1000000;
      case "miliaran":
        return 1000000000;
      case "triliunan":
        return 1000000000000;
      default:
        return 1; // satuan
    }
  };

  // Encrypt query for backend transmission
  const encryptQuery = useCallback((query: string): string => {
    // Simple base64 encoding for now - in production, use proper encryption
    return btoa(encodeURIComponent(query));
  }, []);

  // Decrypt query (for debugging purposes)
  const decryptQuery = useCallback((encryptedQuery: string): string => {
    try {
      return decodeURIComponent(atob(encryptedQuery));
    } catch {
      return "-- Error decrypting query";
    }
  }, []);

  return {
    buildQuery,
    encryptQuery,
    decryptQuery,
    queryState,
    setQueryState,
  };
}
