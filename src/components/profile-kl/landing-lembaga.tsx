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
import { Plus } from "lucide-react";

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

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="space-y-4 p-4 print:p-0">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Profil Kinerja Lembaga
          </h1>
          <p className="text-sm text-muted-foreground">
            Isu Spesifik &amp; Analisa Kinerja Pelaksanaan Anggaran
          </p>
        </div>
        <button
          onClick={() => setShowPdf(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity print:hidden"
        >
          Download PDF
        </button>
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
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="sticky top-0 bg-muted text-left text-xs font-semibold text-muted-foreground">
                  <th className="border border-border px-3 py-2">No</th>
                  <th className="border border-border px-3 py-2">Temuan BPK</th>
                  <th className="border border-border px-3 py-2">Nilai</th>
                  <th className="border border-border px-3 py-2">Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody>
                {mergedTemuan.map((item, idx) => (
                  <tr
                    key={item.id_temuan}
                    className="text-foreground transition-colors hover:bg-muted/50 even:bg-muted/30"
                  >
                    <td className="border border-border px-3 py-2">{idx + 1}</td>
                    <td className="border border-border px-3 py-2">{item.temuan}</td>
                    <td className="border border-border px-3 py-2">{item.nilai}</td>
                    <td className="border border-border px-3 py-2">
                      <ol className="ml-4 list-decimal space-y-0.5">
                        {item.isuList.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        ) : (
          <div className="space-y-4">
            {namaoutputList.map((outputName, idx) => {
              const rows = dataOutput.filter((r) => r.namaoutput === outputName);
              return (
                <div key={idx}>
                  <h3 className="mb-2 text-center text-xs font-bold text-foreground">
                    {outputName || "—"}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                          <th className="border border-border px-3 py-2">Tahun</th>
                          <th className="border border-border px-3 py-2">Pagu</th>
                          <th className="border border-border px-3 py-2">Realisasi</th>
                          <th className="border border-border px-3 py-2">Persen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr
                            key={i}
                            className="text-foreground transition-colors hover:bg-muted/50 even:bg-muted/30"
                          >
                            <td className="border border-border px-3 py-2">{r.tahun}</td>
                            <td className="border border-border px-3 py-2">{r.pagu}</td>
                            <td className="border border-border px-3 py-2">{r.realisasi}</td>
                            <td className="border border-border px-3 py-2">{r.persen}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
          onDone={() => setShowPdf(false)}
        />
      )}
    </main>
  );
}
