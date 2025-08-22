"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  data,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Konfirmasi Hapus
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Apakah Anda yakin ingin menghapus data KMK ini? Tindakan ini tidak
            dapat dibatalkan.
          </p>
          {data && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Nomor KMK:
                </span>
                <span className="text-sm font-medium">{data.nomorKmk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uraian:</span>
                <span
                  className="text-sm font-medium max-w-[250px] truncate"
                  title={data.uraian}
                >
                  {data.uraian}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tanggal:</span>
                <span className="text-sm font-medium">
                  {new Date(data.tanggalKmk).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
