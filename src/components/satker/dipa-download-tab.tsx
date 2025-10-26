"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  FileText, 
  Search, 
  Calendar,
  FolderOpen,
  RefreshCw,
  Archive
} from "lucide-react";

interface DipaDownloadTabProps {
  kdsatker: string;
}

interface DipaDocument {
  id: string;
  namaFile: string;
  revisiKe: number;
  folder: string;
  tanggal: string;
  ukuranFile: string;
  status: "available" | "processing" | "error";
  year: number;
}

export function DipaDownloadTab({ kdsatker }: DipaDownloadTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data for demonstration - in real app, this would come from API
  const allDocuments: DipaDocument[] = [
    // 2025 Documents
    {
      id: "2025-1",
      namaFile: `DIPA_${kdsatker}_2025_Rev0.pdf`,
      revisiKe: 0,
      folder: "001/01/2025",
      tanggal: "2024-12-15",
      ukuranFile: "2.4 MB",
      status: "available",
      year: 2025
    },
    {
      id: "2025-2",
      namaFile: `DIPA_${kdsatker}_2025_Rev1.pdf`,
      revisiKe: 1,
      folder: "001/02/2025",
      tanggal: "2024-12-20",
      ukuranFile: "2.6 MB",
      status: "available",
      year: 2025
    },
    {
      id: "2025-3",
      namaFile: `ADK_${kdsatker}_2025.zip`,
      revisiKe: 0,
      folder: "002/01/2025",
      tanggal: "2024-12-15",
      ukuranFile: "5.2 MB",
      status: "available",
      year: 2025
    },
    {
      id: "2025-4",
      namaFile: `DK_${kdsatker}_2025_Rev0.pdf`,
      revisiKe: 0,
      folder: "003/01/2025",
      tanggal: "2024-12-15",
      ukuranFile: "1.8 MB",
      status: "processing",
      year: 2025
    },
    // 2024 Documents
    {
      id: "2024-1",
      namaFile: `DIPA_${kdsatker}_2024_Rev0.pdf`,
      revisiKe: 0,
      folder: "001/01/2024",
      tanggal: "2023-12-15",
      ukuranFile: "2.2 MB",
      status: "available",
      year: 2024
    },
    {
      id: "2024-2",
      namaFile: `DIPA_${kdsatker}_2024_Rev1.pdf`,
      revisiKe: 1,
      folder: "001/02/2024",
      tanggal: "2024-03-10",
      ukuranFile: "2.4 MB",
      status: "available",
      year: 2024
    },
    {
      id: "2024-3",
      namaFile: `DIPA_${kdsatker}_2024_Rev2.pdf`,
      revisiKe: 2,
      folder: "001/03/2024",
      tanggal: "2024-06-15",
      ukuranFile: "2.5 MB",
      status: "available",
      year: 2024
    },
    {
      id: "2024-4",
      namaFile: `ADK_${kdsatker}_2024.zip`,
      revisiKe: 0,
      folder: "002/01/2024",
      tanggal: "2023-12-15",
      ukuranFile: "4.8 MB",
      status: "available",
      year: 2024
    },
    // 2023 Documents
    {
      id: "2023-1",
      namaFile: `DIPA_${kdsatker}_2023_Rev0.pdf`,
      revisiKe: 0,
      folder: "001/01/2023",
      tanggal: "2022-12-15",
      ukuranFile: "2.1 MB",
      status: "available",
      year: 2023
    },
    {
      id: "2023-2",
      namaFile: `DIPA_${kdsatker}_2023_Rev1.pdf`,
      revisiKe: 1,
      folder: "001/02/2023",
      tanggal: "2023-04-20",
      ukuranFile: "2.3 MB",
      status: "available",
      year: 2023
    },
    {
      id: "2023-3",
      namaFile: `ADK_${kdsatker}_2023.zip`,
      revisiKe: 0,
      folder: "002/01/2023",
      tanggal: "2022-12-15",
      ukuranFile: "4.5 MB",
      status: "available",
      year: 2023
    },
    // 2022 Documents
    {
      id: "2022-1",
      namaFile: `DIPA_${kdsatker}_2022_Rev0.pdf`,
      revisiKe: 0,
      folder: "001/01/2022",
      tanggal: "2021-12-15",
      ukuranFile: "2.0 MB",
      status: "available",
      year: 2022
    },
    {
      id: "2022-2",
      namaFile: `ADK_${kdsatker}_2022.zip`,
      revisiKe: 0,
      folder: "002/01/2022",
      tanggal: "2021-12-15",
      ukuranFile: "4.2 MB",
      status: "available",
      year: 2022
    },
    // 2021 Documents
    {
      id: "2021-1",
      namaFile: `DIPA_${kdsatker}_2021_Rev0.pdf`,
      revisiKe: 0,
      folder: "001/01/2021",
      tanggal: "2020-12-15",
      ukuranFile: "1.9 MB",
      status: "available",
      year: 2021
    },
    {
      id: "2021-2",
      namaFile: `ADK_${kdsatker}_2021.zip`,
      revisiKe: 0,
      folder: "002/01/2021",
      tanggal: "2020-12-15",
      ukuranFile: "4.0 MB",
      status: "available",
      year: 2021
    },
    // 2020 Documents
    {
      id: "2020-1",
      namaFile: `DIPA_${kdsatker}_2020_Rev0.pdf`,
      revisiKe: 0,
      folder: "001/01/2020",
      tanggal: "2019-12-15",
      ukuranFile: "1.8 MB",
      status: "available",
      year: 2020
    },
    {
      id: "2020-2",
      namaFile: `ADK_${kdsatker}_2020.zip`,
      revisiKe: 0,
      folder: "002/01/2020",
      tanggal: "2019-12-15",
      ukuranFile: "3.8 MB",
      status: "available",
      year: 2020
    }
  ];

  // Filter documents based on search term
  const filteredDocuments = allDocuments.filter((doc) =>
    doc.namaFile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.folder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.year.toString().includes(searchTerm)
  );

  // Group documents by year (descending order)
  const documentsByYear = filteredDocuments.reduce((acc, doc) => {
    const bucket = acc[doc.year] ?? (acc[doc.year] = []);
    bucket.push(doc);
    return acc;
  }, {} as Record<number, DipaDocument[]>);

  const years = Object.keys(documentsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const handleDownload = (document: DipaDocument) => {
    // Mock download functionality
    console.log(`Downloading: ${document.namaFile}`);
    // In real app, this would trigger actual file download
    alert(`Mengunduh: ${document.namaFile}`);
  };

  const getStatusBadge = (status: DipaDocument["status"]) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-100 text-green-800">Tersedia</Badge>;
      case "processing":
        return <Badge variant="secondary">Diproses</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric"
    });
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().includes('.zip')) {
      return <Archive className="h-4 w-4 text-orange-600" />;
    }
    return <FileText className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Unduh ADK/DIPA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Download dokumen DIPA dan ADK dari tahun 2020 hingga sekarang
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari dokumen atau tahun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents by Year */}
      {years.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? "Tidak ada dokumen yang sesuai dengan pencarian" : "Belum ada dokumen tersedia"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        years.map((year) => (
          <Card key={year}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tahun {year}
                <Badge variant="outline" className="ml-2">
                  {(documentsByYear[year]?.length ?? 0)} dokumen
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-700">
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead className="text-center">Nama File</TableHead>
                      <TableHead className="w-24 text-center">Revisi Ke-</TableHead>
                      <TableHead className="text-center">Folder</TableHead>
                      <TableHead className="w-32 text-center">Tanggal</TableHead>
                      <TableHead className="w-24 text-center">Status</TableHead>
                      <TableHead className="w-32 text-center">Download</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(documentsByYear[year] ?? []).map((doc, index) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium text-center">{index + 1}</TableCell>
                        <TableCell className="text-center">
                          <p className="font-medium">{doc.namaFile}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge variant="outline">{doc.revisiKe}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-mono text-muted-foreground">{doc.folder}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(doc.tanggal)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {getStatusBadge(doc.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc)}
                            disabled={doc.status !== "available"}
                            className="h-8"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Summary */}
      {years.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{filteredDocuments.length}</p>
                <p className="text-sm text-muted-foreground">Total Dokumen</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {filteredDocuments.filter(d => d.status === "available").length}
                </p>
                <p className="text-sm text-muted-foreground">Tersedia</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredDocuments.filter(d => d.status === "processing").length}
                </p>
                <p className="text-sm text-muted-foreground">Diproses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{years.length}</p>
                <p className="text-sm text-muted-foreground">Tahun Tersedia</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
