import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TpgData, BosBopData } from "../dnf-types";

interface TableTPGProps {
  data: TpgData[];
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
}

export const TableTPG: React.FC<TableTPGProps> = ({
  data,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-base font-semibold">
        Hasil Data TPG ({data.length.toLocaleString("id-ID")} baris)
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center rounded-md px-4 py-2 bg-zinc-800">
        <span className="text-white text-sm">
          Halaman {currentPage} dari {Math.ceil(data.length / itemsPerPage) || 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-white border-zinc-600 hover:bg-zinc-700"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-white border-zinc-600 hover:bg-zinc-700"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= Math.ceil(data.length / itemsPerPage)}
          >
            Berikutnya →
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-zinc-800 overflow-auto max-h-[600px]">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "2200px", backgroundColor: "#1e293b", color: "#f8fafc" }}>
          <thead className="sticky top-0 z-1 bg-[#1e293b] shadow-[0_2px_2px_-1px_rgba(0,0,0,0.4)]">
            <tr>
              <th className="border border-zinc-700 p-2 text-left" style={{ width: "40px" }}>No</th>
              <th className="border border-zinc-700 p-2 text-left">Tahun</th>
              <th className="border border-zinc-700 p-2 text-left">Periode</th>
              <th className="border border-zinc-700 p-2 text-left">Kanwil</th>
              <th className="border border-zinc-700 p-2 text-left">Nama Kanwil</th>
              <th className="border border-zinc-700 p-2 text-left">KPPN</th>
              <th className="border border-zinc-700 p-2 text-left">Nama KPPN</th>
              <th className="border border-zinc-700 p-2 text-left">Lokasi</th>
              <th className="border border-zinc-700 p-2 text-left">Jenis TKD</th>
              {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m) => (
                <th key={m} className="border border-zinc-700 p-2 text-left" style={{ minWidth: "90px" }}>{m}</th>
              ))}
              <th className="border border-zinc-700 p-2 text-left" style={{ minWidth: "120px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((row, i) => (
                <tr key={i} className="hover:bg-zinc-700/50">
                  <td className="border border-zinc-700 p-2">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                  <td className="border border-zinc-700 p-2">{row.thang}</td>
                  <td className="border border-zinc-700 p-2">{row.nm_periode}</td>
                  <td className="border border-zinc-700 p-2">{row.kode_kanwil}</td>
                  <td className="border border-zinc-700 p-2">{row.nm_kanwil}</td>
                  <td className="border border-zinc-700 p-2">{row.kppn}</td>
                  <td className="border border-zinc-700 p-2">{row.nm_kppn}</td>
                  <td className="border border-zinc-700 p-2">{row.nm_lokasi}</td>
                  <td className="border border-zinc-700 p-2">{row.jenis_tkd}</td>
                  {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m) => (
                    <td key={m} className="border border-zinc-700 p-2 text-right">
                      {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                    </td>
                  ))}
                  <td className="border border-zinc-700 p-2 text-right font-bold">
                    {new Intl.NumberFormat("id-ID").format(row.total_setahun || 0)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

interface TableBosBopProps {
  data: BosBopData[];
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
}

export const TableBosBop: React.FC<TableBosBopProps> = ({
  data,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-base font-semibold">
        Hasil Data BOS / BOP ({data.length.toLocaleString("id-ID")} baris)
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center rounded-md px-4 py-2 bg-zinc-800">
        <span className="text-white text-sm">
          Halaman {currentPage} dari {Math.ceil(data.length / itemsPerPage) || 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-white border-zinc-600 hover:bg-zinc-700"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-white border-zinc-600 hover:bg-zinc-700"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= Math.ceil(data.length / itemsPerPage)}
          >
            Berikutnya →
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-zinc-800 overflow-auto max-h-[600px]">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "2600px", backgroundColor: "#1e293b", color: "#f8fafc" }}>
          <thead className="sticky top-0 z-1 bg-[#1e293b] shadow-[0_2px_2px_-1px_rgba(0,0,0,0.4)]">
            <tr>
              <th className="border border-zinc-700 p-2 text-left" style={{ width: "40px" }}>No</th>
              <th className="border border-zinc-700 p-2 text-left">Tahun</th>
              <th className="border border-zinc-700 p-2 text-left">Kanwil</th>
              <th className="border border-zinc-700 p-2 text-left">Nama Kanwil</th>
              <th className="border border-zinc-700 p-2 text-left">KPPN</th>
              <th className="border border-zinc-700 p-2 text-left">Nama KPPN</th>
              <th className="border border-zinc-700 p-2 text-left">Program</th>
              <th className="border border-zinc-700 p-2 text-left">Jenjang</th>
              <th className="border border-zinc-700 p-2 text-left">Status</th>
              <th className="border border-zinc-700 p-2 text-left">Jenis BOS</th>
              <th className="border border-zinc-700 p-2 text-left">Lokasi</th>
              {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m) => (
                <th key={m} className="border border-zinc-700 p-2 text-left" style={{ minWidth: "90px" }}>{m}</th>
              ))}
              <th className="border border-zinc-700 p-2 text-left" style={{ minWidth: "120px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((row, i) => (
                <tr key={i} className="hover:bg-zinc-700/50">
                  <td className="border border-zinc-700 p-2">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                  <td className="border border-zinc-700 p-2">{row.thang}</td>
                  <td className="border border-zinc-700 p-2">{row.kdkanwil}</td>
                  <td className="border border-zinc-700 p-2">{row.nmkanwil}</td>
                  <td className="border border-zinc-700 p-2">{row.kdkppn}</td>
                  <td className="border border-zinc-700 p-2">{row.nmkabkota_kppn}</td>
                  <td className="border border-zinc-700 p-2">{row.nmprogram}</td>
                  <td className="border border-zinc-700 p-2">{row.jenjang}</td>
                  <td className="border border-zinc-700 p-2">{row.status_sekolah}</td>
                  <td className="border border-zinc-700 p-2">{row.jenis_bos}</td>
                  <td className="border border-zinc-700 p-2">{row.nmkabkota_sekolah}</td>
                  {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m) => (
                    <td key={m} className="border border-zinc-700 p-2 text-right">
                      {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                    </td>
                  ))}
                  <td className="border border-zinc-700 p-2 text-right font-bold">
                    {new Intl.NumberFormat("id-ID").format(row.total_nilai || 0)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
