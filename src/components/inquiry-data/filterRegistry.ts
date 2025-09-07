export type JenisTampilan =
  | "kode"
  | "kode_uraian"
  | "uraian"
  | "jangan_tampilkan";

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
    // Additional properties for local data sources
    dataSource?: "local" | "database";
    localFile?: string;
    joinKey?: string;
    nameColumn?: string;
  };
}

// Single Source of Truth for all filters
export const INQUIRY_FILTER_DEFS: FilterDef[] = [
  {
    key: "cutOff",
    label: "Cut Off (Wajib)",
    order: 0,
    mandatory: true,
    showInUI: true,
  },
  {
    key: "kementerian",
    label: "Kementerian",
    order: 1,
    showInUI: true,
    query: {
      columnName: "kddept",
      reference: {
        database: "dbref",
        table: "t_dept",
        joinKey: "kddept",
        nameColumn: "nmdept",
      },
    },
  },
  {
    key: "eselonI",
    label: "Eselon I",
    order: 2,
    showInUI: true,
    query: {
      columnName: "kdunit",
      reference: {
        database: "dbref",
        table: "t_unit",
        joinKey: "kdunit",
        nameColumn: "nmunit",
      },
    },
  },
  {
    key: "kewenangan",
    label: "Kewenangan",
    order: 3,
    showInUI: true,
    query: {
      columnName: "kddekon",
      reference: {
        database: "dbref",
        table: "t_dekon",
        joinKey: "kddekon",
        nameColumn: "nmdekon",
      },
    },
  },
  {
    key: "provinsi",
    label: "Provinsi",
    order: 4,
    showInUI: true,
    query: {
      columnName: "kdlokasi",
      reference: {
        database: "dbref",
        table: "t_lokasi",
        joinKey: "kdlokasi",
        nameColumn: "nmlokasi",
      },
    },
  },
  {
    key: "kabkota",
    label: "Kabkota",
    order: 5,
    showInUI: true,
    query: {
      columnName: "kdkabkota",
      reference: {
        database: "dbref",
        table: "t_kabkota",
        joinKey: "kdkabkota",
        nameColumn: "nmkabkota",
      },
    },
  },
  {
    key: "kanwil",
    label: "Kanwil",
    order: 6,
    showInUI: true,
    query: {
      columnName: "kdkanwil",
      reference: {
        database: "dbref",
        table: "t_kanwil",
        joinKey: "kdkanwil",
        nameColumn: "nmkanwil",
      },
    },
  },
  {
    key: "kppn",
    label: "KPPN",
    order: 7,
    showInUI: true,
    query: {
      columnName: "kdkppn",
      reference: {
        database: "dbref",
        table: "t_kppn",
        joinKey: "kdkppn",
        nameColumn: "nmkppn",
      },
    },
  },
  {
    key: "satker",
    label: "Satker",
    order: 8,
    showInUI: true,
    query: {
      columnName: "kdsatker",
      reference: {
        database: "dbref",
        table: "t_satker",
        joinKey: "kdsatker",
        nameColumn: "nmsatker",
      },
    },
  },
  {
    key: "fungsi",
    label: "Fungsi",
    order: 9,
    showInUI: true,
    query: {
      columnName: "kdfungsi",
      reference: {
        database: "dbref",
        table: "t_fungsi",
        joinKey: "kdfungsi",
        nameColumn: "nmfungsi",
      },
    },
  },
  {
    key: "subFungsi",
    label: "Sub-Fungsi",
    order: 10,
    showInUI: true,
    query: {
      columnName: "kdsfung",
      reference: {
        database: "dbref",
        table: "t_sfung",
        joinKey: "kdsfung",
        nameColumn: "nmsfung",
      },
    },
  },
  {
    key: "program",
    label: "Program",
    order: 11,
    showInUI: true,
    query: {
      columnName: "kdprogram",
      reference: {
        database: "dbref",
        table: "t_program",
        joinKey: "kdprogram",
        nameColumn: "nmprogram",
      },
    },
  },
  // Tematik PN-specific UI filters with reference joins for uraian
  {
    key: "jenisPn",
    label: "Jenis PN",
    order: 200,
    showInUI: true,
    query: {
      columnName: "kdpn",
      reference: {
        database: "dbref",
        table: "t_prinas",
        joinKey: "kdpn",
        nameColumn: "nmpn",
      },
    },
  },
  {
    key: "programPrioritas",
    label: "Program Prioritas",
    order: 201,
    showInUI: true,
    query: {
      columnName: "kdpp",
      reference: {
        database: "dbref",
        table: "t_priprog",
        joinKey: "kdpp",
        nameColumn: "nmpp",
      },
    },
  },
  {
    key: "kegiatanPrioritas",
    label: "Kegiatan Prioritas",
    order: 202,
    showInUI: true,
    query: {
      columnName: "kdkp",
      reference: {
        database: "dbref",
        table: "t_prigiat",
        joinKey: "kdkp",
        nameColumn: "nmkp",
      },
    },
  },
  {
    key: "proyekPrioritas",
    label: "Proyek Prioritas",
    order: 203,
    showInUI: true,
    query: {
      columnName: "kdproy",
      reference: {
        database: "dbref",
        table: "t_priproy",
        joinKey: "kdproy",
        nameColumn: "nmproy",
      },
    },
  },
  {
    key: "jenisMajorProject",
    label: "Jenis Major Project",
    order: 204,
    showInUI: true,
    query: {
      columnName: "kdmp",
      reference: {
        database: "dbref",
        table: "t_mp",
        joinKey: "kdmp",
        nameColumn: "nmmp",
      },
    },
  },
  {
    key: "jenisInflasiIntervensi",
    label: "Jenis Inflasi Intervensi",
    order: 205,
    showInUI: true,
    query: {
      columnName: "inf_intervensi",
      reference: {
        database: "dbref",
        table: "ref_inf_intervensi",
        joinKey: "inf_intervensi",
        nameColumn: "ur_inf_intervensi",
      },
      // Keep local JSON for UI options while SQL uses reference for LEFT JOIN
      dataSource: "local",
      localFile: "inf_intervensi.json",
      joinKey: "inf_intervensi",
      nameColumn: "ur_inf_intervensi",
    },
  },
  {
    key: "jenisInflasiPengeluaran",
    label: "Jenis Inflasi Pengeluaran",
    order: 206,
    showInUI: true,
    query: {
      columnName: "inf_pengeluaran",
      reference: {
        database: "dbref",
        table: "ref_inf_pengeluaran",
        joinKey: "inf_pengeluaran",
        nameColumn: "ur_inf_pengeluaran",
      },
      // Keep local JSON for UI options while SQL uses reference for LEFT JOIN
      dataSource: "local",
      localFile: "inf_pengeluaran.json",
      joinKey: "inf_pengeluaran",
      nameColumn: "ur_inf_pengeluaran",
    },
  },
  {
    key: "stuntingIntervensi",
    label: "Intervensi",
    order: 207,
    showInUI: true,
    query: {
      columnName: "stun_intervensi",
      reference: {
        database: "dbref",
        table: "ref_stunting_intervensi",
        joinKey: "stun_intervensi",
        nameColumn: "ur_stun_intervensi",
      },
    },
  },
  {
    key: "mbgIntervensi",
    label: "Intervensi MBG",
    order: 213,
    showInUI: true,
    query: {
      columnName: "mbg",
      reference: {
        database: "dbref",
        table: "ref_mbg_intervensi",
        joinKey: "mbg",
        nameColumn: "ur_mbg_intervensi",
      },
    },
  },
  {
    key: "kemiskinanEkstrim",
    label: "Kemiskinan Ekstrim",
    order: 208,
    showInUI: true,
    query: {
      columnName: "kemiskinan_ekstrim",
      // Acts as a switch; query builder enforces
      // WHERE main.kemiskinan_ekstrim IS NOT NULL and GROUP BY main.kemiskinan_ekstrim
      // when this filter is active
    },
  },
  {
    key: "belanjaPemilu",
    label: "Belanja Pemilu",
    order: 209,
    showInUI: true,
    query: {
      columnName: "pemilu",
      // Acts as a switch; query builder enforces
      // WHERE main.pemilu IS NOT NULL and GROUP BY main.pemilu
      // when this filter is active
    },
  },
  {
    key: "ibuKotaNusantara",
    label: "Ibu Kota Nusantara",
    order: 210,
    showInUI: true,
    query: {
      columnName: "ikn",
      // Acts as a switch; query builder enforces
      // WHERE main.ikn IS NOT NULL and GROUP BY main.ikn
      // when this filter is active
    },
  },
  {
    key: "ketahananPangan",
    label: "Ketahanan Pangan",
    order: 211,
    showInUI: true,
    query: {
      columnName: "pangan",
      // Acts as a switch; query builder enforces
      // WHERE main.pangan IS NOT NULL and GROUP BY main.pangan
      // when this filter is active
    },
  },
  {
    key: "swasembadaPangan",
    label: "Swasembada Pangan",
    order: 214,
    showInUI: true,
    query: {
      columnName: "swasembada",
      // Acts as a switch; query builder enforces
      // WHERE main.swasembada IS NOT NULL and GROUP BY main.swasembada
      // when this filter is active
    },
  },
  {
    key: "belanjaPemerintah",
    label: "Bantuan Pemerintah",
    order: 212,
    showInUI: true,
    query: {
      columnName: "kdakun",
      // Acts as a switch; handled in query builder WHERE only (no SELECT/GROUP BY)
    },
  },
  {
    key: "kegiatan",
    label: "Kegiatan",
    order: 12,
    showInUI: true,
    query: {
      columnName: "kdgiat",
      reference: {
        database: "dbref",
        table: "t_giat",
        joinKey: "kdgiat",
        nameColumn: "nmgiat",
      },
    },
  },
  {
    key: "outputKro",
    label: "Output/KRO",
    order: 13,
    showInUI: true,
    query: {
      columnName: "kdoutput",
      reference: {
        database: "dbref",
        table: "t_output",
        joinKey: "kdoutput",
        nameColumn: "nmoutput",
      },
    },
  },
  {
    key: "subOutputRo",
    label: "Sub-Output/RO",
    order: 14,
    showInUI: true,
    query: {
      columnName: "kdsoutput",
      reference: {
        database: "dbref",
        table: "t_soutput",
        joinKey: "kdsoutput",
        nameColumn: "nmsoutput",
      },
    },
  },
  {
    key: "akun",
    label: "Akun",
    order: 15,
    showInUI: true,
    query: {
      columnName: "kdakun",
      reference: {
        database: "dbref",
        table: "t_akun",
        joinKey: "kdakun",
        nameColumn: "nmakun",
      },
    },
  },
  // Internal variants for akun grouping (not shown in UI)
  {
    key: "kodeBkpk",
    label: "Kode Bkpk",
    order: 16,
    showInUI: false,
    query: {
      columnName: "kdakun",
      reference: {
        database: "dbref",
        table: "t_bkpk",
        joinKey: "kdbkpk",
        nameColumn: "nmbkpk",
      },
    },
  },
  {
    key: "jenisBelanja",
    label: "Jenis Belanja",
    order: 17,
    showInUI: false,
    query: {
      columnName: "kdakun",
      reference: {
        database: "dbref",
        table: "t_gbkpk",
        joinKey: "kdgbkpk",
        nameColumn: "nmgbkpk",
      },
    },
  },
  {
    key: "sumberDana",
    label: "Sumber Dana",
    order: 18,
    showInUI: true,
    query: {
      columnName: "kdsdana",
      reference: {
        database: "dbref",
        table: "t_sdana",
        joinKey: "kdsdana",
        nameColumn: "nmsdana",
      },
    },
  },
  {
    key: "register",
    label: "Register",
    order: 19,
    showInUI: true,
    query: {
      columnName: "register",
      reference: {
        database: "dbref",
        table: "t_register",
        joinKey: "register",
        nameColumn: "register",
      },
    },
  },
];

