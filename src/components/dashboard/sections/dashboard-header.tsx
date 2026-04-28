import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import kdkanwilData from "@/data/kdkanwil.json";

interface DashboardHeaderProps {
  selectedKanwil: string;
  onKanwilChange: (value: string) => void;
  selectedYear: string;
  onYearChange: (value: string) => void;
  lastRefreshText: string;
  onRefresh?: (() => void | Promise<void>) | undefined;
  isRefreshing?: boolean | undefined;
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
  onRefresh,
  isRefreshing,
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
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
      <div className="w-full md:w-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm text-muted-foreground">Tahun:</span>
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="w-full sm:w-[100px]">
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
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm text-muted-foreground">Kanwil:</span>
          <Select value={selectedKanwil} onValueChange={onKanwilChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
        {onRefresh && (
          <Button
            id="dashboard-refresh-btn"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh data (invalidate cache)"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}
      </div>
    </div>
  );
};

