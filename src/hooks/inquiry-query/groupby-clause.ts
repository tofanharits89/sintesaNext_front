import { FilterConfig, FilterValue } from "./types";
import { getCategoryQueryConfig } from "@/components/inquiry-data/categoryRegistry";
import { getFilterConfigMap } from "@/components/inquiry-data/filterRegistry";
import { getReportTypeConfig } from "./report-config";

const FILTER_CONFIG: Record<string, FilterConfig> = getFilterConfigMap() as any;

export function buildGroupByClause(
  activeFilters: string[],
  filterValues: Record<string, FilterValue>,
  reportParams: { tipeLaporan: string; tematikKategori?: string }
) {
  const groupByColumns: string[] = [];
  const addGroupBy = (col: string) => {
    if (!groupByColumns.includes(col)) groupByColumns.push(col);
  };

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

  if (reportParams.tipeLaporan === "outstanding_up_tup") {
    // For UP/TUP, group by all active filter columns
    const uniqueActiveFilters = Array.from(new Set(activeFilters));
    if (uniqueActiveFilters.includes("kementerian")) addGroupBy("main.kddept");
    if (uniqueActiveFilters.includes("eselonI")) addGroupBy("main.kdunit");
    if (uniqueActiveFilters.includes("kewenangan")) addGroupBy("main.kddekon");
    if (uniqueActiveFilters.includes("kanwil")) addGroupBy("main.kdkanwil");
    if (uniqueActiveFilters.includes("kppn")) addGroupBy("main.kdkppn");
    if (uniqueActiveFilters.includes("satker")) addGroupBy("main.kdsatker");
    if (uniqueActiveFilters.includes("akun")) addGroupBy("main.kdakun");
    return groupByColumns;
  }

  if (reportParams.tipeLaporan === "detil_penerimaan_pnbp") {
    addGroupBy("main.TGPOS");
    addGroupBy("main.NODOK");
  }

  if (reportParams.tipeLaporan === "spm_sp2d") {
    // SP2D: Add base query columns only
    // Filter columns will be handled by the main loop below (same as belanja)
    addGroupBy("main.RUPIAH");
    addGroupBy("main.NOSP2D");
    addGroupBy("main.TGSP2D");
    addGroupBy("main.NOSPM");
    addGroupBy("main.TGSPM");
    addGroupBy("main.URAIAN");
    addGroupBy("main.JENSP2D");
    addGroupBy("main.JENSPM");
    addGroupBy("main.TGPOS");

    // Don't return early - let the main loop handle ALL filter columns
    // This ensures akun and other filters are handled consistently with belanja
  }

  if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis") {
    addGroupBy("main.kdblokir");
    addGroupBy("main.nmblokir");
  }

  const uniqueActiveFilters = Array.from(new Set(activeFilters));

  if (uniqueActiveFilters.includes("kemiskinanEkstrim")) addGroupBy("main.kemiskinan_ekstrim");
  if (uniqueActiveFilters.includes("jenisKontrak")) {
    addGroupBy("CASE WHEN SUBSTR(main.can,16,1) = '0' THEN 'SYC' WHEN SUBSTR(main.can,16,1) <> '0' THEN 'MYC' END");
  }
  if (uniqueActiveFilters.includes("belanjaPemilu")) addGroupBy("main.pemilu");
  if (uniqueActiveFilters.includes("ibuKotaNusantara")) addGroupBy("main.ikn");
  if (uniqueActiveFilters.includes("ketahananPangan")) addGroupBy("main.pangan");
  if (uniqueActiveFilters.includes("swasembadaPangan")) addGroupBy("main.swasembada");
  if (uniqueActiveFilters.includes("statusSumber")) {
    const filterValue = filterValues["statusSumber"];
    const jenisTampilan = filterValue?.jenisTampilan || "kode";
    addGroupBy("main.JE_SOURCE");
    if (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") {
      addGroupBy("statusSumber_ref.nmsumber");
    }
  }

uniqueActiveFilters.forEach((filterKey) => {
      if (filterKey === "cutOff" || filterKey === "statusSumber") return;
      const config = FILTER_CONFIG[filterKey];
      const filterValue = filterValues[filterKey];
      
      // Only return if filterValue is missing, but still process if config is missing
      if (!filterValue) return;

      const jenisTampilan = filterValue.jenisTampilan || "kode";
      if (jenisTampilan === "jangan_tampilkan") return;

      // If config exists, use it for special cases
      if (config) {
        if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
          addGroupBy(`LEFT(main.${config.columnName}, 4)`);
        } else if (filterKey === "akun" && filterValue?.akunType === "jenisBelanja") {
          addGroupBy(`LEFT(main.${config.columnName}, 2)`);
        } else if (filterKey === "kodeBkpk") {
          addGroupBy(`LEFT(main.${config.columnName}, 4)`);
        } else if (filterKey === "jenisBelanja") {
          addGroupBy(`LEFT(main.${config.columnName}, 2)`);
        } else if (filterKey !== "register") {
          addGroupBy(`main.${config.columnName}`);
        }
      } else {
        // Fallback: if config doesn't exist, use filterKey as column name
        addGroupBy(`main.${filterKey}`);
      }

    if (filterKey === "jenisProgramStrategis" && (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian")) {
      addGroupBy("main.nmprogis");
    }

    if (getReportTypeConfig(reportParams.tipeLaporan).isVolumeOutput) {
      addGroupBy("main.sat");
      addGroupBy("main.os");
      addGroupBy("main.ket");
    }

    if (config?.referenceTable) {
      const alias = `${filterKey}_ref`;
      if (filterKey === "register") {
        addGroupBy(`${alias}.nonpln`);
        addGroupBy(`${alias}.kdvalas`);
        addGroupBy(`${alias}.tglnpln`);
        addGroupBy(`${alias}.kddonor`);
        addGroupBy(`${alias}.kdkreditor`);
        addGroupBy(`${alias}.nmdonor`);
        addGroupBy(`${alias}.jmlpnrk`);
        addGroupBy(`${alias}.closingdate`);
      } else if (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") {
        let nameColumn = config.nameColumn!;
        if (filterKey === "akun" && filterValue?.akunType) {
          if (filterValue.akunType === "kodeBkpk") nameColumn = "nmbkpk";
          else if (filterValue.akunType === "jenisBelanja") nameColumn = "nmgbkpk";
        }
        addGroupBy(`${alias}.${nameColumn}`);
      }
    }
  });

  const tematikKategori = reportParams.tematikKategori;
  if (tematikKategori) {
    const categoryConfig = getCategoryQueryConfig(tematikKategori);
    if (categoryConfig?.groupByColumns?.length) {
      for (const col of categoryConfig.groupByColumns) if (!groupByColumns.includes(col)) groupByColumns.push(col);
    }
  }

  return groupByColumns;
}
