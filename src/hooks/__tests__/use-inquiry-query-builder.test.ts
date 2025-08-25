/**
 * Test file for the inquiry query builder
 * 
 * This file contains test logic that can be used with any testing framework
 * or manually tested by importing the functions in a component
 */

// Mock testing functions (replace with your preferred testing framework)
const describe = (name: string, fn: () => void) => {
  console.log(`\n=== ${name} ===`);
  fn();
};

const it = (name: string, fn: () => void) => {
  console.log(`\nTest: ${name}`);
  try {
    fn();
    console.log('✅ PASSED');
  } catch (error) {
    console.log('❌ FAILED:', error);
  }
};

const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}`);
    }
  },
  toContain: (expected: any) => {
    if (!actual.includes(expected)) {
      throw new Error(`Expected "${actual}" to contain "${expected}"`);
    }
  },
  not: {
    toContain: (expected: any) => {
      if (actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to NOT contain "${expected}"`);
      }
    },
    toBe: (expected: any) => {
      if (actual === expected) {
        throw new Error(`Expected ${actual} to NOT be ${expected}`);
      }
    }
  },
  toBeLessThan: (expected: any) => {
    if (actual >= expected) {
      throw new Error(`Expected ${actual} to be less than ${expected}`);
    }
  },
  toBeGreaterThan: (expected: any) => {
    if (actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },
  toMatch: (pattern: RegExp) => {
    if (!pattern.test(actual)) {
      throw new Error(`Expected "${actual}" to match pattern ${pattern}`);
    }
  }
});

