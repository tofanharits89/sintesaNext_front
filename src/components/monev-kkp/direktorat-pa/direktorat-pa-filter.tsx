import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResetButton } from "@/components/ui/reset-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Building2 } from "lucide-react";

interface DirektoratPaFilterProps {
  contentType: string;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedKanwil: string;
  onKanwilChange: (value: string) => void;
  selectedKppn: string;
  setSelectedKppn: (value: string) => void;
  selectedPeriode: string;
  setSelectedPeriode: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  handleReset: () => void;
  activeKanwilList: { value: string; label: string }[];
  activeKppnList: { value: string; label: string }[];
  isLoadingKanwilRef: boolean;
  isLoadingKppnRef: boolean;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "sent", label: "Sudah Kirim" },
  { value: "not_sent", label: "Belum Kirim" },
];

export const DirektoratPaFilter = ({
  contentType,
  selectedYear,
  setSelectedYear,
  selectedKanwil,
  onKanwilChange,
  selectedKppn,
  setSelectedKppn,
  selectedPeriode,
  setSelectedPeriode,
  selectedStatus,
  setSelectedStatus,
  handleReset,
  activeKanwilList,
  activeKppnList,
  isLoadingKanwilRef,
  isLoadingKppnRef,
}: DirektoratPaFilterProps) => {
  const years = ["2026", "2025", "2024", "2023"];
  const periodes = [
    { value: "Q1", label: "Triwulan 1 (Jan - Mar)" },
    { value: "Q2", label: "Triwulan 2 (Jan - Jun)" },
    { value: "Q3", label: "Triwulan 3 (Jan - Sep)" },
    { value: "Q4", label: "Triwulan 4 (Jan - Des)" },
  ];

  const isMonitoring =
    contentType === "monitoring-kppn" || contentType === "monitoring-kanwil";
  const showKanwil =
    contentType === "ringkasan-kanwil" ||
    contentType === "monitoring-kanwil" ||
    contentType === "monitoring-kppn" ||
    contentType === "ringkasan-kppn";
  const showKppn =
    contentType === "ringkasan-kppn" || contentType === "monitoring-kppn";

  // Compute grid cols for monitoring: always Tahun + Kanwil + (KPPN?) + Status + Periode
  // monitoring-kanwil: 4 cols (Tahun, Kanwil, Status, Periode)
  // monitoring-kppn:   5 cols (Tahun, Kanwil, KPPN, Status, Periode)
  const monitoringCols = showKppn ? "md:grid-cols-5" : "md:grid-cols-4";

  // Ringkasan grid cols (no Status)
  const ringkasanCols = showKppn ? "md:grid-cols-4" : "md:grid-cols-3";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="shrink-0">Filter Data</CardTitle>
          <div className="hidden md:flex items-center gap-x-2 flex-1 text-sm px-3 py-1.5">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium">Direktorat Pelaksanaan Anggaran</span>
            <span className="text-muted-foreground">— Menampilkan data agregat dari seluruh Kanwil dan KPPN</span>
          </div>
          <ResetButton onReset={handleReset} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex md:hidden mb-4 p-3 bg-muted rounded-lg items-center gap-x-3 gap-y-1 flex-wrap text-sm">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium">Direktorat Pelaksanaan Anggaran</span>
          <span className="text-muted-foreground text-xs">Menampilkan data agregat dari seluruh Kanwil dan KPPN</span>
        </div>

        <div className={`grid grid-cols-1 ${isMonitoring ? monitoringCols : ringkasanCols} gap-4`}>
          {/* Tahun */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tahun</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kanwil */}
          {showKanwil && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Kanwil</label>
              <Select value={selectedKanwil} onValueChange={onKanwilChange}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingKanwilRef && activeKanwilList.length <= 1
                        ? "Memuat Kanwil..."
                        : "Pilih Kanwil"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {activeKanwilList.map((kanwil) => (
                    <SelectItem key={kanwil.value} value={kanwil.value}>
                      {kanwil.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* KPPN */}
          {showKppn && (
            <div className="space-y-2">
              <label className="text-sm font-medium">KPPN</label>
              <SearchableSelect
                options={activeKppnList}
                value={selectedKppn}
                onValueChange={setSelectedKppn}
                placeholder={
                  isLoadingKppnRef && activeKppnList.length <= 1
                    ? "Memuat KPPN..."
                    : "Pilih KPPN"
                }
                searchPlaceholder="Cari kode atau nama KPPN..."
                emptyMessage="KPPN tidak ditemukan."
              />
            </div>
          )}

          {/* Status — only for monitoring tabs */}
          {isMonitoring && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Periode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Periode (Akumulatif)</label>
            <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {periodes.map((periode) => (
                  <SelectItem key={periode.value} value={periode.value}>{periode.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
