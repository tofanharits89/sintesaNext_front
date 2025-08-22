"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IsuSpesifikTab() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Isu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Akan ditampilkan setelah filter dipilih
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Isu Kritis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Isu yang memerlukan perhatian segera
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Status Penyelesaian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">-</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Persentase isu yang telah diselesaikan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail Isu Spesifik
          </CardTitle>
          <CardDescription>
            Analisis mendalam mengenai isu-isu spesifik dalam pelaksanaan EPA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Isu Spesifik</h3>
            <p className="text-muted-foreground mb-4">
              Pilih filter di atas untuk menampilkan data isu spesifik EPA
            </p>
            <Button variant="outline">Refresh Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
