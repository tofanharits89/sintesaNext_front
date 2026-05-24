import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X,  Database } from "lucide-react";
import Swal from "sweetalert2";

interface PrognosisSQLModalProps {
    showModalSQL: boolean;
    setShowModalSQL: (val: boolean) => void;
    sqlQuery: string;
}

export const PrognosisSQLModal = ({
    showModalSQL,
    setShowModalSQL,
    sqlQuery
}: PrognosisSQLModalProps) => {
    return (
        <Dialog open={showModalSQL} onOpenChange={setShowModalSQL}>
            <DialogContent showCloseButton={false} className="max-w-4xl w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        SQL Query Preview
                    </DialogTitle>
                </DialogHeader>
                <div className="bg-zinc-950 p-6 rounded-lg font-mono text-xs text-emerald-400 overflow-auto max-h-[400px] border whitespace-pre-wrap leading-relaxed">
                    {sqlQuery || "-- Belum ada query digenerate. Klik 'Tayang' terlebih dahulu."}
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setShowModalSQL(false)}>
                        <X className="h-4 w-4 mr-2" /> Tutup
                    </Button>
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(sqlQuery);
                            Swal.fire({
                                icon: 'success',
                                title: 'Copied!',
                                timer: 1000,
                                showConfirmButton: false,
                            });
                        }}
                    >
                        Salin Query
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
