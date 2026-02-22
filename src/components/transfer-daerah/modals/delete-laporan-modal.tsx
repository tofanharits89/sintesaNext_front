"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog";
import { AlertTriangle } from "lucide-react";

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
  } | undefined;
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px] w-[95vw]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Konfirmasi Hapus Laporan
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak
            dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {itemData && (
          <div className="py-2">
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tahun:</span>
                <span className="text-sm font-medium">{itemData.tahun}</span>
              </div>
              {itemData.kppn && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">KPPN:</span>
                  <span className="text-sm font-medium">{itemData.kppn}</span>
                </div>
              )}
              {itemData.kanwil && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Kanwil:</span>
                  <span className="text-sm font-medium">{itemData.kanwil}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Jenis:</span>
                <span className="text-sm font-medium">{itemData.jenis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Periode:</span>
                <span className="text-sm font-medium">{itemData.periode}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Uraian:</span>
                <span className="text-sm font-medium max-w-[300px] text-right break-words">
                  {itemData.uraian}
                </span>
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive !text-white hover:bg-destructive/90 hover:!text-white"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
