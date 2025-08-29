"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedFilterCard } from "./enhanced-filter-card";
import { getTematikCategory, type CategoryFilter } from "./categoryRegistry";
import type { FilterValue } from "@/types/saved-queries";

interface CategoryMandatoryFiltersProps {
  categoryKey: string;
  filterValues: Record<string, FilterValue>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
  onClearAllFilters: () => void;
  className?: string;
}

export function CategoryMandatoryFilters({
  categoryKey,
  filterValues,
  onFilterChange,
  onClearAllFilters,
  className = "",
}: CategoryMandatoryFiltersProps) {
  const category = useMemo(
    () => getTematikCategory(categoryKey),
    [categoryKey]
  );

  // Convert filterValues to the format expected by EnhancedFilterCard
  const normalizedFilterValues = useMemo(() => {
    const normalized: Record<string, any> = {};
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && typeof value === "object") {
        normalized[key] = {
          selection: value.selection || "",
          kondisiCode: value.kondisiCode || "",
          mengandungKata: value.mengandungKata || "",
          jenisTampilan: value.jenisTampilan || "kode",
          akunType: (value as any).akunType,
        };
      }
    });
    return normalized;
  }, [filterValues]);

  if (!category || category.mandatoryFilters.length === 0) {
    return null;
  }

  const handleClearMandatoryFilters = () => {
    // Reset all mandatory filters to their default values
    category.mandatoryFilters.forEach((filter: CategoryFilter) => {
      const defaultValue = filter.defaultValue || {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode" as const,
      };

      Object.entries(defaultValue).forEach(([field, value]) => {
        onFilterChange(filter.key, field, String(value));
      });
    });
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Filter Wajib - {category.label}
            </CardTitle>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearMandatoryFilters}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            Reset Filter Wajib
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {category.mandatoryFilters.map((filter: CategoryFilter) => (
          <EnhancedFilterCard
            key={filter.key}
            filterKey={filter.key}
            filterLabel={filter.label}
            onRemove={() => {}} // Mandatory filters cannot be removed
            activeFilterValues={normalizedFilterValues}
            onFilterChange={onFilterChange}
            removable={filter.removable}
          />
        ))}

        {/* Filter status indicator */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Filter wajib aktif:{" "}
            <span className="font-medium text-amber-600">
              {category.mandatoryFilters.length}
            </span>{" "}
            dari {category.mandatoryFilters.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            💡 Filter wajib tidak dapat dihapus untuk kategori ini
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
