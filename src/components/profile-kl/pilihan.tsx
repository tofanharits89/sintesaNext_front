"use client";

import { useState, useEffect, useMemo } from "react";
import kddept from "@/data/kddept.json";
import kdperiode from "@/data/kdperiode.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

export interface FilterParams {
  thang: string;
  periode: string;
  dept: string;
}

interface PilihanProps {
  onInputChange: (id: string, value: string) => void;
  defaultDept?: string;
}

const TAHUN_OPTIONS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

export default function Pilihan({
  onInputChange,
  defaultDept = "027",
}: PilihanProps) {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const defaultTA = (TAHUN_OPTIONS.includes(currentYear) ? currentYear : TAHUN_OPTIONS[TAHUN_OPTIONS.length - 1]) || "2026";

  const [selectedTA, setSelectedTA] = useState(defaultTA);
  const [selectedPeriode, setSelectedPeriode] = useState(currentMonth);
  const [selectedDept, setSelectedDept] = useState(defaultDept);

  // Sync state if defaultDept changes (e.g. from props)
  useEffect(() => {
    setSelectedDept(defaultDept);
  }, [defaultDept]);

  // Format K/L list for SearchableSelect
  const kementerianOptions = useMemo(() => {
    return (kddept as { kddept: string; nmdept: string }[]).map((k) => ({
      value: k.kddept,
      label: `${k.kddept} - ${k.nmdept}`,
    }));
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 p-4">
      <div className="space-y-1.5">
        <Label htmlFor="thang" className="text-xs font-medium text-muted-foreground">
          Tahun Anggaran
        </Label>
        <Select
          value={selectedTA}
          onValueChange={(val) => {
            setSelectedTA(val);
            onInputChange("thang", val);
          }}
        >
          <SelectTrigger id="thang" className="w-full bg-background">
            <SelectValue placeholder="Pilih TA" />
          </SelectTrigger>
          <SelectContent>
            {TAHUN_OPTIONS.map((ta) => (
              <SelectItem key={ta} value={ta}>
                {ta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="periode" className="text-xs font-medium text-muted-foreground">
          Periode Kinerja
        </Label>
        <Select
          value={selectedPeriode}
          onValueChange={(val) => {
            setSelectedPeriode(val);
            onInputChange("periode", val);
          }}
        >
          <SelectTrigger id="periode" className="w-full bg-background">
            <SelectValue placeholder="Pilih Periode" />
          </SelectTrigger>
          <SelectContent>
            {kdperiode.map((p) => (
              <SelectItem key={p.kdperiode} value={p.kdperiode}>
                {p.kdperiode} - {p.nmperiode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dept" className="text-xs font-medium text-muted-foreground">
          Kementerian / Lembaga
        </Label>
        <SearchableSelect
          options={kementerianOptions}
          value={selectedDept}
          onValueChange={(val) => {
            setSelectedDept(val);
            onInputChange("dept", val);
          }}
          placeholder="Pilih K/L..."
          searchPlaceholder="Cari kode atau nama K/L..."
          className="bg-background hover:bg-zinc-50 dark:hover:bg-zinc-900 border-input"
        />
      </div>
    </div>
  );
}
