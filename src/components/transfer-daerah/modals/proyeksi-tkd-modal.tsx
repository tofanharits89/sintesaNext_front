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
import {
  useProyeksiTkdKppnOptions,
  useProyeksiTkdSatkerOptions,
} from "@/hooks/use-proyeksi-tkd-options";

interface ProyeksiTkdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
}

type MonthKey =
  | "januari"
  | "februari"
  | "maret"
  | "april"
  | "mei"
  | "juni"
  | "juli"
  | "agustus"
  | "september"
  | "oktober"
  | "november"
  | "desember";

type MonthlyValues = Record<MonthKey, string>;

const DEFAULT_MONTHLY_VALUES: MonthlyValues = {
  januari: "",
  februari: "",
  maret: "",
  april: "",
  mei: "",
  juni: "",
  juli: "",
  agustus: "",
  september: "",
  oktober: "",
  november: "",
  desember: "",
};
const JENIS_KEPERLUAN_OPTIONS = ["alco", "iku"];
const JENIS_LAPORAN_OPTIONS = ["01", "02", "03", "04", "05"];

const MONTH_KEYS: MonthKey[] = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

const PERIOD_ALIAS_TO_KEY: Record<string, MonthKey> = {
  januari: "januari",
  january: "januari",
  feb: "februari",
  februari: "februari",
  february: "februari",
  mar: "maret",
  maret: "maret",
  march: "maret",
  apr: "april",
  april: "april",
  mei: "mei",
  may: "mei",
  jun: "juni",
  juni: "juni",
  june: "juni",
  jul: "juli",
  juli: "juli",
  july: "juli",
  ags: "agustus",
  agu: "agustus",
  agt: "agustus",
  agustus: "agustus",
  august: "agustus",
  sep: "september",
  september: "september",
  okt: "oktober",
  october: "oktober",
  oktober: "oktober",
  nov: "november",
  november: "november",
  des: "desember",
  december: "desember",
  desember: "desember",
};

const getCurrentMonthKey = (date: Date = new Date()): MonthKey =>
  MONTH_KEYS[date.getMonth()] || "januari";

const buildDefaultForm = () => ({
  tahun: String(new Date().getFullYear()),
  kppn: "",
  kppnSebagaiSatker: "",
  periodeBulan: getCurrentMonthKey(),
  jenisKeperluan: "",
  jenisLaporan: "",
  keterangan: "",
  monthlyValues: { ...DEFAULT_MONTHLY_VALUES },
});

const normalizeCodeFromLabeledText = (value: unknown): string => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const parts = text.split(" - ").map((part) => part.trim()).filter(Boolean);
  return parts[0] || text;
};

const normalizeSatker = (value: unknown): string => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.split(" - ")[0]?.trim() || text;
};

const normalizeJenisKeperluan = (value: unknown): string => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.startsWith("alc")) return "alco";
  if (raw === "iku") return "iku";
  return raw;
};

const normalizeJenisLaporan = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const codeMatch = raw.match(/^(\d{1,2})/);
  if (codeMatch?.[1]) return codeMatch[1].padStart(2, "0");

  const lower = raw.toLowerCase();
  if (lower.includes("dau")) return "01";
  if (lower.includes("dbh")) return "02";
  if (lower.includes("dak fisik")) return "03";
  if (lower.includes("dana desa")) return "04";
  if (lower.includes("dak non fisik")) return "05";

  return raw;
};

const normalizePeriode = (value: unknown): MonthKey | "" => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();

  if (MONTH_KEYS.includes(lower as MonthKey)) {
    return lower as MonthKey;
  }
  if (PERIOD_ALIAS_TO_KEY[lower]) {
    return PERIOD_ALIAS_TO_KEY[lower];
  }

  const parsedNum = Number.parseInt(raw, 10);
  if (Number.isFinite(parsedNum) && parsedNum >= 1 && parsedNum <= 12) {
    return MONTH_KEYS[parsedNum - 1] || "";
  }

  return "";
};

const normalizeMonthlyValues = (source: any): MonthlyValues => {
  const payload = source?.monthlyValues || source || {};
  return {
    januari: String(payload.januari ?? payload.jan ?? ""),
    februari: String(payload.februari ?? payload.feb ?? ""),
    maret: String(payload.maret ?? payload.mar ?? ""),
    april: String(payload.april ?? payload.apr ?? ""),
    mei: String(payload.mei ?? ""),
    juni: String(payload.juni ?? payload.jun ?? ""),
    juli: String(payload.juli ?? payload.jul ?? ""),
    agustus: String(payload.agustus ?? payload.ags ?? ""),
    september: String(payload.september ?? payload.sep ?? ""),
    oktober: String(payload.oktober ?? payload.okt ?? ""),
    november: String(payload.november ?? payload.nov ?? ""),
    desember: String(payload.desember ?? payload.des ?? ""),
  };
};

