# Inquiry Filters: How to add a new filter (SSOT)

This project uses a Single Source of Truth (SSOT) for inquiry filters to keep UI, query building, and exports in sync.

Core file:

- src/components/inquiry-data/filterRegistry.ts

What the registry controls:

- Filter list, default labels, order, and mandatory flags
- Which filters appear in the UI (showInUI)
- Column name and optional reference table for SQL (builder derives from this)
- Normalized filter ordering for stable column order across Tayang, SQL, CSV and Excel

## Steps to add a new filter

1. Define the filter in the registry

- Open src/components/inquiry-data/filterRegistry.ts
- Add a FilterDef entry to INQUIRY_FILTER_DEFS with:
  - key: unique filter key (string)
  - label: human‑readable label
  - order: integer (used to consistently sort toggles and columns)
  - mandatory?: make true if it must always be active (e.g., cutOff)
  - showInUI?: set false for internal-only filters (default is true)
  - query?:
    - columnName: the main table column for this filter
    - reference?: if the filter can display uraian or supports name search
      - database, table, joinKey, nameColumn for the reference table

Example:

- Add "wilayahKerja" filter that joins to a reference table and is visible in UI:

  key: "wilayahKerja"
  label: "Wilayah Kerja"
  order: 20
  showInUI: true
  query:
  columnName: "kdwil"
  reference:
  database: "dbref"
  table: "t_wil"
  joinKey: "kdwil"
  nameColumn: "nmwil"

2. (Optional) Provide options for the filter card UI

- If the filter needs a dropdown/virtualized select with local options, update src/components/inquiry-data/filter-card.tsx:
  - Extend getFilterOptions(filterKey) to handle your new key
  - Import any needed JSON data for the options (or adapt to fetch from API if preferred)
  - If the filter depends on parent filters (e.g., program depends on kementerian/eselonI), follow the existing pattern to filter the options accordingly

3. That’s it for plumbing

- FilterParametersCard automatically shows your new filter (ordered by registry.order, labeled by registry.label, and respects mandatory)
- DynamicFiltersCard shows the same label and uses normalized order for Tayang and Downloads
- TayangModal, LihatSqlModal, CSV/Excel builds will follow the normalized SELECT order
- The query builder (use-inquiry-query-builder.ts) uses the registry mapping to build SELECT/JOIN/WHERE/GROUP BY

## Special filters

- cutOff
  - mandatory and not shown in SELECT; only influences REALISASI/monthly calculations
- akun variants
  - Internal variants (kodeBkpk, jenisBelanja) exist in the registry with showInUI: false for special grouping
  - The Akun filter’s type switch in the UI uses these variants implicitly when building SQL

## Tips for good ordering

- Keep "cutOff" as order 0
- Use small, contiguous integers for order to keep UI and column order predictable
- New filters should be appended at the end unless they conceptually belong in the middle

## Validating your addition

- Toggle the new filter and open "Tayang" — columns should include your filter in the right place
- Open "Lihat SQL" — the SELECT clause will reflect your filter’s columns and any reference joins when jenisTampilan is uraian/kode_uraian
- Download CSV/Excel — column order matches Tayang/SQL

## Where things are wired

- Registry and helpers: src/components/inquiry-data/filterRegistry.ts
- Filter toggles: src/components/inquiry-data/filter-parameters-card.tsx (consumes registry)
- Active filters and actions: src/components/inquiry-data/dynamic-filters-card.tsx (labels + normalized order)
- Tayang (preview): src/components/inquiry-data/modals/tayang-modal.tsx (normalized before execute)
- SQL preview: src/components/inquiry-data/modals/lihat-sql-modal.tsx (normalized before build)
- Query builder: src/hooks/use-inquiry-query-builder.ts (derives config from registry)

## Questions or edge cases

- Filters without reference tables can still be added — just omit the "reference" block
- If you need per-report visibility, you can add a flag or predicate to FilterDef later (e.g., enabledFor(reportParams)) and filter in getUIFilters()
- For server-side ordering guarantees, we currently rely on normalized SELECT order (no backend changes required)

## Registry adoption status

Adoption status (what uses the registry now)

- FilterParametersCard (filter-parameters-card.tsx)
  - Uses getUIFilters() for labels, order, and mandatory flag
- DynamicFiltersCard (dynamic-filters-card.tsx)
  - Uses getFilterLabel(filterKey) for labels
  - Uses normalizeActiveFilters() for consistent order across UI/actions
- Tayang modal (modals/tayang-modal.tsx)
  - Uses normalizeActiveFilters() before executeQuery (stable column order)
- Lihat SQL modal (modals/lihat-sql-modal.tsx)
  - Uses normalizeActiveFilters() before buildQuery (stable SELECT order)
- Query builder (hooks/use-inquiry-query-builder.ts)
  - FILTER_CONFIG is derived from getFilterConfigMap() (registry-powered columnName/reference mapping)

What’s still outside the registry (or not applicable)

- Filter card option sources (filter-card.tsx)
  - Dropdown options come from local datasets and parent-value filtering; labels are provided by parents using the registry
- Template scaffolding (query-builder-template.tsx)
  - Example/custom mappings unrelated to the main SSOT.
- Deprecated/legacy artifacts
  - filterOrder.ts is superseded by normalizeActiveFilters() from filterRegistry; remove once confirmed unused
  - Any leftover inline FILTER_CONFIG entries in use-inquiry-query-builder.ts can be deleted once verified

Quick checklist for future consistency

- Add new filters only to filterRegistry.ts (label, order, mandatory, query mapping)
- Use getFilterLabel() when you need a display label
- Use normalizeActiveFilters() before building SQL/exports for stable column order
- If the filter needs selection options, extend getFilterOptions() in filter-card.tsx (labels still come from registry)
