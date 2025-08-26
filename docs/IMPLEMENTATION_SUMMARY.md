# Implementation Summary: Mandatory Columns for Tipe Laporan 1 (Pagu APBN)

## Changes Made

### 1. Updated Query Builder Hook (`src/hooks/use-inquiry-query-builder.ts`)

Added conditional logic in the `buildSelectClause` function to include mandatory columns for "tipe laporan 1" (Pagu APBN):

**For `tipeLaporan === "pagu_apbn"`:**
- Added `PAGU_APBN` column before `PAGU_DIPA`: `ROUND(SUM(CONVERT(pagu_apbn, SIGNED))/1,0) AS PAGU_APBN`
- Updated `PAGU_DIPA` column to use `pagu_dipa`: `ROUND(SUM(main.pagu_dipa) / divisor, 0) AS PAGU_DIPA`
- Added `BLOKIR` column after `REALISASI`: `ROUND(SUM(blokir) /1,0) AS BLOKIR`

**For other report types:**
- Maintains existing behavior with only `PAGU_DIPA` column

### 2. Updated Test File (`src/hooks/__tests__/use-inquiry-query-builder.test.ts`)

Added comprehensive tests for the new functionality:
- Test for basic Pagu APBN query with mandatory columns
- Test for Pagu APBN query with pembulatan (jutaan, ribuan, etc.)
- Test to ensure non-Pagu APBN reports don't include the additional columns
- Verification of correct column ordering (PAGU_APBN < PAGU_DIPA < BLOKIR)

## Column Order for Tipe Laporan 1 (Pagu APBN)

1. **User-selected filter columns** (kementerian, satker, etc.)
2. **PAGU_APBN** - `ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / divisor, 0) AS PAGU_APBN`
3. **PAGU_DIPA** - `ROUND(SUM(main.pagu_dipa) / divisor, 0) AS PAGU_DIPA`
4. **REALISASI** - `ROUND(SUM(real1 + real2 + ... + realN) / divisor, 0) AS REALISASI`
5. **BLOKIR** - `ROUND(SUM(main.blokir) / divisor, 0) AS BLOKIR`

## Example Queries

### Pagu APBN Report (Tipe Laporan 1)
```sql
SELECT
  ROUND(SUM(CONVERT(main.pagu_apbn, SIGNED)) / 1, 0) AS PAGU_APBN,
  ROUND(SUM(main.pagu_dipa) / 1, 0) AS PAGU_DIPA,
  ROUND(SUM(real1 + real2 + ... + real12) / 1, 0) AS REALISASI,
  ROUND(SUM(main.blokir) / 1, 0) AS BLOKIR
FROM monev2024.pagu_real_detail_harian_dipa_apbn_2024 AS main
```

### Other Report Types (No Change)
```sql
SELECT
  ROUND(SUM(main.pagu) / 1, 0) AS PAGU_DIPA,
  ROUND(SUM(real1 + real2 + ... + real12) / 1, 0) AS REALISASI
FROM monev2024.pagu_real_detail_harian_2024 AS main
```

## Key Features

- **Conditional Logic**: Only applies to `tipeLaporan === "pagu_apbn"`
- **Pembulatan Support**: All columns respect the pembulatan setting (satuan, ribuan, jutaan, etc.)
- **CONVERT Function**: Uses `CONVERT(pagu_apbn, SIGNED)` for proper numeric handling
- **Backward Compatibility**: Other report types remain unchanged
- **Proper Column Ordering**: PAGU_APBN → PAGU_DIPA → REALISASI → BLOKIR

## Testing Results

✅ All mandatory column tests pass
✅ Column ordering is correct
✅ Pembulatan works for all new columns
✅ Backward compatibility maintained for other report types