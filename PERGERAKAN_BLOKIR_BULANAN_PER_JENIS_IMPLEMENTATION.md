# Pergerakan Blokir Bulanan Per Jenis (Tipe Laporan 6) Implementation

## Summary of Changes

This document outlines the implementation of the Pergerakan Blokir Bulanan Per Jenis (Tipe Laporan 6) functionality, which extends the pattern from Pergerakan Blokir Bulanan (Tipe Laporan 5) by adding mandatory kdblokir and nmblokir columns and GROUP BY kdblokir.

## Key Requirements Implemented

1. **Mandatory kdblokir and nmblokir columns** - Added before any other columns in SELECT clause
2. **Mandatory GROUP BY kdblokir** - Required for proper data aggregation by blokir type
3. **Monthly blokir columns** - Show monthly blokir breakdown (JAN, FEB, MAR, etc.) using blokir1-blokir12 columns
4. **Respect cutOff filter** - Only show monthly columns up to the selected cutOff month
5. **Use correct table** - Uses `pa_pagu_blokir_akun_{thang}_bulanan` instead of `pagu_real_detail_bulan`
6. **Remove PAGU_DIPA and REALISASI columns** - Since blokir data is broken down by monthly columns

## Files Modified

### 1. `src/hooks/use-inquiry-query-builder.ts`

**Changes in `buildTableName` method:**
- Added special case for `pergerakan_blokir_bulanan_per_jenis` to use correct table name format: `monev{thang}.pa_pagu_blokir_akun_{thang}_bulanan`

**Changes in `buildSelectClause` method:**
- Added new condition for `reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis"`
- Added mandatory kdblokir and nmblokir columns first:
  ```typescript
  // Add mandatory kdblokir and nmblokir columns first
  selectColumns.push(`main.kdblokir AS kdblokir_kode`);
  selectColumns.push(`main.nmblokir AS nmblokir_uraian`);
  ```
- Implemented monthly blokir column generation (same as tipe 5):
  ```typescript
  // Generate monthly blokir columns up to cutOff month
  for (let month = 1; month <= cutOffNum; month++) {
    const monthName = monthNames[month - 1];
    selectColumns.push(
      `ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`
    );
  }
  ```
- Updated PAGU_DIPA exclusion condition to include the new report type

**Changes in `buildGroupByClause` method:**
- Added mandatory GROUP BY kdblokir and nmblokir for tipe 6:
  ```typescript
  // For tipe laporan 6, add mandatory GROUP BY kdblokir and nmblokir
  if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis") {
    groupByColumns.push("main.kdblokir");
    groupByColumns.push("main.nmblokir");
  }
  ```
- Updated method signature to accept `reportParams` parameter
- Updated `buildQuery` function call to pass `reportParams` to `buildGroupByClause`

### 2. `src/hooks/__tests__/use-inquiry-query-builder.test.ts`

**Changes made:**

1. **Updated mock function** - Added logic for pergerakan_blokir_bulanan_per_jenis report type
2. **Added comprehensive test suite** for Pergerakan Blokir Bulanan Per Jenis:
   - Basic query with full year cutOff
   - Query with partial cutOff (June)
   - Query with filters and different pembulatan
   - Table name verification
   - Column order verification
   - GROUP BY order verification
   - Minimal configuration test
3. **Updated manual testing function** - Added test case for the new report type

## Generated SQL Query Examples

### Example 1: Basic Query (Full Year)
```sql
SELECT
  main.kdblokir AS kdblokir_kode,
  main.nmblokir AS nmblokir_uraian,
  ROUND(SUM(blokir1) / 1, 0) AS JAN,
  ROUND(SUM(blokir2) / 1, 0) AS FEB,
  ROUND(SUM(blokir3) / 1, 0) AS MAR,
  ROUND(SUM(blokir4) / 1, 0) AS APR,
  ROUND(SUM(blokir5) / 1, 0) AS MEI,
  ROUND(SUM(blokir6) / 1, 0) AS JUN,
  ROUND(SUM(blokir7) / 1, 0) AS JUL,
  ROUND(SUM(blokir8) / 1, 0) AS AGS,
  ROUND(SUM(blokir9) / 1, 0) AS SEP,
  ROUND(SUM(blokir10) / 1, 0) AS OKT,
  ROUND(SUM(blokir11) / 1, 0) AS NOV,
  ROUND(SUM(blokir12) / 1, 0) AS DES
FROM monev2024.pa_pagu_blokir_akun_2024_bulanan AS main
GROUP BY
  main.kdblokir,
  main.nmblokir
```

### Example 2: With CutOff Filter (June) and Pembulatan Jutaan
```sql
SELECT
  main.kdblokir AS kdblokir_kode,
  main.nmblokir AS nmblokir_uraian,
  ROUND(SUM(blokir1) / 1000000, 0) AS JAN,
  ROUND(SUM(blokir2) / 1000000, 0) AS FEB,
  ROUND(SUM(blokir3) / 1000000, 0) AS MAR,
  ROUND(SUM(blokir4) / 1000000, 0) AS APR,
  ROUND(SUM(blokir5) / 1000000, 0) AS MEI,
  ROUND(SUM(blokir6) / 1000000, 0) AS JUN
FROM monev2024.pa_pagu_blokir_akun_2024_bulanan AS main
GROUP BY
  main.kdblokir,
  main.nmblokir
```

