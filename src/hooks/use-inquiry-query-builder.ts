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
  pagu_dan_blokir: "m_detail_harian", // RKAKL Detail specific table
  // Kontrak report types → base table name (use custom tableNameBuilder for _baru suffix)
  semua_kontrak: "pa_kontrak",
  kontrak_valas: "pa_kontrak",
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
  pagu_dan_blokir: {
    includePaguDipa: true,
    addBlokirAfterReal: false, // No realisasi needed for RKAKL Detail
    tableNameBuilder: (thang, baseTable) =>
      `monev${thang}.${baseTable}_${thang}`,
  },
  // Kontrak report types: custom table builder and no PAGU_DIPA/BLOKIR defaults
  semua_kontrak: {
    includePaguDipa: false,
    addBlokirAfterReal: false,
    tableNameBuilder: (thang) => `monev${thang}.pa_kontrak_${thang}_baru`,
  },
  kontrak_valas: {
    includePaguDipa: false,
    addBlokirAfterReal: false,
    tableNameBuilder: (thang) => `monev${thang}.pa_kontrak_${thang}_baru`,
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

      // Helper to build SELECT columns and JOINs for the `register` filter.
      // This preserves the exact ordering and semantics of the previous inline logic.
      const buildRegisterSelectAndJoins = (
        params: {
          jenisTampilan: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
          includeRefColumns: boolean; // when true, also include ctarik join for uraian and ref table extra columns
          refAlias?: string; // alias to the register reference table (when includeRefColumns is true)
        }
      ) => {
        const { jenisTampilan, includeRefColumns, refAlias } = params;

        // 1) Always include normalized register code first
        selectColumns.push(`main.register_normalized AS register_kode`);

        // 2) LEFT JOIN aggregated kdctarik from m_detail_harian_{year}
        const year = reportParams.tahun || new Date().getFullYear();
        const detailAlias = "detail_ref";
        const detailJoinTable = `monev${year}.m_detail_harian_${year}`;

        if (!joinedTables.has(detailAlias)) {
          joinTables.push(
            `LEFT JOIN (
                    SELECT 
                      COALESCE(NULLIF(register, ''), '-') AS register_normalized,
                      MAX(kdctarik) AS kdctarik
                    FROM ${detailJoinTable}
                    GROUP BY COALESCE(NULLIF(register, ''), '-')
                  ) AS ${detailAlias} ON main.register_normalized = ${detailAlias}.register_normalized`
          );
          joinedTables.add(detailAlias);
        }

        // 3) Add kdctarik value when not uraian-only
        if (jenisTampilan !== "uraian") {
          selectColumns.push(`COALESCE(MAX(${detailAlias}.kdctarik), 0) AS kdctarik`);
        }

        // 4) If ref columns are included, add ctarik join and extra ref columns
        if (includeRefColumns && refAlias) {
          // Add LEFT JOIN to t_ctarik for uraian when needed
          if (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") {
            const ctarikAlias = "ctarik_ref";
            const ctarikJoinTable = `dbref.t_ctarik_${year}`;

            if (!joinedTables.has(ctarikAlias)) {
              joinTables.push(
                `LEFT JOIN ${ctarikJoinTable} AS ${ctarikAlias} ON COALESCE(${detailAlias}.kdctarik, 0) = ${ctarikAlias}.kdctarik`
              );
              joinedTables.add(ctarikAlias);
            }

            // Add uraian column from ctarik table
            if (jenisTampilan === "uraian") {
              selectColumns.push(`${ctarikAlias}.nmctarik AS kdctarik_uraian`);
            } else if (jenisTampilan === "kode_uraian") {
              selectColumns.push(`${ctarikAlias}.nmctarik AS kdctarik_uraian`);
            }
          }

          // Extra columns from register reference table
          selectColumns.push(`${refAlias}.nonpln AS nonpln`);
          selectColumns.push(`${refAlias}.kdvalas AS kdvalas`);
          selectColumns.push(`${refAlias}.tglnpln AS tglnpln`);
          selectColumns.push(`${refAlias}.kddonor AS kddonor`);
          selectColumns.push(`${refAlias}.kdkreditor AS kdkreditor`);
          selectColumns.push(`${refAlias}.nmdonor AS nmdonor`);
          selectColumns.push(`${refAlias}.jmlpnrk AS jmlpnrk`);
          selectColumns.push(`${refAlias}.closingdate AS closingdate`);
        }
      };

      // Deduplicate activeFilters to prevent duplicate SELECT columns
      const uniqueActiveFilters = Array.from(new Set(activeFilters));

      // Process regular filters (excluding cutOff which is handled specially)
      uniqueActiveFilters.forEach((filterKey) => {
        // Skip cutOff - it's not a SELECT column, only affects realization calculation
        if (filterKey === "cutOff") return;

        const config = FILTER_CONFIG[filterKey];
        if (!config) return;

        // Special-case: jenisKontrak is computed from main.can with no reference table
        // Always include the computed column in SELECT when the filter is active,
        // regardless of jenisTampilan settings
        if (filterKey === "jenisKontrak") {
          selectColumns.push(
            "CASE WHEN SUBSTR(main.can,16,1) = '0' THEN 'SYC' WHEN SUBSTR(main.can,16,1) <> '0' THEN 'MYC' END AS tipe_kontrak"
          );
          // Continue to next filter (skip generic handling below)
          return;
        }

        // Special-case: kemiskinanEkstrim and belanjaPemilu are boolean flags without uraian.
        // When active, always select the raw column even if no filter value object exists
        if (
          filterKey === "kemiskinanEkstrim" ||
          filterKey === "belanjaPemilu" ||
          filterKey === "ibuKotaNusantara" ||
          filterKey === "ketahananPangan" ||
          filterKey === "swasembadaPangan"
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

        // Special-case handling for Program Strategis (no LEFT JOIN; uraian exists in main table)
        if (filterKey === "jenisProgramStrategis") {
          // Map tampilan to main.kdprogis (kode) and main.nmprogis (uraian)
          if (jenisTampilan !== "jangan_tampilkan") {
            switch (jenisTampilan) {
              case "kode":
                selectColumns.push(
                  `main.${config.columnName} AS ${filterKey}_kode`
                );
                break;
              case "uraian":
                selectColumns.push(`main.nmprogis AS ${filterKey}_uraian`);
                break;
              case "kode_uraian":
                selectColumns.push(
                  `main.${config.columnName} AS ${filterKey}_kode`
                );
                selectColumns.push(`main.nmprogis AS ${filterKey}_uraian`);
                break;
            }
          }
          // Skip generic handling for this filter
          return;
        }

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
          // Add hierarchical JOINs for KL hierarchy filters
          else if (filterKey === "program") {
            // main.kddept=ref.kddept AND main.kdunit=ref.kdunit AND main.kdprogram=ref.kdprogram
            joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.${config.columnName} = ${alias}.${joinKey}`;
          } else if (filterKey === "kegiatan") {
            // main.kddept=ref.kddept AND main.kdunit=ref.kdunit AND main.kdprogram=ref.kdprogram AND main.kdgiat=ref.kdgiat
            joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdprogram = ${alias}.kdprogram AND main.${config.columnName} = ${alias}.${joinKey}`;
          } else if (filterKey === "outputKro") {
            // main.kddept=ref.kddept AND main.kdunit=ref.kdunit AND main.kdprogram=ref.kdprogram AND main.kdgiat=ref.kdgiat AND main.kdoutput=ref.kdoutput
            joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.${config.columnName} = ${alias}.${joinKey}`;
          } else if (filterKey === "subOutputRo") {
            // main.kddept=ref.kddept AND main.kdunit=ref.kdunit AND main.kdprogram=ref.kdprogram AND main.kdgiat=ref.kdgiat AND main.kdoutput=ref.kdoutput AND main.kdsoutput=ref.kdsoutput
            joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.kdoutput = ${alias}.kdoutput AND main.${config.columnName} = ${alias}.${joinKey}`;
          }
          // Add hierarchical JOINs for Komponen and Sub Komponen per RKAKL detail hierarchy
          else if (filterKey === "komponen") {
            // main.kddept=ref.kddept AND main.kdunit=ref.kdunit AND main.kdsatker=ref.kdsatker AND main.kdprogram=ref.kdprogram AND main.kdgiat=ref.kdgiat AND main.kdoutput=ref.kdoutput AND main.kdsoutput=ref.kdsoutput AND main.kdkmpnen=ref.kdkmpnen
            joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdsatker = ${alias}.kdsatker AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.kdoutput = ${alias}.kdoutput AND main.kdsoutput = ${alias}.kdsoutput AND main.${config.columnName} = ${alias}.${joinKey}`;
          } else if (filterKey === "subKomponen") {
            // main.kddept=ref.kddept AND main.kdunit=ref.kdunit AND main.kdsatker=ref.kdsatker AND main.kdprogram=ref.kdprogram AND main.kdgiat=ref.kdgiat AND main.kdoutput=ref.kdoutput AND main.kdsoutput=ref.kdsoutput AND main.kdkmpnen=ref.kdkmpnen AND main.kdskmpnen=ref.kdskmpnen
            joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdsatker = ${alias}.kdsatker AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.kdoutput = ${alias}.kdoutput AND main.kdsoutput = ${alias}.kdsoutput AND main.kdkmpnen = ${alias}.kdkmpnen AND main.${config.columnName} = ${alias}.${joinKey}`;
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
          // Special handling for 'register' filter to include kdctarik and extra columns
          if (filterKey === "register") {
            buildRegisterSelectAndJoins({
              jenisTampilan,
              includeRefColumns: Boolean(needsJoinForSelect || needsJoinForWhere),
              refAlias: `${filterKey}_ref`,
            });
            return; // Skip default handling for this iteration
          }

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
            switch (jenisTampilan) {
              case "kode":
                // Special handling for akun filter with different types
                if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
                  selectColumns.push(`LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`);
                } else if (filterKey === "akun" && filterValue?.akunType === "jenisBelanja") {
                  selectColumns.push(`LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`);
                }
                // Special handling for dedicated kodeBkpk and jenisBelanja filters
                else if (filterKey === "kodeBkpk") {
                  selectColumns.push(`LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`);
                } else if (filterKey === "jenisBelanja") {
                  selectColumns.push(`LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`);
                } else if (filterKey !== "register") {
                  // Only use main table column, no JOIN needed for SELECT (exclude register as it's handled separately)
                  selectColumns.push(`main.${config.columnName} AS ${filterKey}_kode`);
                }
                break;
              case "uraian":
                // Use description from joined table
                selectColumns.push(`${alias}.${nameColumn} AS ${filterKey}_uraian`);
                break;
              case "kode_uraian":
                // Use both code and description
                if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
                  selectColumns.push(`LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`);
                } else if (filterKey === "akun" && filterValue?.akunType === "jenisBelanja") {
                  selectColumns.push(`LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`);
                } else if (filterKey === "kodeBkpk") {
                  selectColumns.push(`LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`);
                } else if (filterKey === "jenisBelanja") {
                  selectColumns.push(`LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`);
                } else {
                  selectColumns.push(`main.${config.columnName} AS ${filterKey}_kode`);
                }
                selectColumns.push(`${alias}.${nameColumn} AS ${filterKey}_uraian`);
                break;
            }
          } else {
            // No reference table, support optional nameColumn expression for uraian
            const jenisTampilan = (filterValue?.jenisTampilan) || "kode";
            switch (jenisTampilan) {
              case "kode":
                selectColumns.push(`main.${config.columnName} AS ${filterKey}`);
                break;
              case "uraian":
                if (config.nameColumn) {
                  selectColumns.push(
                    `${config.nameColumn} AS ${filterKey}_uraian`
                  );
                } else {
                  selectColumns.push(
                    `main.${config.columnName} AS ${filterKey}_uraian`
                  );
                }
                break;
              case "kode_uraian":
                selectColumns.push(`main.${config.columnName} AS ${filterKey}`);
                if (config.nameColumn) {
                  selectColumns.push(
                    `${config.nameColumn} AS ${filterKey}_uraian`
                  );
                } else {
                  selectColumns.push(
                    `main.${config.columnName} AS ${filterKey}_uraian`
                  );
                }
                break;
            }
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
      const realizationColumns: string[] = [];
      for (let month = 1; month <= cutOffNum; month++) {
        realizationColumns.push(`real${month}`);
      }
      const realizationSum = realizationColumns.join(" + ");

      // Kontrak reports: add mandatory columns and custom sums (with pembulatan divisor), then return early
      if (reportParams.tipeLaporan === "semua_kontrak") {
        // Mandatory columns for semua_kontrak
        selectColumns.push("main.nokontrak AS nokontrak");
        selectColumns.push("main.can AS can");
        selectColumns.push("CAST(main.tgkontrak AS CHAR) AS tgkontrak");
        selectColumns.push("CAST(main.tgterima AS CHAR) AS tgterima");
        selectColumns.push("main.termin_ke AS termin_ke");
        selectColumns.push(
          "CAST(main.tgljatuhtempo_termin AS CHAR) AS tgljatuhtempo_termin"
        );
        selectColumns.push(
          "CAST(main.tgljatuhtempo AS CHAR) AS tgljatuhtempo"
        );
        selectColumns.push("main.deskripsi AS deskripsi");

        // Custom aggregates with pembulatan divisor
        selectColumns.push(
          `ROUND(SUM(CONVERT(main.pagu, SIGNED)) / ${divisor}, 0) AS PAGU_KONTRAK`
        );
        selectColumns.push(
          `ROUND(SUM(main.realisasi) / ${divisor}, 0) AS REALISASI_KONTRAK`
        );

        return { selectColumns, joinTables };
      }
      if (reportParams.tipeLaporan === "kontrak_valas") {
        // Mandatory columns for kontrak_valas
        selectColumns.push("main.currency AS currency");
        selectColumns.push("main.kurs_user AS kurs_user");
        selectColumns.push("main.nokontrak AS nokontrak");
        selectColumns.push("CAST(main.tgkontrak AS CHAR) AS tgkontrak");
        selectColumns.push("CAST(main.tgterima AS CHAR) AS tgterima");
        selectColumns.push("main.termin_ke AS termin_ke");
        selectColumns.push(
          "CAST(main.tgljatuhtempo_termin AS CHAR) AS tgljatuhtempo_termin"
        );
        selectColumns.push(
          "CAST(main.tgljatuhtempo AS CHAR) AS tgljatuhtempo"
        );
        selectColumns.push("main.deskripsi AS deskripsi");

        // Custom aggregates with pembulatan divisor
        selectColumns.push(
          `ROUND(SUM(CONVERT(main.pagu, SIGNED)) / ${divisor}, 0) AS PAGU_KONTRAK`
        );
        selectColumns.push(
          `ROUND(SUM(main.realisasi) / ${divisor}, 0) AS REALISASI_KONTRAK`
        );

        return { selectColumns, joinTables };
      }

      // Add mandatory columns based on report type
      if (reportParams.tipeLaporan === "pagu_apbn") {
        // For Pagu APBN report (tipe laporan 1), add PAGU_APBN before PAGU_DIPA
        selectColumns.push(
          `ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / ${divisor}, 0) AS PAGU_APBN`
        );
        selectColumns.push(
          `ROUND(SUM(main.pagu_dipa) / ${divisor}, 0) AS PAGU_DIPA`
        );
      } else if (reportParams.tipeLaporan === "pagu_dan_blokir") {
        // For RKAKL Detail report, add PAGU and BLOKIR columns
        selectColumns.push(`ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU`);
        selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
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
            const cumulativeRealColumns: string[] = [];
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
      } else if (reportParams.tipeLaporan === "pagu_dan_blokir") {
        // For RKAKL Detail, no additional columns needed - PAGU and BLOKIR already added above
        // Skip adding any realisasi columns
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

      // Kontrak Valas specific filter: exclude IDR
      if (reportParams?.tipeLaporan === "kontrak_valas") {
        whereConditions.push("main.currency <> 'IDR'");
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
      if (activeFilters.includes("swasembadaPangan")) {
        whereConditions.push("main.swasembada IS NOT NULL");
      }
      // Belanja Pemerintah: WHERE-only filter on kdakun; no GROUP BY or SELECT column
      if (activeFilters.includes("belanjaPemerintah")) {
        whereConditions.push(
          "main.kdakun IN ('511521','511522','511529','521231','521232','521233','521234','526111','526112','526113','526114','526115','526121','526122','526123','526124','526131','526132','526311','526312','526313','526321','526322','526323')"
        );
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

        // Special-case WHERE for jenisKontrak (computed from main.can)
        if (filterKey === "jenisKontrak") {
          if (selection === "SYC") {
            whereConditions.push("SUBSTR(main.can,16,1) = '0'");
          } else if (selection === "MYC") {
            whereConditions.push("SUBSTR(main.can,16,1) <> '0'");
          }
          return; // Skip generic handling for this filter
        }

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
          }
          // Tematik Anggaran: use LIKE for kdtema as requested
          else if (filterKey === "jenisTemaAnggaran") {
            whereConditions.push(
              `main.${config.columnName} LIKE '%${selection}%'`
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
            }
            // Tematik Anggaran: OR-ed LIKEs for multiple kdtema codes
            else if (filterKey === "jenisTemaAnggaran") {
              const likeConds = values
                .map((v) => `main.${config.columnName} LIKE '%${v}%'`)
                .join(" OR ");
              whereConditions.push(`(${likeConds})`);
            } else {
              whereConditions.push(
                `main.${config.columnName} IN (${valuesList})`
              );
            }
          }
        }

        // Handle mengandung kata (LIKE search)
        // Special-case: Program Strategis searches on main.nmprogis (no reference table)
        if (
          filterKey === "jenisProgramStrategis" &&
          mengandungKata &&
          mengandungKata.trim()
        ) {
          whereConditions.push(
            `main.nmprogis LIKE '%${mengandungKata.trim()}%'`
          );
        } else if (
          mengandungKata &&
          mengandungKata.trim() &&
          config.referenceTable
        ) {
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
        } else if (
          mengandungKata &&
          mengandungKata.trim() &&
          !config.referenceTable &&
          config.nameColumn
        ) {
          // Non-reference filter with custom expression for uraian (e.g., Item)
          whereConditions.push(
            `${config.nameColumn} LIKE '%${mengandungKata.trim()}%'`
          );
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

      // Kontrak reports: enforce grouping by mandatory identifier/date columns
      if (reportParams.tipeLaporan === "semua_kontrak") {
        addGroupBy("main.nokontrak");
        addGroupBy("main.can");
        addGroupBy("main.tgkontrak");
        addGroupBy("main.tgterima");
        addGroupBy("main.termin_ke");
        addGroupBy("main.tgljatuhtempo_termin");
        addGroupBy("main.tgljatuhtempo");
        addGroupBy("main.deskripsi");
        return groupByColumns;
      }
      if (reportParams.tipeLaporan === "kontrak_valas") {
        addGroupBy("main.currency");
        addGroupBy("main.kurs_user");
        addGroupBy("main.nokontrak");
        addGroupBy("main.tgkontrak");
        addGroupBy("main.tgterima");
        addGroupBy("main.termin_ke");
        addGroupBy("main.tgljatuhtempo_termin");
        addGroupBy("main.tgljatuhtempo");
        addGroupBy("main.deskripsi");
        return groupByColumns;
      }

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
      // Group by computed jenisKontrak expression when active
      if (uniqueActiveFilters.includes("jenisKontrak")) {
        addGroupBy(
          "CASE WHEN SUBSTR(main.can,16,1) = '0' THEN 'SYC' WHEN SUBSTR(main.can,16,1) <> '0' THEN 'MYC' END"
        );
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
      if (uniqueActiveFilters.includes("swasembadaPangan")) {
        addGroupBy("main.swasembada");
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
        } else if (filterKey === "register") {
          // Use pre-normalized register column for better performance on large datasets
          addGroupBy(`main.register_normalized`);
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
            // Always add detail_ref columns when register filter is selected (except register and kdctarik to avoid duplication)
            const detailAlias = "detail_ref";
            // Note: Removed ${detailAlias}.register and ${detailAlias}.kdctarik from GROUP BY

            // Check if we need to join (either for SELECT or WHERE with mengandung kata)
            const mengandungKata = filterValue?.mengandungKata;
            const needsJoinForWhere = mengandungKata && mengandungKata.trim();
            const needsJoinForSelect =
              jenisTampilan === "uraian" || jenisTampilan === "kode_uraian";

            if (needsJoinForSelect || needsJoinForWhere) {
              // Note: Removed ${alias}.register to avoid duplicate grouping with main.register
              addGroupBy(`${alias}.nonpln`);
              addGroupBy(`${alias}.kdvalas`);
              addGroupBy(`${alias}.tglnpln`);
              addGroupBy(`${alias}.kddonor`);
              addGroupBy(`${alias}.kdkreditor`);
              addGroupBy(`${alias}.nmdonor`);
              addGroupBy(`${alias}.jmlpnrk`);
              addGroupBy(`${alias}.closingdate`);
            }

            // Note: Removed ctarik_ref.kdctarik from GROUP BY to avoid duplicate rows
            // The LEFT JOIN will still provide the uraian values in SELECT, but we don't group by kdctarik
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

        // Check if register filter is active to determine if we need pre-normalization
        const hasRegisterFilter = activeFilters.includes("register");

        // Build the complete query with pre-normalization for register column when needed
        let query;
        if (hasRegisterFilter) {
          // Use pre-normalized subquery for better performance on large datasets
          query = `SELECT
  ${selectColumns.join(",\n  ")}\nFROM (
  SELECT *,
    COALESCE(NULLIF(register, ''), '-') AS register_normalized
  FROM ${mainTable}
) AS main`;
        } else {
          // Standard query without pre-normalization
          query = `SELECT
  ${selectColumns.join(",\n  ")}\nFROM ${mainTable} AS main`;
        }

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
