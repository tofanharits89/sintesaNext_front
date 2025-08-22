"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Minus, Calculator, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PaguMinusTab() {
  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Pagu Minus memerlukan perhatian khusus dan tindakan korektif
              segera
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Pagu Minus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Minus className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jumlah total pagu minus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Nilai Pagu Minus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total nilai dalam rupiah
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Satker Terdampak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jumlah satker dengan pagu minus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tren Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Perubahan vs bulan lalu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Analisis Tingkat Keparahan
          </CardTitle>
          <CardDescription>
            Klasifikasi pagu minus berdasarkan tingkat keparahan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Badge variant="destructive" className="mb-2">
                Kritis
              </Badge>
              <div className="text-2xl font-bold text-red-600">-</div>
              <p className="text-sm text-muted-foreground">
                {">"}100% dari pagu
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Badge
                variant="secondary"
                className="mb-2 bg-orange-100 text-orange-800"
              >
                Sedang
              </Badge>
              <div className="text-2xl font-bold text-orange-600">-</div>
              <p className="text-sm text-muted-foreground">50-100% dari pagu</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Badge variant="outline" className="mb-2">
                Ringan
              </Badge>
              <div className="text-2xl font-bold text-yellow-600">-</div>
              <p className="text-sm text-muted-foreground">
                {"<"}50% dari pagu
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Pagu Minus</CardTitle>
          <CardDescription>
            Daftar lengkap satker dengan pagu minus dan rencana tindak lanjut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Minus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Pagu Minus</h3>
            <p className="text-muted-foreground mb-4">
              Pilih filter di atas untuk menampilkan detail pagu minus EPA
            </p>
            <Button variant="outline">Tampilkan Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
