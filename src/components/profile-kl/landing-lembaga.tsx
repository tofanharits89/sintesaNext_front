"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { directBackendClient } from "@/lib/api/httpClient";
import { useAuth } from "@/hooks/useAuth";
import Pilihan from "./pilihan";
import Isu, { type IsuRow } from "./isu";
import Tren, { type TrenRow } from "./tren";
import Temuan, { type TemuanRow } from "./temuan";
import OutputUtama, { type OutputRow } from "./output-utama";
import IkpaForm, { type IkpaRow } from "./ikpa-form";
import Pdf from "./pdf";
import kddept from "@/data/kddept.json";
import { Plus, FileText } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterData = { thang: string; periode: string; dept: string };

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingRows() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-4 rounded bg-muted" />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingLembaga() {
  const { user } = useAuth();

  const [inputValues, setInputValues] = useState<FilterData>({
    thang: "2025",
    periode: "1",
    dept: "004",
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IsuRow[]>([]);
  const [dataTren, setDataTren] = useState<TrenRow[]>([]);
  const [dataTemuan, setDataTemuan] = useState<TemuanRow[]>([]);
  const [dataOutput, setDataOutput] = useState<OutputRow[]>([]);
  const [dataIkpa, setDataIkpa] = useState<IkpaRow[]>([]);

  const [show, setShow] = useState(false);
  const [showTren, setShowTren] = useState(false);
  const [showTemuan, setShowTemuan] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showIkpa, setShowIkpa] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  // ─── Derived ────────────────────────────────────────────────────────────────
  const deptInfo = (kddept as { kddept: string; nmdept: string }[]).find(
    (k) => k.kddept === inputValues.dept,
  );
  const trenDukman  = dataTren.filter((r) => r.tabel === "tren_dukman");
  const trenJenbel  = dataTren.filter((r) => r.tabel === "tren_jenbel");
  const trenBulanan = dataTren.filter((r) => r.tabel === "tren_bulanan");
  const trenSdana   = dataTren.filter((r) => r.tabel === "tren_sdana");
  const trenUptup   = dataTren.filter((r) => r.tabel === "tren_uptup");

  const mergedTemuan = dataTemuan.reduce<(TemuanRow & { isuList: string[] })[]>(
    (acc, curr) => {
      const existing = acc.find((x) => x.id_temuan === curr.id_temuan);
      if (existing) existing.isuList.push(curr.isu);
      else acc.push({ ...curr, isuList: [curr.isu] });
      return acc;
    },
    [],
  );
  const namaoutputList = [...new Set(dataOutput.map((r) => r.namaoutput))];

  // ─── Fetchers ────────────────────────────────────────────────────────────────
  const fetchIsu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await directBackendClient.get<{ data: IsuRow[] }>(
        `/kinerja/isu?thang=${inputValues.thang}&dept=${inputValues.dept}&periode=${inputValues.periode}`,
      );
      setData(res.data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [inputValues]);

  const fetchTren = useCallback(async () => {
    try {
      const res = await directBackendClient.get<{ data: TrenRow[] }>(
        `/kinerja/tren?thang=${inputValues.thang}&dept=${inputValues.dept}&periode=${inputValues.periode}`,
      );
      setDataTren(res.data ?? []);
    } catch (err) { console.error(err); }
  }, [inputValues]);

  const fetchOutput = useCallback(async () => {
    try {
      const res = await directBackendClient.get<{ data: OutputRow[] }>(
        `/kinerja/output?thang=${inputValues.thang}&dept=${inputValues.dept}&periode=${inputValues.periode}`,
      );
      setDataOutput(res.data ?? []);
    } catch (err) { console.error(err); }
  }, [inputValues]);

  const fetchTemuan = useCallback(async () => {
    try {
      const res = await directBackendClient.get<{ data: TemuanRow[] }>(
        `/kinerja/temuan?thang=${inputValues.thang}&dept=${inputValues.dept}&periode=${inputValues.periode}`,
      );
      setDataTemuan(res.data ?? []);
    } catch (err) { console.error(err); }
  }, [inputValues]);

  const fetchIkpa = useCallback(async () => {
    try {
      const res = await directBackendClient.get<{ data: IkpaRow[] }>(
        `/kinerja/ikpa?dept=${inputValues.dept}&periode=${inputValues.periode}`,
      );
      setDataIkpa(res.data ?? []);
    } catch (err) { console.error(err); }
  }, [inputValues]);

  useEffect(() => {
    fetchIsu(); fetchTren(); fetchOutput(); fetchTemuan(); fetchIkpa();
  }, [fetchIsu, fetchTren, fetchOutput, fetchTemuan, fetchIkpa]);

  const handleInputChange = (id: string, value: string) =>
    setInputValues((prev) => ({ ...prev, [id]: value }));

  const updateReload = () => { fetchTemuan(); fetchOutput(); fetchIkpa(); };

  // ─── Column Definitions ──────────────────────────────────────────────────────
  const temuanColumns: ColumnDef<any>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "temuan",
      header: () => <div className="text-center font-medium">Temuan BPK</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium max-w-[400px] whitespace-normal break-words">
          {row.getValue("temuan")}
        </div>
      ),
    },
    {
      accessorKey: "nilai",
      header: () => <div className="text-center font-medium">Nilai</div>,
      cell: ({ row }) => (
        <div className="text-left text-muted-foreground">{row.getValue("nilai")}</div>
      ),
    },
    {
      id: "isuList",
      header: () => <div className="text-center font-medium">Tindak Lanjut</div>,
      cell: ({ row }) => (
        <ol className="ml-4 list-decimal space-y-0.5 text-xs text-muted-foreground">
          {(row.original.isuList as string[]).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      ),
    },
  ];

  const outputColumns: ColumnDef<any>[] = [
    {
      accessorKey: "tahun",
      header: () => <div className="text-center font-medium">Tahun</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("tahun")}</div>,
    },
    {
      accessorKey: "pagu",
      header: () => <div className="text-center font-medium">Pagu</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("pagu")}</div>,
    },
    {
      accessorKey: "realisasi",
      header: () => <div className="text-center font-medium">Realisasi</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("realisasi")}</div>,
    },
    {
      accessorKey: "persen",
      header: () => <div className="text-center font-medium">Persen</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("persen")}</div>,
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Profil Kinerja Lembaga
          </h1>
          <p className="text-sm text-muted-foreground">
            Isu Spesifik &amp; Analisa Kinerja Pelaksanaan Anggaran
          </p>
        </div>
        <Button
          onClick={() => setShowPdf(true)}
          className="print:hidden"
        >
          <FileText className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* ── Filter ── */}
      <div className="rounded-xl border bg-card shadow-sm">
        <Pilihan onInputChange={handleInputChange} defaultDept={inputValues.dept} />
      </div>

      {/* ── Logo + ISU ── */}
      <div className="flex gap-4 rounded-xl border-2 border-primary/20 bg-card p-4 shadow-sm">
        <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-2">
          <div className="relative h-20 w-20">
            <Image
              src={`/logo/${inputValues.dept}.png`}
              alt="logo"
              fill
              className="object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo/null.png"; }}
            />
          </div>
          {deptInfo && (
            <p className="text-center text-xs font-semibold leading-tight text-foreground">
              {deptInfo.nmdept.slice(0, 80)}
            </p>
          )}
        </div>

        <div
          className="flex-1 cursor-pointer rounded-lg p-3 hover:bg-muted transition-colors"
          onClick={() => setShow(true)}
        >
          <p className="mb-2 text-center text-sm font-bold text-foreground">
            Isu Spesifik Pelaksanaan Anggaran {Number(inputValues.thang) - 4}–{inputValues.thang}
          </p>
          {loading ? (
            <LoadingRows />
          ) : data.length > 0 ? (
            <ol className="ml-5 list-decimal space-y-1 text-sm text-foreground">
              {data.map((item, idx) => <li key={item.id ?? idx}>{item.isu}</li>)}
            </ol>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Belum ada data — klik untuk menambahkan isu.
            </p>
          )}
        </div>
      </div>

      {/* ── Tren Grid ── */}
      <div
        className="grid cursor-pointer grid-cols-1 gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-3"
        onClick={() => setShowTren(true)}
      >
        {[
          { label: "Tren Dukman / Teknis",  data: trenDukman  },
          { label: "Tren Jenis Belanja",    data: trenJenbel  },
          { label: "Tren Belanja Bulanan",  data: trenBulanan },
          { label: "Tren Sumber Dana",      data: trenSdana   },
          { label: "Tren UP / TUP",         data: trenUptup   },
        ].map(({ label, data: d }) => (
          <div key={label} className="rounded-lg border bg-background p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
            {d.length > 0 ? (
              <p className="line-clamp-4 text-xs text-foreground">{d[0]!.isu}</p>
            ) : (
              <p className="text-xs italic text-muted-foreground">Belum ada data tren.</p>
            )}
          </div>
        ))}

        {/* IKPA card */}
        <div
          className="cursor-pointer rounded-lg border bg-background p-3"
          onClick={(e) => { e.stopPropagation(); setShowIkpa(true); }}
        >
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Nilai IKPA</p>
          {dataIkpa.length > 0 ? (
            <ul className="space-y-1">
              {dataIkpa.map((item) => (
                <li key={item.id} className="flex justify-between text-xs text-foreground">
                  <span>{item.thang}</span>
                  <span className="font-semibold">{item.nilaiikpa}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs italic text-muted-foreground">Belum ada data IKPA.</p>
          )}
        </div>
      </div>

      {/* ── Temuan BPK ── */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Temuan BPK</h2>
          <button
            onClick={() => setShowTemuan(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : (
          <div className="max-h-72 overflow-x-auto overflow-y-auto">
            <DataTable
              columns={temuanColumns}
              data={mergedTemuan}
              hidePagination={mergedTemuan.length <= 10}
              initialPageSize={10}
              emptyMessage="Belum ada data temuan."
            />
          </div>
        )}
      </div>

      {/* ── Output Utama ── */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Output Utama Belanja Lembaga</h2>
          <button
            onClick={() => setShowOutput(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : namaoutputList.length > 0 ? (
          <div className="space-y-4">
            {namaoutputList.map((outputName, idx) => {
              const rows = dataOutput.filter((r) => r.namaoutput === outputName);
              return (
                <div key={idx}>
                  <h3 className="mb-2 text-center text-xs font-bold text-foreground">
                    {outputName || "—"}
                  </h3>
                  <div className="overflow-x-auto">
                    <DataTable
                      columns={outputColumns}
                      data={rows}
                      hidePagination={true}
                      initialPageSize={10}
                      emptyMessage="Belum ada data output."
                    />
                  </div>
                  {rows[0]?.catatan && (
                    <p className="mt-1 text-justify text-xs text-muted-foreground">
                      {rows[0].catatan}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable 
              columns={[
                {
                  id: "no",
                  header: () => <div className="text-center font-medium">No</div>,
                  cell: () => <div className="text-center">—</div>,
                },
                {
                  accessorKey: "namaoutput",
                  header: () => <div className="text-center font-medium">Nama Output</div>,
                  cell: () => <div className="text-center">—</div>,
                },
                {
                  accessorKey: "catatan",
                  header: () => <div className="text-center font-medium">Keterangan</div>,
                  cell: () => <div className="text-center">—</div>,
                }
              ]} 
              data={[]} 
              hidePagination={true}
              emptyMessage="Belum ada data output utama."
            />
          </div>
        )}
      </div>

      {/* ── Panels ── */}
      <Isu  show={show}  data={inputValues} isi={data}  handleClose={() => { setShow(false); fetchIsu(); }} />
      <Tren show={showTren} data={inputValues} isi={dataTren} handleClose={() => { setShowTren(false); fetchTren(); }} />
      <Temuan
        show={showTemuan} data={inputValues} isi={dataTemuan}
        handleClose={() => { setShowTemuan(false); fetchTemuan(); }}
        updateReload={updateReload}
      />
      <OutputUtama
        show={showOutput} data={inputValues} isi={dataOutput}
        handleClose={() => { setShowOutput(false); fetchOutput(); }}
        updateReload={updateReload}
      />
      <IkpaForm
        show={showIkpa} data={inputValues} isi={dataIkpa}
        handleClose={() => { setShowIkpa(false); fetchIkpa(); }}
        updateReload={updateReload}
      />

      {showPdf && (
        <Pdf
          thang={inputValues.thang}
          dept={inputValues.dept}
          periode={inputValues.periode}
          nmdept={deptInfo?.nmdept}
          isuData={data}
          trenData={dataTren}
          temuanData={dataTemuan}
          outputData={dataOutput}
          ikpaData={dataIkpa}
          onDone={() => setShowPdf(false)}
        />
      )}
    </div>
  );
}
