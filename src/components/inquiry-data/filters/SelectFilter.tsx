"use client";

import { useState, useEffect } from "react";
import { BaseFilter } from "./BaseFilter";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFilterOptions } from "@/hooks/inquiry-data/useFilterOptions";
import { useFilterDependencies } from "@/hooks/inquiry-data/useFilterDependencies";
import type { FilterValue, FilterChangeHandler } from "./types";

interface SelectFilterProps {
  filterKey: string;
  filterLabel: string;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  currentFilterValue?: FilterValue;
  activeFilterValues?: Record<string, string>;
  onFilterChange: FilterChangeHandler;
  onRemove: () => void;
  removable?: boolean;
}

export function SelectFilter({
  filterKey,
  filterLabel,
  icon,
  currentFilterValue,
  activeFilterValues = {},
  onFilterChange,
  onRemove,
  removable = true,
}: SelectFilterProps) {
  const [filterData, setFilterData] = useState<FilterValue>({
    selection: "all",
    kondisiCode: "",
    mengandungKata: "",
    ...currentFilterValue,
  });

  const options = useFilterOptions({ filterKey, activeFilterValues });
  const { shouldInvalidateFilter } = useFilterDependencies({
    filterKey,
    filterValue: filterData.selection || "",
    onFilterChange,
  });

  // Handle initialization from saved values
  useEffect(() => {
    if (currentFilterValue && Object.keys(currentFilterValue).length > 0) {
      setFilterData({
        selection: currentFilterValue.selection || "all",
        kondisiCode: currentFilterValue.kondisiCode || "",
        mengandungKata: currentFilterValue.mengandungKata || "",
      });
    } else {
      // Set default value for new filter
      onFilterChange(filterKey, "selection", "all");
    }
  }, [filterKey, currentFilterValue, onFilterChange]);

  // Check if current selection is still valid
  useEffect(() => {
    if (filterData.selection && filterData.selection !== "all") {
      const isValid = options.some((option) => option.value === filterData.selection);
      if (!isValid) {
        setFilterData((prev) => ({ ...prev, selection: "all" }));
        onFilterChange(filterKey, "selection", "all");
      }
    }
  }, [options, filterData.selection, filterKey, onFilterChange]);

  const handleSelectionChange = (value: string) => {
    setFilterData((prev) => ({ ...prev, selection: value }));
    onFilterChange(filterKey, "selection", value);
  };

  const handleConditionCodeChange = (value: string) => {
    setFilterData((prev) => ({ ...prev, kondisiCode: value }));
    onFilterChange(filterKey, "kondisiCode", value);
  };

  const handleTextSearchChange = (value: string) => {
    setFilterData((prev) => ({ ...prev, mengandungKata: value }));
    onFilterChange(filterKey, "mengandungKata", value);
  };

  return (
    <BaseFilter
      filterKey={filterKey}
      filterLabel={filterLabel}
      icon={icon}
      filterValue={filterData}
      onRemove={onRemove}
      onFilterChange={onFilterChange}
      removable={removable}
    >
      <div className="space-y-3">
        {/* Selection Dropdown */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Pilihan</Label>
          <SearchableSelect
            value={filterData.selection || "all"}
            onValueChange={handleSelectionChange}
            options={options}
            placeholder="Pilih..."
          />
        </div>

        {/* Condition Code Input */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Kondisi Code</Label>
          <Input
            value={filterData.kondisiCode || ""}
            onChange={(e) => handleConditionCodeChange(e.target.value)}
            placeholder="Masukkan kondisi code..."
          />
        </div>

        {/* Text Search Input */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Mengandung Kata</Label>
          <Input
            value={filterData.mengandungKata || ""}
            onChange={(e) => handleTextSearchChange(e.target.value)}
            placeholder="Cari..."
          />
        </div>
      </div>
    </BaseFilter>
  );
}
