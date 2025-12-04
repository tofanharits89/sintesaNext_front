// Pure TypeScript - SQL Query Builder (No React dependencies)

export interface Sp2dQueryParams {
  thang: number | string;
  jenlap: string;
  role: string;
  kodekppn: string;
  kodekanwil: string;
  deptradio: string;
  dept: string;
  deptkondisipilih: string;
  deptkondisi: string;
  kdunit: string;
  unitkondisipilih: string;
  unitkondisi: string;
  unitradio: string;
  dekon: string;
  dekonradio: string;
  prov: string;
  provradio: string;
  kabkota: string;
  kabkotaradio: string;
  kanwil: string;
  kanwilradio: string;
  kppn: string;
  kppnradio: string;
  satker: string;
  satkerradio: string;
  satkerkondisi: string;
  fungsi: string;
  fungsiradio: string;
  subfungsiradio: string;
  program: string;
  programradio: string;
  giat: string;
  kegiatanradio: string;
  output: string;
  outputradio: string;
  akun: string;
  akunradio: string;
  sdana: string;
  sdanaradio: string;
  select: string;
  from: string;
  opsidept: string;
  opsikatadept: string;
  opsiunit: string;
  opsikataunit: string;
  opsidekon: string;
  dekonkondisi: string;
  kppnkondisipilih: string;
  kppnkondisi: string;
  opsikppn: string;
  opsikatakppn: string;
  kanwilkondisipilih: string;
  kanwilkondisi: string;
  opsikanwil: string;
  opsikatakanwil: string;
  programkondisipilih: string;
  programkondisi: string;
  opsiprogram: string;
  opsikataprogram: string;
  giatkondisipilih: string;
  giatkondisi: string;
  opsigiat: string;
  opsikatagiat: string;
  outputkondisipilih: string;
  outputkondisi: string;
  opsioutput: string;
  opsikataoutput: string;
  akunkondisipilih: string;
  akunkondisi: string;
  opsiakun: string;
  opsikataakun: string;
  opsisdana: string;
  opsikatasdana: string;
  sdanakondisi: string;
  pembulatan: string;
  opsikatasatker: string;
  opsisatker: string;
}

/**
 * Build SQL query untuk SP2D berdasarkan parameter yang diberikan
 * @param params - Query parameters dari FormSp2d
 * @returns Generated SQL query string
 */
