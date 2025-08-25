"use client";

import React, { useState, useEffect, useRef } from "react";
import { FilterCard } from "./filter-card";

interface EnhancedFilterCardProps {
  filterKey: string;
  filterLabel: string;
  onRemove: () => void;
  activeFilterValues: Record<string, any>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
}

export function EnhancedFilterCard({
  filterKey,
  filterLabel,
  onRemove,
  activeFilterValues,
  onFilterChange,
}: EnhancedFilterCardProps) {
  // Get current month for cutOff filter default
  const getCurrentMonth = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return month;
  };

  // Initialize filter data with defaults
  const getInitialFilterData = () => ({
    selection: filterKey === "cutOff" ? getCurrentMonth() : "all",
    kondisiCode: "",
    mengandungKata: "",
    jenisTampilan: "kode" as const,
    akunType: "kodeAkun" as const,
  });

  const [filterData, setFilterData] = useState(getInitialFilterData());
  const initialNotificationSent = useRef(false);

  // Notify parent about initial default values (only once on mount)
  useEffect(() => {
    if (!initialNotificationSent.current) {
      const initialValue = filterKey === "cutOff" ? getCurrentMonth() : "all";
      onFilterChange(filterKey, "selection", initialValue);
      
      // Set initial complete filter data
      const initialData = getInitialFilterData();
      Object.entries(initialData).forEach(([field, value]) => {
        onFilterChange(filterKey, field, String(value));
      });
      
      initialNotificationSent.current = true;
    }
  }, [filterKey, onFilterChange]);

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
  const modifiedOnFilterChange = (key: string, field: string, value: string) => {
    if (key === filterKey) {
      handleInputChange(field, value);
    }
  };

  return (
    <FilterCard
      filterKey={filterKey}
      filterLabel={filterLabel}
      onRemove={onRemove}
      activeFilterValues={activeFilterValues}
      onFilterChange={modifiedOnFilterChange}
    />
  );
}