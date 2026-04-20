"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const columns = data && data.length > 0 ? Object.keys(data[0]!) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
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

      {data && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Hasil Data ({data.length} record)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={data.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background w-10">
                      No
                    </TableHead>
                    {columns.map((col) => (
                      <TableHead
                        key={col}
                        className="sticky top-0 bg-background whitespace-nowrap"
                      >
                        {col.toUpperCase()}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell key={col} className="whitespace-nowrap">
                          {row[col] !== null && row[col] !== undefined
                            ? String(row[col])
                            : "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
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

  const columns = data && data.length > 0 ? Object.keys(data[0]!) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="thang">Pilih Tahun</Label>
              <Select value={thang} onValueChange={setThang}>
                <SelectTrigger id="thang">
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

      {data && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Hasil Data Rekap ({data.length} record)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={data.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background w-10">
                      No
                    </TableHead>
                    {columns.map((col) => (
                      <TableHead
                        key={col}
                        className="sticky top-0 bg-background whitespace-nowrap"
                      >
                        {col.toUpperCase()}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell key={col} className="whitespace-nowrap">
                          {typeof row[col] === "number"
                            ? (row[col] as number).toLocaleString("id-ID")
                            : row[col] !== null && row[col] !== undefined
                              ? String(row[col])
                              : "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Main Component ---
export function DataSP2DMBG() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="realisasi">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="realisasi" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            Realisasi BGN COA
          </TabsTrigger>
          <TabsTrigger value="rekap" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Rekap Lokus MBG
          </TabsTrigger>
        </TabsList>
        <TabsContent value="realisasi" className="mt-4">
          <TabRealisasiBGN />
        </TabsContent>
        <TabsContent value="rekap" className="mt-4">
          <TabRekapLokus />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DataSP2DMBG;
