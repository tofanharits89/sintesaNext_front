"use client";

import { useEffect, useRef, useState } from "react";
import BelanjaNegaraWeekly from "@/components/weekly/belanja-negara";
import PengeluaranAkun, { type PengeluaranAkunHandle } from "@/components/weekly/pengeluaran-akun";
import PengeluaranFungsi, { type PengeluaranFungsiHandle } from "@/components/weekly/pengeluaran-fungsi";
import RealisasiKlWeekly, { type RealisasiKlHandle } from "@/components/weekly/realisasi-kl";
import ResumeTkd, { type ResumeTkdHandle } from "@/components/weekly/resume-tkd";
import ProgresMbg, { type ProgresMbgHandle } from "@/components/weekly/progres-mbg";
import SpasialMbg, { type SpasialMbgHandle } from "@/components/weekly/progres-spasial-mbg";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsContents,
} from "@/components/animate-ui/components/animate/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FileSpreadsheet } from "lucide-react";
import { DateRange } from "react-day-picker";
import { http } from "@/lib/api/httpClient";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtT(v: number | null | undefined): string {
  if (v == null) return "-";
  return (v / 1_000_000_000_000).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function pct(num: number, den: number): string {
  if (!den) return "-";
  return ((num / den) * 100).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + "%";
}

/** Get the last working day before a given date */
function getLastWorkingDay(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - 1);
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

/** 
 * Default for the date range picker:
 * Monday of this week to Today (if Mon-Fri)
 * OR Monday to Friday of the week that just ended (if Sat-Sun)
 */
function getDefaultRange(): { from: Date; to: Date } {
  const to = new Date();
  const day = to.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat

  if (day === 0) { // Sunday -> Friday
    to.setDate(to.getDate() - 2);
  } else if (day === 6) { // Saturday -> Friday
    to.setDate(to.getDate() - 1);
  }

  const from = new Date(to);
  const toDay = from.getDay(); // Now guaranteed 1-5
  from.setDate(from.getDate() - (toDay - 1));

  return { from, to };
}

// ─── Tab Item Config ──────────────────────────────────────────────────────────

interface TabItemConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "blue" | "green" | "amber" | "red";
  component: React.ReactNode;
}

