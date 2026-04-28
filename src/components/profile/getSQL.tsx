/**
 * SQL query builders for the KL/Lembaga profile landing pages.
 *
 * Role mapping (Next.js → v3 equivalent):
 *   "kppn"       → role "3"  → filter by kdkppn
 *   "kanwil_djpb"→ role "2"  → filter by kdkanwil
 *   others       → pusat     → no row-level restriction
 */

export interface BaseQueryParams {
  thang: string;
  dept: string;
  unit: string;
  prov: string;
  role: string;
  kodekppn: string;
  kodekanwil: string;
}

export interface GetSQLParams extends BaseQueryParams {
  select: string;
  from: string;
}

export interface GetSQLJenbelParams extends BaseQueryParams {
  selectJenbel: string;
  fromJenbel: string;
}

export interface GetSQLProgramParams extends BaseQueryParams {
  selectProgram: string;
  fromProgram: string;
}

export interface GetSqlPerbandinganParams extends BaseQueryParams {
  selectPerbandingan: string;
  fromPerbandingan: string;
}

export interface GetSqlRpdParams extends BaseQueryParams {
  selectRpd: string;
  fromRpd: string;
}

export interface GetSqlSatkerParams extends BaseQueryParams {
  selectSatker: string;
  fromSatker: string;
}

export interface GetSqlTrenParams extends BaseQueryParams {
  selectTren: string;
  fromTren: string;
}

export interface GetSqlBkpkParams extends BaseQueryParams {
  selectBkpk: string;
  fromBkpk: string;
}

export interface GetSqlDukmanParams extends BaseQueryParams {
  selectDukman: string;
  fromDukman: string;
}

export interface GetSqlTrenJenbelParams extends BaseQueryParams {
  selectTrenJenbel: string;
  fromTrenJenbel: string;
}

export interface GetSqlIkpaParams extends BaseQueryParams {
  selectIkpa: string;
  fromIkpa: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLimitAkses(
  role: string,
  kodekppn: string,
  kodekanwil: string,
): string {
  if (role === "kppn") return `  kdkppn= '${kodekppn}'`;
  if (role === "kanwil_djpb") return `  kdkanwil= '${kodekanwil}'`;
  return "";
}

function buildBaseWhere(
  role: string,
  kodekppn: string,
  kodekanwil: string,
): { where: string; query: string; group: string } {
  const limit = buildLimitAkses(role, kodekppn, kodekanwil);
  return {
    where: limit,
    query: "kddept",
    group: "",
  };
}

// ─── Exported query builders ───────────────────────────────────────────────────

export const getSQL = (p: GetSQLParams): string => {
  const { thang, dept, unit, prov, role, kodekppn, kodekanwil, select, from } =
    p;

  let query = "SELECT ";
  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  query += select + fromClause + from;
  query += ` WHERE kddept<>'999' and thang='${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;
  if (groupByClause) query += ` GROUP BY thang${groupByClause}`;

  return query;
};

export const getSQLJenbel = (p: GetSQLJenbelParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectJenbel,
    fromJenbel,
  } = p;

  let query = "SELECT ";
  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  query += selectJenbel + fromClause + fromJenbel;
  query += ` WHERE kddept<>'999' and thang='${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;

  if (groupByClause) {
    query += ` GROUP BY thang, left(kdbkpk,2)${groupByClause}`;
  } else {
    query += " GROUP BY thang, left(kdbkpk,2)";
  }

  return query;
};

export const getSQLProgram = (p: GetSQLProgramParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectProgram,
    fromProgram,
  } = p;

  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);

  let query = "SELECT ";
  const fromClause = " FROM ";

  query += selectProgram.replace(/^\s*,/, "") + fromClause + fromProgram + " a";
  query += ` LEFT JOIN dbref.t_program_${thang} b ON`;
  query +=
    " a.kddept = b.kddept AND a.kdunit = b.kdunit AND a.kdprogram = b.kdprogram";

  if (dept !== "000") {
    whereClause += (whereClause ? " AND " : "") + ` a.kddept = '${dept}'`;
  }
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + ` a.kdunit = '${unit}'`;
  }
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + ` a.kdkanwil = '${prov}'`;
  }

  query += ` WHERE a.kddept<>'999' and a.thang='${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;
  query += " GROUP BY a.kdprogram, a.kddept, a.kdunit";
  query += " ORDER BY persentase DESC";
  query += " LIMIT 20";

  return query;
};

export const getSqlPerbandingan = (p: GetSqlPerbandinganParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectPerbandingan,
    fromPerbandingan,
  } = p;

  let query = "SELECT ";
  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  query += selectPerbandingan + fromClause + fromPerbandingan;
  query += ` WHERE kddept<>'999' and thang between '${parseInt(thang) - 2}' and '${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;

  if (groupByClause) {
    query += ` GROUP BY thang${groupByClause}`;
  } else {
    query += " GROUP BY thang";
  }

  return query;
};

