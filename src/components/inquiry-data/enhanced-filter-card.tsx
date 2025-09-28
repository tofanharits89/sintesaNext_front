"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { FilterCard } from "./filter-card";

import type { FilterValue } from "@/hooks/use-inquiry-data-api";

interface EnhancedFilterCardProps {
  filterKey: string;
  filterLabel: string;
  onRemove: () => void;
  activeFilterValues: Record<string, FilterValue>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
  removable?: boolean;
  scope?: "belanja" | "tematik" | "general";
}

export function EnhancedFilterCard({
  filterKey,
  filterLabel,
  onRemove,
  activeFilterValues,
  onFilterChange,
  removable = true,
}: EnhancedFilterCardProps) {
  // Get current month for cutOff filter default
  const getCurrentMonth = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return month;
  };

  // Initialize filter data with defaults
  const getInitialFilterData = useCallback(
    () => ({
      selection: filterKey === "cutOff" ? getCurrentMonth() : "all",
      kondisiCode: filterKey === "cutOff" ? "equals" : "",
      mengandungKata: "",
      jenisTampilan: "kode" as const,
      akunType: "kodeAkun" as const,
    }),
    [filterKey]
  );

  const [, setFilterData] = useState(getInitialFilterData());
  const initialNotificationSent = useRef(false);

  // Notify parent about initial default values (only once on mount)
  // Guard: if this filter already has values (e.g., after loading a saved query), do NOT overwrite with defaults
  useEffect(() => {
    if (initialNotificationSent.current) return;

    const existing: any = activeFilterValues?.[filterKey];
    const hasExisting =
      !!existing &&
      ((typeof existing.selection === "string" &&
        existing.selection.trim() !== "") ||
        (typeof existing.kondisiCode === "string" &&
          existing.kondisiCode.trim() !== "") ||
        (typeof existing.mengandungKata === "string" &&
          existing.mengandungKata.trim() !== "") ||
        (typeof (existing as any).jenisTampilan === "string" &&
          (existing as any).jenisTampilan.trim() !== "") ||
        (typeof (existing as any).akunType === "string" &&
          (existing as any).akunType.trim() !== ""));

    if (hasExisting) {
      initialNotificationSent.current = true;
      return;
    }

    // Seed defaults for a brand new filter
    const initialData = getInitialFilterData();
    Object.entries(initialData).forEach(([field, value]) => {
      onFilterChange(filterKey, field, String(value));
    });

    initialNotificationSent.current = true;
  }, [filterKey, onFilterChange, getInitialFilterData, activeFilterValues]);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFilterData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Notify parent component about value changes
    onFilterChange(filterKey, field, value);
  };

  // Create a modified onFilterChange that uses our local handler
  const modifiedOnFilterChange = (
    key: string,
    field: string,
    value: string
  ) => {
    if (key === filterKey) {
      handleInputChange(field, value);
    }
  };

  // Normalize active filter values passed down so dependencies read the selected value string
  const normalizedActiveValues = useMemo(() => {
    const src = activeFilterValues || {};
    const out: Record<string, string> = {};
    Object.entries(src).forEach(([k, v]) => {
      const val = v as Partial<FilterValue> | string | undefined;
      if (val && typeof val === "object" && "selection" in val) {
        out[k] = String(val.selection ?? "");
      } else if (val != null) {
        out[k] = String(val as string);
      }
    });
    return out;
  }, [activeFilterValues]);

  // Extract current filter's values for this specific filter
  const currentFilterValue = activeFilterValues[filterKey];

  return (
    <FilterCard
      filterKey={filterKey}
      filterLabel={filterLabel}
      onRemove={onRemove}
      activeFilterValues={normalizedActiveValues}
      {...(currentFilterValue ? { currentFilterValue } : {})}
      onFilterChange={modifiedOnFilterChange}
      removable={removable}
    />
  );
}
