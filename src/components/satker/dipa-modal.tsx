"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, RefreshCw, AlertCircle, ZoomIn, ZoomOut, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { motion, AnimatePresence } from "framer-motion";

type ReactPdfModule = typeof import("react-pdf");

interface DipaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dipaUrl: string | null;
  title?: string;
  tahun?: string;
}

export function DipaModal({ isOpen, onClose, dipaUrl, title = "DIPA Petikan", tahun = "2026" }: DipaModalProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfMod, setPdfMod] = useState<ReactPdfModule | null>(null);
  const [pdfFile, setPdfFile] = useState<{ data: Uint8Array } | null>(null);
  const pdfBufferRef = useRef<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return Math.max(320, Math.min(800, window.innerWidth - 48));
    }
    return 800;
  });
  const [availableHeight, setAvailableHeight] = useState(() => {
    if (typeof window !== "undefined") {
      return Math.max(200, Math.floor(window.innerHeight * 0.9 - 180));
    }
    return 600;
  });
  const [isPageRendered, setIsPageRendered] = useState(false);

  const expectedPdfHeight = availableHeight
    ? Math.floor(availableHeight * scale)
    : undefined;

  const expectedPdfWidth = expectedPdfHeight
    ? Math.floor(expectedPdfHeight * 1.414)
    : undefined;

  const pdfOptions = useMemo(() => ({}), []);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setNumPages(0);
      setError("");
      setIsPageRendered(false);
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
      body: JSON.stringify({ url: dipaUrl, tahun }),
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
  }, [isOpen, dipaUrl, tahun]);

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

  // Track container width and height
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(
          Math.max(320, Math.min(800, Math.floor(entry.contentRect.width - 24)))
        );
        setAvailableHeight(
          Math.max(200, Math.floor(entry.contentRect.height - 24))
        );
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
        className="max-w-7xl sm:max-w-7xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="truncate">{title}</DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="flex-1 min-h-0 flex flex-col items-center justify-start overflow-auto bg-muted/30 p-3 w-full"
        >
          {/* CSS Grid Wrapper: keeps the layout size perfectly stable for both skeleton and PDF */}
          <div className="relative w-full max-w-7xl grid grid-cols-1 grid-rows-1 justify-items-center items-center my-auto">
            {/* Skeleton Overlay: fades out only when both fetching is complete and the first page has successfully rendered */}
            <AnimatePresence>
              {(loading || !isPageRendered) && !error && (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="col-start-1 row-start-1 w-full bg-card border border-border rounded-xl shadow-lg p-6 sm:p-8 space-y-4 animate-pulse min-h-[350px] flex flex-col justify-start z-10 overflow-hidden"
                  style={
                    expectedPdfWidth && expectedPdfHeight
                      ? { width: expectedPdfWidth, height: expectedPdfHeight }
                      : {}
                  }
                >
                  {/* Document Header mockup */}
                  <div className="flex flex-col items-center space-y-3 pb-6 border-b border-border/80">
                    <div className="h-7 bg-muted-foreground/20 rounded w-1/3" />
                    <div className="h-4 bg-muted-foreground/15 rounded w-1/4" />
                    <div className="h-4 bg-muted-foreground/15 rounded w-1/5" />
                  </div>

                  {/* Document Sub-header metadata grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted-foreground/15 rounded w-2/3" />
                      <div className="h-4 bg-muted-foreground/15 rounded w-3/4" />
                      <div className="h-4 bg-muted-foreground/15 rounded w-1/2" />
                    </div>
                    <div className="space-y-3 sm:text-right sm:items-end flex flex-col">
                      <div className="h-4 bg-muted-foreground/15 rounded w-2/3" />
                      <div className="h-4 bg-muted-foreground/15 rounded w-1/2" />
                      <div className="h-4 bg-muted-foreground/15 rounded w-1/3" />
                    </div>
                  </div>

                  {/* Divider lines */}
                  <div className="border-t-2 border-dashed border-border/80 my-4" />

                  {/* Paragraph sections */}
                  <div className="space-y-5 flex-1">
                    <div className="space-y-2">
                      <div className="h-3 bg-muted-foreground/15 rounded w-full" />
                      <div className="h-3 bg-muted-foreground/15 rounded w-[96%]" />
                      <div className="h-3 bg-muted-foreground/15 rounded w-[98%]" />
                      <div className="h-3 bg-muted-foreground/15 rounded w-[92%]" />
                      <div className="h-3 bg-muted-foreground/15 rounded w-[60%]" />
                    </div>

                    <div className="space-y-2 pt-4">
                      <div className="h-3 bg-muted-foreground/15 rounded w-full" />
                      <div className="h-3 bg-muted-foreground/15 rounded w-[94%]" />
                      <div className="h-3 bg-muted-foreground/15 rounded w-[90%]" />
                      <div className="h-3 bg-muted-foreground/15 rounded w-[45%]" />
                    </div>

                    {/* Simulated content block/table */}
                    <div className="border border-border/60 rounded-lg p-4 space-y-3 bg-muted/5 mt-6">
                      <div className="flex justify-between items-center border-b border-border/40 pb-2">
                        <div className="h-3 bg-muted-foreground/15 rounded w-1/4" />
                        <div className="h-3 bg-muted-foreground/15 rounded w-1/6" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-muted-foreground/15 rounded w-1/3" />
                        <div className="h-3 bg-muted-foreground/15 rounded w-[10%]" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-muted-foreground/15 rounded w-1/2" />
                        <div className="h-3 bg-muted-foreground/15 rounded w-[8%]" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {!loading && error && (
              <div className="col-start-1 row-start-1 flex flex-col items-center justify-center flex-1 gap-3 text-red-600 text-center px-6 py-12 z-20">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Loaded PDF block: renders silently in background, then transitions smoothly once rendering finishes */}
            {!loading && !error && pdfMod && pdfFile && (
              <div
                className={cn(
                  "col-start-1 row-start-1 w-full flex justify-center transition-opacity duration-700 ease-out",
                  isPageRendered ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <pdfMod.Document
                  file={pdfFile}
                  options={pdfOptions}
                  onLoadSuccess={({ numPages: n }) => { setNumPages(n); setError(""); }}
                  onLoadError={(err: any) => setError(err?.message || "Gagal merender PDF")}
                  loading={null}
                  error={<div className="p-4 text-sm text-red-600">Gagal merender PDF</div>}
                >
                  <pdfMod.Page
                    pageNumber={pageNumber}
                    {...(availableHeight ? { height: availableHeight } : {})}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onRenderSuccess={() => {
                      setTimeout(() => {
                        setIsPageRendered(true);
                      }, 800);
                    }}
                  />
                </pdfMod.Document>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 flex flex-col sm:grid sm:grid-cols-3 gap-4 sm:gap-0 items-center justify-between w-full border-t border-border/10">
          {/* Left section: Zoom Controls */}
          <div className="flex items-center justify-start gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} title="Perkecil">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.1))} title="Perbesar">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Center section: Page Navigation Controls */}
          <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon" disabled={pageNumber <= 1} onClick={() => setPageNumber((p) => p - 1)} title="Halaman Sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold min-w-[88px] text-center text-foreground/80 tabular-nums">
              {pageNumber} / {numPages || 1}
            </div>
            <Button variant="outline" size="icon" disabled={pageNumber >= numPages} onClick={() => setPageNumber((p) => p + 1)} title="Halaman Selanjutnya">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right section: Action Buttons */}
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            {pdfFile && (
              <Button 
                variant="outline" 
                onClick={handleDownload}
                className="bg-red-700 text-white hover:bg-red-600 hover:text-white border-red-700 hover:border-red-600 cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Unduh PDF
              </Button>
            )}
            <Button onClick={onClose} className="cursor-pointer">
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
