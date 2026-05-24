"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils/utils";

type ReactPdfModule = typeof import("react-pdf");

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  title?: string;
  isLandscape?: boolean;
}

export function PdfViewerModal({
  open,
  onOpenChange,
  url,
  title,
  isLandscape = false,
}: PdfViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [availableHeight, setAvailableHeight] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Math.max(200, Math.floor(window.innerHeight * 0.9 - 180));
    }
    return 600;
  });
  const [isLandscapePage, setIsLandscapePage] = useState<boolean>(isLandscape);
  const [pdfMod, setPdfMod] = useState<ReactPdfModule | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfFile, setPdfFile] = useState<{ data: Uint8Array } | null>(null);
  const [isPageRendered, setIsPageRendered] = useState(false);

  // Stable options object — prevents <Document> from re-fetching on every render
  const pdfOptions = useMemo(() => ({}), []);

  // Create stable file object from ArrayBuffer
  const stablePdfFile = useMemo(() => {
    return pdfFile;
  }, [pdfFile]);

  useEffect(() => {
    if (open) {
      setPageNumber(1);
      setNumPages(0);
      setLoadError("");
      setIsPageRendered(false);
      setIsLandscapePage(isLandscape);
    }
  }, [open, url, isLandscape]);


  // Pre-fetch the PDF as a local blob so pdfjs never makes a direct network
  // request. This avoids cross-origin / credential issues with pdfjs's
  // internal XHR transport and gives us a clean error message on failure.
  useEffect(() => {
    if (!open || !url) {
      setPdfData(null);
      setPdfFile(null);
      return;
    }
    let cancelled = false;
    setPdfData(null);
    setPdfFile(null);

    console.log("Fetching PDF via POST proxy to bypass IDM:", url);
    fetch("/api/pdf-proxy", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })
      .then((res) => {
        console.log("PDF proxy response status:", res.status, res.statusText);
        if (!res.ok) {
          // Try to get error details from response
          return res.text().then(text => {
            throw new Error(
              `Gagal memuat PDF (HTTP ${res.status} ${res.statusText}): ${text}`,
            );
          });
        }
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (cancelled) return;
        console.log("PDF array buffer size:", arrayBuffer.byteLength, "bytes");
        if (arrayBuffer.byteLength === 0) {
          throw new Error("PDF content is empty");
        }
        setPdfData(arrayBuffer);
        // Create Uint8Array to prevent detached ArrayBuffer error
        const uint8Array = new Uint8Array(arrayBuffer);
        setPdfFile({ data: uint8Array });
      })
      .catch((err: unknown) => {
        console.error("PDF fetch error:", err);
        if (!cancelled)
          setLoadError(
            (err as any)?.message ||
              "PDF tidak bisa diakses. Periksa file atau sesi login.",
          );
      });

    return () => {
      cancelled = true;
    };
  }, [open, url]);

  const onDocumentLoadSuccess = async (pdf: any) => {
    setNumPages(pdf.numPages || 0);
    setLoadError("");
    try {
      const page = await pdf.getPage(1);
      const [,, w, h] = page.view;
      setIsLandscapePage(w > h);
    } catch (e) {
      console.error("Auto-detect orientation error:", e);
    }
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
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Math.max(320, Math.min(800, window.innerWidth - 48));
    }
    return 800;
  });

  const expectedPdfHeight = availableHeight
    ? Math.floor(availableHeight * scale)
    : undefined;

  const expectedPdfWidth = expectedPdfHeight
    ? Math.floor(isLandscapePage ? expectedPdfHeight * 1.414 : expectedPdfHeight / 1.414)
    : undefined;

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setContainerWidth(
          Math.max(320, Math.min(800, Math.floor(cr.width - 24)))
        );
        setAvailableHeight(
          Math.max(200, Math.floor(cr.height - 24))
        );
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="truncate">
            {title || "Pratinjau PDF"}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="flex-1 min-h-0 flex flex-col items-center justify-start overflow-auto bg-muted/30 p-3 w-full"
        >
          {/* Error Message */}
          {loadError && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-red-600 text-center px-6 py-12 z-20">
              <p className="text-sm font-medium">{loadError}</p>
            </div>
          )}

          {/* No URL Message */}
          {!url && !loadError && (
            <div className="p-4 text-sm text-muted-foreground">
              Tidak ada URL PDF
            </div>
          )}

          {/* PDF Viewer content container with CSS Grid */}
          {url && !loadError && (
            <div className="relative w-full max-w-7xl grid grid-cols-1 grid-rows-1 justify-items-center items-start my-2">
              <AnimatePresence>
                {(!pdfMod || !stablePdfFile || !isPageRendered) && (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="col-start-1 row-start-1 w-full bg-card border border-border rounded-xl shadow-lg p-5 sm:p-6 space-y-6 animate-pulse min-h-[350px] flex flex-col justify-start z-10 overflow-hidden"
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
                        <div className="h-3 bg-muted-foreground/15 rounded w-[60%]" />
                      </div>

                      <div className="space-y-2 pt-4">
                        <div className="h-3 bg-muted-foreground/15 rounded w-[94%]" />
                        <div className="h-3 bg-muted-foreground/15 rounded w-[88%]" />
                        <div className="h-3 bg-muted-foreground/15 rounded w-[45%]" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loaded PDF block: renders silently in background, then transitions smoothly once rendering finishes */}
              {pdfMod && stablePdfFile && (
                <div
                  className={cn(
                    "col-start-1 row-start-1 w-full flex justify-center transition-opacity duration-700 ease-out",
                    isPageRendered ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  <pdfMod.Document
                    file={stablePdfFile}
                    options={pdfOptions}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                    error={
                      <div className="p-4 text-sm text-red-600">
                        Gagal merender PDF
                      </div>
                    }
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
          )}
        </div>
        <DialogFooter className="p-6 pt-4 flex flex-row items-center justify-between sm:justify-between w-full relative">
          {/* Zoom controls on the left */}
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
          </div>

          {/* Page buttons in the center */}
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
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

          {/* Close button on the right */}
          <div className="flex items-center gap-2">
            <Button onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
