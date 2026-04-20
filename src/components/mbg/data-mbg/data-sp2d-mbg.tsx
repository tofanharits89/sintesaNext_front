"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Download,
  Loader2,
  FileSpreadsheet,
  Table2,
  CalendarRange,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from "@/components/animate-ui/components/animate/tabs";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils/utils";
import { ResetButton } from "@/components/ui/reset-button";
import kanwilData from "@/data/kdkanwil.json";

type RowData = Record<string, string | number | null>;

function downloadExcel(data: RowData[], sheetName: string, fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Skeleton Loader ---
function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-muted rounded-md w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-md w-full" />
        ))}
      </div>
      <div className="h-10 bg-muted rounded-md w-full" />
    </div>
  );
}

// --- Tab 1: Tarik Data Realisasi BGN COA ---
function TabRealisasiBGN() {
  const [tglAwal, setTglAwal] = useState<Date | undefined>(undefined);
  const [tglAkhir, setTglAkhir] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RowData[] | null>(null);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const params = new URLSearchParams({
        tglAwal: tglAwal ? format(tglAwal, "yyyy-MM-dd") : "",
        tglAkhir: tglAkhir ? format(tglAkhir, "yyyy-MM-dd") : "",
      });
      const res = await fetch(`/api/mbg/realisasi-sp2d?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Gagal mengambil data");
      }
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!data || data.length === 0) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadExcel(data, "DataBGN", `data_realisasi_bgn_${date}.xlsx`);
  };

  const handleReset = () => {
    setTglAwal(undefined);
    setTglAkhir(undefined);
    setData(null);
    setError("");
  };

  const tableColumns = useMemo<ColumnDef<RowData>[]>(() => {
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]!);
    return [
      {
        id: "no",
        header: () => <div className="text-center font-medium w-10">No</div>,
        cell: ({ row }) => <div className="text-center w-10">{row.index + 1}</div>,
      },
      ...keys.map((key) => ({
        accessorKey: key,
        header: () => (
          <div className="text-center font-medium whitespace-nowrap">
            {key.toUpperCase()}
          </div>
        ),
        cell: ({ row }: any) => {
          const rawVal = row.getValue(key);
          const keyUpper = key.toUpperCase();
          const isKD = keyUpper.startsWith("KD");
          const isTgl = keyUpper.includes("TGL");
          const isYear =
            keyUpper === "THANG" || keyUpper === "TAHUN" || keyUpper === "THN";
          
          const months = [
            "JANUARI",
            "FEBRUARI",
            "MARET",
            "APRIL",
            "MEI",
            "JUNI",
            "JULI",
            "AGUSTUS",
            "SEPTEMBER",
            "OKTOBER",
            "NOVEMBER",
            "DESEMBER",
          ];
          const shortMonths = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
          
          const isMonth = months.includes(keyUpper) || shortMonths.some(m => keyUpper.startsWith(m));
          const isRealisasi =
            keyUpper.includes("REALISASI") ||
            keyUpper.includes("NILAI") ||
            keyUpper.includes("PAGU") ||
            keyUpper.includes("TOTAL") ||
            keyUpper.includes("JUMLAH") ||
            isMonth;

          // Handle strings that should be numbers (but skip KD, Date, and Year columns)
          let val = rawVal;
          if (
            typeof rawVal === "string" &&
            !isKD &&
            !isTgl &&
            !isYear &&
            rawVal.trim() !== "" &&
            !isNaN(Number(rawVal))
          ) {
            val = Number(rawVal);
          }

          // Fallback: If TOTAL/JUMLAH is empty/0, try to sum months
          if (
            (keyUpper.includes("TOTAL") || keyUpper.includes("JUMLAH")) &&
            (val === null || val === undefined || val === 0 || val === "0")
          ) {
            // Get all keys from the original row to find month-like columns
            const rowKeys = Object.keys(row.original);
            const sum = rowKeys.reduce((acc, rk) => {
              const rkUpper = rk.toUpperCase();
              const isMonthCol = months.includes(rkUpper) || 
                                (shortMonths.some(m => rkUpper.startsWith(m)) && !rkUpper.includes("TOTAL") && !rkUpper.includes("JUMLAH"));
              
              if (isMonthCol) {
                const mVal = row.original[rk];
                const n = typeof mVal === "number" ? mVal : Number(mVal);
                return acc + (isNaN(n) ? 0 : n);
              }
              return acc;
            }, 0);
            if (sum > 0) val = sum;
          }

          return (
            <div
              className={cn(
                "whitespace-nowrap px-2",
                (isKD || isTgl || isYear) && "text-center",
                isRealisasi && "text-right font-mono tabular-nums",
              )}
            >
              {typeof val === "number"
                ? isYear
                  ? String(val)
                  : val.toLocaleString("id-ID", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })
                : isTgl && val
                  ? (() => {
                      try {
                        const d = new Date(String(val));
                        return isNaN(d.getTime())
                          ? String(val)
                          : format(d, "dd-MM-yyyy");
                      } catch {
                        return String(val);
                      }
                    })()
                  : val !== null && val !== undefined
                    ? String(val)
                    : "-"}
            </div>
          );
        },
      })),
    ];
  }, [data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Filter Data</CardTitle>
            <ResetButton onReset={handleReset} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Tanggal Awal SP2D</Label>
              <DatePicker
                date={tglAwal}
                onDateChange={setTglAwal}
                placeholder="Pilih Tanggal Awal"
                className="bg-zinc-100 dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-950 transition-colors"
                captionLayout="dropdown"
                startMonth={new Date(2020, 0)}
                endMonth={new Date(new Date().getFullYear() + 5, 11)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Akhir SP2D</Label>
              <DatePicker
                date={tglAkhir}
                onDateChange={setTglAkhir}
                placeholder="Pilih Tanggal Akhir"
                className="bg-zinc-100 dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-950 transition-colors"
                captionLayout="dropdown"
                startMonth={new Date(2020, 0)}
                endMonth={new Date(new Date().getFullYear() + 5, 11)}
              />
            </div>
            <Button
              onClick={handleFetch}
              disabled={loading || !tglAwal || !tglAkhir}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Tarik Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Hasil Data Realisasi BGN COA {data ? `(${data.length} record)` : ""}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!data || data.length === 0}
            className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
          >
            <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
            <span className="text-sm text-white">Unduh Data Excel</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : data ? (
            <DataTable columns={tableColumns} data={data} initialPageSize={25} />
          ) : (
            <div className="border rounded-md">
              <div className="h-10 bg-muted/50 border-b flex items-center px-4">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Data belum ditarik
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background/50">
                <Table2 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">
                  Silahkan Pilih Tanggal dan klik "Tarik Data" untuk menampilkan
                  hasil
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Tab 2: Rekap Lokus Banper MBG ---
function TabRekapLokus() {
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = 2025; y <= currentYear; y++) yearOptions.push(y);

  const [thang, setThang] = useState(currentYear.toString());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RowData[] | null>(null);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const params = new URLSearchParams({ thang });
      const res = await fetch(`/api/mbg/rekap-lokus?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Gagal mengambil data");
      }
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!data || data.length === 0) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadExcel(
      data,
      "RekapLokusMBG",
      `rekap_lokus_mbg_${thang}_${date}.xlsx`,
    );
  };

  const handleReset = () => {
    setThang(currentYear.toString());
    setData(null);
    setError("");
  };

  const tableColumns = useMemo<ColumnDef<RowData>[]>(() => {
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]!);
    return [
      {
        id: "no",
        header: () => <div className="text-center font-medium w-10">No</div>,
        cell: ({ row }) => <div className="text-center w-10">{row.index + 1}</div>,
      },
      ...keys.map((key) => ({
        accessorKey: key,
        header: () => (
          <div className="text-center font-medium whitespace-nowrap">
            {key.toUpperCase()}
          </div>
        ),
        cell: ({ row }: any) => {
          const rawVal = row.getValue(key);
          const keyUpper = key.toUpperCase();
          const isKD = keyUpper.startsWith("KD");
          const isTgl = keyUpper.includes("TGL");
          const isYear =
            keyUpper === "THANG" || keyUpper === "TAHUN" || keyUpper === "THN";
          
          const months = [
            "JANUARI",
            "FEBRUARI",
            "MARET",
            "APRIL",
            "MEI",
            "JUNI",
            "JULI",
            "AGUSTUS",
            "SEPTEMBER",
            "OKTOBER",
            "NOVEMBER",
            "DESEMBER",
          ];
          const shortMonths = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
          
          const isMonth = months.includes(keyUpper) || shortMonths.some(m => keyUpper.startsWith(m));
          const isRealisasi =
            keyUpper.includes("REALISASI") ||
            keyUpper.includes("NILAI") ||
            keyUpper.includes("PAGU") ||
            keyUpper.includes("TOTAL") ||
            keyUpper.includes("JUMLAH") ||
            isMonth;

          // Handle strings that should be numbers (but skip KD, Date, and Year columns)
          let val = rawVal;
          if (
            typeof rawVal === "string" &&
            !isKD &&
            !isTgl &&
            !isYear &&
            rawVal.trim() !== "" &&
            !isNaN(Number(rawVal))
          ) {
            val = Number(rawVal);
          }

          // Fallback: If TOTAL/JUMLAH is empty/0, try to sum months
          if (
            (keyUpper.includes("TOTAL") || keyUpper.includes("JUMLAH")) &&
            (val === null || val === undefined || val === 0 || val === "0")
          ) {
            // Get all keys from the original row to find month-like columns
            const rowKeys = Object.keys(row.original);
            const sum = rowKeys.reduce((acc, rk) => {
              const rkUpper = rk.toUpperCase();
              const isMonthCol = months.includes(rkUpper) || 
                                (shortMonths.some(m => rkUpper.startsWith(m)) && !rkUpper.includes("TOTAL") && !rkUpper.includes("JUMLAH"));
              
              if (isMonthCol) {
                const mVal = row.original[rk];
                const n = typeof mVal === "number" ? mVal : Number(mVal);
                return acc + (isNaN(n) ? 0 : n);
              }
              return acc;
            }, 0);
            if (sum > 0) val = sum;
          }

          return (
            <div
              className={cn(
                "whitespace-nowrap px-2",
                (isKD || isTgl || isYear) && "text-center",
                isRealisasi && "text-right font-mono tabular-nums",
              )}
            >
              {typeof val === "number"
                ? isYear
                  ? String(val)
                  : val.toLocaleString("id-ID", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })
                : isTgl && val
                  ? (() => {
                      try {
                        const d = new Date(String(val));
                        return isNaN(d.getTime())
                          ? String(val)
                          : format(d, "dd-MM-yyyy");
                      } catch {
                        return String(val);
                      }
                    })()
                  : val !== null && val !== undefined
                    ? String(val)
                    : "-"}
            </div>
          );
        },
      })),
    ];
  }, [data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Filter Data</CardTitle>
            <ResetButton onReset={handleReset} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="thang">Pilih Tahun</Label>
              <Select value={thang} onValueChange={setThang}>
                <SelectTrigger id="thang" className="w-full">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleFetch} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Tarik Data Rekap
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Hasil Data Rekap Lokus Banper MBG {data ? `(${data.length} record)` : ""}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!data || data.length === 0}
            className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
          >
            <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
            <span className="text-sm text-white">Unduh Data Excel</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : data ? (
            <DataTable columns={tableColumns} data={data} initialPageSize={25} />
          ) : (
            <div className="border rounded-md">
              <div className="h-10 bg-muted/50 border-b flex items-center px-4">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Data belum ditarik
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background/50">
                <Table2 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">
                  Silahkan Pilih Tahun dan klik "Tarik Data Rekap" untuk menampilkan hasil
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Component ---
export function DataSP2DMBG() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="realisasi" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-2 gap-2 md:gap-0">
            <TabsTrigger
              value="realisasi"
              className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base whitespace-nowrap flex items-center justify-center gap-2"
            >
              <CalendarRange className="h-4 w-4 md:h-5 md:w-5" />
              Realisasi BGN COA
            </TabsTrigger>
            <TabsTrigger
              value="rekap"
              className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base whitespace-nowrap flex items-center justify-center gap-2"
            >
              <MapPin className="h-4 w-4 md:h-5 md:w-5" />
              Rekap Lokus MBG
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContents>
          <TabsContent value="realisasi" className="mt-0">
            <TabRealisasiBGN />
          </TabsContent>
          <TabsContent value="rekap" className="mt-0">
            <TabRekapLokus />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}

export default DataSP2DMBG;
