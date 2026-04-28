"use client";

import { useState, useEffect, startTransition, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import Pilihan, { type FilterParams } from "./pilihan";
import { JumlahDipa } from "./hasilQuery";
import Ikpa from "./ikpa";
import {
  getSQL,
  getSQLJenbel,
  getSQLProgram,
  getSqlBkpk,
  getSqlDukman,
  getSqlPerbandingan,
  getSqlRpd,
  getSqlSatker,
  getSqlTren,
  getSqlTrenJenbel,
  getSqlIkpa,
} from "./getSQL";

// ─── Lazy-loaded chart components ────────────────────────────────────────────

const ChartJenbel = dynamic(
  () => import("@/components/profile/charts/chart-jenbel"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ChartProgram = dynamic(
  () => import("@/components/profile/charts/chart-program"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ChartPerbandingan = dynamic(
  () => import("@/components/profile/charts/chart-perbandingan"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ChartRpd = dynamic(
  () => import("@/components/profile/charts/chart-rpd"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ChartSatker = dynamic(
  () => import("@/components/profile/charts/chart-satker"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ChartTren = dynamic(
  () => import("@/components/profile/charts/chart-tren"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ChartBkpk = dynamic(
  () => import("@/components/profile/charts/chart-bkpk"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ChartDukman = dynamic(
  () => import("@/components/profile/charts/chart-dukman"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ChartTrenJenbel = dynamic(
  () => import("@/components/profile/charts/chart-trenjenbel"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

// ─── Static selects ───────────────────────────────────────────────────────────

const FROM_DIPA = "dashboard_v3.dipa_satker_rekap";
const SELECT_DIPA =
  " ,SUM(jml) jumlahdipa,SUM(pagu)/1000000000000 pagu,SUM(realisasi)/1000000000000 realisasi,SUM(blokir)/1000000000000 blokir ";

const FROM_JENBEL = "dashboard_v3.pagu_real_dashboard";
const SELECT_JENBEL =
  " ,left(kdbkpk,2) as jenbel,SUM(real1+ real2+ real3+ real4+ real5+ real6+ real7+ real8+ real9+ real10+ real11+ real12)/SUM(pagu)*100 persen  ";

const FROM_PERBANDINGAN = "dashboard_v3.pagu_real_dashboard";
const SELECT_PERBANDINGAN =
  " ,thang,SUM(real1+ real2+ real3+ real4+ real5+ real6+ real7+ real8+ real9+ real10+ real11+ real12)/SUM(pagu)*100 persen";

const FROM_PROGRAM = "dashboard_v3.pagu_real_dashboard";
const SELECT_PROGRAM =
  " ,a.thang,a.kddept,a.kdunit,a.kdprogram,b.nmprogram,ROUND(SUM(a.real1+ a.real2+ a.real3+ a.real4+ a.real5+ a.real6+ a.real7+ a.real8+ a.real9+ a.real10+ a.real11+ a.real12)/1000000000000,2) realisasi,ROUND((SUM(a.real1+ a.real2+ a.real3+ a.real4+ a.real5+ a.real6+ a.real7+ a.real8+ a.real9+ a.real10+ a.real11+ a.real12)/NULLIF(SUM(a.pagu),0))*100,2) persentase  ";

const FROM_RPD = "dashboard_v3.rencana_real_harian_output";
const SELECT_RPD =
  ",thang, SUM(renc1)/1000000000000 renc1,SUM(real1)/1000000000000 real1,SUM(renc2)/1000000000000 renc2,SUM(real2)/1000000000000 real2,SUM(renc3)/1000000000000 renc3,SUM(real3)/1000000000000 real3,SUM(renc4)/1000000000000 renc4,SUM(real4)/1000000000000 real4,SUM(renc5)/1000000000000 renc5,SUM(real5)/1000000000000 real5,SUM(renc6)/1000000000000 renc6,SUM(real6)/1000000000000 real6,SUM(renc7)/1000000000000 renc7,SUM(real7)/1000000000000 real7,SUM(renc8)/1000000000000 renc8,SUM(real8)/1000000000000 real8,SUM(renc9)/1000000000000 renc9,SUM(real9)/1000000000000 real9,SUM(renc10)/1000000000000 renc10,SUM(real10)/1000000000000 real10,SUM(renc11)/1000000000000 renc10,SUM(real11)/1000000000000 real11,SUM(renc12)/1000000000000 renc12,SUM(real12)/1000000000000 real12";

const FROM_SATKER = "dashboard_v3.pagu_real_dashboard";
const SELECT_SATKER =
  ",thang, kdsatker,SUM(real1+ real2+ real3+ real4+ real5+ real6+ real7+ real8+ real9+ real10+ real11+ real12)/1000000000000 realisasi";

const FROM_TREN = "dashboard_v3.pagu_real_dashboard";
const SELECT_TREN =
  " ,thang,SUM(real1)/SUM(pagu)*100 jan,SUM(real2)/SUM(pagu)*100 feb,SUM(real3)/SUM(pagu)*100 mar,SUM(real4)/SUM(pagu)*100 apr,SUM(real5)/SUM(pagu)*100 mei,SUM(real6)/SUM(pagu)*100 jun,SUM(real7)/SUM(pagu)*100 jul,SUM(real8)/SUM(pagu)*100 agt,SUM(real9)/SUM(pagu)*100 sep,SUM(real10)/SUM(pagu)*100 okt,SUM(real11)/SUM(pagu)*100 nov,SUM(real12)/SUM(pagu)*100 des";

const FROM_BKPK = "dashboard_v3.pagu_real_dashboard";
const SELECT_BKPK =
  ",thang, kdbkpk,SUM(real1+ real2+ real3+ real4+ real5+ real6+ real7+ real8+ real9+ real10+ real11+ real12)/1000000000 realisasi";

const FROM_DUKMAN = "dashboard_v3.pagu_real_dashboard";
const SELECT_DUKMAN =
  ",'pagu_teknis' AS jenis_pagu,SUM(CASE WHEN kdprogram = 'WA' THEN pagu ELSE 0 END) / SUM(pagu)*100 AS nilai_pagu ";

const FROM_TRENJENBEL = "dashboard_v3.pagu_real_dashboard";
const SELECT_TRENJENBEL =
  ",left(kdbkpk,2) kdjenbel,SUM(pagu) AS pagu_per_jenbel,(SUM(pagu) / total.total_pagu) * 100 AS persentase_pagu ";

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="flex h-44 items-center justify-center">
      <div className="h-full w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="h-52 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
  );
}

// ─── kddept codes that should render LandingLembaga instead ──────────────────
// Used only by parent pages to decide which landing to show.
export const LEMBAGA_CODES = new Set([
  "004",
  "050",
  "051",
  "052",
  "054",
  "055",
  "057",
  "063",
  "064",
  "066",
  "075",
  "076",
  "078",
  "083",
  "084",
  "085",
  "086",
  "087",
  "088",
  "089",
  "093",
  "100",
  "103",
  "106",
  "107",
  "108",
  "110",
  "111",
  "112",
  "113",
  "115",
  "116",
  "117",
  "118",
  "119",
  "122",
  "123",
  "124",
  "125",
  "126",
  "127",
  "128",
  "153",
]);

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingKL() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const kodekppn = user?.kdkppn ?? "";
  const kodekanwil = user?.kdkanwil ?? "";

  const [pilihan, setPilihan] = useState<FilterParams>({
    thang: "2026",
    dept: "000",
    unit: "00",
    prov: "00",
  });
  const [kanwil, setKanwil] = useState("00");
  const [persentase, setPersentase] = useState("0,00");

  const parts = pilihan.dept.split("//");
  const deptCode = parts[0] ?? "000";
  const deptName = parts[1] ?? "";

  const [sql, setSql] = useState("");
  const [sqlJenbel, setSqlJenbel] = useState("");
  const [sqlPerbandingan, setSqlPerbandingan] = useState("");
  const [sqlProgram, setSqlProgram] = useState("");
  const [sqlRpd, setSqlRpd] = useState("");
  const [sqlSatker, setSqlSatker] = useState("");
  const [sqlTren, setSqlTren] = useState("");
  const [sqlBkpk, setSqlBkpk] = useState("");
  const [sqlDukman, setSqlDukman] = useState("");
  const [sqlTrenJenbel, setSqlTrenJenbel] = useState("");
  const [sqlIkpa, setSqlIkpa] = useState("");

  const handleInputChange = (id: string, value: string) => {
    if (id === "dept" && value === "000") {
      setPilihan((prev) => ({ ...prev, unit: "00", [id]: value }));
    } else {
      setPilihan((prev) => ({ ...prev, [id]: value }));
    }
  };

  useEffect(() => {
    startTransition(() => {
      const base = {
        thang: pilihan.thang,
        dept: deptCode,
        unit: pilihan.unit,
        prov: pilihan.prov,
        role,
        kodekppn,
        kodekanwil,
      };

      setSql(getSQL({ ...base, select: SELECT_DIPA, from: FROM_DIPA }));
      setSqlJenbel(
        getSQLJenbel({
          ...base,
          selectJenbel: SELECT_JENBEL,
          fromJenbel: FROM_JENBEL,
        }),
      );
      setSqlProgram(
        getSQLProgram({
          ...base,
          selectProgram: SELECT_PROGRAM,
          fromProgram: FROM_PROGRAM,
        }),
      );
      setSqlPerbandingan(
        getSqlPerbandingan({
          ...base,
          selectPerbandingan: SELECT_PERBANDINGAN,
          fromPerbandingan: FROM_PERBANDINGAN,
        }),
      );
      setSqlRpd(
        getSqlRpd({ ...base, selectRpd: SELECT_RPD, fromRpd: FROM_RPD }),
      );
      setSqlSatker(
        getSqlSatker({
          ...base,
          selectSatker: SELECT_SATKER,
          fromSatker: FROM_SATKER,
        }),
      );
      setSqlTren(
        getSqlTren({ ...base, selectTren: SELECT_TREN, fromTren: FROM_TREN }),
      );
      setSqlBkpk(
        getSqlBkpk({ ...base, selectBkpk: SELECT_BKPK, fromBkpk: FROM_BKPK }),
      );
      setSqlDukman(
        getSqlDukman({
          ...base,
          selectDukman: SELECT_DUKMAN,
          fromDukman: FROM_DUKMAN,
        }),
      );
      setSqlTrenJenbel(
        getSqlTrenJenbel({
          ...base,
          selectTrenJenbel: SELECT_TRENJENBEL,
          fromTrenJenbel: FROM_TRENJENBEL,
        }),
      );
      setSqlIkpa(getSqlIkpa({ ...base, selectIkpa: " ", fromIkpa: "" }));
      setKanwil(pilihan.prov);
    });
  }, [pilihan, role, kodekppn, kodekanwil, deptCode]);

  return (
    <main className="space-y-4 p-4">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Dashboard Kementerian / Lembaga
        </h1>
        <nav className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          <span>Dashboard</span>
          <span className="mx-1">/</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">
            K/L
          </span>
        </nav>
      </div>

      {/* Filter */}
      <Pilihan onInputChange={handleInputChange} />

      {/* Cards grid – row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Identity card */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h6 className="text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
            {deptCode === "000"
              ? "SEMUA KEMENTERIAN / LEMBAGA"
              : `BA - ${deptCode}`}
          </h6>
          {deptName && (
            <p className="mt-0.5 text-center text-xs text-gray-500 dark:text-gray-400">
              {deptName.length > 30
                ? `${deptName.substring(0, 30)}…`
                : deptName}
            </p>
          )}
          <div className="my-3 flex justify-center">
            <Image
              src={
                pilihan.dept !== "000"
                  ? `/logo/${deptCode}.png`
                  : "/logo/indo.gif"
              }
              alt={deptCode}
              width={80}
              height={80}
              className="rounded object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo/null.png";
              }}
            />
          </div>
          <hr className="my-2 border-gray-100 dark:border-gray-700" />
          <div className="text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
            PERSENTASE <br />
            {persentase} %
          </div>
        </div>

        {/* Jumlah DIPA */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <JumlahDipa
            query={sql}
            filterParams={pilihan}
            onPersentaseChange={setPersentase}
          />
        </div>

        {/* Perbandingan – spans 2 cols */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartPerbandingan query={sqlPerbandingan} filterParams={pilihan} />
          </Suspense>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartJenbel query={sqlJenbel} filterParams={pilihan} />
          </Suspense>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartBkpk query={sqlBkpk} filterParams={pilihan} />
          </Suspense>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartProgram query={sqlProgram} filterParams={pilihan} />
          </Suspense>
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartSatker query={sqlSatker} filterParams={pilihan} />
          </Suspense>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:col-span-2 xl:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartTren query={sqlTren} filterParams={pilihan} />
          </Suspense>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Suspense fallback={<ChartSkeleton />}>
            <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
              Porsi Total Alokasi 3 Tahun Terakhir
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ChartDukman query={sqlDukman} filterParams={pilihan} />
              <ChartTrenJenbel query={sqlTrenJenbel} filterParams={pilihan} />
            </div>
          </Suspense>
        </div>
      </div>

      {/* Bottom row: IKPA + RPD */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Ikpa query={sqlIkpa} kanwil={kanwil} filterParams={pilihan} />
          </div>
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <ChartRpd query={sqlRpd} filterParams={pilihan} />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
