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
    jenisLaporan: string;
    currentYear: number;
    formatCurrency: (val: number) => string;
}

export const PrognosisTableDetail = ({
    predictionData,
    tableData,
    jenisLaporan,
    currentYear,
    formatCurrency
}: PrognosisTableDetailProps) => {
    return (
        <Section title="Hasil Prediksi Detail">
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-bold uppercase text-[10px]">Periode</TableHead>
                            <TableHead className="font-bold uppercase text-[10px]">Persentase Kumulatif (%)</TableHead>
                            <TableHead className="font-bold uppercase text-[10px] text-right">Nominal Proyeksi (Estimasi)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {predictionData?.prediction?.predictions?.map((pred: any, idx: number) => {
                            const perc = pred.cumulative_percentage || pred.percentage || 0;
                            const paguNow = tableData.find(d => parseInt(d.tahun) === currentYear)?.pagu || 0;
                            const nominalValue = (perc / 100) * paguNow;

                            let label = "";
                            if (jenisLaporan === "1") {
                                const startMonth = 10;
                                const month = ((startMonth + idx - 1) % 12) + 1;
                                const year = currentYear + Math.floor((startMonth + idx - 1) / 12);
                                label = `Bulan ${month} (${year})`;
                            } else {
                                label = `Tahun ${currentYear + idx + 1}`;
                            }

                            return (
                                <TableRow key={idx}>
                                    <TableCell className="py-3 font-medium">{label}</TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(perc, 100)}%` }} />
                                            </div>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{perc.toFixed(2)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-right font-mono">
                                        {formatCurrency(nominalValue)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </Section>
    );
};
