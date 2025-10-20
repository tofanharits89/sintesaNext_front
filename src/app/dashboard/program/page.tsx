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

// Sample data for 21 programs
const samplePrograms = [
  {
    id: "prog-001",
    title: "Program Pendidikan Dasar",
    code: "PRG-PND-001",
    pagu: 5000000000,
    realisasi: 3500000000,
    blokir: 500000000,
  },
  {
    id: "prog-002",
    title: "Program Kesehatan Masyarakat",
    code: "PRG-KSH-002",
    pagu: 4500000000,
    realisasi: 3200000000,
    blokir: 400000000,
  },
  {
    id: "prog-003",
    title: "Program Infrastruktur Jalan",
    code: "PRG-INF-003",
    pagu: 6000000000,
    realisasi: 4200000000,
    blokir: 600000000,
  },
  {
    id: "prog-004",
    title: "Program Pertanian Berkelanjutan",
    code: "PRG-PTN-004",
    pagu: 3500000000,
    realisasi: 2100000000,
    blokir: 350000000,
  },
  {
    id: "prog-005",
    title: "Program Energi Terbarukan",
    code: "PRG-ENR-005",
    pagu: 7000000000,
    realisasi: 4900000000,
    blokir: 700000000,
  },
  {
    id: "prog-006",
    title: "Program Pemberdayaan UMKM",
    code: "PRG-UMK-006",
    pagu: 3000000000,
    realisasi: 2100000000,
    blokir: 300000000,
  },
  {
    id: "prog-007",
    title: "Program Penataan Lingkungan",
    code: "PRG-LNG-007",
    pagu: 2500000000,
    realisasi: 1750000000,
    blokir: 250000000,
  },
  {
    id: "prog-008",
    title: "Program Pelatihan Keterampilan",
    code: "PRG-PLT-008",
    pagu: 1800000000,
    realisasi: 1260000000,
    blokir: 180000000,
  },
  {
    id: "prog-009",
    title: "Program Teknologi Informasi",
    code: "PRG-TKI-009",
    pagu: 4200000000,
    realisasi: 2940000000,
    blokir: 420000000,
  },
  {
    id: "prog-010",
    title: "Program Pembangunan Hunian",
    code: "PRG-HUN-010",
    pagu: 5500000000,
    realisasi: 3850000000,
    blokir: 550000000,
  },
  {
    id: "prog-011",
    title: "Program Pendidikan Tinggi",
    code: "PRG-PND-011",
    pagu: 4000000000,
    realisasi: 2800000000,
    blokir: 400000000,
  },
  {
    id: "prog-012",
    title: "Program Sistem Transportasi",
    code: "PRG-TRP-012",
    pagu: 6500000000,
    realisasi: 4550000000,
    blokir: 650000000,
  },
  {
    id: "prog-013",
    title: "Program Perlindungan Sosial",
    code: "PRG-SOC-013",
    pagu: 3800000000,
    realisasi: 2660000000,
    blokir: 380000000,
  },
  {
    id: "prog-014",
    title: "Program Keamanan Data",
    code: "PRG-SEC-014",
    pagu: 2200000000,
    realisasi: 1540000000,
    blokir: 220000000,
  },
  {
    id: "prog-015",
    title: "Program Inovasi Industri",
    code: "PRG-IND-015",
    pagu: 3200000000,
    realisasi: 2240000000,
    blokir: 320000000,
  },
  {
    id: "prog-016",
    title: "Program Kemitraan Global",
    code: "PRG-GLB-016",
    pagu: 2900000000,
    realisasi: 2030000000,
    blokir: 290000000,
  },
  {
    id: "prog-017",
    title: "Program Konservasi Sumber Daya",
    code: "PRG-KNV-017",
    pagu: 4600000000,
    realisasi: 3220000000,
    blokir: 460000000,
  },
  {
    id: "prog-018",
    title: "Program Pengembangan IPTEK",
    code: "PRG-IPS-018",
    pagu: 3400000000,
    realisasi: 2380000000,
    blokir: 340000000,
  },
  {
    id: "prog-019",
    title: "Program Peningkatan Daya Saing",
    code: "PRG-DSG-019",
    pagu: 2800000000,
    realisasi: 1960000000,
    blokir: 280000000,
  },
  {
    id: "prog-020",
    title: "Program Pembangunan Berkelanjutan",
    code: "PRG-SUS-020",
    pagu: 5200000000,
    realisasi: 3640000000,
    blokir: 520000000,
  },
  {
    id: "prog-021",
    title: "Program Transformasi Digital",
    code: "PRG-DIG-021",
    pagu: 4800000000,
    realisasi: 3360000000,
    blokir: 480000000,
  },
];

export default function DashboardProgramPage() {
  const [isClient, setIsClient] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedProgram, setSelectedProgram] = useState<string>("prioritas");

  useEffect(() => {
    setIsClient(true);
  }, []);

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

      {/* 21 Program Cards in 3-Column Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {samplePrograms.map((program) => (
          <ProgramCard key={program.id} {...program} />
        ))}
      </div>
    </div>
  );
}
