"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type SupplierEntityDetailType = "kementerian" | "satker" | "kppn";

export interface SupplierEntityDetailItem {
  code: string;
  name?: string | null;
  extra?: string | null;
  count?: number;
}

interface SupplierEntityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: SupplierEntityDetailType;
  items: SupplierEntityDetailItem[];
}

const TYPE_META: Record<SupplierEntityDetailType | "default", { title: string; description: string }> = {
  kementerian: {
    title: "Detail Kementerian",
    description: "Daftar kementerian yang terkait dengan transaksi supplier ini.",
  },
  satker: {
    title: "Detail Satker",
    description: "Daftar satuan kerja (satker) yang dilayani oleh supplier ini.",
  },
  kppn: {
    title: "Detail KPPN",
    description: "Daftar Kantor Pelayanan Perbendaharaan Negara (KPPN) yang memproses transaksi supplier ini.",
  },
  default: {
    title: "Detail Entitas",
    description: "Informasi entitas terkait supplier ini.",
  },
};

export function SupplierEntityDetailModal({ open, onOpenChange, type, items }: SupplierEntityDetailModalProps) {
  const meta = type ? TYPE_META[type] : TYPE_META.default;
  const PAGE_SIZE = 20;
  const [pageIndex, setPageIndex] = React.useState(0);

  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / PAGE_SIZE);
  const clampedPageIndex = Math.min(pageIndex, totalPages - 1);

  React.useEffect(() => {
    if (!open) {
      setPageIndex(0);
      return;
    }
    setPageIndex((prev) => {
      const maxIndex = totalPages - 1;
      return prev > maxIndex ? Math.max(0, maxIndex) : prev;
    });
  }, [open, totalPages]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [type]);

  const pageItems = React.useMemo(() => {
    if (totalItems === 0) return [] as SupplierEntityDetailItem[];
    const start = clampedPageIndex * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return items.slice(start, end);
  }, [items, clampedPageIndex, totalItems]);

  const startNumber = totalItems === 0 ? 0 : clampedPageIndex * PAGE_SIZE + 1;
  const endNumber = totalItems === 0 ? 0 : Math.min(totalItems, (clampedPageIndex + 1) * PAGE_SIZE);
  const canPrev = clampedPageIndex > 0;
  const canNext = clampedPageIndex < totalPages - 1;

  const handlePrev = () => {
    if (canPrev) setPageIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (canNext) setPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-full max-w-7xl sm:max-w-7xl h-[85vh] flex flex-col overflow-hidden max-h-[90vw] sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {totalItems === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Data belum tersedia untuk ditampilkan.
            </div>
          ) : (
            <div className="flex h-full flex-col overflow-hidden">
              <ScrollArea className="flex-1 pr-4">
                <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {pageItems.map((item) => (
                    <div key={item.code} className="rounded-md border p-3">
                      <div className="text-sm font-semibold">{item.code}</div>
                      {item.name ? <div className="text-xs text-muted-foreground">{item.name}</div> : null}
                      {item.extra ? <div className="text-xs text-muted-foreground">{item.extra}</div> : null}
                      {typeof item.count === "number" ? (
                        <Badge variant="secondary" className="mt-2 w-fit">
                          {item.count.toLocaleString("id-ID")} transaksi
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter className="flex-shrink-0 border-t pt-3 sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {totalItems === 0
              ? "Data belum tersedia untuk ditampilkan."
              : `Menampilkan ${startNumber.toLocaleString("id-ID")}-${endNumber.toLocaleString("id-ID")} dari ${totalItems.toLocaleString("id-ID")}`}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            {totalItems > 0 ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={handlePrev} disabled={!canPrev}>
                  Sebelumnya
                </Button>
                <div className="text-xs text-muted-foreground">
                  Halaman {clampedPageIndex + 1} dari {totalPages.toLocaleString("id-ID")}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleNext} disabled={!canNext}>
                  Selanjutnya
                </Button>
              </>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