export const buildSp2dQuery = (params: Sp2dQueryParams): string => {
  let query = "";

  // Base SELECT clause
  let selectClause = `SELECT a.kddept,a.nmdept ${params.select}`;
  let whereClause = "";
  let groupByClause = "GROUP BY a.kddept";
  let orderByClause = "ORDER BY a.kddept";

  // Build WHERE clause berdasarkan kondisi yang dipilih
  const conditions: string[] = [];

  // Department condition
  if (params.deptradio === "1" && params.dept !== "XX") {
    if (params.dept === "XXX" || params.dept === "000") {
      conditions.push(`a.kddept IN ('000')`);
    } else {
      conditions.push(`a.kddept = '${params.dept}'`);
    }
  } else if (params.opsidept === "kondisidept" && params.deptkondisi) {
    // Handle kondisi department
    const deptList = params.deptkondisi
      .split(",")
      .map((d) => `'${d.trim()}'`)
      .join(",");
    if (params.deptkondisi.includes("!")) {
      conditions.push(`a.kddept NOT IN (${deptList})`);
    } else {
      conditions.push(`a.kddept IN (${deptList})`);
    }
  } else if (params.opsidept === "katadept" && params.opsikatadept) {
    conditions.push(`a.nmdept LIKE '%${params.opsikatadept}%'`);
  }

  // Unit condition
  if (params.unitradio === "1" && params.kdunit !== "XX") {
    conditions.push(`a.kdunit = '${params.kdunit}'`);
  } else if (params.opsiunit === "kondisiunit" && params.unitkondisi) {
    const unitList = params.unitkondisi
      .split(",")
      .map((u) => `'${u.trim()}'`)
      .join(",");
    conditions.push(`a.kdunit IN (${unitList})`);
  } else if (params.opsiunit === "kataunit" && params.opsikataunit) {
    conditions.push(`a.nmunit LIKE '%${params.opsikataunit}%'`);
  }

  // Dekon condition
  if (params.dekonradio === "1" && params.dekon !== "XX") {
    conditions.push(`a.kddekon = '${params.dekon}'`);
  } else if (params.opsidekon === "kondisidekon" && params.dekonkondisi) {
    const dekonList = params.dekonkondisi
      .split(",")
      .map((d) => `'${d.trim()}'`)
      .join(",");
    conditions.push(`a.kddekon IN (${dekonList})`);
  }

  // Kanwil condition
  if (params.kanwilradio === "1" && params.kanwil !== "XX") {
    conditions.push(`a.kdkanwil = '${params.kanwil}'`);
  } else if (params.opsikanwil === "kondisikanwil" && params.kanwilkondisi) {
    const kanwilList = params.kanwilkondisi
      .split(",")
      .map((k) => `'${k.trim()}'`)
      .join(",");
    conditions.push(`a.kdkanwil IN (${kanwilList})`);
  } else if (params.opsikanwil === "katakanwil" && params.opsikatakanwil) {
    conditions.push(`a.nmkanwil LIKE '%${params.opsikatakanwil}%'`);
  }

  // KPPN condition
  if (params.kppnradio === "1" && params.kppn !== "XX") {
    conditions.push(`a.kdkppn = '${params.kppn}'`);
  } else if (params.opsikppn === "kondisikppn" && params.kppnkondisi) {
    const kppnList = params.kppnkondisi
      .split(",")
      .map((k) => `'${k.trim()}'`)
      .join(",");
    conditions.push(`a.kdkppn IN (${kppnList})`);
  } else if (params.opsikppn === "katakppn" && params.opsikatakppn) {
    conditions.push(`a.nmkppn LIKE '%${params.opsikatakppn}%'`);
  }

  // Satker condition
  if (params.satkerradio === "1" && params.satker !== "XX") {
    conditions.push(`a.kdsatker = '${params.satker}'`);
  } else if (params.opsisatker === "kondisisatker" && params.satkerkondisi) {
    const satkerList = params.satkerkondisi
      .split(",")
      .map((s) => `'${s.trim()}'`)
      .join(",");
    conditions.push(`a.kdsatker IN (${satkerList})`);
  } else if (params.opsisatker === "katasatker" && params.opsikatasatker) {
    conditions.push(`a.nmsatker LIKE '%${params.opsikatasatker}%'`);
  }

  // Program condition
  if (params.programradio === "1" && params.program !== "XX") {
    conditions.push(`a.kdprogram = '${params.program}'`);
  } else if (params.opsiprogram === "kondisiprogram" && params.programkondisi) {
    const programList = params.programkondisi
      .split(",")
      .map((p) => `'${p.trim()}'`)
      .join(",");
    conditions.push(`a.kdprogram IN (${programList})`);
  } else if (params.opsiprogram === "kataprogram" && params.opsikataprogram) {
    conditions.push(`a.nmprogram LIKE '%${params.opsikataprogram}%'`);
  }

  // Kegiatan condition
  if (params.kegiatanradio === "1" && params.giat !== "XX") {
    conditions.push(`a.kdgiat = '${params.giat}'`);
  } else if (params.opsigiat === "kondisigiat" && params.giatkondisi) {
    const giatList = params.giatkondisi
      .split(",")
      .map((g) => `'${g.trim()}'`)
      .join(",");
    conditions.push(`a.kdgiat IN (${giatList})`);
  } else if (params.opsigiat === "katagiat" && params.opsikatagiat) {
    conditions.push(`a.nmgiat LIKE '%${params.opsikatagiat}%'`);
  }

  // Output condition
  if (params.outputradio === "1" && params.output !== "XX") {
    conditions.push(`a.kdoutput = '${params.output}'`);
  } else if (params.opsioutput === "kondisioutput" && params.outputkondisi) {
    const outputList = params.outputkondisi
      .split(",")
      .map((o) => `'${o.trim()}'`)
      .join(",");
    conditions.push(`a.kdoutput IN (${outputList})`);
  } else if (params.opsioutput === "kataoutput" && params.opsikataoutput) {
    conditions.push(`a.nmoutput LIKE '%${params.opsikataoutput}%'`);
  }

  // Akun condition
  if (params.akunradio === "1" && params.akun !== "XX") {
    conditions.push(`a.kdakun = '${params.akun}'`);
  } else if (params.opsiakun === "kondisiakun" && params.akunkondisi) {
    const akunList = params.akunkondisi
      .split(",")
      .map((a) => `'${a.trim()}'`)
      .join(",");
    conditions.push(`a.kdakun IN (${akunList})`);
  } else if (params.opsiakun === "kataakun" && params.opsikataakun) {
    conditions.push(`a.nmakun LIKE '%${params.opsikataakun}%'`);
  }

  // Sumber Dana condition
  if (params.sdanaradio === "1" && params.sdana !== "XX") {
    conditions.push(`a.kdsdana = '${params.sdana}'`);
  } else if (params.opsisdana === "kondisisdana" && params.sdanakondisi) {
    const sdanaList = params.sdanakondisi
      .split(",")
      .map((s) => `'${s.trim()}'`)
      .join(",");
    conditions.push(`a.kdsdana IN (${sdanaList})`);
  } else if (params.opsisdana === "katasdana" && params.opsikatasdana) {
    conditions.push(`a.nmsdana LIKE '%${params.opsikatasdana}%'`);
  }

  // Build final query
  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(" AND ")}`;
  }

  query = `${selectClause} FROM ${params.from} a ${whereClause} ${groupByClause} ${orderByClause}`;

  return query;
};

/**
 * Validate SQL query parameters
 * @param params - Query parameters
 * @returns Validation result
 */
export const validateSp2dParams = (
  params: Sp2dQueryParams
): { valid: boolean; message?: string } => {
  if (!params.from || params.from.trim() === "") {
    return { valid: false, message: "FROM clause tidak valid" };
  }

  if (!params.select || params.select.trim() === "") {
    return { valid: false, message: "SELECT clause tidak valid" };
  }

  return { valid: true };
};
