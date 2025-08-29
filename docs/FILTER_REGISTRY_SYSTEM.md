# Filter Registry System Documentation

## Overview

The Filter Registry System is a modular architecture that manages filters and categories for the Inquiry Data system. It consists of two main registries that work together to provide flexible and reusable filter functionality across different pages (Belanja, Tematik, etc.).

## Architecture Components

### 1. Filter Registry (`filterRegistry.ts`)
**Purpose**: Defines reusable filters that can be used across different pages

### 2. Category Registry (`categoryRegistry.ts`) 
**Purpose**: Defines tematik categories with their specific requirements and mandatory filters

### 3. Query Builder (`use-inquiry-query-builder.ts`)
**Purpose**: Combines both registries to generate SQL queries

## Filter Registry (`filterRegistry.ts`)

### What it Contains
- **Reusable filter definitions** with reference table information
- **Column mappings** for SQL queries  
- **JOIN logic** for getting descriptions (uraian)
- **Support for different `jenisTampilan`** options (kode, uraian, kode_uraian, jangan_tampilkan)

### Filter Definition Structure
```typescript
interface FilterDef {
  key: string;                    // Unique identifier
  label: string;                  // Display name
  order: number;                  // Sort order
  mandatory?: boolean;            // Is this filter mandatory?
  showInUI?: boolean;            // Show in filter selection UI
  defaultTampilan?: JenisTampilan; // Default display type
  query?: {
    columnName: string;           // Database column name
    reference?: RefDef;           // Reference table for JOINs
  };
}

interface RefDef {
  database: string;               // Reference database name
  table: string;                  // Reference table name  
  joinKey: string;               // Column to join on
  nameColumn: string;            // Column containing descriptions
}
```

### Example Filter Definition
```typescript
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
      nameColumn: "nmdept"
    }
  }
}
```

### How Jenis Tampilan Works
When a filter has a reference table, the system automatically generates columns based on `jenisTampilan`:

- **`kode`**: Only shows the code column
  ```sql
  main.kddept AS kementerian_kode
  ```

- **`uraian`**: Only shows the description column (requires JOIN)
  ```sql
  LEFT JOIN dbref.t_dept_2025 AS kementerian_ref ON main.kddept = kementerian_ref.kddept
  SELECT kementerian_ref.nmdept AS kementerian_uraian
  ```

- **`kode_uraian`**: Shows both code and description columns
  ```sql
  LEFT JOIN dbref.t_dept_2025 AS kementerian_ref ON main.kddept = kementerian_ref.kddept
  SELECT 
    main.kddept AS kementerian_kode,
    kementerian_ref.nmdept AS kementerian_uraian
  ```

- **`jangan_tampilkan`**: Filter is active but no columns are added to SELECT

## Category Registry (`categoryRegistry.ts`)

### What it Contains
- **Category-specific mandatory filters**
- **Category-specific mandatory columns** (for data not handled by filters)
- **Query configuration** (table names, WHERE conditions)
- **UI behavior** (which standard filters to exclude/include)

### Category Definition Structure
```typescript
interface CategoryDefinition {
  key: string;                           // Unique identifier
  label: string;                         // Display name
  description?: string;                  // Category description
  mandatoryFilters: CategoryFilter[];    // Required filters
  mandatoryColumns: CategoryColumn[];    // Required data columns
  queryConfig: CategoryQueryConfig;      // SQL configuration
  excludeStandardFilters?: string[];     // Filters to hide
  includeStandardFilters?: string[];     // Filters to always show
  reportTypeRestriction?: string;        // Force specific report type
  jenisAkumulasiAllowed?: boolean;       // Allow accumulation type selection
}
```

### Example Category Definition
```typescript
{
  key: "prioritas_nasional",
  label: "Prioritas Nasional", 
  description: "Data prioritas nasional dengan filter PN hierarkis",
  mandatoryFilters: [
    {
      key: "jenisPn",              // References filter registry
      label: "Jenis PN",
      mandatory: true,
      removable: false,
      defaultValue: {
        selection: "all",
        jenisTampilan: "kode_uraian"
      }
    }
  ],
  mandatoryColumns: [],            // Empty - filter registry handles columns
  queryConfig: {
    tableName: "a_pagu_real_bkpk_dja",
    whereConditions: ["main.kdpn <> '00'"]
  },
  excludeStandardFilters: ["register"],
  reportTypeRestriction: "pagu_realisasi_bulanan"
}
```

