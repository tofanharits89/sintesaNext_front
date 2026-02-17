"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PdfjsViewerIframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  title?: string;
}

// Uses the official PDF.js viewer UI hosted on jsDelivr CDN inside an iframe.
// It receives a file URL (already mapped to backend stream/proxy by useKmkDau)
// and passes it to viewer.html via the `file` query parameter.
export function PdfjsViewerIframeModal({
  open,
  onOpenChange,
  url,
  title,
}: PdfjsViewerIframeModalProps) {
  // Use browser's built-in PDF viewer by loading the PDF URL directly in an iframe.
  // This typically matches the toolbar in your screenshot (Chrome PDF viewer).
  const iframeSrc = useMemo(() => (url ? url : undefined), [url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl sm:max-w-7xl p-0 overflow-hidden flex flex-col h-[92vh] max-h-[90vw] sm:max-h-[90vh]"
        showCloseButton={false}
      >
        <DialogHeader className="p-4 pb-0 border-0">
          <DialogTitle className="truncate">
            {title || (url?.split("/").pop() ?? "Pratinjau PDF")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-muted/30">
          {iframeSrc ? (
            <iframe
              title={title || "PDF"}
              src={iframeSrc}
              className="w-full h-full border-0"
              allow="clipboard-write"
            />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Tidak ada URL PDF
            </div>
          )}
        </div>
        <DialogFooter className="p-4 pt-0 border-0 flex items-center gap-2">
          {url ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.open(url!, "_blank", "noopener,noreferrer")}
            >
              Buka di tab baru
            </Button>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            className="w-24 ml-auto"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PdfjsViewerIframeModal;
