"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useKertasKerjaDistinct } from "@/features/mbg/hooks/use-kertas-kerja";
import kanwilsData from "@/data/kdkanwil.json";
import { useAuth } from "@/hooks/useAuth";

interface PermasalahanIsuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
  onSave: () => void;
}

export function PermasalahanIsuModal({
  open,
  onOpenChange,
  data,
  onSave,
}: PermasalahanIsuModalProps) {
  const [formData, setFormData] = useState({
    tahun: "",
    kanwil: "",
    triwulan: "",
    kluster: "",
    keterangan: "",
  });
  const { user } = useAuth();
  const isRestrictedRole = user?.role === "kanwil_djpb" || user?.role === "kppn";

  const { data: distinctClustersResponse } = useKertasKerjaDistinct(
    "data_bgn.permasalahan",
    "kategori",
    formData.tahun || new Date().getFullYear().toString()
  );

  const dynamicClusters = Array.isArray(distinctClustersResponse?.data)
    ? distinctClustersResponse.data.map((item: any) => item.kategori)
    : [];

  const getValueCaseInsensitive = (item: any, targetKey: string) => {
    if (!item) return null;
    const lowerTarget = targetKey.toLowerCase();
    const actualKey = Object.keys(item).find(
      (key) => key.toLowerCase() === lowerTarget
    );
    return actualKey ? item[actualKey] : null;
  };

  useEffect(() => {
    if (data) {
      const triwulanVal = getValueCaseInsensitive(data, "triwulan") || getValueCaseInsensitive(data, "tw") || "";
      let mappedTriwulan = String(triwulanVal).trim().toUpperCase();
      
      // Map numeric values or variations to Roman numerals
      if (mappedTriwulan === "1" || mappedTriwulan === "TRIWULAN 1" || mappedTriwulan === "TW 1") mappedTriwulan = "I";
      else if (mappedTriwulan === "2" || mappedTriwulan === "TRIWULAN 2" || mappedTriwulan === "TW 2") mappedTriwulan = "II";
      else if (mappedTriwulan === "3" || mappedTriwulan === "TRIWULAN 3" || mappedTriwulan === "TW 3") mappedTriwulan = "III";
      else if (mappedTriwulan === "4" || mappedTriwulan === "TRIWULAN 4" || mappedTriwulan === "TW 4") mappedTriwulan = "IV";

      setFormData({
        tahun: getValueCaseInsensitive(data, "tahun") || "",
        kanwil: getValueCaseInsensitive(data, "kode_kanwil") || getValueCaseInsensitive(data, "kodekanwil") || "",
        triwulan: mappedTriwulan || "",
        kluster: getValueCaseInsensitive(data, "kategori") || getValueCaseInsensitive(data, "kluster") || "",
        keterangan: getValueCaseInsensitive(data, "keterangan") || "",
      });
    } else {
      setFormData({
        tahun: new Date().getFullYear().toString(),
        kanwil: "",
        triwulan: "I",
        kluster: "",
        keterangan: "",
      });

      // Auto-fill kanwil for restricted roles (Kanwil/KPPN)
      if (isRestrictedRole && user?.kdkanwil) {
        setFormData(prev => ({ ...prev, kanwil: user.kdkanwil || "" }));
      }
    }
  }, [data, open, isRestrictedRole, user?.kdkanwil]);

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Permasalahan/Isu:", formData);
    onSave();
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      tahun: "",
      kanwil: "",
      triwulan: "",
      kluster: "",
      keterangan: "",
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString()
  );

  const kanwilOptions = kanwilsData;

  const triwulanOptions = ["I", "II", "III", "IV"];

  const staticClusters = [
    "Fiskal Daerah",
    "Makrokesra",
    "Moneter",
    "Perbankan",
    "Pasar Modal",
    "Investasi",
  ];

  const klusterOptions = dynamicClusters.length > 0 ? dynamicClusters : staticClusters;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {data
              ? "Edit Data Permasalahan/Isu"
              : "Tambah Data Permasalahan/Isu"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tahun */}
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Select
                value={formData.tahun}
                onValueChange={(value) =>
                  setFormData({ ...formData, tahun: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue className="truncate" placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kanwil */}
            <div className="space-y-2">
              <Label htmlFor="kanwil">Kanwil</Label>
              <Select
                value={formData.kanwil}
                onValueChange={(value) =>
                  setFormData({ ...formData, kanwil: value })
                }
                disabled={isRestrictedRole}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih kanwil"
                  />
                </SelectTrigger>
                <SelectContent>
                  {kanwilOptions.map((kanwil: any) => (
                    <SelectItem key={kanwil.kdkanwil} value={kanwil.kdkanwil} title={kanwil.nmkanwil}>
                      <span className="truncate">{kanwil.nmkanwil}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Triwulan */}
            <div className="space-y-2">
              <Label htmlFor="triwulan">Triwulan</Label>
              <Select
                value={formData.triwulan}
                onValueChange={(value) =>
                  setFormData({ ...formData, triwulan: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih triwulan"
                  />
                </SelectTrigger>
                <SelectContent>
                  {triwulanOptions.map((triwulan) => (
                    <SelectItem key={triwulan} value={triwulan}>
                      {triwulan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kluster */}
            <div className="space-y-2">
              <Label htmlFor="kluster">Kluster</Label>
              <Select
                value={formData.kluster}
                onValueChange={(value) =>
                  setFormData({ ...formData, kluster: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih kluster"
                  />
                </SelectTrigger>
                <SelectContent>
                  {klusterOptions.map((kluster: any) => (
                    <SelectItem key={kluster} value={kluster} title={kluster}>
                      <span className="truncate">{kluster}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-2 mt-6">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              placeholder="Masukkan keterangan permasalahan/isu"
              className="w-full min-h-[120px]"
            />
          </div>
        </div>
      </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white"
          >
            {data ? "Update" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