## How the System Works Together

### 1. Filter Processing Flow
```
User selects filters → Category Registry (mandatory) + Filter Registry (optional)
                    ↓
                Query Builder processes both
                    ↓
                Generates SQL with JOINs and columns
```

### 2. Column Generation Priority
1. **Filter Registry columns** (with jenisTampilan logic)
2. **Category mandatory columns** (raw SQL expressions)
3. **Standard monetary columns** (PAGU, REALISASI, etc.)

### 3. JOIN Generation
- **Automatic**: Filter Registry generates JOINs based on `jenisTampilan` and `mengandungKata`
- **Manual**: Category Registry can specify custom JOINs in `queryConfig.customJoins`

## Adding New Filters: Decision Tree

### Option 1: Filter Already Exists in Filter Registry ✅ **RECOMMENDED**

**When to use**: The filter you need already exists (kementerian, provinsi, jenisPn, etc.)

**Steps**:
1. **Only modify Category Registry** - Add filter key to `mandatoryFilters`
2. **Don't add to `mandatoryColumns`** - Filter registry handles columns automatically

```typescript
// ✅ CORRECT: Only add to Category Registry
mandatoryFilters: [
  {
    key: "kementerian", // Already exists in filter registry
    mandatory: true,
    defaultValue: {
      jenisTampilan: "kode_uraian" // Auto-generates kementerian_kode + kementerian_uraian
    }
  }
],
mandatoryColumns: [] // Empty - filter registry handles it
```

### Option 2: Filter Doesn't Exist - Add New Reusable Filter

**When to use**: You need a new filter that could be reused across categories

**Steps**:
1. **Add to Filter Registry first**
2. **Then add to Category Registry** as mandatory filter

```typescript
// Step 1: Add to Filter Registry
{
  key: "jenisKontrak",
  label: "Jenis Kontrak",
  order: 300,
  showInUI: true,
  query: {
    columnName: "kd_jenis_kontrak",
    reference: {
      database: "dbref",
      table: "t_jenis_kontrak",
      joinKey: "kd_jenis_kontrak", 
      nameColumn: "nm_jenis_kontrak"
    }
  }
}

// Step 2: Add to Category Registry
mandatoryFilters: [
  {
    key: "jenisKontrak", // References filter registry
    mandatory: true,
    defaultValue: {
      jenisTampilan: "kode_uraian"
    }
  }
]
```

### Option 3: Category-Specific Data Column

**When to use**: You need raw data columns, calculated fields, or non-filterable data

**Steps**:
1. **Add to `mandatoryColumns`** in Category Registry only
2. **Don't add to Filter Registry**

```typescript
// ✅ CORRECT: Add to mandatoryColumns for raw data
mandatoryColumns: [
  {
    key: "total_kontrak",
    label: "Total Kontrak", 
    sqlExpression: "ROUND(SUM(main.nilai_kontrak) / {divisor}, 0)",
    order: 1,
    dataType: "number",
    isMonetary: true
  }
]
```

## Complete Example: Adding New Category

Let's create a "Pengadaan Barang" category with a new "jenisKontrak" filter:

### Step 1: Add Filter to Filter Registry
```typescript
// In filterRegistry.ts - Add to INQUIRY_FILTER_DEFS array
{
  key: "jenisKontrak",
  label: "Jenis Kontrak",
  order: 300,
  showInUI: true,
  query: {
    columnName: "kd_jenis_kontrak",
    reference: {
      database: "dbref",
      table: "t_jenis_kontrak",
      joinKey: "kd_jenis_kontrak",
      nameColumn: "nm_jenis_kontrak"
    }
  }
}
```

