import { TABLE_MAPPING, getReportTypeConfig } from "./report-config";
import { getCategoryQueryConfig } from "@/components/inquiry-data/categoryRegistry";

export function buildTableName(reportParams: { tahun: string; tipeLaporan: string; tematikKategori?: string }) {
  const thang = reportParams.tahun;
  const tematikKategori = reportParams.tematikKategori;

  if (tematikKategori) {
    const categoryConfig = getCategoryQueryConfig(tematikKategori);
    if (categoryConfig) {
      const suffix = (categoryConfig as any).baseTableSuffix || "";
      return `monev${thang}.${categoryConfig.tableName}_${thang}${suffix}`;
    }
    if (tematikKategori === "bantuan_pemerintah") {
      return `monev${thang}.pagu_real_detail_harian_${thang}`;
    }
    if (tematikKategori === "program_strategis") {
      return `monev${thang}.smry_program_strategis_${thang}`;
    }
    return `monev${thang}.a_pagu_real_bkpk_dja_${thang}`;
  }

  const baseTable = TABLE_MAPPING[reportParams.tipeLaporan as keyof typeof TABLE_MAPPING];
  if (!baseTable) {
    throw new Error(`Unknown report type: ${reportParams.tipeLaporan}`);
  }
  const cfg = getReportTypeConfig(reportParams.tipeLaporan);
  return cfg.tableNameBuilder(thang, baseTable);
}
