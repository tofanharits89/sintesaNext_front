export interface CategoryFilter {
  key: string;
  label: string;
  mandatory: boolean;
  removable: boolean;
  defaultValue?: {
    selection?: string;
    kondisiCode?: string;
    mengandungKata?: string;
    jenisTampilan?: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
  };
}

export interface CategoryColumn {
  key: string;
  label: string;
  sqlExpression: string;
  order: number;
  dataType: "text" | "number" | "date";
  isMonetary?: boolean;
}

export interface CategoryQueryConfig {
  tableName: string;
  baseTableSuffix?: string; // For custom table naming patterns
  whereConditions?: string[]; // Additional WHERE conditions
  customJoins?: string[]; // Custom JOIN statements
  groupByColumns?: string[]; // Custom GROUP BY columns
  orderByColumns?: string[]; // Custom ORDER BY columns
}

export interface CategoryDefinition {
  key: string;
  label: string;
  description?: string;
  mandatoryFilters: CategoryFilter[];
  mandatoryColumns: CategoryColumn[];
  queryConfig: CategoryQueryConfig;
  excludeStandardFilters?: string[]; // Standard filters to hide in FilterParametersCard
  includeStandardFilters?: string[]; // Standard filters to always show
  reportTypeRestriction?: string; // Force specific tipeLaporan (e.g., "pagu_realisasi_bulanan")
  jenisAkumulasiAllowed?: boolean; // Whether to allow jenis akumulasi selection
}

