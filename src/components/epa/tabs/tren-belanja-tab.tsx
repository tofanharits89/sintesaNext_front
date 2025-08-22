"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrenBelanjaTab() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Belanja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Realisasi belanja periode ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tren Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Perubahan vs bulan sebelumnya
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Pertumbuhan YoY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pertumbuhan year-over-year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Efisiensi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Indeks efisiensi belanja
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Tren Belanja Bulanan
            </CardTitle>
            <CardDescription>
              Grafik perkembangan belanja dari bulan ke bulan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chart akan ditampilkan di sini
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Komparasi YoY
            </CardTitle>
            <CardDescription>
              Perbandingan belanja dengan tahun sebelumnya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chart akan ditampilkan di sini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Tren Belanja</CardTitle>
          <CardDescription>
            Ringkasan analisis dan insight dari data belanja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Analisis Tren Belanja
            </h3>
            <p className="text-muted-foreground mb-4">
              Pilih filter di atas untuk menampilkan analisis tren belanja EPA
            </p>
            <Button variant="outline">Generate Analisis</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