// Component to prevent hydration mismatch
function NoSSR({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  return isClient ? <>{children}</> : null;
}

// ─── Main Landing ─────────────────────────────────────────────────────────────

export default function WeeklyLanding() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // Get default range
  const defaultRange = getDefaultRange();

  // Date range state for belanja-negara
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: defaultRange.from,
    to: defaultRange.to,
  });
  const [isLoadingBelanja, setIsLoadingBelanja] = useState(false);

  const handleApplyBelanja = () => {
    setIsLoadingBelanja(true);
    // Simulate loading
    setTimeout(() => setIsLoadingBelanja(false), 500);
  };

  // Date range state for pengeluaran-akun
  const [dateRangeAkun, setDateRangeAkun] = useState<DateRange | undefined>({
    from: defaultRange.from,
    to: defaultRange.to,
  });
  const [isLoadingAkun, setIsLoadingAkun] = useState(false);
  const pengeluaranAkunRef = useRef<PengeluaranAkunHandle>(null);

  const toLocalISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleApplyAkun = async () => {
    setIsLoadingAkun(true);
    await pengeluaranAkunRef.current?.load();
    setIsLoadingAkun(false);
  };

  // Date state for pengeluaran-fungsi
  const [dateRangeFungsi, setDateRangeFungsi] = useState<DateRange | undefined>({
    from: defaultRange.from,
    to: defaultRange.to,
  });
  const [isLoadingFungsi, setIsLoadingFungsi] = useState(false);
  const pengeluaranFungsiRef = useRef<PengeluaranFungsiHandle>(null);

  const handleApplyFungsi = async () => {
    setIsLoadingFungsi(true);
    await pengeluaranFungsiRef.current?.load();
    setIsLoadingFungsi(false);
  };

  // Date range state for realisasi-kl
  const [dateRangeKl, setDateRangeKl] = useState<DateRange | undefined>({
    from: defaultRange.from,
    to: defaultRange.to,
  });
  const [isLoadingKl, setIsLoadingKl] = useState(false);
  const realisasiKlRef = useRef<RealisasiKlHandle>(null);

  const handleApplyKl = async () => {
    setIsLoadingKl(true);
    await realisasiKlRef.current?.load();
    setIsLoadingKl(false);
  };

  // Date range state for resume-tkd
  const [dateRangeTkd, setDateRangeTkd] = useState<DateRange | undefined>({
    from: defaultRange.from,
    to: defaultRange.to,
  });
  const [isLoadingTkd, setIsLoadingTkd] = useState(false);
  const resumeTkdRef = useRef<ResumeTkdHandle>(null);

  const handleApplyTkd = async () => {
    setIsLoadingTkd(true);
    await resumeTkdRef.current?.load();
    setIsLoadingTkd(false);
  };

  // Date range state for progres-mbg
  const [dateRangeMbg, setDateRangeMbg] = useState<DateRange | undefined>({
    from: defaultRange.from,
    to: defaultRange.to,
  });
  const [isLoadingMbg, setIsLoadingMbg] = useState(false);
  const progresMbgRef = useRef<ProgresMbgHandle>(null);

  const handleApplyMbg = async () => {
    setIsLoadingMbg(true);
    await progresMbgRef.current?.load();
    setIsLoadingMbg(false);
  };

  // Date range state for spasial-mbg
  const [dateRangeSpasial, setDateRangeSpasial] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1), // Jan 1st current year
    to: new Date(),
  });
  const [isLoadingSpasial, setIsLoadingSpasial] = useState(false);
  const spasialMbgRef = useRef<SpasialMbgHandle>(null);

  const handleApplySpasial = async () => {
    setIsLoadingSpasial(true);
    await spasialMbgRef.current?.load();
    setIsLoadingSpasial(false);
  };

  const tabItems: TabItemConfig[] = [
    {
      id: "belanja-negara",
      title: "Belanja Negara",
      badge: "Live",
      badgeColor: "blue",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
      ),
      component: <BelanjaNegaraWeekly />,
    },
    {
      id: "pengeluaran-akun",
      title: "Pengeluaran Akun (BKPK)",
      subtitle: "Komposisi jenis belanja & top-10 realisasi akun",
      badge: "Top-10",
      badgeColor: "green",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      ),
      component: null, // rendered separately below with ref
    },
    {
      id: "pengeluaran-fungsi",
      title: "Pengeluaran Fungsi",
      subtitle: "Komposisi Pagu Fungsi & Realisasi K/L",
      badge: "Fungsi",
      badgeColor: "amber",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      ),
      component: null, // rendered separately below with ref
    },
    {
      id: "realisasi-kl",
      title: "Belanja K/L",
      subtitle: "Realisasi 15 K/L dengan Pagu APBN Terbesar",
      badge: "15 K/L",
      badgeColor: "blue",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <path d="M21 12H3" />
          <path d="M12 3v18" />
        </svg>
      ),
      component: null, // rendered separately below with ref
    },
    {
      id: "resume-tkd",
      title: "Resume TKD",
      subtitle: "Infografis & Komposisi Penyaluran TKD YoY",
      badge: "TKD",
      badgeColor: "blue",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      component: null, // rendered separately below with ref
    },
    {
      id: "progres-mbg",
      title: "Progress MBG",
      subtitle: "Progres Penyaluran Program MBG",
      badge: "MBG",
      badgeColor: "blue",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      component: null, // rendered separately below with ref
    },
    {
      id: "spasial-mbg",
      title: "Spasial MBG",
      subtitle: "Progres Realisasi MBG per Provinsi",
      badge: "Prov",
      badgeColor: "green",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
      component: null, // rendered separately below with ref
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Weekly
          </h1>
          <p className="text-sm text-muted-foreground">
            Rekap mingguan realisasi belanja negara & pengendalian anggaran K/L
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Terakhir diperbarui:{" "}
            <NoSSR>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </NoSSR>
          </p>
        </div>
      </div>

      {/* Tabs sections */}
      <Tabs defaultValue="belanja-negara" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 md:gap-0">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="h-12 md:h-full px-2 sm:px-3 md:px-4 py-0 text-xs sm:text-sm flex items-center justify-center whitespace-nowrap gap-2"
              >
                {item.icon}
                <span className="font-medium">{item.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContents>
          {tabItems.map((item) => (
            <TabsContent key={item.id} value={item.id} className="space-y-4">
              {/* Filter Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filter Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.id === "belanja-negara" ? (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Periode Minggu Ini</span>
                        </div>
                        <DateRangePicker
                          date={dateRange}
                          onDateChange={setDateRange}
                          disabledDates={{ dayOfWeek: [0, 6] }}
                          className="w-72"
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={handleApplyBelanja}
                        disabled={isLoadingBelanja}
                        className="h-9 px-4"
                      >
                        {isLoadingBelanja ? (
                          <>
                            <span className="bn-spinner" />
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Tampilkan Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : item.id === "pengeluaran-akun" ? (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Periode Minggu Ini</span>
                        </div>
                        <DateRangePicker
                          date={dateRangeAkun}
                          onDateChange={setDateRangeAkun}
                          disabledDates={{ dayOfWeek: [0, 6] }}
                          className="w-72"
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={handleApplyAkun}
                        disabled={isLoadingAkun}
                        className="h-9 px-4"
                      >
                        {isLoadingAkun ? (
                          <>
                            <span className="bn-spinner" />
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Tampilkan Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : item.id === "pengeluaran-fungsi" ? (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Tanggal s.d.</span>
                        </div>
                        <DateRangePicker
                          date={dateRangeFungsi}
                          onDateChange={setDateRangeFungsi}
                          disabledDates={{ dayOfWeek: [0, 6] }}
                          className="w-72"
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={handleApplyFungsi}
                        disabled={isLoadingFungsi}
                        className="h-9 px-4"
                      >
                        {isLoadingFungsi ? (
                          <>
                            <span className="bn-spinner" />
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Tampilkan Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : item.id === "realisasi-kl" ? (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Periode Minggu Ini</span>
                        </div>
                        <DateRangePicker
                          date={dateRangeKl}
                          onDateChange={setDateRangeKl}
                          disabledDates={{ dayOfWeek: [0, 6] }}
                          className="w-72"
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={handleApplyKl}
                        disabled={isLoadingKl}
                        className="h-9 px-4"
                      >
                        {isLoadingKl ? (
                          <>
                            <span className="bn-spinner" />
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Tampilkan Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : item.id === "resume-tkd" ? (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Periode Minggu Ini</span>
                        </div>
                        <DateRangePicker
                          date={dateRangeTkd}
                          onDateChange={setDateRangeTkd}
                          disabledDates={{ dayOfWeek: [0, 6] }}
                          className="w-72"
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={handleApplyTkd}
                        disabled={isLoadingTkd}
                        className="h-9 px-4"
                      >
                        {isLoadingTkd ? (
                          <>
                            <span className="bn-spinner" />
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Tampilkan Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : item.id === "progres-mbg" ? (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Periode Minggu Ini</span>
                        </div>
                        <DateRangePicker
                          date={dateRangeMbg}
                          onDateChange={setDateRangeMbg}
                          disabledDates={{ dayOfWeek: [0, 6] }}
                          className="w-72"
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={handleApplyMbg}
                        disabled={isLoadingMbg}
                        className="h-9 px-4"
                      >
                        {isLoadingMbg ? (
                          <>
                            <span className="bn-spinner" />
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Tampilkan Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : item.id === "spasial-mbg" ? (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Filter Tanggal SP2D</span>
                        </div>
                        <DateRangePicker
                          date={dateRangeSpasial}
                          onDateChange={setDateRangeSpasial}
                          className="w-72"
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={handleApplySpasial}
                        disabled={isLoadingSpasial}
                        className="h-9 px-4"
                      >
                        {isLoadingSpasial ? (
                          <>
                            <span className="bn-spinner" />
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Tampilkan Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {item.subtitle}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Table/Content Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>{item.title}</CardTitle>
                    {item.id === "belanja-negara" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { }}
                        disabled={isLoadingBelanja}
                        className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                        <span className="text-sm text-white">Unduh Data Excel</span>
                      </Button>
                    )}
                    {item.id === "pengeluaran-akun" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pengeluaranAkunRef.current?.exportExcel()}
                        className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                        <span className="text-sm text-white">Unduh Data Excel</span>
                      </Button>
                    )}
                    {item.id === "pengeluaran-fungsi" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pengeluaranFungsiRef.current?.exportExcel()}
                        className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                        <span className="text-sm text-white">Unduh Data Excel</span>
                      </Button>
                    )}
                    {item.id === "realisasi-kl" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => realisasiKlRef.current?.exportExcel()}
                        className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                        <span className="text-sm text-white">Unduh Data Excel</span>
                      </Button>
                    )}
                    {item.id === "resume-tkd" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resumeTkdRef.current?.exportExcel()}
                        className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                        <span className="text-sm text-white">Unduh Data Excel</span>
                      </Button>
                    )}
                    {item.id === "progres-mbg" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => progresMbgRef.current?.exportExcel()}
                        className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                        <span className="text-sm text-white">Unduh Data Excel</span>
                      </Button>
                    )}
                    {item.id === "spasial-mbg" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => spasialMbgRef.current?.exportExcel()}
                        className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                        <span className="text-sm text-white">Unduh Data Excel</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {item.id === "belanja-negara" ? (
                    <BelanjaNegaraWeekly
                      {...(dateRange !== undefined ? { dateRange } : {})}
                      onDateChange={setDateRange}
                      onApply={handleApplyBelanja}
                      isLoading={isLoadingBelanja}
                      onExport={() => { }}
                    />
                  ) : item.id === "pengeluaran-akun" ? (
                    <PengeluaranAkun
                      ref={pengeluaranAkunRef}
                      {...(dateRangeAkun?.from ? { tglAwal: toLocalISO(dateRangeAkun.from) } : {})}
                      {...(dateRangeAkun?.to ? { tglAkhir: toLocalISO(dateRangeAkun.to) } : {})}
                    />
                  ) : item.id === "pengeluaran-fungsi" ? (
                    <PengeluaranFungsi
                      ref={pengeluaranFungsiRef}
                      {...(dateRangeFungsi?.to ? { tglAkhir: toLocalISO(dateRangeFungsi.to) } : {})}
                    />
                  ) : item.id === "realisasi-kl" ? (
                    <RealisasiKlWeekly
                      ref={realisasiKlRef}
                      {...(dateRangeKl?.from ? { tglAwal: toLocalISO(dateRangeKl.from) } : {})}
                      {...(dateRangeKl?.to ? { tglAkhir: toLocalISO(dateRangeKl.to) } : {})}
                    />
                  ) : item.id === "resume-tkd" ? (
                    <ResumeTkd
                      ref={resumeTkdRef}
                      {...(dateRangeTkd?.from ? { tglAwal: toLocalISO(dateRangeTkd.from) } : {})}
                      {...(dateRangeTkd?.to ? { tglAkhir: toLocalISO(dateRangeTkd.to) } : {})}
                    />
                  ) : item.id === "progres-mbg" ? (
                    <ProgresMbg
                      ref={progresMbgRef}
                      {...(dateRangeMbg?.from ? { tglAwal: toLocalISO(dateRangeMbg.from) } : {})}
                      {...(dateRangeMbg?.to ? { tglAkhir: toLocalISO(dateRangeMbg.to) } : {})}
                    />
                  ) : item.id === "spasial-mbg" ? (
                    <SpasialMbg
                      ref={spasialMbgRef}
                      {...(dateRangeSpasial?.from ? { tglAwal: toLocalISO(dateRangeSpasial.from) } : {})}
                      {...(dateRangeSpasial?.to ? { tglAkhir: toLocalISO(dateRangeSpasial.to) } : {})}
                    />
                  ) : (
                    item.component
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </TabsContents>
      </Tabs>
    </div>
  );
}
