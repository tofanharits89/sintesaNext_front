"use client";

import { useState, useEffect } from "react";
import { ProgramCard } from "@/components/dashboard/ProgramCard";
import { ProgramDashboardSkeleton } from "@/components/dashboard/program-dashboard-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProgramData } from "@/hooks/useProgramData";
import kdkanwilData from "@/data/kdkanwil.json";

export default function DashboardProgramPage() {
  const [isClient, setIsClient] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedProgram, setSelectedProgram] = useState<string>("prioritas");
  const [selectedKanwil, setSelectedKanwil] = useState<string>("semua");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch program data based on selected filters
  const { data: programData, isLoading, error } = useProgramData({
    programType: selectedProgram as "prioritas" | "strategis",
    year: selectedYear,
    kanwil: selectedKanwil,
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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Program
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan realisasi per program dengan status Pagu, Realisasi, dan Blokir.
          </p>
        </div>
        
        {/* Filters */}
        <div className="w-full md:w-auto flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Tahun</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Kanwil</label>
            <Select value={selectedKanwil} onValueChange={setSelectedKanwil}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Pilih Kanwil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kanwil</SelectItem>
                {kdkanwilData.map((kanwil) => (
                  <SelectItem key={kanwil.kdkanwil} value={kanwil.kdkanwil}>
                    {kanwil.nmkanwil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Jenis Program</label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Pilih Jenis Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prioritas">Program Prioritas Presiden</SelectItem>
                <SelectItem value="strategis">Program Strategis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Program Cards Skeleton Loading */}
      {isLoading && <ProgramDashboardSkeleton />}

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
            .sort((a, b) => b.realisasi - a.realisasi)
            .map((program) => (
              <ProgramCard key={program.id} {...program} year={selectedYear} />
            ))}
        </div>
      )}
    </div>
  );
}

