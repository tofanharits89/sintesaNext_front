"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { FilterValue } from "./types";

interface BaseFilterProps {
  filterKey: string;
  filterLabel: string;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  filterValue?: FilterValue;
  onRemove: () => void;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
  removable?: boolean;
  children: React.ReactNode;
}

export function BaseFilter({
  filterKey,
  filterLabel,
  icon: Icon,
  filterValue,
  onRemove,
  onFilterChange,
  removable = true,
  children,
}: BaseFilterProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <CardTitle className="text-sm font-medium">{filterLabel}</CardTitle>
          </div>
          {removable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
