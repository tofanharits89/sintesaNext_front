import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DakFisikData } from "./types";

interface DakFisikTableProps {
  tableData: DakFisikData[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

export const DakFisikTable: React.FC<DakFisikTableProps> = ({
  tableData,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  const totalPages = Math.ceil(tableData.length / itemsPerPage) || 1;
  const currentData = tableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="results-section space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">
            Hasil Data ({tableData.length.toLocaleString("id-ID")} baris)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex justify-between items-center rounded-md px-4 py-2 bg-zinc-800">
            <span className="text-white text-sm">
              Halaman {currentPage} dari {totalPages}
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
                disabled={currentPage >= totalPages}
              >
                Berikutnya →
              </Button>
            </div>
          </div>

          <div
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "600px",
              display: "block",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
            className="rounded-md border border-zinc-800"
          >
            <table
              className="w-full border-collapse"
              style={{
                minWidth: "2500px",
                marginBottom: 0,
                wordWrap: "break-word",
                tableLayout: "auto",
                fontSize: "0.85rem",
                backgroundColor: "#1e293b",
                color: "#f8fafc",
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: "#1e293b",
                  color: "#f8fafc",
                  zIndex: 1,
                  boxShadow: "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                }}
              >
                <tr>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "2%", minWidth: "40px" }}>No</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Tahun</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Lokasi</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "8%", minWidth: "150px" }}>Pemda</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Kanwil</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>KPPN</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "8%", minWidth: "150px" }}>Nama KPPN</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "70px" }}>Akun</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "100px" }}>Jenis Dana</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Bidang</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "8%", minWidth: "150px" }}>Nama Bidang</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Sub</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "8%", minWidth: "150px" }}>Nama Sub Bidang</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>Pagu</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>Penyaluran</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>Sisa Pagu</th>
                  <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "3%", minWidth: "60px" }}>%</th>
                  <th colSpan={12} className="border border-zinc-700 p-2 text-center">Realisasi Bulanan</th>
                </tr>
                <tr>
                  {[
                    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
                    "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
                  ].map((m) => (
                    <th key={m} className="border border-zinc-700 p-2 text-left" style={{ minWidth: "90px" }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, index) => (
                  <tr key={index} className="hover:bg-zinc-700/50">
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.thang}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdlokasi}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>{row.pemda}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdkanwil}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdkppn}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>{row.nmkppn}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdakun}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>{row.jenis_dana}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdbidang}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>{row.nmbidang}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdsubidang}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>{row.nmsubidang}</td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                      {new Intl.NumberFormat("id-ID").format(row.pagu)}
                    </td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                      {new Intl.NumberFormat("id-ID").format(row.total_penyaluran)}
                    </td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                      {new Intl.NumberFormat("id-ID").format(row.sisa_pagu)}
                    </td>
                    <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{row.prosentase}%</td>
                    {[
                      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
                      "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
                    ].map((m) => (
                      <td key={m} className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                        {new Intl.NumberFormat("id-ID").format(row[m])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
