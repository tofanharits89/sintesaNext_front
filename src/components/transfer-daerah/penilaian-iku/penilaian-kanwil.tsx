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
import { ModalKanwil } from "./modal-kanwil";

interface KanwilData {
  kdkanwil: string;
  nmkanwil: string;
  kdlokasi?: string;
  ringkasan1?: number | null;
  penyusunan1?: number | null;
  metode1?: number | null;
  kualitasdd1?: number | null;
  kualitasdf1?: number | null;
  kualitasbos1?: number | null;
  kesimpulan1?: number | null;
  ket1?: string | null;
  ringkasan2?: number | null;
  penyusunan2?: number | null;
  metode2?: number | null;
  kualitasdd2?: number | null;
  kualitasdf2?: number | null;
  kualitasbos2?: number | null;
  kesimpulan2?: number | null;
  ket2?: string | null;
  total?: number | null;
}

export interface NilaiKanwil {
  ringkasan?: number | null;
  penyusunan?: number | null;
  metode?: number | null;
  kualitasdd?: number | null;
  kualitasdf?: number | null;
  kualitasbos?: number | null;
  kesimpulan?: number | null;
  ket?: string | null;
}

export interface KirimKanwilItem {
  nmkanwil: string;
  kdkanwil: string;
  analisa: string;
  thang: string;
  periode: string;
}

export type DataKirimKanwil = [KirimKanwilItem, NilaiKanwil, NilaiKanwil];

interface PenilaianKanwilProps {
  role: string;
  username: string;
}

