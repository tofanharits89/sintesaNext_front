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
import { AlertTriangle, Trash2 } from "lucide-react";

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[800px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Konfirmasi Hapus
          </AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus data KMK ini? Tindakan ini tidak
            dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {data && (
          <div className="py-2">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 border border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Nomor KMK
                </span>
                <span className="text-sm font-medium">{data.nomorKmk}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold whitespace-nowrap">
                  Uraian
                </span>
                <span
                  className="text-sm font-medium text-right line-clamp-2"
                  title={data.uraian}
                >
                  {data.uraian}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Tanggal
                </span>
                <span className="text-sm font-medium">
                  {new Date(data.tanggalKmk).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
