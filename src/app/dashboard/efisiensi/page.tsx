"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, Lock, TrendingUp, Target, Download } from "lucide-react";
import * as XLSX from "xlsx";

// Types for data structure
interface EfisiensiRow {
  kddept: string;
  nmdept: string;
  total_pagu: number;
  total_blokir: number;
  avg_potensi_efisiensi: number;
  total_nilai_efisiensi: number;
}

// Formatters
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)}%`;
};

const handleExportToExcel = (data: EfisiensiRow[]) => {
  const excelData = data.map((row) => ({
    "Kode K/L": row.kddept,
    "Nama Kementerian/Lembaga": row.nmdept,
    "Total Pagu": row.total_pagu,
    "Total Blokir": row.total_blokir,
    "Rata-rata Potensi Efisiensi": formatPercentage(row.avg_potensi_efisiensi),
    "Total Nilai Efisiensi": row.total_nilai_efisiensi,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Efisiensi");

  const fileName = `data-efisiensi-kl-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export default function DashboardEfisiensiPage() {
  const [lastRefreshText, setLastRefreshText] = useState<string>("");
  const [efisiensiData, setEfisiensiData] = useState<EfisiensiRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const jakartaTime = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);
    setLastRefreshText(jakartaTime);
  }, []);

  useEffect(() => {
    const fetchEfisiensiData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/dashboard/efisiensi?year=2026`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();

        if (result.success) {
          setEfisiensiData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        console.error('Error fetching efisiensi data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setEfisiensiData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEfisiensiData();
  }, []);

  // Calculate totals from the data
  const totals = efisiensiData.reduce(
    (acc, row) => {
      acc.totalPagu += row.total_pagu;
      acc.totalBlokir += row.total_blokir;
      acc.totalNilaiEfisiensi += row.total_nilai_efisiensi;
      return acc;
    },
    { totalPagu: 0, totalBlokir: 0, totalNilaiEfisiensi: 0 }
  );

  // Calculate weighted average potensi efisiensi
  const weightedAvgPotensiEfisiensi =
    totals.totalPagu > 0
      ? (totals.totalNilaiEfisiensi / totals.totalPagu) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard Efisiensi
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan efisiensi berdasarkan review spending.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Terakhir diperbarui: {lastRefreshText} WIB
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pagu DIPA"
          icon={<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          value={formatCurrency(totals.totalPagu)}
          loading={isLoading}
        />
        <StatCard
          label="Total Blokir DIPA"
          icon={<Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
          value={formatCurrency(totals.totalBlokir)}
          loading={isLoading}
        />
        <StatCard
          label="Rata-rata Potensi Efisiensi"
          icon={<TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
          value={formatPercentage(weightedAvgPotensiEfisiensi)}
          loading={isLoading}
        />
        <StatCard
          label="Total Nilai Efisiensi"
          icon={<Target className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
          value={formatCurrency(totals.totalNilaiEfisiensi)}
          loading={isLoading}
        />
      </div>

      {/* Data Efisiensi per K/L - Main Card */}
      <div className="rounded-lg bg-card text-card-foreground shadow border">
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Data Efisiensi per K/L</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar efisiensi berdasarkan Kementerian/Lembaga
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportToExcel(efisiensiData)}
            disabled={isLoading || efisiensiData.length === 0}
            className="shrink-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </div>

        {/* Table Container */}
        <div className="p-4">
          {error ? (
            <div className="border rounded-lg p-8 text-center text-destructive">
              <p className="font-medium">Error loading data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] text-center">Kode K/L</TableHead>
                    <TableHead className="text-center">Nama Kementerian/Lembaga</TableHead>
                    <TableHead className="text-center">Total Pagu</TableHead>
                    <TableHead className="text-center">Total Blokir</TableHead>
                    <TableHead className="text-center">Rata-rata Potensi Inefisiensi</TableHead>
                    <TableHead className="text-center">Total Nilai Inefisiensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Loading data...
                      </TableCell>
                    </TableRow>
                  ) : efisiensiData.length > 0 ? (
                    efisiensiData.map((row) => (
                      <TableRow key={row.kddept}>
                        <TableCell className="font-medium">{row.kddept}</TableCell>
                        <TableCell>{row.nmdept}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.total_pagu)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.total_blokir)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(row.avg_potensi_efisiensi)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.total_nilai_efisiensi)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Tidak ada data tersedia
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
