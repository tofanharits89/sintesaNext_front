"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getSp2dUIFilters } from "./sp2d-filter-registry";

interface Sp2dFilterParametersCardProps {
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
}

export function Sp2dFilterParametersCard({
  activeFilters,
  setActiveFilters,
}: Sp2dFilterParametersCardProps) {
  const uiFilters = getSp2dUIFilters();

  const handleToggle = (filterKey: string) => {
    setActiveFilters((prev) => {
      if (prev.includes(filterKey)) {
        return prev.filter((key) => key !== filterKey);
      }
      return [...prev, filterKey];
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Parameter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {uiFilters.map((option) => (
            <div key={option.key} className="flex items-center space-x-2">
              <Switch
                id={option.key}
                checked={activeFilters.includes(option.key)}
                onCheckedChange={() => handleToggle(option.key)}
              />
              <Label
                htmlFor={option.key}
                className="text-sm cursor-pointer truncate"
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
