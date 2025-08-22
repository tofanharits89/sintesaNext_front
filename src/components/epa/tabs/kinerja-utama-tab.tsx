"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Target, Award, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function KinerjaUtamaTab() {
  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Skor Kinerja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Skor kinerja keseluruhan EPA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Pencapaian Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Persentase target yang tercapai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Efektivitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Indeks efektivitas program
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tren Kinerja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Perubahan vs periode sebelumnya
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Indikator Kinerja Utama (IKU)
          </CardTitle>
          <CardDescription>
            Monitoring pencapaian indikator kinerja utama EPA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sample KPI Items - These would be dynamic */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Tingkat Realisasi Anggaran
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Target: 95% | Pencapaian: -
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">-%</p>
                </div>
              </div>
              <Progress value={0} className="w-full" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Ketepatan Waktu Pembayaran
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Target: 90% | Pencapaian: -
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">-%</p>
                </div>
              </div>
              <Progress value={0} className="w-full" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Akurasi Data Pelaporan</p>
                  <p className="text-xs text-muted-foreground">
                    Target: 98% | Pencapaian: -
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">-%</p>
                </div>
              </div>
              <Progress value={0} className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan Kinerja</CardTitle>
            <CardDescription>
              Perbandingan kinerja antar periode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chart perbandingan akan ditampilkan di sini
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking Kinerja</CardTitle>
            <CardDescription>
              Ranking kinerja berdasarkan satker/wilayah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Ranking akan ditampilkan di sini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Kinerja Detail</CardTitle>
          <CardDescription>
            Analisis mendalam terhadap kinerja EPA dan rekomendasi perbaikan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Analisis Kinerja Utama
            </h3>
            <p className="text-muted-foreground mb-4">
              Pilih filter di atas untuk menampilkan analisis kinerja utama EPA
            </p>
            <Button variant="outline">Generate Analisis</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