export function PenilaianKanwil({ role, username }: PenilaianKanwilProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KanwilData[]>([]);
  const [open, setOpen] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedPeriod, setSelectedPeriod] = useState("I");
  const [datakirim, setDataKirim] = useState<DataKirimKanwil | null>(null);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedPeriod]);

  const handleModal = (
    kanwilybs: string,
    nmkanwil: string,
    analisa: string,
    ringkasanx?: number | null,
    penyusunanx?: number | null,
    metodex?: number | null,
    kualitasddx?: number | null,
    kualitasdfx?: number | null,
    kualitasbosx?: number | null,
    kesimpulanx?: number | null,
    ketx?: string | null,
    ringkasany?: number | null,
    penyusunany?: number | null,
    metodey?: number | null,
    kualitasddy?: number | null,
    kualitasdfy?: number | null,
    kualitasbosy?: number | null,
    kesimpulany?: number | null,
    kety?: string | null,
  ) => {
    setShowModal(true);
    setOpen("1");
    setDataKirim([
      {
        nmkanwil,
        kdkanwil: kanwilybs,
        analisa,
        thang: selectedYear,
        periode: selectedPeriod,
      },
      {
        ringkasan: ringkasanx ?? null,
        penyusunan: penyusunanx ?? null,
        metode: metodex ?? null,
        kualitasdd: kualitasddx ?? null,
        kualitasdf: kualitasdfx ?? null,
        kualitasbos: kualitasbosx ?? null,
        kesimpulan: kesimpulanx ?? null,
        ket: ketx ?? null,
      },
      {
        ringkasan: ringkasany ?? null,
        penyusunan: penyusunany ?? null,
        metode: metodey ?? null,
        kualitasdd: kualitasddy ?? null,
        kualitasdf: kualitasdfy ?? null,
        kualitasbos: kualitasbosy ?? null,
        kesimpulan: kesimpulany ?? null,
        ket: kety ?? null,
      },
    ]);
  };

  const handleClose = () => {
    setShowModal(false);
    setOpen("");
    getData();
  };

  const getData = async () => {
    setLoading(true);
    const sql = `
      SELECT a.kdkanwil, a.nmkanwil, a.kdlokasi,
      b.ringkasan AS ringkasan1, b.penyusunan AS penyusunan1, b.metode AS metode1,
      b.kualitasdd AS kualitasdd1, b.kualitasdf AS kualitasdf1, b.kualitasbos AS kualitasbos1,
      b.kesimpulan AS kesimpulan1, b.ket AS ket1,
      d.ringkasan AS ringkasan2, d.penyusunan AS penyusunan2, d.metode AS metode2,
      d.kualitasdd AS kualitasdd2, d.kualitasdf AS kualitasdf2, d.kualitasbos AS kualitasbos2,
      d.kesimpulan AS kesimpulan2, d.ket AS ket2,
      ROUND((COALESCE(b.hasil, 0) + COALESCE(d.hasil, 0)) / 2, 2) AS total
      FROM dbref.t_kanwil_2014 a
      LEFT JOIN tkd.iku_monev_kanwil_i b ON a.kdkanwil = b.kdkanwil AND b.thang='${selectedYear}' AND b.periode='${selectedPeriod}'
      LEFT JOIN tkd.iku_monev_kanwil_ii d ON a.kdkanwil = d.kdkanwil AND d.thang='${selectedYear}' AND d.periode='${selectedPeriod}'
      WHERE a.kdkanwil <> '00'
      GROUP BY a.kdkanwil,b.thang,d.thang,b.periode,d.periode
      ORDER BY a.kdkanwil
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
          <Label htmlFor="yearSelect">Tahun:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger id="yearSelect" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-40">
          <Label htmlFor="periodSelect">Periode:</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger id="periodSelect" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">Semester I</SelectItem>
              <SelectItem value="II">Semester II</SelectItem>
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
                  <TableHead rowSpan={2} className="align-middle">
                    No
                  </TableHead>
                  <TableHead rowSpan={2} className="align-middle">
                    Tahun
                  </TableHead>
                  <TableHead rowSpan={2} className="align-middle">
                    Periode
                  </TableHead>
                  <TableHead rowSpan={2} className="align-middle">
                    Kanwil
                  </TableHead>
                  <TableHead colSpan={3} className="text-center">
                    LAPORAN MONEV
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="align-middle">ANALISA I</TableHead>
                  <TableHead className="align-middle">ANALISA II</TableHead>
                  <TableHead className="align-middle">RATA-RATA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{selectedYear}</TableCell>
                    <TableCell>Semester {selectedPeriod}</TableCell>
                    <TableCell>
                      {row.kdkanwil} - {row.nmkanwil}
                    </TableCell>
                    <TableCell>
                      <CheckCircle
                        className="h-4 w-4 text-blue-500 cursor-pointer"
                        onClick={() =>
                          handleModal(
                            row.kdkanwil,
                            row.nmkanwil,
                            "I",
                            row.ringkasan1,
                            row.penyusunan1,
                            row.metode1,
                            row.kualitasdd1,
                            row.kualitasdf1,
                            row.kualitasbos1,
                            row.kesimpulan1,
                            row.ket1,
                            row.ringkasan2,
                            row.penyusunan2,
                            row.metode2,
                            row.kualitasdd2,
                            row.kualitasdf2,
                            row.kualitasbos2,
                            row.kesimpulan2,
                            row.ket2,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <CheckCircle
                        className="h-4 w-4 text-green-500 cursor-pointer"
                        onClick={() =>
                          handleModal(
                            row.kdkanwil,
                            row.nmkanwil,
                            "II",
                            row.ringkasan1,
                            row.penyusunan1,
                            row.metode1,
                            row.kualitasdd1,
                            row.kualitasdf1,
                            row.kualitasbos1,
                            row.kesimpulan1,
                            row.ket1,
                            row.ringkasan2,
                            row.penyusunan2,
                            row.metode2,
                            row.kualitasdd2,
                            row.kualitasdf2,
                            row.kualitasbos2,
                            row.kesimpulan2,
                            row.ket2,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="font-bold text-cyan-600">
                      {row.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {open === "1" && datakirim && (
        <ModalKanwil
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
