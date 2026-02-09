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

interface KendalaHambatanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any;
}

export function KendalaHambatanModal({
    open,
    onOpenChange,
    data,
}: KendalaHambatanModalProps) {
    const [kendala, setKendala] = useState("");

    // Reset form when modal opens with data
    useEffect(() => {
        if (data) {
            setKendala(data.kendala || "");
        }
    }, [data]);

    const handleSubmit = () => {
        // TODO: API call to save kendala/hambatan
        console.log("Saving kendala:", kendala, "for satker:", data?.kodeSatker);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Kendala/Hambatan</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
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
                        <Label htmlFor="kendala">Kendala dan Hambatan</Label>
                        <Textarea
                            id="kendala"
                            placeholder="Masukkan kendala dan hambatan yang dihadapi..."
                            value={kendala}
                            onChange={(e) => setKendala(e.target.value)}
                            rows={5}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit}>Simpan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
