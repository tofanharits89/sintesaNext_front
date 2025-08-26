# Pergerakan Blokir Bulanan (Tipe Laporan 5) Implementation

## Summary of Changes

This document outlines the implementation of the Pergerakan Blokir Bulanan (Tipe Laporan 5) functionality, which follows the same pattern as Pergerakan Pagu Bulanan (Tipe Laporan 4) but uses blokir1-blokir12 columns instead of pagu1-pagu12 columns.

## Key Requirements Implemented

1. **Remove REALISASI column** - Pergerakan Blokir Bulanan only fetches blokir data, not realization data
2. **Remove PAGU_DIPA column** - Since blokir data is broken down by monthly columns, the aggregate PAGU_DIPA is not needed
3. **Add monthly blokir columns** - Show monthly blokir breakdown (JAN, FEB, MAR, etc.) using blokir1-blokir12 columns
4. **Respect cutOff filter** - Only show monthly columns up to the selected cutOff month
5. **Use correct table** - Uses `pagu_real_detail_bulan` instead of `pagu_real_detail_harian`

## Files Modified

### 1. `src/hooks/use-inquiry-query-builder.ts`

**Changes in `buildSelectClause` method:**

- Added new condition for `reportParams.tipeLaporan === "pergerakan_blokir_bulanan"`
- Implemented monthly blokir column generation:
  ```typescript
  // Generate monthly blokir columns up to cutOff month
  for (let month = 1; month <= cutOffNum; month++) {
    const monthName = monthNames[month - 1];
    selectColumns.push(
      `ROUND(SUM(blokir${month}) / ${divisor}, 0) AS ${monthName}`
    );
  }
  ```
- Updated PAGU_DIPA exclusion condition to include the new report type:
  ```typescript
  } else if (reportParams.tipeLaporan !== "pergerakan_pagu_bulanan" && reportParams.tipeLaporan !== "pergerakan_blokir_bulanan") {
  ```
- Removed REALISASI column for this report type

### 2. `src/hooks/__tests__/use-inquiry-query-builder.test.ts`

**Changes made:**

1. **Updated mock function** - Added logic for pergerakan_blokir_bulanan report type
2. **Added comprehensive test suite** for Pergerakan Blokir Bulanan:
   - Basic query with full year cutOff
   - Query with partial cutOff (June)
   - Query with filters and different pembulatan
   - Table name verification
3. **Updated manual testing function** - Added test case for the new report type

## Generated SQL Query Examples

### Example 1: Basic Query (Full Year)
```sql
SELECT
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
FROM monev2024.pagu_real_detail_bulan_2024 AS main
```

### Example 2: With CutOff Filter (June) and Pembulatan Jutaan
```sql
SELECT
  ROUND(SUM(blokir1) / 1000000, 0) AS JAN,
  ROUND(SUM(blokir2) / 1000000, 0) AS FEB,
  ROUND(SUM(blokir3) / 1000000, 0) AS MAR,
  ROUND(SUM(blokir4) / 1000000, 0) AS APR,
  ROUND(SUM(blokir5) / 1000000, 0) AS MEI,
  ROUND(SUM(blokir6) / 1000000, 0) AS JUN
FROM monev2024.pagu_real_detail_bulan_2024 AS main
```

### Example 3: With Filters
```sql
SELECT
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
FROM monev2024.pagu_real_detail_bulan_2024 AS main
WHERE
  main.kementerian = '001'
GROUP BY
  main.kementerian,
  main.satker
```

## Key Differences from Other Report Types

| Feature | Pagu Realisasi | Pagu Realisasi Bulanan | Pergerakan Pagu Bulanan | **Pergerakan Blokir Bulanan** |
|---------|----------------|------------------------|--------------------------|--------------------------------|
| Table | `pagu_real_detail_harian` | `pagu_real_detail_harian` | `pagu_real_detail_bulan` | `pagu_real_detail_bulan` |
| PAGU_DIPA Column | ✅ | ✅ | ❌ | ❌ |
| REALISASI Column | ✅ | ❌ (has monthly real columns) | ❌ | ❌ |
| Monthly Columns | ❌ | ✅ (real1, real2, etc.) | ✅ (pagu1, pagu2, etc.) | ✅ (blokir1, blokir2, etc.) |
| BLOKIR Column | ❌ | ✅ | ❌ | ❌ (replaced by monthly blokir columns) |
| CutOff Filter | ✅ (affects REALISASI) | ✅ (affects monthly display) | ✅ (affects monthly display) | ✅ (affects monthly display) |

## Testing

- All TypeScript compilation passes
- Comprehensive test cases added for the new report type
- Manual testing confirms correct SQL generation
- CutOff filter properly respected
- All pembulatan options work correctly
- Verification tests confirm:
  - ✅ Uses blokir1-blokir12 columns
  - ✅ No PAGU_DIPA column
  - ✅ No REALISASI column
  - ✅ Uses correct table (pagu_real_detail_bulan)
  - ✅ CutOff functionality works
  - ✅ Pembulatan functionality works

## Backward Compatibility

- No breaking changes to existing report types
- All existing functionality preserved
- New functionality only affects `pergerakan_blokir_bulanan` report type

## Usage

To use the new Pergerakan Blokir Bulanan report type, set the `tipeLaporan` parameter to `"pergerakan_blokir_bulanan"` when calling the query builder:

```typescript
const query = buildQuery(
  ['cutOff', 'kementerian'],
  {
    cutOff: { selection: '6' }, // June cutOff
    kementerian: { selection: '001', jenisTampilan: 'kode' }
  },
  {
    tahun: '2024',
    tipeLaporan: 'pergerakan_blokir_bulanan',
    pembulatan: 'jutaan'
  }
);
```

This will generate a query that shows monthly blokir data (JAN through JUN in this example) using the blokir1-blokir6 columns from the `pagu_real_detail_bulan` table.