// Mock the hook for testing
const mockUseInquiryQueryBuilder = () => {
  const getPembulatanDivisor = (pembulatan: string): number => {
    switch (pembulatan) {
      case "ribuan": return 1000;
      case "jutaan": return 1000000;
      case "miliaran": return 1000000000;
      case "triliunan": return 1000000000000;
      default: return 1; // satuan
    }
  };

  const buildQuery = (
    activeFilters: string[],
    filterValues: Record<string, any>,
    reportParams: {
      tahun: string;
      tipeLaporan: string;
      pembulatan: string;
      jenisAkumulasi?: string;
    }
  ) => {
    // Build table name based on report type
    let baseTable = "pagu_real_detail_harian";
    if (reportParams.tipeLaporan === "pergerakan_pagu_bulanan" || reportParams.tipeLaporan === "pergerakan_blokir_bulanan") {
      baseTable = "pagu_real_detail_bulan";
    }
    const tableName = `monev${reportParams.tahun}.${baseTable}_${reportParams.tahun}`;
    const selectColumns: string[] = [];
    
    // Add regular filter columns (excluding cutOff)
    activeFilters.forEach(filter => {
      if (filter !== 'cutOff') {
        selectColumns.push(`main.${filter} AS ${filter}_kode`);
      }
    });
    
    // Get pembulatan divisor and cutOff month
    const divisor = getPembulatanDivisor(reportParams.pembulatan);
    const cutOffMonth = filterValues.cutOff?.selection || "12";
    const cutOffNum = parseInt(cutOffMonth);
    
    // Build realization sum based on cut-off month
    const realizationColumns = [];
    for (let month = 1; month <= cutOffNum; month++) {
      realizationColumns.push(`real${month}`);
    }
    const realizationSum = realizationColumns.join(" + ");
    
    // Add mandatory columns based on report type
    if (reportParams.tipeLaporan === "pagu_apbn") {
      // For Pagu APBN report (tipe laporan 1), add PAGU_APBN before PAGU_DIPA
      selectColumns.push(`ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / ${divisor}, 0) AS PAGU_APBN`);
      selectColumns.push(`ROUND(SUM(main.pagu_dipa) / ${divisor}, 0) AS PAGU_DIPA`);
    } else if (reportParams.tipeLaporan !== "pergerakan_pagu_bulanan") {
      // For other report types (except pergerakan_pagu_bulanan), keep the original PAGU_DIPA column
      // pergerakan_pagu_bulanan doesn't need PAGU_DIPA since pagu is broken down by monthly columns
      selectColumns.push(`ROUND(SUM(main.pagu) / ${divisor}, 0) AS PAGU_DIPA`);
    }

    // Handle realization columns based on report type
    if (reportParams.tipeLaporan === "pagu_realisasi_bulanan") {
      // For tipe laporan 3 (Pagu Realisasi Bulanan), show monthly columns up to cutOff
      const jenisAkumulasi = reportParams.jenisAkumulasi || "non_akumulatif";
      
      // Month names mapping
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGS", "SEP", "OKT", "NOV", "DES"];
      
      // Generate monthly columns up to cutOff month
      for (let month = 1; month <= cutOffNum; month++) {
        const monthName = monthNames[month - 1];
        
        if (jenisAkumulasi === "akumulatif") {
          // Akumulatif: each month sums from January until that month
          const cumulativeRealColumns = [];
          for (let i = 1; i <= month; i++) {
            cumulativeRealColumns.push(`real${i}`);
          }
          const cumulativeSum = cumulativeRealColumns.join(" + ");
          selectColumns.push(`ROUND(SUM(${cumulativeSum}) / ${divisor}, 0) AS ${monthName}`);
        } else {
          // Non-akumulatif (default): each month shows only that month's realization
          selectColumns.push(`ROUND(SUM(real${month}) / ${divisor}, 0) AS ${monthName}`);
        }
      }
      
      // Add mandatory BLOKIR column for tipe laporan 3
      selectColumns.push(`ROUND(SUM(blokir) / ${divisor}, 0) AS BLOKIR`);
    } else if (reportParams.tipeLaporan === "pergerakan_pagu_bulanan") {
      // For tipe laporan 4 (Pergerakan Pagu Bulanan), show monthly pagu columns up to cutOff
      // Month names mapping
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGS", "SEP", "OKT", "NOV", "DES"];
      
      // Generate monthly pagu columns up to cutOff month
      for (let month = 1; month <= cutOffNum; month++) {
        const monthName = monthNames[month - 1];
        selectColumns.push(`ROUND(SUM(pagu${month}) / ${divisor}, 0) AS ${monthName}`);
      }
      // No REALISASI column for pergerakan_pagu_bulanan as it only fetches pagu data
    } else {
      // For other report types, add single REALISASI column based on cut-off and pembulatan
      selectColumns.push(`ROUND(SUM(${realizationSum}) / ${divisor}, 0) AS REALISASI`);
      
      // Add BLOKIR column after REALISASI for Pagu APBN report
      if (reportParams.tipeLaporan === "pagu_apbn") {
        selectColumns.push(`ROUND(SUM(main.blokir) / ${divisor}, 0) AS BLOKIR`);
      }
    }
    
    let query = `SELECT\n  ${selectColumns.join(",\n  ")}`;
    query += `\nFROM ${tableName} AS main`;
    
    // Add WHERE conditions (year is only used for table name, not WHERE clause)
    const whereConditions: string[] = [];
    
    activeFilters.forEach(filter => {
      if (filter !== 'cutOff') {
        const filterValue = filterValues[filter];
        if (filterValue?.selection && filterValue.selection !== 'all') {
          whereConditions.push(`main.${filter} = '${filterValue.selection}'`);
        }
      }
    });
    
    if (whereConditions.length > 0) {
      query += `\nWHERE\n  ${whereConditions.join("\n  AND ")}`;
    }
    
    // Add GROUP BY if there are filter columns
    const groupByColumns = activeFilters.filter(f => f !== 'cutOff').map(f => `main.${f}`);
    if (groupByColumns.length > 0) {
      query += `\nGROUP BY\n  ${groupByColumns.join(",\n  ")}`;
    }
    
    // ORDER BY and LIMIT removed - pagination handled on backend (50 per page)
    
    return query;
  };

  const encryptQuery = (query: string) => {
    return btoa(encodeURIComponent(query));
  };

  const decryptQuery = (encryptedQuery: string) => {
    return decodeURIComponent(atob(encryptedQuery));
  };

  return {
    buildQuery,
    encryptQuery,
    decryptQuery,
  };
};

