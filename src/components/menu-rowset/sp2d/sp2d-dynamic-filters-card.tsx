"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterCard } from "@/components/inquiry-data/filter-card";
import { getSp2dFilterLabel, SP2D_FILTER_DEFS } from "./sp2d-filter-registry";
import { useMemo } from "react";
import {
  Eye,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Save,
  FileCode,
} from "lucide-react";

export interface Sp2dFilterValue {
  selection: string;
  kondisiCode: string;
  mengandungKata: string;
  jenisTampilan: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
}

interface Sp2dDynamicFiltersCardProps {
  activeFilters: string[];
  filterValues: Record<string, Sp2dFilterValue>;
  onRemoveFilter: (filterKey: string) => void;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
}

export function Sp2dDynamicFiltersCard({
  activeFilters,
  filterValues,
  onRemoveFilter,
  onFilterChange,
}: Sp2dDynamicFiltersCardProps) {
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Sort active filters based on predefined order from registry
  const sortedActiveFilters = useMemo(() => {
    const orderMap = new Map(SP2D_FILTER_DEFS.map((f, i) => [f.key, i]));
    return [...activeFilters].sort(
      (a, b) => (orderMap.get(a) ?? Infinity) - (orderMap.get(b) ?? Infinity)
    );
  }, [activeFilters]);

  // Normalize filter values for hierarchical filtering (map selection values)
  const normalizedFilterValues = useMemo(() => {
    const normalized: Record<string, string> = {};
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value.selection) {
        normalized[key] = value.selection;
      }
    });
    return normalized;
  }, [filterValues]);

  const handleTayang = () => {
    setLoadingStatus(true);
    // Logic for tayang
    setTimeout(() => setLoadingStatus(false), 1000);
  };

  const handleDownloadExcel = () => {
    setLoadingStatus(true);
    // Logic for download excel
    setTimeout(() => setLoadingStatus(false), 1000);
  };

  const handleDownloadCSV = () => {
    setLoadingStatus(true);
    // Logic for download csv
    setTimeout(() => setLoadingStatus(false), 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Aktif dan Aksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Filter Cards */}
        {activeFilters.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Filter yang Aktif ({activeFilters.length})
              </h3>
            </div>
            <div className="space-y-4">
              {sortedActiveFilters.map((filterKey) => (
                <FilterCard
                  key={filterKey}
                  filterKey={filterKey}
                  filterLabel={getSp2dFilterLabel(filterKey)}
                  onRemove={() => onRemoveFilter(filterKey)}
                  activeFilterValues={normalizedFilterValues}
                  currentFilterValue={
                    filterValues[filterKey]?.selection
                      ? filterValues[filterKey]
                      : { selection: "all", kondisiCode: "", mengandungKata: "", jenisTampilan: "kode" }
                  }
                  onFilterChange={onFilterChange}
                  removable={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada filter yang aktif.</p>
            <p className="text-sm">
              Aktifkan filter pada kartu &quot;Pilih Data&quot; di atas.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-6">
          <div className="flex flex-wrap justify-center gap-3">
            {/* Tayang Button */}
            <Button
              onClick={handleTayang}
              className="min-w-[150px] h-10"
              disabled={loadingStatus || activeFilters.length === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              {loadingStatus ? "Loading..." : "Tayang"}
            </Button>

            {/* Download Excel Button */}
            <Button
              variant="outline"
              onClick={handleDownloadExcel}
              className="min-w-[150px] h-10"
              disabled={loadingStatus || activeFilters.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </Button>

            {/* Download CSV Button */}
            <Button
              variant="outline"
              onClick={handleDownloadCSV}
              className="min-w-[150px] h-10"
              disabled={loadingStatus || activeFilters.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download CSV
            </Button>

            {/* WhatsApp Button */}
            <Button
              className="bg-green-600 hover:bg-green-700 text-white min-w-[150px] h-10"
              disabled={loadingStatus || activeFilters.length === 0}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>

            {/* Simpan Button */}
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white min-w-[150px] h-10"
              disabled={loadingStatus || activeFilters.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </Button>

            {/* Lihat SQL Button */}
            <Button
              variant="outline"
              onClick={handleDownloadCSV}
              className="min-w-[150px] h-10"
              disabled={loadingStatus || activeFilters.length === 0}
            >
              <FileCode className="w-4 h-4 mr-2" />
              Lihat SQL
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
