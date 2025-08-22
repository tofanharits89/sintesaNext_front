"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Target, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function TargetCapaianTab() {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total target yang ditetapkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Target Tercapai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jumlah target yang berhasil dicapai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Persentase Capaian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">-%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Persentase keseluruhan capaian
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Target Berisiko
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target yang berisiko tidak tercapai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Target Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Kategori Target EPA
          </CardTitle>
          <CardDescription>
            Pencapaian target berdasarkan kategori utama
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Target Anggaran</h4>
                  <Badge variant="secondary">-%</Badge>
                </div>
                <Progress value={0} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Realisasi vs target anggaran EPA
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Target Waktu</h4>
                  <Badge variant="secondary">-%</Badge>
                </div>
                <Progress value={0} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Ketepatan waktu pelaksanaan
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Target Kualitas</h4>
                  <Badge variant="secondary">-%</Badge>
                </div>
                <Progress value={0} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Pencapaian standar kualitas
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Target Output</h4>
                  <Badge variant="secondary">-%</Badge>
                </div>
                <Progress value={0} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Pencapaian output yang diharapkan
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Target Outcome</h4>
                  <Badge variant="secondary">-%</Badge>
                </div>
                <Progress value={0} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Pencapaian dampak yang diinginkan
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Target Efisiensi</h4>
                  <Badge variant="secondary">-%</Badge>
                </div>
                <Progress value={0} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Tingkat efisiensi pelaksanaan
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tren Pencapaian</CardTitle>
            <CardDescription>
              Grafik tren pencapaian target dari waktu ke waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chart tren pencapaian akan ditampilkan di sini
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gap Analysis</CardTitle>
            <CardDescription>
              Analisis kesenjangan antara target dan capaian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Analisis gap akan ditampilkan di sini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Target List */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Target dan Capaian</CardTitle>
          <CardDescription>
            Daftar lengkap target dengan status pencapaian dan rencana tindak
            lanjut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Data Target dan Capaian
            </h3>
            <p className="text-muted-foreground mb-4">
              Pilih filter di atas untuk menampilkan detail target dan capaian
              EPA
            </p>
            <Button variant="outline">Tampilkan Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
