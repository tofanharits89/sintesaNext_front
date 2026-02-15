"use client";

import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface RingkasanLaporanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any | null;
    periode: string;
    isLoading?: boolean;
}

export function RingkasanLaporanModal({
    open,
    onOpenChange,
    data,
    periode,
    isLoading = false,
}: RingkasanLaporanModalProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const formatRupiah = (value: number) => {
        return Number(value ?? 0).toLocaleString("id-ID", {
            maximumFractionDigits: 0,
        });
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const periodeLabels: Record<string, string> = {
        Q1: "Triwulan 1 (Jan - Mar)",
        Q2: "Triwulan 2 (Apr - Jun)",
        Q3: "Triwulan 3 (Jul - Sep)",
        Q4: "Triwulan 4 (Okt - Des)",
    };

    const filtered = useMemo(() => {
        const rows = data?.satkerData || [];
        const q = searchTerm.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (r: any) =>
                (r?.namaSatker || "").toLowerCase().includes(q) ||
                (r?.kodeSatker || "").toLowerCase().includes(q) ||
                (r?.bankPenerbit || "").toLowerCase().includes(q)
        );
    }, [data?.satkerData, searchTerm]);

    // Early return AFTER all hooks
    if (!data) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] md:max-w-[1200px] h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Ringkasan Laporan Per KPPN</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-3 py-3">
                    {/* Info Section */}
                    <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Periode:</span>
                            <Badge variant="outline">{periodeLabels[periode] || periode}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">KPPN:</span>
                            <span className="font-medium">{data.kodeKppn} - {data.namaKppn}</span>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mb-3 flex items-center gap-2">
                        <Input
                            placeholder="Cari satker/kode/bank..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg h-full flex flex-col overflow-hidden">
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="ml-2 text-muted-foreground">Memuat data...</p>
                            </div>
                        ) : (
                        <div className="flex-1 w-full overflow-auto">
                            <div className="min-w-full">
                                <table className="w-full min-w-max text-xs">
                                    <thead className="bg-muted sticky top-0 z-30">
                                        <tr>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">No</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Kode BA</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Kode Satker</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Nama Satker</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">UP KKP Per Bulan</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Porsi UP KKP</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Bank Penerbit</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Jumlah Kartu</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Nilai Tagihan</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Nilai Transaksi</th>
                                            <th className="p-2 text-center whitespace-nowrap text-xs">Kendala</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length ? (
                                            filtered.map((r: any, idx: number) => (
                                                <tr key={r.id ?? idx} className="border-t">
                                                    <td className="p-2 text-center text-xs">{idx + 1}</td>
                                                    <td className="p-2 text-center text-xs">{r.kodeBA}</td>
                                                    <td className="p-2 text-center text-xs">{r.kodeSatker}</td>
                                                    <td className="p-2 text-left text-xs max-w-[180px] truncate" title={r.namaSatker}>
                                                        {r.namaSatker}
                                                    </td>
                                                    <td className="p-2 text-right font-mono text-xs">
                                                        Rp {formatRupiah(r.upKkpPerBulan)}
                                                    </td>
                                                    <td className="p-2 text-center text-xs">
                                                        {formatPercent(r.porsiUpKkp)}
                                                    </td>
                                                    <td className="p-2 text-center text-xs">{r.bankPenerbit}</td>
                                                    <td className="p-2 text-center text-xs">{r.jumlahKartu}</td>
                                                    <td className="p-2 text-right font-mono text-xs">
                                                        Rp {formatRupiah(r.nilaiTagihan)}
                                                    </td>
                                                    <td className="p-2 text-right font-mono text-xs">
                                                        Rp {formatRupiah(r.nilaiTransaksi)}
                                                    </td>
                                                    <td className="p-2 text-left text-xs max-w-[150px] truncate" title={r.kendala || "Tidak ada kendala"}>
                                                        {r.kendala || <span className="text-muted-foreground italic">-</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={11} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data satker.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="flex items-center justify-end">
                    <Button
                        variant="destructive"
                        className="w-24"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
