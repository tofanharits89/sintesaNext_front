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

    const Label = ({ children }: { children: React.ReactNode }) => (
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold whitespace-nowrap">
        {children}
      </span>
    );

    const Value = ({ children, title }: { children: React.ReactNode; title?: string }) => (
      <span className="text-sm font-medium text-right line-clamp-2" title={title}>
        {children}
      </span>
    );

    const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
      <div className="flex justify-between items-start gap-4">
        <Label>{label}</Label>
        {children}
      </div>
    );

    // Different preview based on data structure
    if (data.kluster) {
      // Permasalahan/Isu structure
      return (
        <div className="p-4 bg-muted/50 rounded-lg space-y-2 border border-border/50">
          <Row label="Tahun">
            <Value>{data.tahun}</Value>
          </Row>
          <Row label="Kanwil">
            <Value title={data.kanwil || data.nmkanwil}>{data.kanwil || data.nmkanwil}</Value>
          </Row>
          <Row label="Triwulan">
            <Value>{data.triwulan}</Value>
          </Row>
          <Row label="Kluster">
            <Value>{data.kluster}</Value>
          </Row>
          <Row label="Keterangan">
            <Value title={data.keterangan}>{data.keterangan}</Value>
          </Row>
          {data.update && (
            <Row label="Update">
              <Value>{formatDateTime(data.update)}</Value>
            </Row>
          )}
        </div>
      );
    } else if (data.kesimpulan && data.rekomendasi) {
      // Kesimpulan & Rekomendasi structure
      return (
        <div className="p-4 bg-muted/50 rounded-lg space-y-3 border border-border/50">
          <Row label="Tahun">
            <Value>{data.tahun}</Value>
          </Row>
          <Row label="Kanwil">
            <Value title={data.kanwil || data.nmkanwil}>{data.kanwil || data.nmkanwil}</Value>
          </Row>
          <Row label="Triwulan">
            <Value>{data.triwulan}</Value>
          </Row>
          <div className="space-y-1">
            <Label>Kesimpulan</Label>
            <p className="text-sm font-medium leading-relaxed bg-background/50 p-2 rounded border border-border/30">
              {data.kesimpulan}
            </p>
          </div>
          <div className="space-y-1">
            <Label>Rekomendasi</Label>
            <p className="text-sm font-medium leading-relaxed bg-background/50 p-2 rounded border border-border/30">
              {data.rekomendasi}
            </p>
          </div>
          {data.update && (
            <Row label="Update">
              <Value>{formatDateTime(data.update)}</Value>
            </Row>
          )}
        </div>
      );
    } else {
      // Standard structure (Makrokesra, Harga Komoditas, Perkembangan Lainnya)
      return (
        <div className="p-4 bg-muted/50 rounded-lg space-y-2 border border-border/50">
          <Row label="Tahun">
            <Value>{data.tahun}</Value>
          </Row>
          <Row label="Kanwil">
            <Value title={data.kanwil || data.nmkanwil}>{data.kanwil || data.nmkanwil}</Value>
          </Row>
          <Row label="Triwulan">
            <Value>{data.triwulan}</Value>
          </Row>
          {data.indikator && (
            <Row label="Indikator">
              <Value title={data.indikator}>{data.indikator}</Value>
            </Row>
          )}
          {data.satuan && (
            <Row label="Satuan">
              <Value>{data.satuan}</Value>
            </Row>
          )}
          {data.keterangan && (
            <Row label="Keterangan">
              <Value title={data.keterangan}>{data.keterangan}</Value>
            </Row>
          )}
          {data.update && (
            <Row label="Update">
              <Value>{formatDateTime(data.update)}</Value>
            </Row>
          )}
        </div>
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[800px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-2">
          {renderDataPreview()}
        </div>
        
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
