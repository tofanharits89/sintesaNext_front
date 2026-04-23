"use client";

import { useCallback } from "react";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";

// APBD dimension config: filter key → SQL column + JOIN info
interface ApbdDimConfig {
  keyCol: string; // e.g. "main.kdprov"
  nameCol?: string; // e.g. "e.nmprov" or "main.nmsatker"
  nameInline: boolean; // true = nameCol is on the main table, no JOIN needed
  refTable?: string; // "dbref.t_xxx" — may contain "THANG" placeholder
  refAlias?: string; // alias for the LEFT JOIN
  refJoinOn?: string; // ON clause
}

const APBD_DIM_MAP: Record<string, ApbdDimConfig> = {
  provinsi: {
    keyCol: "main.kdprov",
    nameCol: "e.nmprov",
    nameInline: false,
    refTable: "dbref.t_provinsi_apbd",
    refAlias: "e",
    refJoinOn: "main.kdprov = e.kdprov",
  },
  kabkota: {
    keyCol: "main.kdkabkota",
    nameCol: "f.nmkabkota",
    nameInline: false,
    refTable: "dbref.t_kabkota_apbd",
    refAlias: "f",
    refJoinOn: "main.kdprov = f.kdprov AND main.kdkabkota = f.kdkabkota",
  },
  kanwil: {
    keyCol: "main.kdkanwil",
    nameCol: "g.nmkanwil",
    nameInline: false,
    refTable: "dbref.t_kanwil_2014",
    refAlias: "g",
    refJoinOn: "main.kdkanwil = g.kdkanwil",
  },
  kppn: {
    keyCol: "main.kdkppn",
    nameCol: "h.nmkppn",
    nameInline: false,
    refTable: "dbref.t_kppn_THANG", // "THANG" is replaced with tahun at runtime
    refAlias: "h",
    refJoinOn: "main.kdkppn = h.kdkppn",
  },
  satker: {
    keyCol: "main.kdsatker",
    nameCol: "main.nmsatker",
    nameInline: true,
  },
  fungsi: {
    keyCol: "main.kdfungsi",
    nameCol: "j.nmfungsi",
    nameInline: false,
    refTable: "dbref.t_fungsi_2014",
    refAlias: "j",
    refJoinOn: "main.kdfungsi = j.kdfungsi",
  },
  subFungsi: {
    keyCol: "main.kdsfung",
    nameCol: "k.nmsfung",
    nameInline: false,
    refTable: "dbref.t_sfung",
    refAlias: "k",
    refJoinOn: "main.kdfungsi = k.kdfungsi AND main.kdsfung = k.kdsfung",
  },
  urusanAPBD: {
    keyCol: "main.kdurusan",
    nameCol: "ur.nmurusan",
    nameInline: false,
    refTable: "dbref.t_urusan_apbd",
    refAlias: "ur",
    refJoinOn: "main.kdurusan = ur.kdurusan",
  },
  bidangAPBD: {
    keyCol: "main.kdbidurusan",
    nameCol: "br.nmbidurusan",
    nameInline: false,
    refTable: "dbref.t_bidurusan_apbd",
    refAlias: "br",
    refJoinOn:
      "main.kdurusan = br.kdurusan AND main.kdbidurusan = br.kdbidurusan",
  },
  program: {
    keyCol: "main.kdprogram",
    nameCol: "main.nmprogram",
    nameInline: true,
  },
  kegiatan: {
    keyCol: "main.kdgiat",
    nameCol: "main.nmgiat",
    nameInline: true,
  },
  subKegiatanAPBD: {
    keyCol: "main.kdsubgiat",
    nameCol: "main.nmsubgiat",
    nameInline: true,
  },
};

// Filter keys supported on the APBD tematik table
export const APBD_SUPPORTED_FILTERS = Object.keys(APBD_DIM_MAP);

