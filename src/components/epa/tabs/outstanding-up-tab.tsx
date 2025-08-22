"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, DollarSign, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OutstandingUPTab() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Outstanding UP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total nilai outstanding UP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Jumlah Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jumlah UP yang belum diselesaikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Umur Rata-rata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rata-rata umur outstanding (hari)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              UP yang melewati batas waktu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Age Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analisis Umur Outstanding UP
          </CardTitle>
          <CardDescription>
            Klasifikasi outstanding UP berdasarkan umur transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Badge
                variant="secondary"
                className="mb-2 bg-green-100 text-green-800"
              >
                Baru
              </Badge>
              <div className="text-2xl font-bold text-green-600">-</div>
              <p className="text-sm text-muted-foreground">0-30 hari</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Badge
                variant="secondary"
                className="mb-2 bg-yellow-100 text-yellow-800"
              >
                Perhatian
              </Badge>
              <div className="text-2xl font-bold text-yellow-600">-</div>
              <p className="text-sm text-muted-foreground">31-60 hari</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Badge
                variant="secondary"
                className="mb-2 bg-orange-100 text-orange-800"
              >
                Lama
              </Badge>
              <div className="text-2xl font-bold text-orange-600">-</div>
              <p className="text-sm text-muted-foreground">61-90 hari</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Badge variant="destructive" className="mb-2">
                Kritis
              </Badge>
              <div className="text-2xl font-bold text-red-600">-</div>
              <p className="text-sm text-muted-foreground">{">"}90 hari</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Outstanding UP (Nilai)</CardTitle>
            <CardDescription>
              Daftar outstanding UP dengan nilai terbesar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Data akan ditampilkan di sini
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Outstanding UP (Umur)</CardTitle>
            <CardDescription>
              Daftar outstanding UP dengan umur terlama
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Data akan ditampilkan di sini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Outstanding UP</CardTitle>
          <CardDescription>
            Daftar lengkap outstanding UP dengan informasi detail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Outstanding UP</h3>
            <p className="text-muted-foreground mb-4">
              Pilih filter di atas untuk menampilkan detail outstanding UP EPA
            </p>
            <Button variant="outline">Tampilkan Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
