import { getAllMandatoryFilterKeys } from "./categoryRegistry";

/**
 * Base scope exclusions by page scope. These are static business rules.
 * Do not modify behavior when moving from filterRegistry.ts.
 */
export const SCOPE_EXCLUSIONS_BASE: Record<
  "belanja" | "tematik" | "rkakl_detail" | "kontrak" | "up_tup" | "penerimaan_pnbp" | "sp2d" | "general",
  string[]
> = {
  belanja: [
    // "cutOff", // Allow cutOff switch on Belanja page (like tematik)
    "belanjaPemerintah", // Bantuan Pemerintah
    "mbgIntervensi", // Makan Bergizi Gratis
    "swasembadaPangan", // Swasembada Pangan
    "jenisProgramStrategis", // Program Strategis (not used on Belanja page)
    "komponen", // RKAKL Detail specific
    "subKomponen", // RKAKL Detail specific
    "item", // RKAKL Detail specific
    "jenisBlokir", // RKAKL Detail specific
    // Kontrak-specific filter should not appear on Belanja
    "jenisKontrak",
    // Status Sumber only on Penerimaan PNBP
    "statusSumber",
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
    // Kontrak-specific filter should not appear on Tematik
    "jenisKontrak",
    // Status Sumber only on Penerimaan PNBP
    "statusSumber",
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
    // Kontrak-specific filter should not appear on RKAKL Detail
    "jenisKontrak",
    // Status Sumber only on Penerimaan PNBP
    "statusSumber",
  ],
  kontrak: [
    // Explicitly exclude all filters that are NOT required on Kontrak page.
    // Allowed (visible) filters on Kontrak page:
    // - kementerian, eselonI, kewenangan, kanwil, kppn, satker,
    //   program, kegiatan, outputKro, sumberDana, akun
    // Everything else should be hidden via exclusions below.
    "provinsi",
    "kabkota",
    "fungsi",
    "subFungsi",
    // Tematik & special switches not used on Kontrak
    "jenisPn",
    "programPrioritas",
    "kegiatanPrioritas",
    "proyekPrioritas",
    "jenisMajorProject",
    "jenisInflasiIntervensi",
    "jenisInflasiPengeluaran",
    "stuntingIntervensi",
    "mbgIntervensi",
    "jenisProgramStrategis",
    "jenisTemaAnggaran",
    "kemiskinanEkstrim",
    "belanjaPemilu",
    "ibuKotaNusantara",
    "ketahananPangan",
    "swasembadaPangan",
    "belanjaPemerintah",
    // RKAKL Detail specific hierarchy not needed on Kontrak
    "subOutputRo",
    "komponen",
    "subKomponen",
    "item",
    // Internal akun variants not shown on UI
    "kodeBkpk",
    "jenisBelanja",
    // Other UI filters not required
    "register",
    "jenisBlokir",
    // Status Sumber only on Penerimaan PNBP
    "statusSumber",
  ],
  up_tup: [
    // Allowed filters on UP/TUP page:
    // - cutOff, kementerian, eselonI, kewenangan, kanwil, kppn, satker, akun
    // Everything else should be excluded
    "provinsi",
    "kabkota",
    "fungsi",
    "subFungsi",
    // Tematik & special switches not used on UP/TUP
    "jenisPn",
    "programPrioritas",
    "kegiatanPrioritas",
    "proyekPrioritas",
    "jenisMajorProject",
    "jenisInflasiIntervensi",
    "jenisInflasiPengeluaran",
    "stuntingIntervensi",
    "mbgIntervensi",
    "jenisProgramStrategis",
    "jenisTemaAnggaran",
    "kemiskinanEkstrim",
    "belanjaPemilu",
    "ibuKotaNusantara",
    "ketahananPangan",
    "swasembadaPangan",
    "belanjaPemerintah",
    // RKAKL Detail specific hierarchy not needed on UP/TUP
    "subOutputRo",
    "komponen",
    "subKomponen",
    "item",
    // Internal akun variants not shown on UI
    "kodeBkpk",
    "jenisBelanja",
    // Other UI filters not required on UP/TUP
    "register",
    "jenisBlokir",
    // Kontrak-specific filters not needed on UP/TUP
    "jenisKontrak",
    // UP/TUP doesn't use these hierarchy filters
    "program",
    "kegiatan",
    "outputKro",
    "sumberDana",
    // Status Sumber not used on UP/TUP
    "statusSumber",
  ],
  penerimaan_pnbp: [
    // Allowed filters on Penerimaan PNBP page:
    // - cutOff, kementerian, eselonI, kewenangan, provinsi, kabkota, kanwil, kppn, satker, akun
    // Everything else should be excluded
    "fungsi",
    "subFungsi",
    // Tematik & special switches not used on Penerimaan PNBP
    "jenisPn",
    "programPrioritas",
    "kegiatanPrioritas",
    "proyekPrioritas",
    "jenisMajorProject",
    "jenisInflasiIntervensi",
    "jenisInflasiPengeluaran",
    "stuntingIntervensi",
    "mbgIntervensi",
    "jenisProgramStrategis",
    "jenisTemaAnggaran",
    "kemiskinanEkstrim",
    "belanjaPemilu",
    "ibuKotaNusantara",
    "ketahananPangan",
    "swasembadaPangan",
    "belanjaPemerintah",
    // RKAKL Detail specific hierarchy not needed
    "subOutputRo",
    "komponen",
    "subKomponen",
    "item",
    // Internal akun variants not shown on UI
    "kodeBkpk",
    "jenisBelanja",
    // Other UI filters not required
    "register",
    "jenisBlokir",
    // Kontrak-specific filters not needed
    "jenisKontrak",
    // Penerimaan PNBP doesn't use these hierarchy filters
    "program",
    "kegiatan",
    "outputKro",
    "sumberDana",
  ],
  general: [
    // Status Sumber only on Penerimaan PNBP
    "statusSumber",
  ],
  sp2d: [
    // Allowed filters on SP2D page:
    // - kementerian, eselonI, kewenangan, kppn, satker, program, kegiatan, sumberDana, outputKro, akun
    // Everything else should be excluded
    "cutOff", // No cutOff needed for SP2D
    "provinsi",
    "kabkota",
    "kanwil",
    "fungsi",
    "subFungsi",
    // Tematik & special switches not used on SP2D
    "jenisPn",
    "programPrioritas",
    "kegiatanPrioritas",
    "proyekPrioritas",
    "jenisMajorProject",
    "jenisInflasiIntervensi",
    "jenisInflasiPengeluaran",
    "stuntingIntervensi",
    "mbgIntervensi",
    "jenisProgramStrategis",
    "jenisTemaAnggaran",
    "kemiskinanEkstrim",
    "belanjaPemilu",
    "ibuKotaNusantara",
    "ketahananPangan",
    "swasembadaPangan",
    "belanjaPemerintah",
    // RKAKL Detail specific hierarchy not needed on SP2D
    "subOutputRo",
    "komponen",
    "subKomponen",
    "item",
    // Internal akun variants not shown on UI
    "kodeBkpk",
    "jenisBelanja",
    // Other UI filters not required on SP2D
    "register",
    "jenisBlokir",
    // Kontrak-specific filters not needed on SP2D
    "jenisKontrak",
    // Status Sumber only on Penerimaan PNBP
    "statusSumber",
  ],
};

/**
 * Dynamic exclusions for Belanja scope.
 * This preserves the existing logic:
 * - If tipeLaporan === "volume_output_kegiatan": hide akun, sumberDana, register
 * - Else: hide tematik mandatory keys, specified tematik switches, and subOutputRo
 */
export function getBelanjaDynamicExclusions(
  tipeLaporan?: string,
): string[] {
  const filtersToExclude: string[] = [];

  if (tipeLaporan === "volume_output_kegiatan") {
    // For tipe 7 (Volume Output Kegiatan), hide these filters: akun, sumberDana, register
    const hideOnTipe7 = ["akun", "sumberDana", "register"];
    filtersToExclude.push(...hideOnTipe7);
    // subOutputRo is shown only for tipe 7, so don't exclude it here
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

    // 3) Hide subOutputRo for all report types except Volume Output Kegiatan (tipe 7)
    filtersToExclude.push("subOutputRo");
  }

  return filtersToExclude;
}
