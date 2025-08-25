"use client";

/**
 * Query Builder Template
 * 
 * This is a template for creating new inquiry data pages using the query builder system.
 * Copy this file and modify it for your specific use case.
 * 
 * Steps to create a new query builder page:
 * 1. Copy this file to your new component location
 * 2. Update the table mappings for your specific data
 * 3. Update the filter configurations
 * 4. Modify the report parameters as needed
 * 5. Update the UI labels and options
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PilihLaporanCard } from "./pilih-laporan-card";
import { FilterParametersCard } from "./filter-parameters-card";
import { DynamicFiltersCard } from "./dynamic-filters-card";

// TODO: Update these configurations for your specific use case

// 1. Update table mappings for your data source
const CUSTOM_TABLE_MAPPING = {
  custom_report_1: "your_database.your_table_1",
  custom_report_2: "your_database.your_table_2",
  // Add more mappings as needed
};

// 2. Update filter configurations for your columns
const CUSTOM_FILTER_CONFIG = {
  customFilter1: {
    key: "customFilter1",
    columnName: "your_column_1",
    referenceTable: "your_ref_table_1",
    referenceDatabase: "your_ref_db",
    joinKey: "your_join_key_1",
    nameColumn: "your_name_column_1"
  },
  customFilter2: {
    key: "customFilter2",
    columnName: "your_column_2",
    // No reference table for this filter
  },
  // Add more filter configurations
};

// 3. Update report type options
const CUSTOM_REPORT_OPTIONS = [
  { value: "custom_report_1", label: "1. Custom Report Type 1" },
  { value: "custom_report_2", label: "2. Custom Report Type 2" },
  // Add more report types
];

// 4. Update filter options
const CUSTOM_FILTER_OPTIONS = [
  { key: "customFilter1", label: "Custom Filter 1" },
  { key: "customFilter2", label: "Custom Filter 2" },
  // Add more filter options
];

interface CustomQueryBuilderProps {
  // Add any additional props you need
  title?: string;
  description?: string;
}

export function CustomQueryBuilder({
  title = "Custom Inquiry Data",
  description = "Query builder untuk data custom dengan filter parameter yang dapat disesuaikan"
}: CustomQueryBuilderProps) {
  // State management (same pattern as the original)
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  
  const currentYear = new Date().getFullYear();
  const [reportParams, setReportParams] = useState({
    tahun: currentYear.toString(),
    tipeLaporan: "custom_report_1", // Update default
    pembulatan: "satuan",
    jenisAkumulasi: "non_akumulatif",
  });

  // Event handlers (same pattern)
  const removeFilter = (filterKey: string) => {
    setActiveFilters((prev) => prev.filter((key) => key !== filterKey));
    setFilterValues((prev) => {
      const newValues = { ...prev };
      delete newValues[filterKey];
      return newValues;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilterValues({});
  };

  const handleFilterChange = (
    filterKey: string,
    field: string,
    value: string
  ) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {/* Main Content - Three Cards Layout */}
      <div className="space-y-6">
        {/* 1. Pilih Laporan Card - You may need to create a custom version */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Pilih Laporan Custom</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Implement your custom report selection UI */}
            <p className="text-muted-foreground">
              Implement your custom report selection here based on CUSTOM_REPORT_OPTIONS
            </p>
          </CardContent>
        </Card>

        {/* 2. Filter Parameters Card - You may need to create a custom version */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Filter Parameters Custom</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Implement your custom filter parameters UI */}
            <p className="text-muted-foreground">
              Implement your custom filter parameters here based on CUSTOM_FILTER_OPTIONS
            </p>
          </CardContent>
        </Card>

        {/* 3. Dynamic Filters and Actions Card */}
        <DynamicFiltersCard
          activeFilters={activeFilters}
          reportParams={reportParams}
          onRemoveFilter={removeFilter}
          onClearAllFilters={clearAllFilters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * 1. Create a new page file (e.g., src/app/inquiry-data/custom/page.tsx):
 * 
 * ```typescript
 * import { CustomQueryBuilder } from "@/components/inquiry-data/custom-query-builder";
 * 
 * export default function CustomPage() {
 *   return (
 *     <CustomQueryBuilder 
 *       title="My Custom Data Inquiry"
 *       description="Custom description for my data"
 *     />
 *   );
 * }
 * ```
 * 
 * 2. Create custom hook for your data (e.g., src/hooks/use-custom-query-builder.ts):
 * 
 * ```typescript
 * import { useInquiryQueryBuilder } from "./use-inquiry-query-builder";
 * 
 * export function useCustomQueryBuilder() {
 *   const baseBuilder = useInquiryQueryBuilder();
 *   
 *   // Override table mappings and filter configs
 *   const buildCustomQuery = (activeFilters, filterValues, reportParams) => {
 *     // Your custom query building logic
 *     return baseBuilder.buildQuery(activeFilters, filterValues, reportParams);
 *   };
 *   
 *   return {
 *     ...baseBuilder,
 *     buildQuery: buildCustomQuery,
 *   };
 * }
 * ```
 * 
 * 3. Update the API endpoint if needed for different data sources
 * 
 * 4. Test with your specific data structure
 */