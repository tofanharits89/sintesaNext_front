"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteLaporanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemData?: {
    tahun: string;
    jenis: string;
    periode: string;
    uraian: string;
    kppn?: string;
    kanwil?: string;
  };
}

export function DeleteLaporanModal({
  open,
  onOpenChange,
  onConfirm,
  itemData,
}: DeleteLaporanModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Hapus Laporan</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Apakah Anda yakin ingin menghapus laporan ini?
          </p>

          {itemData && (
            <div className="bg-muted p-3 rounded-md space-y-2">
              <div className="text-sm">
                <span className="font-medium">Tahun:</span> {itemData.tahun}
              </div>
              {itemData.kppn && (
                <div className="text-sm">
                  <span className="font-medium">KPPN:</span> {itemData.kppn}
                </div>
              )}
              {itemData.kanwil && (
                <div className="text-sm">
                  <span className="font-medium">Kanwil:</span> {itemData.kanwil}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Jenis:</span> {itemData.jenis}
              </div>
              <div className="text-sm">
                <span className="font-medium">Periode:</span> {itemData.periode}
              </div>
              <div className="text-sm">
                <span className="font-medium">Uraian:</span>
                <span className="block mt-1 text-muted-foreground">
                  {itemData.uraian}
                </span>
              </div>
            </div>
          )}

          <p className="text-sm text-destructive mt-4">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
