"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DonutChartComponent } from "@/components/ui/donut-chart";
import { ProgramDetailsModal } from "./ProgramDetailsModal";
import { Info } from "lucide-react";

interface SubOutputItem {
  no: number;
  nmsoutput: string;
  kdsoutput: string;
  vol: number;
  realisasiFisik: number;
}

interface ProgramCardProps {
  id: string;
  title: string;
  code: string;
  pagu: number;
  realisasi: number;
  blokir: number;
  year?: string;
  subOutputs?: SubOutputItem[];
}

function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function ProgramCard({
  id,
  title,
  code,
  pagu,
  realisasi,
  blokir,
  year = new Date().getFullYear().toString(),
  subOutputs = [],
}: ProgramCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sisa = pagu - realisasi - blokir;
  const realisasiPercentage = ((realisasi / pagu) * 100).toFixed(1);

  // Debug log
  console.log(`Program ${title}: ${subOutputs.length} sub-outputs`, subOutputs);

  const chartData = [
    { name: "Realisasi", value: realisasi },
    { name: "Blokir", value: blokir },
    { name: "Sisa", value: Math.max(0, sisa) },
  ];

  return (
    <>
      <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
        {/* Card Header */}
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold line-clamp-2 text-foreground/90 leading-tight">
                {title}
              </CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-tight">
                  CODE
                </span>
                <CardDescription className="text-xs font-semibold text-muted-foreground/80">
                  {code}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setIsModalOpen(true)}
              title="Lihat Detail"
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Card Body */}
        <CardContent>
          <div className="flex gap-4 items-center">
            {/* Left side: Donut Chart */}
            <div className="w-36 h-36 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <DonutChartComponent
                data={chartData}
                height={140}
                colors={["#10b981", "#ef4444", "#9ca3af"]}
                showLegend={false}
                showLabel={false}
                centerLabel={`${realisasiPercentage}%`}
              />
            </div>

            {/* Right side: Info */}
            <div className="flex-1 space-y-3 text-right">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Pagu</p>
                <p className="font-mono font-bold text-blue-600 text-base leading-tight">
                  {formatCurrency(pagu)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Realisasi</p>
                <p className="font-mono font-bold text-green-600 text-base leading-tight">
                  {formatCurrency(realisasi)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Blokir</p>
                <p className="font-mono font-bold text-red-600 text-base leading-tight">
                  {formatCurrency(blokir)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Card Footer */}
        <CardFooter className="pt-2 border-t border-border/50 bg-muted/5">
          <div className="text-sm font-medium text-muted-foreground w-full flex justify-between items-center">
            <span>Sisa Anggaran:</span>
            <span className="font-mono font-bold text-foreground">{formatCurrency(Math.max(0, sisa))}</span>
          </div>
        </CardFooter>
      </Card>

      <ProgramDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        programName={title}
        subOutputs={subOutputs}
      />
    </>
  );
}