// Centralized registry of all kategori tematik
export const TEMATIK_CATEGORIES: CategoryDefinition[] = [
  {
    key: "prioritas_nasional",
    label: "Prioritas Nasional",
    description: "Data prioritas nasional dengan filter PN hierarkis",
    mandatoryFilters: [
      {
        key: "jenisPn",
        label: "Jenis PN",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode", // Default to show both code and description
        },
      },
      {
        key: "programPrioritas",
        label: "Program Prioritas",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode", // Default to show both code and description
        },
      },
      {
        key: "kegiatanPrioritas",
        label: "Kegiatan Prioritas",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode", // Default to show both code and description
        },
      },
      {
        key: "proyekPrioritas",
        label: "Proyek Prioritas",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode", // Default to show both code and description
        },
      },
    ],
    mandatoryColumns: [
      // No mandatory columns needed - the mandatory filters already handle the PN hierarchy columns
      // through the filter registry with proper JOINs and jenis tampilan logic
    ],
    queryConfig: {
      tableName: "a_pagu_real_bkpk_dja",
      whereConditions: ["main.kdpn <> '00'"], // Exclude kdpn '00'
    },
    excludeStandardFilters: ["register"],
    reportTypeRestriction: "pagu_realisasi_bulanan",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "major_project",
    label: "Major Project",
    description: "Data proyek-proyek besar nasional",
    mandatoryFilters: [
      {
        key: "jenisMajorProject",
        label: "Jenis Major Project",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          jenisTampilan: "kode",
        },
      },
    ],
    mandatoryColumns: [],
    queryConfig: {
      tableName: "a_pagu_real_bkpk_dja",
      whereConditions: ["main.kdmp <> '00'"],
    },
    excludeStandardFilters: ["register"],
    reportTypeRestriction: "pagu_realisasi_bulanan",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "inflasi",
    label: "Inflasi",
    description: "Analisis data berdasarkan Inflasi Intervensi dan Pengeluaran",
    mandatoryFilters: [
      {
        key: "jenisInflasiIntervensi",
        label: "Jenis Inflasi Intervensi",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          jenisTampilan: "kode",
        },
      },
      {
        key: "jenisInflasiPengeluaran",
        label: "Jenis Inflasi Pengeluaran",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          jenisTampilan: "kode",
        },
      },
    ],
    mandatoryColumns: [],
    queryConfig: {
      tableName: "a_pagu_real_bkpk_dja",
      whereConditions: [
        "main.inf_intervensi IS NOT NULL",
        "main.inf_pengeluaran IS NOT NULL",
      ],
      customJoins: [
        "LEFT JOIN ref_inf_intervensi intervensi ON main.inf_intervensi = intervensi.kode_intervensi",
        "LEFT JOIN ref_inf_pengeluaran pengeluaran ON main.inf_pengeluaran = pengeluaran.kode_pengeluaran",
      ],
    },
    excludeStandardFilters: ["register"],
    reportTypeRestriction: "pagu_realisasi_bulanan",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "penanganan_stunting",
    label: "Penanganan Stunting",
    description: "Analisis data berdasarkan Intervensi Stunting",
    mandatoryFilters: [
      {
        key: "stuntingIntervensi",
        label: "Intervensi",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          jenisTampilan: "kode",
        },
      },
    ],
    mandatoryColumns: [],
    queryConfig: {
      tableName: "a_pagu_real_bkpk_dja",
      whereConditions: ["main.stun_intervensi IS NOT NULL"],
      customJoins: [
        "LEFT JOIN ref_stunting_intervensi stunting ON main.stun_intervensi = stunting.stun_intervensi",
      ],
    },
    excludeStandardFilters: ["register"],
    reportTypeRestriction: "pagu_realisasi_bulanan",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "kemiskinan_ekstrim",
    label: "Kemiskinan Ekstrim",
    description: "Analisis data berdasarkan status Kemiskinan Ekstrim",
    mandatoryFilters: [],
    mandatoryColumns: [
      {
        key: "kemiskinan_ekstrim",
        label: "Kemiskinan Ekstrim",
        sqlExpression: "main.kemiskinan_ekstrim",
        order: 1,
        dataType: "text",
      },
    ],
    queryConfig: {
      tableName: "a_pagu_real_bkpk_dja",
      whereConditions: ["main.kemiskinan_ekstrim IS NOT NULL"],
      groupByColumns: ["main.kemiskinan_ekstrim"],
    },
    excludeStandardFilters: ["register"],
    reportTypeRestriction: "pagu_realisasi_bulanan",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "belanja_pemilu",
    label: "Belanja Pemilu",
    description: "Analisis data berdasarkan status Belanja Pemilu",
    mandatoryFilters: [],
    mandatoryColumns: [
      {
        key: "pemilu",
        label: "Belanja Pemilu",
        sqlExpression: "main.pemilu",
        order: 1,
        dataType: "text",
      },
    ],
    queryConfig: {
      tableName: "a_pagu_real_bkpk_dja",
      whereConditions: ["main.pemilu IS NOT NULL"],
      groupByColumns: ["main.pemilu"],
    },
    excludeStandardFilters: ["register"],
    reportTypeRestriction: "pagu_realisasi_bulanan",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "ibu_kota_nusantara",
    label: "Ibu Kota Nusantara",
    description: "Analisis data berdasarkan status IKN",
    mandatoryFilters: [],
    mandatoryColumns: [
      {
        key: "ikn",
        label: "Ibu Kota Nusantara",
        sqlExpression: "main.ikn",
        order: 1,
        dataType: "text",
      },
    ],
    queryConfig: {
      tableName: "a_pagu_real_bkpk_dja",
      whereConditions: ["main.ikn IS NOT NULL"],
      groupByColumns: ["main.ikn"],
    },
    excludeStandardFilters: ["register"],
    reportTypeRestriction: "pagu_realisasi_bulanan",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "ketahanan_pangan",
    label: "Ketahanan Pangan",
    description: "Analisis data berdasarkan status Ketahanan Pangan",
    mandatoryFilters: [],
    mandatoryColumns: [
      {
        key: "pangan",
        label: "Ketahanan Pangan",
        sqlExpression: "main.pangan",
        order: 1,
        dataType: "text",
      },
    ],
    queryConfig: {
      tableName: "a_pagu_real_bkpk_dja",
      whereConditions: ["main.pangan IS NOT NULL"],
      groupByColumns: ["main.pangan"],
    },
    excludeStandardFilters: ["register"],
    reportTypeRestriction: "pagu_realisasi_bulanan",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "bantuan_pemerintah",
    label: "Bantuan Pemerintah",
    description: "Data bantuan pemerintah dengan filter khusus",
    mandatoryFilters: [
      {
        key: "jenisTransfer",
        label: "Jenis Transfer",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode",
        },
      },
      {
        key: "statusPenyaluran",
        label: "Status Penyaluran",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "uraian",
        },
      },
    ],
    mandatoryColumns: [
      {
        key: "jenis_transfer",
        label: "Jenis Transfer",
        sqlExpression: "main.jenis_transfer",
        order: 1,
        dataType: "text",
      },
      {
        key: "status_penyaluran",
        label: "Status Penyaluran",
        sqlExpression: "main.status_penyaluran",
        order: 2,
        dataType: "text",
      },
      {
        key: "pagu_transfer",
        label: "Pagu Transfer",
        sqlExpression: "ROUND(SUM(main.pagu_transfer) / {divisor}, 0)",
        order: 3,
        dataType: "number",
        isMonetary: true,
      },
    ],
    queryConfig: {
      tableName: "pagu_real_detail_harian",
      whereConditions: ["main.jenis_transfer IS NOT NULL"],
    },
    excludeStandardFilters: ["register", "akun"],
    reportTypeRestriction: "pagu_realisasi",
    jenisAkumulasiAllowed: false,
  },
  {
    key: "program_strategis",
    label: "Program Strategis",
    description: "Data program strategis nasional",
    mandatoryFilters: [
      {
        key: "kategoriProgram",
        label: "Kategori Program",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode_uraian",
        },
      },
      {
        key: "tingkatPrioritas",
        label: "Tingkat Prioritas",
        mandatory: true,
        removable: false,
        defaultValue: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "uraian",
        },
      },
    ],
    mandatoryColumns: [
      {
        key: "kategori_program",
        label: "Kategori Program",
        sqlExpression: "main.kategori_program",
        order: 1,
        dataType: "text",
      },
      {
        key: "tingkat_prioritas",
        label: "Tingkat Prioritas",
        sqlExpression: "main.tingkat_prioritas",
        order: 2,
        dataType: "text",
      },
      {
        key: "target_output",
        label: "Target Output",
        sqlExpression: "SUM(main.target_output)",
        order: 3,
        dataType: "number",
      },
    ],
    queryConfig: {
      tableName: "smry_program_strategis",
      whereConditions: ["main.kategori_program IS NOT NULL"],
      groupByColumns: ["main.kategori_program", "main.tingkat_prioritas"],
    },
    excludeStandardFilters: ["register", "akun", "fungsi"],
    reportTypeRestriction: "pagu_realisasi",
    jenisAkumulasiAllowed: false,
  },

  // Add more categories as needed...
];

