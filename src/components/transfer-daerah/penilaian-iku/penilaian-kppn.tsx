"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { ModalKppn } from "./modal-kppn";

interface KppnData {
  kdkppn: string;
  nmkppn: string;
}

export interface KirimKppnItem {
  kdkppn: string;
  nmkppn: string;
  periode: string;
  thang: string;
}

export type DataKirimKppn = [KirimKppnItem];

interface PenilaianKppnProps {
  role: string;
  username: string;
  kdkppn: string;
}

export function PenilaianKppn({
  role,
  username,
  kdkppn: kdkppnUser,
}: PenilaianKppnProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KppnData[]>([]);
  const [open, setOpen] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedPeriod, setSelectedPeriod] = useState("I");
  const [datakirim, setDataKirim] = useState<DataKirimKppn | null>(null);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedPeriod]);

  const handleModal = (kdkppn: string, nmkppn: string, periode: string) => {
    setShowModal(true);
    setOpen("1");
    setDataKirim([{ kdkppn, nmkppn, periode, thang: selectedYear }]);
  };

  const handleClose = () => {
    setShowModal(false);
    setOpen("");
    getData();
  };

  const getData = async () => {
    setLoading(true);
    const kppnFilter =
      role === "3"
        ? `WHERE a.kdkppn = '${kdkppnUser}' AND c.kddept='999'`
        : `WHERE c.kddept='999'`;

    const sql = `
      SELECT a.kdkppn, a.nmkppn
      FROM dbref.t_kppn_2024 a
      LEFT JOIN tkd.iku_lk_kppn b ON a.kdkppn = b.kdkppn
        AND b.thang='${selectedYear}' AND b.periode='${selectedPeriod}'
      ORDER BY a.kdkppn
    `;
    const cleanedQuery = sql.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const encryptedQuery = btoa(encodeURIComponent(cleanedQuery));
    try {
      const response = await http.get(
        apiPath(`/transfer-daerah/iku/referensi/${encryptedQuery}`),
        { params: { user: username } },
      );
      setData(response.data?.result ?? []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(
        err?.response?.data?.error ??
          "Terjadi Permasalahan Koneksi atau Server Backend",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap gap-4 p-4">
        <div className="flex-1 min-w-40">
          <Label htmlFor="yearSelectKppn">Tahun:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger id="yearSelectKppn" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-40">
          <Label htmlFor="periodSelectKppn">Jenis Laporan:</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger id="periodSelectKppn" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">LK Audited</SelectItem>
              <SelectItem value="II">LK Unaudited</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CardContent className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="align-middle">No</TableHead>
                  <TableHead className="align-middle">Tahun</TableHead>
                  <TableHead className="align-middle">KPPN</TableHead>
                  <TableHead className="align-middle">Jenis Laporan</TableHead>
                  <TableHead className="align-middle">ANALISA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{selectedYear}</TableCell>
                    <TableCell>
                      {row.kdkppn} - {row.nmkppn}
                    </TableCell>
                    <TableCell>{selectedPeriod}</TableCell>
                    <TableCell>
                      <CheckCircle
                        className="h-4 w-4 text-red-500 cursor-pointer"
                        onClick={() =>
                          handleModal(row.kdkppn, row.nmkppn, selectedPeriod)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {open === "1" && datakirim && (
        <ModalKppn
          open={showModal}
          onOpenChange={(v) => {
            if (!v) handleClose();
          }}
          username={username}
          kirim={datakirim}
        />
      )}
    </Card>
  );
}
