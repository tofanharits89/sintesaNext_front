"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

type ReactPdfModule = typeof import("react-pdf");

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  title?: string;
}

export function PdfViewerModal({
  open,
  onOpenChange,
  url,
  title,
}: PdfViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [pdfMod, setPdfMod] = useState<ReactPdfModule | null>(null);
  const [loadError, setLoadError] = useState<string>("");

  useEffect(() => {
    if (open) {
      setPageNumber(1);
      setNumPages(0);
      setLoadError("");
    }
  }, [open, url]);

  const onDocumentLoadSuccess = ({
    numPages: nextNumPages,
  }: {
    numPages: number;
  }) => {
    setNumPages(nextNumPages || 0);
    setLoadError("");
  };
  const onDocumentLoadError = (err: any) => {
    console.error("PDF load error", err);
    setLoadError(
      err?.message || "PDF tidak bisa dimuat. Periksa file atau sesi login.",
    );
  };

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < numPages;

  // Dynamically import react-pdf on client only
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Only load when modal is opened to save work
      if (!open) return;
      try {
        const mod = await import("react-pdf");
        mod.pdfjs.GlobalWorkerOptions.workerSrc = "/api/pdfjs-worker";
        if (!cancelled) setPdfMod(mod as ReactPdfModule);
      } catch (e) {
        console.error("Failed to load react-pdf", e);
        if (!cancelled) {
          setLoadError("Penampil PDF gagal dimuat.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setContainerWidth(Math.max(320, Math.floor(cr.width - 24)));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] w-[95vw] max-w-7xl flex-col overflow-hidden p-0 sm:max-w-7xl"
      >
        <DialogHeader className="border-b p-4 pb-2">
          <DialogTitle className="truncate">
            {title || "Pratinjau PDF"}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-auto bg-muted/30 p-3"
        >
          {!url ? (
            <div className="p-4 text-sm text-muted-foreground">
              Tidak ada URL PDF
            </div>
          ) : !pdfMod ? (
            <div className="p-4">Memuat penampil PDF...</div>
          ) : (
            <pdfMod.Document
              file={url}
              options={{ withCredentials: true }}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="p-4">Memuat PDF...</div>}
              error={
                <div className="p-4 text-sm text-red-600">
                  {loadError || "Gagal memuat PDF"}
                </div>
              }
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
        <DialogFooter className="border-t p-4 pt-2 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={!canPrev}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[88px] text-center">
              {pageNumber} / {numPages || 1}
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={!canNext}
              onClick={() =>
                setPageNumber((p) => Math.min(numPages || 1, p + 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((s) => Math.min(3, s + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
