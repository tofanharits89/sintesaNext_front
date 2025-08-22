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

interface DeleteProyeksiTkdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  onConfirm: () => void;
}

export function DeleteProyeksiTkdModal({
  open,
  onOpenChange,
  data,
  onConfirm,
}: DeleteProyeksiTkdModalProps) {
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
            Apakah Anda yakin ingin menghapus data proyeksi TKD ini? Tindakan
            ini tidak dapat dibatalkan.
          </p>
          {data && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tahun:</span>
                <span className="text-sm font-medium">{data.tahun}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Periode:</span>
                <span className="text-sm font-medium">{data.periode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">KPPN:</span>
                <span
                  className="text-sm font-medium max-w-[250px] truncate"
                  title={data.kppn}
                >
                  {data.kppn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Jenis TKD:
                </span>
                <span className="text-sm font-medium">{data.jenisTkd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Jenis Keperluan:
                </span>
                <span className="text-sm font-medium">
                  {data.jenisKeperluan}
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