export type FilterKey = (typeof INQUIRY_FILTER_DEFS)[number]["key"];

export const getUIFilters = (): FilterDef[] =>
  INQUIRY_FILTER_DEFS.filter((d) => d.showInUI !== false).sort(
    (a, b) => a.order - b.order
  );

export const getFilterLabel = (key: string): string => {
  const def = INQUIRY_FILTER_DEFS.find((d) => d.key === key);
  return def?.label || key;
};

export const getFilterConfigMap = () => {
  const map: Record<
    string,
    {
      key: string;
      columnName: string;
      referenceTable?: string;
      referenceDatabase?: string;
      joinKey?: string;
      nameColumn?: string;
    }
  > = {};
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
    } else {
      // Still include keys that don't have query definitions (e.g., PN-only UI filters)
      map[d.key] = {
        key: d.key,
        columnName: d.key,
      };
    }
  }
  return map;
};

export const FILTER_ORDER: string[] = getUIFilters().map((d) => d.key);

export const normalizeActiveFilters = (activeFilters: string[]): string[] => {
  const orderMap = new Map(FILTER_ORDER.map((k, i) => [k, i]));
  return activeFilters.slice().sort((a, b) => {
    const ia = orderMap.has(a)
      ? (orderMap.get(a) as number)
      : Number.MAX_SAFE_INTEGER;
    const ib = orderMap.has(b)
      ? (orderMap.get(b) as number)
      : Number.MAX_SAFE_INTEGER;
    return ia - ib;
  });
};

