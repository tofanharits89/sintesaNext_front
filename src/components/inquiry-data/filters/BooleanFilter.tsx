"use client";

import { useState, useEffect } from "react";
import { BaseFilter } from "./BaseFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FilterValue, FilterChangeHandler } from "./types";

interface BooleanFilterProps {
  filterKey: string;
  filterLabel: string;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  currentFilterValue?: FilterValue;
  onFilterChange: FilterChangeHandler;
  onRemove: () => void;
  removable?: boolean;
}

export function BooleanFilter({
  filterKey,
  filterLabel,
  icon,
  currentFilterValue,
  onFilterChange,
  onRemove,
  removable = true,
}: BooleanFilterProps) {
  const [filterData, setFilterData] = useState<FilterValue>({
    selection: "all",
    ...currentFilterValue,
  });

  useEffect(() => {
    if (currentFilterValue && Object.keys(currentFilterValue).length > 0) {
      setFilterData({
        selection: currentFilterValue.selection || "all",
      });
    } else {
      onFilterChange(filterKey, "selection", "all");
    }
  }, [filterKey, currentFilterValue, onFilterChange]);

  const handleChange = (field: keyof FilterValue, value: string) => {
    setFilterData((prev) => ({ ...prev, [field]: value }));
    onFilterChange(filterKey, field, value);
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
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Nilai</Label>
          <Input
            value={filterData.selection || ""}
            onChange={(e) => handleChange("selection", e.target.value)}
            placeholder="Masukkan nilai..."
          />
        </div>
      </div>
    </BaseFilter>
  );
}
