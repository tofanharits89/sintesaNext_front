"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Maximize2, Minimize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/lib/config/base-path";

interface DipaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dipaUrl: string | null;
  title?: string;
}

export function DipaModal({ isOpen, onClose, dipaUrl, title = "DIPA Petikan" }: DipaModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Build the proxy URL with inline=true so the PDF is rendered inline in the iframe
  const proxyUrl = dipaUrl
    ? apiPath(`/satker/satudja-proxy?url=${encodeURIComponent(dipaUrl)}&inline=true`)
    : null;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIframeError(false);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen) return null;

  const panelClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900"
    : "relative z-10 flex flex-col w-[95vw] max-w-5xl h-[90vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-border";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop (hidden in fullscreen) */}
      {!isFullscreen && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Modal Panel */}
      <div className={panelClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-[#c0392b] text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">{title}</span>
            {dipaUrl && proxyUrl && (
              <a
                href={proxyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
                title="Buka di tab baru"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {dipaUrl && (
              <a
                href={apiPath(`/satker/satudja-proxy?url=${encodeURIComponent(dipaUrl)}`)}
                download
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-white/20 h-8 w-8 text-white"
                title="Unduh PDF"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="text-white hover:bg-white/20 h-8 w-8"
              aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
              title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8"
              aria-label="Tutup modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          {proxyUrl && !iframeError ? (
            <iframe
              src={proxyUrl}
              title={title}
              className="w-full h-full border-0"
              onError={() => setIframeError(true)}
            />
          ) : iframeError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground px-6 text-center">
              <p className="text-sm">Browser tidak dapat menampilkan PDF inline.</p>
              {proxyUrl && (
                <a
                  href={proxyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Unduh PDF
                  </Button>
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Tidak ada URL dokumen PDF.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
