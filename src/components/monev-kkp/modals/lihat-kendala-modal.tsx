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
import { apiPath } from "@/lib/config/base-path";

interface LihatKendalaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any;
    tahun?: string;
    triwulan?: string;
}

export function LihatKendalaModal({
    open,
    onOpenChange,
    data,
    tahun,
    triwulan,
}: LihatKendalaModalProps) {
    const [kendalaData, setKendalaData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (data && open) {
            const fetchKendala = async () => {
                setIsLoading(true);
                try {
                    // Use props triwulan/tahun, fallback to data, then to defaults
                    const selectedTriwulan = triwulan || data?.triwulan || "1";
                    const selectedTahun = tahun || data?.tahun || "2026";
                    
                    console.log("Fetching kendala with:", { selectedTahun, selectedTriwulan, kodeSatker: data.kodeSatker });
                    
                    const response = await fetch(
                        apiPath(`/monev-kkp/kendala?tahun=${selectedTahun}&triwulan=${selectedTriwulan}&kdsatker=${data.kodeSatker}`),
                        {
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (response.ok) {
                        const result = await response.json();
                        setKendalaData(result.data);
                    }
                } catch (error) {
                    console.error("Error fetching kendala data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchKendala();
        } else if (!open) {
            setKendalaData(null);
        }
    }, [data, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl flex flex-col overflow-hidden max-h-[90vw] sm:max-h-[90vh]">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Lihat Kendala/Hambatan</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8 flex-1">
                        <div className="text-sm text-muted-foreground">Memuat data...</div>
                    </div>
                ) : (
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {data && (
                        <>
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
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Kategori Kendala:</p>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    {kendalaData?.kategori_kendala ? (
                                        <div className="flex flex-wrap gap-2">
                                            {kendalaData.kategori_kendala.split(",").map((cat: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                                                >
                                                    {cat.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Tidak ada kategori kendala yang tercatat.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Detil/Masukan:</p>
                                <div className="p-3 bg-muted/50 rounded-lg min-h-[100px]">
                                    {kendalaData?.detil_masukan_kendala ? (
                                        <p className="text-sm">{kendalaData.detil_masukan_kendala}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Tidak ada detail/masukan yang tercatat.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                )}
                <DialogFooter className="flex-shrink-0 mt-4">
                    <Button onClick={() => onOpenChange(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
