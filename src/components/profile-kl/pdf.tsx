"use client";

interface PdfProps {
  thang: string;
  dept: string;
  periode: string;
  onDone?: () => void;
}

/**
 * PDF export trigger component.
 * Uses browser print dialog to generate PDF from the current page.
 * Replace with jsPDF/html2canvas implementation if needed.
 */
export default function Pdf({ thang, dept, periode, onDone }: PdfProps) {
  const handlePrint = () => {
    window.print();
    onDone?.();
  };

  // Auto-trigger on mount (mirrors original ExportPDF behaviour)
  if (typeof window !== "undefined") {
    setTimeout(() => {
      handlePrint();
    }, 500);
  }

  return (
    <div className="hidden">
      {/* PDF export placeholder — triggers window.print() */}
      <span>
        {thang}-{dept}-{periode}
      </span>
    </div>
  );
}