// Test cases
describe('Inquiry Query Builder', () => {
  const queryBuilder = mockUseInquiryQueryBuilder();

  it('should build basic query with cutOff filter only', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '12' } // December cut-off
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    expect(query).toContain('PAGU_DIPA');
    expect(query).toContain('REALISASI');
    expect(query).toContain('real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12');
    expect(query).toContain('FROM monev2024.pagu_real_detail_harian_2024');
    expect(query).not.toContain('SISA_ANGGARAN');
    expect(query).not.toContain('PERSENTASE_REALISASI');
    expect(query).not.toContain('ORDER BY'); // ORDER BY removed for backend pagination
    expect(query).not.toContain('LIMIT'); // LIMIT removed for backend pagination
  });

  it('should build query with partial cutOff (June)', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '06' } // June cut-off
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'ribuan'
      }
    );

    expect(query).toContain('real1 + real2 + real3 + real4 + real5 + real6');
    expect(query).not.toContain('real7'); // Should not include months after June
    expect(query).toContain('/ 1000'); // Should have ribuan divisor
    expect(query).not.toContain('SISA_ANGGARAN');
    expect(query).not.toContain('PERSENTASE_REALISASI');
    expect(query).not.toContain('ORDER BY'); // ORDER BY removed for backend pagination
    expect(query).not.toContain('LIMIT'); // LIMIT removed for backend pagination
  });

  it('should build query with cutOff and kementerian filter', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff', 'kementerian'],
      {
        cutOff: { selection: '12' },
        kementerian: { selection: '001', jenisTampilan: 'kode' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    expect(query).toContain('main.kementerian AS kementerian_kode');
    expect(query).toContain('PAGU_DIPA');
    expect(query).toContain('REALISASI');
    expect(query).toContain("main.kementerian = '001'");
    expect(query).toContain('GROUP BY');
    expect(query).not.toContain('ORDER BY'); // ORDER BY removed for backend pagination
    expect(query).not.toContain('LIMIT'); // LIMIT removed for backend pagination
  });

  it('should build query with single filter - uraian (with JOIN)', () => {
    const query = queryBuilder.buildQuery(
      ['kementerian'],
      {
        kementerian: { selection: '001', jenisTampilan: 'uraian' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    expect(query).toContain('LEFT JOIN'); // Should have JOIN for uraian
    expect(query).toContain('dbref.t_dept_2024'); // Should join reference table
    expect(query).toContain("main.kementerian = '001'");
    expect(query).not.toContain('ORDER BY'); // ORDER BY removed for backend pagination
    expect(query).not.toContain('LIMIT'); // LIMIT removed for backend pagination
  });

  it('should build query with mengandung kata filter (with JOIN and auto kode_uraian)', () => {
    const query = queryBuilder.buildQuery(
      ['kementerian'],
      {
        kementerian: { 
          selection: 'all', 
          jenisTampilan: 'kode_uraian', // Should be auto-changed to this when mengandungKata is used
          mengandungKata: 'Perdagangan'
        }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    expect(query).toContain('LEFT JOIN'); // Should have JOIN for mengandung kata search
    expect(query).toContain('LIKE %Perdagangan%'); // Should have LIKE condition
    expect(query).toContain('kementerian_kode'); // Should show code column
    expect(query).toContain('kementerian_uraian'); // Should show description column
    expect(query).not.toContain('ORDER BY'); // ORDER BY removed for backend pagination
    expect(query).not.toContain('LIMIT'); // LIMIT removed for backend pagination
  });

  it('should build query with cutOff and multiple filters', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff', 'kementerian', 'satker'],
      {
        cutOff: { selection: '09' }, // September cut-off
        kementerian: { selection: '001', jenisTampilan: 'kode' },
        satker: { selection: 'all', jenisTampilan: 'kode' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'jutaan'
      }
    );

    expect(query).toContain('main.kementerian AS kementerian_kode');
    expect(query).toContain('main.satker AS satker_kode');
    expect(query).toContain('real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9');
    expect(query).not.toContain('real10'); // Should not include months after September
    expect(query).toContain('/ 1000000'); // Should have jutaan divisor
    expect(query).toContain("main.kementerian = '001'");
    expect(query).not.toContain("main.satker = 'all'"); // 'all' should not create WHERE condition
    expect(query).not.toContain('ORDER BY'); // ORDER BY removed for backend pagination
    expect(query).not.toContain('LIMIT'); // LIMIT removed for backend pagination
  });

  it('should encrypt and decrypt queries correctly', () => {
    const originalQuery = 'SELECT * FROM test_table WHERE id = 1';
    const encrypted = queryBuilder.encryptQuery(originalQuery);
    const decrypted = queryBuilder.decryptQuery(encrypted);

    expect(decrypted).toBe(originalQuery);
    expect(encrypted).not.toBe(originalQuery);
  });

  it('should handle different pembulatan options', () => {
    const queryRibuan = queryBuilder.buildQuery(
      ['cutOff'],
      { cutOff: { selection: '12' } },
      { tahun: '2024', tipeLaporan: 'pagu_realisasi', pembulatan: 'ribuan' }
    );

    const queryJutaan = queryBuilder.buildQuery(
      ['cutOff'],
      { cutOff: { selection: '12' } },
      { tahun: '2024', tipeLaporan: 'pagu_realisasi', pembulatan: 'jutaan' }
    );

    expect(queryRibuan).toContain('/ 1000');
    expect(queryJutaan).toContain('/ 1000000');
    expect(queryRibuan).not.toContain('ORDER BY'); // ORDER BY removed for backend pagination
    expect(queryRibuan).not.toContain('LIMIT'); // LIMIT removed for backend pagination
    expect(queryJutaan).not.toContain('ORDER BY'); // ORDER BY removed for backend pagination
    expect(queryJutaan).not.toContain('LIMIT'); // LIMIT removed for backend pagination
  });

  it('should generate queries optimized for backend pagination (50 per page)', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff', 'kementerian'],
      {
        cutOff: { selection: '12' },
        kementerian: { selection: '001', jenisTampilan: 'kode' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    // Verify that pagination-related clauses are removed
    expect(query).not.toContain('ORDER BY');
    expect(query).not.toContain('LIMIT');
    expect(query).not.toContain('OFFSET');
    
    // Verify that the query ends with GROUP BY (when applicable)
    expect(query).toContain('GROUP BY');
    expect(query.trim()).toMatch(/GROUP BY\s+[\w\s,.\n]+$/);
    
    // Verify core functionality is preserved
    expect(query).toContain('SELECT');
    expect(query).toContain('FROM');
    expect(query).toContain('PAGU_DIPA');
    expect(query).toContain('REALISASI');
  });

  it('should build query for Pagu APBN report (tipe laporan 1) with mandatory columns', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '12' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_apbn',
        pembulatan: 'satuan'
      }
    );

    // Verify mandatory columns for Pagu APBN report
    expect(query).toContain('PAGU_APBN');
    expect(query).toContain('PAGU_DIPA');
    expect(query).toContain('BLOKIR');
    expect(query).toContain('REALISASI');
    
    // Verify PAGU_APBN comes before PAGU_DIPA
    const paguApbnIndex = query.indexOf('PAGU_APBN');
    const paguDipaIndex = query.indexOf('PAGU_DIPA');
    expect(paguApbnIndex).toBeLessThan(paguDipaIndex);
    
    // Verify BLOKIR comes after REALISASI
    const blokirIndex = query.indexOf('BLOKIR');
    const realisasiIndex = query.indexOf('REALISASI');
    expect(blokirIndex).toBeGreaterThan(realisasiIndex);
    
    // Verify correct SQL syntax for PAGU_APBN
    expect(query).toContain('ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / 1, 0) AS PAGU_APBN');
    expect(query).toContain('ROUND(SUM(main.blokir) / 1, 0) AS BLOKIR');
  });

  it('should build query for Pagu APBN report with pembulatan', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff', 'kementerian'],
      {
        cutOff: { selection: '06' },
        kementerian: { selection: '001', jenisTampilan: 'kode' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_apbn',
        pembulatan: 'jutaan'
      }
    );

    // Verify pembulatan is applied to all mandatory columns
    expect(query).toContain('ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / 1000000, 0) AS PAGU_APBN');
    expect(query).toContain('ROUND(SUM(main.pagu_dipa) / 1000000, 0) AS PAGU_DIPA');
    expect(query).toContain('ROUND(SUM(main.blokir) / 1000000, 0) AS BLOKIR');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6) / 1000000, 0) AS REALISASI');
  });

  it('should build query for non-Pagu APBN reports without additional columns', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '12' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    // Verify only standard columns for non-Pagu APBN reports
    expect(query).not.toContain('PAGU_APBN');
    expect(query).not.toContain('BLOKIR');
    expect(query).toContain('PAGU_DIPA');
    expect(query).toContain('REALISASI');
  });
});

