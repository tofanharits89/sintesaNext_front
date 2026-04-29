"use client";

import { PdfViewerModal } from "./pdf-viewer-modal";

interface PdfjsViewerIframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  title?: string;
}

export function PdfjsViewerIframeModal(props: PdfjsViewerIframeModalProps) {
  return <PdfViewerModal {...props} />;
}

export default PdfjsViewerIframeModal;
