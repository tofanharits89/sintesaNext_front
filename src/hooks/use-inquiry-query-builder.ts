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
  akunType?: "akun" | "kodeBkpk" | "jenisBelanja"; // For akun filter type switching
}

// Table mapping based on report type
const TABLE_MAPPING = {
  pagu_apbn: "pagu_real_detail_harian_dipa_apbn",
  pagu_realisasi: "pagu_real_detail_harian",
  pagu_realisasi_bulanan: "pagu_real_detail_harian",
  pergerakan_pagu_bulanan: "pagu_real_detail_bulan",
  pergerakan_blokir_bulanan: "pagu_real_detail_bulan",
  pergerakan_blokir_bulanan_per_jenis: "pa_pagu_blokir_akun_bulanan",
  volume_output_kegiatan: "pagu_output_new",
};

import { getFilterConfigMap } from "@/components/inquiry-data/filterRegistry";

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
    (reportParams: { tahun: string; tipeLaporan: string }) => {
      const baseTable =
        TABLE_MAPPING[reportParams.tipeLaporan as keyof typeof TABLE_MAPPING];
      if (!baseTable) {
        throw new Error(`Unknown report type: ${reportParams.tipeLaporan}`);
      }

      const thang = reportParams.tahun;

      // Special case for pergerakan_blokir_bulanan_per_jenis table name format
      if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis") {
        return `monev${thang}.pa_pagu_blokir_akun_${thang}_bulanan`;
      }

      return `monev${thang}.${baseTable}_${thang}`;
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

      // Process regular filters (excluding cutOff which is handled specially)
      activeFilters.forEach((filterKey) => {
        // Skip cutOff - it's not a SELECT column, only affects realization calculation
        if (filterKey === "cutOff") return;

        const config = FILTER_CONFIG[filterKey];
        if (!config) return;

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

          // Special handling for register reference table name format
          let joinTable;
          if (filterKey === "register") {
            joinTable = `${config.referenceDatabase}.${referenceTable}_${
              reportParams.tahun || new Date().getFullYear()
            }`;
          } else {
            joinTable = `${config.referenceDatabase}.${referenceTable}_${
              reportParams.tahun || new Date().getFullYear()
            }`;
          }

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
      } else if (
        reportParams.tipeLaporan !== "pergerakan_pagu_bulanan" &&
        reportParams.tipeLaporan !== "pergerakan_blokir_bulanan" &&
        reportParams.tipeLaporan !== "pergerakan_blokir_bulanan_per_jenis"
      ) {
        // For other report types (except pergerakan_pagu_bulanan and pergerakan_blokir_bulanan), keep the original PAGU_DIPA column
        // pergerakan_pagu_bulanan doesn't need PAGU_DIPA since pagu is broken down by monthly columns
        // pergerakan_blokir_bulanan doesn't need PAGU_DIPA since blokir is broken down by monthly columns
        selectColumns.push(
          `ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU_DIPA`
        );
      }

      // Handle realization columns based on report type
      if (reportParams.tipeLaporan === "pagu_realisasi_bulanan") {
        // For tipe laporan 3 (Pagu Realisasi Bulanan), show monthly columns up to cutOff
        const jenisAkumulasi = reportParams.jenisAkumulasi || "non_akumulatif";

        // Month names mapping
        const monthNames = [
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
        ];

        // Generate monthly columns up to cutOff month
        for (let month = 1; month <= cutOffNum; month++) {
          const monthName = monthNames[month - 1];

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
        selectColumns.push(`ROUND(SUM(blokir) / ${divisor}, 0) AS BLOKIR`);
      } else if (reportParams.tipeLaporan === "pergerakan_pagu_bulanan") {
        // For tipe laporan 4 (Pergerakan Pagu Bulanan), show monthly pagu columns up to cutOff
        // Month names mapping
        const monthNames = [
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
        ];

        // Generate monthly pagu columns up to cutOff month
        for (let month = 1; month <= cutOffNum; month++) {
          const monthName = monthNames[month - 1];
          selectColumns.push(
            `ROUND(SUM(pagu${month}) / ${divisor}, 0) AS ${monthName}`
          );
        }
        // No REALISASI column for pergerakan_pagu_bulanan as it only fetches pagu data
      } else if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan") {
        // For tipe laporan 5 (Pergerakan Blokir Bulanan), show monthly blokir columns up to cutOff
        // Month names mapping
        const monthNames = [
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
        ];

        // Generate monthly blokir columns up to cutOff month
        for (let month = 1; month <= cutOffNum; month++) {
          const monthName = monthNames[month - 1];
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

        // Month names mapping
        const monthNames = [
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
        ];

        // Generate monthly blokir columns up to cutOff month
        for (let month = 1; month <= cutOffNum; month++) {
          const monthName = monthNames[month - 1];
          selectColumns.push(
            `ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`
          );
        }
        // No REALISASI column for pergerakan_blokir_bulanan_per_jenis as it only fetches blokir data
      } else {
        // For other report types, add single REALISASI column based on cut-off and pembulatan
        selectColumns.push(
          `ROUND(SUM(${realizationSum}) / ${divisor}, 0) AS REALISASI`
        );

        // Add BLOKIR column after REALISASI for Pagu APBN and Pagu Realisasi reports
        if (
          reportParams.tipeLaporan === "pagu_apbn" ||
          reportParams.tipeLaporan === "pagu_realisasi"
        ) {
          selectColumns.push(
            `ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`
          );
        }
      }

      return { selectColumns, joinTables };
    },
    []
  );

  // Build WHERE clause
  const buildWhereClause = useCallback(
    (activeFilters: string[], filterValues: Record<string, FilterValue>) => {
      const whereConditions: string[] = [];

      // Year is only used for table name, not in WHERE clause

      activeFilters.forEach((filterKey) => {
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
            whereConditions.push(
              `${alias}.${config.nameColumn} LIKE '%${mengandungKata.trim()}%'`
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
      reportParams: { tipeLaporan: string }
    ) => {
      const groupByColumns: string[] = [];

      // For tipe laporan 6, add mandatory GROUP BY kdblokir and nmblokir
      if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis") {
        groupByColumns.push("main.kdblokir");
        groupByColumns.push("main.nmblokir");
      }

      activeFilters.forEach((filterKey) => {
        // Skip cutOff - it's not a SELECT column, so not in GROUP BY
        if (filterKey === "cutOff") return;

        const config = FILTER_CONFIG[filterKey];
        const filterValue = filterValues[filterKey];

        if (!config || !filterValue) return;

        const jenisTampilan = filterValue.jenisTampilan || "kode";

        if (jenisTampilan === "jangan_tampilkan") return;

        // Add main column to GROUP BY
        // Special handling for akun filter with different types
        if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
          groupByColumns.push(`LEFT(main.${config.columnName}, 4)`);
        } else if (
          filterKey === "akun" &&
          filterValue?.akunType === "jenisBelanja"
        ) {
          groupByColumns.push(`LEFT(main.${config.columnName}, 2)`);
        }
        // Special handling for dedicated kodeBkpk and jenisBelanja filters
        else if (filterKey === "kodeBkpk") {
          groupByColumns.push(`LEFT(main.${config.columnName}, 4)`);
        } else if (filterKey === "jenisBelanja") {
          groupByColumns.push(`LEFT(main.${config.columnName}, 2)`);
        } else {
          groupByColumns.push(`main.${config.columnName}`);
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
              groupByColumns.push(`${alias}.register`);
              groupByColumns.push(`${alias}.nonpln`);
              groupByColumns.push(`${alias}.kdvalas`);
              groupByColumns.push(`${alias}.tglnpln`);
              groupByColumns.push(`${alias}.kddonor`);
              groupByColumns.push(`${alias}.kdkreditor`);
              groupByColumns.push(`${alias}.nmdonor`);
              groupByColumns.push(`${alias}.jmlpnrk`);
              groupByColumns.push(`${alias}.closingdate`);
            }
          }
          // Note: We don't add uraian columns to GROUP BY to avoid duplicate rows
          // when multiple uraian values exist for the same kode (e.g., unit eselon 1)
          // The LEFT JOIN will still provide the uraian values in SELECT, but we only group by kode
        }
      });

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
        const whereConditions = buildWhereClause(activeFilters, filterValues);
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