// Test cases for Tipe Laporan 4 (Pergerakan Pagu Bulanan)
describe('Pergerakan Pagu Bulanan (Tipe Laporan 4)', () => {
  const queryBuilder = mockUseInquiryQueryBuilder();

  it('should build query for pergerakan_pagu_bulanan with monthly pagu columns', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '12' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pergerakan_pagu_bulanan',
        pembulatan: 'satuan'
      }
    );

    expect(query).not.toContain('PAGU_DIPA'); // Should not have PAGU_DIPA since pagu is broken down by monthly columns
    expect(query).toContain('ROUND(SUM(pagu1) / 1, 0) AS JAN');
    expect(query).toContain('ROUND(SUM(pagu2) / 1, 0) AS FEB');
    expect(query).toContain('ROUND(SUM(pagu3) / 1, 0) AS MAR');
    expect(query).toContain('ROUND(SUM(pagu4) / 1, 0) AS APR');
    expect(query).toContain('ROUND(SUM(pagu5) / 1, 0) AS MEI');
    expect(query).toContain('ROUND(SUM(pagu6) / 1, 0) AS JUN');
    expect(query).toContain('ROUND(SUM(pagu7) / 1, 0) AS JUL');
    expect(query).toContain('ROUND(SUM(pagu8) / 1, 0) AS AGS');
    expect(query).toContain('ROUND(SUM(pagu9) / 1, 0) AS SEP');
    expect(query).toContain('ROUND(SUM(pagu10) / 1, 0) AS OKT');
    expect(query).toContain('ROUND(SUM(pagu11) / 1, 0) AS NOV');
    expect(query).toContain('ROUND(SUM(pagu12) / 1, 0) AS DES');
    expect(query).not.toContain('REALISASI'); // Should not have REALISASI column
    expect(query).not.toContain('BLOKIR'); // Should not have BLOKIR column
  });

  it('should build query for pergerakan_pagu_bulanan with cutOff filter (June)', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '6' } // June cutOff
      },
      {
        tahun: '2024',
        tipeLaporan: 'pergerakan_pagu_bulanan',
        pembulatan: 'jutaan'
      }
    );

    // Should contain months up to June
    expect(query).toContain('ROUND(SUM(pagu1) / 1000000, 0) AS JAN');
    expect(query).toContain('ROUND(SUM(pagu2) / 1000000, 0) AS FEB');
    expect(query).toContain('ROUND(SUM(pagu3) / 1000000, 0) AS MAR');
    expect(query).toContain('ROUND(SUM(pagu4) / 1000000, 0) AS APR');
    expect(query).toContain('ROUND(SUM(pagu5) / 1000000, 0) AS MEI');
    expect(query).toContain('ROUND(SUM(pagu6) / 1000000, 0) AS JUN');
    
    // Should NOT contain months after June
    expect(query).not.toContain('AS JUL');
    expect(query).not.toContain('AS AGS');
    expect(query).not.toContain('AS SEP');
    expect(query).not.toContain('AS OKT');
    expect(query).not.toContain('AS NOV');
    expect(query).not.toContain('AS DES');
    
    // Should not have REALISASI column
    expect(query).not.toContain('REALISASI');
  });

  it('should build query for pergerakan_pagu_bulanan with filters and pembulatan', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff', 'kementerian', 'satker'],
      {
        cutOff: { selection: '9' }, // September cutOff
        kementerian: { selection: '001', jenisTampilan: 'kode' },
        satker: { selection: 'all', jenisTampilan: 'kode' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pergerakan_pagu_bulanan',
        pembulatan: 'miliaran'
      }
    );

    expect(query).toContain('main.kementerian AS kementerian_kode');
    expect(query).toContain('main.satker AS satker_kode');
    expect(query).not.toContain('PAGU_DIPA'); // Should not have PAGU_DIPA since pagu is broken down by monthly columns
    
    // Should contain months up to September with miliaran divisor
    expect(query).toContain('ROUND(SUM(pagu1) / 1000000000, 0) AS JAN');
    expect(query).toContain('ROUND(SUM(pagu9) / 1000000000, 0) AS SEP');
    
    // Should NOT contain months after September
    expect(query).not.toContain('AS OKT');
    expect(query).not.toContain('AS NOV');
    expect(query).not.toContain('AS DES');
    
    expect(query).toContain("main.kementerian = '001'");
    expect(query).not.toContain("main.satker = 'all'"); // 'all' should not create WHERE condition
    expect(query).not.toContain('REALISASI'); // Should not have REALISASI column
  });

  it('should use correct table for pergerakan_pagu_bulanan', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '12' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pergerakan_pagu_bulanan',
        pembulatan: 'satuan'
      }
    );

    // Should use the correct table name for pergerakan_pagu_bulanan
    expect(query).toContain('FROM monev2024.pagu_real_detail_bulan_2024');
  });
});