### Step 2: Add Category to Category Registry
```typescript
// In categoryRegistry.ts - Add to TEMATIK_CATEGORIES array
{
  key: "pengadaan_barang",
  label: "Pengadaan Barang",
  description: "Data pengadaan barang dan jasa pemerintah",
  mandatoryFilters: [
    {
      key: "jenisKontrak", // References filter registry
      label: "Jenis Kontrak",
      mandatory: true,
      removable: false,
      defaultValue: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode_uraian" // Shows both code and description
      }
    },
    {
      key: "kementerian", // Existing filter from registry
      label: "Kementerian",
      mandatory: true,
      removable: false,
      defaultValue: {
        selection: "all",
        jenisTampilan: "kode_uraian"
      }
    }
  ],
  mandatoryColumns: [
    // Only for data not handled by filters
    {
      key: "total_nilai_kontrak",
      label: "Total Nilai Kontrak",
      sqlExpression: "ROUND(SUM(main.nilai_kontrak) / {divisor}, 0)",
      order: 1,
      dataType: "number",
      isMonetary: true
    },
    {
      key: "jumlah_kontrak",
      label: "Jumlah Kontrak",
      sqlExpression: "COUNT(DISTINCT main.no_kontrak)",
      order: 2,
      dataType: "number"
    }
  ],
  queryConfig: {
    tableName: "pengadaan_detail",
    whereConditions: [
      "main.status_kontrak = 'AKTIF'",
      "main.nilai_kontrak > 0"
    ],
    customJoins: [
      // Optional: custom JOINs if needed
      "LEFT JOIN master.m_vendor AS vendor ON main.kd_vendor = vendor.kd_vendor"
    ]
  },
  excludeStandardFilters: ["register", "akun"], // Hide these from UI
  reportTypeRestriction: "pagu_realisasi_bulanan",
  jenisAkumulasiAllowed: false
}
```

### Step 3: Generated SQL Result
With `jenisTampilan: "kode_uraian"`, the system will generate:

```sql
SELECT
  main.kd_jenis_kontrak AS jenisKontrak_kode,
  jenisKontrak_ref.nm_jenis_kontrak AS jenisKontrak_uraian,
  main.kddept AS kementerian_kode,
  kementerian_ref.nmdept AS kementerian_uraian,
  ROUND(SUM(main.nilai_kontrak) / 1, 0) AS total_nilai_kontrak,
  COUNT(DISTINCT main.no_kontrak) AS jumlah_kontrak,
  ROUND(SUM(main.pagu) / 1, 0) AS PAGU_DIPA,
  ROUND(SUM(real1 + real2 + ... + real12) / 1, 0) AS REALISASI
FROM monev2025.pengadaan_detail_2025 AS main
LEFT JOIN dbref.t_jenis_kontrak_2025 AS jenisKontrak_ref 
  ON main.kd_jenis_kontrak = jenisKontrak_ref.kd_jenis_kontrak
LEFT JOIN dbref.t_dept_2025 AS kementerian_ref 
  ON main.kddept = kementerian_ref.kddept
LEFT JOIN master.m_vendor AS vendor 
  ON main.kd_vendor = vendor.kd_vendor
WHERE 
  main.status_kontrak = 'AKTIF'
  AND main.nilai_kontrak > 0
  AND main.kdpn <> '00'
GROUP BY
  main.kd_jenis_kontrak,
  main.kddept
```

## Best Practices

### ✅ DO
- **Use Filter Registry** for reusable filters with reference tables
- **Use Category Registry** for category-specific configuration
- **Avoid duplication** between registries
- **Default to `kode_uraian`** for better user experience
- **Use meaningful filter keys** that match database columns when possible

### ❌ DON'T
- **Don't duplicate columns** between Filter Registry and Category Registry
- **Don't add filters to Category Registry** if they already exist in Filter Registry
- **Don't use `mandatoryColumns`** for data that should be filterable
- **Don't hardcode table names** - use the year parameter system

## Troubleshooting

### Issue: Duplicate Columns
**Problem**: Getting columns like `main.kdpn AS jenisPn_kode` and `main.kdpn AS kdpn`

**Solution**: Remove duplicate from `mandatoryColumns` in Category Registry

### Issue: Missing JOINs
**Problem**: `jenisTampilan: "kode_uraian"` not showing description columns

**Solution**: Ensure filter exists in Filter Registry with proper `reference` configuration

### Issue: Filter Not Showing
**Problem**: Mandatory filter not appearing in UI

**Solution**: Check that filter has `showInUI: true` in Filter Registry

## File Locations

- **Filter Registry**: `frontendNEx/src/components/inquiry-data/filterRegistry.ts`
- **Category Registry**: `frontendNEx/src/components/inquiry-data/categoryRegistry.ts`
- **Query Builder**: `frontendNEx/src/hooks/use-inquiry-query-builder.ts`
- **Tematik Page**: `frontendNEx/src/app/inquiry-data/tematik/page.tsx`

## Related Components

- **CategoryMandatoryFilters**: Displays mandatory filters for selected category
- **FilterParametersCard**: Shows optional filters (excluding mandatory ones)
- **DynamicFiltersCard**: Handles query execution and includes hidden mandatory filters
- **TayangModal**: Executes queries with all filters (visible + hidden)