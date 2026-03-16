import { FilterConfig, FilterValue } from "./types";
import {
  getCategoryMandatoryColumns,
  getCategoryQueryConfig,
} from "@/components/inquiry-data/categoryRegistry";
import { getReportTypeConfig, MONTH_NAMES } from "./report-config";
import { getPembulatanDivisor, MONTH_LABELS } from "./utils";

// getFilterConfigMap remains sourced from original registry to preserve behavior
import { getFilterConfigMap } from "@/components/inquiry-data/filterRegistry";
const FILTER_CONFIG: Record<string, FilterConfig> = getFilterConfigMap() as any;

export function buildSelectClause(
  activeFilters: string[],
  filterValues: Record<string, FilterValue>,
  reportParams: {
    pembulatan: string;
    tahun: string;
    tipeLaporan: string;
    jenisAkumulasi?: string;
  },
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
    selectColumns.push(`main.register AS register_kode`);

    // The register filter uses reference table join for filtering
    // No additional detail table join needed

    if (jenisTampilan !== "uraian" && includeRefColumns && refAlias) {
      selectColumns.push(`COALESCE(MAX(${refAlias}.kddonor), '0') AS kdctarik`);
    }

    if (includeRefColumns && refAlias) {
      if (jenisTampilan === "uraian" || jenisTampilan === "kode_uraian") {
        selectColumns.push(`${refAlias}.nmdonor AS kdctarik_uraian`);
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
        "CASE WHEN SUBSTR(main.can,16,1) = '0' THEN 'SYC' WHEN SUBSTR(main.can,16,1) <> '0' THEN 'MYC' END AS tipe_kontrak",
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

    if (filterKey === "statusSumber") {
      const jenisTampilan = filterValue?.jenisTampilan || "kode";
      const alias = "statusSumber_ref";

      if (jenisTampilan !== "jangan_tampilkan") {
        switch (jenisTampilan) {
          case "kode":
            selectColumns.push(`main.JE_SOURCE AS statusSumber_kode`);
            break;
          case "uraian":
            const sumberJoinTable = `dbref.t_sumber_pnp`;
            if (!joinedTables.has(alias)) {
              joinTables.push(
                `LEFT JOIN ${sumberJoinTable} AS ${alias} ON main.JE_SOURCE = ${alias}.JE_SOURCE`,
              );
              joinedTables.add(alias);
            }
            selectColumns.push(`${alias}.nmsumber AS statusSumber_uraian`);
            break;
          case "kode_uraian":
            const sumberJoinTable2 = `dbref.t_sumber_pnp`;
            if (!joinedTables.has(alias)) {
              joinTables.push(
                `LEFT JOIN ${sumberJoinTable2} AS ${alias} ON main.JE_SOURCE = ${alias}.JE_SOURCE`,
              );
              joinedTables.add(alias);
            }
            selectColumns.push(`main.JE_SOURCE AS statusSumber_kode`);
            selectColumns.push(`${alias}.nmsumber AS statusSumber_uraian`);
            break;
        }
      }
      return;
    }

    if (filterKey === "jenisProgramStrategis") {
      if (jenisTampilan !== "jangan_tampilkan") {
        switch (jenisTampilan) {
          case "kode":
            selectColumns.push(
              `main.${config.columnName} AS ${filterKey}_kode`,
            );
            break;
          case "uraian":
            selectColumns.push(`main.nmprogis AS ${filterKey}_uraian`);
            break;
          case "kode_uraian":
            selectColumns.push(
              `main.${config.columnName} AS ${filterKey}_kode`,
            );
            selectColumns.push(`main.nmprogis AS ${filterKey}_uraian`);
            break;
        }
      }
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

    if ((needsJoinForSelect || needsJoinForWhere) && !joinedTables.has(alias)) {
      let referenceTable = config.referenceTable!;
      let joinKey = config.joinKey!;
      let joinCondition = `main.${config.columnName} = ${alias}.${joinKey}`;

      if (filterKey === "eselonI") {
        joinCondition = `main.kddept = ${alias}.kddept AND main.${config.columnName} = ${alias}.${joinKey}`;
      } else if (filterKey === "programPrioritas") {
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
        joinCondition = `main.kddept = ${alias}.kddept AND main.kdunit = ${alias}.kdunit AND main.kdsatker = ${alias}.kdsatker AND main.kdprogram = ${alias}.kdprogram AND main.kdgiat = ${alias}.kdgiat AND main.kdoutput = ${alias}.kdoutput AND main.kdsoutput = ${alias}.kdsoutput AND TRIM(main.${config.columnName}) = ${alias}.${joinKey}`;
      } else if (filterKey === "subKomponen") {
        joinCondition = `TRIM(main.kddept) = ${alias}.kddept AND TRIM(main.kdunit) = ${alias}.kdunit AND TRIM(main.kdsatker) = ${alias}.kdsatker AND TRIM(main.kdprogram) = ${alias}.kdprogram AND TRIM(main.kdgiat) = ${alias}.kdgiat AND TRIM(main.kdoutput) = ${alias}.kdoutput AND TRIM(main.kdsoutput) = ${alias}.kdsoutput AND TRIM(main.kdkmpnen) = ${alias}.kdkmpnen AND TRIM(main.${config.columnName}) = TRIM(${alias}.${joinKey})`;
      } else if (filterKey === "subFungsi") {
        // Trim both sides for subFungsi to handle trailing spaces
        joinCondition = `TRIM(main.kdfungsi) = TRIM(${alias}.kdfungsi) AND TRIM(main.${config.columnName}) = TRIM(${alias}.${joinKey})`;
      } else if (filterKey === "kabkota") {
        // Hierarchical join via kdlokasi + kdkabkota for correct reference
        joinCondition = `main.kdlokasi = ${alias}.kdlokasi AND main.${config.columnName} = ${alias}.${joinKey}`;
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
      const joinTable = config.noYearSuffix
        ? `${config.referenceDatabase}.${referenceTable}`
        : `${config.referenceDatabase}.${referenceTable}_${year}`;
      joinTables.push(`LEFT JOIN ${joinTable} AS ${alias} ON ${joinCondition}`);
      joinedTables.add(alias);
    }

    if (jenisTampilan !== "jangan_tampilkan") {
      if (filterKey === "register") {
        // Register filter always needs the reference table for WHERE clause filtering
        const alias = `${filterKey}_ref`;
        const registerConfig = FILTER_CONFIG["register"];
        if (registerConfig) {
          const year = reportParams.tahun || new Date().getFullYear();
          const joinTable = `${registerConfig.referenceDatabase}.${registerConfig.referenceTable}_${year}`;
          const joinCondition = `main.${registerConfig.columnName} = ${alias}.${registerConfig.joinKey}`;

          if (!joinedTables.has(alias)) {
            joinTables.push(
              `LEFT JOIN ${joinTable} AS ${alias} ON ${joinCondition}`,
            );
            joinedTables.add(alias);
          }

          buildRegisterSelectAndJoins({
            jenisTampilan,
            includeRefColumns: Boolean(needsJoinForSelect || needsJoinForWhere),
            refAlias: alias,
          });
        } else {
          // Fallback: just select the register column without reference table
          selectColumns.push(`main.register AS register_kode`);
        }
        return;
      }

      if (config.referenceTable && config.referenceDatabase) {
        let nameColumn = config.nameColumn!;
        if (filterKey === "akun" && filterValue?.akunType) {
          if (filterValue.akunType === "kodeBkpk") nameColumn = "nmbkpk";
          else if (filterValue.akunType === "jenisBelanja")
            nameColumn = "nmgbkpk";
        }
        switch (jenisTampilan) {
          case "kode": {
            if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
              selectColumns.push(
                `LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`,
              );
            } else if (
              filterKey === "akun" &&
              filterValue?.akunType === "jenisBelanja"
            ) {
              selectColumns.push(
                `LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`,
              );
            } else if (filterKey === "kodeBkpk") {
              selectColumns.push(
                `LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`,
              );
            } else if (filterKey === "jenisBelanja") {
              selectColumns.push(
                `LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`,
              );
            } else if (
              filterKey === "komponen" ||
              filterKey === "subKomponen" ||
              filterKey === "subFungsi"
            ) {
              // Trim kode for columns with trailing spaces
              selectColumns.push(
                `TRIM(main.${config.columnName}) AS ${filterKey}_kode`,
              );
            } else if (filterKey !== "register") {
              selectColumns.push(
                `main.${config.columnName} AS ${filterKey}_kode`,
              );
            }
            break;
          }
          case "uraian": {
            selectColumns.push(`${alias}.${nameColumn} AS ${filterKey}_uraian`);
            break;
          }
          case "kode_uraian": {
            if (filterKey === "akun" && filterValue?.akunType === "kodeBkpk") {
              selectColumns.push(
                `LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`,
              );
            } else if (
              filterKey === "akun" &&
              filterValue?.akunType === "jenisBelanja"
            ) {
              selectColumns.push(
                `LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`,
              );
            } else if (filterKey === "kodeBkpk") {
              selectColumns.push(
                `LEFT(main.${config.columnName}, 4) AS ${filterKey}_kode`,
              );
            } else if (filterKey === "jenisBelanja") {
              selectColumns.push(
                `LEFT(main.${config.columnName}, 2) AS ${filterKey}_kode`,
              );
            } else if (
              filterKey === "komponen" ||
              filterKey === "subKomponen" ||
              filterKey === "subFungsi"
            ) {
              // Trim kode for columns with trailing spaces
              selectColumns.push(
                `TRIM(main.${config.columnName}) AS ${filterKey}_kode`,
              );
            } else {
              selectColumns.push(
                `main.${config.columnName} AS ${filterKey}_kode`,
              );
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
            if (config.nameColumn)
              selectColumns.push(`${config.nameColumn} AS ${filterKey}_uraian`);
            else
              selectColumns.push(
                `main.${config.columnName} AS ${filterKey}_uraian`,
              );
            break;
          case "kode_uraian":
            selectColumns.push(`main.${config.columnName} AS ${filterKey}`);
            if (config.nameColumn)
              selectColumns.push(`${config.nameColumn} AS ${filterKey}_uraian`);
            else
              selectColumns.push(
                `main.${config.columnName} AS ${filterKey}_uraian`,
              );
            break;
        }
      }
    }
  });

  const pembulatan = reportParams.pembulatan || "satuan";
  const divisor = getPembulatanDivisor(pembulatan);

  const tematikKategori = (reportParams as { tematikKategori?: string })
    .tematikKategori;
  if (tematikKategori && reportParams.tipeLaporan !== "revisi_dipa") {
    const mandatoryColumns = getCategoryMandatoryColumns(tematikKategori);
    const categoryMandatoryColumns = mandatoryColumns
      .sort((a, b) => a.order - b.order)
      .map(
        (col) =>
          col.sqlExpression.replace(/\{divisor\}/g, divisor.toString()) +
          ` AS ${col.key}`,
      );
    selectColumns.push(...categoryMandatoryColumns);
  }

  const cutOffMonth = filterValues.cutOff?.selection || "12";
  const cutOffNum = parseInt(cutOffMonth);

  const realizationColumns: string[] = [];
  for (let month = 1; month <= cutOffNum; month++)
    realizationColumns.push(`real${month}`);
  const realizationSum = realizationColumns.join(" + ");

  if (reportParams.tipeLaporan === "semua_kontrak") {
    selectColumns.push("main.nokontrak AS nokontrak");
    selectColumns.push("main.can AS can");
    selectColumns.push("CAST(main.tgkontrak AS CHAR) AS tgkontrak");
    selectColumns.push("CAST(main.tgterima AS CHAR) AS tgterima");
    selectColumns.push("main.termin_ke AS termin_ke");
    selectColumns.push(
      "CAST(main.tgljatuhtempo_termin AS CHAR) AS tgljatuhtempo_termin",
    );
    selectColumns.push("CAST(main.tgljatuhtempo AS CHAR) AS tgljatuhtempo");
    selectColumns.push("main.deskripsi AS deskripsi");
    selectColumns.push(
      `ROUND(SUM(CONVERT(main.pagu, SIGNED)) / ${divisor}, 0) AS PAGU_KONTRAK`,
    );
    selectColumns.push(
      `ROUND(SUM(main.realisasi) / ${divisor}, 0) AS REALISASI_KONTRAK`,
    );
    return { selectColumns, joinTables };
  }

  if (reportParams.tipeLaporan === "kontrak_valas") {
    selectColumns.push("main.currency AS currency");
    selectColumns.push("main.kurs_user AS kurs_user");
    selectColumns.push("main.nokontrak AS nokontrak");
    selectColumns.push("CAST(main.tgkontrak AS CHAR) AS tgkontrak");
    selectColumns.push("CAST(main.tgterima AS CHAR) AS tgterima");
    selectColumns.push("main.termin_ke AS termin_ke");
    selectColumns.push(
      "CAST(main.tgljatuhtempo_termin AS CHAR) AS tgljatuhtempo_termin",
    );
    selectColumns.push("CAST(main.tgljatuhtempo AS CHAR) AS tgljatuhtempo");
    selectColumns.push("main.deskripsi AS deskripsi");
    selectColumns.push(
      `ROUND(SUM(CONVERT(main.pagu, SIGNED)) / ${divisor}, 0) AS PAGU_KONTRAK`,
    );
    selectColumns.push(
      `ROUND(SUM(main.realisasi) / ${divisor}, 0) AS REALISASI_KONTRAK`,
    );
    return { selectColumns, joinTables };
  }

  if (reportParams.tipeLaporan === "outstanding_up_tup") {
    selectColumns.push(`ROUND(SUM(main.RUPIAH) / ${divisor}, 0) AS RUPIAH`);
    return { selectColumns, joinTables };
  }

  if (reportParams.tipeLaporan === "detil_penerimaan_pnbp") {
    selectColumns.push(`main.TGPOS AS TGPOS`);
    selectColumns.push(`main.NODOK AS NODOK`);
    selectColumns.push(`ROUND(SUM(main.RUPIAH) / ${divisor}, 0) AS RUPIAH`);
    return { selectColumns, joinTables };
  }

  if (reportParams.tipeLaporan === "spm_sp2d") {
    // SP2D: Select base columns with pembulatan
    selectColumns.push(`ROUND(main.RUPIAH / ${divisor}, 0) AS nilai_sp2d`);
    selectColumns.push(`main.NOSP2D AS nomor_sp2d`);
    selectColumns.push(`main.TGSP2D AS tanggal_sp2d`);
    selectColumns.push(`main.NOSPM AS nomor_spm`);
    selectColumns.push(`main.TGSPM AS tanggal_spm`);
    selectColumns.push(`main.URAIAN AS uraian_sp2d`);
    selectColumns.push(`main.JENSP2D AS jenis_sp2d`);
    selectColumns.push(`main.JENSPM AS jenis_spm`);
    selectColumns.push(`main.TGPOS AS tanggal_posting`);
    return { selectColumns, joinTables };
  }

  if (reportParams.tipeLaporan === "pagu_apbn") {
    selectColumns.push(
      `ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / ${divisor}, 0) AS PAGU_APBN`,
    );
    selectColumns.push(
      `ROUND(SUM(main.pagu_dipa) / ${divisor}, 0) AS PAGU_DIPA`,
    );
  } else if (reportParams.tipeLaporan === "pagu_dan_blokir") {
    selectColumns.push(`ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU`);
    selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
  } else if (
    reportParams.tipeLaporan !== "pergerakan_pagu_bulanan" &&
    reportParams.tipeLaporan !== "pergerakan_blokir_bulanan" &&
    reportParams.tipeLaporan !== "pergerakan_blokir_bulanan_per_jenis" &&
    reportParams.tipeLaporan !== "revisi_dipa"
  ) {
    // Include PAGU_DIPA for tipe laporan 1, 2, 3, and 7 (exclude 4, 5, 6, revisi_dipa)
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
        selectColumns.push(
          `ROUND(SUM(${cumulativeSum}) / ${divisor}, 0) AS ${monthName}`,
        );
      } else {
        selectColumns.push(
          `ROUND(SUM(real${month}) / ${divisor}, 0) AS ${monthName}`,
        );
      }
    }
    selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
  } else if (reportParams.tipeLaporan === "pergerakan_pagu_bulanan") {
    for (let month = 1; month <= cutOffNum; month++) {
      const monthName = MONTH_NAMES[month - 1];
      selectColumns.push(
        `ROUND(SUM(pagu${month}) / ${divisor}, 0) AS ${monthName}`,
      );
    }
  } else if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan") {
    for (let month = 1; month <= cutOffNum; month++) {
      const monthName = MONTH_NAMES[month - 1];
      selectColumns.push(
        `ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`,
      );
    }
  } else if (
    reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis"
  ) {
    selectColumns.push(`main.kdblokir AS kdblokir_kode`);
    selectColumns.push(`main.nmblokir AS nmblokir_uraian`);
    for (let month = 1; month <= cutOffNum; month++) {
      const monthName = MONTH_NAMES[month - 1];
      selectColumns.push(
        `ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`,
      );
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
        selectColumns.push(
          `ROUND(SUM(main.${col}) / ${divisor}, 0) AS ${alias}`,
        );
      } else {
        selectColumns.push(`SUM(main.${col}) AS ${alias}`);
      }
    });
    selectColumns.push(`main.os AS os`);
    selectColumns.push(`main.ket AS ket`);
  } else if (reportParams.tipeLaporan === "revisi_dipa") {
    selectColumns.push(`main.revision_number AS revision_number`);
    selectColumns.push(
      `TO_CHAR(main.TANGGAL, 'YYYY-MM-DD') AS TANGGAL_POSTING`,
    );
    selectColumns.push(`ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU`);
  } else {
    selectColumns.push(
      `ROUND(SUM(${realizationSum}) / ${divisor}, 0) AS REALISASI`,
    );
    if (cfg.addBlokirAfterReal)
      selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
  }

  console.log(selectColumns);

  return { selectColumns, joinTables };
}
