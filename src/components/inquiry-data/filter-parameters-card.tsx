"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getUIFilters, getAvailableFiltersForScope } from "./filterRegistry";

interface FilterParametersCardProps {
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  excludeFilters?: string[]; // Optional array of filter keys to exclude
  scope?: "belanja" | "tematik" | "general"; // Optional scope for context-aware visibility
}

export function FilterParametersCard({
  activeFilters,
  setActiveFilters,
  excludeFilters = [], // Default to empty array if not provided
  scope = "general",
}: FilterParametersCardProps) {
  // Determine allowed filters for the given scope then apply exclude list
  const allowedKeys = getAvailableFiltersForScope(scope, excludeFilters);
  const uiFilters = getUIFilters().filter((filter) =>
    allowedKeys.includes(filter.key)
  );

  const handleToggle = (filterKey: string) => {
    const def = uiFilters.find((f) => f.key === filterKey);
    if (def?.mandatory) return; // Prevent toggling mandatory filters

    setActiveFilters((prev) => {
      if (prev.includes(filterKey)) {
        return prev.filter((key) => key !== filterKey);
      }
      return [...prev, filterKey];
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Filter Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
          {uiFilters.map((option) => (
            <div key={option.key} className="flex items-center space-x-2">
              <Switch
                id={option.key}
                checked={
                  option.mandatory ? true : activeFilters.includes(option.key)
                }
                disabled={option.mandatory}
                onCheckedChange={() => handleToggle(option.key)}
              />
              <Label
                htmlFor={option.key}
                className="text-sm font-medium cursor-pointer truncate"
                title={option.label}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        {/* Active Filters Count */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Filter aktif:{" "}
            <span className="font-medium">{activeFilters.length}</span> dari{" "}
            {uiFilters.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
