"use client";

import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/lib/config/base-path";

interface PokModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokUrl: string | null;
  title?: string;
}

export function PokModal({ isOpen, onClose, pokUrl, title = "POK" }: PokModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !pokUrl) {
      setHtmlContent("");
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchHtml = async () => {
      setLoading(true);
      setError(null);
      try {
        const proxyUrl = apiPath(
          `/satker/satudja-proxy?url=${encodeURIComponent(pokUrl)}`,
        );
        const response = await fetch(proxyUrl, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();
        if (isMounted) {
          setHtmlContent(text);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Gagal memuat konten POK");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHtml();
    return () => {
      isMounted = false;
    };
  }, [isOpen, pokUrl]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 flex flex-col w-[95vw] max-w-5xl h-[90vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-[#4a6baf] text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">{title}</span>
            {pokUrl && (
              <a
                href={pokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
                title="Buka di tab baru"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8 shrink-0"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-0 bg-white dark:bg-zinc-50">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-[#4a6baf]" />
              <p className="text-sm">Memuat konten POK...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-red-600 px-6 text-center">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setHtmlContent("");
                  // Re-trigger by toggling pokUrl dependency via re-mount trick:
                  // The parent should pass a fresh pokUrl, but we force re-fetch via state
                  if (pokUrl) {
                    setLoading(true);
                    fetch(apiPath(`/satker/satudja-proxy?url=${encodeURIComponent(pokUrl)}`), {
                      credentials: "include",
                    })
                      .then((r) => r.text())
                      .then((t) => { setHtmlContent(t); setLoading(false); })
                      .catch((e) => { setError(e.message); setLoading(false); });
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          )}

          {!loading && !error && htmlContent && (
            <div
              ref={contentRef}
              className="pok-content p-4 text-sm"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