// Month column aliases used in SELECT
const APBD_MONTHS = [
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

const PEMBULATAN_DIVISOR: Record<string, number> = {
  // Numeric string keys (per APBD SPEC)
  "1": 1,
  "1000": 1_000,
  "1000000": 1_000_000,
  "1000000000": 1_000_000_000,
  "1000000000000": 1_000_000_000_000,
  // Legacy string keys from PilihLaporanCard
  satuan: 1,
  ribuan: 1_000,
  jutaan: 1_000_000,
  miliaran: 1_000_000_000,
  triliunan: 1_000_000_000_000,
};

function getPembulatanDivisor(pembulatan: string): number {
  return PEMBULATAN_DIVISOR[pembulatan] ?? 1;
}

/** Strip characters that could be used for SQL injection in user-provided values. */
function sanitize(v: string): string {
  return v.replace(/['"\\;]/g, "");
}

export function useAPBDQueryBuilder() {
  const buildTableName = useCallback(
    (tahun: string, tipeLaporan: string): string => {
      // "apbd_pagu_real" is the canonical value; "apbd_pagu_realisasi" is kept
      // for backward-compatibility with any existing serialised state.
      if (
        tipeLaporan === "apbd_pagu_real" ||
        tipeLaporan === "apbd_pagu_realisasi"
      ) {
        return `monev${tahun}.a_pagu_real_bkpk_apbd_${tahun}`;
      }
      // apbd_real_inflasi | apbd_real_stunting | apbd_real_kemiskinan
      return `monev${tahun}.a_real_bkpk_apbd_${tahun}`;
    },
    [],
  );

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
        const { tahun, tipeLaporan, pembulatan } = reportParams;
        const divisor = getPembulatanDivisor(pembulatan);
        const divisorExpr = divisor > 1 ? ` / ${divisor}` : "";
        const mainTable = buildTableName(tahun, tipeLaporan);

        const uniqueFilters = Array.from(new Set(activeFilters));
        const joinTables: string[] = [];
        const joinedAliases = new Set<string>();
        const selectCols: string[] = [];
        const groupByCols: string[] = [];
        const whereConds: string[] = [];

        // Add a LEFT JOIN for a ref dimension (idempotent per alias)
        const ensureJoin = (dim: ApbdDimConfig) => {
          if (
            dim.nameInline ||
            !dim.refAlias ||
            !dim.refTable ||
            !dim.refJoinOn
          )
            return;
          if (joinedAliases.has(dim.refAlias)) return;
          joinedAliases.add(dim.refAlias);
          const resolved = dim.refTable.replace("THANG", tahun);
          joinTables.push(
            `LEFT JOIN ${resolved} AS ${dim.refAlias} ON ${dim.refJoinOn}`,
          );
        };

        // Process active filter dimensions
        uniqueFilters.forEach((filterKey) => {
          const dim = APBD_DIM_MAP[filterKey];
          if (!dim) return;

          const fv = filterValues[filterKey];
          const jt = fv?.jenisTampilan || "kode";

          // SELECT + GROUP BY columns based on jenisTampilan
          if (jt !== "jangan_tampilkan") {
            if (jt === "kode" || jt === "kode_uraian") {
              selectCols.push(dim.keyCol);
              groupByCols.push(dim.keyCol);
            }
            if ((jt === "uraian" || jt === "kode_uraian") && dim.nameCol) {
              if (!dim.nameInline) ensureJoin(dim);
              selectCols.push(dim.nameCol);
              groupByCols.push(dim.nameCol);
            }
          }

          // WHERE conditions from filter value
          if (!fv) return;
          const { selection, kondisiCode, mengandungKata } = fv;

          if (selection && selection !== "all" && selection !== "XX") {
            whereConds.push(`${dim.keyCol} = '${sanitize(selection)}'`);
          } else if (kondisiCode && kondisiCode.trim()) {
            const isExclude =
              kondisiCode.startsWith("!") || kondisiCode.startsWith("-");
            const clean = isExclude ? kondisiCode.slice(1) : kondisiCode;
            const vals = clean
              .split(",")
              .map((v) => sanitize(v.trim()))
              .filter(Boolean);
            if (vals.length > 0) {
              const inList = vals.map((v) => `'${v}'`).join(", ");
              whereConds.push(
                `${dim.keyCol} ${isExclude ? "NOT IN" : "IN"} (${inList})`,
              );
            }
          } else if (mengandungKata && mengandungKata.trim() && dim.nameCol) {
            if (!dim.nameInline) ensureJoin(dim);
            whereConds.push(
              `LOWER(${dim.nameCol}) LIKE LOWER('%${sanitize(mengandungKata.trim())}%')`,
            );
          }
        });

        // Special handling for levelAPBD: dynamic level selector (level 1–6, default 6)
        if (uniqueFilters.includes("levelAPBD")) {
          const fv = filterValues["levelAPBD"];
          const levelNum = fv?.subSelection || "6";
          const jt = fv?.jenisTampilan || "kode";
          const keyCol = `main.kdlevel${levelNum}`;
          const lvlAlias = `lvl${levelNum}`;
          const refTable = `dbref.t_level${levelNum}_apbd`;
          const nameCol = `${lvlAlias}.nmlevel${levelNum}`;

          const ensureLevelJoin = () => {
            if (!joinedAliases.has(lvlAlias)) {
              joinedAliases.add(lvlAlias);
              joinTables.push(
                `LEFT JOIN ${refTable} AS ${lvlAlias} ON ${keyCol} = ${lvlAlias}.kdlevel${levelNum}`,
              );
            }
          };

          if (jt !== "jangan_tampilkan") {
            if (jt === "kode" || jt === "kode_uraian") {
              selectCols.push(keyCol);
              groupByCols.push(keyCol);
            }
            if (jt === "uraian" || jt === "kode_uraian") {
              ensureLevelJoin();
              selectCols.push(nameCol);
              groupByCols.push(nameCol);
            }
          }

          if (fv) {
            const { selection, kondisiCode, mengandungKata } = fv;
            if (selection && selection !== "all" && selection !== "XX") {
              whereConds.push(`${keyCol} = '${sanitize(selection)}'`);
            } else if (kondisiCode && kondisiCode.trim()) {
              const isExclude =
                kondisiCode.startsWith("!") || kondisiCode.startsWith("-");
              const clean = isExclude ? kondisiCode.slice(1) : kondisiCode;
              const vals = clean
                .split(",")
                .map((v) => sanitize(v.trim()))
                .filter(Boolean);
              if (vals.length > 0) {
                const inList = vals.map((v) => `'${v}'`).join(", ");
                whereConds.push(
                  `${keyCol} ${isExclude ? "NOT IN" : "IN"} (${inList})`,
                );
              }
            } else if (mengandungKata && mengandungKata.trim()) {
              ensureLevelJoin();
              whereConds.push(
                `LOWER(${nameCol}) LIKE LOWER('%${sanitize(mengandungKata.trim())}%')`,
              );
            }
          }
        }

        // Tematik column + mandatory WHERE filter
        if (tipeLaporan === "apbd_real_inflasi") {
          selectCols.push("main.inflasi");
          groupByCols.push("main.inflasi");
          whereConds.push(
            "(main.inflasi <> 'NULL' AND main.inflasi IS NOT NULL)",
          );
        } else if (tipeLaporan === "apbd_real_stunting") {
          selectCols.push("main.stunting");
          groupByCols.push("main.stunting");
          whereConds.push(
            "(main.stunting <> 'NULL' AND main.stunting IS NOT NULL)",
          );
        } else if (tipeLaporan === "apbd_real_kemiskinan") {
          selectCols.push("main.kemiskinan");
          groupByCols.push("main.kemiskinan");
          whereConds.push(
            "(main.kemiskinan <> 'NULL' AND main.kemiskinan IS NOT NULL)",
          );
        }

        // Exclude aggregate/summary rows (kdprov='XX' is a national total sentinel)
        whereConds.push("main.kdprov <> 'XX'");

        // Metric columns: PAGU (pagu_real only) + monthly realisasi (periode1-12)
        const isPaguReal =
          tipeLaporan === "apbd_pagu_real" ||
          tipeLaporan === "apbd_pagu_realisasi";
        if (isPaguReal) {
          selectCols.push(`ROUND(SUM(main.pagu)${divisorExpr}, 0) AS PAGU`);
        }
        APBD_MONTHS.forEach((mn, i) => {
          selectCols.push(
            `ROUND(SUM(main.periode${i + 1})${divisorExpr}, 0) AS ${mn}`,
          );
        });

        // Fallback: ensure at least one grouping column so GROUP BY is valid
        if (groupByCols.length === 0) {
          selectCols.unshift("main.kdprov");
          groupByCols.unshift("main.kdprov");
        }

        let query = `SELECT\n  ${selectCols.join(",\n  ")}`;
        query += `\nFROM ${mainTable} AS main`;
        if (joinTables.length > 0) {
          query += `\n${joinTables.join("\n")}`;
        }
        if (whereConds.length > 0) {
          query += `\nWHERE\n  ${whereConds.join("\n  AND ")}`;
        }
        if (groupByCols.length > 0) {
          query += `\nGROUP BY\n  ${groupByCols.join(",\n  ")}`;
        }

        return query;
      } catch (err) {
        return `-- Error building APBD query: ${(err as Error).message}`;
      }
    },
    [buildTableName],
  );

  const encryptQuery = useCallback(
    (query: string): string => btoa(encodeURIComponent(query)),
    [],
  );

  return { buildQuery, encryptQuery, buildTableName };
}
