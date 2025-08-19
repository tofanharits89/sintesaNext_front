import { BarChartComponent } from "@/components/ui/bar-chart";
import { LineChartComponent } from "@/components/ui/line-chart";
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

// Data for Tren Penerimaan vs Belanja line chart
const trenPenerimaanBelanja = [
  { name: "Jan", penerimaan: 95, belanja: 110 },
  { name: "Feb", penerimaan: 105, belanja: 125 },
  { name: "Mar", penerimaan: 120, belanja: 140 },
  { name: "Apr", penerimaan: 135, belanja: 155 },
  { name: "Mei", penerimaan: 150, belanja: 170 },
  { name: "Jun", penerimaan: 165, belanja: 185 },
  { name: "Jul", penerimaan: 180, belanja: 200 },
  { name: "Agu", penerimaan: 195, belanja: 210 },
  { name: "Sep", penerimaan: 210, belanja: 225 },
  { name: "Okt", penerimaan: 225, belanja: 240 },
  { name: "Nov", penerimaan: 240, belanja: 250 },
  { name: "Des", penerimaan: 255, belanja: 260 },
];

// Data for Proyeksi Deficit line chart
const proyeksiDeficit = [
  { name: "Jan", aktual: -15, proyeksi: -12 },
  { name: "Feb", aktual: -20, proyeksi: -18 },
  { name: "Mar", aktual: -20, proyeksi: -22 },
  { name: "Apr", aktual: -20, proyeksi: -25 },
  { name: "Mei", aktual: -20, proyeksi: -28 },
  { name: "Jun", aktual: -20, proyeksi: -30 },
  { name: "Jul", aktual: null, proyeksi: -32 },
  { name: "Agu", aktual: null, proyeksi: -15 },
  { name: "Sep", aktual: null, proyeksi: -10 },
  { name: "Okt", aktual: null, proyeksi: -8 },
  { name: "Nov", aktual: null, proyeksi: -5 },
  { name: "Des", aktual: null, proyeksi: -2 },
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

      {/* Third Row: 2 Cards with Line Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChartComponent
          data={trenPenerimaanBelanja}
          title="Tren Penerimaan vs Belanja"
          description="Perbandingan bulanan 2025 (Triliun Rp)"
          lines={[
            { dataKey: "penerimaan", stroke: "#10b981", name: "Penerimaan" },
            { dataKey: "belanja", stroke: "#ef4444", name: "Belanja" }
          ]}
          height={280}
        />
        <LineChartComponent
          data={proyeksiDeficit}
          title="Proyeksi Defisit/Surplus"
          description="Estimasi hingga akhir tahun (Triliun Rp)"
          lines={[
            { dataKey: "aktual", stroke: "#3b82f6", name: "Aktual" },
            { dataKey: "proyeksi", stroke: "#f59e0b", name: "Proyeksi" }
          ]}
          height={280}
        />
      </div>
    </div>
  );
}