// Manual testing function (can be called from a component)
export const testQueryBuilder = () => {
  const queryBuilder = mockUseInquiryQueryBuilder();
  
  console.log('Testing Query Builder...');
  
  // Test 1: Basic query with cutOff only
  const basicQuery = queryBuilder.buildQuery(
    ['cutOff'],
    { cutOff: { selection: '12' } },
    { tahun: '2024', tipeLaporan: 'pagu_realisasi', pembulatan: 'satuan' }
  );
  console.log('Basic Query with CutOff:', basicQuery);
  
  // Test 2: Query with cutOff and filters
  const filteredQuery = queryBuilder.buildQuery(
    ['cutOff', 'kementerian', 'satker'],
    {
      cutOff: { selection: '06' }, // June cut-off
      kementerian: { selection: '001', jenisTampilan: 'kode_uraian' },
      satker: { selection: '123456', jenisTampilan: 'kode' }
    },
    { tahun: '2024', tipeLaporan: 'pagu_realisasi', pembulatan: 'jutaan' }
  );
  console.log('Filtered Query with CutOff:', filteredQuery);
  
  // Test 3: Different pembulatan
  const pembulatanQuery = queryBuilder.buildQuery(
    ['cutOff', 'kementerian'],
    {
      cutOff: { selection: '03' }, // March cut-off
      kementerian: { selection: '001', jenisTampilan: 'kode' }
    },
    { tahun: '2024', tipeLaporan: 'pagu_realisasi', pembulatan: 'ribuan' }
  );
  console.log('Pembulatan Query:', pembulatanQuery);
  
  // Test 4: Pagu APBN report (tipe laporan 1)
  const paguApbnQuery = queryBuilder.buildQuery(
    ['cutOff', 'kementerian'],
    {
      cutOff: { selection: '12' },
      kementerian: { selection: '001', jenisTampilan: 'kode' }
    },
    { tahun: '2024', tipeLaporan: 'pagu_apbn', pembulatan: 'jutaan' }
  );
  console.log('Pagu APBN Query (Tipe Laporan 1):', paguApbnQuery);
  
  // Test 5: Pergerakan Pagu Bulanan report (tipe laporan 4)
  const pergerakanPaguQuery = queryBuilder.buildQuery(
    ['cutOff', 'kementerian'],
    {
      cutOff: { selection: '6' }, // June cutOff
      kementerian: { selection: '001', jenisTampilan: 'kode' }
    },
    { tahun: '2024', tipeLaporan: 'pergerakan_pagu_bulanan', pembulatan: 'jutaan' }
  );
  console.log('Pergerakan Pagu Bulanan Query (Tipe Laporan 4):', pergerakanPaguQuery);
  
  // Test 5: Encryption
  const encrypted = queryBuilder.encryptQuery(filteredQuery);
  const decrypted = queryBuilder.decryptQuery(encrypted);
  console.log('Encryption works:', decrypted === filteredQuery);
  
  return {
    basicQuery,
    filteredQuery,
    pembulatanQuery,
    paguApbnQuery,
    pergerakanPaguQuery,
    encrypted,
    decrypted
  };
};