export const getSqlRpd = (p: GetSqlRpdParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectRpd,
    fromRpd,
  } = p;

  let query = "SELECT ";
  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  query += selectRpd + fromClause + fromRpd;
  query += ` WHERE kddept<>'999' and thang='${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;

  if (groupByClause) {
    query += ` GROUP BY thang${groupByClause}`;
  } else {
    query += " GROUP BY thang";
  }

  return query;
};

export const getSqlSatker = (p: GetSqlSatkerParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectSatker,
    fromSatker,
  } = p;

  let query = "SELECT ";
  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  query += selectSatker + fromClause + fromSatker;
  query += ` WHERE kddept<>'999' and thang='${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;

  if (groupByClause) {
    query += ` GROUP BY thang, kdsatker ${groupByClause} ORDER BY realisasi DESC LIMIT 5`;
  } else {
    query += " GROUP BY thang,kdsatker ORDER BY realisasi DESC LIMIT 5";
  }

  return query;
};

export const getSqlTren = (p: GetSqlTrenParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectTren,
    fromTren,
  } = p;

  let query = "SELECT ";
  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  query += selectTren + fromClause + fromTren;
  query += ` WHERE kddept<>'999' and thang between '${parseInt(thang) - 2}' and '${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;

  if (groupByClause) {
    query += ` GROUP BY thang${groupByClause}`;
  } else {
    query += " GROUP BY thang";
  }

  return query;
};

export const getSqlBkpk = (p: GetSqlBkpkParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectBkpk,
    fromBkpk,
  } = p;

  let query = "SELECT ";
  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  query += selectBkpk + fromClause + fromBkpk;
  query += ` WHERE kddept<>'999' and thang='${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;

  if (groupByClause) {
    query += ` GROUP BY thang, kdbkpk ${groupByClause} ORDER BY realisasi DESC LIMIT 5`;
  } else {
    query += " GROUP BY thang,kdbkpk ORDER BY realisasi DESC LIMIT 5";
  }

  return query;
};

export const getSqlDukman = (p: GetSqlDukmanParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectDukman,
    fromDukman,
  } = p;

  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  let query = "SELECT ";
  let queryDept = "kddept";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  const rangeWhere = `kddept<>'999' and thang between '${parseInt(thang) - 2}' and '${thang}'`;

  query += selectDukman + fromClause + fromDukman;
  query += ` WHERE ${rangeWhere}`;
  if (whereClause) query += ` AND ${whereClause}`;

  query += " UNION ALL ";
  query += ` SELECT kddept,kdunit, kdkanwil,'pagu_non_teknis' AS jenis_pagu,SUM(CASE WHEN kdprogram <> 'WA' THEN pagu ELSE 0 END) / SUM(pagu)*100 AS nilai_pagu${fromClause}${fromDukman}`;
  query += ` WHERE ${rangeWhere}`;
  if (whereClause) query += ` AND ${whereClause}`;

  return query;
};

