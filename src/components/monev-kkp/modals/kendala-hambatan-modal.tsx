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
import {
    Field,
    FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import { X, Save } from "lucide-react";
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
    const [isMountedReady, setIsMountedReady] = useState(false);
    const [satkerInfo, setSatkerInfo] = useState<{ kddept: string; nmdept: string; kdsatker: string; nmsatker: string } | null>(null);

    // Reset form when modal opens with data
    useEffect(() => {
        if (!open) {
            setKategori([]);
            setDetilKendala("");
            setDetilMasukan("");
            setIsMountedReady(false);
            setSatkerInfo(null);
            return;
        }
        
        // Delay to allow dialog animation to complete
        const timer = setTimeout(() => {
            setIsMountedReady(true);
        }, 300);

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
                    // Use props triwulan/tahun, fallback to data, then to defaults
                    const selectedTriwulan = triwulan || data?.triwulan || "1";
                    const selectedTahun = tahun || data?.tahun || "2026";

                    console.log("Fetching existing kendala with:", { selectedTahun, selectedTriwulan, kodeSatker: data.kodeSatker });

                    const response = await fetch(
                        apiPath(`/monev-kkp/kendala?tahun=${selectedTahun}&triwulan=${selectedTriwulan}&kdsatker=${data.kodeSatker}&_t=${Date.now()}`),
                        {
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (response.ok) {
                        const result = await response.json();
                        if (result.data) {
                            // Parse comma-separated categories if they exist
                            const savedCategories = result.data.kategori_kendala
                                ? result.data.kategori_kendala.split(",").map((c: string) => c.trim()).filter(Boolean)
                                : [];
                            setKategori(savedCategories);
                            setDetilKendala(result.data.detil_kendala || "");
                            setDetilMasukan(result.data.detil_masukan_kendala || "");
                        } else {
                            setKategori([]);
                            setDetilKendala("");
                            setDetilMasukan("");
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

        return () => clearTimeout(timer);
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
            // Use props triwulan/tahun, fallback to data, then to defaults
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
            <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Kendala/Hambatan</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="space-y-6 py-2">
                        {/* Satker Info Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-primary/5 p-4 rounded-lg">
                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase font-semibold">Kementerian/Lembaga</span>
                                <Skeleton className="h-5 w-48 bg-muted-foreground/20 mt-1" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase font-semibold">Satuan Kerja</span>
                                <Skeleton className="h-5 w-64 bg-muted-foreground/20 mt-1" />
                            </div>
                        </div>

                        {/* Kategori Skeleton */}
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32 bg-muted-foreground/20" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 border rounded-lg p-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4 rounded bg-muted-foreground/20" />
                                        <Skeleton className="h-4 flex-1 bg-muted-foreground/10" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detil Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-28 bg-muted-foreground/20" />
                                <Skeleton className="h-[120px] w-full bg-muted-foreground/10" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-28 bg-muted-foreground/20" />
                                <Skeleton className="h-[120px] w-full bg-muted-foreground/10" />
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
                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase font-semibold">Tahun</span>
                                <div className="font-medium mt-1">{tahun || data?.tahun || "2026"}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground text-xs uppercase font-semibold">Triwulan</span>
                                <div className="font-medium mt-1">Triwulan {triwulan || data?.triwulan || "1"}</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Kategori Kendala</Label>
                                {kategori.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setKategori([])}
                                        className="h-8 text-xs text-muted-foreground hover:text-destructive"
                                    >
                                        Bersihkan Pilihan
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border rounded-lg p-4 max-h-[350px] overflow-y-auto">
                                {KENDALA_CATEGORIES.map((cat) => (
                                    <label
                                        key={cat}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded transition-colors"
                                    >
                                        <Checkbox
                                            checked={kategori.includes(cat)}
                                            onCheckedChange={() => handleToggleKategori(cat)}
                                        />
                                        <span className="text-sm select-none">{cat}</span>
                                    </label>
                                ))}
                            </div>
                            {kategori.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {kategori.map((cat) => (
                                        <span
                                            key={cat}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                                        >
                                            {cat}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleKategori(cat)}
                                                className="hover:text-destructive flex items-center"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field className="space-y-2">
                                <FieldLabel htmlFor="detilKendala">Detil Kendala</FieldLabel>
                                <Textarea
                                    id="detilKendala"
                                    placeholder="Masukkan detail kendala..."
                                    value={detilKendala}
                                    onChange={(e) => setDetilKendala(e.target.value)}
                                    rows={5}
                                    className="min-h-[120px] bg-zinc-100 dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-950 transition-colors"
                                />
                            </Field>
                            <Field className="space-y-2">
                                <FieldLabel htmlFor="detilMasukan">Detil Masukan</FieldLabel>
                                <Textarea
                                    id="detilMasukan"
                                    placeholder="Masukkan masukan tambahan..."
                                    value={detilMasukan}
                                    onChange={(e) => setDetilMasukan(e.target.value)}
                                    rows={5}
                                    className="min-h-[120px] bg-zinc-100 dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-950 transition-colors"
                                />
                            </Field>
                        </div>
                    </div>
                )}
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>Menyimpan...</>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Simpan
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
