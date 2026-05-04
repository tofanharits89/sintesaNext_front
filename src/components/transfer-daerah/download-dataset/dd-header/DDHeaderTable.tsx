import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DDHeaderTableProps } from "./types";

export const DDHeaderTable: React.FC<DDHeaderTableProps> = ({
  tableData,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  return (
    <div className="results-section space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">
            Hasil Data ({tableData.length.toLocaleString("id-ID")} baris)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="mb-3 flex justify-between items-center rounded-md px-4 py-2 bg-zinc-800"
          >
            <span className="text-white text-sm">
              Halaman {currentPage} dari{" "}
              {Math.ceil(tableData.length / itemsPerPage) || 1}
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
                disabled={
                  currentPage >= Math.ceil(tableData.length / itemsPerPage)
                }
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
                minWidth: "2200px",
                marginBottom: 0,
                wordWrap: "break-word" as const,
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
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "2%", minWidth: "40px" }}>No</th>
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Tahun</th>
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Kanwil</th>
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "10%", minWidth: "150px" }}>Nama Kanwil</th>
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>KPPN</th>
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "10%", minWidth: "150px" }}>Nama KPPN</th>
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Lokasi</th>
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "10%", minWidth: "150px" }}>Nama Pemda</th>
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>Pagu</th>
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "Mei",
                    "Jun",
                    "Jul",
                    "Ags",
                    "Sep",
                    "Okt",
                    "Nov",
                    "Des",
                  ].map((m) => (
                    <th key={m} className="border border-zinc-700 p-2 text-left" style={{ minWidth: "90px" }}>{m}</th>
                  ))}
                  <th className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {tableData
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage,
                  )
                  .map((row, index) => (
                    <tr key={index} className="hover:bg-zinc-700/50">
                      <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.thang}</td>
                      <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdkanwil}</td>
                      <td
                        className="border border-zinc-700 p-2"
                        style={{
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        {row.nmkanwil}
                      </td>
                      <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdkppn}</td>
                      <td
                        className="border border-zinc-700 p-2"
                        style={{
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        {row.nmkppn}
                      </td>
                      <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdlokasi}</td>
                      <td
                        className="border border-zinc-700 p-2"
                        style={{
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        {row.nmkabkota}
                      </td>
                      <td
                        className="border border-zinc-700 p-2"
                        style={{ whiteSpace: "nowrap", textAlign: "right" }}
                      >
                        {new Intl.NumberFormat("id-ID").format(row.pagu || 0)}
                      </td>
                      {[
                        "Januari",
                        "Februari",
                        "Maret",
                        "April",
                        "Mei",
                        "Juni",
                        "Juli",
                        "Agustus",
                        "September",
                        "Oktober",
                        "November",
                        "Desember",
                      ].map((m) => (
                        <td
                          key={m}
                          className="border border-zinc-700 p-2"
                          style={{ whiteSpace: "nowrap", textAlign: "right" }}
                        >
                          {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                        </td>
                      ))}
                      <td
                        className="border border-zinc-700 p-2"
                        style={{
                          whiteSpace: "nowrap",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {new Intl.NumberFormat("id-ID").format(
                          row.total_nilai || 0,
                        )}
                      </td>
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
