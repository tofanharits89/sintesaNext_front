"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import kppnData from "@/data/kdkppn.json";
import kabkotaData from "@/data/kdlokasi.json";

interface RekamDataTransaksiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

export function RekamDataTransaksiModal({
  open,
  onOpenChange,
  data,
}: RekamDataTransaksiModalProps) {
  const [formData, setFormData] = useState({
    tahun: data?.tahun || "",
    bulan: data?.bulan || "",
    kppn: data?.kppn || "",
    kabkota: data?.kabkota || "",
    tanggalTransaksi: undefined as Date | undefined,
    nomorTransaksi: "",
    nilaiTransaksi: "",
    jenisTransaksi: "",
    keterangan: "",
    buktiTransaksi: null as File | null,
  });

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Rekam Data Transaksi:", formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      tahun: "",
      bulan: "",
      kppn: "",
      kabkota: "",
      tanggalTransaksi: undefined,
      nomorTransaksi: "",
      nilaiTransaksi: "",
      jenisTransaksi: "",
      keterangan: "",
      buktiTransaksi: null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, buktiTransaksi: file });
  };

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const jenisTransaksiOptions = [
    "Transfer Dana",
    "Pemotongan Pajak",
    "Penyesuaian Alokasi",
    "Pengembalian Dana",
    "Lain-lain",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rekam Data Transaksi</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Input
                id="tahun"
                value={formData.tahun}
                onChange={(e) =>
                  setFormData({ ...formData, tahun: e.target.value })
                }
                placeholder="Tahun"
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulan">Bulan</Label>
              <Select
                value={formData.bulan}
                onValueChange={(value) =>
                  setFormData({ ...formData, bulan: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kppn">KPPN</Label>
              <Select
                value={formData.kppn}
                onValueChange={(value) =>
                  setFormData({ ...formData, kppn: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih KPPN" />
                </SelectTrigger>
                <SelectContent>
                  {kppnData.map((kppn) => (
                    <SelectItem
                      key={kppn.kdkppn}
                      value={kppn.nmkppn}
                      title={kppn.nmkppn}
                    >
                      <span className="truncate">{kppn.nmkppn}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kabkota">Kab/Kota</Label>
              <Select
                value={formData.kabkota}
                onValueChange={(value) =>
                  setFormData({ ...formData, kabkota: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kab/Kota" />
                </SelectTrigger>
                <SelectContent>
                  {kabkotaData.map((lokasi) => (
                    <SelectItem
                      key={lokasi.kdlokasi}
                      value={lokasi.nmlokasi}
                      title={lokasi.nmlokasi}
                    >
                      <span className="truncate">{lokasi.nmlokasi}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Transaksi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.tanggalTransaksi && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.tanggalTransaksi
                      ? format(formData.tanggalTransaksi, "dd/MM/yyyy")
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.tanggalTransaksi}
                    onSelect={(date) =>
                      setFormData({ ...formData, tanggalTransaksi: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomorTransaksi">Nomor Transaksi</Label>
              <Input
                id="nomorTransaksi"
                value={formData.nomorTransaksi}
                onChange={(e) =>
                  setFormData({ ...formData, nomorTransaksi: e.target.value })
                }
                placeholder="Masukkan nomor transaksi"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nilaiTransaksi">Nilai Transaksi</Label>
              <Input
                id="nilaiTransaksi"
                type="number"
                value={formData.nilaiTransaksi}
                onChange={(e) =>
                  setFormData({ ...formData, nilaiTransaksi: e.target.value })
                }
                placeholder="Masukkan nilai transaksi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenisTransaksi">Jenis Transaksi</Label>
              <Select
                value={formData.jenisTransaksi}
                onValueChange={(value) =>
                  setFormData({ ...formData, jenisTransaksi: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis transaksi" />
                </SelectTrigger>
                <SelectContent>
                  {jenisTransaksiOptions.map((jenis) => (
                    <SelectItem key={jenis} value={jenis}>
                      {jenis}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              placeholder="Masukkan keterangan transaksi"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buktiTransaksi">Bukti Transaksi</Label>
            <Input
              id="buktiTransaksi"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {formData.buktiTransaksi && (
              <p className="text-sm text-muted-foreground">
                File terpilih: {formData.buktiTransaksi.name}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>Simpan Transaksi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
