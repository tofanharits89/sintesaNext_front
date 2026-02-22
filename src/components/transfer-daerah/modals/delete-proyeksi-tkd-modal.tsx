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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px] w-[95vw]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Konfirmasi Hapus
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            Apakah Anda yakin ingin menghapus data proyeksi TKD ini? Tindakan
            ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
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
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive !text-white hover:bg-destructive/90 hover:!text-white"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
