"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteLaporanModal } from "@/components/transfer-daerah/modals/delete-laporan-modal";

// Mock data for demonstration - Only quarterly reports for Laporan Monev KPPN
const mockData = [
  {
    id: 1,
    tahun: "2024",
    kppn: "KPPN Jakarta I",
    jenis: "Laporan Monev",
    periode: "Triwulan I",
    uraian: "Laporan monitoring dan evaluasi triwulan I 2024",
    tanggalUpload: "2024-04-10 11:20:00",
  },
  {
    id: 2,
    tahun: "2024",
    kppn: "KPPN Jakarta II",
    jenis: "Laporan Monev",
    periode: "Triwulan II",
    uraian: "Laporan monitoring dan evaluasi triwulan II 2024",
    tanggalUpload: "2024-07-15 14:45:00",
  },
  {
    id: 3,
    tahun: "2024",
    kppn: "KPPN Bandung",
    jenis: "Laporan Monev",
    periode: "Triwulan III",
    uraian: "Laporan monitoring dan evaluasi triwulan III 2024",
    tanggalUpload: "2024-08-05 09:30:00",
  },
  {
    id: 4,
    tahun: "2023",
    kppn: "KPPN Medan",
    jenis: "Laporan Monev",
    periode: "Triwulan IV",
    uraian: "Laporan monitoring dan evaluasi triwulan IV 2023",
    tanggalUpload: "2024-02-28 16:15:00",
  },
];

export function LaporanMonevKppnTab() {
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [filteredData, setFilteredData] = useState(mockData);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<(typeof mockData)[0] | null>(
    null
  );

  const handlePeriodeFilter = (periode: string) => {
    setSelectedPeriode(periode);
    if (periode === "" || periode === "all") {
      setFilteredData(mockData);
    } else {
      const filtered = mockData.filter((item) =>
        item.periode.toLowerCase().includes(periode.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  const handleDownload = (id: number) => {
    console.log("Downloading file for ID:", id);
    // Implement download logic here
  };

  const handleDelete = (id: number) => {
    const item = filteredData.find((item) => item.id === id);
    if (item) {
      setSelectedItem(item);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      console.log("Deleting file for ID:", selectedItem.id);
      setFilteredData(
        filteredData.filter((item) => item.id !== selectedItem.id)
      );
      setSelectedItem(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-center">Laporan Monev KPPN</CardTitle>

          {/* Periode Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Filter Triwulan:
            </span>
            <Select value={selectedPeriode} onValueChange={handlePeriodeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Semua Triwulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Triwulan</SelectItem>
                <SelectItem value="triwulan i">Triwulan I</SelectItem>
                <SelectItem value="triwulan ii">Triwulan II</SelectItem>
                <SelectItem value="triwulan iii">Triwulan III</SelectItem>
                <SelectItem value="triwulan iv">Triwulan IV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">No</TableHead>
                <TableHead className="text-center">Tahun</TableHead>
                <TableHead className="text-center">KPPN</TableHead>
                <TableHead className="text-center">Jenis</TableHead>
                <TableHead className="text-center">Periode</TableHead>
                <TableHead className="text-center">Uraian</TableHead>
                <TableHead className="text-center">
                  Tanggal dan Jam Upload
                </TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{item.tahun}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{item.kppn}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      {item.jenis}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{item.periode}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className="truncate max-w-xs block"
                      title={item.uraian}
                    >
                      {item.uraian}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{item.tanggalUpload}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Tidak ada data laporan yang sesuai dengan filter
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Modal */}
      <DeleteLaporanModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        itemData={
          selectedItem
            ? {
                tahun: selectedItem.tahun,
                kppn: selectedItem.kppn,
                jenis: selectedItem.jenis,
                periode: selectedItem.periode,
                uraian: selectedItem.uraian,
              }
            : undefined
        }
      />
    </Card>
  );
}