// Test mutual exclusion behavior
describe('Filter Mutual Exclusion', () => {
  const queryBuilder = mockUseInquiryQueryBuilder();

  it('should handle main selection only (others ignored)', () => {
    const query = queryBuilder.buildQuery(
      ['kementerian'],
      {
        kementerian: { 
          selection: '001', 
          kondisiCode: '002,003', // Should be ignored
          mengandungKata: 'Perdagangan', // Should be ignored
          jenisTampilan: 'kode'
        }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    expect(query).toContain("main.kementerian = '001'");
    expect(query).not.toContain('002,003');
    expect(query).not.toContain('Perdagangan');
  });

  it('should handle kondisi only (others ignored)', () => {
    const query = queryBuilder.buildQuery(
      ['kementerian'],
      {
        kementerian: { 
          selection: 'all', // Should be used as default
          kondisiCode: '001,002,003',
          mengandungKata: '', // Empty, so kondisi should work
          jenisTampilan: 'kode'
        }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    expect(query).toContain("main.kementerian IN ('001', '002', '003')");
    expect(query).not.toContain("main.kementerian = 'all'");
  });

  it('should handle mengandung kata only (others ignored)', () => {
    const query = queryBuilder.buildQuery(
      ['kementerian'],
      {
        kementerian: { 
          selection: 'all', // Should be used as default
          kondisiCode: '', // Empty, so mengandung kata should work
          mengandungKata: 'Perdagangan',
          jenisTampilan: 'kode_uraian'
        }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi',
        pembulatan: 'satuan'
      }
    );

    expect(query).toContain('LIKE %Perdagangan%');
    expect(query).toContain('LEFT JOIN'); // Should have JOIN for LIKE search
  });
});
// Test cases for Tipe Laporan 3 (Pagu Realisasi Bulanan) with Jenis Akumulasi
describe('Pagu Realisasi Bulanan (Tipe Laporan 3) with Jenis Akumulasi', () => {
  const queryBuilder = mockUseInquiryQueryBuilder();

  it('should build query for pagu_realisasi_bulanan with non-akumulatif (default)', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '12' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'satuan',
        jenisAkumulasi: 'non_akumulatif'
      }
    );

    expect(query).toContain('PAGU_DIPA');
    expect(query).toContain('ROUND(SUM(real1) / 1, 0) AS JAN');
    expect(query).toContain('ROUND(SUM(real2) / 1, 0) AS FEB');
    expect(query).toContain('ROUND(SUM(real3) / 1, 0) AS MAR');
    expect(query).toContain('ROUND(SUM(real4) / 1, 0) AS APR');
    expect(query).toContain('ROUND(SUM(real5) / 1, 0) AS MEI');
    expect(query).toContain('ROUND(SUM(real6) / 1, 0) AS JUN');
    expect(query).toContain('ROUND(SUM(real7) / 1, 0) AS JUL');
    expect(query).toContain('ROUND(SUM(real8) / 1, 0) AS AGS');
    expect(query).toContain('ROUND(SUM(real9) / 1, 0) AS SEP');
    expect(query).toContain('ROUND(SUM(real10) / 1, 0) AS OKT');
    expect(query).toContain('ROUND(SUM(real11) / 1, 0) AS NOV');
    expect(query).toContain('ROUND(SUM(real12) / 1, 0) AS DES');
    expect(query).toContain('ROUND(SUM(blokir) / 1, 0) AS BLOKIR');
    expect(query).not.toContain('REALISASI'); // Should not have single REALISASI column
  });

  it('should build query for pagu_realisasi_bulanan with akumulatif', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '12' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'satuan',
        jenisAkumulasi: 'akumulatif'
      }
    );

    expect(query).toContain('PAGU_DIPA');
    expect(query).toContain('ROUND(SUM(real1) / 1, 0) AS JAN');
    expect(query).toContain('ROUND(SUM(real1 + real2) / 1, 0) AS FEB');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3) / 1, 0) AS MAR');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4) / 1, 0) AS APR');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5) / 1, 0) AS MEI');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6) / 1, 0) AS JUN');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7) / 1, 0) AS JUL');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8) / 1, 0) AS AGS');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9) / 1, 0) AS SEP');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10) / 1, 0) AS OKT');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11) / 1, 0) AS NOV');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12) / 1, 0) AS DES');
    expect(query).toContain('ROUND(SUM(blokir) / 1, 0) AS BLOKIR');
    expect(query).not.toContain('REALISASI'); // Should not have single REALISASI column
  });

  it('should build query for pagu_realisasi_bulanan with pembulatan jutaan and akumulatif', () => {
    const query = queryBuilder.buildQuery(
      ['kementerian'],
      {
        kementerian: { selection: '001', kondisiCode: '', mengandungKata: '', jenisTampilan: 'kode' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'jutaan',
        jenisAkumulasi: 'akumulatif'
      }
    );

    expect(query).toContain('PAGU_DIPA');
    expect(query).toContain('ROUND(SUM(real1) / 1000000, 0) AS JAN');
    expect(query).toContain('ROUND(SUM(real1 + real2) / 1000000, 0) AS FEB');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12) / 1000000, 0) AS DES');
    expect(query).toContain('ROUND(SUM(blokir) / 1000000, 0) AS BLOKIR');
    expect(query).toContain('main.kementerian = \'001\'');
  });

  it('should default to non_akumulatif when jenisAkumulasi is not specified', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      {
        cutOff: { selection: '12' }
      },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'satuan'
        // jenisAkumulasi not specified, should default to non_akumulatif
      }
    );

    expect(query).toContain('ROUND(SUM(real1) / 1, 0) AS JAN');
    expect(query).toContain('ROUND(SUM(real2) / 1, 0) AS FEB');
    expect(query).toContain('ROUND(SUM(real12) / 1, 0) AS DES');
    expect(query).not.toContain('real1 + real2'); // Should not have cumulative sums
  });

  it('should always include BLOKIR column for pagu_realisasi_bulanan regardless of jenisAkumulasi', () => {
    const queryNonAkumulatif = queryBuilder.buildQuery(
      ['cutOff'],
      { cutOff: { selection: '12' } },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'satuan',
        jenisAkumulasi: 'non_akumulatif'
      }
    );

    const queryAkumulatif = queryBuilder.buildQuery(
      ['cutOff'],
      { cutOff: { selection: '12' } },
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'satuan',
        jenisAkumulasi: 'akumulatif'
      }
    );

    expect(queryNonAkumulatif).toContain('ROUND(SUM(blokir) / 1, 0) AS BLOKIR');
    expect(queryAkumulatif).toContain('ROUND(SUM(blokir) / 1, 0) AS BLOKIR');
  });

  it('should respect cutOff selection and only show months up to cutOff (August = 8)', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      { cutOff: { selection: '8' } }, // August cutOff
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'satuan',
        jenisAkumulasi: 'non_akumulatif'
      }
    );

    // Should contain months up to August
    expect(query).toContain('AS JAN');
    expect(query).toContain('AS FEB');
    expect(query).toContain('AS MAR');
    expect(query).toContain('AS APR');
    expect(query).toContain('AS MEI');
    expect(query).toContain('AS JUN');
    expect(query).toContain('AS JUL');
    expect(query).toContain('AS AGS');
    
    // Should NOT contain months after August
    expect(query).not.toContain('AS SEP');
    expect(query).not.toContain('AS OKT');
    expect(query).not.toContain('AS NOV');
    expect(query).not.toContain('AS DES');
  });

  it('should respect cutOff selection with akumulatif (June = 6)', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      { cutOff: { selection: '6' } }, // June cutOff
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'satuan',
        jenisAkumulasi: 'akumulatif'
      }
    );

    // Should contain months up to June with cumulative sums
    expect(query).toContain('ROUND(SUM(real1) / 1, 0) AS JAN');
    expect(query).toContain('ROUND(SUM(real1 + real2) / 1, 0) AS FEB');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3) / 1, 0) AS MAR');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4) / 1, 0) AS APR');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5) / 1, 0) AS MEI');
    expect(query).toContain('ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6) / 1, 0) AS JUN');
    
    // Should NOT contain months after June
    expect(query).not.toContain('AS JUL');
    expect(query).not.toContain('AS AGS');
    expect(query).not.toContain('AS SEP');
    expect(query).not.toContain('AS OKT');
    expect(query).not.toContain('AS NOV');
    expect(query).not.toContain('AS DES');
  });

  it('should handle cutOff with single month (January = 1)', () => {
    const query = queryBuilder.buildQuery(
      ['cutOff'],
      { cutOff: { selection: '1' } }, // January only
      {
        tahun: '2024',
        tipeLaporan: 'pagu_realisasi_bulanan',
        pembulatan: 'satuan',
        jenisAkumulasi: 'non_akumulatif'
      }
    );

    // Should only contain January
    expect(query).toContain('ROUND(SUM(real1) / 1, 0) AS JAN');
    
    // Should NOT contain any other months
    expect(query).not.toContain('AS FEB');
    expect(query).not.toContain('AS MAR');
    expect(query).not.toContain('AS DES');
  });
});

