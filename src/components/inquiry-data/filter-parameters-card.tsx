"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FilterParametersCardProps {
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
}

export function FilterParametersCard({
  activeFilters,
  setActiveFilters,
}: FilterParametersCardProps) {
  const filterOptions = [
    { key: "cutOff", label: "Cut Off" },
    { key: "kementerian", label: "Kementerian" },
    { key: "eselonI", label: "Eselon I" },
    { key: "kewenangan", label: "Kewenangan" },
    { key: "provinsi", label: "Provinsi" },
    { key: "kabkota", label: "Kabkota" },
    { key: "kanwil", label: "Kanwil" },
    { key: "kppn", label: "KPPN" },
    { key: "satker", label: "Satker" },
    { key: "fungsi", label: "Fungsi" },
    { key: "subFungsi", label: "Sub-Fungsi" },
    { key: "program", label: "Program" },
    { key: "kegiatan", label: "Kegiatan" },
    { key: "outputKro", label: "Output/KRO" },
    { key: "subOutputRo", label: "Sub-Output/RO" },
    { key: "akun", label: "Akun" },
    { key: "sumberDana", label: "Sumber Dana" },
    { key: "register", label: "Register" },
  ];

  const handleToggle = (filterKey: string) => {
    setActiveFilters((prev) => {
      if (prev.includes(filterKey)) {
        return prev.filter((key) => key !== filterKey);
      } else {
        return [...prev, filterKey];
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Filter Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
          {filterOptions.map((option) => (
            <div key={option.key} className="flex items-center space-x-2">
              <Switch
                id={option.key}
                checked={activeFilters.includes(option.key)}
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
            {filterOptions.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
