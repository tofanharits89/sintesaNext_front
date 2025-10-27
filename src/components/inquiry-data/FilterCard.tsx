"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SelectFilter } from "./filters/SelectFilter";
import { BooleanFilter } from "./filters/BooleanFilter";
import type { FilterValue, FilterChangeHandler } from "./filters/types";
import {
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  Target,
  Briefcase,
  Settings,
} from "lucide-react";

// Filter type mapping
const FILTER_TYPES: Record<
  string,
  {
    component: "select" | "boolean" | "custom";
    icon?: React.ComponentType<{ className?: string }> | undefined;
  }
> = {
  jenisKontrak: { component: "select" },
  jenisTemaAnggaran: { component: "select", icon: Target },
  kementerian: { component: "select", icon: Building2 },
  eselonI: { component: "select", icon: Building2 },
  kanwil: { component: "select", icon: MapPin },
  kppn: { component: "select", icon: MapPin },
  kewenangan: { component: "select", icon: Settings },
  provinsi: { component: "select", icon: MapPin },
  kabkota: { component: "select", icon: MapPin },
  satker: { component: "select", icon: Users },
  fungsi: { component: "select", icon: Target },
  subFungsi: { component: "select", icon: Target },
  program: { component: "select", icon: Briefcase },
  kegiatan: { component: "select", icon: Briefcase },
  outputKro: { component: "select", icon: Briefcase },
  subOutputRo: { component: "select", icon: Briefcase },
  akun: { component: "select", icon: CreditCard },
  jenisAkun: { component: "select", icon: CreditCard },
  typeBkpk: { component: "select", icon: CreditCard },
  groupBkpk: { component: "select", icon: CreditCard },
  sumberDana: { component: "select", icon: CreditCard },
  cutOff: { component: "select", icon: Calendar },
  // Add more filter types as needed
};

interface FilterCardProps {
  filterKey: string;
  filterLabel: string;
  onRemove: () => void;
  activeFilterValues?: Record<string, string>;
  currentFilterValue?: FilterValue;
  onFilterChange?: FilterChangeHandler;
  removable?: boolean;
}

export function FilterCard({
  filterKey,
  filterLabel,
  onRemove,
  activeFilterValues = {},
  currentFilterValue,
  onFilterChange,
  removable = true,
}: FilterCardProps) {
  // Default filter change handler
  const defaultOnFilterChange = useCallback((key: string, field: string, value: string) => {
    // This is a no-op by default - the parent should provide its own handler
    console.log(`Filter changed: ${key}.${field} = ${value}`);
  }, []);

  const handleFilterChange = onFilterChange || defaultOnFilterChange;

  // Get filter type and render appropriate component
  const filterType = FILTER_TYPES[filterKey];

  if (!filterType) {
    console.warn(`Unknown filter type: ${filterKey}`);
    return null;
  }

  const filterProps = {
    filterKey,
    filterLabel,
    icon: filterType.icon,
    activeFilterValues,
    onFilterChange: handleFilterChange,
    onRemove,
    removable,
  };

  switch (filterType.component) {
    case "select":
      return <SelectFilter {...filterProps} {...(currentFilterValue && { currentFilterValue })} />;

    case "boolean":
      return <BooleanFilter {...filterProps} {...(currentFilterValue && { currentFilterValue })} />;

    case "custom":
      // Custom filter types can be handled here
      return <SelectFilter {...filterProps} {...(currentFilterValue && { currentFilterValue })} />;

    default:
      return <SelectFilter {...filterProps} {...(currentFilterValue && { currentFilterValue })} />;
  }
}

// Export the original filter card for backward compatibility during migration
// This will be the entry point that replaces the old filter-card.tsx
export default FilterCard;
