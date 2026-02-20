"use client";

import React, { useState, useEffect, useMemo } from "react";
import numeral from "numeral";
import { RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";
import FilterCard, { FilterResult } from "./filter-card";

interface Row {
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
    sisa_pagu_efektif: number;
}

const fmt = (v: number | string) => numeral(Number(v)).format("0,0");

type SortKey = keyof Row | null;
type SortDir = "asc" | "desc";

export default function PengendalianBelanja() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<Row[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [filter, setFilter] = useState<FilterResult>({
        tahun: String(new Date().getFullYear()),
        kddept: "00",
        exclude999: false,
    });

    const fetchData = async (f: FilterResult, bustCache = false) => {
        setLoading(true);
        setSortKey(null); // reset sort on new fetch
        try {
            const params = new URLSearchParams();
            if (f.tahun) params.set("tahun", f.tahun);
            if (f.kddept && f.kddept !== "00") params.set("kddept", f.kddept);
            if (f.exclude999) params.set("exclude999", "true");
            if (bustCache) params.set("_t", String(Date.now()));

            const res = await http.get(
                `/api/v1/pengendalian-belanja${params.toString() ? `?${params}` : ""}`,
            );
            setData(res.data?.result ?? []);
        } catch (err: any) {
            toast.error(
                err?.message || "Terjadi Permasalahan Koneksi atau Server Backend",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData(filter, true);
    };

    useEffect(() => {
        fetchData(filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilter = (f: FilterResult) => {
        setFilter(f);
        fetchData(f);
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sortedData = useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            const an = Number(av);
            const bn = Number(bv);
            const numeric = !isNaN(an) && !isNaN(bn);
            const cmp = numeric
                ? an - bn
                : String(av ?? "").localeCompare(String(bv ?? ""));
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Dashboard Pengendalian Belanja
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoring pagu, realisasi, kontrak, dan outstanding per
                        Kementerian/Lembaga.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 self-start sm:self-auto"
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                >
                    <RefreshCw
                        className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""
                            }`}
                    />
                    Refresh
                </Button>
            </div>

            {/* Filter Card */}
            <FilterCard onFilter={handleFilter} />

            {/* Data Table */}
            <section>
                <Card className="border shadow-sm">
                    <CardContent className="px-8 py-4">
                        {loading ? (
                            <div className="p-2"><TableSkeleton rows={10} /></div>
                        ) : (
                            <div className="border rounded-lg flex flex-col overflow-hidden" style={{ maxHeight: "65vh" }}>
                                <div className="flex-1 w-full overflow-auto">
                                    <div className="min-w-full">
                                        <table className="w-full min-w-max text-sm">
                                            <thead className="bg-muted sticky top-0 z-30">
                                                <tr>
                                                    <th className="p-2 text-center font-semibold text-muted-foreground whitespace-nowrap border-b">No.</th>
                                                    {(["kode_ba", "nama_ba", "pagu_dipa", "blokir", "pagu_dipa_efektif", "realisasi_basis_kas", "outs_kontrak", "outs_uptup", "total_kas_dan_outstanding", "sisa_pagu_efektif"] as SortKey[]).map((col) => {
                                                        const labels: Record<string, string> = {
                                                            kode_ba: "Kode BA", nama_ba: "Nama BA",
                                                            pagu_dipa: "Pagu DIPA", blokir: "Blokir",
                                                            pagu_dipa_efektif: "Pagu DIPA Efektif",
                                                            realisasi_basis_kas: "Realisasi Basis Kas",
                                                            outs_kontrak: "Outstanding Kontrak",
                                                            outs_uptup: "Outstanding UP/TUP",
                                                            total_kas_dan_outstanding: "Total Kas & Outstanding",
                                                            sisa_pagu_efektif: "Sisa Pagu Efektif",
                                                        };
                                                        const active = sortKey === col;
                                                        const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
                                                        return (
                                                            <th
                                                                key={col as string}
                                                                onClick={() => handleSort(col)}
                                                                className="p-2 text-center font-semibold text-muted-foreground whitespace-nowrap border-b cursor-pointer select-none hover:bg-muted/80 transition-colors"
                                                            >
                                                                <span className="inline-flex items-center justify-center gap-1">
                                                                    {labels[col as string]}
                                                                    <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "opacity-40"}`} />
                                                                </span>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={11} className="text-center text-muted-foreground py-10">
                                                            Tidak ada data.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    sortedData.map((row, idx) => (
                                                        <tr key={row.kode_ba} className="border-t hover:bg-muted/50 transition-colors">
                                                            <td className="p-2 text-center text-muted-foreground whitespace-nowrap">{idx + 1}</td>
                                                            <td className="p-2 text-center whitespace-nowrap">{row.kode_ba}</td>
                                                            <td className="p-2 whitespace-nowrap max-w-[280px] truncate">{row.nama_ba}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(row.pagu_dipa)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(row.blokir)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(row.pagu_dipa_efektif)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(row.realisasi_basis_kas)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(row.outs_kontrak)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(row.outs_uptup)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono font-semibold">{fmt(row.total_kas_dan_outstanding)}</td>
                                                            <td className={`p-2 text-right whitespace-nowrap font-mono font-semibold ${Number(row.sisa_pagu_efektif) < 0 ? "text-red-600" : "text-green-600"}`}>
                                                                {fmt(row.sisa_pagu_efektif)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                                {data.length > 0 && (() => {
                                                    const total = data.reduce(
                                                        (acc, row) => ({
                                                            pagu_dipa: acc.pagu_dipa + (Number(row.pagu_dipa) || 0),
                                                            blokir: acc.blokir + (Number(row.blokir) || 0),
                                                            pagu_dipa_efektif: acc.pagu_dipa_efektif + (Number(row.pagu_dipa_efektif) || 0),
                                                            realisasi_basis_kas: acc.realisasi_basis_kas + (Number(row.realisasi_basis_kas) || 0),
                                                            outs_kontrak: acc.outs_kontrak + (Number(row.outs_kontrak) || 0),
                                                            outs_uptup: acc.outs_uptup + (Number(row.outs_uptup) || 0),
                                                            total_kas_dan_outstanding: acc.total_kas_dan_outstanding + (Number(row.total_kas_dan_outstanding) || 0),
                                                            sisa_pagu_efektif: acc.sisa_pagu_efektif + (Number(row.sisa_pagu_efektif) || 0),
                                                        }),
                                                        { pagu_dipa: 0, blokir: 0, pagu_dipa_efektif: 0, realisasi_basis_kas: 0, outs_kontrak: 0, outs_uptup: 0, total_kas_dan_outstanding: 0, sisa_pagu_efektif: 0 }
                                                    );
                                                    return (
                                                        <tr className="border-t-2 border-border bg-muted font-semibold">
                                                            <td className="p-2 text-center text-muted-foreground">—</td>
                                                            <td className="p-2" />
                                                            <td className="p-2 whitespace-nowrap">Grand Total</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(total.pagu_dipa)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(total.blokir)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(total.pagu_dipa_efektif)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(total.realisasi_basis_kas)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(total.outs_kontrak)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(total.outs_uptup)}</td>
                                                            <td className="p-2 text-right whitespace-nowrap font-mono">{fmt(total.total_kas_dan_outstanding)}</td>
                                                            <td className={`p-2 text-right whitespace-nowrap font-mono ${total.sisa_pagu_efektif < 0 ? "text-red-600" : "text-green-600"}`}>
                                                                {fmt(total.sisa_pagu_efektif)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
