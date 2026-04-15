import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResetButton } from "@/components/ui/reset-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface KanwilFilterProps {
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedKppn: string;
  setSelectedKppn: (value: string) => void;
  selectedPeriode: string;
  setSelectedPeriode: (value: string) => void;
  kppnList: { value: string; label: string }[];
  handleReset: () => void;
}

export const KanwilFilter = ({
  selectedYear,
  setSelectedYear,
  selectedKppn,
  setSelectedKppn,
  selectedPeriode,
  setSelectedPeriode,
  kppnList,
  handleReset,
}: KanwilFilterProps) => {
  const { user } = useAuth();
  const years = ["2026", "2025", "2024", "2023"];
  const periodes = [
    { value: "Q1", label: "Triwulan 1 (Jan - Mar)" },
    { value: "Q2", label: "Triwulan 2 (Jan - Jun)" },
    { value: "Q3", label: "Triwulan 3 (Jan - Sep)" },
    { value: "Q4", label: "Triwulan 4 (Jan - Des)" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="shrink-0">Filter Data</CardTitle>
          {/* Kanwil info inline — desktop only */}
          <div className="hidden md:flex items-center gap-x-5 flex-1 text-sm px-3 py-1.5">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Kode Kanwil:</span>
              <span className="font-medium">{user?.kdkanwil || "-"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Nama Kanwil:</span>
              <span className="font-medium">{user?.nmkanwil || user?.kdkanwil || "-"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="outline">{user?.role || "-"}</Badge>
            </div>
          </div>
          <ResetButton onReset={handleReset} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Kanwil Info — mobile only (on desktop it lives in the CardHeader) */}
        <div className="flex md:hidden mb-4 p-3 bg-muted rounded-lg items-center gap-x-5 gap-y-1 flex-wrap text-sm">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Kode Kanwil:</span>
            <span className="font-medium">{user?.kdkanwil || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Nama Kanwil:</span>
            <span className="font-medium">{user?.nmkanwil || user?.kdkanwil || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Role:</span>
            <Badge variant="outline">{user?.role || "-"}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tahun</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Tahun" />
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
            <label className="text-sm font-medium">KPPN</label>
            <SearchableSelect
              options={kppnList}
              value={selectedKppn}
              onValueChange={setSelectedKppn}
              placeholder="Pilih KPPN"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Periode (Akumulatif)</label>
            <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodes.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