### Example 3: With Filters
```sql
SELECT
  main.kdblokir AS kdblokir_kode,
  main.nmblokir AS nmblokir_uraian,
  main.kementerian AS kementerian_kode,
  main.satker AS satker_kode,
  ROUND(SUM(blokir1) / 1000000000, 0) AS JAN,
  ROUND(SUM(blokir2) / 1000000000, 0) AS FEB,
  ROUND(SUM(blokir3) / 1000000000, 0) AS MAR,
  ROUND(SUM(blokir4) / 1000000000, 0) AS APR,
  ROUND(SUM(blokir5) / 1000000000, 0) AS MEI,
  ROUND(SUM(blokir6) / 1000000000, 0) AS JUN,
  ROUND(SUM(blokir7) / 1000000000, 0) AS JUL,
  ROUND(SUM(blokir8) / 1000000000, 0) AS AGS,
  ROUND(SUM(blokir9) / 1000000000, 0) AS SEP
FROM monev2024.pa_pagu_blokir_akun_2024_bulanan AS main
WHERE
  main.kementerian = '001'
GROUP BY
  main.kdblokir,
  main.nmblokir,
  main.kementerian,
  main.satker
```

## Key Differences from Other Report Types

| Feature | Tipe 5 (Pergerakan Blokir Bulanan) | **Tipe 6 (Pergerakan Blokir Bulanan Per Jenis)** |
|---------|-------------------------------------|---------------------------------------------------|
| Table | `pagu_real_detail_bulan` | `pa_pagu_blokir_akun_{thang}_bulanan` |
| Mandatory Columns | None | kdblokir, nmblokir (first in SELECT) |
| PAGU_DIPA Column | ❌ | ❌ |
| REALISASI Column | ❌ | ❌ |
| Monthly Columns | ✅ (blokir1, blokir2, etc.) | ✅ (blokir1, blokir2, etc.) |
| BLOKIR Column | ❌ | ❌ |
| Mandatory GROUP BY | None | kdblokir, nmblokir (first in GROUP BY) |
| CutOff Filter | ✅ | ✅ |

## Column Order Requirements

### SELECT Clause Order:
1. **Mandatory columns first**: `kdblokir_kode`, `nmblokir_uraian`
2. **Filter columns**: Based on active filters (kementerian, satker, etc.)
3. **Monthly columns**: JAN, FEB, MAR, etc. (up to cutOff month)

### GROUP BY Clause Order:
1. **Mandatory GROUP BY first**: `main.kdblokir`, `main.nmblokir`
2. **Filter columns**: Based on active filters (main.kementerian, main.satker, etc.)

## Testing

- All TypeScript compilation passes
- Comprehensive test cases added for the new report type
- Manual testing confirms correct SQL generation
- CutOff filter properly respected
- All pembulatan options work correctly
- Verification tests confirm:
  - ✅ Uses blokir1-blokir12 columns
  - ✅ Mandatory kdblokir and nmblokir columns appear first
  - ✅ Uses correct table (pa_pagu_blokir_akun_{thang}_bulanan)
  - ✅ Mandatory GROUP BY kdblokir and nmblokir
  - ✅ No PAGU_DIPA column
  - ✅ No REALISASI column
  - ✅ CutOff functionality works
  - ✅ Pembulatan functionality works
  - ✅ Column order is correct
  - ✅ GROUP BY order is correct

## Backward Compatibility

- No breaking changes to existing report types
- All existing functionality preserved
- New functionality only affects `pergerakan_blokir_bulanan_per_jenis` report type

## Usage

To use the new Pergerakan Blokir Bulanan Per Jenis report type, set the `tipeLaporan` parameter to `"pergerakan_blokir_bulanan_per_jenis"` when calling the query builder:

```typescript
const query = buildQuery(
  ['cutOff', 'kementerian'],
  {
    cutOff: { selection: '6' }, // June cutOff
    kementerian: { selection: '001', jenisTampilan: 'kode' }
  },
  {
    tahun: '2024',
    tipeLaporan: 'pergerakan_blokir_bulanan_per_jenis',
    pembulatan: 'jutaan'
  }
);
```

This will generate a query that shows:
1. **Mandatory kdblokir and nmblokir columns first**
2. **Monthly blokir data (JAN through JUN in this example)** using the blokir1-blokir6 columns
3. **Data grouped by kdblokir** for proper aggregation by blokir type
4. **Uses the correct table** (`pa_pagu_blokir_akun_{thang}_bulanan`) for blokir per jenis data

## Key Implementation Notes

1. **Mandatory Columns**: kdblokir and nmblokir are always included and appear first in both SELECT and GROUP BY clauses
2. **Table Selection**: Uses `pa_pagu_blokir_akun_{thang}_bulanan` table which contains blokir data broken down by jenis (type)
3. **Alias Strategy**: Uses `kdblokir_kode` and `nmblokir_uraian` aliases to be consistent with other filter column naming and enable left joins with other tables
4. **GROUP BY Requirement**: Always groups by kdblokir to ensure proper aggregation by blokir type
5. **Column Order**: Maintains strict order with mandatory columns first, then filter columns, then monthly columns