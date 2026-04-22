"use client";

import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import {
  User,
  UserRound,
  UserCog,
  ShieldCheck,
  ChefHat,
  Truck,
  UtensilsCrossed,
  Car,
  Droplets,
  Sparkles,
  Shield,
  HandHelping,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  usePetugasProvinsi,
  usePetugasData,
} from "@/features/mbg/hooks/usePetugas";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAHUN_OPTIONS = ["2025", "2026"];

const JENIS_WARNA: Record<string, string> = {
  "Kepala SPPG": "#1e40af",
  "Ahli Gizi": "#0891b2",
  "Staf Keuangan": "#374151",
  "Kepala Lapangan": "#ea580c",
  "Kepala Juru Masak": "#dc2626",
  "Juru Masak": "#7c2d12",
  "Persiapan (preparation)": "#d97706",
  Pemorsian: "#ca8a04",
  Pengemudi: "#7c3aed",
  "Cuci Ompreng": "#0369a1",
  Kebersihan: "#059669",
  Keamanan: "#dc2626",
  Koordinator: "#8b5cf6",
  Supervisor: "#c2410c",
  Asisten: "#6b7280",
  "Petugas Lapangan": "#16a34a",
  "Petugas Gudang": "#92400e",
  "Petugas Keamanan": "#b91c1c",
  "Petugas Kebersihan": "#15803d",
  Driver: "#6d28d9",
  Koki: "#ef4444",
  Helper: "#f59e0b",
  Administrasi: "#4f46e5",
  Logistik: "#0d9488",
  Teknis: "#be123c",
  Medis: "#0f766e",
  Pendidikan: "#7c3aed",
  Sosial: "#db2777",
  Humas: "#ea580c",
  IT: "#2563eb",
  Keuangan: "#16a34a",
  Operasional: "#dc2626",
};

const FALLBACK_COLORS = [
  "#1e40af",
  "#0891b2",
  "#374151",
  "#ea580c",
  "#dc2626",
  "#7c2d12",
  "#d97706",
  "#ca8a04",
  "#7c3aed",
  "#0369a1",
  "#059669",
  "#8b5cf6",
  "#c2410c",
  "#6b7280",
  "#16a34a",
  "#92400e",
  "#6d28d9",
  "#ef4444",
  "#f59e0b",
  "#4f46e5",
  "#0d9488",
];

const getUniqueColor = (idx: number) =>
  FALLBACK_COLORS[idx % FALLBACK_COLORS.length] ?? "#6b7280";

// ---------------------------------------------------------------------------
// Icon mapping (lucide-react, no react-icons dependency)
// ---------------------------------------------------------------------------
const JENIS_ICON_MAP: Record<string, LucideIcon> = {
  "Kepala SPPG": User,
  "Ahli Gizi": UserRound,
  "Staf Keuangan": UserCog,
  "Kepala Lapangan": User,
  "Kepala Juru Masak": ChefHat,
  "Juru Masak": ChefHat,
  "Persiapan (preparation)": UtensilsCrossed,
  Pemorsian: UtensilsCrossed,
  Pengemudi: Car,
  "Cuci Ompreng": Droplets,
  Kebersihan: Sparkles,
  Keamanan: Shield,
  Koordinator: User,
  Supervisor: ShieldCheck,
  Asisten: UserCog,
  "Petugas Lapangan": Truck,
  "Petugas Gudang": UtensilsCrossed,
  "Petugas Keamanan": Shield,
  "Petugas Kebersihan": Sparkles,
  Driver: Car,
  Koki: ChefHat,
  Helper: HandHelping,
  Administrasi: UserCog,
  Logistik: Truck,
  Teknis: UserCog,
  Medis: UserRound,
  Pendidikan: User,
  Sosial: ShieldCheck,
  Humas: User,
  IT: UserCog,
  Keuangan: UserCog,
  Operasional: User,
};

const ICON_FALLBACK: LucideIcon[] = [
  User,
  UserRound,
  UserCog,
  ShieldCheck,
  ChefHat,
  Truck,
  UtensilsCrossed,
  Car,
  Droplets,
  Sparkles,
  Shield,
  HandHelping,
];

function getIcon(type: string, idx: number): LucideIcon {
  return (
    JENIS_ICON_MAP[type] ?? ICON_FALLBACK[idx % ICON_FALLBACK.length] ?? User
  );
}

// ---------------------------------------------------------------------------
// Custom X-axis tick with icon + rotated label
// ---------------------------------------------------------------------------
type TickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  index?: number;
  chartData: { tipe_petugas: string; jumlah: number }[];
};

