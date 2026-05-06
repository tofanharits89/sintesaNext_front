"use client";

import { useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PdfProps {
  thang: string;
  dept: string;
  periode: string;
  nmdept?: string | undefined;
  isuData: any[];
  trenData: any[];
  temuanData: any[];
  outputData: any[];
  ikpaData: any[];
  onDone?: () => void;
}

/**
 * PDF export component.
 * Generates a high-quality PDF document using jsPDF and jspdf-autotable.
 */
export default function Pdf({ 
  thang, dept, periode, nmdept,
  isuData, trenData, temuanData, outputData, ikpaData, 
  onDone 
}: PdfProps) {

  const generatePdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const timestamp = format(new Date(), "EEEE, d MMMM yyyy HH:mm", { locale: id });
    const filename = `Profil_Kinerja_${dept}_${thang}_P${periode}.pdf`;

    // ─── Header ──────────────────────────────────────────────────────────────
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PROFIL KINERJA KEMENTERIAN / LEMBAGA", 105, 15, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(nmdept || `Kode Departemen: ${dept}`, 105, 22, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tahun Anggaran: ${thang} | Periode: ${periode}`, 105, 28, { align: "center" });
    doc.text(`Dicetak pada: ${timestamp}`, 105, 33, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(15, 38, 195, 38);

    let currentY = 45;

    // ─── 1. Isu Spesifik ────────────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("I. ISU SPESIFIK PELAKSANAAN ANGGARAN", 15, currentY);
    currentY += 6;

    if (isuData.length > 0) {
      const isuRows = isuData.map((d, i) => [i + 1, d.isu]);
      autoTable(doc, {
        startY: currentY,
        head: [["No", "Deskripsi Isu"]],
        body: isuRows,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 10, halign: "center" } },
        margin: { left: 15, right: 15 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Belum ada data isu spesifik.", 20, currentY);
      currentY += 10;
    }

    // ─── 2. Tren Kinerja ─────────────────────────────────────────────────────
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("II. TREN KINERJA", 15, currentY);
    currentY += 6;

    const trenLabels: Record<string, string> = {
      tren_dukman: "Tren Dukman / Teknis",
      tren_jenbel: "Tren Jenis Belanja",
      tren_bulanan: "Tren Belanja Bulanan",
      tren_sdana: "Tren Sumber Dana",
      tren_uptup: "Tren UP / TUP",
    };

    const trenRows = Object.entries(trenLabels).map(([key, label]) => {
      const val = trenData.find(r => r.tabel === key)?.isu ?? "—";
      return [label, val];
    });

    autoTable(doc, {
      startY: currentY,
      body: trenRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } },
      margin: { left: 15, right: 15 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // ─── 3. Temuan BPK ───────────────────────────────────────────────────────
    if (currentY > 220) { doc.addPage(); currentY = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("III. TEMUAN BPK & TINDAK LANJUT", 15, currentY);
    currentY += 6;

    if (temuanData.length > 0) {
      // Grouping logic for temuan
      const merged = temuanData.reduce<any[]>((acc, curr) => {
        const existing = acc.find(x => x.id_temuan === curr.id_temuan);
        if (existing) existing.isuList.push(curr.isu);
        else acc.push({ ...curr, isuList: [curr.isu] });
        return acc;
      }, []);

      const temuanRows = merged.map((d, i) => [
        i + 1, 
        d.temuan, 
        d.nilai, 
        d.isuList.join("\n")
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["No", "Temuan BPK", "Nilai", "Tindak Lanjut"]],
        body: temuanRows,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 
          0: { cellWidth: 8, halign: "center" },
          2: { cellWidth: 30 },
          3: { cellWidth: 60 }
        },
        margin: { left: 15, right: 15 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Belum ada data temuan BPK.", 20, currentY);
      currentY += 10;
    }

    // ─── 4. Output Utama ─────────────────────────────────────────────────────
    if (currentY > 220) { doc.addPage(); currentY = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("IV. OUTPUT UTAMA BELANJA", 15, currentY);
    currentY += 6;

    if (outputData.length > 0) {
      const outputs = [...new Set(outputData.map(r => r.namaoutput))];
      outputs.forEach((name) => {
        const rows = outputData.filter(r => r.namaoutput === name);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(name || "—", 20, currentY);
        currentY += 4;

        autoTable(doc, {
          startY: currentY,
          head: [["Tahun", "Pagu", "Realisasi", "Persen"]],
          body: rows.map(r => [r.tahun, r.pagu, r.realisasi, r.persen]),
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 1.5 },
          headStyles: { fillColor: [127, 140, 141] },
          margin: { left: 20, right: 15 },
        });
        currentY = (doc as any).lastAutoTable.finalY + 8;
        if (currentY > 260) { doc.addPage(); currentY = 20; }
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Belum ada data output utama.", 20, currentY);
      currentY += 10;
    }

    // ─── 5. Nilai IKPA ───────────────────────────────────────────────────────
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("V. NILAI IKPA", 15, currentY);
    currentY += 6;

    if (ikpaData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [["Tahun", "Periode", "Nilai IKPA"]],
        body: ikpaData.map(d => [d.thang, d.periode, d.nilaiikpa]),
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [39, 174, 96] },
        margin: { left: 15, right: 15 },
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Belum ada data IKPA.", 20, currentY);
    }

    // ─── Footer / Page Numbers ───────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Halaman ${i} dari ${pageCount}`, 195, 285, { align: "right" });
      doc.text("Sintesa - Kementerian Keuangan RI", 15, 285);
    }

    doc.save(filename);
    onDone?.();
  };

  useEffect(() => {
    // Small delay to ensure any dynamic content is settled (though we use raw data here)
    const timer = setTimeout(() => {
      generatePdf();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
      <div className="rounded-xl bg-white p-8 shadow-2xl dark:bg-card">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Menghasilkan Dokumen PDF...</p>
          <p className="text-xs text-muted-foreground italic">
            Silakan tunggu sejenak, dokumen Anda sedang disiapkan.
          </p>
        </div>
      </div>
    </div>
  );
}
