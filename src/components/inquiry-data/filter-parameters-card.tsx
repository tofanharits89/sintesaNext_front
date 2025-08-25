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
    { key: "cutOff", label: "Cut Off (Wajib)", mandatory: true },
    { key: "kementerian", label: "Kementerian", mandatory: false },
    { key: "eselonI", label: "Eselon I", mandatory: false },
    { key: "kewenangan", label: "Kewenangan", mandatory: false },
    { key: "provinsi", label: "Provinsi", mandatory: false },
    { key: "kabkota", label: "Kabkota", mandatory: false },
    { key: "kanwil", label: "Kanwil", mandatory: false },
    { key: "kppn", label: "KPPN", mandatory: false },
    { key: "satker", label: "Satker", mandatory: false },
    { key: "fungsi", label: "Fungsi", mandatory: false },
    { key: "subFungsi", label: "Sub-Fungsi", mandatory: false },
    { key: "program", label: "Program", mandatory: false },
    { key: "kegiatan", label: "Kegiatan", mandatory: false },
    { key: "outputKro", label: "Output/KRO", mandatory: false },
    { key: "subOutputRo", label: "Sub-Output/RO", mandatory: false },
    { key: "akun", label: "Akun", mandatory: false },
    { key: "sumberDana", label: "Sumber Dana", mandatory: false },
    { key: "register", label: "Register", mandatory: false },
  ];

  const handleToggle = (filterKey: string) => {
    // Find the filter option to check if it's mandatory
    const filterOption = filterOptions.find(opt => opt.key === filterKey);
    if (filterOption?.mandatory) {
      return; // Prevent toggling mandatory filters
    }
    
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
                checked={option.mandatory ? true : activeFilters.includes(option.key)}
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
            {filterOptions.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
