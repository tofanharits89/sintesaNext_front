"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Filter } from "lucide-react";
import { useEPAFilters } from "@/hooks/use-epa-filters";

export function FilterCard() {
  const {
    filters,
    updateFilter,
    resetFilters,
    departments,
    availableKanwils,
    availableKPPNs,
    yearOptions,
    monthOptions,
    isLoading,
  } = useEPAFilters();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter EPA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter EPA
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tahun */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="tahun">Tahun</Label>
            <Select
              value={filters.tahun}
              onValueChange={(value) => updateFilter("tahun", value)}
            >
              <SelectTrigger id="tahun" className="w-full">
                <SelectValue placeholder="Pilih tahun" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem
                    key={year.value}
                    value={year.value}
                    className="truncate"
                  >
                    <span className="truncate">{year.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Periode EPA (Monthly) */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="periode">Periode EPA</Label>
            <Select
              value={filters.periode}
              onValueChange={(value) => updateFilter("periode", value)}
            >
              <SelectTrigger id="periode" className="w-full">
                <SelectValue placeholder="Pilih periode" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem
                    key={month.value}
                    value={month.value}
                    className="truncate"
                  >
                    <span className="truncate">{month.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kementerian */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="kementerian">Kementerian</Label>
            <Select
              value={filters.kementerian}
              onValueChange={(value) => updateFilter("kementerian", value)}
            >
              <SelectTrigger id="kementerian" className="w-full">
                <SelectValue
                  placeholder="Pilih kementerian"
                  className="truncate"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="truncate">
                  <span className="truncate">Semua Kementerian</span>
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem
                    key={dept.kddept}
                    value={dept.kddept}
                    className="truncate"
                  >
                    <span className="truncate" title={dept.nmdept}>
                      {dept.nmdept}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kanwil */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="kanwil">Kanwil</Label>
            <Select
              value={filters.kanwil}
              onValueChange={(value) => updateFilter("kanwil", value)}
            >
              <SelectTrigger id="kanwil" className="w-full">
                <SelectValue placeholder="Pilih kanwil" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="truncate">
                  <span className="truncate">Semua Kanwil</span>
                </SelectItem>
                {availableKanwils.map((kanwil) => (
                  <SelectItem
                    key={kanwil.kdkanwil}
                    value={kanwil.kdkanwil}
                    className="truncate"
                  >
                    <span className="truncate" title={kanwil.nmkanwil}>
                      {kanwil.nmkanwil}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPPN */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="kppn">KPPN</Label>
            <Select
              value={filters.kppn}
              onValueChange={(value) => updateFilter("kppn", value)}
              disabled={!filters.kanwil || filters.kanwil === "all"}
            >
              <SelectTrigger id="kppn" className="w-full">
                <SelectValue placeholder="Pilih KPPN" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="truncate">
                  <span className="truncate">Semua KPPN</span>
                </SelectItem>
                {availableKPPNs.map((kppn) => (
                  <SelectItem
                    key={kppn.kdkppn}
                    value={kppn.kdkppn}
                    className="truncate"
                  >
                    <span className="truncate" title={kppn.nmkppn}>
                      {kppn.nmkppn}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
