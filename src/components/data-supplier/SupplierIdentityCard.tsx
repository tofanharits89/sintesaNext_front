"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Building2, IdCard, Percent, Landmark, MapPin } from "lucide-react";

export interface SupplierIdentityCardProps {
  namaVendor?: string | null;
  npwpSupplier?: string | null;
  totalNilaiKontrak?: number;
  totalNilaiSpmKontraktual?: number;
  totalNilaiSpmNonKontraktual?: number;
  kementerianCount?: number;
  realizationRatio?: number; // 0..1
  satkersServed?: number;
  regionsServed?: number;
  onShowKementerian?: () => void;
  onShowSatker?: () => void;
  onShowKppn?: () => void;
  kementerianDetailAvailable?: boolean;
  satkerDetailAvailable?: boolean;
  kppnDetailAvailable?: boolean;
}

function formatIDRCurrency(n?: number) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
}

export function SupplierIdentityCard({
  namaVendor,
  npwpSupplier,
  totalNilaiKontrak,
  totalNilaiSpmKontraktual,
  totalNilaiSpmNonKontraktual,
  kementerianCount,
  realizationRatio,
  satkersServed,
  regionsServed,
  onShowKementerian,
  onShowSatker,
  onShowKppn,
  kementerianDetailAvailable,
  satkerDetailAvailable,
  kppnDetailAvailable,
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Nilai Kontrak</div>
            <div className="text-base md:text-lg font-semibold">{formatIDRCurrency(totalNilaiKontrak)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Nilai SPM Kontraktual</div>
            <div className="text-base md:text-lg font-semibold">{formatIDRCurrency(totalNilaiSpmKontraktual)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Nilai SPM Non-Kontraktual</div>
            <div className="text-base md:text-lg font-semibold">{formatIDRCurrency(totalNilaiSpmNonKontraktual)}</div>
          </div>
          <div className="rounded-md border p-3 lg:col-span-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Percent className="h-4 w-4" /> Realisasi Kontraktual
            </div>
            <div className="text-sm font-medium">{ratioPct.toFixed(2)}%</div>
            <Progress value={ratioPct} className="mt-2 h-2" />
          </div>
          <div className="rounded-md border p-3 lg:col-span-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Landmark className="h-4 w-4" /> Kementerian
            </div>
            <div className="text-base font-semibold">
              {Number(kementerianCount ?? 0).toLocaleString("id-ID")}
            </div>
            {onShowKementerian ? (
              <Button
                type="button"
                onClick={onShowKementerian}
                className="mt-3 h-7 px-2 text-xs"
                variant="outline"
                size="sm"
                disabled={kementerianDetailAvailable === false}
              >
                Detail
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-1">
            <div className="rounded-md border p-3 flex flex-col">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Landmark className="h-4 w-4" /> Satker
              </div>
              <div className="mt-1 text-base font-semibold">{Number(satkersServed ?? 0).toLocaleString("id-ID")}</div>
              {onShowSatker ? (
                <Button
                  type="button"
                  onClick={onShowSatker}
                  className="mt-3 h-7 px-2 text-xs"
                  variant="outline"
                  size="sm"
                  disabled={satkerDetailAvailable === false}
                >
                  Detail
                </Button>
              ) : null}
            </div>
            <div className="rounded-md border p-3 flex flex-col">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4" /> KPPN
              </div>
              <div className="mt-1 text-base font-semibold">{Number(regionsServed ?? 0).toLocaleString("id-ID")}</div>
              {onShowKppn ? (
                <Button
                  type="button"
                  onClick={onShowKppn}
                  className="mt-3 h-7 px-2 text-xs"
                  variant="outline"
                  size="sm"
                  disabled={kppnDetailAvailable === false}
                >
                  Detail
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default SupplierIdentityCard;
