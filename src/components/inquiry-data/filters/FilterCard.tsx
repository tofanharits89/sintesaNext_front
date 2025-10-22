"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Filter, Building2, MapPin, Calendar, CreditCard, Users, Target, Briefcase, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterInput } from './FilterInput';
import { useFilterData } from '@/hooks/useFilterData';
import { FilterValue } from '@/types/filters';

interface FilterCardProps {
  filterKey: string;
  filterLabel: string;
  onRemove: () => void;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
  removable?: boolean;
  activeFilterValues?: Record<string, string>;
  currentValue?: FilterValue;
}

// Helper function to get appropriate icon for each filter type
const getFilterIcon = (filterKey: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    kddept: <Building2 className="h-4 w-4" />,
    kdunit: <Building2 className="h-4 w-4" />,
    kdkanwil: <MapPin className="h-4 w-4" />,
    kdkppn: <MapPin className="h-4 w-4" />,
    kdlokasi: <MapPin className="h-4 w-4" />,
    kddekon: <Target className="h-4 w-4" />,
    kdkabkota: <MapPin className="h-4 w-4" />,
    kdsatker: <Building2 className="h-4 w-4" />,
    kdfungsi: <Briefcase className="h-4 w-4" />,
    kdsfung: <Briefcase className="h-4 w-4" />,
    kdprogram: <Target className="h-4 w-4" />,
    kdgiat: <Target className="h-4 w-4" />,
    kdoutput: <Target className="h-4 w-4" />,
    kdsoutput: <Target className="h-4 w-4" />,
    kdakun: <CreditCard className="h-4 w-4" />,
    kdbkpk: <CreditCard className="h-4 w-4" />,
    kdgbkpk: <CreditCard className="h-4 w-4" />,
    kdsdana: <CreditCard className="h-4 w-4" />,
    tahun: <Calendar className="h-4 w-4" />,
    register: <Users className="h-4 w-4" />,
  };

  return iconMap[filterKey] || <Filter className="h-4 w-4" />;
};

export function FilterCard({
  filterKey,
  filterLabel,
  onRemove,
  onFilterChange,
  removable = true,
  activeFilterValues = {},
  currentValue = {},
}: FilterCardProps) {
  const { getFilterOptions, isLoading } = useFilterData();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getFilterIcon(filterKey)}
          {filterLabel}
        </CardTitle>
        {removable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <FilterInput
          filterKey={filterKey}
          onFilterChange={onFilterChange}
          getFilterOptions={getFilterOptions}
          isLoading={isLoading}
          activeFilterValues={activeFilterValues}
          currentValue={currentValue}
        />
      </CardContent>
    </Card>
  );
}