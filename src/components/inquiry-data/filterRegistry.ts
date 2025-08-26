export type JenisTampilan = "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";

export interface RefDef {
  database: string;
  table: string;
  joinKey: string;
  nameColumn: string;
}

export interface FilterDef {
  key: string;
  label: string;
  order: number;
  mandatory?: boolean; // e.g., cutOff
  showInUI?: boolean; // hide internal keys like kodeBkpk/jenisBelanja
  defaultTampilan?: JenisTampilan;
  query?: {
    columnName: string;
    reference?: RefDef;
  };
}

// Single Source of Truth for all filters
export const INQUIRY_FILTER_DEFS: FilterDef[] = [
  { key: "cutOff", label: "Cut Off (Wajib)", order: 0, mandatory: true, showInUI: true },
  { key: "kementerian", label: "Kementerian", order: 1, showInUI: true, query: { columnName: "kddept", reference: { database: "dbref", table: "t_dept", joinKey: "kddept", nameColumn: "nmdept" } } },
  { key: "eselonI", label: "Eselon I", order: 2, showInUI: true, query: { columnName: "kdunit", reference: { database: "dbref", table: "t_unit", joinKey: "kdunit", nameColumn: "nmunit" } } },
  { key: "kewenangan", label: "Kewenangan", order: 3, showInUI: true, query: { columnName: "kddekon", reference: { database: "dbref", table: "t_dekon", joinKey: "kddekon", nameColumn: "nmdekon" } } },
  { key: "provinsi", label: "Provinsi", order: 4, showInUI: true, query: { columnName: "kdlokasi", reference: { database: "dbref", table: "t_lokasi", joinKey: "kdlokasi", nameColumn: "nmlokasi" } } },
  { key: "kabkota", label: "Kabkota", order: 5, showInUI: true, query: { columnName: "kdkabkota", reference: { database: "dbref", table: "t_kabkota", joinKey: "kdkabkota", nameColumn: "nmkabkota" } } },
  { key: "kanwil", label: "Kanwil", order: 6, showInUI: true, query: { columnName: "kdkanwil", reference: { database: "dbref", table: "t_kanwil", joinKey: "kdkanwil", nameColumn: "nmkanwil" } } },
  { key: "kppn", label: "KPPN", order: 7, showInUI: true, query: { columnName: "kdkppn", reference: { database: "dbref", table: "t_kppn", joinKey: "kdkppn", nameColumn: "nmkppn" } } },
  { key: "satker", label: "Satker", order: 8, showInUI: true, query: { columnName: "kdsatker", reference: { database: "dbref", table: "t_satker", joinKey: "kdsatker", nameColumn: "nmsatker" } } },
  { key: "fungsi", label: "Fungsi", order: 9, showInUI: true, query: { columnName: "kdfungsi", reference: { database: "dbref", table: "t_fungsi", joinKey: "kdfungsi", nameColumn: "nmfungsi" } } },
  { key: "subFungsi", label: "Sub-Fungsi", order: 10, showInUI: true, query: { columnName: "kdsfung", reference: { database: "dbref", table: "t_sfung", joinKey: "kdsfung", nameColumn: "nmsfung" } } },
  { key: "program", label: "Program", order: 11, showInUI: true, query: { columnName: "kdprogram", reference: { database: "dbref", table: "t_program", joinKey: "kdprogram", nameColumn: "nmprogram" } } },
  { key: "kegiatan", label: "Kegiatan", order: 12, showInUI: true, query: { columnName: "kdgiat", reference: { database: "dbref", table: "t_giat", joinKey: "kdgiat", nameColumn: "nmgiat" } } },
  { key: "outputKro", label: "Output/KRO", order: 13, showInUI: true, query: { columnName: "kdoutput", reference: { database: "dbref", table: "t_output", joinKey: "kdoutput", nameColumn: "nmoutput" } } },
  { key: "subOutputRo", label: "Sub-Output/RO", order: 14, showInUI: true, query: { columnName: "kdsoutput", reference: { database: "dbref", table: "t_soutput", joinKey: "kdsoutput", nameColumn: "nmsoutput" } } },
  { key: "akun", label: "Akun", order: 15, showInUI: true, query: { columnName: "kdakun", reference: { database: "dbref", table: "t_akun", joinKey: "kdakun", nameColumn: "nmakun" } } },
  // Internal variants for akun grouping (not shown in UI)
  { key: "kodeBkpk", label: "Kode Bkpk", order: 16, showInUI: false, query: { columnName: "kdakun", reference: { database: "dbref", table: "t_bkpk", joinKey: "kdbkpk", nameColumn: "nmbkpk" } } },
  { key: "jenisBelanja", label: "Jenis Belanja", order: 17, showInUI: false, query: { columnName: "kdakun", reference: { database: "dbref", table: "t_gbkpk", joinKey: "kdgbkpk", nameColumn: "nmgbkpk" } } },
  { key: "sumberDana", label: "Sumber Dana", order: 18, showInUI: true, query: { columnName: "kdsdana", reference: { database: "dbref", table: "t_sdana", joinKey: "kdsdana", nameColumn: "nmsdana" } } },
  { key: "register", label: "Register", order: 19, showInUI: true, query: { columnName: "register", reference: { database: "dbref", table: "t_register", joinKey: "register", nameColumn: "register" } } },
];

export type FilterKey = typeof INQUIRY_FILTER_DEFS[number]["key"];

export const getUIFilters = (): FilterDef[] =>
  INQUIRY_FILTER_DEFS.filter((d) => d.showInUI !== false).sort((a, b) => a.order - b.order);

export const getFilterLabel = (key: string): string => {
  const def = INQUIRY_FILTER_DEFS.find((d) => d.key === key);
  return def?.label || key;
};

export const getFilterConfigMap = () => {
  const map: Record<string, { key: string; columnName: string; referenceTable?: string; referenceDatabase?: string; joinKey?: string; nameColumn?: string }> = {};
  for (const d of INQUIRY_FILTER_DEFS) {
    if (d.query?.columnName) {
      map[d.key] = {
        key: d.key,
        columnName: d.query.columnName,
        referenceTable: d.query.reference?.table,
        referenceDatabase: d.query.reference?.database,
        joinKey: d.query.reference?.joinKey,
        nameColumn: d.query.reference?.nameColumn,
      };
    }
  }
  return map;
};

export const FILTER_ORDER: string[] = getUIFilters().map((d) => d.key);

export const normalizeActiveFilters = (activeFilters: string[]): string[] => {
  const orderMap = new Map(FILTER_ORDER.map((k, i) => [k, i]));
  return activeFilters.slice().sort((a, b) => {
    const ia = orderMap.has(a) ? (orderMap.get(a) as number) : Number.MAX_SAFE_INTEGER;
    const ib = orderMap.has(b) ? (orderMap.get(b) as number) : Number.MAX_SAFE_INTEGER;
    return ia - ib;
  });
};

