"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ResetButton } from "@/components/ui/reset-button";
import { RekamDataTransaksiModal } from "./modals/rekam-data-transaksi-modal";
import { KertasKerjaModal } from "./modals/kertas-kerja-modal";
import tkdData from "@/data/kdkppn_tkd.json";

interface DataTransaksiTabProps {
  // Remove selectedYear prop as this tab will manage its own year state
}

// Mock data for transaction table
const mockTransaksiData = [
  {
    id: "1",
    no: 1,
    tahun: "2024",
    bulan: "Januari",
    kppn: "001 - BANDA ACEH",
    kabkota: "0601 - Kab. Aceh Besar",
    alokasi: 5000000000,
    nilaiPotongan: 250000000,
  },
  {
    id: "2",
    no: 2,
    tahun: "2024",
    bulan: "Februari",
    kppn: "003 - MEULABOH",
    kabkota: "0606 - Kab. Aceh Barat",
    alokasi: 4500000000,
    nilaiPotongan: 180000000,
  },
  {
    id: "3",
    no: 3,
    tahun: "2024",
    bulan: "Maret",
    kppn: "002 - LANGSA",
    kabkota: "0604 - Kab. Aceh Timur",
    alokasi: 4200000000,
    nilaiPotongan: 150000000,
  },
];

export function DataTransaksiTab({}: DataTransaksiTabProps) {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedKppn, setSelectedKppn] = useState("");
  const [selectedKabKota, setSelectedKabKota] = useState("");
  const [isRekamDataModalOpen, setIsRekamDataModalOpen] = useState(false);
  const [isKertasKerjaModalOpen, setIsKertasKerjaModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Build unique KPPN list from TKD mapping
  const uniqueKppn = Array.from(
    new Map(
      (tkdData as Array<any>).map((d) => [
        d.kdkppn,
        { kdkppn: d.kdkppn, nmkppn: d.nmkppn },
      ])
    ).values()
  ).sort((a, b) => a.kdkppn.localeCompare(b.kdkppn));

  // Hierarchical: Kab/Kota depends on selected KPPN from TKD mapping
  const filteredKabKotaOptions = selectedKppn
    ? (tkdData as Array<any>)
        .filter(
          (row) =>
            row.kdkppn === selectedKppn && !String(row.kdkabkota).endsWith("00")
        )
        .sort((a, b) => String(a.kdkabkota).localeCompare(String(b.kdkabkota)))
    : [];

  // Clear Kab/Kota when KPPN changes
  useEffect(() => {
    setSelectedKabKota("");
  }, [selectedKppn]);

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const handleReset = () => {
    setSelectedYear("2024");
    setSelectedMonth("");
    setSelectedKppn("");
    setSelectedKabKota("");
  };

  const handleRekamData = (item: any) => {
    setSelectedItem(item);
    setIsRekamDataModalOpen(true);
  };

  const handleKertasKerja = (item: any) => {
    setSelectedItem(item);
    setIsKertasKerjaModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      accessorKey: "no",
      header: ({ column }: any) => (
        <div className="text-center font-medium">No</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("no")}</div>
      ),
    },
    {
      accessorKey: "tahun",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Tahun</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("tahun")}</div>
      ),
    },
    {
      accessorKey: "bulan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Bulan</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("bulan")}</div>
      ),
    },
    {
      accessorKey: "kppn",
      header: ({ column }: any) => (
        <div className="text-center font-medium">KPPN</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[150px] truncate mx-auto"
          title={row.getValue("kppn")}
        >
          {row.getValue("kppn")}
        </div>
      ),
    },
    {
      accessorKey: "kabkota",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Kab/Kota</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[150px] truncate mx-auto"
          title={row.getValue("kabkota")}
        >
          {row.getValue("kabkota")}
        </div>
      ),
    },
    {
      accessorKey: "alokasi",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Alokasi</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center font-mono">
          {formatCurrency(row.getValue("alokasi"))}
        </div>
      ),
    },
    {
      accessorKey: "nilaiPotongan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Nilai Potongan</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center font-mono">
          {formatCurrency(row.getValue("nilaiPotongan"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Aksi</div>
      ),
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRekamData(row.original)}
          >
            Rekam Data Transaksi
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleKertasKerja(row.original)}
          >
            Kertas Kerja
          </Button>
        </div>
      ),
    },
  ];

  // Filter data based on selections
  const normalizeKppn = (s: string) =>
    (s || "")
      .toLowerCase()
      .replace(/^kppn\s+/, "")
      .trim();
  const normalizeKabKota = (s: string) =>
    (s || "")
      .toLowerCase()
      .replace(/^kota\s+/, "")
      .replace(/^kab\.\s+/, "")
      .replace(/^provinsi\s+/, "")
      .trim();

  const selectedKppnName = selectedKppn
    ? uniqueKppn.find((k) => k.kdkppn === selectedKppn)?.nmkppn || ""
    : "";
  const selectedKabKotaName = selectedKabKota
    ? (tkdData as Array<any>).find((row) => row.kdkabkota === selectedKabKota)
        ?.nmkabkota || ""
    : "";

  const filteredData = mockTransaksiData.filter((item) => {
    return (
      item.tahun === selectedYear &&
      (selectedMonth === "" || item.bulan === selectedMonth) &&
      (selectedKppn === "" ||
        normalizeKppn(item.kppn).includes(normalizeKppn(selectedKppnName))) &&
      (selectedKabKota === "" ||
        normalizeKabKota(item.kabkota).includes(
          normalizeKabKota(selectedKabKotaName)
        ))
    );
  });

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filter Data</CardTitle>
            <ResetButton onReset={handleReset} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bulan</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">KPPN</label>
              <Select value={selectedKppn} onValueChange={setSelectedKppn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih KPPN" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueKppn.map((kppn) => (
                    <SelectItem
                      key={kppn.kdkppn}
                      value={kppn.kdkppn}
                      title={`${kppn.kdkppn} - ${kppn.nmkppn}`}
                    >
                      <span className="truncate">
                        {kppn.kdkppn} - {kppn.nmkppn}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kab/Kota</label>
              <Select
                value={selectedKabKota}
                onValueChange={setSelectedKabKota}
              >
                <SelectTrigger className="w-full" disabled={!selectedKppn}>
                  <SelectValue
                    placeholder={
                      selectedKppn
                        ? "Pilih Kab/Kota"
                        : "Pilih KPPN terlebih dahulu"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredKabKotaOptions.map((lokasi) => (
                    <SelectItem
                      key={lokasi.kdkabkota}
                      value={lokasi.kdkabkota}
                      title={`${lokasi.kdkabkota} - ${lokasi.nmkabkota}`}
                    >
                      <span className="truncate">
                        {lokasi.kdkabkota} - {lokasi.nmkabkota}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Data Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredData} />
        </CardContent>
      </Card>

      {/* Modals */}
      <RekamDataTransaksiModal
        open={isRekamDataModalOpen}
        onOpenChange={setIsRekamDataModalOpen}
        data={selectedItem}
      />
      <KertasKerjaModal
        open={isKertasKerjaModalOpen}
        onOpenChange={setIsKertasKerjaModalOpen}
        data={selectedItem}
      />
    </div>
  );
}
