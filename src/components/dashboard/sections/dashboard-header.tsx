import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import kdkanwilData from "@/data/kdkanwil.json";

interface DashboardHeaderProps {
  selectedKanwil: string;
  onKanwilChange: (value: string) => void;
  selectedYear: string;
  onYearChange: (value: string) => void;
  lastRefreshText: string;
}

// Component to prevent hydration mismatch
function NoSSR({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : null;
}

export const DashboardHeader = ({
  selectedKanwil,
  onKanwilChange,
  selectedYear,
  onYearChange,
  lastRefreshText,
}: DashboardHeaderProps) => {
  const router = useRouter();

  // Generate year options (current year and previous 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    currentYear.toString(),
    (currentYear - 1).toString(),
    (currentYear - 2).toString(),
  ];

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard Utama K/L
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan cepat realisasi APBN untuk Kementerian/Lembaga.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Terakhir diperbarui: <NoSSR>{lastRefreshText}</NoSSR>
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tahun:</span>
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Kanwil:</span>
          <Select value={selectedKanwil} onValueChange={onKanwilChange}>
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
    </div>
  );
};