// Helper functions for working with the registry
export function getTematikCategory(
  key: string
): CategoryDefinition | undefined {
  return TEMATIK_CATEGORIES.find((cat) => cat.key === key);
}

export function getTematikCategoryOptions(): {
  value: string;
  label: string;
}[] {
  return TEMATIK_CATEGORIES.map((cat) => ({
    value: cat.key,
    label: cat.label,
  }));
}

export function getCategoryLabel(key: string): string {
  const category = getTematikCategory(key);
  return category?.label || key;
}

export function getCategoryMandatoryFilters(key: string): CategoryFilter[] {
  const category = getTematikCategory(key);
  return category?.mandatoryFilters || [];
}

/**
 * Get a unique list of ALL mandatory filter keys across every tematik category.
 * Useful for globally hiding category-specific mandatory switches from UI.
 */
export function getAllMandatoryFilterKeys(): string[] {
  const all = TEMATIK_CATEGORIES.flatMap((cat) =>
    (cat.mandatoryFilters || []).map((f) => f.key)
  );
  return Array.from(new Set(all));
}

export function getCategoryMandatoryColumns(key: string): CategoryColumn[] {
  const category = getTematikCategory(key);
  return category?.mandatoryColumns || [];
}

export function getCategoryQueryConfig(
  key: string
): CategoryQueryConfig | undefined {
  const category = getTematikCategory(key);
  return category?.queryConfig;
}

export function getCategoryExcludedFilters(key: string): string[] {
  const category = getTematikCategory(key);
  return category?.excludeStandardFilters || [];
}

export function isCategoryFilterMandatory(
  categoryKey: string,
  filterKey: string
): boolean {
  const mandatoryFilters = getCategoryMandatoryFilters(categoryKey);
  return mandatoryFilters.some(
    (filter) => filter.key === filterKey && filter.mandatory
  );
}

// Validation functions
export function validateCategoryConfiguration(key: string): string[] {
  const errors: string[] = [];
  const category = getTematikCategory(key);

  if (!category) {
    errors.push(`Category '${key}' not found in registry`);
    return errors;
  }

  // Mandatory filters are optional per category design

  // Validate query configuration
  if (!category.queryConfig.tableName) {
    errors.push(`Category '${key}' has no table name defined`);
  }

  return errors;
}
