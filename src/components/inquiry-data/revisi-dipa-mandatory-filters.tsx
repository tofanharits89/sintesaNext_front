"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedFilterCard } from "./enhanced-filter-card";
import type { FilterValue } from "@/types/saved-queries";

export const REVISI_DIPA_MANDATORY_FILTERS = [
  {
    key: "kewenanganRevisi",
    label: "Kewenangan Revisi",
    mandatory: true,
    removable: false,
    defaultValue: {
      selection: "all",
      kondisiCode: "",
      mengandungKata: "",
      jenisTampilan: "kode" as const,
    },
  },
  {
    key: "jenisRevisi",
    label: "Jenis Revisi",
    mandatory: true,
    removable: false,
    defaultValue: {
      selection: "all",
      kondisiCode: "",
      mengandungKata: "",
      jenisTampilan: "kode" as const,
    },
  },
] as const;

interface RevisiDipaMandatoryFiltersProps {
  filterValues: Record<string, FilterValue>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
  onResetFilters: () => void;
  className?: string;
}

export function RevisiDipaMandatoryFilters({
  filterValues,
  onFilterChange,
  onResetFilters,
  className = "",
}: RevisiDipaMandatoryFiltersProps) {
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

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Filter Wajib Revisi DIPA</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Kewenangan dan Jenis Revisi wajib ditentukan untuk setiap query
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            Reset Filter Wajib
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {REVISI_DIPA_MANDATORY_FILTERS.map((filter) => (
          <EnhancedFilterCard
            key={filter.key}
            filterKey={filter.key}
            filterLabel={filter.label}
            onRemove={() => {}}
            activeFilterValues={normalizedFilterValues}
            onFilterChange={onFilterChange}
            removable={false}
          />
        ))}

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Filter wajib tidak dapat dihapus dari query Revisi DIPA
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
