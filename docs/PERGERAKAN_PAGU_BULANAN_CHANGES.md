# Pergerakan Pagu Bulanan (Tipe Laporan 4) Implementation

## Summary of Changes

This document outlines the changes made to implement the Pergerakan Pagu Bulanan (Tipe Laporan 4) functionality as requested.

**UPDATE**: Removed PAGU_DIPA column as the pagu data is already broken down by monthly columns (pagu1, pagu2, etc.), making the aggregate PAGU_DIPA redundant.

## Key Requirements Implemented

1. **Remove REALISASI column** - Pergerakan Pagu Bulanan only fetches pagu data, not realization data
2. **Remove PAGU_DIPA column** - Since pagu data is broken down by monthly columns, the aggregate PAGU_DIPA is not needed
3. **Add monthly pagu columns** - Show monthly pagu breakdown (JAN, FEB, MAR, etc.)
4. **Respect cutOff filter** - Only show monthly columns up to the selected cutOff month
5. **Use correct table** - Uses `pagu_real_detail_bulan` instead of `pagu_real_detail_harian`

## Files Modified

### 1. `src/hooks/use-inquiry-query-builder.ts`

**Changes in `buildSelectClause` method:**

- Added new condition for `reportParams.tipeLaporan === "pergerakan_pagu_bulanan"`
- Implemented monthly pagu column generation:
  ```typescript
  // Generate monthly pagu columns up to cutOff month
  for (let month = 1; month <= cutOffNum; month++) {
    const monthName = monthNames[month - 1];
    selectColumns.push(
      `ROUND(SUM(pagu${month}) / ${divisor}, 0) AS ${monthName}`
    );
  }
  ```
- Removed REALISASI column for this report type
- No BLOKIR column for this report type

### 2. `src/hooks/__tests__/use-inquiry-query-builder.test.ts`

**Changes made:**

1. **Fixed syntax error** - Corrected broken comment line
2. **Updated mock function** - Added table name logic for different report types
3. **Added comprehensive test suite** for Pergerakan Pagu Bulanan:
   - Basic query with full year cutOff
   - Query with partial cutOff (June)
   - Query with filters and different pembulatan
   - Table name verification
4. **Updated manual testing function** - Added test case for the new report type

## Generated SQL Query Examples

### Example 1: Basic Query (Full Year)
```sql
SELECT
  ROUND(SUM(pagu1) / 1, 0) AS JAN,
  ROUND(SUM(pagu2) / 1, 0) AS FEB,
  ROUND(SUM(pagu3) / 1, 0) AS MAR,
  ROUND(SUM(pagu4) / 1, 0) AS APR,
  ROUND(SUM(pagu5) / 1, 0) AS MEI,
  ROUND(SUM(pagu6) / 1, 0) AS JUN,
  ROUND(SUM(pagu7) / 1, 0) AS JUL,
  ROUND(SUM(pagu8) / 1, 0) AS AGS,
  ROUND(SUM(pagu9) / 1, 0) AS SEP,
  ROUND(SUM(pagu10) / 1, 0) AS OKT,
  ROUND(SUM(pagu11) / 1, 0) AS NOV,
  ROUND(SUM(pagu12) / 1, 0) AS DES
FROM monev2024.pagu_real_detail_bulan_2024 AS main
```

### Example 2: With CutOff Filter (June) and Pembulatan Jutaan
```sql
SELECT
  ROUND(SUM(pagu1) / 1000000, 0) AS JAN,
  ROUND(SUM(pagu2) / 1000000, 0) AS FEB,
  ROUND(SUM(pagu3) / 1000000, 0) AS MAR,
  ROUND(SUM(pagu4) / 1000000, 0) AS APR,
  ROUND(SUM(pagu5) / 1000000, 0) AS MEI,
  ROUND(SUM(pagu6) / 1000000, 0) AS JUN
FROM monev2024.pagu_real_detail_bulan_2024 AS main
```

### Example 3: With Filters
```sql
SELECT
  main.kementerian AS kementerian_kode,
  main.satker AS satker_kode,
  ROUND(SUM(pagu1) / 1000000000, 0) AS JAN,
  ROUND(SUM(pagu2) / 1000000000, 0) AS FEB,
  ROUND(SUM(pagu3) / 1000000000, 0) AS MAR,
  ROUND(SUM(pagu4) / 1000000000, 0) AS APR,
  ROUND(SUM(pagu5) / 1000000000, 0) AS MEI,
  ROUND(SUM(pagu6) / 1000000000, 0) AS JUN,
  ROUND(SUM(pagu7) / 1000000000, 0) AS JUL,
  ROUND(SUM(pagu8) / 1000000000, 0) AS AGS,
  ROUND(SUM(pagu9) / 1000000000, 0) AS SEP
FROM monev2024.pagu_real_detail_bulan_2024 AS main
WHERE
  main.kementerian = '001'
  AND main.satker = '123456'
GROUP BY
  main.kementerian,
  main.satker
```

## Key Differences from Other Report Types

| Feature | Pagu Realisasi | Pagu Realisasi Bulanan | **Pergerakan Pagu Bulanan** |
|---------|----------------|------------------------|------------------------------|
| Table | `pagu_real_detail_harian` | `pagu_real_detail_harian` | `pagu_real_detail_bulan` |
| PAGU_DIPA Column | ✅ | ✅ | ❌ (replaced by monthly pagu columns) |
| REALISASI Column | ✅ | ❌ (has monthly real columns) | ❌ |
| Monthly Columns | ❌ | ✅ (real1, real2, etc.) | ✅ (pagu1, pagu2, etc.) |
| BLOKIR Column | ❌ | ✅ | ❌ |
| CutOff Filter | ✅ (affects REALISASI) | ✅ (affects monthly display) | ✅ (affects monthly display) |

## Testing

- All TypeScript compilation passes
- Comprehensive test cases added
- Manual testing confirms correct SQL generation
- CutOff filter properly respected
- All pembulatan options work correctly

## Backward Compatibility

- No breaking changes to existing report types
- All existing functionality preserved
- New functionality only affects `pergerakan_pagu_bulanan` report type