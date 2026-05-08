"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import { X, Save, Loader2 } from "lucide-react";
import { apiPath } from "@/lib/config/base-path";

// Predefined category options for kendala
const KENDALA_CATEGORIES = [
    "Penerbitan KKP membutuhkan waktu lama",
    "Merchant/penyedia mengenakan Surcharge",
    "KKP tidak bisa digunakan di mesin EDC",
    "Merchant/penyedia belum mempunyai mesin EDC",
    "Tagihan KKP terlambat diterima Satker",
    "Bank tidak dapat menerbitkan tagihan sementara",
    "KKP masih diblokir/belum diaktifkan",
    "Lainnya",
];

interface KendalaHambatanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any;
    onSaved?: () => void;
    tahun?: string;
    triwulan?: string;
}

export function KendalaHambatanModal({
    open,
    onOpenChange,
    data,
    onSaved,
    tahun,
    triwulan,
}: KendalaHambatanModalProps) {
    const [kategori, setKategori] = useState<string[]>([]);
    const [detilKendala, setDetilKendala] = useState<string>("");
    const [detilMasukan, setDetilMasukan] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [satkerInfo, setSatkerInfo] = useState<{ kddept: string; nmdept: string; kdsatker: string; nmsatker: string } | null>(null);

    // Reset form when modal opens with data
    useEffect(() => {
        if (!open) {
            setKategori([]);
            setDetilKendala("");
            setDetilMasukan("");
            setSatkerInfo(null);
            return;
        }

        if (data) {
            // Fetch satker info for Kementerian/Lembaga display
            const fetchSatkerInfo = async () => {
                try {
                    const response = await fetch(
                        apiPath(`/monev-kkp/satker-detail?kdsatker=${data.kodeSatker}&tahun=${tahun || data?.tahun || "2026"}&_t=${Date.now()}`),
                        {
                            credentials: "include",
                            cache: "no-store",
                        }
                    );
                    if (response.ok) {
                        const result = await response.json();
                        if (result.data) {
                            setSatkerInfo({
                                kddept: result.data.kddept,
                                nmdept: result.data.nmdept,
                                kdsatker: result.data.kdsatker,
                                nmsatker: result.data.nmsatker,
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching satker info:", error);
                }
            };

            // Fetch existing kendala data
            const fetchKendala = async () => {
                setIsLoading(true);
                try {
                    const selectedTriwulan = triwulan || data?.triwulan || "1";
                    const selectedTahun = tahun || data?.tahun || "2026";

                    const response = await fetch(
                        apiPath(`/monev-kkp/kendala?tahun=${selectedTahun}&triwulan=${selectedTriwulan}&kdsatker=${data.kodeSatker}&_t=${Date.now()}`),
                        {
                            credentials: "include",
                        }
                    );

                    if (response.ok) {
                        const result = await response.json();
                        if (result.data) {
                            const savedCategories = result.data.kategori_kendala
                                ? result.data.kategori_kendala.split(",").map((c: string) => c.trim()).filter(Boolean)
                                : [];
                            setKategori(savedCategories);
                            setDetilKendala(result.data.detil_kendala || "");
                            setDetilMasukan(result.data.detil_masukan_kendala || "");
                        }
                    }
                } catch (error) {
                    console.error("Error fetching kendala data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchSatkerInfo();
            fetchKendala();
        }
    }, [data, open, tahun, triwulan]);

    const handleToggleKategori = (value: string) => {
        setKategori(prev => {
            if (prev.includes(value)) {
                return prev.filter(k => k !== value);
            } else {
                return [...prev, value];
            }
        });
    };

    const handleSubmit = async () => {
        if (kategori.length === 0) {
            toast.error("Silakan pilih minimal satu kategori kendala");
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedTriwulan = triwulan || data?.triwulan || "1";
            const selectedTahun = tahun || data?.tahun || "2026";

            const csrfHeaders = addCsrfToHeaders({ "Content-Type": "application/json" });
            const response = await fetch(apiPath("/monev-kkp/kendala"), {
                method: "POST",
                credentials: "include",
                headers: csrfHeaders,
                body: JSON.stringify({
                    tahun: selectedTahun,
                    triwulan: selectedTriwulan,
                    kdsatker: data?.kodeSatker,
                    kdba: data?.kodeBA,
                    kategori_kendala: kategori.join(", "),
                    detil_kendala: detilKendala,
                    detil_masukan_kendala: detilMasukan,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Gagal menyimpan data");
            }

            const result = await response.json();
            toast.success(result.message || "Data berhasil disimpan");

            if (onSaved) {
                onSaved();
            }
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving kendala:", error);
            toast.error(error.message || "Gagal menyimpan data kendala");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Rekam/Edit Kendala Hambatan</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="space-y-6 py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-primary/5 p-4 rounded-lg">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-5 w-48" />
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-5 w-64" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-32" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="h-6 w-full" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-primary/5 p-4 rounded-lg">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground text-xs uppercase font-semibold">Kementerian/Lembaga</span>
                                    <div className="font-medium mt-1">
                                        {satkerInfo ? `${satkerInfo.kddept} – ${satkerInfo.nmdept}` : data?.kodeSatker || "-"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground text-xs uppercase font-semibold">Satuan Kerja</span>
                                    <div className="font-medium mt-1">
                                        {satkerInfo ? `${satkerInfo.kdsatker} – ${satkerInfo.nmsatker}` : data?.namaSatker || "-"}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Kategori Kendala</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border rounded-lg p-4">
                                    {KENDALA_CATEGORIES.map((cat) => (
                                        <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
                                            <Checkbox
                                                checked={kategori.includes(cat)}
                                                onCheckedChange={() => handleToggleKategori(cat)}
                                            />
                                            <span className="text-sm">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="detilKendala">Detil Kendala</Label>
                                    <Textarea
                                        id="detilKendala"
                                        placeholder="Jelaskan kendala secara mendalam..."
                                        value={detilKendala}
                                        onChange={(e) => setDetilKendala(e.target.value)}
                                        className="min-h-[150px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="detilMasukan">Masukan/Saran</Label>
                                    <Textarea
                                        id="detilMasukan"
                                        placeholder="Berikan masukan atau saran untuk perbaikan..."
                                        value={detilMasukan}
                                        onChange={(e) => setDetilMasukan(e.target.value)}
                                        className="min-h-[150px]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
