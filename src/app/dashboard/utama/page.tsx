import { BarChartComponent } from "@/components/ui/bar-chart";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import kdkanwilData from "@/data/kdkanwil.json";

// Sample data for the bar charts
const realisasiApbnData = [
  { name: "Jan", target: 120, realisasi: 110 },
  { name: "Feb", target: 140, realisasi: 135 },
  { name: "Mar", target: 160, realisasi: 155 },
  { name: "Apr", target: 180, realisasi: 170 },
  { name: "Mei", target: 200, realisasi: 195 },
  { name: "Jun", target: 220, realisasi: 210 },
];

const klTopData = [
  { name: "Kemendikbud", value: 85 },
  { name: "Kemenkes", value: 78 },
  { name: "Kemenhub", value: 72 },
  { name: "Kemenag", value: 68 },
  { name: "Kemendagri", value: 65 },
];

const fungsiData = [
  { name: "Pendidikan", value: 320 },
  { name: "Kesehatan", value: 280 },
  { name: "Infrastruktur", value: 240 },
  { name: "Pertahanan", value: 180 },
  { name: "Sosial", value: 160 },
  { name: "Ekonomi", value: 140 },
];

export default function DashboardUtamaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Utama</h1>
          <p className="text-sm text-muted-foreground">Ringkasan cepat realisasi APBN dan indikator makro.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter Kanwil:</span>
          <Select defaultValue="semua">
            <SelectTrigger className="w-[180px]">
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
      </div>

      {/* First Row: 6 Compact Quick Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            +5.2%
          </Badge>
          <p className="text-xs text-muted-foreground">Penerimaan Negara</p>
          <p className="mt-1 text-lg font-semibold">Rp 1.250 T</p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            +3.8%
          </Badge>
          <p className="text-xs text-muted-foreground">Belanja Negara</p>
          <p className="mt-1 text-lg font-semibold">Rp 1.100 T</p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            +12.5%
          </Badge>
          <p className="text-xs text-muted-foreground">Saldo Anggaran</p>
          <p className="mt-1 text-lg font-semibold">Rp 150 T</p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            +0.3%
          </Badge>
          <p className="text-xs text-muted-foreground">Inflasi (YoY)</p>
          <p className="mt-1 text-lg font-semibold">2.8%</p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            +0.2%
          </Badge>
          <p className="text-xs text-muted-foreground">Pertumbuhan PDB</p>
          <p className="mt-1 text-lg font-semibold">5.1%</p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            -0.5%
          </Badge>
          <p className="text-xs text-muted-foreground">Nilai Tukar</p>
          <p className="mt-1 text-lg font-semibold">Rp 15.850</p>
        </div>
      </div>

      {/* Second Row: 3 Cards with Bar Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <BarChartComponent
          data={realisasiApbnData.map(item => ({ name: item.name, value: item.realisasi }))}
          title="Realisasi APBN"
          description="Realisasi bulanan 2025 (Triliun Rp)"
          color="#3b82f6"
          height={250}
        />
        <BarChartComponent
          data={klTopData}
          title="Top 5 K/L"
          description="Realisasi tertinggi (%)"
          color="#10b981"
          height={250}
        />
        <BarChartComponent
          data={fungsiData}
          title="Realisasi per Fungsi"
          description="Alokasi anggaran (Triliun Rp)"
          color="#f59e0b"
          height={250}
        />
      </div>

      {/* Third Row: 2 Cards with Line Chart Placeholders */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium">Tren Penerimaan vs Belanja</h3>
              <p className="text-xs text-muted-foreground">Perbandingan bulanan 2025</p>
            </div>
            <span className="text-xs text-muted-foreground">2025</span>
          </div>
          <div className="h-64 rounded bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm">Line Chart Placeholder</p>
              <p className="text-xs">Tren Penerimaan vs Belanja</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium">Proyeksi Defisit/Surplus</h3>
              <p className="text-xs text-muted-foreground">Estimasi hingga akhir tahun</p>
            </div>
            <span className="text-xs text-muted-foreground">2025</span>
          </div>
          <div className="h-64 rounded bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-sm">Line Chart Placeholder</p>
              <p className="text-xs">Proyeksi Defisit/Surplus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

