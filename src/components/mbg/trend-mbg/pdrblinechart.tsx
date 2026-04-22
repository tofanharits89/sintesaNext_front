"use client";

import { useState, useCallback, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { Check, ChevronsUpDown, Download, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  usePdrbKategori,
  usePdrbProvinsi,
  usePdrbData,
} from "@/features/mbg/hooks/usePdrb";
import { getPdrbExport } from "@/features/mbg/api/services";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Option = { value: string; label: string };

const KATEGORI_LABEL: Record<string, string> = {
  "A Pertanian, Kehutanan dan Perikanan": "Pertanian",
  "B Pertambangan dan Penggalian": "Pertambangan",
  "C Industri Pengolahan": "Industri",
  "D Pengadaan Listrik dan Gas": "Pengadaan Listrik & Gas",
  "E Pengadaan Air, Pengelolaan Sampah, Limbah dan Daur Ulang":
    "Pengelolaan Air & Sampah",
  "F Konstruksi": "Konstruksi",
  "G Perdagangan Besar dan Eceran, Reparasi Mobil dan Sepeda Motor":
    "Perdagangan Besar & Ritel",
  "H Transportasi dan Pergudangan": "Transportasi",
  "I Penyediaan Akomodasi dan Makan Minum": "Akomodasi & Mamin",
  "J Informasi dan Komunikasi": "Informasi & Komunikasi",
  "K Jasa Keuangan dan Asuransi": "Jasa Keuangan",
  "L Real Estate": "Real Estate",
  "M,N Jasa Perusahaan": "Jasa Perusahaan",
  "O Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib":
    "Administrasi Pemerintahan",
  "P Jasa Pendidikan": "Jasa Pendidikan",
  "Q Jasa Kesehatan dan Kegiatan Sosial": "Jasa Kesehatan",
  "R,S,T,U Jasa Lainnya": "Jasa Lainnya",
  "Produk Domestik Regional Bruto": "Total PDRB",
};

const TW_LIST: { key: "tw1" | "tw2" | "tw3" | "tw4"; label: string }[] = [
  { key: "tw1", label: "Q1" },
  { key: "tw2", label: "Q2" },
  { key: "tw3", label: "Q3" },
  { key: "tw4", label: "Q4" },
];

const TAHUN_OPTIONS: Option[] = [
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
];

const COLORS = [
  "#2563eb",
  "#059669",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#374151",
];

// ---------------------------------------------------------------------------
// Multi-select provinsi (Popover + Command)
// ---------------------------------------------------------------------------
function MultiSelectProv({
  options,
  value,
  onChange,
  placeholder,
  isLoading,
  disabled,
}: {
  options: Option[];
  value: Option[];
  onChange: (val: Option[]) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (opt: Option) => {
    const exists = value.some((v) => v.value === opt.value);
    onChange(
      exists ? value.filter((v) => v.value !== opt.value) : [...value, opt],
    );
  };

  const remove = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v.value !== optValue));
  };

  const displayText =
    value.length === 0
      ? (placeholder ?? "Pilih...")
      : value.length <= 2
        ? value.map((v) => v.label).join(", ")
        : `${value[0]?.label ?? ""}, ${value[1]?.label ?? ""}, +${value.length - 2} lainnya`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || isLoading}
          aria-expanded={open}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-3 text-xs font-normal text-foreground shadow-xs",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "ring-2 ring-ring",
          )}
        >
          <span className="truncate text-left leading-none">
            {isLoading ? (
              <span className="text-muted-foreground">Memuat...</span>
            ) : value.length === 0 ? (
              <span className="text-muted-foreground">{displayText}</span>
            ) : (
              displayText
            )}
          </span>
          <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput
            placeholder="Cari provinsi..."
            className="h-8 text-xs"
          />
          {value.length > 0 && (
            <div className="flex flex-wrap gap-1 border-b px-2 py-1.5">
              {value.map((v) => (
                <Badge
                  key={v.value}
                  variant="secondary"
                  className="h-5 gap-1 pr-1 text-xs font-normal"
                >
                  {v.label}
                  <button
                    type="button"
                    onClick={(e) => remove(v.value, e)}
                    className="rounded-full opacity-60 hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <CommandList className="max-h-[180px]">
            <CommandEmpty className="text-xs py-4">Tidak ada data</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const selected = value.some((v) => v.value === opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => toggle(opt)}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
type TooltipPayload = { dataKey: string; value: number; color: string };
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md p-2 shadow-md text-xs text-popover-foreground">
      <p className="mb-1 font-medium text-[13px]">Periode: {label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="my-0.5">
          {entry.dataKey}: {(entry.value ?? 0).toLocaleString("id-ID")}
        </p>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PdrbChart() {
  const { user } = useAuth();
  const isKanwil = user?.role === "kanwil_djpb";
  const kdkanwil = isKanwil ? (user?.kdkanwil ?? undefined) : undefined;

  const [selectedProv, setSelectedProv] = useState<Option[]>([]);
  const [kategori, setKategori] = useState(
    "A Pertanian, Kehutanan dan Perikanan",
  );
  const [tahun, setTahun] = useState("2025");
  const [isExporting, setIsExporting] = useState(false);
  const [autoSelected, setAutoSelected] = useState(false);

  const { data: kategoriData, isLoading: loadingKat } = usePdrbKategori(tahun);
  const {
    data: provinsiData,
    isLoading: loadingProv,
    isError: isProvError,
    error: provError,
  } = usePdrbProvinsi(tahun, kdkanwil);
  const {
    data: pdrbData,
    isLoading: loadingData,
    isError: isDataError,
    error: dataError,
  } = usePdrbData(
    selectedProv.map((p) => p.value),
    kategori,
    tahun,
    kdkanwil,
  );

  const provOptions: Option[] = (provinsiData?.provinsi ?? []).map((p) => ({
    value: p,
    label: p,
  }));

  const kategoriOptions: Option[] = (kategoriData?.kategori ?? []).map((k) => ({
    value: k,
    label: KATEGORI_LABEL[k] ?? k,
  }));

  // Auto-select default province
  useEffect(() => {
    if (autoSelected || loadingProv || provOptions.length === 0) return;
    if (isKanwil) {
      setSelectedProv(provOptions);
    } else {
      const dki = provOptions.find((p) => p.value === "DKI Jakarta");
      setSelectedProv(dki ? [dki] : provOptions[0] ? [provOptions[0]] : []);
    }
    setAutoSelected(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provOptions.length, loadingProv]);

  useEffect(() => {
    setAutoSelected(false);
    setSelectedProv([]);
  }, [kdkanwil]);

  // Build chart data (X: Q1–Q4, one line per province)
  const rows = pdrbData?.rows ?? [];
  const provNames = selectedProv.map((p) => p.value);

  const chartData = TW_LIST.map(({ key, label }) => {
    const row: Record<string, string | number> = { label };
    provNames.forEach((pv) => {
      const found = rows.find((r) => r.provinsi === pv);
      if (found) row[pv] = Number(found[key]) || 0;
    });
    return row;
  });

  // ---------------------------------------------------------------------------
  // Excel download
  // ---------------------------------------------------------------------------
  const handleDownload = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const { rows: allRows } = await getPdrbExport();
      if (!allRows.length) return;
      const exportData = allRows.map((r) => ({
        Provinsi: r.provinsi ?? "",
        Kategori: r.kategori ?? "",
        TW1: r.tw1 ?? 0,
        TW2: r.tw2 ?? 0,
        TW3: r.tw3 ?? 0,
        TW4: r.tw4 ?? 0,
        Tahun: r.tahun ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data PDRB");
      XLSX.writeFile(wb, `PDRB_${tahun}.xlsx`);
    } catch {
      // silent fail
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, tahun]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (isProvError) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-medium text-destructive">
            Gagal memuat data provinsi.
          </p>
          <p className="text-xs text-muted-foreground break-all max-w-sm">
            {provError?.message ?? "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="bg-muted/50 px-4 py-3 border-b border-border flex flex-wrap gap-3 items-end justify-between">
          {/* Province multi-select */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-foreground mb-1">
              Pilih Provinsi
              {isKanwil && kdkanwil && (
                <span className="text-muted-foreground font-normal ml-1">
                  (Wilayah Anda – {kdkanwil})
                </span>
              )}
            </label>
            <MultiSelectProv
              options={provOptions}
              value={selectedProv}
              onChange={setSelectedProv}
              placeholder="Pilih provinsi..."
              isLoading={loadingProv}
              disabled={
                loadingProv ||
                (isKanwil && (provinsiData?.provinsi.length ?? 0) <= 1)
              }
            />
          </div>

          {/* Kategori select */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-foreground mb-1">
              Pilih Kategori
            </label>
            <ShadSelect
              value={kategori}
              onValueChange={setKategori}
              disabled={loadingKat || kategoriOptions.length === 0}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue
                  placeholder={loadingKat ? "Memuat..." : "Pilih kategori..."}
                />
              </SelectTrigger>
              <SelectContent>
                {kategoriOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadSelect>
          </div>

          {/* Tahun */}
          <div className="w-[100px]">
            <label className="block text-xs font-medium text-foreground mb-1">
              Tahun
            </label>
            <ShadSelect value={tahun} onValueChange={setTahun}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAHUN_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadSelect>
          </div>

          {/* Download */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isExporting}
            className="h-8 px-3 gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950"
            title="Download Excel semua data PDRB"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="h-[300px]">
          {isDataError ? (
            <div className="flex flex-col items-center justify-center h-full bg-destructive/5 rounded border border-dashed border-destructive/40 p-6 gap-2">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-medium text-destructive">
                Gagal memuat data grafik.
              </p>
              <p className="text-xs text-muted-foreground break-all max-w-sm text-center">
                {dataError?.message ?? "Unknown error"}
              </p>
            </div>
          ) : loadingProv || (loadingData && selectedProv.length > 0) ? (
            <div className="flex flex-col gap-2 h-full justify-center">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedProv.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded border border-dashed border-border p-6">
              <span className="text-5xl mb-2">📊</span>
              <h4 className="text-sm font-medium text-foreground mb-1">
                {isKanwil ? "Data Wilayah Anda" : "Pilih Provinsi dan Kategori"}
              </h4>
              <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                {isKanwil
                  ? `Data ditampilkan sesuai wilayah kerja Anda${kdkanwil ? ` (${kdkanwil})` : ""}`
                  : "Gunakan dropdown untuk memilih provinsi dan kategori PDRB yang ingin dianalisis"}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(v: number) => {
                    if (v >= 1_000_000_000)
                      return `${(v / 1_000_000_000).toFixed(1)}M`;
                    if (v >= 1_000_000)
                      return `${(v / 1_000_000).toFixed(1)}Jt`;
                    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}Rb`;
                    return String(v);
                  }}
                  tickMargin={2}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={24}
                  wrapperStyle={{
                    fontSize: 11,
                    fontWeight: 400,
                    paddingTop: 12,
                  }}
                  iconType="line"
                />
                {provNames.map((pv, idx) => {
                  const color = COLORS[idx % COLORS.length] ?? "#2563eb";
                  return (
                    <Line
                      key={pv}
                      type="monotone"
                      dataKey={pv}
                      name={pv}
                      stroke={color}
                      strokeWidth={2}
                      dot={{
                        fill: color,
                        strokeWidth: 2,
                        stroke: "#ffffff",
                        r: 3,
                      }}
                      activeDot={{
                        r: 4,
                        stroke: color,
                        strokeWidth: 2,
                        fill: "#ffffff",
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
