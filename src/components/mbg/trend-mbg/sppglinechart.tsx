"use client";

import { useState, useEffect } from "react";
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
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useSppgKanwil, useSppgData } from "@/features/mbg/hooks/useSppg";
import type { SppgRawRow } from "@/features/mbg/api/services";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAHUN_OPTIONS = ["2025", "2026"];

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
// Types
// ---------------------------------------------------------------------------
type Option = { value: string; label: string };

type ChartRow = Record<string, string | number>;

// ---------------------------------------------------------------------------
// Multi-select kanwil (Popover + Command)
// ---------------------------------------------------------------------------
function MultiSelectKanwil({
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
      <PopoverContent className="w-[280px] p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Cari kanwil..." className="h-8 text-xs" />
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
            <CommandEmpty className="py-4 text-xs">
              Tidak ada data kanwil
            </CommandEmpty>
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
// Custom Tooltip
// ---------------------------------------------------------------------------
type TooltipPayload = { dataKey: string; value: number; color: string };
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md p-2 shadow-md text-xs text-popover-foreground">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.dataKey}:{" "}
          {(entry.value ?? 0).toLocaleString("id-ID", {
            maximumFractionDigits: 0,
          })}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart data builder: group raw rows by tgtarik, sum nilai per nmprov
// ---------------------------------------------------------------------------
function buildChartData(rows: SppgRawRow[], kanwilNames: string[]): ChartRow[] {
  const byDate: Record<string, ChartRow> = {};

  rows.forEach((d) => {
    const date = d.tgtarik;
    if (!byDate[date]) {
      const entry: ChartRow = { tgtarik: date };
      kanwilNames.forEach((kw) => {
        entry[kw] = 0;
      });
      byDate[date] = entry;
    }
    if (kanwilNames.includes(d.nmprov)) {
      byDate[date][d.nmprov] =
        ((byDate[date][d.nmprov] as number) ?? 0) + (d.nilai || 0);
    }
  });

  return Object.values(byDate)
    .sort((a, b) =>
      String(a.tgtarik) < String(b.tgtarik)
        ? -1
        : String(a.tgtarik) > String(b.tgtarik)
          ? 1
          : 0,
    )
    .map((row) => ({
      ...row,
      label: new Date(String(row.tgtarik)).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
    }));
}

// ---------------------------------------------------------------------------
// Y-axis formatter
// ---------------------------------------------------------------------------
function formatYAxis(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}Jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}Rb`;
  return String(v);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SPPGChartLine() {
  const { user } = useAuth();
  const isKanwil = user?.role === "kanwil_djpb";
  const kdkanwil = isKanwil ? (user?.kdkanwil ?? undefined) : undefined;

  const [selectedKanwil, setSelectedKanwil] = useState<Option[]>([]);
  const [tahun, setTahun] = useState("2025");
  const [autoSelected, setAutoSelected] = useState(false);

  const {
    data: kanwilData,
    isLoading: loadingKanwil,
    isError: isKanwilError,
    error: kanwilError,
  } = useSppgKanwil(kdkanwil);

  const kanwilNames = selectedKanwil.map((k) => k.value);

  const {
    data: sppgData,
    isLoading: loadingData,
    isError: isDataError,
    error: dataError,
  } = useSppgData(kanwilNames, kdkanwil);

  const kanwilOptions: Option[] = (kanwilData?.kanwil ?? []).map((k) => ({
    value: k,
    label: k,
  }));

  // Auto-select on load
  useEffect(() => {
    if (autoSelected || loadingKanwil || kanwilOptions.length === 0) return;
    if (isKanwil) {
      setSelectedKanwil(kanwilOptions);
    } else {
      setSelectedKanwil(kanwilOptions[0] ? [kanwilOptions[0]] : []);
    }
    setAutoSelected(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanwilOptions.length, loadingKanwil]);

  useEffect(() => {
    setAutoSelected(false);
    setSelectedKanwil([]);
  }, [kdkanwil]);

  const rows = sppgData?.rows ?? [];
  const chartData = buildChartData(rows, kanwilNames);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (isKanwilError) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-medium text-destructive">
            Gagal memuat daftar kanwil.
          </p>
          <p className="text-xs text-muted-foreground break-all max-w-sm">
            {kanwilError?.message ?? "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader className="p-0">
        <div className="bg-muted/50 px-4 py-3 border-b border-border flex flex-wrap gap-3 items-end">
          {/* Kanwil multi-select */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-foreground mb-1">
              Pilih Kanwil
              {isKanwil && kdkanwil && (
                <span className="text-muted-foreground font-normal ml-1">
                  (Wilayah Anda – {kdkanwil})
                </span>
              )}
            </label>
            <MultiSelectKanwil
              options={kanwilOptions}
              value={selectedKanwil}
              onChange={setSelectedKanwil}
              placeholder="Pilih kanwil..."
              isLoading={loadingKanwil}
              disabled={
                loadingKanwil ||
                (isKanwil && (kanwilData?.kanwil.length ?? 0) <= 1)
              }
            />
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
                {TAHUN_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadSelect>
          </div>
        </div>

        {/* Kanwil info banner */}
        {isKanwil && kdkanwil && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
            <strong>📍 Informasi:</strong> Data dibatasi sesuai wilayah kanwil
            Anda ({kdkanwil})
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 min-w-0">
        <div className="h-[280px]">
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
          ) : loadingKanwil || (loadingData && kanwilNames.length > 0) ? (
            <div className="flex flex-col gap-2 h-full justify-center">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-44 w-full" />
            </div>
          ) : selectedKanwil.length === 0 || chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded border border-dashed border-border p-6">
              <span className="text-5xl mb-2">📊</span>
              <h4 className="text-sm font-medium text-foreground mb-1">
                {isKanwil ? "Data Wilayah Anda" : "Pilih Kanwil"}
              </h4>
              <p className="text-xs text-muted-foreground text-center max-w-[220px]">
                {isKanwil
                  ? "Data tidak tersedia untuk wilayah Anda"
                  : "Pilih satu atau lebih kanwil untuk melihat grafik total nilai SPPG"}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
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
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  tickMargin={8}
                  angle={-30}
                  textAnchor="end"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={formatYAxis}
                  width={50}
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
                {kanwilNames.map((kw, idx) => {
                  const color = COLORS[idx % COLORS.length] ?? "#2563eb";
                  return (
                    <Line
                      key={kw}
                      type="monotone"
                      dataKey={kw}
                      name={kw}
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
