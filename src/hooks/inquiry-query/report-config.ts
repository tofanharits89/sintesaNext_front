import { ReportTypeConfig } from "./types";

export const TABLE_MAPPING = {
  pagu_apbn: "pagu_real_detail_harian_dipa_apbn",
  pagu_realisasi: "pagu_real_detail_harian",
  pagu_realisasi_bulanan: "pagu_real_detail_harian",
  pergerakan_pagu_bulanan: "pagu_real_detail_bulan",
  pergerakan_blokir_bulanan: "pagu_real_detail_bulan",
  pergerakan_blokir_bulanan_per_jenis: "pa_pagu_blokir_akun_bulanan",
  volume_output_kegiatan: "pagu_output",
  pagu_dan_blokir: "m_detail_harian",
  semua_kontrak: "pa_kontrak",
  kontrak_valas: "pa_kontrak",
} as const;

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

export const MONTH_NAMES = [
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

const SPECIAL_TABLE_NAME_BUILDERS: Record<string, (thang: string, baseTable: string) => string> = {
  pergerakan_blokir_bulanan_per_jenis: (thang) =>
    `monev${thang}.pa_pagu_blokir_akun_${thang}_bulanan`,
  volume_output_kegiatan: (thang, baseTable) => `monev${thang}.${baseTable}_${thang}_new`,
};

const REPORT_TYPE_REGISTRY: Record<string, ReportTypeConfig> = {
  pagu_apbn: { includePaguDipa: true, addBlokirAfterReal: true },
  pagu_realisasi: { includePaguDipa: true, addBlokirAfterReal: true },
  pagu_realisasi_bulanan: { includePaguDipa: true },
  pergerakan_pagu_bulanan: { includePaguDipa: false },
  pergerakan_blokir_bulanan: { includePaguDipa: false },
  pergerakan_blokir_bulanan_per_jenis: {
    includePaguDipa: false,
    requiresGroupByBlokirJenis: true,
    tableNameBuilder: (thang) => `monev${thang}.pa_pagu_blokir_akun_${thang}_bulanan`,
  },
  volume_output_kegiatan: {
    includePaguDipa: true,
    isVolumeOutput: true,
    tableNameBuilder: (thang, baseTable) => `monev${thang}.${baseTable}_${thang}_new`,
  },
  pagu_dan_blokir: {
    includePaguDipa: true,
    addBlokirAfterReal: false,
    tableNameBuilder: (thang, baseTable) => `monev${thang}.${baseTable}_${thang}`,
  },
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

export function getReportTypeConfig(tipeLaporan: string): Required<ReportTypeConfig> {
  const base: Required<ReportTypeConfig> = {
    includePaguDipa: !REPORTS_EXCLUDE_PAGU_DIPA.has(tipeLaporan),
    addBlokirAfterReal: REPORTS_ADD_BLOKIR_AFTER_REAL.has(tipeLaporan),
    requiresGroupByBlokirJenis: REPORTS_MANDATORY_GROUPBY_BLOKIR_JENIS.has(tipeLaporan),
    isVolumeOutput: REPORTS_VOLUME_OUTPUT.has(tipeLaporan),
    tableNameBuilder:
      SPECIAL_TABLE_NAME_BUILDERS[tipeLaporan] ||
      ((thang: string, baseTable: string) => `monev${thang}.${baseTable}_${thang}`),
  };
  const override = REPORT_TYPE_REGISTRY[tipeLaporan] || {};
  return { ...base, ...override, tableNameBuilder: override.tableNameBuilder || base.tableNameBuilder } as Required<ReportTypeConfig>;
}
