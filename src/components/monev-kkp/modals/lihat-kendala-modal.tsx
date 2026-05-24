"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
    const [satkerInfo, setSatkerInfo] = useState<{ kddept: string; nmdept: string; kdsatker: string; nmsatker: string } | null>(null);

    useEffect(() => {
        if (data && open) {
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

            const fetchKendala = async () => {
                setIsLoading(true);
                try {
                    // Use props triwulan/tahun, fallback to data, then to defaults
                    const selectedTriwulan = triwulan || data?.triwulan || "1";
                    const selectedTahun = tahun || data?.tahun || "2026";

                    console.log("Fetching kendala with:", { selectedTahun, selectedTriwulan, kodeSatker: data.kodeSatker });

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
                        setKendalaData(result.data);
                    }
                } catch (error) {
                    console.error("Error fetching kendala data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchSatkerInfo();
            fetchKendala();
        } else if (!open) {
            setKendalaData(null);
            setSatkerInfo(null);
        }
    }, [data, open, tahun, triwulan]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0"
            >
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Lihat Kendala/Hambatan</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
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
                                <Skeleton className="h-20 w-full bg-muted-foreground/10 rounded-lg" />
                            </div>

                            {/* Detil Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-28 bg-muted-foreground/20" />
                                    <Skeleton className="h-[100px] w-full bg-muted-foreground/10 rounded-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-28 bg-muted-foreground/20" />
                                    <Skeleton className="h-[100px] w-full bg-muted-foreground/10 rounded-lg" />
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
                                <p className="text-sm font-medium">Kategori Kendala:</p>
                                <div className="p-3 bg-primary/5 rounded-lg">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Detil Kendala:</p>
                                    <div className="p-3 bg-primary/5 rounded-lg min-h-[100px]">
                                        {kendalaData?.detil_kendala ? (
                                            <p className="text-sm">{kendalaData.detil_kendala}</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">
                                                Tidak ada detail kendala yang tercatat.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Detil Masukan:</p>
                                    <div className="p-3 bg-primary/5 rounded-lg min-h-[100px]">
                                        {kendalaData?.detil_masukan_kendala ? (
                                            <p className="text-sm">{kendalaData.detil_masukan_kendala}</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">
                                                Tidak ada detail masukan yang tercatat.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
                    <Button onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-2" /> Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
