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
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm line-clamp-2">{title}</CardTitle>
              <CardDescription className="text-xs">{code}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setIsModalOpen(true)}
              title="Lihat Detail"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

      {/* Card Body */}
      <CardContent className="flex-1 pb-2">
        <div className="flex gap-2">
          {/* Left side: Info */}
          <div className="flex-1 space-y-1.5 text-xs">
            <div>
              <p className="text-muted-foreground text-xs">Pagu</p>
              <p className="font-semibold text-blue-600 text-xs">
                {formatCurrency(pagu)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Realisasi</p>
              <p className="font-semibold text-green-600 text-xs">
                {formatCurrency(realisasi)} ({realisasiPercentage}%)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Blokir</p>
              <p className="font-semibold text-red-600 text-xs">
                {formatCurrency(blokir)}
              </p>
            </div>
          </div>

          {/* Right side: Donut Chart */}
          <div className="w-28 h-28 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <DonutChartComponent
              data={chartData}
              height={112}
              colors={["#10b981", "#ef4444", "#9ca3af"]}
              showLegend={false}
              showLabel={false}
              centerLabel={`${realisasiPercentage}%`}
            />
          </div>
        </div>
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="pt-2 px-6 pb-3">
        <div className="text-xs text-muted-foreground w-full">
          <p>Sisa: {formatCurrency(Math.max(0, sisa))}</p>
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
