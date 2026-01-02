"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Sp2dReportParamsCardProps {
  reportParams: {
    tahun: string;
    jenlap: string;
    pembulatan: string;
  };
  setReportParams: React.Dispatch<
    React.SetStateAction<{
      tahun: string;
      jenlap: string;
      pembulatan: string;
    }>
  >;
}

const pembulatanOptions = [
  { value: "satuan", label: "Satuan" },
  { value: "ribuan", label: "Ribuan" },
  { value: "jutaan", label: "Jutaan" },
  { value: "miliaran", label: "Miliaran" },
  { value: "triliunan", label: "Triliunan" },
];

export function Sp2dReportParamsCard({
  reportParams,
  setReportParams,
}: Sp2dReportParamsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pilih Laporan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tahun Anggaran */}
          <div>
            <Label htmlFor="thang">Tahun Anggaran</Label>
            <Select
              value={reportParams.tahun}
              onValueChange={(val) =>
                setReportParams((prev) => ({ ...prev, tahun: val }))
              }
            >
              <SelectTrigger id="thang" className="w-full mt-1.5">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Jenis Laporan */}
          <div>
            <Label htmlFor="jenlap">Jenis Laporan</Label>
            <Select
              value={reportParams.jenlap}
              onValueChange={(val) =>
                setReportParams((prev) => ({ ...prev, jenlap: val }))
              }
            >
              <SelectTrigger id="jenlap" className="w-full mt-1.5">
                <SelectValue placeholder="Pilih jenis laporan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Rowset SP2D</SelectItem>
                <SelectItem value="2">Rowset SP2D Detail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pembulatan */}
          <div>
            <Label htmlFor="pembulatan">Pembulatan</Label>
            <Select
              value={reportParams.pembulatan}
              onValueChange={(val) =>
                setReportParams((prev) => ({ ...prev, pembulatan: val }))
              }
            >
              <SelectTrigger id="pembulatan" className="w-full mt-1.5">
                <SelectValue placeholder="Pilih pembulatan" />
              </SelectTrigger>
              <SelectContent>
                {pembulatanOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          TA: {reportParams.tahun}, TIPE LAPORAN: {reportParams.jenlap},
          PEMBULATAN:{" "}
          {pembulatanOptions.find((o) => o.value === reportParams.pembulatan)
            ?.label || reportParams.pembulatan}
        </div>
      </CardContent>
    </Card>
  );
}
