import { getAllMandatoryFilterKeys } from "./categoryRegistry";

/**
 * Base scope exclusions by page scope. These are static business rules.
 * Do not modify behavior when moving from filterRegistry.ts.
 */
export const SCOPE_EXCLUSIONS_BASE: Record<
  "belanja" | "tematik" | "rkakl_detail" | "general",
  string[]
> = {
  belanja: [
    "cutOff", // Hide cut off switch on Belanja page
    "belanjaPemerintah", // Bantuan Pemerintah
    "mbgIntervensi", // Makan Bergizi Gratis
    "swasembadaPangan", // Swasembada Pangan
    "jenisProgramStrategis", // Program Strategis (not used on Belanja page)
    "komponen", // RKAKL Detail specific
    "subKomponen", // RKAKL Detail specific
    "item", // RKAKL Detail specific
    "jenisBlokir", // RKAKL Detail specific
  ],
  tematik: [
    "register",
    "kemiskinanEkstrim",
    "belanjaPemilu",
    "ibuKotaNusantara",
    "ketahananPangan",
    "swasembadaPangan",
    "belanjaPemerintah",
    "komponen", // RKAKL Detail specific
    "subKomponen", // RKAKL Detail specific
    "item", // RKAKL Detail specific
    "jenisBlokir", // RKAKL Detail specific
  ],
  rkakl_detail: [
    "cutOff", // No cutOff needed for RKAKL Detail since no realisasi
    // "register" filter restored for RKAKL Detail scope
    "kemiskinanEkstrim",
    "belanjaPemilu",
    "ibuKotaNusantara",
    "ketahananPangan",
    "swasembadaPangan",
    "belanjaPemerintah",
    "mbgIntervensi",
    "jenisProgramStrategis",
    "jenisPn",
    "programPrioritas",
    "kegiatanPrioritas",
    "proyekPrioritas",
    "jenisMajorProject",
    "jenisInflasiIntervensi",
    "jenisInflasiPengeluaran",
    "stuntingIntervensi",
    "jenisTemaAnggaran",
  ],
  general: [],
};

/**
 * Dynamic exclusions for Belanja scope.
 * This preserves the existing logic:
 * - If tipeLaporan === "volume_output_kegiatan": hide akun, sumberDana, register
 * - Else: hide tematik mandatory keys and specified tematik switches
 */
export function getBelanjaDynamicExclusions(
  tipeLaporan?: string,
): string[] {
  const filtersToExclude: string[] = [];

  if (tipeLaporan === "volume_output_kegiatan") {
    // For tipe 7, hide these filters: akun, sumberDana, register
    const hideOnTipe7 = ["akun", "sumberDana", "register"];
    filtersToExclude.push(...hideOnTipe7);
  } else {
    // For non-tipe 7:
    // 1) Hide all tematik mandatory filters (PN/MP/Inflasi/Stunting/MBG, etc.)
    const tematikMandatoryKeys = getAllMandatoryFilterKeys();
    filtersToExclude.push(...tematikMandatoryKeys);

    // 2) Also hide switch-type tematik filters from Belanja unless tipe 7:
    //    kemiskinanEkstrim, belanjaPemilu, ibuKotaNusantara, ketahananPangan
    const tematikSwitchesToHide = [
      "kemiskinanEkstrim",
      "belanjaPemilu",
      "ibuKotaNusantara",
      "ketahananPangan",
    ];
    filtersToExclude.push(...tematikSwitchesToHide);
  }

  return filtersToExclude;
}
