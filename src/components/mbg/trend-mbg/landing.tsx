"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Tag,
  BarChart2,
  Leaf,
  LayoutList,
  Users,
} from "lucide-react";

interface TrendItem {
  id: number;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  content: React.ReactNode;
}

const PLACEHOLDER = (
  <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
    Chart akan ditampilkan di sini.
  </div>
);

const items: TrendItem[] = [
  {
    id: 1,
    title: "Penyerapan Anggaran MBG – Non Kumulatif",
    icon: <TrendingUp className="h-5 w-5" />,
    accentColor: "#FF6B6B",
    content: PLACEHOLDER,
  },
  {
    id: 2,
    title: "Tren Harga Komoditas",
    icon: <Tag className="h-5 w-5" />,
    accentColor: "#4ECDC4",
    content: PLACEHOLDER,
  },
  {
    id: 3,
    title: "PDRB Atas Dasar Harga Berlaku",
    icon: <BarChart2 className="h-5 w-5" />,
    accentColor: "#556270",
    content: PLACEHOLDER,
  },
  {
    id: 4,
    title: "Tren Nilai Tukar Petani dan Nilai Tukar Nelayan",
    icon: <Leaf className="h-5 w-5" />,
    accentColor: "#C7F464",
    content: PLACEHOLDER,
  },
  {
    id: 5,
    title: "Data Summary MBG",
    icon: <LayoutList className="h-5 w-5" />,
    accentColor: "#FFA07A",
    content: PLACEHOLDER,
  },
  {
    id: 6,
    title: "Jumlah Petugas Per Provinsi",
    icon: <Users className="h-5 w-5" />,
    accentColor: "#6A0572",
    content: PLACEHOLDER,
  },
];

export function TrendMBGLanding() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden transition-transform duration-200 hover:scale-[1.01] hover:shadow-md"
          style={{ borderLeft: `6px solid ${item.accentColor}` }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span style={{ color: item.accentColor }}>{item.icon}</span>
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent>{item.content}</CardContent>
        </Card>
      ))}
    </div>
  );
}

export default TrendMBGLanding;
