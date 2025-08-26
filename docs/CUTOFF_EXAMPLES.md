# Cut-Off Filter Examples

The Cut-Off filter is a special mandatory filter that controls which months are included in the realization calculation.

## How Cut-Off Works

### Basic Concept
- **Cut-Off Month**: Determines the last month to include in realization sum
- **Always Active**: Cannot be turned off, always appears in active filters
- **Not in SELECT**: Doesn't appear as a column in results, only affects calculation
- **Controls SUM**: Changes which `real{month}` columns are summed

### Examples

#### 1. Cut-Off = "03" (March)
```sql
-- Only includes January, February, March
ROUND(SUM(real1 + real2 + real3) / 1, 0) AS REALISASI
```

#### 2. Cut-Off = "06" (June) 
```sql
-- Includes January through June
ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6) / 1, 0) AS REALISASI
```

#### 3. Cut-Off = "12" (December)
```sql
-- Includes all months (full year)
ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12) / 1, 0) AS REALISASI
```

## Integration with Pembulatan

The Cut-Off filter works together with the Pembulatan setting:

### Cut-Off = "06", Pembulatan = "ribuan"
```sql
ROUND(SUM(main.pagu) / 1000, 0) AS PAGU_DIPA,
ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6) / 1000, 0) AS REALISASI
```

### Cut-Off = "12", Pembulatan = "jutaan"
```sql
ROUND(SUM(main.pagu) / 1000000, 0) AS PAGU_DIPA,
ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12) / 1000000, 0) AS REALISASI
```

## Complete Query Example

### Input:
- Active Filters: `['cutOff', 'kementerian']`
- Filter Values: 
  ```json
  {
    "cutOff": { "selection": "09" },
    "kementerian": { "selection": "001", "jenisTampilan": "kode" }
  }
  ```
- Report Params: `{ tahun: '2024', pembulatan: 'satuan' }`

### Generated Query:
```sql
SELECT
  main.kementerian AS kementerian_kode,
  ROUND(SUM(main.pagu) / 1, 0) AS PAGU_DIPA,
  ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9) / 1, 0) AS REALISASI
FROM monev2024.pagu_real_detail_harian_2024 AS main
WHERE
  main.kementerian = '001'
GROUP BY
  main.kementerian
ORDER BY
  main.kementerian
LIMIT 10000
```

## Key Points

1. **Mandatory Columns**: Every query always includes:
   - `PAGU_DIPA`: Total budget allocation
   - `REALISASI`: Realization sum based on cut-off

2. **Cut-Off Behavior**:
   - Always active in UI (switch disabled)
   - Defaults to current month if not specified
   - Only affects realization calculation, not WHERE clause
   - Not included in GROUP BY or ORDER BY

3. **Pembulatan Integration**:
   - Satuan: `/1` (no division)
   - Ribuan: `/1000`
   - Jutaan: `/1000000`
   - Applied to both PAGU and REALISASI consistently

4. **Year Usage**:
   - Year is only used for database and table name construction
   - Not included in WHERE clause (removed for performance)