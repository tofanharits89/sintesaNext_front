"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, RefreshCw, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";

type ReactPdfModule = typeof import("react-pdf");

interface DipaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dipaUrl: string | null;
  title?: string;
}

export function DipaModal({ isOpen, onClose, dipaUrl, title = "DIPA Petikan" }: DipaModalProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [pdfMod, setPdfMod] = useState<ReactPdfModule | null>(null);
  const [pdfFile, setPdfFile] = useState<{ data: Uint8Array } | null>(null);
  const pdfBufferRef = useRef<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const pdfOptions = useMemo(() => ({}), []);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setNumPages(0);
      setError("");
    }
  }, [isOpen, dipaUrl]);

  // Fetch PDF binary via POST (IDM only intercepts GET requests)
  useEffect(() => {
    if (!isOpen || !dipaUrl) {
      setPdfFile(null);
      pdfBufferRef.current = null;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setPdfFile(null);
    pdfBufferRef.current = null;

    const url = "/api/satudja-pdf";

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: dipaUrl }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (cancelled) return;
        if (!buf || buf.byteLength === 0) throw new Error("File kosong");
        const magic = String.fromCharCode(...new Uint8Array(buf.slice(0, 4)));
        if (magic !== "%PDF") {
          throw new Error("Sesi SatuDJA expired. Refresh halaman dan coba lagi.");
        }
        pdfBufferRef.current = buf.slice(0);
        setPdfFile({ data: new Uint8Array(buf) });
      })
      .catch((err) => { if (!cancelled) setError(err?.message || "Gagal memuat PDF"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isOpen, dipaUrl]);

  // Lazy load react-pdf
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("react-pdf");
        mod.pdfjs.GlobalWorkerOptions.workerSrc = "/api/pdfjs-worker";
        if (!cancelled) setPdfMod(mod as ReactPdfModule);
      } catch {
        if (!cancelled) setError("Penampil PDF gagal dimuat.");
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Track container width
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.max(320, Math.floor(entry.contentRect.width - 24)));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  const handleDownload = () => {
    if (!pdfBufferRef.current) return;
    const blob = new Blob([pdfBufferRef.current], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "DIPA").replace(/[\\/:*?"<>|]/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="truncate">{title}</DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-auto bg-muted/30 p-3"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Memuat PDF...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-red-600 text-center px-6">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && pdfMod && pdfFile && (
            <pdfMod.Document
              file={pdfFile}
              options={pdfOptions}
              onLoadSuccess={({ numPages: n }) => { setNumPages(n); setError(""); }}
              onLoadError={(err: any) => setError(err?.message || "Gagal merender PDF")}
              loading={<div className="p-4">Memuat PDF...</div>}
              error={<div className="p-4 text-sm text-red-600">Gagal merender PDF</div>}
            >
              <pdfMod.Page
                pageNumber={pageNumber}
                {...(containerWidth ? { width: containerWidth } : {})}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </pdfMod.Document>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={pageNumber <= 1} onClick={() => setPageNumber((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[88px] text-center">
              {pageNumber} / {numPages || 1}
            </div>
            <Button variant="outline" size="icon" disabled={pageNumber >= numPages} onClick={() => setPageNumber((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            {pdfFile && (
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Unduh
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
