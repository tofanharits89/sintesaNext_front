"use client";

import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Skeleton } from "@/components/ui/skeleton";

export interface ProgresMbgHandle {
  load: () => Promise<void>;
  exportExcel: () => void;
}

interface ProgresMbgProps {
  tglAwal?: string;
  tglAkhir?: string;
}

const fmtT = (val: number | null | undefined) => {
  if (val == null) return "-";
  return val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtNum = (val: number | null | undefined) => {
  if (val == null) return "-";
  return val.toLocaleString("id-ID");
};

const ProgresMbg = forwardRef<ProgresMbgHandle, ProgresMbgProps>(({ tglAwal, tglAkhir }, ref) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    tabel1: any[];
    tabel2: any[];
    tabel3: any[];
    tabel4: any[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tglAwal) params.append("tglAwal", tglAwal);
      if (tglAkhir) params.append("tglAkhir", tglAkhir);

      const res = await http.get(apiPath(`/weekly/progres-mbg?${params.toString()}`));
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        toast.error(res.data?.message || "Gagal mengambil data Progres MBG");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tglAwal, tglAkhir]);

  useImperativeHandle(ref, () => ({
    load: fetchData,
    exportExcel: () => {
      if (!data) return;
      
      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(data.tabel1);
      XLSX.utils.book_append_sheet(wb, ws1, "Per Program");

      const ws2 = XLSX.utils.json_to_sheet(data.tabel2);
      XLSX.utils.book_append_sheet(wb, ws2, "Per Fungsi");

      const ws3 = XLSX.utils.json_to_sheet(data.tabel3);
      XLSX.utils.book_append_sheet(wb, ws3, "Per Jenis Belanja");

      const ws4 = XLSX.utils.json_to_sheet(data.tabel4);
      XLSX.utils.book_append_sheet(wb, ws4, "Belanja per Program");

      XLSX.writeFile(wb, `Progres_MBG_${tglAkhir || "latest"}.xlsx`);
    },
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      {/* Kolom Kiri: Tabel 1, 2, 3 */}
      <div className="space-y-6">
        
        {/* TABEL 1: Pagu dan Realisasi per Program */}
        <div className="overflow-x-auto rounded-lg border">
          <div className="bg-[#0a829f] text-white text-center font-bold py-2 text-sm border-b">
            Pagu dan Realisasi per Program
          </div>
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-[#126b8a] text-white">
              <tr>
                <th className="p-2 border font-medium text-left">Program</th>
                <th className="p-2 border font-medium">Pagu</th>
                <th className="p-2 border font-medium">Real s.d.<br/>W-1</th>
                <th className="p-2 border font-medium">% W-1</th>
                <th className="p-2 border font-medium">Real<br/>Pekan ini</th>
                <th className="p-2 border font-medium">% Pekan ini</th>
                <th className="p-2 border font-medium">Real s.d.<br/>Pekan ini</th>
                <th className="p-2 border font-medium">% s.d.<br/>Pekan ini</th>
              </tr>
            </thead>
            <tbody>
              {data.tabel1.map((row, idx) => (
                <tr key={idx} className={row.Program === 'Total' ? "font-bold bg-muted/50" : "hover:bg-muted/30"}>
                  <td className="p-2 border text-left">{row.Program}</td>
                  <td className="p-2 border">{fmtT(row.Pagu)}</td>
                  <td className="p-2 border">{fmtT(row['Real s.d. W-1'])}</td>
                  <td className="p-2 border">{fmtT(row['% W-1'])}%</td>
                  <td className="p-2 border">{fmtT(row['Real Pekan ini'])}</td>
                  <td className="p-2 border">{fmtT(row['% Pekan ini'])}%</td>
                  <td className="p-2 border">{fmtT(row['Real s.d. Pekan ini'])}</td>
                  <td className="p-2 border">{fmtT(row['% s.d. Pekan ini'])}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABEL 2: Pagu dan Realisasi per Fungsi */}
        <div className="overflow-x-auto rounded-lg border">
          <div className="bg-[#0fbc9c] text-white text-center font-bold py-2 text-sm border-b">
            Pagu dan Realisasi per Fungsi
          </div>
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-[#13a88c] text-white">
              <tr>
                <th className="p-2 border font-medium text-left">Fungsi</th>
                <th className="p-2 border font-medium">Pagu</th>
                <th className="p-2 border font-medium">Real s.d.<br/>W-1</th>
                <th className="p-2 border font-medium">% W-1</th>
                <th className="p-2 border font-medium">Real<br/>Pekan ini</th>
                <th className="p-2 border font-medium">% Pekan ini</th>
                <th className="p-2 border font-medium">Real s.d.<br/>Pekan ini</th>
                <th className="p-2 border font-medium">% s.d.<br/>Pekan ini</th>
              </tr>
            </thead>
            <tbody>
              {data.tabel2.map((row, idx) => (
                <tr key={idx} className={row.Fungsi === 'Total' ? "font-bold bg-muted/50" : "hover:bg-muted/30"}>
                  <td className="p-2 border text-left">{row.Fungsi}</td>
                  <td className="p-2 border">{fmtT(row.Pagu)}</td>
                  <td className="p-2 border">{fmtT(row['Real s.d. W-1'])}</td>
                  <td className="p-2 border">{fmtT(row['% W-1'])}%</td>
                  <td className="p-2 border">{fmtT(row['Real Pekan ini'])}</td>
                  <td className="p-2 border">{fmtT(row['% Pekan ini'])}%</td>
                  <td className="p-2 border">{fmtT(row['Real s.d. Pekan ini'])}</td>
                  <td className="p-2 border">{fmtT(row['% s.d. Pekan ini'])}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABEL 3: Pagu dan Realisasi per Jenis Belanja */}
        <div className="overflow-x-auto rounded-lg border">
          <div className="bg-[#fbc05c] text-black text-center font-bold py-2 text-sm border-b">
            Pagu dan Realisasi per Jenis Belanja
          </div>
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-[#f3ad3b] text-black">
              <tr>
                <th className="p-2 border font-medium text-left">Jenis Belanja</th>
                <th className="p-2 border font-medium">Pagu</th>
                <th className="p-2 border font-medium">Real s.d.<br/>W-1</th>
                <th className="p-2 border font-medium">% W-1</th>
                <th className="p-2 border font-medium">Real<br/>Pekan ini</th>
                <th className="p-2 border font-medium">% Pekan ini</th>
                <th className="p-2 border font-medium">Real s.d.<br/>Pekan ini</th>
                <th className="p-2 border font-medium">% s.d.<br/>Pekan ini</th>
              </tr>
            </thead>
            <tbody>
              {data.tabel3.map((row, idx) => (
                <tr key={idx} className={row['Jenis Belanja'] === 'Total' ? "font-bold bg-muted/50" : "hover:bg-muted/30"}>
                  <td className="p-2 border text-left">{row['Jenis Belanja']}</td>
                  <td className="p-2 border">{fmtT(row.Pagu)}</td>
                  <td className="p-2 border">{fmtT(row['Real s.d. W-1'])}</td>
                  <td className="p-2 border">{fmtT(row['% W-1'])}%</td>
                  <td className="p-2 border">{fmtT(row['Real Pekan ini'])}</td>
                  <td className="p-2 border">{fmtT(row['% Pekan ini'])}%</td>
                  <td className="p-2 border">{fmtT(row['Real s.d. Pekan ini'])}</td>
                  <td className="p-2 border">{fmtT(row['% s.d. Pekan ini'])}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Kolom Kanan: Tabel 4 */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs text-right border-collapse">
          <thead className="bg-[#126b8a] text-white">
            <tr>
              <th className="p-2 border font-medium text-left">Belanja per Program</th>
              <th className="p-2 border font-medium">Pagu<br/>(Miliar)</th>
              <th className="p-2 border font-medium">Real s.d.<br/>Pekan ini</th>
              <th className="p-2 border font-medium">Real<br/>Pekan ini</th>
              <th className="p-2 border font-medium">% Pekan<br/>ini</th>
              <th className="p-2 border font-medium">Jlh Penerima<br/>s.d. Pekan ini</th>
            </tr>
            <tr className="bg-gray-100 text-gray-800 text-center text-[10px]">
              <td className="p-1 border">a</td>
              <td className="p-1 border">b</td>
              <td className="p-1 border">c</td>
              <td className="p-1 border">d</td>
              <td className="p-1 border">e = d/b</td>
              <td className="p-1 border">f</td>
            </tr>
          </thead>
          <tbody>
            {data.tabel4.map((row, idx) => {
              const uraian = row['Belanja per Program'];
              const isHeaderRow = ["Pemenuhan Gizi Nasional", "Sub MBG (Banper)", "Dukungan Manajemen", "Total"].includes(uraian);
              
              let bgClass = "hover:bg-muted/30";
              let textClass = "";
              let paddingLeft = "p-2";
              
              if (uraian === "Pemenuhan Gizi Nasional") {
                bgClass = "bg-[#0fbc9c] font-bold text-white hover:bg-[#13a88c]";
              } else if (uraian === "Dukungan Manajemen" || uraian === "Sub MBG (Banper)") {
                bgClass = "bg-[#f3ad3b] font-bold text-black hover:bg-[#e69f32]";
              } else if (uraian === "Total") {
                bgClass = "bg-[#126b8a] font-bold text-white hover:bg-[#0a829f]";
              } else {
                paddingLeft = "pl-6 p-2";
              }

              return (
                <tr key={idx} className={bgClass}>
                  <td className={paddingLeft + " border text-left"}>{uraian}</td>
                  <td className="p-2 border">{fmtT(row['Pagu (Miliar)'])}</td>
                  <td className="p-2 border">{fmtT(row['Real s.d. Pekan ini'])}</td>
                  <td className="p-2 border">{fmtT(row['Real Pekan ini'])}</td>
                  <td className="p-2 border">{fmtT(row['% Pekan ini'])}%</td>
                  <td className="p-2 border">{fmtNum(row['Jlh Penerima s.d. Pekan ini'])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ProgresMbg.displayName = "ProgresMbg";
export default ProgresMbg;