export function ProyeksiTkdModal({
  open,
  onOpenChange,
  editData,
}: ProyeksiTkdModalProps) {
  const [formData, setFormData] = useState(buildDefaultForm);
  const { options: kppnOptions, isLoading: isKppnOptionsLoading } =
    useProyeksiTkdKppnOptions();
  const { options: satkerOptions, isLoading: isSatkerOptionsLoading } =
    useProyeksiTkdSatkerOptions(formData.kppn);

  // Pre-fill form data when editing
  useEffect(() => {
    if (!open) {
      setFormData(buildDefaultForm());
      return;
    }

    if (editData) {
      const normalizedPeriode =
        normalizePeriode(editData.periodeRaw ?? editData.periode) ||
        getCurrentMonthKey();
      const mappedData = {
        tahun: editData.tahun || String(new Date().getFullYear()),
        kppn:
          String(editData.kdkppnRaw ?? "").trim() ||
          normalizeCodeFromLabeledText(editData.kppn),
        kppnSebagaiSatker:
          String(editData.kdsatkerRaw ?? "").trim() ||
          normalizeSatker(editData.kppnSebagaiSatker),
        periodeBulan: normalizedPeriode,
        jenisKeperluan: normalizeJenisKeperluan(
          editData.keperluanRaw ?? editData.jenisKeperluan
        ),
        jenisLaporan: normalizeJenisLaporan(
          editData.jenisTkdCode ?? editData.jenisTkd
        ),
        keterangan: editData.keterangan || "",
        monthlyValues: normalizeMonthlyValues(editData),
      };
      setFormData(mappedData);
      return;
    }

    setFormData(buildDefaultForm());
  }, [editData, open]);

  const handleSubmit = () => {
    // Handle form submission
    console.log("Submitting Proyeksi TKD:", formData);
    onOpenChange(false);
    // Reset form
    resetForm();
  };

  const handleTutup = () => {
    onOpenChange(false);
    // Reset form when closing
    resetForm();
  };

  const resetForm = () => {
    setFormData(buildDefaultForm());
  };

  const handleMonthlyValueChange = (month: string, value: string) => {
    setFormData({
      ...formData,
      monthlyValues: {
        ...formData.monthlyValues,
        [month]: value,
      },
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString()
  );

  const months = [
    { key: "januari", label: "Januari" },
    { key: "februari", label: "Februari" },
    { key: "maret", label: "Maret" },
    { key: "april", label: "April" },
    { key: "mei", label: "Mei" },
    { key: "juni", label: "Juni" },
    { key: "juli", label: "Juli" },
    { key: "agustus", label: "Agustus" },
    { key: "september", label: "September" },
    { key: "oktober", label: "Oktober" },
    { key: "november", label: "November" },
    { key: "desember", label: "Desember" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {editData ? "Edit Proyeksi TKD" : "Rekam Proyeksi TKD"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 grid gap-4 py-4">
          {/* Selection Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* KPPN */}
            <div className="space-y-2">
              <Label htmlFor="kppn">KPPN</Label>
              <Select
                value={formData.kppn}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    kppn: value,
                    kppnSebagaiSatker:
                      prev.kppn === value ? prev.kppnSebagaiSatker : "",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue className="truncate" placeholder="Pilih KPPN" />
                </SelectTrigger>
                <SelectContent>
                  {kppnOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value} title={item.label}>
                      <span className="truncate">{item.label}</span>
                    </SelectItem>
                  ))}
                  {isKppnOptionsLoading && (
                    <SelectItem value="__loading_kppn" disabled>
                      Memuat data KPPN...
                    </SelectItem>
                  )}
                  {formData.kppn &&
                    !kppnOptions.some((item) => item.value === formData.kppn) && (
                    <SelectItem value={formData.kppn} title={formData.kppn}>
                      <span className="truncate">{formData.kppn}</span>
                    </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            {/* KPPN Sebagai Satker */}
            <div className="space-y-2">
              <Label htmlFor="kppnSebagaiSatker">KPPN Sebagai Satker</Label>
              <Select
                value={formData.kppnSebagaiSatker}
                onValueChange={(value) =>
                  setFormData({ ...formData, kppnSebagaiSatker: value })
                }
                disabled={!formData.kppn}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder={
                      formData.kppn ? "Pilih kode satker" : "Pilih KPPN dahulu"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {satkerOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value} title={item.label}>
                      <span className="truncate">{item.label}</span>
                    </SelectItem>
                  ))}
                  {isSatkerOptionsLoading && formData.kppn && (
                    <SelectItem value="__loading_satker" disabled>
                      Memuat data satker...
                    </SelectItem>
                  )}
                  {formData.kppnSebagaiSatker &&
                    !satkerOptions.some(
                      (item) => item.value === formData.kppnSebagaiSatker
                    ) && (
                      <SelectItem
                        value={formData.kppnSebagaiSatker}
                        title={formData.kppnSebagaiSatker}
                      >
                        <span className="truncate">{formData.kppnSebagaiSatker}</span>
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            {/* Periode Bulan */}
            <div className="space-y-2">
              <Label htmlFor="periodeBulan">Periode Bulan</Label>
              <Select
                value={formData.periodeBulan}
                onValueChange={(value) =>
                  setFormData({ ...formData, periodeBulan: value as MonthKey })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih periode bulan"
                  />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.key} value={month.key}>
                      {month.label}
                    </SelectItem>
                  ))}
                  {formData.periodeBulan &&
                    !months.some((month) => month.key === formData.periodeBulan) && (
                      <SelectItem value={formData.periodeBulan}>
                        {formData.periodeBulan}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second row of selections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jenis Keperluan */}
            <div className="space-y-2">
              <Label htmlFor="jenisKeperluan">Jenis Keperluan</Label>
              <Select
                value={formData.jenisKeperluan}
                onValueChange={(value) =>
                  setFormData({ ...formData, jenisKeperluan: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih jenis keperluan"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alco" title="ALCo">
                    <span className="truncate">ALCo</span>
                  </SelectItem>
                  <SelectItem value="iku" title="IKU">
                    <span className="truncate">IKU</span>
                  </SelectItem>
                  {formData.jenisKeperluan &&
                    !JENIS_KEPERLUAN_OPTIONS.includes(formData.jenisKeperluan) && (
                      <SelectItem
                        value={formData.jenisKeperluan}
                        title={formData.jenisKeperluan}
                      >
                        <span className="truncate">{formData.jenisKeperluan}</span>
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            {/* Jenis Laporan */}
            <div className="space-y-2">
              <Label htmlFor="jenisLaporan">Jenis Laporan</Label>
              <Select
                value={formData.jenisLaporan}
                onValueChange={(value) =>
                  setFormData({ ...formData, jenisLaporan: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    className="truncate"
                    placeholder="Pilih jenis laporan"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01" title="01 - DAU">
                    <span className="truncate">01 - DAU</span>
                  </SelectItem>
                  <SelectItem value="02" title="02 - DBH">
                    <span className="truncate">02 - DBH</span>
                  </SelectItem>
                  <SelectItem value="03" title="03 - DAK Fisik">
                    <span className="truncate">03 - DAK Fisik</span>
                  </SelectItem>
                  <SelectItem value="04" title="04 - Dana Desa">
                    <span className="truncate">04 - Dana Desa</span>
                  </SelectItem>
                  <SelectItem value="05" title="05 - DAK Non Fisik">
                    <span className="truncate">05 - DAK Non Fisik</span>
                  </SelectItem>
                  {formData.jenisLaporan &&
                    !JENIS_LAPORAN_OPTIONS.includes(formData.jenisLaporan) && (
                      <SelectItem
                        value={formData.jenisLaporan}
                        title={formData.jenisLaporan}
                      >
                        <span className="truncate">{formData.jenisLaporan}</span>
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monthly Input Fields */}
          <div className="mt-6">
            <Label className="text-base font-medium">
              Proyeksi Bulanan (dalam juta rupiah)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {months.map((month) => (
                <div key={month.key} className="space-y-2">
                  <Label htmlFor={month.key}>{month.label}</Label>
                  <Input
                    id={month.key}
                    type="number"
                    value={
                      formData.monthlyValues[
                        month.key as keyof typeof formData.monthlyValues
                      ]
                    }
                    onChange={(e) =>
                      handleMonthlyValueChange(month.key, e.target.value)
                    }
                    placeholder="0"
                    className="w-full"
                    min="0"
                    step="0.01"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div className="mt-6">
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
                placeholder="Masukkan keterangan tambahan"
                rows={4}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTutup}>
              Tutup
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white"
            >
              Simpan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
