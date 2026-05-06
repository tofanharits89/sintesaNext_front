"use client";

import { useState, useEffect } from "react";
import BelanjaNegaraWeekly from "@/components/weekly/belanja-negara";
import PengeluaranAkun from "@/components/weekly/pengeluaran-akun";
import PengeluaranFungsi from "@/components/weekly/pengeluaran-fungsi";
import RealisasiKlWeekly from "@/components/weekly/realisasi-kl";
import ResumeTkd from "@/components/weekly/resume-tkd";
import { http } from "@/lib/api/httpClient";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PengendalianBelanjaRow {
  kode_ba: string;
  nama_ba: string;
  pagu_dipa: number;
  blokir: number;
  pagu_dipa_efektif: number;
  realisasi_basis_kas: number;
  pagu_kontrak: number;
  real_kontrak: number;
  outs_kontrak: number;
  outs_uptup: number;
  total_kas_dan_outstanding: number;
  belum_sp2d: number;
  nilai_spp_spm: number;
  sisa_pagu_efektif: number;
}

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

// ─── Pengendalian Belanja sub-panel ───────────────────────────────────────────

const COLS = [
  { key: "kode_ba",               label: "Kode BA" },
  { key: "nama_ba",               label: "Nama K/L",        wide: true },
  { key: "pagu_dipa",             label: "Pagu DIPA" },
  { key: "blokir",                label: "Blokir" },
  { key: "pagu_dipa_efektif",     label: "Pagu Efektif" },
  { key: "realisasi_basis_kas",   label: "Realisasi" },
  { key: "pagu_kontrak",          label: "Pagu Kontrak" },
  { key: "real_kontrak",          label: "Real Kontrak" },
  { key: "outs_kontrak",          label: "Outs Kontrak" },
  { key: "outs_uptup",            label: "Outs UP/TUP" },
  { key: "total_kas_dan_outstanding", label: "Total Kas+Outs" },
  { key: "belum_sp2d",            label: "Belum SP2D" },
  { key: "nilai_spp_spm",         label: "Nilai SPP/SPM" },
  { key: "sisa_pagu_efektif",     label: "Sisa Pagu Efektif" },
] as const;

type ColKey = (typeof COLS)[number]["key"];

function PengendalianBelanjaPanel() {
  const [rows, setRows] = useState<PengendalianBelanjaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [exclude999, setExclude999] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tahun });
      if (exclude999) params.set("exclude999", "true");
      const res = await http.get(`/api/v1/pengendalian-belanja?${params}`);
      setRows(res.data?.result ?? []);
      setLoaded(true);
    } catch (err: any) {
      toast.error(err?.message || "Gagal memuat data pengendalian belanja");
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: new Date().getFullYear() - 2022 }, (_, i) =>
    String(new Date().getFullYear() - i)
  );

  return (
    <div className="wl-pb-panel">
      {/* Controls */}
      <div className="wl-pb-controls">
        <div className="wl-pb-ctrl-group">
          <label className="wl-pb-ctrl-label" htmlFor="pb-tahun">Tahun</label>
          <select
            id="pb-tahun"
            className="wl-pb-select"
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <label className="wl-pb-checkbox-label">
          <input
            type="checkbox"
            className="wl-pb-checkbox"
            checked={exclude999}
            onChange={(e) => setExclude999(e.target.checked)}
          />
          Exclude Non-K/L (999)
        </label>

        <button
          className="wl-pb-fetch-btn"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? (
            <><span className="bn-spinner" /> Memuat...</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              Tampilkan
            </>
          )}
        </button>
      </div>

      {/* Table */}
      {!loaded && !loading && (
        <div className="wl-pb-empty-hint">Klik "Tampilkan" untuk memuat data.</div>
      )}

      {loading && (
        <div className="bn-loading">
          <span className="bn-spinner bn-spinner-lg" />
          <span>Memuat data pengendalian belanja...</span>
        </div>
      )}

      {loaded && !loading && (
        <div className="wl-pb-table-wrap">
          <table className="wl-pb-table">
            <thead>
              <tr>
                <th className="wl-pb-th wl-pb-th-num">No</th>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    className={`wl-pb-th${(c as any).wide ? " wl-pb-th-wide" : " wl-pb-th-num"}`}
                  >
                    {c.label}
                  </th>
                ))}
                <th className="wl-pb-th wl-pb-th-num">% Real/Pagu</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length + 2} className="wl-pb-empty">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.kode_ba} className="wl-pb-tr">
                    <td className="wl-pb-td wl-pb-td-num">{i + 1}</td>
                    <td className="wl-pb-td wl-pb-td-num">{r.kode_ba}</td>
                    <td className="wl-pb-td wl-pb-td-name">{r.nama_ba}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.pagu_dipa)}</td>
                    <td className="wl-pb-td wl-pb-td-num wl-pb-blokir">{fmtT(r.blokir)}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.pagu_dipa_efektif)}</td>
                    <td className="wl-pb-td wl-pb-td-num wl-pb-real">{fmtT(r.realisasi_basis_kas)}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.pagu_kontrak)}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.real_kontrak)}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.outs_kontrak)}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.outs_uptup)}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.total_kas_dan_outstanding)}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.belum_sp2d)}</td>
                    <td className="wl-pb-td wl-pb-td-num">{fmtT(r.nilai_spp_spm)}</td>
                    <td className="wl-pb-td wl-pb-td-num wl-pb-sisa">{fmtT(r.sisa_pagu_efektif)}</td>
                    <td className="wl-pb-td wl-pb-td-num">
                      {pct(r.realisasi_basis_kas, r.pagu_dipa)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Landing ─────────────────────────────────────────────────────────────

export default function WeeklyLanding() {
  return (
    <div className="wl-root">
      {/* Page header */}
      <div className="wl-page-header">
        <div>
          <h1 className="wl-page-title">Dashboard Weekly</h1>
          <p className="wl-page-subtitle">
            Rekap mingguan realisasi belanja negara & pengendalian anggaran K/L
          </p>
        </div>
        <div className="wl-page-date">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
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

        {/* 2 — Pengendalian Belanja */}
        <AccordionItem
          id="pengendalian-belanja"
          title="Pengendalian Belanja"
          subtitle="Pagu, blokir, realisasi, kontrak & outstanding per K/L"
          badge="K/L"
          badgeColor="amber"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
          }
        >
          <PengendalianBelanjaPanel />
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