export const getSqlTrenJenbel = (p: GetSqlTrenJenbelParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectTrenJenbel,
    fromTrenJenbel,
  } = p;

  let query = "SELECT ";
  const fromClause = " FROM ";
  let whereClause = buildLimitAkses(role, kodekppn, kodekanwil);
  let groupByClause = "";

  if (dept === "000") {
    query += "kddept";
  } else {
    query += "kddept";
    whereClause += (whereClause ? " AND " : "") + ` kddept = '${dept}'`;
    groupByClause += ",kddept";
  }

  query += ",kdunit";
  if (unit !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdunit = '${unit}'`;
  }
  groupByClause += unit === "00" ? "" : ",kdunit";

  query += ", kdkanwil";
  if (prov !== "00") {
    whereClause += (whereClause ? " AND " : "") + `kdkanwil = '${prov}'`;
  }
  groupByClause += prov === "00" ? "" : ",kdkanwil";

  const thangN = parseInt(thang);

  query += selectTrenJenbel + fromClause + fromTrenJenbel;
  query += ` JOIN (SELECT SUM(pagu) AS total_pagu FROM dashboard_v3.pagu_real_dashboard WHERE kddept <> '999' and thang between '${thangN - 2}' and '${thang}') AS total ON 1=1  `;
  query += ` WHERE kddept<>'999' and LEFT(kdbkpk,1)='5' and thang between '${thangN - 2}' and '${thang}'`;
  if (whereClause) query += ` AND ${whereClause}`;
  query += " GROUP BY left(kdbkpk,2)";

  return query;
};

export const getSqlIkpa = (p: GetSqlIkpaParams): string => {
  const {
    thang,
    dept,
    unit,
    prov,
    role,
    kodekppn,
    kodekanwil,
    selectIkpa,
    fromIkpa,
  } = p;
  const thangN = parseInt(thang);

  let query =
    "SELECT thang, aspek_kualitas_renc, aspek_kualitas_pelaksanaan, aspek_kualitas_hasil";
  let fromClause = " FROM ";
  let whereClause = "";

  if (dept === "000" && unit === "00" && prov === "00") {
    fromClause += `dashboard_v3.pa_capaian_ik_all_${thang}_aspek`;
  } else if (prov !== "00" && prov !== "") {
    fromClause += `dashboard_v3.pa_capaian_ik_kanwil_${thangN}_aspek`;
    whereClause = ` WHERE kdkanwil = '${prov}'`;
  } else if (unit === "00") {
    fromClause += `dashboard_v3.pa_capaian_ik_kl_${thangN}_aspek`;
    whereClause = ` WHERE kddept = '${dept}'`;
  } else {
    fromClause += `dashboard_v3.pa_capaian_ik_es1_${thangN}_aspek`;
    whereClause = ` WHERE kddept = '${dept}' AND kdunit = '${unit}'`;
  }

  query += selectIkpa + fromClause + fromIkpa + whereClause;
  query += " GROUP BY thang UNION ALL ";

  // Previous year
  let query2 =
    "SELECT thang, aspek_kualitas_renc, aspek_kualitas_pelaksanaan, aspek_kualitas_hasil";
  let fromClause2 = " FROM ";
  let whereClause2 = "";

  if ((dept === "000" && unit === "00") || (prov !== "00" && prov !== "")) {
    fromClause2 += `dashboard_v3.pa_capaian_ik_all_${thangN - 1}_aspek`;
  } else {
    if (dept !== "000" && unit === "00") {
      fromClause2 += `dashboard_v3.pa_capaian_ik_kl_${thangN - 1}_aspek`;
    } else if (dept !== "000" && unit !== "00" && prov === "00") {
      fromClause2 += `dashboard_v3.pa_capaian_ik_es1_${thangN - 1}_aspek`;
    } else {
      fromClause2 += `dashboard_v3.pa_capaian_ik_kanwil_${thangN - 1}_aspek`;
    }

    if (prov === "00" || dept !== "000" || unit !== "00") {
      whereClause2 += " WHERE ";
      if (prov !== "00") whereClause2 += `kdkanwil = '${prov}'`;
      else if (dept !== "000") whereClause2 += `kddept = '${dept}'`;
      if (unit !== "00" && prov === "00")
        whereClause2 += ` AND kdunit = '${unit}'`;
    }
    if (dept === "000" && unit === "00" && prov !== "00") {
      whereClause2 += whereClause2
        ? ` AND kdkanwil = '${prov}'`
        : ` WHERE kdkanwil = '${prov}'`;
    }
  }

  query2 += fromClause2 + whereClause2;
  query2 += " GROUP BY thang";

  return query + query2;
};
