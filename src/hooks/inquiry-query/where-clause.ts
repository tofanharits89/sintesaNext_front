import { FilterConfig, FilterValue } from "./types";
import { getCategoryQueryConfig } from "@/components/inquiry-data/categoryRegistry";
import { getFilterConfigMap } from "@/components/inquiry-data/filterRegistry";

const FILTER_CONFIG: Record<string, FilterConfig> = getFilterConfigMap() as any;

export function buildWhereClause(
  activeFilters: string[],
  filterValues: Record<string, FilterValue>,
  reportParams?: { tahun?: string; tipeLaporan?: string; tematikKategori?: string; pembulatan?: string; jenisAkumulasi?: string }
) {
  const whereConditions: string[] = [];

  const tematikKategori = reportParams?.tematikKategori;
  if (tematikKategori) {
    const categoryConfig = getCategoryQueryConfig(tematikKategori);
    if (categoryConfig?.whereConditions) whereConditions.push(...categoryConfig.whereConditions);
  }

  if (reportParams?.tipeLaporan === "kontrak_valas") {
    whereConditions.push("main.currency <> 'IDR'");
  }

  // Add cutOff condition for UP/TUP report (accumulative: <= for all months up to cutoff)
  if (reportParams?.tipeLaporan === "outstanding_up_tup") {
    const cutOffValue = filterValues.cutOff?.selection;
    if (cutOffValue) {
      whereConditions.push(`main.bulan <= '${cutOffValue}'`);
    }
  }

  if (activeFilters.includes("kemiskinanEkstrim")) whereConditions.push("main.kemiskinan_ekstrim IS NOT NULL");
  if (activeFilters.includes("belanjaPemilu")) whereConditions.push("main.pemilu IS NOT NULL");
  if (activeFilters.includes("ibuKotaNusantara")) whereConditions.push("main.ikn IS NOT NULL");
  if (activeFilters.includes("ketahananPangan")) whereConditions.push("main.pangan IS NOT NULL");
  if (activeFilters.includes("swasembadaPangan")) whereConditions.push("main.swasembada IS NOT NULL");

  if (activeFilters.includes("belanjaPemerintah")) {
    whereConditions.push(
      "main.kdakun IN ('511521','511522','511529','521231','521232','521233','521234','526111','526112','526113','526114','526115','526121','526122','526123','526124','526131','526132','526311','526312','526313','526321','526322','526323')"
    );
  }

  const uniqueActiveFilters = Array.from(new Set(activeFilters));

  uniqueActiveFilters.forEach((filterKey) => {
    if (filterKey === "cutOff") return;

    const config = FILTER_CONFIG[filterKey];
    const filterValue = filterValues[filterKey];
    if (!config || !filterValue) return;

    const { selection, kondisiCode, mengandungKata } = filterValue;

    if (filterKey === "jenisKontrak") {
      if (selection === "SYC") whereConditions.push("SUBSTR(main.can,16,1) = '0'");
      else if (selection === "MYC") whereConditions.push("SUBSTR(main.can,16,1) <> '0'");
      return;
    }

    if (selection && selection !== "all") {
      if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
        whereConditions.push(`LEFT(main.${config.columnName}, 4) = '${selection}'`);
      } else if (filterKey === "akun" && filterValue?.akunType === "jenisBelanja") {
        whereConditions.push(`LEFT(main.${config.columnName}, 2) = '${selection}'`);
      } else if (filterKey === "kodeBkpk") {
        whereConditions.push(`LEFT(main.${config.columnName}, 4) = '${selection}'`);
      } else if (filterKey === "jenisBelanja") {
        whereConditions.push(`LEFT(main.${config.columnName}, 2) = '${selection}'`);
      } else if (filterKey === "jenisTemaAnggaran") {
        whereConditions.push(`main.${config.columnName} LIKE '%${selection}%'`);
      } else {
        whereConditions.push(`main.${config.columnName} = '${selection}'`);
      }
    }

    if (kondisiCode && kondisiCode.trim()) {
      const isExclude = kondisiCode.startsWith("!") || kondisiCode.startsWith("-");
      const cleanKondisi = isExclude ? kondisiCode.substring(1) : kondisiCode;
      const values = cleanKondisi.split(",").map((v) => v.trim()).filter(Boolean);

      const buildFlexibleCondition = (
        columnExpr: string,
        expectedLength: number,
        values: string[],
        isExclude: boolean
      ): string => {
        const conditions = values.map((v) => {
          if (v.length < expectedLength) return `${columnExpr} ${isExclude ? "NOT LIKE" : "LIKE"} '${v}%'`;
          else return `${columnExpr} ${isExclude ? "<>" : "="} '${v}'`;
        });
        const joinOperator = isExclude ? " AND " : " OR ";
        return conditions.length > 1 ? `(${conditions.join(joinOperator)})` : conditions[0] || "";
      };

      if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
        whereConditions.push(buildFlexibleCondition(`LEFT(main.${config.columnName}, 4)`, 4, values, isExclude));
      } else if (filterKey === "akun" && filterValue?.akunType === "jenisBelanja") {
        whereConditions.push(buildFlexibleCondition(`LEFT(main.${config.columnName}, 2)`, 2, values, isExclude));
      } else if (filterKey === "akun" && filterValue?.akunType === "kodeAkun") {
        whereConditions.push(buildFlexibleCondition(`main.${config.columnName}`, 6, values, isExclude));
      } else if (filterKey === "kodeBkpk") {
        whereConditions.push(buildFlexibleCondition(`LEFT(main.${config.columnName}, 4)`, 4, values, isExclude));
      } else if (filterKey === "jenisBelanja") {
        whereConditions.push(buildFlexibleCondition(`LEFT(main.${config.columnName}, 2)`, 2, values, isExclude));
      } else if (filterKey === "jenisTemaAnggaran") {
        const likeConds = values
          .map((v) => `main.${config.columnName} ${isExclude ? "NOT LIKE" : "LIKE"} '%${v}%'`)
          .join(isExclude ? " AND " : " OR ");
        whereConditions.push(`(${likeConds})`);
      } else {
        const valuesList = values.map((v) => `'${v}'`).join(", ");
        const operator = isExclude ? "NOT IN" : "IN";
        whereConditions.push(`main.${config.columnName} ${operator} (${valuesList})`);
      }
    }

    if (filterKey === "jenisProgramStrategis" && mengandungKata && mengandungKata.trim()) {
      whereConditions.push(`main.nmprogis LIKE '%${mengandungKata.trim()}%'`);
    } else if (mengandungKata && mengandungKata.trim() && config.referenceTable) {
      const alias = `${filterKey}_ref`;
      if (filterKey === "register") {
        whereConditions.push(`${alias}.register LIKE '%${mengandungKata.trim()}%'`);
      } else {
        let nameCol = config.nameColumn!;
        if (filterKey === "akun" && filterValue?.akunType) {
          if (filterValue.akunType === "kodeBkpk") nameCol = "nmbkpk";
          else if (filterValue.akunType === "jenisBelanja") nameCol = "nmgbkpk";
        }
        whereConditions.push(`${alias}.${nameCol} LIKE '%${mengandungKata.trim()}%'`);
      }
    } else if (mengandungKata && mengandungKata.trim() && !config.referenceTable && config.nameColumn) {
      whereConditions.push(`${config.nameColumn} LIKE '%${mengandungKata.trim()}%'`);
    }
  });

  return whereConditions;
}
