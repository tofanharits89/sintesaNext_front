"use client";

import { useState, useEffect } from "react";
import BelanjaNegaraWeekly from "@/components/weekly/belanja-negara";
import PengeluaranAkun from "@/components/weekly/pengeluaran-akun";
import PengeluaranFungsi from "@/components/weekly/pengeluaran-fungsi";
import RealisasiKlWeekly from "@/components/weekly/realisasi-kl";
import ResumeTkd from "@/components/weekly/resume-tkd";
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

// ─── Accordion primitive ──────────────────────────────────────────────────────

interface AccordionItemProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "blue" | "green" | "amber" | "red";
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionItem({
  id,
  title,
  subtitle,
  icon,
  badge,
  badgeColor = "blue",
  defaultOpen = false,
  children,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`wl-accordion-item${open ? " wl-accordion-open" : ""}`}>
      <button
        id={`wl-acc-btn-${id}`}
        className="wl-accordion-trigger"
        aria-expanded={open}
        aria-controls={`wl-acc-panel-${id}`}
        onClick={() => setOpen((p) => !p)}
      >
        <span className="wl-accordion-trigger-left">
          <span className="wl-accordion-icon">{icon}</span>
          <span className="wl-accordion-label-group">
            <span className="wl-accordion-title">{title}</span>
            {subtitle && <span className="wl-accordion-subtitle">{subtitle}</span>}
          </span>
        </span>
        <span className="wl-accordion-trigger-right">
          {badge && (
            <span className={`wl-acc-badge wl-acc-badge-${badgeColor}`}>{badge}</span>
          )}
          <svg
            className="wl-accordion-chevron"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div
        id={`wl-acc-panel-${id}`}
        role="region"
        aria-labelledby={`wl-acc-btn-${id}`}
        className="wl-accordion-panel"
      >
        <div className="wl-accordion-panel-inner">{children}</div>
      </div>
    </div>
  );
}

// Component to prevent hydration mismatch
function NoSSR({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  return isClient ? <>{children}</> : null;
}

// ─── Main Landing ─────────────────────────────────────────────────────────────

export default function WeeklyLanding() {
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

      {/* Accordion sections */}
      <div className="wl-accordion-list">
        {/* 1 — Belanja Negara */}
        <AccordionItem
          id="belanja-negara"
          defaultOpen
          title="Belanja Negara"
          subtitle="Realisasi mingguan berjenjang (KL · Non-KL · TKD)"
          badge="Live"
          badgeColor="blue"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          }
        >
          <BelanjaNegaraWeekly />
        </AccordionItem>


        {/* 3 — Pengeluaran Akun */}
        <AccordionItem
          id="pengeluaran-akun"
          title="Pengeluaran Akun (BKPK)"
          subtitle="Komposisi jenis belanja & top-10 realisasi akun"
          badge="Top-10"
          badgeColor="green"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          }
        >
          <PengeluaranAkun />
        </AccordionItem>

        {/* 4 — Pengeluaran Fungsi */}
        <AccordionItem
          id="pengeluaran-fungsi"
          title="Pengeluaran Fungsi"
          subtitle="Komposisi Pagu Fungsi & Realisasi K/L"
          badge="Fungsi"
          badgeColor="amber"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          }
        >
          <PengeluaranFungsi />
        </AccordionItem>

        {/* 5 — Realisasi K/L */}
        <AccordionItem
          id="realisasi-kl"
          title="Belanja K/L"
          subtitle="Realisasi 15 K/L dengan Pagu APBN Terbesar"
          badge="15 K/L"
          badgeColor="blue"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M21 12H3" />
              <path d="M12 3v18" />
            </svg>
          }
        >
          <RealisasiKlWeekly />
        </AccordionItem>

        {/* 6 — Resume TKD */}
        <AccordionItem
          id="resume-tkd"
          title="Resume TKD"
          subtitle="Infografis & Komposisi Penyaluran TKD YoY"
          badge="TKD"
          badgeColor="blue"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        >
          <ResumeTkd />
        </AccordionItem>
      </div>
    </div>
  );
}