// Manual testing function for the new functionality
export const testPaguRealisasiBulanan = () => {
  const queryBuilder = mockUseInquiryQueryBuilder();
  
  console.log('Testing Pagu Realisasi Bulanan (Tipe Laporan 3) with CutOff...');
  
  // Test 1: Non-akumulatif with full year (December)
  const nonAkumulatifQuery = queryBuilder.buildQuery(
    ['cutOff', 'kementerian'],
    {
      cutOff: { selection: '12' },
      kementerian: { selection: '001', kondisiCode: '', mengandungKata: '', jenisTampilan: 'kode' }
    },
    { tahun: '2024', tipeLaporan: 'pagu_realisasi_bulanan', pembulatan: 'jutaan', jenisAkumulasi: 'non_akumulatif' }
  );
  console.log('Non-Akumulatif Query (Dec):', nonAkumulatifQuery);
  
  // Test 2: Akumulatif with August cutOff
  const akumulatifQuery = queryBuilder.buildQuery(
    ['cutOff', 'kementerian'],
    {
      cutOff: { selection: '8' }, // August cutOff
      kementerian: { selection: '001', kondisiCode: '', mengandungKata: '', jenisTampilan: 'kode' }
    },
    { tahun: '2024', tipeLaporan: 'pagu_realisasi_bulanan', pembulatan: 'jutaan', jenisAkumulasi: 'akumulatif' }
  );
  console.log('Akumulatif Query (Aug):', akumulatifQuery);
  
  // Test 3: Non-akumulatif with June cutOff
  const juneCutOffQuery = queryBuilder.buildQuery(
    ['cutOff'],
    { cutOff: { selection: '6' } }, // June cutOff
    { tahun: '2024', tipeLaporan: 'pagu_realisasi_bulanan', pembulatan: 'satuan', jenisAkumulasi: 'non_akumulatif' }
  );
  console.log('Non-Akumulatif Query (Jun):', juneCutOffQuery);
  
  return {
    nonAkumulatifQuery,
    akumulatifQuery,
    juneCutOffQuery
  };
};