function CustomXAxisTick({
  x = 0,
  y = 0,
  payload,
  index = 0,
  chartData,
}: TickProps) {
  if (!payload) return null;
  const nx = Number(x);
  const ny = Number(y);
  const type = payload.value;
  const dataIdx = chartData.findIndex((r) => r.tipe_petugas === type);
  const effectiveIdx = dataIdx >= 0 ? dataIdx : index;
  const color = JENIS_WARNA[type] ?? getUniqueColor(effectiveIdx);
  const Icon = getIcon(type, effectiveIdx);

  return (
    <g transform={`translate(${nx},${ny + 10})`}>
      <foreignObject x={-35} y={0} width={70} height={70}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 60,
            padding: "4px",
          }}
        >
          <Icon
            size={18}
            color={color}
            style={{ marginBottom: 2, flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 8,
              color: "#374151",
              textAlign: "center",
              maxWidth: 65,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              display: "inline-block",
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              lineHeight: 1.2,
              fontWeight: 500,
            }}
          >
            {type}
          </span>
        </div>
      </foreignObject>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------
type TooltipPayload = { name: string; value: number; color: string };
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
          {entry.name}: {(entry.value ?? 0).toLocaleString("id-ID")}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PetugasBarChart() {
  const { user } = useAuth();
  const isKanwil = user?.role === "kanwil_djpb";
  const kdkanwil = isKanwil ? (user?.kdkanwil ?? undefined) : undefined;

  const [provinsi, setProvinsi] = useState<string | null>(null);
  const [tahun, setTahun] = useState("2025");
  const [autoSelected, setAutoSelected] = useState(false);

  const {
    data: provinsiData,
    isLoading: loadingProv,
    isError: isProvError,
    error: provError,
  } = usePetugasProvinsi(kdkanwil);

  const {
    data: petugasData,
    isLoading: loadingData,
    isError: isDataError,
    error: dataError,
  } = usePetugasData(provinsi, kdkanwil);

  const provOptions = provinsiData?.provinsi ?? [];

  // Auto-select default province
  useEffect(() => {
    if (autoSelected || loadingProv || provOptions.length === 0) return;
    if (isKanwil) {
      setProvinsi(provOptions[0] ?? null);
    } else {
      const dki = provOptions.find((p) => p === "DKI Jakarta");
      setProvinsi(dki ?? provOptions[0] ?? null);
    }
    setAutoSelected(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provOptions.length, loadingProv]);

  useEffect(() => {
    setAutoSelected(false);
    setProvinsi(null);
  }, [kdkanwil]);

  const rows = petugasData?.rows ?? [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (isProvError) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-medium text-destructive">
            Gagal memuat daftar provinsi.
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
        <div className="bg-muted/50 px-4 py-3 border-b border-border flex flex-wrap gap-3 items-end">
          {/* Province */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-foreground mb-1">
              Pilih Provinsi
              {isKanwil && kdkanwil && (
                <span className="text-muted-foreground font-normal ml-1">
                  (Wilayah Anda – {kdkanwil})
                </span>
              )}
            </label>
            <ShadSelect
              value={provinsi ?? ""}
              onValueChange={setProvinsi}
              disabled={loadingProv || (isKanwil && provOptions.length <= 1)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue
                  placeholder={
                    loadingProv ? "Memuat provinsi..." : "Pilih Provinsi"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {provOptions.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {p}
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
                {TAHUN_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadSelect>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="h-[320px]">
          {isDataError ? (
            <div className="flex flex-col items-center justify-center h-full bg-destructive/5 rounded border border-dashed border-destructive/40 p-6 gap-2">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-medium text-destructive">
                Gagal memuat data petugas.
              </p>
              <p className="text-xs text-muted-foreground break-all max-w-sm text-center">
                {dataError?.message ?? "Unknown error"}
              </p>
            </div>
          ) : loadingProv || (loadingData && !!provinsi) ? (
            <div className="flex flex-col gap-2 h-full justify-center">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !provinsi || rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded border border-dashed border-border p-6">
              <span className="text-5xl mb-2">👥</span>
              <h4 className="text-sm font-medium text-foreground mb-1">
                {isKanwil ? "Data Wilayah Anda" : "Pilih Provinsi"}
              </h4>
              <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                {isKanwil
                  ? `Data petugas untuk wilayah${kdkanwil ? ` ${kdkanwil}` : " Anda"}`
                  : "Gunakan dropdown untuk memilih provinsi"}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                margin={{ top: 20, right: 20, left: 10, bottom: 70 }}
                barCategoryGap={40}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="tipe_petugas"
                  tick={(props) => (
                    <CustomXAxisTick {...props} chartData={rows} />
                  )}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                  interval={0}
                  height={80}
                />
                <YAxis
                  type="number"
                  fontSize={11}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  allowDecimals={false}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => v.toLocaleString("id-ID")}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="jumlah"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                  name="Jumlah Petugas"
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="jumlah"
                    position="top"
                    style={{
                      fill: "hsl(var(--foreground))",
                      fontWeight: 500,
                      fontSize: 11,
                    }}
                    formatter={(v: unknown) =>
                      (v as number)?.toLocaleString("id-ID")
                    }
                  />
                  {rows.map((entry, idx) => {
                    const color =
                      JENIS_WARNA[entry.tipe_petugas] ?? getUniqueColor(idx);
                    return (
                      <Cell key={`${entry.tipe_petugas}-${idx}`} fill={color} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
