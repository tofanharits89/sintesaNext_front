"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LihatKendalaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any;
}

export function LihatKendalaModal({
    open,
    onOpenChange,
    data,
}: LihatKendalaModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Lihat Kendala/Hambatan</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
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
                                <p className="text-sm font-medium">Kendala dan Hambatan:</p>
                                <div className="p-3 bg-muted/50 rounded-lg min-h-[100px]">
                                    {data.kendala ? (
                                        <p className="text-sm">{data.kendala}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Tidak ada kendala/hambatan yang tercatat.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}