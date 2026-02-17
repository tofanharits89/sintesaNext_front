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
  title: string;
  description: string;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  data,
  title,
  description,
  onConfirm,
}: DeleteConfirmModalProps) {
  const renderDataPreview = () => {
    if (!data) return null;

    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Different preview based on data structure
    if (data.kluster) {
      // Permasalahan/Isu structure
      return (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Tahun:</span>
            <span className="text-sm font-medium">{data.tahun}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Kanwil:</span>
            <span
              className="text-sm font-medium max-w-[200px] truncate"
              title={data.kanwil}
            >
              {data.kanwil}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Triwulan:</span>
            <span className="text-sm font-medium">{data.triwulan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Kluster:</span>
            <span className="text-sm font-medium">{data.kluster}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Keterangan:</span>
            <span
              className="text-sm font-medium max-w-[250px] truncate"
              title={data.keterangan}
            >
              {data.keterangan}
            </span>
          </div>
          {data.update && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Update:</span>
              <span className="text-sm font-medium">
                {formatDateTime(data.update)}
              </span>
            </div>
          )}
        </div>
      );
    } else if (data.kesimpulan && data.rekomendasi) {
      // Kesimpulan & Rekomendasi structure
      return (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Tahun:</span>
            <span className="text-sm font-medium">{data.tahun}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Kanwil:</span>
            <span
              className="text-sm font-medium max-w-[200px] truncate"
              title={data.kanwil}
            >
              {data.kanwil}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Triwulan:</span>
            <span className="text-sm font-medium">{data.triwulan}</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Kesimpulan:</span>
            <p
              className="text-sm font-medium max-w-full truncate"
              title={data.kesimpulan}
            >
              {data.kesimpulan}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Rekomendasi:</span>
            <p
              className="text-sm font-medium max-w-full truncate"
              title={data.rekomendasi}
            >
              {data.rekomendasi}
            </p>
          </div>
          {data.update && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Update:</span>
              <span className="text-sm font-medium">
                {formatDateTime(data.update)}
              </span>
            </div>
          )}
        </div>
      );
    } else {
      // Standard structure (Makrokesra, Harga Komoditas, Perkembangan Lainnya)
      return (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Tahun:</span>
            <span className="text-sm font-medium">{data.tahun}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Kanwil:</span>
            <span
              className="text-sm font-medium max-w-[200px] truncate"
              title={data.kanwil}
            >
              {data.kanwil}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Triwulan:</span>
            <span className="text-sm font-medium">{data.triwulan}</span>
          </div>
          {data.indikator && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Indikator:</span>
              <span
                className="text-sm font-medium max-w-[200px] truncate"
                title={data.indikator}
              >
                {data.indikator}
              </span>
            </div>
          )}
          {data.satuan && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Satuan:</span>
              <span className="text-sm font-medium">{data.satuan}</span>
            </div>
          )}
          {data.keterangan && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Keterangan:</span>
              <span
                className="text-sm font-medium max-w-[250px] truncate"
                title={data.keterangan}
              >
                {data.keterangan}
              </span>
            </div>
          )}
          {data.update && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Update:</span>
              <span className="text-sm font-medium">
                {formatDateTime(data.update)}
              </span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          {renderDataPreview()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
