"use client";

import { useState, useEffect } from "react";
import { ProgramCard } from "@/components/dashboard/ProgramCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProgramData } from "@/hooks/useProgramData";
import { Loader2 } from "lucide-react";

export default function DashboardProgramPage() {
  const [isClient, setIsClient] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedProgram, setSelectedProgram] = useState<string>("prioritas");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch program data based on selected filters
  const { data: programData, isLoading, error } = useProgramData({
    programType: selectedProgram as "prioritas" | "strategis",
    year: selectedYear,
    enabled: isClient,
  });

  // Debug: log the fetched data
  useEffect(() => {
    if (programData) {
      console.log('Fetched program data:', programData);
      programData.forEach(p => {
        console.log(`Program ${p.title}: has ${p.subOutputs?.length || 0} subOutputs`);
      });
    }
  }, [programData]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Program
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan realisasi per program dengan status Pagu, Realisasi, dan Blokir.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Jenis Program</label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Pilih Jenis Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prioritas">Program Prioritas Presiden</SelectItem>
                <SelectItem value="strategis">Program Strategis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Tahun</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Program Cards */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat data program...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">
            Gagal memuat data program: {error.message}
          </p>
        </div>
      )}

      {!isLoading && !error && programData && programData.length === 0 && (
        <div className="rounded-lg border border-muted bg-muted/10 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada data program untuk filter yang dipilih.
          </p>
        </div>
      )}

      {!isLoading && !error && programData && programData.length > 0 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...programData]
            .sort((a, b) => String(a.code).localeCompare(String(b.code)))
            .map((program) => (
              <ProgramCard key={program.id} {...program} year={selectedYear} />
            ))}
        </div>
      )}
    </div>
  );
}
