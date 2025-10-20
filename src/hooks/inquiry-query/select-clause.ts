import { FilterConfig, FilterValue } from "./types";
import { getCategoryMandatoryColumns, getCategoryQueryConfig } from "@/components/inquiry-data/categoryRegistry";
import { getReportTypeConfig, MONTH_NAMES } from "./report-config";
import { getPembulatanDivisor, MONTH_LABELS } from "./utils";

// getFilterConfigMap remains sourced from original registry to preserve behavior
import { getFilterConfigMap } from "@/components/inquiry-data/filterRegistry";
const FILTER_CONFIG: Record<string, FilterConfig> = getFilterConfigMap() as any;

export function buildSelectClause(
  activeFilters: string[],
  filterValues: Record<string, FilterValue>,
  reportParams: { pembulatan: string; tahun: string; tipeLaporan: string; jenisAkumulasi?: string }
) {
  const selectColumns: string[] = [];
  const joinTables: string[] = [];
  const joinedTables = new Set<string>();
  const cfg = getReportTypeConfig(reportParams.tipeLaporan);

  const buildRegisterSelectAndJoins = (params: {
    jenisTampilan: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
    includeRefColumns: boolean;
    refAlias?: string;
  }) => {
    const { jenisTampilan, includeRefColumns, refAlias } = params;
    selectColumns.push(`main.register_normalized AS register_kode`);

    const year = reportParams.tahun || new Date().getFullYear();
    const detailAlias = "detail_ref";
    const detailJoinTable = `monev${year}.m_detail_harian_${year}`;
    if (!joinedTables.has(detailAlias)) {
      joinTables.push(
        `LEFT JOIN (\n                    SELECT \n                      COALESCE(NULLIF(register, ''), '-') AS register_normalized,\n                      MAX(kdctarik) AS kdctarik\n                    FROM ${detailJoinTable}\n                    GROUP BY COALESCE(NULLIF(register, ''), '-')\n                  ) AS ${detailAlias} ON main.register_normalized = ${detailAlias}.register_normalized`
      );
      joinedTables.add(detailAlias);
    }

    if (jenisTampilan !== "uraian") {
      selectColumns.push(`COALESCE(MAX(${detailAlias}.kdctarik), 0) AS kdctarik`);
    }

    if (includeRefColumns && refAlias) {
      if (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") {
        const ctarikAlias = "ctarik_ref";
        const ctarikJoinTable = `dbref.t_ctarik_${year}`;
        if (!joinedTables.has(ctarikAlias)) {
          joinTables.push(
            `LEFT JOIN ${ctarikJoinTable} AS ${ctarikAlias} ON COALESCE(${detailAlias}.kdctarik, 0) = ${ctarikAlias}.kdctarik`
          );
          joinedTables.add(ctarikAlias);
        }
        selectColumns.push(`${ctarikAlias}.nmctarik AS kdctarik_uraian`);
      }

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

  const uniqueActiveFilters = Array.from(new Set(activeFilters));

  uniqueActiveFilters.forEach((filterKey) => {
    if (filterKey === "cutOff") return;

    const config = FILTER_CONFIG[filterKey];
    if (!config) return;

    if (filterKey === "jenisKontrak") {
      selectColumns.push(
        "CASE WHEN SUBSTR(main.can,16,1) = '0' THEN 'SYC' WHEN SUBSTR(main.can,16,1) <> '0' THEN 'MYC' END AS tipe_kontrak"
      );
      return;
    }

    if (
      filterKey === "kemiskinanEkstrim" ||
      filterKey === "belanjaPemilu" ||
      filterKey === "ibuKotaNusantara" ||
      filterKey === "ketahananPangan" ||
      filterKey === "swasembadaPangan"
    ) {
      selectColumns.push(`main.${config.columnName} AS ${filterKey}`);
      return;
    }

    const filterValue = filterValues[filterKey];
    const jenisTampilan = filterValue?.jenisTampilan || "kode";
    const mengandungKata = filterValue?.mengandungKata;

    if (filterKey === "jenisProgramStrategis") {
      if (jenisTampilan !== "jangan_tampilkan") {
        switch (jenisTampilan) {
          case "kode":
            selectColumns.push(`main.${config.columnName} AS ${filterKey}_kode`);
            break;
          case "uraian":
            selectColumns.push(`main.nmprogis AS ${filterKey}_uraian`);
            break;
          case "kode_uraian":
            selectColumns.push(`main.${config.columnName} AS ${filterKey}_kode`);
            selectColumns.push(`main.nmprogis AS ${filterKey}_uraian`);
            break;
        }
      }
      return;
    }

    const alias = `${filterKey}_ref`;
    const needsJoinForSelect =
      config.referenceTable && config.referenceDatabase && (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian");
    const needsJoinForWhere =
      config.referenceTable && config.referenceDatabase && mengandungKata && mengandungKata.trim();

    if ((needsJoinForSelect || needsJoinForWhere) && !joinedTables.has(alias)) {
      let referenceTable = config.referenceTable!;
      let joinKey = config.joinKey!;
      let joinCondition = `main.${config.columnName} = ${alias}.${joinKey}`;

      if (filterKey === "programPrioritas") {
        joinCondition = `main.kdpn = ${alias}.kdpn AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "kegiatanPrioritas") {
        joinCondition = `main.kdpn = ${alias}.kdpn AND main.kdpp = ${alias}.kdpp AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "proyekPrioritas") {
        joinCondition = `main.kdpn = ${alias}.kdpn AND main.kdpp = ${alias}.kdpp AND main.kdkp = ${alias}.kdkp AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "program") {
        joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "kegiatan") {
        joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdprogram = ${alias}.kdprogram AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "outputKro") {
        joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "subOutputRo") {
        joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.kdoutput = ${alias}.kdoutput AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "komponen") {
        joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdsatker = ${alias}.kdsatker AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.kdoutput = ${alias}.kdoutput AND main.kdsoutput = ${alias}.kdsoutput AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "subKomponen") {
        joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdsatker = ${alias}.kdsatker AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.kdoutput = ${alias}.kdoutput AND main.kdsoutput = ${alias}.kdsoutput AND main.kdkmpnen = ${alias}.kdkmpnen AND main.${config.columnName} = ${alias}.${joinKey}`;
      }

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
      } else if (filterKey === "kodeBkpk") {
        joinCondition = `LEFT(main.${config.columnName}, 4) = ${alias}.${config.joinKey}`;
      } else if (filterKey === "jenisBelanja") {
        joinCondition = `LEFT(main.${config.columnName}, 2) = ${alias}.${config.joinKey}`;
      }

      const year = reportParams.tahun || new Date().getFullYear();
      const joinTable = `${config.referenceDatabase}.${referenceTable}_${year}`;
      joinTables.push(`LEFT JOIN ${joinTable} AS ${alias} ON ${joinCondition}`);
      joinedTables.add(alias);
    }

    if (jenisTampilan !== "jangan_tampilkan") {
      if (filterKey === "register") {
        buildRegisterSelectAndJoins({ jenisTampilan, includeRefColumns: Boolean(needsJoinForSelect || needsJoinForWhere), refAlias: `${filterKey}_ref` });
        return;
      }

      if (config.referenceTable && config.referenceDatabase) {
        let nameColumn = config.nameColumn!;
        if (filterKey === "akun" && filterValue?.akunType) {
          if (filterValue.akunType === "kodeBkpk") nameColumn = "nmbkpk";
          else if (filterValue.akunType === "jenisBelanja") nameColumn = "nmgbkpk";
        }
        switch (jenisTampilan) {
          case "kode": {
            if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
              selectColumns.push(`LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`);
            } else if (filterKey === "akun" && filterValue?.akunType === "jenisBelanja") {
              selectColumns.push(`LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`);
            } else if (filterKey === "kodeBkpk") {
              selectColumns.push(`LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`);
            } else if (filterKey === "jenisBelanja") {
              selectColumns.push(`LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`);
            } else if (filterKey !== "register") {
              selectColumns.push(`main.${config.columnName} AS ${filterKey}_kode`);
            }
            break;
          }
          case "uraian": {
            selectColumns.push(`${alias}.${nameColumn} AS ${filterKey}_uraian`);
            break;
          }
          case "kode_uraian": {
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
        }
      } else {
        switch (jenisTampilan) {
          case "kode":
            selectColumns.push(`main.${config.columnName} AS ${filterKey}`);
            break;
          case "uraian":
            if (config.nameColumn) selectColumns.push(`${config.nameColumn} AS ${filterKey}_uraian`);
            else selectColumns.push(`main.${config.columnName} AS ${filterKey}_uraian`);
            break;
          case "kode_uraian":
            selectColumns.push(`main.${config.columnName} AS ${filterKey}`);
            if (config.nameColumn) selectColumns.push(`${config.nameColumn} AS ${filterKey}_uraian`);
            else selectColumns.push(`main.${config.columnName} AS ${filterKey}_uraian`);
            break;
        }
      }
    }
  });

  const pembulatan = reportParams.pembulatan || "satuan";
  const divisor = getPembulatanDivisor(pembulatan);

  const tematikKategori = (reportParams as { tematikKategori?: string }).tematikKategori;
  if (tematikKategori) {
    const mandatoryColumns = getCategoryMandatoryColumns(tematikKategori);
    const categoryMandatoryColumns = mandatoryColumns
      .sort((a, b) => a.order - b.order)
      .map((col) => col.sqlExpression.replace(/\{divisor\}/g, divisor.toString()) + ` AS ${col.key}`);
    selectColumns.push(...categoryMandatoryColumns);
  }

  const cutOffMonth = filterValues.cutOff?.selection || "12";
  const cutOffNum = parseInt(cutOffMonth);

  const realizationColumns: string[] = [];
  for (let month = 1; month <= cutOffNum; month++) realizationColumns.push(`real${month}`);
  const realizationSum = realizationColumns.join(" + ");

  if (reportParams.tipeLaporan === "semua_kontrak") {
    selectColumns.push("main.nokontrak AS nokontrak");
    selectColumns.push("main.can AS can");
    selectColumns.push("CAST(main.tgkontrak AS CHAR) AS tgkontrak");
    selectColumns.push("CAST(main.tgterima AS CHAR) AS tgterima");
    selectColumns.push("main.termin_ke AS termin_ke");
    selectColumns.push("CAST(main.tgljatuhtempo_termin AS CHAR) AS tgljatuhtempo_termin");
    selectColumns.push("CAST(main.tgljatuhtempo AS CHAR) AS tgljatuhtempo");
    selectColumns.push("main.deskripsi AS deskripsi");
    selectColumns.push(`ROUND(SUM(CONVERT(main.pagu, SIGNED)) / ${divisor}, 0) AS PAGU_KONTRAK`);
    selectColumns.push(`ROUND(SUM(main.realisasi) / ${divisor}, 0) AS REALISASI_KONTRAK`);
    return { selectColumns, joinTables };
  }

  if (reportParams.tipeLaporan === "kontrak_valas") {
    selectColumns.push("main.currency AS currency");
    selectColumns.push("main.kurs_user AS kurs_user");
    selectColumns.push("main.nokontrak AS nokontrak");
    selectColumns.push("CAST(main.tgkontrak AS CHAR) AS tgkontrak");
    selectColumns.push("CAST(main.tgterima AS CHAR) AS tgterima");
    selectColumns.push("main.termin_ke AS termin_ke");
    selectColumns.push("CAST(main.tgljatuhtempo_termin AS CHAR) AS tgljatuhtempo_termin");
    selectColumns.push("CAST(main.tgljatuhtempo AS CHAR) AS tgljatuhtempo");
    selectColumns.push("main.deskripsi AS deskripsi");
    selectColumns.push(`ROUND(SUM(CONVERT(main.pagu, SIGNED)) / ${divisor}, 0) AS PAGU_KONTRAK`);
    selectColumns.push(`ROUND(SUM(main.realisasi) / ${divisor}, 0) AS REALISASI_KONTRAK`);
    return { selectColumns, joinTables };
  }

  if (reportParams.tipeLaporan === "pagu_apbn") {
    selectColumns.push(`ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / ${divisor}, 0) AS PAGU_APBN`);
    selectColumns.push(`ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU_DIPA`);
  } else if (reportParams.tipeLaporan === "pagu_dan_blokir") {
    selectColumns.push(`ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU`);
    selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
  } else if (
    reportParams.tipeLaporan !== "pergerakan_pagu_bulanan" &&
    reportParams.tipeLaporan !== "pergerakan_blokir_bulanan" &&
    reportParams.tipeLaporan !== "pergerakan_blokir_bulanan_per_jenis"
  ) {
    // Include PAGU_DIPA for tipe laporan 1, 2, 3, and 7 (exclude 4, 5, 6)
    selectColumns.push(`ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU_DIPA`);
  }

  if (reportParams.tipeLaporan === "pagu_realisasi_bulanan") {
    const jenisAkumulasi = reportParams.jenisAkumulasi || "non_akumulatif";
    for (let month = 1; month <= cutOffNum; month++) {
      const monthName = MONTH_NAMES[month - 1];
      if (jenisAkumulasi === "akumulatif") {
        const cumulativeRealColumns: string[] = [];
        for (let i = 1; i <= month; i++) cumulativeRealColumns.push(`real${i}`);
        const cumulativeSum = cumulativeRealColumns.join(" + ");
        selectColumns.push(`ROUND(SUM(${cumulativeSum}) / ${divisor}, 0) AS ${monthName}`);
      } else {
        selectColumns.push(`ROUND(SUM(real${month}) / ${divisor}, 0) AS ${monthName}`);
      }
    }
    selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
  } else if (reportParams.tipeLaporan === "pergerakan_pagu_bulanan") {
    for (let month = 1; month <= cutOffNum; month++) {
      const monthName = MONTH_NAMES[month - 1];
      selectColumns.push(`ROUND(SUM(pagu${month}) / ${divisor}, 0) AS ${monthName}`);
    }
  } else if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan") {
    for (let month = 1; month <= cutOffNum; month++) {
      const monthName = MONTH_NAMES[month - 1];
      selectColumns.push(`ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`);
    }
  } else if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis") {
    selectColumns.push(`main.kdblokir AS kdblokir_kode`);
    selectColumns.push(`main.nmblokir AS nmblokir_uraian`);
    for (let month = 1; month <= cutOffNum; month++) {
      const monthName = MONTH_NAMES[month - 1];
      selectColumns.push(`ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`);
    }
  } else if (reportParams.tipeLaporan === "pagu_dan_blokir") {
    // nothing extra
  } else if (getReportTypeConfig(reportParams.tipeLaporan).isVolumeOutput) {
    const monthly: Array<[string, string]> = [];
    for (let m = 1; m <= cutOffNum; m++) {
      const aliasR = `r${MONTH_LABELS[m - 1]}`;
      const aliasP = `p${MONTH_LABELS[m - 1]}`;
      const aliasRP = `rp${MONTH_LABELS[m - 1]}`;
      monthly.push([`real${m}`, aliasR]);
      monthly.push([`persen${m}`, aliasP]);
      monthly.push([`realfisik${m}`, aliasRP]);
    }
    monthly.forEach(([col, alias]) => {
      if (/^r(jan|feb|mar|apr|mei|jun|jul|ags|sep|okt|nov|des)$/i.test(alias)) {
        selectColumns.push(`ROUND(SUM(main.${col}) / ${divisor}, 0) AS ${alias}`);
      } else {
        selectColumns.push(`SUM(main.${col}) AS ${alias}`);
      }
    });
    selectColumns.push(`main.os AS os`);
    selectColumns.push(`main.ket AS ket`);
  } else {
    selectColumns.push(`ROUND(SUM(${realizationSum}) / ${divisor}, 0) AS REALISASI`);
    if (cfg.addBlokirAfterReal) selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
  }

  return { selectColumns, joinTables };
}
