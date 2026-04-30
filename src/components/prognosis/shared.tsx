import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Opsi Jenis Laporan
export const jenlapOptions = [
  { label: "1 - Bulanan", value: "1" },
  { label: "2 - Tahunan", value: "2" },
];

// Opsi Level Proyeksi
export const levelOptions = [
  { label: "1 - Kementerian", value: "1" },
  { label: "2 - Unit Eselon I", value: "2" },
  { label: "3 - Satuan Kerja", value: "3" },
];

// Opsi Metode Prediksi
export const metodeOptions = [
  { label: "Time Series Analisis (ARIMA)", value: "arima" },
  { label: "Random Forest", value: "random_forest" },
  { label: "Analisis Regresi", value: "regresi" },
  { label: "Gradient Boosting", value: "gradient_boosting" },
  { label: "Moving Average (Rata-rata Historis)", value: "moving_average" },
];

export const methodDefinitions: Record<string, string> = {
  arima:
    "ARIMA (AutoRegressive Integrated Moving Average) adalah metode time series yang menganalisis pola historis, tren, dan komponen musiman untuk prediksi. Metode ini sangat cocok untuk data dengan pola waktu yang jelas dan dapat menangkap siklus anggaran tahunan dengan baik.",
  random_forest:
    "Random Forest menggunakan ensemble dari multiple decision trees untuk menghasilkan prediksi yang robust. Metode ini menggabungkan berbagai faktor seperti tren, momentum, dan pola musiman, serta memberikan hasil yang stabil dan tahan terhadap outliers.",
  regresi:
    "Analisis Regresi Linear mengidentifikasi hubungan matematis antara variabel waktu dan realisasi anggaran. Dilengkapi dengan komponen seasonal decomposition untuk meningkatkan akurasi prediksi pada pola musiman anggaran pemerintah.",
  gradient_boosting:
    "Gradient Boosting membangun model prediksi secara iteratif dengan memperbaiki kesalahan prediksi sebelumnya. Metode ini menggunakan learning rate untuk mengoptimalkan akurasi dan menghasilkan model yang semakin presisi di setiap iterasi.",
  moving_average:
    "Moving Average (Rata-rata Historis) menghitung rata-rata nilai realisasi dari periode-periode sebelumnya sebagai prediksi. Metode sederhana dan interpretatif yang cocok untuk data tanpa tren yang kuat.",
};

export const Section = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <Card className={`mb-6 ${className}`}>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col space-y-2 mb-4">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);