/**
 * Get available filters for a specific page scope
 * @param scope - The page scope ("belanja", "tematik", or "general")
 * @param excludeFilters - Additional filters to exclude
 * @returns Array of available filter keys for the scope
 */
export const getAvailableFiltersForScope = (
  scope: "belanja" | "tematik" | "general" = "general",
  excludeFilters: string[] = []
): string[] => {
  const allUIFilters = getUIFilters().map((f) => f.key);

  // Define scope-specific exclusions
  const scopeExclusions: Record<string, string[]> = {
    belanja: [], // Belanja has all filters available
    tematik: [
      "register",
      "kemiskinanEkstrim",
      "belanjaPemilu",
      "ibuKotaNusantara",
      "ketahananPangan",
      "swasembadaPangan",
      "belanjaPemerintah",
    ], // Exclude switches from Tematik page
    general: [], // General scope has all filters
  };

  const filtersToExclude = [
    ...(scopeExclusions[scope] || []),
    ...excludeFilters,
  ];

  return allUIFilters.filter(
    (filterKey) => !filtersToExclude.includes(filterKey)
  );
};

/**
 * Check if a filter is available in a specific scope
 * @param filterKey - The filter key to check
 * @param scope - The page scope
 * @returns True if the filter is available in the scope
 */
export const isFilterAvailableInScope = (
  filterKey: string,
  scope: "belanja" | "tematik" | "general" = "general"
): boolean => {
  const availableFilters = getAvailableFiltersForScope(scope);
  return availableFilters.includes(filterKey);
};

/**
 * Validate if active filters are compatible with a specific scope
 * @param activeFilters - Array of active filter keys
 * @param scope - The target scope
 * @returns Validation result with incompatible filters
 */
export const validateFiltersForScope = (
  activeFilters: string[],
  scope: "belanja" | "tematik" | "general"
): { isValid: boolean; incompatibleFilters: string[] } => {
  const availableFilters = getAvailableFiltersForScope(scope);
  const incompatibleFilters = activeFilters.filter(
    (filter) => !availableFilters.includes(filter)
  );

  return {
    isValid: incompatibleFilters.length === 0,
    incompatibleFilters,
  };
};
