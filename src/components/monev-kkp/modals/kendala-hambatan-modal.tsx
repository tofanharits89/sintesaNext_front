"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { addCsrfToHeaders } from "@/utils/csrf-utils";

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
    const [detilMasukan, setDetilMasukan] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Reset form when modal opens with data
    useEffect(() => {
        if (data && open) {
            // Fetch existing kendala data
            const fetchKendala = async () => {
                setIsLoading(true);
                try {
                    // Use props triwulan/tahun, fallback to data, then to defaults
                    const selectedTriwulan = triwulan || data?.triwulan || "1";
                    const selectedTahun = tahun || data?.tahun || "2026";
                    
                    console.log("Fetching existing kendala with:", { selectedTahun, selectedTriwulan, kodeSatker: data.kodeSatker });
                    
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/monev-kkp/kendala?tahun=${selectedTahun}&triwulan=${selectedTriwulan}&kdsatker=${data.kodeSatker}`,
                        {
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (response.ok) {
                        const result = await response.json();
                        if (result.data && result.data.kategori_kendala) {
                            // Parse comma-separated categories
                            const savedCategories = result.data.kategori_kendala.split(",").map((c: string) => c.trim()).filter(Boolean);
                            setKategori(savedCategories);
                            setDetilMasukan(result.data.detil_masukan_kendala || "");
                        } else {
                            setKategori([]);
                            setDetilMasukan("");
                        }
                    }
                } catch (error) {
                    console.error("Error fetching kendala data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchKendala();
        } else if (!open) {
            setKategori([]);
            setDetilMasukan("");
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
            // Use props triwulan/tahun, fallback to data, then to defaults
            const selectedTriwulan = triwulan || data?.triwulan || "1";
            const selectedTahun = tahun || data?.tahun || "2026";
            
            const csrfHeaders = addCsrfToHeaders({ "Content-Type": "application/json" });
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/monev-kkp/kendala`, {
                method: "POST",
                credentials: "include",
                headers: csrfHeaders,
                body: JSON.stringify({
                    tahun: selectedTahun,
                    triwulan: selectedTriwulan,
                    kdsatker: data?.kodeSatker,
                    kdba: data?.kodeBA,
                    kategori_kendala: kategori.join(", "),
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
            <DialogContent className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Edit Kendala/Hambatan</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8 flex-1">
                        <div className="text-sm text-muted-foreground">Memuat data...</div>
                    </div>
                ) : (
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {data && (
                        <div className="p-3 bg-muted rounded-lg space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Kode Satker:</span>
                                <span className="font-medium">{data.kodeSatker}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Nama Satker:</span>
                                <span className="font-medium max-w-[250px] truncate" title={data.namaSatker}>
                                    {data.namaSatker}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Kategori Kendala</Label>
                        <div className="border rounded-md p-4 space-y-2 max-h-[350px] overflow-y-auto">
                            {KENDALA_CATEGORIES.map((cat) => (
                                <label
                                    key={cat}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                                >
                                    <input
                                        type="checkbox"
                                        checked={kategori.includes(cat)}
                                        onChange={() => handleToggleKategori(cat)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{cat}</span>
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
                                            className="hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="detilMasukan">Detil/Masukan</Label>
                        <Textarea
                            id="detilMasukan"
                            placeholder="Masukkan detail atau masukan tambahan..."
                            value={detilMasukan}
                            onChange={(e) => setDetilMasukan(e.target.value)}
                            rows={5}
                            className="resize-none"
                        />
                    </div>
                </div>
                )}
                <DialogFooter className="flex-shrink-0 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
