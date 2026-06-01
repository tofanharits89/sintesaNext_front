"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X,  Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { PenundaanTable } from "./_penundaan-table";
import { ConfirmationModals } from "@/components/ui/confirmation-modal";
import { useKmkPotongan, RawPotonganItem } from "@/hooks/use-kmk-potongan";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import tkdData from "@/data/kdkppn_tkd.json";

interface DataPenundaanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  kdkanwil?: string | undefined;
  kdkppn?: string | undefined;
}

export function DataPenundaanModal({
  open,
  onOpenChange,
  data,
  kdkanwil,
  kdkppn,
}: DataPenundaanModalProps) {
  const fmtNum = (value: number | string | null | undefined) => {
    const num = Number(value ?? 0);
    return Number.isFinite(num)
      ? num.toLocaleString("id-ID", { maximumFractionDigits: 0 })
      : "0";
  };

  const resolvedNoKmk: string | undefined =
    (data?.no_kmk as string) ??
    (data?.nokmk as string) ??
    (data?.noKmk as string) ??
    (data?.nomorKmk as string);
  const resolvedThang: string | undefined =
    data?.thang != null
      ? String(data.thang)
      : data?.tahun != null
      ? String(data.tahun)
      : undefined;
  const { rows: rawRows, isLoading, error, grandTotal, mutate } = useKmkPotongan(
    resolvedNoKmk,
    resolvedThang,
    open,
    kdkanwil,
    kdkppn
  );

  // Client-side filter fallback for Kanwil/KPPN users
  const rows = useMemo(() => {
    if (!rawRows) return [];
    
    // If KPPN user, filter strictly by kdkppn
    if (kdkppn) {
      const targetKppn = String(kdkppn).trim().padStart(3, '0');
      return rawRows.filter(r => String(r.kdkppn || "").trim().padStart(3, '0') === targetKppn);
    }

    // If Kanwil user, filter by KPPNs belonging to that Kanwil
    if (kdkanwil) {
      const targetKanwil = String(kdkanwil).trim().padStart(2, '0');
      const kppnsInKanwil = new Set(
        (tkdData as any[])
          .filter((d) => String(d.kdkanwil || "").trim().padStart(2, '0') === targetKanwil)
          .map((d) => String(d.kdkppn || "").trim().padStart(3, '0'))
      );
      return rawRows.filter(r => kppnsInKanwil.has(String(r.kdkppn || "").trim().padStart(3, '0')));
    }

    return rawRows;
  }, [rawRows, kdkanwil, kdkppn]);

  // Local state for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return (rows || []).filter((r: any) =>
      (r?.uraian || "").toLowerCase().includes(q)
    );
  }, [rows, searchTerm]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  const paginatedRows = useMemo(
    () => filteredRows.slice(startIndex, endIndex),
    [filteredRows, startIndex, endIndex]
  );

  const handleDelete = async (item: RawPotonganItem) => {
    try {
      const id = item?.id;
      if (!id) throw new Error("ID penundaan tidak ditemukan");

      const headersWithCsrf: HeadersInit = addCsrfToHeaders({ "Content-Type": "application/json" });

      const url = apiPath(`/transfer-daerah/dau/kmk/penundaan/${encodeURIComponent(String(id))}`);
      const resp = await fetch(url, {
        method: "DELETE",
        headers: headersWithCsrf,
        credentials: "include",
      });
      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const j = await resp.json();
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }
      // refresh list
      await mutate();
    } catch (e) {
      console.error("Delete penundaan failed", e);
      alert(`Gagal menghapus data penundaan: ${String((e as any)?.message || e)}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Data Penundaan - {resolvedNoKmk || "-"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 py-3">
          {!resolvedNoKmk || !resolvedThang ? (
            <div className="p-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md">
              Data KMK terpilih tidak memiliki parameter lengkap untuk memuat
              penundaan.
              {!resolvedNoKmk && <span className="ml-1">Missing: no_kmk.</span>}
              {!resolvedThang && (
                <span className="ml-1">Missing: thang/tahun.</span>
              )}
            </div>
          ) : error ? (
            <div className="p-3 text-sm text-red-600">
              {String((error as any)?.message || error)}
            </div>
          ) : isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">
              Memuat data penundaan...
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Input
                  placeholder="Cari uraian..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="max-w-sm"
                />
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <PenundaanTable
                  rows={paginatedRows}
                  renderActions={(r: RawPotonganItem) => (
                    <ConfirmationModals.Delete
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      itemName={`penundaan ${r?.nmpemda || ""}`}
                      onConfirm={() => handleDelete(r)}
                    />
                  )}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2 flex items-center justify-between">
          <div className="w-[72px]" />
          <div className="flex-1 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {total === 0 ? 0 : startIndex + 1} - {endIndex} dari {total}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="w-24"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" /> Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
