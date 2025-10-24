"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Filter, Loader2 } from "lucide-react";
import type { RekapEpaFilters } from "@/types/epa-rekap";

interface FilterOption {
  tahunList: string[];
  triwulanList: string[];
  kementerianList: Array<{ kddept: string; nmdept: string }>;
  jenisBelanjList: Array<{ kdgbkpk: string; nmgbkpk: string }>;
}

interface RekapFilterCardProps {
  filters: RekapEpaFilters;
  onFiltersChange: (filters: RekapEpaFilters) => void;
  onReset: () => void;
  filterOptions?: FilterOption;
  isApplying?: boolean;
  isResetting?: boolean;
  onFilterChange?: (filters: RekapEpaFilters) => void;
}

export function RekapFilterCard({
  filters,
  onFiltersChange,
  onReset,
  filterOptions,
  isApplying = false,
  isResetting = false,
  onFilterChange,
}: RekapFilterCardProps) {
  const [localFilters, setLocalFilters] = useState<RekapEpaFilters>(filters);

  // Sync localFilters with filters prop when filters change (e.g., from Reset or Refresh)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Notify parent of localFilters changes for hierarchical filtering
  useEffect(() => {
    onFilterChange?.(localFilters);
  }, [localFilters, onFilterChange]);

  if (!filterOptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Rekap EPA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleReset = () => {
    setLocalFilters({ tahun: null, triwulan: null, kddept: null, kdgbkpk: null });
    onReset();
  };

  const handleFilterChange = (key: keyof RekapEpaFilters, value: string | null) => {
    setLocalFilters({
      ...localFilters,
      [key]: value || "all",
    });
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Rekap EPA
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-2 h-10"
              disabled={isApplying || isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </>
              )}
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex items-center gap-2 px-6 py-2 h-10"
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Terapkan"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tahun */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="tahun">Tahun</Label>
            <Select
              value={localFilters.tahun}
              onValueChange={(value) => handleFilterChange("tahun", value)}
              disabled={isApplying}
            >
              <SelectTrigger id="tahun" className="w-full">
                <SelectValue placeholder="Pilih tahun" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {filterOptions.tahunList?.map((tahun) => (
                  <SelectItem key={tahun} value={tahun.toString()}>
                    {tahun}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Triwulan */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="triwulan">Triwulan</Label>
            <Select
              value={localFilters.triwulan}
              onValueChange={(value) => handleFilterChange("triwulan", value)}
              disabled={isApplying}
            >
              <SelectTrigger id="triwulan" className="w-full">
                <SelectValue placeholder="Pilih triwulan" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {filterOptions.triwulanList?.map((triwulan) => (
                  <SelectItem key={triwulan} value={triwulan.toString()}>
                    Triwulan {triwulan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kementerian */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="kementerian">Kementerian</Label>
            <Select
              value={localFilters.kddept}
              onValueChange={(value) => handleFilterChange("kddept", value)}
              disabled={isApplying}
            >
              <SelectTrigger id="kementerian" className="w-full">
                <SelectValue placeholder="Pilih kementerian" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {filterOptions.kementerianList?.map((item) => (
                  <SelectItem key={item.kddept} value={item.kddept}>
                    <span className="truncate" title={item.nmdept}>
                      {item.nmdept}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Jenis Belanja */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="jenis-belanja">Jenis Belanja</Label>
            <Select
              value={localFilters.kdgbkpk}
              onValueChange={(value) => handleFilterChange("kdgbkpk", value)}
              disabled={isApplying}
            >
              <SelectTrigger id="jenis-belanja" className="w-full">
                <SelectValue placeholder="Pilih jenis belanja" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {filterOptions.jenisBelanjList?.map((item) => (
                  <SelectItem key={item.kdgbkpk} value={item.kdgbkpk}>
                    <span className="truncate" title={item.nmgbkpk}>
                      {item.nmgbkpk}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
