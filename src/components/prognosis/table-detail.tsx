import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Section } from "./shared";

interface PrognosisTableDetailProps {
  predictionData: any;
  tableData: any[];
  pagu2026: number;
  jenisLaporan: string;
  currentYear: number;
  startMonth: number;
  startYear: number;
  formatCurrency: (val: number) => string;
}

export const PrognosisTableDetail = ({
  predictionData,
  tableData,
  pagu2026,
  jenisLaporan,
  currentYear,
  startMonth,
  startYear,
  formatCurrency,
}: PrognosisTableDetailProps) => {
  return (
    <Section title="Hasil Prediksi Detail">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px]">
                Tahun
              </TableHead>
              <TableHead className="font-bold uppercase text-[10px]">
                Pagu
              </TableHead>
              {jenisLaporan === "1" && (
                <>
                  <TableHead className="font-bold uppercase text-[10px]">
                    JAN
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    FEB
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    MAR
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    APR
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    MEI
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    JUN
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    JUL
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    AGS
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    SEP
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    OKT
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    NOV
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">
                    DES
                  </TableHead>
                </>
              )}
              {jenisLaporan === "2" && (
                <TableHead className="font-bold uppercase text-[10px]">
                  Total Realisasi
                </TableHead>
              )}
              <TableHead className="font-bold uppercase text-[10px]">
                Persentase (%)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Data Historis */}
            {tableData.map((item: any, index: number) => {
              if (jenisLaporan === "1") {
                // Laporan Bulanan - tampilkan kolom per bulan
                const months = [
                  "JAN",
                  "FEB",
                  "MAR",
                  "APR",
                  "MEI",
                  "JUN",
                  "JUL",
                  "AGS",
                  "SEP",
                  "OKT",
                  "NOV",
                  "DES",
                ];
                const pagu = parseFloat(item.pagu || 0);
                const desValue = item.DES ?? item.des ?? 0;
                const percentage =
                  pagu > 0 ? (parseFloat(desValue) / pagu) * 100 : 0;

                return (
                  <TableRow key={`hist-${index}`} className="hover:bg-muted/30">
                    <TableCell className="py-2 text-[10px] font-medium">
                      {item.tahun}
                    </TableCell>
                    <TableCell className="py-2 text-[10px]">
                      {formatCurrency(pagu)}
                    </TableCell>
                    {months.map((month) => {
                      const val = item[month] ?? item[month.toLowerCase()] ?? 0;
                      return (
                        <TableCell
                          key={month}
                          className="py-2 text-[10px] text-right"
                        >
                          {formatCurrency(parseFloat(val))}
                        </TableCell>
                      );
                    })}
                    <TableCell className="py-2 text-[10px] font-semibold">
                      {percentage.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              } else {
                // Laporan Tahunan
                const pagu = parseFloat(item.pagu || 0);
                const totalRealisasi = parseFloat(item.total_realisasi || 0);
                const percentage = pagu > 0 ? (totalRealisasi / pagu) * 100 : 0;

                return (
                  <TableRow key={`hist-${index}`} className="hover:bg-muted/30">
                    <TableCell className="py-2 text-[10px] font-medium">
                      {item.tahun}
                    </TableCell>
                    <TableCell className="py-2 text-[10px]">
                      {formatCurrency(pagu)}
                    </TableCell>
                    <TableCell className="py-2 text-[10px] text-right">
                      {formatCurrency(totalRealisasi)}
                    </TableCell>
                    <TableCell className="py-2 text-[10px] font-semibold">
                      {percentage.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              }
            })}

            {/* Separator Row */}
            <TableRow className="bg-primary/10">
              <TableCell
                colSpan={jenisLaporan === "1" ? 15 : 4}
                className="py-2 text-center font-bold text-[11px] uppercase"
              >
                Hasil Proyeksi
              </TableCell>
            </TableRow>

            {/* Data Proyeksi */}
            {predictionData?.prediction?.predictions?.map(
              (pred: any, idx: number) => {
                const perc = pred.cumulative_percentage || pred.percentage || 0;
                const nominalValue = (perc / 100) * (pagu2026 || 0);

                let label = "";
                if (jenisLaporan === "1") {
                  const monthIndex = (startMonth - 1 + idx) % 12;
                  const month = monthIndex + 1;
                  const year =
                    startYear + Math.floor((startMonth - 1 + idx) / 12);
                  label = `Bulan ${month} (${year})`;
                } else {
                  label = `Tahun ${startYear + idx}`;
                }

                return (
                  <TableRow
                    key={`pred-${idx}`}
                    className="bg-emerald-50/50 dark:bg-emerald-950/20"
                  >
                    <TableCell className="py-2 text-[10px] font-semibold">
                      {label}
                    </TableCell>
                    <TableCell className="py-2 text-[10px]">
                      {formatCurrency(pagu2026)}
                    </TableCell>
                    {jenisLaporan === "1" && (
                      <>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <TableCell
                            key={`empty-${i}`}
                            className="py-2 text-[10px] text-center text-muted-foreground"
                          >
                            -
                          </TableCell>
                        ))}
                      </>
                    )}
                    {jenisLaporan === "2" && (
                      <TableCell className="py-2 text-[10px] text-right">
                        {formatCurrency(nominalValue)}
                      </TableCell>
                    )}
                    <TableCell className="py-2 text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-muted h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${Math.min(perc, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                          {perc.toFixed(2)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }
            )}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
};
