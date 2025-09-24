"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Building2, IdCard, Percent, Landmark, MapPin } from "lucide-react";

export interface SupplierIdentityCardProps {
  namaVendor?: string | null;
  npwpSupplier?: string | null;
  totalKontrak?: number;
  totalSpm?: number;
  realizationRatio?: number; // 0..1
  satkersServed?: number;
  regionsServed?: number;
}

function formatIDRCurrency(n?: number) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
}

export function SupplierIdentityCard({
  namaVendor,
  npwpSupplier,
  totalKontrak,
  totalSpm,
  realizationRatio,
  satkersServed,
  regionsServed,
}: SupplierIdentityCardProps) {
  const ratioPct = Math.max(0, Math.min(100, Number((realizationRatio ?? 0) * 100)));

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Nama Supplier</div>
              <div className="font-semibold text-lg leading-tight break-words">{namaVendor || "-"}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <IdCard className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">NPWP Supplier</div>
              <div className="font-medium leading-tight break-all">{npwpSupplier || "-"}</div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Nilai Kontrak</div>
            <div className="text-base md:text-lg font-semibold">{formatIDRCurrency(totalKontrak)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Nilai SPM</div>
            <div className="text-base md:text-lg font-semibold">{formatIDRCurrency(totalSpm)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Percent className="h-4 w-4" /> Realisasi
            </div>
            <div className="text-sm font-medium">{ratioPct.toFixed(2)}%</div>
            <Progress value={ratioPct} className="mt-2 h-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Landmark className="h-4 w-4" /> Satker
              </div>
              <div className="text-base font-semibold">{Number(satkersServed ?? 0).toLocaleString("id-ID")}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4" /> KPPN
              </div>
              <div className="text-base font-semibold">{Number(regionsServed ?? 0).toLocaleString("id-ID")}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default SupplierIdentityCard;
